// ─────────────────────────────────────────────────────────────────
// AlignCV — AI Router (Multi-Provider, Multi-Key Round Robin)
// Distributes AI calls across Groq, Cerebras, Google AI Studio
// with automatic key rotation and provider fallback on 429s.
// ─────────────────────────────────────────────────────────────────

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const logger = require('../utils/logger');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Provider Configurations ─────────────────────────────────────
const PROVIDERS = {
  groq: {
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
    keys: [],
    cooldowns: {},        // { keyIndex: cooldownUntilTimestamp }
    currentKeyIndex: 0,
    supportsJsonMode: true,
  },
  cerebras: {
    name: 'Cerebras',
    baseUrl: 'https://api.cerebras.ai/v1',
    model: 'llama3.1-8b',
    keys: [],
    cooldowns: {},
    currentKeyIndex: 0,
    supportsJsonMode: true,
  },
  google: {
    name: 'Google AI Studio',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-2.0-flash',
    keys: [],
    cooldowns: {},
    currentKeyIndex: 0,
    supportsJsonMode: false, // Gemini via OpenAI compat may not always support response_format
  },
  cloudflare: {
    name: 'Cloudflare',
    baseUrl: process.env.CLOUDFLARE_ACCOUNT_ID ? `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/v1` : null,
    model: '@cf/meta/llama-3.1-8b-instruct',
    keys: [],
    cooldowns: {},
    currentKeyIndex: 0,
    supportsJsonMode: false, // CF workers AI doesn't formally support response_format in all models
  },
};

// ── Task → Provider Priority Map ────────────────────────────────
// Each task type gets a preferred order of providers to try
const TASK_ROUTES = {
  parse_resume_pdf:   ['groq', 'cloudflare', 'cerebras', 'google'],
  analyse_jd:         ['cloudflare', 'cerebras', 'google', 'groq'],
  score_and_rank:     ['cloudflare', 'cerebras', 'google', 'groq'],
  rewrite_bullets:    ['cloudflare', 'cerebras', 'google', 'groq'],
  detect_skill_gaps:  ['cloudflare', 'cerebras', 'google', 'groq'],
  ats_score:          ['cloudflare', 'cerebras', 'google', 'groq'],
  chat_edit:          ['cloudflare', 'cerebras', 'google', 'groq'],
  omnisearch_extract: ['cloudflare', 'cerebras', 'google', 'groq'],
  omnisearch_match:   ['cloudflare', 'cerebras', 'google', 'groq'],
};

// ── Initialize Keys from Environment ────────────────────────────
function initializeKeys() {
  const parseKeys = (envVar) => {
    const raw = process.env[envVar] || '';
    return raw.split(',').map(k => k.trim()).filter(Boolean);
  };

  PROVIDERS.groq.keys = parseKeys('GROQ_API_KEYS');
  PROVIDERS.cerebras.keys = parseKeys('CEREBRAS_API_KEYS');
  PROVIDERS.google.keys = parseKeys('GOOGLE_AI_KEYS');
  PROVIDERS.cloudflare.keys = parseKeys('CLOUDFLARE_API_TOKEN');

  // Fallback: if no multi-keys defined, use legacy single key
  if (PROVIDERS.groq.keys.length === 0 && process.env.NIM_API_KEY) {
    PROVIDERS.groq.keys = [process.env.NIM_API_KEY];
  }

  const totalKeys = PROVIDERS.groq.keys.length + PROVIDERS.cerebras.keys.length + PROVIDERS.google.keys.length + PROVIDERS.cloudflare.keys.length;
  logger.info(`[AIRouter] Initialized with ${totalKeys} keys: Groq(${PROVIDERS.groq.keys.length}), Cerebras(${PROVIDERS.cerebras.keys.length}), Google(${PROVIDERS.google.keys.length}), Cloudflare(${PROVIDERS.cloudflare.keys.length})`);
}

// Call once at module load
initializeKeys();

// ── Get Next Available Key for a Provider ────────────────────────
function getAvailableKey(providerId) {
  const provider = PROVIDERS[providerId];
  if (!provider || provider.keys.length === 0) return null;

  const now = Date.now();
  const keyCount = provider.keys.length;

  // Try each key starting from current index
  for (let i = 0; i < keyCount; i++) {
    const idx = (provider.currentKeyIndex + i) % keyCount;
    const cooldownUntil = provider.cooldowns[idx] || 0;

    if (now >= cooldownUntil) {
      provider.currentKeyIndex = (idx + 1) % keyCount; // advance for next call
      return { key: provider.keys[idx], index: idx };
    }
  }

  return null; // All keys are cooling down
}

// ── Mark a Key as Rate-Limited ───────────────────────────────────
function markKeyCooldown(providerId, keyIndex, cooldownMs) {
  const provider = PROVIDERS[providerId];
  if (!provider) return;
  provider.cooldowns[keyIndex] = Date.now() + cooldownMs;
  logger.warn(`[AIRouter] ${provider.name} key #${keyIndex + 1} rate-limited for ${Math.round(cooldownMs / 1000)}s`);
}

// ── Deep JSON Extractor ──────────────────────────────────────────
function extractJSON(raw) {
  let str = raw.trim();
  if (str.startsWith('```json')) str = str.slice(7);
  else if (str.startsWith('```')) str = str.slice(3);
  if (str.endsWith('```')) str = str.slice(0, -3);
  str = str.trim();

  try { return JSON.parse(str); } catch (_) {}

  // Find first balanced { ... } or [ ... ]
  const startChar = str.indexOf('{') <= str.indexOf('[') && str.indexOf('{') !== -1
    ? '{' : (str.indexOf('[') !== -1 ? '[' : null);
  if (startChar) {
    const endChar = startChar === '{' ? '}' : ']';
    let depth = 0, start = str.indexOf(startChar);
    for (let i = start; i < str.length; i++) {
      if (str[i] === startChar) depth++;
      if (str[i] === endChar) depth--;
      if (depth === 0) {
        try { return JSON.parse(str.slice(start, i + 1)); } catch (_) { break; }
      }
    }
  }
  return null;
}

// ── Core Call: Route a request through providers ─────────────────
async function routedCall({ label, systemPrompt, userContent, messages, expectJson = true, timeoutMs = 30000 }) {
  const providerOrder = TASK_ROUTES[label] || ['groq', 'cerebras', 'google'];
  let lastError;

  for (const providerId of providerOrder) {
    const provider = PROVIDERS[providerId];
    if (provider.keys.length === 0) continue;

    // Try up to 2 keys per provider before moving to next provider
    for (let keyAttempt = 0; keyAttempt < Math.min(provider.keys.length, 2); keyAttempt++) {
      const keyInfo = getAvailableKey(providerId);
      if (!keyInfo) {
        logger.debug(`[AIRouter] All ${provider.name} keys cooling down, trying next provider`);
        break;
      }

      try {
        const result = await singleCall({
          providerId,
          provider,
          apiKey: keyInfo.key,
          keyIndex: keyInfo.index,
          label,
          systemPrompt,
          userContent,
          messages,
          expectJson,
          timeoutMs,
        });
        return result;
      } catch (err) {
        lastError = err;
        if (err.isRateLimit) {
          // Key is already marked as cooling, try next key/provider
          continue;
        }
        // Non-rate-limit error, try next provider entirely
        logger.warn(`[AIRouter] ${provider.name} failed for ${label}: ${err.message}`);
        break;
      }
    }
  }

  logger.error(`[AIRouter] ALL providers exhausted for ${label}: ${lastError?.message}`);
  throw lastError || new Error(`All AI providers failed for ${label}`);
}

// ── Single API Call ──────────────────────────────────────────────
async function singleCall({ providerId, provider, apiKey, keyIndex, label, systemPrompt, userContent, messages: customMessages, expectJson, timeoutMs }) {
  const finalMessages = customMessages || [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent },
  ];

  const body = {
    model: provider.model,
    messages: finalMessages,
    temperature: 0.2,
    max_tokens: 4096,
  };

  if (expectJson && provider.supportsJsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const keyLabel = `${provider.name}#${keyIndex + 1}`;
  logger.debug(`[AIRouter] ${label} → ${keyLabel}`);

  try {
    const res = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // Handle 429 Rate Limit
    if (res.status === 429) {
      const errText = await res.text();
      const waitMatch = errText.match(/try again in (\d+\.?\d*)/i);
      const cooldownMs = waitMatch ? (parseFloat(waitMatch[1]) + 2) * 1000 : 60000;
      markKeyCooldown(providerId, keyIndex, cooldownMs);
      const err = new Error(`Rate limited on ${keyLabel}`);
      err.isRateLimit = true;
      throw err;
    }

    if (!res.ok) {
      const errText = await res.text();
      logger.error(`[AIRouter] HTTP ${res.status} from ${keyLabel}: ${errText.slice(0, 200)}`);
      throw new Error(`API error ${res.status} from ${keyLabel}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error(`${keyLabel} returned empty content`);
    }

    logger.info(`[AIRouter] ✓ ${label} completed via ${keyLabel}`);

    if (expectJson) {
      const parsed = extractJSON(content);
      if (parsed) return parsed;
      logger.error(`[AIRouter] JSON extraction failed from ${keyLabel} for ${label}:\n${content.slice(0, 300)}`);
      throw new Error(`Invalid JSON from ${keyLabel}`);
    }

    return content;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

// ── Public API ──────────────────────────────────────────────────
module.exports = { routedCall, extractJSON };
