// ─────────────────────────────────────────────────────────────────
// AlignCV — AuthPage.jsx
// Opening animation (typewriter + neural canvas + 3D card flip)
// then login / signup form on the back face.
// Self-contained: all styles embedded, no external animation libs.
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../store/authStore';

/* ────────────────────── helpers ────────────────────── */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ────────────────────── ghost card positions ────────────────────── */
const GHOST_CARDS = [
  { top: '7%', left: '2%', right: 'auto', rotate: 0 },
  { top: '4%', left: '20%', right: 'auto', rotate: 0 },
  { top: '58%', left: '4%', right: 'auto', rotate: -5 },
  { top: '72%', left: '18%', right: 'auto', rotate: 3 },
  { top: '7%', right: '2%', left: 'auto', rotate: 0 },
  { top: '4%', right: '20%', left: 'auto', rotate: 0 },
  { top: '62%', right: '3%', left: 'auto', rotate: 5 },
  { top: '74%', right: '18%', left: 'auto', rotate: -3 },
];

/* ────────────────────── component ────────────────────── */
export default function AuthPage() {
  /* ── auth state (same as original) ── */
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ name: '', passcode: '', confirmPasscode: '' });

  /* ── refs for animation (no re-renders) ── */
  const sceneRef = useRef(null);
  const canvasRef = useRef(null);
  const frontRef = useRef(null);
  const cardWrapperRef = useRef(null);
  const scanBarRef = useRef(null);
  const ghostsRef = useRef([]);
  const nameInputRef = useRef(null);
  const nodesRef = useRef([]);
  const pulsesRef = useRef([]);
  const animFrameRef = useRef(null);
  const canvasFadedIn = useRef(false);
  const magneticShellRef = useRef(null);
  const magneticActiveRef = useRef(false);

  /* ── refs for idle effects ── */
  const passcodeInputRef = useRef(null);
  const aiMessageRef = useRef(null);
  const btnRef = useRef(null);
  const attackAnimRef = useRef(null);
  const effectTimers = useRef([]);
  const idleIntervalRef = useRef(null);
  const idleSeconds = useRef(0);
  const effect1Active = useRef(false);
  const effect2Active = useRef(false);
  const idleActiveRef = useRef(false);
  const ghostRotations = useRef(GHOST_CARDS.map(c => c.rotate));

  /* ── auth handlers ── */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    else if (activeTab === 'signup' && form.name.trim().length < 2) errs.name = 'At least 2 characters';
    if (!form.passcode) errs.passcode = 'Passcode is required';
    else if (form.passcode.length < 4) errs.passcode = 'At least 4 characters';
    if (activeTab === 'signup' && form.passcode !== form.confirmPasscode)
      errs.confirmPasscode = 'Passcodes do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = activeTab === 'signup'
        ? await authApi.signup(form.name.trim(), form.passcode)
        : await authApi.login(form.name.trim(), form.passcode);
      const { user, token } = res.data.data;
      setAuth(user, token);
      toast.success(activeTab === 'signup' ? 'Welcome to AlignCV!' : 'Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.error || 'Something went wrong';
      toast.error(message);
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (tab) => {
    handleUserInteraction();
    setActiveTab(tab);
    setErrors({});
    setForm({ name: '', passcode: '', confirmPasscode: '' });
  };

  /* ────────────────────── IDLE EFFECTS ────────────────────── */
  const resetAllEffects = useCallback(() => {
    /* 1. Cancel drift animation */
    if (attackAnimRef.current) { cancelAnimationFrame(attackAnimRef.current); attackAnimRef.current = null; }
    /* 2. Reset ghost cards */
    for (let i = 0; i < ghostsRef.current.length; i++) {
      const g = ghostsRef.current[i];
      if (!g) continue;
      const origRot = ghostRotations.current[i] || 0;
      g.style.transition = 'transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.6s ease';
      g.style.transform = origRot ? `rotate(${origRot}deg)` : 'none';
      g.style.opacity = '1';
      const gt = setTimeout(() => { if (g) g.style.transition = ''; }, 600);
      effectTimers.current.push(gt);
    }
    /* 3. Clear all pending timeouts */
    for (const t of effectTimers.current) clearTimeout(t);
    effectTimers.current = [];
    /* 4. Hide ai-message */
    if (aiMessageRef.current) {
      aiMessageRef.current.style.opacity = '0';
      aiMessageRef.current.style.visibility = 'hidden';
      aiMessageRef.current.textContent = '';
    }
    /* 5. Clear fake-typed input values */
    if (nameInputRef.current) {
      nameInputRef.current.value = '';
      nameInputRef.current.style.borderColor = '';
      nameInputRef.current.style.boxShadow = '';
    }
    if (passcodeInputRef.current) {
      passcodeInputRef.current.value = '';
      passcodeInputRef.current.style.borderColor = '';
      passcodeInputRef.current.style.boxShadow = '';
    }
    /* 6. Remove btn-pulse */
    if (btnRef.current) btnRef.current.classList.remove('btn-pulse');
    /* 7. Reset card glow */
    if (magneticShellRef.current) {
      magneticShellRef.current.style.boxShadow = '';
      magneticShellRef.current.style.border = '';
    }
    /* 8. Reset flags and timer */
    idleSeconds.current = 0;
    effect1Active.current = false;
    effect2Active.current = false;
  }, []);

  const handleUserInteraction = useCallback(() => {
    if (!idleActiveRef.current) return;
    resetAllEffects();
  }, [resetAllEffects]);

  const startCardAttack = useCallback(() => {
    effect1Active.current = true;
    const ghosts = ghostsRef.current;
    const startTime = performance.now();
    const duration = 8000;
    const targetX = window.innerWidth / 2;
    const targetY = window.innerHeight / 2;
    /* compute start centers and random rotations */
    const starts = [];
    const randRots = [];
    for (let i = 0; i < ghosts.length; i++) {
      const g = ghosts[i];
      if (!g) { starts.push({ x: 0, y: 0 }); randRots.push(0); continue; }
      const r = g.getBoundingClientRect();
      starts.push({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      randRots.push((Math.random() > 0.5 ? 1 : -1) * (15 + Math.random() * 10));
    }
    const drift = (now) => {
      const elapsed = now - startTime;
      const rawT = Math.min(elapsed / duration, 1);
      const t = rawT * rawT; /* ease-in */
      for (let i = 0; i < ghosts.length; i++) {
        const g = ghosts[i];
        if (!g) continue;
        const dx = targetX - starts[i].x;
        const dy = targetY - starts[i].y;
        const origRot = ghostRotations.current[i] || 0;
        const rot = origRot + randRots[i] * t;
        g.style.transition = 'none';
        g.style.transform = `translateX(${dx * t}px) translateY(${dy * t}px) rotate(${rot}deg)`;
        /* keep original opacity — no change */
      }
      if (rawT < 1) { attackAnimRef.current = requestAnimationFrame(drift); }
    };
    attackAnimRef.current = requestAnimationFrame(drift);
  }, []);

  const slamGhosts = useCallback(() => {
    const ghosts = ghostsRef.current;
    const targetX = window.innerWidth / 2;
    const targetY = window.innerHeight / 2;
    for (let i = 0; i < ghosts.length; i++) {
      const g = ghosts[i];
      if (!g) continue;
      const r = g.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = targetX - cx;
      const dy = targetY - cy;
      const cur = g.style.transform || '';
      const curTx = parseFloat((cur.match(/translateX\(([^)]+)\)/) || [, '0'])[1]);
      const curTy = parseFloat((cur.match(/translateY\(([^)]+)\)/) || [, '0'])[1]);
      g.style.transition = 'transform 0.2s ease-in';
      g.style.transform = `translateX(${curTx + dx}px) translateY(${curTy + dy}px) rotate(0deg)`;
    }
    /* flash the card */
    const shell = magneticShellRef.current;
    if (shell) {
      shell.style.boxShadow = '0 0 60px 20px rgba(239,68,68,0.9)';
      shell.style.border = '1px solid rgba(248,113,113,1)';
      const t1 = setTimeout(() => {
        shell.style.transition = 'box-shadow 0.4s ease, border 0.4s ease';
        shell.style.boxShadow = 'none';
        shell.style.border = '';
        const t1b = setTimeout(() => { shell.style.transition = ''; }, 400);
        effectTimers.current.push(t1b);
      }, 300);
      effectTimers.current.push(t1);
    }
    /* after 700ms reset everything */
    const t2 = setTimeout(() => {
      for (let i = 0; i < ghosts.length; i++) {
        const g = ghosts[i];
        if (!g) continue;
        const origRot = ghostRotations.current[i] || 0;
        g.style.transition = 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.8s ease';
        g.style.transform = origRot ? `rotate(${origRot}deg)` : 'none';
        g.style.opacity = '1';
        const gt = setTimeout(() => { if (g) g.style.transition = ''; }, 800);
        effectTimers.current.push(gt);
      }
      effect1Active.current = false;
    }, 700);
    effectTimers.current.push(t2);
  }, []);

  const startAIFill = useCallback(() => {
    effect2Active.current = true;
    /* slam ghosts into center */
    if (attackAnimRef.current) { cancelAnimationFrame(attackAnimRef.current); attackAnimRef.current = null; }
    slamGhosts();
    /* STEP 1: Show ai-message */
    const msg = aiMessageRef.current;
    if (!msg) return;
    msg.style.visibility = 'visible';
    msg.style.opacity = '1';
    msg.textContent = '';
    const msgText = 'Shall I just log you in...?';
    let charIdx = 0;
    const typeMsg = () => {
      if (charIdx < msgText.length) {
        msg.textContent += msgText[charIdx];
        charIdx++;
        const tm = setTimeout(typeMsg, 35);
        effectTimers.current.push(tm);
      } else {
        /* STEP 2: Type name */
        const t3 = setTimeout(() => {
          const ni = nameInputRef.current;
          if (ni) {
            ni.style.transition = '0.3s';
            ni.style.borderColor = 'rgba(99,102,241,0.7)';
            ni.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)';
          }
          const fakeName = 'Alex Johnson';
          let nIdx = 0;
          const typeName = () => {
            if (nIdx < fakeName.length && ni) {
              ni.value += fakeName[nIdx];
              nIdx++;
              const delay = 80 + (Math.random() - 0.5) * 40;
              const tn = setTimeout(typeName, delay);
              effectTimers.current.push(tn);
            } else {
              /* STEP 3: Move to passcode */
              const t4 = setTimeout(() => {
                if (ni) { ni.style.borderColor = ''; ni.style.boxShadow = ''; ni.style.transition = ''; }
                const pi = passcodeInputRef.current;
                if (pi) {
                  pi.style.transition = '0.3s';
                  pi.style.borderColor = 'rgba(99,102,241,0.7)';
                  pi.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)';
                }
                const t5 = setTimeout(() => {
                  let pIdx = 0;
                  const typePass = () => {
                    if (pIdx < 8 && pi) {
                      pi.value += '\u2022';
                      pIdx++;
                      const tp = setTimeout(typePass, 90);
                      effectTimers.current.push(tp);
                    } else {
                      /* STEP 4: Button pulse */
                      const t6 = setTimeout(() => {
                        if (pi) { pi.style.borderColor = ''; pi.style.boxShadow = ''; pi.style.transition = ''; }
                        if (btnRef.current) btnRef.current.classList.add('btn-pulse');
                        /* STEP 5: Just kidding */
                        const t7 = setTimeout(() => {
                          if (btnRef.current) btnRef.current.classList.remove('btn-pulse');
                          if (msg) {
                            msg.textContent = 'Just kidding. Your turn. \uD83D\uDE04';
                            msg.style.color = 'rgba(99,102,241,0.9)';
                          }
                          const t8 = setTimeout(() => {
                            resetAllEffects();
                            if (msg) msg.style.color = '';
                          }, 1200);
                          effectTimers.current.push(t8);
                        }, 1800);
                        effectTimers.current.push(t7);
                      }, 500);
                      effectTimers.current.push(t6);
                    }
                  };
                  typePass();
                }, 200);
                effectTimers.current.push(t5);
              }, 400);
              effectTimers.current.push(t4);
            }
          };
          typeName();
        }, 600);
        effectTimers.current.push(t3);
      }
    };
    const tmStart = setTimeout(typeMsg, 300);
    effectTimers.current.push(tmStart);
  }, [resetAllEffects, slamGhosts]);

  /* ────────────────────── NEURAL NETWORK CANVAS ────────────────────── */
  const initNodes = useCallback((w, h) => {
    const nodes = [];
    for (let i = 0; i < 24; i++) {
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        baseAlpha: 0.5,
        alpha: 0.5,
      });
    }
    nodesRef.current = nodes;
  }, []);

  const firePulse = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    pulsesRef.current.push({
      cx: canvas.width / 2,
      cy: canvas.height / 2,
      radius: 0,
      maxRadius: Math.max(canvas.width, canvas.height) * 0.8,
      speed: 4.5,
      alpha: 1,
    });
  }, []);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const nodes = nodesRef.current;
    const pulses = pulsesRef.current;

    /* update pulses */
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      p.radius += p.speed;
      p.alpha = 1 - p.radius / p.maxRadius;
      if (p.alpha <= 0) { pulses.splice(i, 1); continue; }

      /* draw pulse ring */
      ctx.beginPath();
      ctx.arc(p.cx, p.cy, p.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(99,102,241,${p.alpha * 0.18})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    /* move nodes */
    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;

      /* pulse brightness */
      let boost = 0;
      for (const p of pulses) {
        const d = Math.sqrt((n.x - p.cx) ** 2 + (n.y - p.cy) ** 2);
        const ring = Math.abs(d - p.radius);
        if (ring < 60) boost = Math.max(boost, (1 - ring / 60) * p.alpha);
      }
      n.alpha = n.baseAlpha + boost * 0.5;
    }

    /* draw edges */
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140) {
          let lineAlpha = 0.12 * (1 - dist / 140);
          /* pulse boost */
          for (const p of pulses) {
            const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
            const md = Math.sqrt((mx - p.cx) ** 2 + (my - p.cy) ** 2);
            const ring = Math.abs(md - p.radius);
            if (ring < 60) lineAlpha += (1 - ring / 60) * p.alpha * 0.25;
          }
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(99,102,241,${Math.min(lineAlpha, 0.6)})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
    }

    /* draw nodes */
    for (const n of nodes) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, 1.5, 0, Math.PI * 2);
      const bright = Math.min(n.alpha, 1);
      const r = Math.round(99 + (255 - 99) * (bright - 0.5) * 2);
      const g = Math.round(102 + (255 - 102) * (bright - 0.5) * 2);
      const b = Math.round(241 + (255 - 241) * (bright - 0.5) * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${bright})`;
      ctx.fill();
    }

    animFrameRef.current = requestAnimationFrame(renderCanvas);
  }, []);

  /* ────────────────────── TYPEWRITER HELPERS ────────────────────── */
  const typeText = async (el, text, interval = 20) => {
    el.innerHTML = ''; // Clear existing content to prevent double-typing
    const cursor = document.createElement('span');
    cursor.className = 'acv-cursor';
    el.appendChild(cursor);
    for (let i = 0; i < text.length; i++) {
      const span = document.createElement('span');
      span.textContent = text[i];
      el.insertBefore(span, cursor);
      await sleep(interval);
    }
    cursor.remove();
  };

  /* ────────────────────── ANIMATION SEQUENCE ────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    const scene = sceneRef.current;
    if (!canvas || !scene) return;

    /* size canvas */
    const resize = () => {
      canvas.width = scene.offsetWidth;
      canvas.height = scene.offsetHeight;
      if (nodesRef.current.length === 0) initNodes(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    /* start render loop immediately (canvas starts invisible via opacity) */
    animFrameRef.current = requestAnimationFrame(renderCanvas);

    /* run the animation sequence */
    (async () => {
      const front = frontRef.current;
      if (!front) return;

      /* ── FADE IN CANVAS ── */
      await sleep(300);
      canvas.style.transition = 'opacity 1s ease';
      canvas.style.opacity = '1';
      canvasFadedIn.current = true;
      await sleep(400);
      firePulse();
      await sleep(600);

      /* ── STEP 1: Type logo ── */
      const logoEl = front.querySelector('.acv-logo');
      if (logoEl) {
        await typeText(logoEl, 'ALIGNCV', 55);
        await sleep(150);
        logoEl.innerHTML = '<span style="color:#818cf8">ALIGN</span><span style="color:#e8eaf6">CV</span>';
        firePulse();
        await sleep(300);
      }

      /* ── STEP 2: Tagline ── */
      const tagEl = front.querySelector('.acv-tagline');
      if (tagEl) {
        tagEl.style.opacity = '1';
        await typeText(tagEl, 'ai-powered · est. 2026 · cursor-first resume engine', 22);
        firePulse();
        await sleep(300);
      }

      /* helper: render a whole section */
      const renderSection = async (sectionClass, label, lines) => {
        /* divider */
        const divider = front.querySelector(`.${sectionClass} .acv-divider`);
        if (divider) { divider.style.opacity = '1'; }
        await sleep(200);

        /* section container */
        const sec = front.querySelector(`.${sectionClass}`);
        if (sec) sec.style.opacity = '1';
        await sleep(100);

        /* type lines */
        const lineEls = front.querySelectorAll(`.${sectionClass} .acv-line`);
        for (const lineEl of lineEls) {
          lineEl.style.opacity = '1';
          const target = lineEl.querySelector('.acv-type-target');
          if (target) {
            const textContent = target.getAttribute('data-text');
            await typeText(target, textContent, 20);
            firePulse();
            await sleep(150);
          }
        }
      };

      /* ── STEP 3: WHAT WE DO ── */
      await renderSection('acv-s1', 'WHAT WE DO', []);
      await sleep(200);

      /* ── STEP 4: HOW IT WORKS ── */
      await renderSection('acv-s2', 'HOW IT WORKS', []);
      await sleep(200);

      /* ── STEP 5: BUILT FOR ── */
      await renderSection('acv-s3', 'BUILT FOR', []);
      await sleep(200);

      /* ── STEP 6: INIT LINE ── */
      const initDivider = front.querySelector('.acv-init .acv-divider');
      if (initDivider) initDivider.style.opacity = '1';
      await sleep(100);
      const initEl = front.querySelector('.acv-init-text');
      if (initEl) {
        initEl.style.opacity = '1';
        await typeText(initEl, '[ INITIALISING YOUR SESSION... ]', 35);
        /* flash */
        for (let i = 0; i < 2; i++) {
          initEl.style.opacity = '0.2'; await sleep(160);
          initEl.style.opacity = '1'; await sleep(160);
        }
        initEl.textContent = '[ SESSION READY ]';
        await sleep(280);
      }

      /* ── STEP 7: SCAN SWEEP ── */
      const scanBar = scanBarRef.current;
      if (scanBar) {
        scanBar.style.opacity = '1';
        scanBar.style.top = '105%';
        firePulse();
        await sleep(1050);
      }

      /* ── STEP 8: GHOST CARDS ── */
      for (let i = 0; i < ghostsRef.current.length; i++) {
        const g = ghostsRef.current[i];
        if (g) {
          setTimeout(() => { g.style.opacity = '1'; }, i * 100);
        }
      }
      firePulse();
      await sleep(600);

      /* ── STEP 9: FLIP ── */
      const wrapper = cardWrapperRef.current;
      if (wrapper) {
        wrapper.classList.add('acv-flipping');
        await sleep(750);
        /* vanish the card background/border */
        wrapper.classList.add('acv-vanished');
        /* activate magnetic effect after 800ms from flip start */
        setTimeout(() => { magneticActiveRef.current = true; }, 800);
        /* activate idle timer 800ms after flip */
        setTimeout(() => {
          idleActiveRef.current = true;
          idleIntervalRef.current = setInterval(() => {
            idleSeconds.current++;
            if (idleSeconds.current === 5 && !effect1Active.current) startCardAttack();
            if (idleSeconds.current === 15 && !effect2Active.current) startAIFill();
          }, 1000);
        }, 800);
        /* focus name input */
        if (nameInputRef.current) nameInputRef.current.focus();
      }
    })();

    return () => {
      window.removeEventListener('resize', resize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [initNodes, renderCanvas, firePulse]);

  /* ────────────────────── MAGNETIC EFFECT ────────────────────── */
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!magneticActiveRef.current || !magneticShellRef.current) return;
      
      const shell = magneticShellRef.current;
      const rect = shell.getBoundingClientRect();
      const cardCenterX = rect.left + rect.width / 2;
      const cardCenterY = rect.top + rect.height / 2;
      
      const dx = e.clientX - cardCenterX;
      const dy = e.clientY - cardCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= 120) {
        shell.style.transition = 'none';
        const strength = (1 - distance / 120);
        let moveX = dx * strength * 0.18;
        let moveY = dy * strength * 0.18;
        
        // Clamp to [-8, 8]
        moveX = Math.max(-8, Math.min(8, moveX));
        moveY = Math.max(-8, Math.min(8, moveY));
        
        shell.style.transform = `translateX(${moveX}px) translateY(${moveY}px)`;
      } else {
        // Spring back
        shell.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.6)';
        shell.style.transform = 'translateX(0px) translateY(0px)';
        setTimeout(() => {
          if (shell) shell.style.transition = 'none';
        }, 500);
      }
    };

    const handleMouseLeave = () => {
      if (!magneticShellRef.current) return;
      const shell = magneticShellRef.current;
      shell.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.6)';
      shell.style.transform = 'translateX(0px) translateY(0px)';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  /* ────────────────────── RENDER ────────────────────── */
  return (
    <>
      <style>{`
        /* ── Google Font ── */
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&display=swap');

        /* ── cursor blink ── */
        .acv-cursor {
          display: inline-block;
          width: 7px;
          height: 14px;
          background: rgba(148,151,255,0.85);
          margin-left: 2px;
          vertical-align: middle;
          animation: acvBlink 0.65s step-end infinite;
        }
        @keyframes acvBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        /* ── card flip ── */
        .acv-card-wrapper {
          transform-style: preserve-3d;
          transition: none;
        }
        .acv-card-wrapper.acv-flipping {
          animation: acvFlip 0.75s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes acvFlip {
          from { transform: rotateY(0deg); }
          to   { transform: rotateY(180deg); }
        }
        .acv-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 16px;
          overflow: hidden;
        }
        .acv-face-back {
          transform: rotateY(180deg);
          transition: background 1s ease, border-color 1s ease, box-shadow 1s ease;
        }

        /* ── vanish effect ── */
        .acv-card-wrapper.acv-vanished .acv-face-back {
          background: transparent !important;
          border-color: transparent !important;
          box-shadow: none !important;
          background-image: none !important;
        }

        /* ── scan bar ── */
        .acv-scan {
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          top: -4px;
          opacity: 0;
          background: linear-gradient(90deg, transparent, #6366f1, #818cf8, #6366f1, transparent);
          box-shadow: 0 0 12px 2px rgba(99,102,241,0.4);
          z-index: 10;
          transition: top 1s linear, opacity 0.15s ease;
          pointer-events: none;
        }

        /* ── ghost card ── */
        .acv-ghost {
          position: absolute;
          width: 88px;
          height: 112px;
          border-radius: 8px;
          background: rgba(99,102,241,0.06);
          border: 0.5px solid rgba(99,102,241,0.15);
          opacity: 0;
          transition: opacity 1.2s ease;
          padding: 10px 8px;
          display: flex;
          flex-direction: column;
          gap: 5px;
          pointer-events: none;
          z-index: 5;
        }
        .acv-ghost-line {
          height: 3px;
          border-radius: 2px;
          background: rgba(99,102,241,0.13);
        }

        /* ── front face internals ── */
        .acv-section { opacity: 0; transition: opacity 0.4s ease; }
        .acv-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(99,102,241,0.45), transparent);
          margin: 12px 0;
          opacity: 0;
          transition: opacity 0.5s ease;
        }
        .acv-line {
          opacity: 0;
          transition: opacity 0.2s ease;
          white-space: normal;
          word-break: break-word;
          letter-spacing: 0.3px;
        }
        .acv-tagline { opacity: 0; transition: opacity 0.3s ease; }

        /* ── back face input focus ── */
        .acv-input:focus {
          border-color: rgba(99,102,241,0.55) !important;
          outline: none;
        }
        .acv-btn:hover { opacity: 0.88; }
        .acv-link:hover { text-decoration: underline; }

        @media (max-width: 768px) {
          .acv-ghost { display: none !important; }
          .acv-scene-card {
            width: 340px !important;
            height: 500px !important;
          }
        }
        @media (max-width: 400px) {
          .acv-scene-card {
            width: 92vw !important;
            height: 500px !important;
          }
        }

        /* ── magnetic shell ── */
        .acv-magnetic-shell {
          display: block;
          will-change: transform;
          position: relative;
          z-index: 10;
        }

        /* ── idle effect: button pulse ── */
        @keyframes btnPulse {
          0%, 100% { transform: scale(1); box-shadow: none; }
          50% { transform: scale(1.04); box-shadow: 0 0 20px 6px rgba(99,102,241,0.5); }
        }
        .btn-pulse {
          animation: btnPulse 0.6s ease-in-out 3 !important;
        }

        /* ── idle effect: ai message ── */
        #ai-message {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          bottom: calc(100% + 16px);
          white-space: nowrap;
          font-family: system-ui, sans-serif;
          font-size: 12px;
          color: rgba(148,151,255,0.8);
          letter-spacing: 0.5px;
          background: rgba(10,17,38,0.85);
          border: 1px solid rgba(99,102,241,0.3);
          border-radius: 8px;
          padding: 8px 14px;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s;
          pointer-events: none;
          z-index: 100;
        }
      `}</style>

      <div
        ref={sceneRef}
        style={{
          position: 'fixed',
          inset: 0,
          background: '#070c1a',
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* ── CANVAS (neural network) ── */}
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', inset: 0, zIndex: 1, opacity: 0 }}
        />

        {/* ── GHOST CARDS ── */}
        {GHOST_CARDS.map((pos, i) => (
          <div
            key={i}
            ref={(el) => (ghostsRef.current[i] = el)}
            className="acv-ghost"
            style={{
              top: pos.top,
              left: pos.left,
              right: pos.right,
              transform: pos.rotate ? `rotate(${pos.rotate}deg)` : 'none',
            }}
          >
            <div className="acv-ghost-line" style={{ width: '70%' }} />
            <div className="acv-ghost-line" style={{ width: '100%' }} />
            <div className="acv-ghost-line" style={{ width: '85%' }} />
            <div className="acv-ghost-line" style={{ width: '60%' }} />
            <div className="acv-ghost-line" style={{ width: '90%' }} />
            <div className="acv-ghost-line" style={{ width: '45%' }} />
            <div className="acv-ghost-line" style={{ width: '75%' }} />
            <div className="acv-ghost-line" style={{ width: '55%' }} />
          </div>
        ))}

        {/* ── MAIN CARD (3D flip) ── */}
        <div style={{ perspective: '1400px', zIndex: 10 }}>
          <div ref={magneticShellRef} className="acv-magnetic-shell">
            {/* ai-message floating above card */}
            <div id="ai-message" ref={aiMessageRef}></div>
            <div
              ref={cardWrapperRef}
              className="acv-card-wrapper acv-scene-card"
              style={{ width: 440, height: 560, position: 'relative' }}
            >
            {/* ════════ FRONT FACE ════════ */}
            <div
              ref={frontRef}
              className="acv-face"
              style={{
                background: 'rgba(10,17,38,0.95)',
                border: '1px solid rgba(99,102,241,0.3)',
                padding: '28px 28px',
                fontFamily: "'IBM Plex Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                color: '#e8eaf6',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* scan bar */}
              <div ref={scanBarRef} className="acv-scan" />

              {/* logo */}
              <div
                className="acv-logo"
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  textAlign: 'center',
                  minHeight: 32,
                  marginBottom: 8,
                  letterSpacing: '2px',
                }}
              />

              {/* tagline */}
              <div
                className="acv-tagline"
                style={{
                  fontSize: 11,
                  color: 'rgba(148,151,255,0.6)',
                  letterSpacing: 1.2,
                  textAlign: 'center',
                  minHeight: 16,
                  marginBottom: 10,
                }}
              />

              {/* section 1 */}
              <div className="acv-section acv-s1">
                <div className="acv-divider" />
                <div style={{ fontSize: 10, color: 'rgba(99,102,241,0.85)', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>
                  WHAT WE DO
                </div>
                <div className="acv-line" style={{ fontSize: 12.5, color: 'rgba(200,204,255,0.78)', marginBottom: 8, display: 'flex', gap: 10, alignItems: 'flex-start', lineHeight: 1.4 }}>
                  <span style={{ color: 'rgba(99,102,241,0.7)', flexShrink: 0, marginTop: 2 }}>▸</span>
                  <span className="acv-type-target" data-text="Read any job description in under 3 seconds" style={{ flex: 1 }}></span>
                </div>
                <div className="acv-line" style={{ fontSize: 12.5, color: 'rgba(200,204,255,0.78)', marginBottom: 8, display: 'flex', gap: 10, alignItems: 'flex-start', lineHeight: 1.4 }}>
                  <span style={{ color: 'rgba(99,102,241,0.7)', flexShrink: 0, marginTop: 2 }}>▸</span>
                  <span className="acv-type-target" data-text="Match your best projects to the role automatically" style={{ flex: 1 }}></span>
                </div>
                <div className="acv-line" style={{ fontSize: 12.5, color: 'rgba(200,204,255,0.78)', marginBottom: 8, display: 'flex', gap: 10, alignItems: 'flex-start', lineHeight: 1.4 }}>
                  <span style={{ color: 'rgba(99,102,241,0.7)', flexShrink: 0, marginTop: 2 }}>▸</span>
                  <span className="acv-type-target" data-text="Generate a tailored 1-page resume instantly" style={{ flex: 1 }}></span>
                </div>
              </div>

              {/* section 2 */}
              <div className="acv-section acv-s2">
                <div className="acv-divider" />
                <div style={{ fontSize: 10, color: 'rgba(99,102,241,0.85)', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>
                  HOW IT WORKS
                </div>
                <div className="acv-line" style={{ fontSize: 12.5, color: 'rgba(200,204,255,0.78)', marginBottom: 8, display: 'flex', gap: 10, alignItems: 'flex-start', lineHeight: 1.4 }}>
                  <span style={{ color: 'rgba(99,102,241,0.7)', flexShrink: 0, marginTop: 2 }}>▸</span>
                  <span className="acv-type-target" data-text="Paste any JD → AI extracts role & skills" style={{ flex: 1 }}></span>
                </div>
                <div className="acv-line" style={{ fontSize: 12.5, color: 'rgba(200,204,255,0.78)', marginBottom: 8, display: 'flex', gap: 10, alignItems: 'flex-start', lineHeight: 1.4 }}>
                  <span style={{ color: 'rgba(99,102,241,0.7)', flexShrink: 0, marginTop: 2 }}>▸</span>
                  <span className="acv-type-target" data-text="Bullets rewritten to match JD language" style={{ flex: 1 }}></span>
                </div>
                <div className="acv-line" style={{ fontSize: 12.5, color: 'rgba(200,204,255,0.78)', marginBottom: 8, display: 'flex', gap: 10, alignItems: 'flex-start', lineHeight: 1.4 }}>
                  <span style={{ color: 'rgba(99,102,241,0.7)', flexShrink: 0, marginTop: 2 }}>▸</span>
                  <span className="acv-type-target" data-text="ATS score live · tweak with AI chat" style={{ flex: 1 }}></span>
                </div>
              </div>

              {/* section 3 */}
              <div className="acv-section acv-s3">
                <div className="acv-divider" />
                <div style={{ fontSize: 10, color: 'rgba(99,102,241,0.85)', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>
                  BUILT FOR
                </div>
                <div className="acv-line" style={{ fontSize: 12.5, color: 'rgba(200,204,255,0.78)', marginBottom: 8, display: 'flex', gap: 10, alignItems: 'flex-start', lineHeight: 1.4 }}>
                  <span style={{ color: 'rgba(99,102,241,0.7)', flexShrink: 0, marginTop: 2 }}>▸</span>
                  <span className="acv-type-target" data-text="Freshers · Students · First-time seekers" style={{ flex: 1 }}></span>
                </div>
                <div className="acv-line" style={{ fontSize: 12.5, color: 'rgba(200,204,255,0.78)', marginBottom: 8, display: 'flex', gap: 10, alignItems: 'flex-start', lineHeight: 1.4 }}>
                  <span style={{ color: 'rgba(99,102,241,0.7)', flexShrink: 0, marginTop: 2 }}>▸</span>
                  <span className="acv-type-target" data-text="Zero cost · 60s turnaround · ATS optimised" style={{ flex: 1 }}></span>
                </div>
              </div>

              {/* init line */}
              <div className="acv-section acv-init" style={{ marginTop: 'auto', paddingTop: 6 }}>
                <div className="acv-divider" />
                <div
                  className="acv-init-text"
                  style={{
                    fontSize: 12,
                    color: 'rgba(99,102,241,0.9)',
                    letterSpacing: 1.5,
                    textAlign: 'center',
                    opacity: 0,
                    minHeight: 18,
                    fontWeight: 500,
                    transition: 'opacity 0.15s ease',
                  }}
                />
              </div>
            </div>

            {/* ════════ BACK FACE (login form) ════════ */}
            <div
              className="acv-face acv-face-back"
              style={{
                background: 'rgba(10,17,38,0.97)',
                border: '1px solid rgba(99,102,241,0.38)',
                backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.08), transparent 65%)',
                padding: '34px 30px 28px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {/* logo */}
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 4, fontFamily: 'system-ui, sans-serif' }}>
                <span style={{ color: '#e8eaf6' }}>Align</span>
                <span style={{ color: '#818cf8' }}>CV</span>
              </div>

              {/* subtitle */}
              <div style={{ fontSize: 9, color: 'rgba(148,151,255,0.42)', letterSpacing: 2, marginBottom: 22 }}>
                AI-POWERED RESUME TAILORING
              </div>

              {/* tabs */}
              <div style={{ display: 'flex', width: '100%', borderBottom: '1px solid rgba(99,102,241,0.18)', marginBottom: 20 }}>
                {['login', 'signup'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => switchTab(tab)}
                    style={{
                      flex: 1,
                      paddingBottom: 10,
                      fontSize: 12,
                      fontWeight: 500,
                      color: activeTab === tab ? '#818cf8' : 'rgba(148,151,255,0.42)',
                      background: 'none',
                      border: 'none',
                      borderBottom: activeTab === tab ? '2px solid #818cf8' : '2px solid transparent',
                      cursor: 'pointer',
                      fontFamily: 'system-ui, sans-serif',
                    }}
                  >
                    {tab === 'login' ? 'Log In' : 'Sign Up'}
                  </button>
                ))}
              </div>

              {/* form */}
              <form
                onSubmit={handleSubmit}
                style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14, fontFamily: 'system-ui, sans-serif' }}
              >
                {/* name */}
                <div>
                  <label style={{ display: 'block', fontSize: 8.5, fontWeight: 600, letterSpacing: 1.8, color: 'rgba(148,151,255,0.55)', marginBottom: 6 }}>
                    NAME
                  </label>
                  <input
                    ref={nameInputRef}
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    onKeyDown={handleUserInteraction}
                    onClick={handleUserInteraction}
                    placeholder="Enter your name"
                    className="acv-input"
                    style={{
                      width: '100%',
                      height: 40,
                      borderRadius: 9,
                      background: 'rgba(255,255,255,0.035)',
                      border: '1px solid rgba(99,102,241,0.22)',
                      fontSize: 12,
                      color: '#e8eaf6',
                      padding: '0 14px',
                      boxSizing: 'border-box',
                    }}
                  />
                  {errors.name && <p style={{ fontSize: 10, color: '#f87171', margin: '4px 0 0' }}>{errors.name}</p>}
                </div>

                {/* passcode */}
                <div>
                  <label style={{ display: 'block', fontSize: 8.5, fontWeight: 600, letterSpacing: 1.8, color: 'rgba(148,151,255,0.55)', marginBottom: 6 }}>
                    PASSCODE
                  </label>
                  <input
                    ref={passcodeInputRef}
                    name="passcode"
                    type="password"
                    value={form.passcode}
                    onChange={handleChange}
                    onKeyDown={handleUserInteraction}
                    onClick={handleUserInteraction}
                    placeholder="Enter your passcode"
                    className="acv-input"
                    style={{
                      width: '100%',
                      height: 40,
                      borderRadius: 9,
                      background: 'rgba(255,255,255,0.035)',
                      border: '1px solid rgba(99,102,241,0.22)',
                      fontSize: 12,
                      color: '#e8eaf6',
                      padding: '0 14px',
                      boxSizing: 'border-box',
                    }}
                  />
                  {errors.passcode && <p style={{ fontSize: 10, color: '#f87171', margin: '4px 0 0' }}>{errors.passcode}</p>}
                </div>

                {/* confirm passcode (signup only) */}
                {activeTab === 'signup' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 8.5, fontWeight: 600, letterSpacing: 1.8, color: 'rgba(148,151,255,0.55)', marginBottom: 6 }}>
                      CONFIRM PASSCODE
                    </label>
                    <input
                      name="confirmPasscode"
                      type="password"
                      value={form.confirmPasscode}
                      onChange={handleChange}
                      placeholder="Confirm your passcode"
                      className="acv-input"
                      style={{
                        width: '100%',
                        height: 40,
                        borderRadius: 9,
                        background: 'rgba(255,255,255,0.035)',
                        border: '1px solid rgba(99,102,241,0.22)',
                        fontSize: 12,
                        color: '#e8eaf6',
                        padding: '0 14px',
                        boxSizing: 'border-box',
                      }}
                    />
                    {errors.confirmPasscode && <p style={{ fontSize: 10, color: '#f87171', margin: '4px 0 0' }}>{errors.confirmPasscode}</p>}
                  </div>
                )}

                {/* error */}
                {errors.general && <p style={{ fontSize: 10, color: '#f87171', textAlign: 'center', margin: 0 }}>{errors.general}</p>}

                {/* submit */}
                <button
                  ref={btnRef}
                  type="submit"
                  disabled={loading}
                  className="acv-btn"
                  onClick={handleUserInteraction}
                  style={{
                    width: '100%',
                    height: 42,
                    borderRadius: 9,
                    background: 'linear-gradient(135deg, #5a5fcf, #818cf8)',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#fff',
                    letterSpacing: '0.3px',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    marginTop: 4,
                  }}
                >
                  {loading ? '...' : activeTab === 'login' ? 'Log In' : 'Create Account'}
                </button>
              </form>

              {/* footer link */}
              <p style={{ fontSize: 10, color: 'rgba(148,151,255,0.4)', marginTop: 16, fontFamily: 'system-ui, sans-serif' }}>
                {activeTab === 'login' ? (
                  <>
                    Don&apos;t have an account?{' '}
                    <button onClick={() => switchTab('signup')} className="acv-link" style={{ color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, padding: 0, fontFamily: 'inherit' }}>
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button onClick={() => switchTab('login')} className="acv-link" style={{ color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, padding: 0, fontFamily: 'inherit' }}>
                      Log in
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
