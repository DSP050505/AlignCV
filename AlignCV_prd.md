# AlignCV — Product Requirements Document (PRD)
### Version 1.0 | Classification: Internal Engineering
### Stack: React · Node/Express · PostgreSQL · NVIDIA NIM API
### Template: Jake's Resume (resume.lol) | PDF: LaTeX (tectonic) + Puppeteer

---

> **Mission**: AlignCV is an AI-powered resume tailoring platform that takes a student's complete career profile and a job description, and produces a professionally formatted, ATS-optimised, 1-page resume — automatically aligned to the role — in under 60 seconds.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack & Architecture](#2-tech-stack--architecture)
3. [Folder Structure](#3-folder-structure)
4. [Environment & Configuration](#4-environment--configuration)
5. [Database Schema](#5-database-schema)
6. [API Design](#6-api-design)
7. [AI Pipeline Design (NVIDIA NIM)](#7-ai-pipeline-design-nvidia-nim)
8. [Resume Template System](#8-resume-template-system)
9. [Frontend — Pages & Components](#9-frontend--pages--components)
10. [UI/UX Design System](#10-uiux-design-system)
11. [Logging & Error Handling](#11-logging--error-handling)
12. [Security Practices](#12-security-practices)
13. [Performance Guidelines](#13-performance-guidelines)
14. [Sprint Build Order](#14-sprint-build-order)
15. [Vibe-Coding Agent Instructions](#15-vibe-coding-agent-instructions)

---

## 1. Project Overview

### 1.1 What We Are Building

AlignCV is a full-stack web application with these core capabilities:

| Feature | Description |
|---|---|
| Auth | Name + passcode login (no OAuth, no email verification) |
| Profile vault | Every career detail stored per user, editable at any time |
| Resume upload | Upload old PDF/DOCX → AI extracts structured profile data |
| JD tailoring | Paste a job description → AI selects best-fit content + rewrites bullets |
| Skill gap advisor | AI detects missing JD skills and suggests additions with ATS score impact |
| Dual editor | AI chat mode (vibe-style) OR manual Monaco editor with live preview |
| ATS scorer | Industry-standard ATS score with keyword breakdown and fix suggestions |
| Dual PDF export | LaTeX (high fidelity) or HTML→PDF (fast) |
| Resume history | Every version saved, downloadable, re-editable |

### 1.2 Core Constraints

- **1-page resume only** (freshers) — enforce at PDF compile time
- **Zero cost to run** — NVIDIA NIM free tier, no paid services
- **Single template** — Jake's Resume from resume.lol (Computer Modern Serif, LaTeX-style HTML rendering)
- **No `.env` files pushed** — config via `config/index.js` with clear inline comments
- **Startup-grade code quality** — clean, fast, readable, logged, tested

### 1.3 Success Metrics

- Resume generated in < 60 seconds end-to-end
- ATS score shown within 5 seconds of resume load
- Profile wizard completed in < 5 minutes
- Zero white-screen errors (all errors gracefully handled)

---

## 2. Tech Stack & Architecture

### 2.1 Full Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | React 18 + Vite | Fast HMR, small bundle |
| Styling | Tailwind CSS v3 | Utility-first, no runtime |
| Code editor | Monaco Editor | VS Code engine, LaTeX support |
| PDF preview | PDF.js (pdfjs-dist) | Browser-native PDF render |
| HTTP client | Axios | Interceptors for auth + errors |
| State | Zustand | Lightweight, no boilerplate |
| Backend | Node.js 20 + Express 4 | Fast, familiar, vast ecosystem |
| DB ORM | Knex.js | SQL query builder + migrations |
| Database | PostgreSQL 15 | JSONB support for AI outputs |
| AI | NVIDIA NIM API | Free tier, Llama 3.1 70B |
| LaTeX compiler | Tectonic (via child_process) | Self-contained, no TeX Live install |
| HTML→PDF | Puppeteer | Headless Chrome, pixel-perfect |
| File parsing | pdf-parse + mammoth | PDF + DOCX text extraction |
| Auth | bcryptjs + jsonwebtoken | Secure, no external dependency |
| Logging | Winston | Structured JSON logs, file + console |
| Validation | Zod | Runtime schema validation |
| Rate limiting | express-rate-limit | Protect AI endpoints |

### 2.2 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER (React SPA)                      │
│  Auth │ Profile │ NewResume │ Editor │ ATS │ History        │
└───────────────────────┬─────────────────────────────────────┘
                        │ REST / JSON (Axios + JWT)
┌───────────────────────▼─────────────────────────────────────┐
│                 EXPRESS API SERVER (:5000)                   │
│                                                             │
│  /api/auth    /api/profile    /api/jd    /api/resume        │
│  /api/export  /api/ats        /api/chat                     │
│                                                             │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Auth    │  │  Profile  │  │ Resume   │  │  Export  │  │
│  │ Service  │  │  Service  │  │ Service  │  │ Service  │  │
│  └──────────┘  └───────────┘  └──────────┘  └──────────┘  │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────────────┐ │
│  │   JD     │  │   ATS     │  │      NIM Service         │ │
│  │ Service  │  │  Service  │  │  (all AI calls here)     │ │
│  └──────────┘  └───────────┘  └──────────────────────────┘ │
└──────┬──────────────────────────────┬───────────────────────┘
       │                              │
┌──────▼──────┐              ┌────────▼────────────────────┐
│ PostgreSQL  │              │     NVIDIA NIM API          │
│  (Knex.js)  │              │  api.nvidia.com/v1/...      │
│             │              │  model: llama-3.1-70b       │
└─────────────┘              └─────────────────────────────┘
```

### 2.3 Data Flow — Resume Generation

```
User pastes JD
     │
     ▼
POST /api/jd/analyse
     │
     ├── nimService.analyseJD(jd_text)
     │         └── returns { role, required_skills, preferred_skills, keywords, seniority }
     │
     ├── resumeService.scoreProfile(profile, jd_analysis)
     │         └── nimService.scoreAndRank(profile_items, jd_analysis)
     │              └── returns ranked projects[], ranked experiences[]
     │
     ├── nimService.rewriteBullets(selected_items, jd_analysis)
     │         └── returns tailored bullet points per item
     │
     ├── templateService.buildLatex(tailored_data)
     │         └── fills Jake's template slots
     │
     └── exportService.compileLatex(latex_source)
               └── tectonic → PDF bytes → save → return URL
```

---

## 3. Folder Structure

```
aligncv/
│
├── client/                          ← React frontend (Vite)
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── public/
│   │   └── fonts/                   ← Computer Modern Serif (from resume.lol CDN or local)
│   └── src/
│       ├── main.jsx                 ← React root
│       ├── App.jsx                  ← Router + auth guard
│       ├── config.js                ← API base URL, constants
│       │
│       ├── pages/
│       │   ├── AuthPage.jsx         ← Login + signup
│       │   ├── DashboardPage.jsx    ← Home after login
│       │   ├── ProfilePage.jsx      ← View + edit full profile
│       │   ├── ProfileWizardPage.jsx← Step-by-step profile builder
│       │   ├── NewResumePage.jsx    ← JD input + tailoring flow
│       │   ├── EditorPage.jsx       ← Dual editor + ATS panel
│       │   └── HistoryPage.jsx      ← Past resume versions
│       │
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Navbar.jsx
│       │   │   ├── Sidebar.jsx
│       │   │   └── PageWrapper.jsx
│       │   ├── auth/
│       │   │   ├── LoginForm.jsx
│       │   │   └── SignupForm.jsx
│       │   ├── profile/
│       │   │   ├── PersonalInfoForm.jsx
│       │   │   ├── EducationForm.jsx
│       │   │   ├── ExperienceForm.jsx
│       │   │   ├── ProjectForm.jsx
│       │   │   ├── SkillsForm.jsx
│       │   │   ├── CertificationsForm.jsx
│       │   │   ├── AchievementsForm.jsx
│       │   │   └── ProfileSection.jsx   ← generic section wrapper
│       │   ├── resume/
│       │   │   ├── JDInputPanel.jsx
│       │   │   ├── SkillGapAdvisor.jsx
│       │   │   ├── ResumePreview.jsx    ← PDF.js viewer
│       │   │   ├── ChatEditor.jsx       ← AI chat mode
│       │   │   ├── ManualEditor.jsx     ← Monaco + preview split
│       │   │   └── ATSWidget.jsx        ← Score gauge + breakdown
│       │   └── ui/
│       │       ├── Button.jsx
│       │       ├── Input.jsx
│       │       ├── Textarea.jsx
│       │       ├── Badge.jsx
│       │       ├── Modal.jsx
│       │       ├── Spinner.jsx
│       │       ├── ProgressBar.jsx
│       │       ├── Toast.jsx            ← react-hot-toast wrapper
│       │       └── StepIndicator.jsx
│       │
│       ├── hooks/
│       │   ├── useAuth.js
│       │   ├── useProfile.js
│       │   ├── useResume.js
│       │   ├── useATS.js
│       │   └── useToast.js
│       │
│       ├── store/
│       │   ├── authStore.js            ← Zustand: user, token
│       │   ├── profileStore.js         ← Zustand: all profile sections
│       │   └── resumeStore.js          ← Zustand: current resume, versions
│       │
│       ├── api/
│       │   ├── axios.js               ← Axios instance + interceptors
│       │   ├── authApi.js
│       │   ├── profileApi.js
│       │   ├── resumeApi.js
│       │   ├── jdApi.js
│       │   └── exportApi.js
│       │
│       └── utils/
│           ├── formatters.js          ← date, string helpers
│           ├── validators.js          ← client-side form validation
│           └── constants.js
│
├── server/                           ← Node/Express backend
│   ├── index.js                      ← Entry point, starts server
│   ├── app.js                        ← Express app setup, middleware
│   │
│   ├── config/
│   │   └── index.js                  ← ALL config here, no .env required
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── profile.routes.js
│   │   ├── jd.routes.js
│   │   ├── resume.routes.js
│   │   ├── export.routes.js
│   │   ├── ats.routes.js
│   │   └── chat.routes.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── profile.controller.js
│   │   ├── jd.controller.js
│   │   ├── resume.controller.js
│   │   ├── export.controller.js
│   │   ├── ats.controller.js
│   │   └── chat.controller.js
│   │
│   ├── services/
│   │   ├── nimService.js             ← ALL NIM API calls
│   │   ├── authService.js
│   │   ├── profileService.js
│   │   ├── resumeService.js
│   │   ├── templateService.js        ← LaTeX template filling
│   │   ├── exportService.js          ← LaTeX compile + Puppeteer
│   │   ├── atsService.js
│   │   └── parseService.js           ← PDF/DOCX text extraction
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js        ← JWT verify
│   │   ├── validate.middleware.js    ← Zod schema validation
│   │   ├── rateLimit.middleware.js   ← Per-endpoint rate limits
│   │   ├── upload.middleware.js      ← Multer config
│   │   └── error.middleware.js       ← Global error handler
│   │
│   ├── db/
│   │   ├── knex.js                   ← Knex instance
│   │   ├── migrations/               ← One file per table
│   │   │   ├── 001_create_users.js
│   │   │   ├── 002_create_profiles.js
│   │   │   ├── 003_create_education.js
│   │   │   ├── 004_create_experiences.js
│   │   │   ├── 005_create_projects.js
│   │   │   ├── 006_create_skills.js
│   │   │   ├── 007_create_achievements.js
│   │   │   ├── 008_create_certifications.js
│   │   │   ├── 009_create_jd_analyses.js
│   │   │   └── 010_create_resumes.js
│   │   └── queries/                  ← One file per table, raw SQL via Knex
│   │       ├── users.queries.js
│   │       ├── profile.queries.js
│   │       ├── education.queries.js
│   │       ├── experience.queries.js
│   │       ├── projects.queries.js
│   │       ├── skills.queries.js
│   │       ├── achievements.queries.js
│   │       ├── certifications.queries.js
│   │       ├── jd.queries.js
│   │       └── resume.queries.js
│   │
│   ├── templates/
│   │   └── jake_resume.template.html ← Jake's template with {{SLOT}} placeholders
│   │
│   ├── uploads/                      ← Multer temp storage (gitignored)
│   ├── outputs/                      ← Compiled PDFs (gitignored)
│   └── utils/
│       ├── logger.js                 ← Winston logger
│       ├── asyncHandler.js           ← Wrap async route handlers
│       └── nimHelpers.js             ← Prompt builders
│
├── docker-compose.yml                ← PostgreSQL only (no Docker needed for app itself)
├── package.json                      ← Root-level scripts (start, dev, migrate)
└── README.md
```

---

## 4. Environment & Configuration

### 4.1 Configuration File (NO `.env`)

All config lives in `server/config/index.js`. This is intentional — the app is open-source and the NIM key is free-tier. No secrets to protect.

```javascript
// server/config/index.js
// ─────────────────────────────────────────────────────────────────
// AlignCV — Central Configuration
// All settings are here. No .env file. No process.env surprises.
// ─────────────────────────────────────────────────────────────────

module.exports = {
  // ── Server ────────────────────────────────────────────────────
  PORT: 5000,
  NODE_ENV: 'development',   // 'production' in prod

  // ── Database ───────────────────────────────────────────────────
  DB: {
    client: 'postgresql',
    connection: {
      host: '127.0.0.1',
      port: 5432,
      database: 'aligncv',
      user: 'postgres',
      password: 'postgres',
    },
    pool: { min: 2, max: 10 },
    migrations: { directory: './db/migrations' },
  },

  // ── Auth ───────────────────────────────────────────────────────
  JWT_SECRET: 'aligncv-jwt-secret-change-in-production-2024',
  JWT_EXPIRES_IN: '7d',
  BCRYPT_ROUNDS: 10,

  // ── NVIDIA NIM ─────────────────────────────────────────────────
  NIM: {
    API_KEY: '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',
    BASE_URL: 'https://integrate.api.nvidia.com/v1',
    MODEL: 'meta/llama-3.1-70b-instruct',
    TIMEOUT_MS: 60000,
    MAX_TOKENS: 4096,
    TEMPERATURE: 0.2,  // Low for structured output consistency
  },

  // ── File Upload ────────────────────────────────────────────────
  UPLOAD: {
    DIR: './uploads',
    MAX_SIZE_MB: 5,
    ALLOWED_TYPES: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },

  // ── Export ─────────────────────────────────────────────────────
  EXPORT: {
    OUTPUT_DIR: './outputs',
    TECTONIC_PATH: 'tectonic',  // Must be in PATH; install: cargo install tectonic
    PUPPETEER_TIMEOUT_MS: 30000,
  },

  // ── Rate Limits ────────────────────────────────────────────────
  RATE_LIMITS: {
    AI_ENDPOINTS: { windowMs: 60_000, max: 10 },    // 10 AI calls/min
    AUTH_ENDPOINTS: { windowMs: 60_000, max: 20 },   // 20 auth calls/min
    EXPORT_ENDPOINTS: { windowMs: 60_000, max: 5 },  // 5 PDFs/min
    DEFAULT: { windowMs: 60_000, max: 100 },
  },

  // ── Frontend (for Vite proxy) ──────────────────────────────────
  CLIENT_URL: 'http://localhost:3000',
};
```

### 4.2 Vite Config (frontend)

```javascript
// client/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          editor: ['monaco-editor'],
          pdf: ['pdfjs-dist'],
        },
      },
    },
  },
});
```

---

## 5. Database Schema

### 5.1 All Tables

#### `users`
```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  passcode_hash TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_users_name ON users(name);
```

#### `profiles`
```sql
CREATE TABLE profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  headline    VARCHAR(200),
  email       VARCHAR(200),
  phone       VARCHAR(30),
  github      VARCHAR(100),
  linkedin    VARCHAR(100),
  leetcode    VARCHAR(100),
  portfolio   VARCHAR(200),
  other_links JSONB DEFAULT '[]',    -- [{ label, url }]
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

#### `education`
```sql
CREATE TABLE education (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  institution VARCHAR(200) NOT NULL,
  degree      VARCHAR(200),
  field       VARCHAR(200),
  start_date  DATE,
  end_date    DATE,
  cgpa        DECIMAL(3,2),
  location    VARCHAR(200),
  is_current  BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

#### `experiences`
```sql
CREATE TABLE experiences (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  company     VARCHAR(200) NOT NULL,
  role        VARCHAR(200) NOT NULL,
  type        VARCHAR(50) DEFAULT 'job',   -- 'job' | 'internship' | 'freelance'
  location    VARCHAR(200),
  start_date  DATE,
  end_date    DATE,
  is_current  BOOLEAN DEFAULT FALSE,
  bullets     JSONB DEFAULT '[]',          -- ["bullet 1", "bullet 2"]
  tech_stack  TEXT[],
  order_index INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

#### `projects`
```sql
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  bullets     JSONB DEFAULT '[]',          -- ["bullet 1", "bullet 2"]
  tech_stack  TEXT[],
  start_date  DATE,
  end_date    DATE,
  repo_url    VARCHAR(500),
  live_url    VARCHAR(500),
  order_index INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

#### `skills`
```sql
CREATE TABLE skills (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(100),    -- 'Languages' | 'Frameworks' | 'Tools' | 'Libraries'
  name     VARCHAR(100) NOT NULL,
  level    VARCHAR(50),     -- 'beginner' | 'intermediate' | 'advanced'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `achievements`
```sql
CREATE TABLE achievements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(300) NOT NULL,
  description TEXT,
  date        DATE,
  order_index INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

#### `certifications`
```sql
CREATE TABLE certifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  name       VARCHAR(300) NOT NULL,
  issuer     VARCHAR(200),
  issued_at  DATE,
  expires_at DATE,
  url        VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `jd_analyses`
```sql
CREATE TABLE jd_analyses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES users(id) ON DELETE CASCADE,
  raw_jd           TEXT NOT NULL,
  role_title       VARCHAR(200),
  company_name     VARCHAR(200),
  required_skills  JSONB DEFAULT '[]',     -- ["React", "Node.js"]
  preferred_skills JSONB DEFAULT '[]',
  keywords         JSONB DEFAULT '[]',     -- ["REST API", "microservices"]
  seniority        VARCHAR(50),            -- 'fresher' | 'junior' | 'mid' | 'senior'
  domain           VARCHAR(100),           -- 'frontend' | 'backend' | 'fullstack' | 'ml' etc
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_jd_user ON jd_analyses(user_id);
```

#### `resumes`
```sql
CREATE TABLE resumes (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID REFERENCES users(id) ON DELETE CASCADE,
  jd_analysis_id       UUID REFERENCES jd_analyses(id),
  title                VARCHAR(300),            -- "Software Engineer @ Google"
  selected_projects    JSONB DEFAULT '[]',      -- [{ project_id, tailored_bullets }]
  selected_experiences JSONB DEFAULT '[]',      -- [{ experience_id, tailored_bullets }]
  selected_skills      JSONB DEFAULT '[]',      -- flat skill list for this resume
  added_skills         JSONB DEFAULT '[]',      -- skills added via gap advisor (not in profile)
  html_source          TEXT,                    -- Jake's template filled HTML
  latex_source         TEXT,                    -- LaTeX source (future)
  pdf_path             VARCHAR(500),            -- /outputs/<uuid>.pdf
  ats_score            INTEGER,                 -- 0-100
  ats_breakdown        JSONB DEFAULT '{}',      -- { keyword_match: 72, format: 90, ... }
  ats_missing_keywords JSONB DEFAULT '[]',      -- ["CI/CD", "Agile"]
  version_number       INTEGER DEFAULT 1,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_resumes_user ON resumes(user_id);
CREATE INDEX idx_resumes_jd ON resumes(jd_analysis_id);
```

---

## 6. API Design

### 6.1 Conventions

- All routes prefixed with `/api`
- All responses: `{ success: true, data: {...} }` or `{ success: false, error: "message", code: "ERROR_CODE" }`
- Auth via `Authorization: Bearer <token>` header
- All request bodies validated with Zod before hitting controller
- All async handlers wrapped in `asyncHandler()` — no try/catch in controllers

### 6.2 Auth Routes — `/api/auth`

```
POST   /api/auth/signup          Body: { name, passcode }
POST   /api/auth/login           Body: { name, passcode }
GET    /api/auth/me              Auth: JWT → returns user info
POST   /api/auth/logout          Auth: JWT (client clears token)
```

### 6.3 Profile Routes — `/api/profile`

```
GET    /api/profile              Auth → returns full profile with all sections
PUT    /api/profile/personal     Auth → { headline, email, phone, github, linkedin, ... }
POST   /api/profile/upload       Auth → multipart/form-data (PDF or DOCX)
                                  → extracts + returns structured profile JSON

GET    /api/profile/education           Auth
POST   /api/profile/education           Auth → create one education entry
PUT    /api/profile/education/:id       Auth → update
DELETE /api/profile/education/:id       Auth → delete

GET    /api/profile/experience          Auth
POST   /api/profile/experience          Auth
PUT    /api/profile/experience/:id      Auth
DELETE /api/profile/experience/:id      Auth

GET    /api/profile/projects            Auth
POST   /api/profile/projects            Auth
PUT    /api/profile/projects/:id        Auth
DELETE /api/profile/projects/:id        Auth

GET    /api/profile/skills              Auth
POST   /api/profile/skills              Auth → { category, name, level }
DELETE /api/profile/skills/:id          Auth

GET    /api/profile/achievements        Auth
POST   /api/profile/achievements        Auth
PUT    /api/profile/achievements/:id    Auth
DELETE /api/profile/achievements/:id    Auth

GET    /api/profile/certifications      Auth
POST   /api/profile/certifications      Auth
PUT    /api/profile/certifications/:id  Auth
DELETE /api/profile/certifications/:id  Auth
```

### 6.4 JD Routes — `/api/jd`

```
POST   /api/jd/analyse           Auth → { raw_jd: string }
                                  → runs NIM analysis, saves jd_analyses row
                                  → returns jd_analysis object

GET    /api/jd/:id               Auth → single jd_analysis
GET    /api/jd                   Auth → list all past JD analyses (for history)
```

### 6.5 Resume Routes — `/api/resume`

```
POST   /api/resume/generate      Auth → { jd_analysis_id }
                                  → full AI pipeline: score → rank → rewrite → template → compile
                                  → returns resume object with pdf_path

GET    /api/resume/:id           Auth → single resume with all fields
GET    /api/resume               Auth → list all resumes (history)

PUT    /api/resume/:id/source    Auth → { html_source } → recompile PDF
PUT    /api/resume/:id/skills    Auth → { selected_skills, added_skills }
DELETE /api/resume/:id           Auth
```

### 6.6 Skill Gap Routes — `/api/skillgap`

```
POST   /api/skillgap/analyse     Auth → { resume_id, jd_analysis_id }
                                  → returns [{ skill, reason, ats_boost_estimate }]

POST   /api/skillgap/accept      Auth → { resume_id, skill }
                                  → adds skill to resume's added_skills, triggers recompile
```

### 6.7 ATS Routes — `/api/ats`

```
POST   /api/ats/score            Auth → { resume_id }
                                  → runs ATS scoring, updates resume row
                                  → returns { score, breakdown, missing_keywords, suggestions }
```

### 6.8 Chat Routes — `/api/chat`

```
POST   /api/chat/message         Auth → { resume_id, message, conversation_history[] }
                                  → sends to NIM with resume context
                                  → returns { assistant_message, updated_resume_json, needs_recompile }
```

### 6.9 Export Routes — `/api/export`

```
GET    /api/export/:resume_id/pdf        Auth → streams PDF file
GET    /api/export/:resume_id/pdf-html  Auth → Puppeteer HTML→PDF, streams file
GET    /api/export/:resume_id/preview    Auth → returns html_source for browser preview
```

---

## 7. AI Pipeline Design (NVIDIA NIM)

### 7.1 NIM Service — Core Caller

```javascript
// server/services/nimService.js

const config = require('../config');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────────────────────────
// Base NIM API caller — all AI calls go through here
// Handles: retries, timeout, logging, JSON parsing
// ─────────────────────────────────────────────────────────────────

async function nimCall({ systemPrompt, userContent, expectJson = true, label = 'nim_call' }) {
  const startTime = Date.now();
  logger.info(`[NIM] Starting: ${label}`);

  const body = {
    model: config.NIM.MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userContent },
    ],
    temperature: config.NIM.TEMPERATURE,
    max_tokens: config.NIM.MAX_TOKENS,
    ...(expectJson && { response_format: { type: 'json_object' } }),
  };

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), config.NIM.TIMEOUT_MS);

      const res = await fetch(`${config.NIM.BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.NIM.API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const errText = await res.text();
        logger.error(`[NIM] HTTP ${res.status} on attempt ${attempt}: ${errText}`);
        throw new Error(`NIM API error: ${res.status}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('NIM returned empty content');
      }

      const durationMs = Date.now() - startTime;
      logger.info(`[NIM] ${label} completed in ${durationMs}ms (attempt ${attempt})`);

      if (expectJson) {
        try {
          return JSON.parse(content);
        } catch (e) {
          logger.error(`[NIM] JSON parse failed for ${label}: ${content.slice(0, 200)}`);
          throw new Error('NIM returned invalid JSON');
        }
      }
      return content;

    } catch (err) {
      lastError = err;
      logger.warn(`[NIM] Attempt ${attempt} failed for ${label}: ${err.message}`);
      if (attempt < 3) await sleep(1000 * attempt);  // exponential backoff
    }
  }

  logger.error(`[NIM] All 3 attempts failed for ${label}: ${lastError.message}`);
  throw lastError;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
```

### 7.2 NIM Prompt Functions

#### Prompt 1 — Parse Resume PDF

```javascript
async function parseResumePDF(rawText) {
  return nimCall({
    label: 'parse_resume_pdf',
    systemPrompt: `
You are a resume parser. Extract structured data from the raw resume text.
Return ONLY valid JSON with this exact structure — no extra text, no markdown:
{
  "personal": { "name": "", "email": "", "phone": "", "github": "", "linkedin": "", "leetcode": "", "portfolio": "" },
  "education": [{ "institution": "", "degree": "", "field": "", "start_date": "", "end_date": "", "cgpa": null, "location": "" }],
  "experiences": [{ "company": "", "role": "", "type": "job|internship|freelance", "location": "", "start_date": "", "end_date": "", "is_current": false, "bullets": [], "tech_stack": [] }],
  "projects": [{ "title": "", "description": "", "bullets": [], "tech_stack": [], "repo_url": "", "live_url": "" }],
  "skills": [{ "category": "Languages|Frameworks|Tools|Libraries", "name": "" }],
  "achievements": [{ "title": "", "description": "", "date": "" }],
  "certifications": [{ "name": "", "issuer": "", "issued_at": "", "url": "" }]
}
Dates should be in YYYY-MM-DD format if possible, otherwise keep as string.
`.trim(),
    userContent: `Extract structured data from this resume:\n\n${rawText}`,
  });
}
```

#### Prompt 2 — Analyse Job Description

```javascript
async function analyseJD(rawJD) {
  return nimCall({
    label: 'analyse_jd',
    systemPrompt: `
You are a job description analyser. Extract key hiring signals from the JD.
Return ONLY valid JSON:
{
  "role_title": "",
  "company_name": "",
  "required_skills": [],
  "preferred_skills": [],
  "keywords": [],
  "seniority": "fresher|junior|mid|senior",
  "domain": "frontend|backend|fullstack|ml|devops|data|mobile|other",
  "key_responsibilities": [],
  "tech_stack": []
}
`.trim(),
    userContent: `Analyse this job description:\n\n${rawJD}`,
  });
}
```

#### Prompt 3 — Score & Rank Profile Items

```javascript
async function scoreAndRankProfile(profileData, jdAnalysis) {
  return nimCall({
    label: 'score_and_rank',
    systemPrompt: `
You are a resume tailoring expert. Given a user's profile and a job description analysis,
score each project and experience item on relevance to the JD (0-100).
Select the TOP 2 projects and TOP 2 experiences to feature.
Return ONLY valid JSON:
{
  "selected_projects": [
    { "id": "", "relevance_score": 0, "reason": "" }
  ],
  "selected_experiences": [
    { "id": "", "relevance_score": 0, "reason": "" }
  ]
}
Pick items that best demonstrate the required skills and domain. Max 2 projects, max 2 experiences.
`.trim(),
    userContent: JSON.stringify({ profile: profileData, jd: jdAnalysis }),
  });
}
```

#### Prompt 4 — Rewrite Bullets

```javascript
async function rewriteBullets(items, jdAnalysis) {
  return nimCall({
    label: 'rewrite_bullets',
    systemPrompt: `
You are a professional resume writer. Rewrite the bullet points for each item
to align with the job description. Use strong action verbs, quantify where possible,
and naturally incorporate JD keywords. Keep each bullet under 100 characters.
Return ONLY valid JSON:
{
  "rewritten": [
    { "id": "", "bullets": ["bullet 1", "bullet 2", "bullet 3"] }
  ]
}
Each item should have 3-4 bullets maximum (1-page constraint for freshers).
`.trim(),
    userContent: JSON.stringify({ items, jd: jdAnalysis }),
  });
}
```

#### Prompt 5 — Detect Skill Gaps

```javascript
async function detectSkillGaps(userSkills, jdAnalysis) {
  return nimCall({
    label: 'detect_skill_gaps',
    systemPrompt: `
You are an ATS expert. Compare the user's skills with JD requirements.
Identify missing skills and estimate the ATS score boost if added.
Only suggest skills the user might realistically have at a basic level given their background.
Return ONLY valid JSON:
{
  "gaps": [
    {
      "skill": "",
      "category": "Languages|Frameworks|Tools|Libraries",
      "reason": "Required in JD but not in profile",
      "ats_boost_estimate": 5,
      "confidence": "high|medium|low"
    }
  ]
}
Return maximum 5 suggestions. Sort by ats_boost_estimate descending.
`.trim(),
    userContent: JSON.stringify({ user_skills: userSkills, jd: jdAnalysis }),
  });
}
```

#### Prompt 6 — Chat Editor

```javascript
async function chatEdit(resumeJson, instruction, conversationHistory) {
  const messages = [
    {
      role: 'system',
      content: `
You are an expert resume editor. The user has a resume in JSON format and wants to make changes.
Apply their instruction to the resume JSON and return the updated version.
Return ONLY valid JSON:
{
  "updated_resume": { ...resume json... },
  "changes_made": ["List of what was changed"],
  "message": "Brief confirmation of what you did"
}
      `.trim(),
    },
    ...conversationHistory,
    {
      role: 'user',
      content: `Current resume:\n${JSON.stringify(resumeJson)}\n\nInstruction: ${instruction}`,
    },
  ];

  // Direct multi-turn call (not using nimCall helper — needs custom messages array)
  // Implementation: POST to NIM with messages array as-is
}
```

#### Prompt 7 — ATS Scoring

```javascript
async function scoreATS(resumeText, jdAnalysis) {
  return nimCall({
    label: 'ats_score',
    systemPrompt: `
You are an ATS (Applicant Tracking System) simulator. Score the resume against the JD.
Use industry-standard ATS criteria. Return ONLY valid JSON:
{
  "overall_score": 0,
  "breakdown": {
    "keyword_match": 0,
    "skills_match": 0,
    "section_completeness": 0,
    "format_score": 0,
    "experience_relevance": 0
  },
  "missing_keywords": [],
  "present_keywords": [],
  "suggestions": [
    { "priority": "high|medium|low", "suggestion": "" }
  ]
}
Score each category 0-100. overall_score = weighted average.
Weights: keyword_match 35%, skills_match 25%, experience_relevance 20%, section_completeness 10%, format_score 10%.
`.trim(),
    userContent: JSON.stringify({ resume_text: resumeText, jd: jdAnalysis }),
  });
}
```

---

## 8. Resume Template System

### 8.1 Jake's Template — HTML Version

The template is Jake's Resume from resume.lol, adapted as a server-side HTML template. This exact CSS matches the original — Computer Modern Serif font, LaTeX-style layout.

```html
<!-- server/templates/jake_resume.template.html -->
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
@import url('https://www.resume.lol/fonts/cm/fonts.css');

@page { size: letter; margin: 0.5in; }

body {
  font-family: "Computer Modern Serif", serif;
  font-size: 11pt;
  font-weight: 500;
  margin: 0;
  padding: 0;
  color: black;
}
h1 {
  color: black;
  text-align: center;
  font-size: 26pt;
  margin: 0 0 4pt 0;
  padding: 0;
}
.headerInfo > ul {
  display: flex;
  justify-content: center;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 11pt;
}
.headerInfo > ul > li { display: inline; white-space: pre; }
.headerInfo > ul > li:not(:last-child) { margin-right: 8px; }
.headerInfo > ul > li:not(:last-child)::after { content: "|"; margin-left: 8px; }
h2 {
  border-bottom: 1px solid #000;
  text-transform: uppercase;
  font-size: 11pt;
  font-weight: normal;
  margin: 5pt 0;
  padding: 0;
}
h2::first-letter { font-size: 14pt; }
h3 {
  display: flex;
  justify-content: space-between;
  font-size: 11pt;
  margin: 0 0 0 0.15in;
  padding: 0;
}
h4 {
  display: flex;
  justify-content: space-between;
  font-size: 11pt;
  font-weight: normal;
  font-style: italic;
  margin: 0 0 0 0.15in;
  padding: 0;
}
.spacer { margin: 0 auto; }
.normal { font-weight: normal; }
.tech-stack { font-style: normal; font-weight: normal; }
ul {
  margin: 1pt 0;
  margin-left: 0.3in;
  padding-left: 24px;
  padding-right: 24px;
  font-size: 11pt;
}
ul > li { margin-bottom: 1pt; }
ul > li:last-child { margin-bottom: 5pt; }
.indent { margin-left: 0.15in; }
a { color: black; text-underline-offset: 4px; }
p { margin: 0; padding: 0; }
</style>
</head>
<body>

<!-- ── HEADER ─────────────────────────────── -->
<h1>{{NAME}}</h1>
<div class="section headerInfo">
  <ul>
    <li>{{PHONE}}</li>
    <li><a href="mailto:{{EMAIL}}">{{EMAIL}}</a></li>
    {{#if LINKEDIN}}<li><a href="https://linkedin.com/in/{{LINKEDIN}}">linkedin.com/in/{{LINKEDIN}}</a></li>{{/if}}
    {{#if GITHUB}}<li><a href="https://github.com/{{GITHUB}}">github.com/{{GITHUB}}</a></li>{{/if}}
    {{#if LEETCODE}}<li><a href="https://leetcode.com/{{LEETCODE}}">leetcode.com/{{LEETCODE}}</a></li>{{/if}}
    {{#if PORTFOLIO}}<li><a href="{{PORTFOLIO}}">{{PORTFOLIO}}</a></li>{{/if}}
  </ul>
</div>

<!-- ── EDUCATION ─────────────────────────── -->
<h2>Education</h2>
{{#each EDUCATION}}
<h3>{{institution}} <span class="spacer"></span><span class="normal">{{start_date}} &ndash; {{end_date}}</span></h3>
<h4>{{degree}}{{#if field}}, {{field}}{{/if}}{{#if cgpa}} &mdash; GPA: {{cgpa}}{{/if}}<span class="spacer"></span>{{location}}</h4>
{{/each}}

<!-- ── EXPERIENCE ─────────────────────────── -->
{{#if EXPERIENCES}}
<h2>Experience</h2>
{{#each EXPERIENCES}}
<h3>{{role}} <span class="spacer"></span><span class="normal">{{start_date}} &ndash; {{#if is_current}}Present{{else}}{{end_date}}{{/if}}</span></h3>
<h4>{{company}} <span class="spacer"></span>{{location}}</h4>
<ul>
  {{#each bullets}}<li>{{this}}</li>{{/each}}
</ul>
{{/each}}
{{/if}}

<!-- ── PROJECTS ─────────────────────────── -->
{{#if PROJECTS}}
<h2>Projects</h2>
{{#each PROJECTS}}
<h3>
  {{#if live_url}}<a href="{{live_url}}">{{title}}</a>{{else}}{{title}}{{/if}}
  {{#if tech_stack}}<span class="tech-stack">&nbsp;| <em>{{tech_stack_str}}</em></span>{{/if}}
  <span class="spacer"></span>
  <span class="normal">{{start_date}}{{#if end_date}} &ndash; {{end_date}}{{/if}}</span>
</h3>
<ul>
  {{#each bullets}}<li>{{this}}</li>{{/each}}
</ul>
{{/each}}
{{/if}}

<!-- ── TECHNICAL SKILLS ─────────────────── -->
{{#if SKILLS}}
<h2>Technical Skills</h2>
{{#each SKILL_GROUPS}}
<p><span class="indent"></span><strong>{{category}}</strong>: {{skills_str}}</p>
{{/each}}
{{/if}}

<!-- ── ACHIEVEMENTS ────────────────────── -->
{{#if ACHIEVEMENTS}}
<h2>Achievements</h2>
<ul>
  {{#each ACHIEVEMENTS}}<li>{{title}}{{#if description}} — {{description}}{{/if}}</li>{{/each}}
</ul>
{{/if}}

<!-- ── CERTIFICATIONS ─────────────────── -->
{{#if CERTIFICATIONS}}
<h2>Certifications</h2>
<ul>
  {{#each CERTIFICATIONS}}<li>{{name}}{{#if issuer}}, {{issuer}}{{/if}}{{#if issued_at}} ({{issued_at}}){{/if}}</li>{{/each}}
</ul>
{{/if}}

</body>
</html>
```

### 8.2 Template Service

```javascript
// server/services/templateService.js
// Fills Jake's template with tailored resume data
// Returns: complete HTML string ready for Puppeteer

const Handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const TEMPLATE_PATH = path.join(__dirname, '../templates/jake_resume.template.html');
const template = Handlebars.compile(fs.readFileSync(TEMPLATE_PATH, 'utf8'));

function buildResumeHTML(resumeData) {
  logger.info('[Template] Building resume HTML', { userId: resumeData.user_id });

  // Group skills by category
  const skillGroups = groupSkillsByCategory(resumeData.selected_skills);

  const context = {
    NAME:           resumeData.personal.name,
    EMAIL:          resumeData.personal.email,
    PHONE:          resumeData.personal.phone,
    LINKEDIN:       resumeData.personal.linkedin,
    GITHUB:         resumeData.personal.github,
    LEETCODE:       resumeData.personal.leetcode,
    PORTFOLIO:      resumeData.personal.portfolio,
    EDUCATION:      resumeData.education,
    EXPERIENCES:    resumeData.selected_experiences,
    PROJECTS:       resumeData.selected_projects.map(p => ({
                      ...p,
                      tech_stack_str: p.tech_stack?.join(', ') || '',
                    })),
    SKILLS:         resumeData.selected_skills?.length > 0,
    SKILL_GROUPS:   skillGroups.map(g => ({
                      category: g.category,
                      skills_str: g.skills.join(', '),
                    })),
    ACHIEVEMENTS:   resumeData.achievements,
    CERTIFICATIONS: resumeData.certifications,
  };

  const html = template(context);
  logger.info('[Template] Resume HTML built successfully');
  return html;
}

function groupSkillsByCategory(skills) {
  const order = ['Languages', 'Frameworks', 'Tools', 'Libraries', 'Other'];
  const groups = {};
  for (const skill of skills) {
    const cat = skill.category || 'Other';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(skill.name);
  }
  return order.filter(c => groups[c]).map(c => ({ category: c, skills: groups[c] }));
}

module.exports = { buildResumeHTML };
```

### 8.3 Export Service

```javascript
// server/services/exportService.js

const puppeteer = require('puppeteer');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const logger = require('../utils/logger');

// ── HTML → PDF via Puppeteer ──────────────────────────────────────
async function htmlToPDF(htmlContent, outputFilename) {
  const outPath = path.join(config.EXPORT.OUTPUT_DIR, outputFilename);
  logger.info(`[Export] Starting Puppeteer PDF generation: ${outputFilename}`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    // Inject font preloading before setting content
    await page.setContent(htmlContent, { waitUntil: 'networkidle0', timeout: config.EXPORT.PUPPETEER_TIMEOUT_MS });

    await page.pdf({
      path: outPath,
      format: 'Letter',
      printBackground: true,
      margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
    });

    logger.info(`[Export] Puppeteer PDF saved: ${outPath}`);
    return outPath;

  } catch (err) {
    logger.error(`[Export] Puppeteer failed: ${err.message}`);
    throw err;
  } finally {
    if (browser) await browser.close();
  }
}

// ── LaTeX → PDF via Tectonic ──────────────────────────────────────
async function latexToPDF(latexSource, outputFilename) {
  const tmpDir = path.join(config.EXPORT.OUTPUT_DIR, `tmp_${uuidv4()}`);
  const texFile = path.join(tmpDir, 'resume.tex');
  const outPath = path.join(config.EXPORT.OUTPUT_DIR, outputFilename);

  fs.mkdirSync(tmpDir, { recursive: true });
  fs.writeFileSync(texFile, latexSource, 'utf8');

  logger.info(`[Export] Compiling LaTeX with tectonic: ${texFile}`);

  try {
    execSync(`${config.EXPORT.TECTONIC_PATH} ${texFile}`, {
      cwd: tmpDir,
      timeout: 30000,
      stdio: 'pipe',
    });

    const compiledPDF = path.join(tmpDir, 'resume.pdf');
    fs.renameSync(compiledPDF, outPath);
    logger.info(`[Export] LaTeX PDF saved: ${outPath}`);
    return outPath;

  } catch (err) {
    logger.error(`[Export] Tectonic compile failed: ${err.stderr?.toString()}`);
    throw new Error('LaTeX compile failed. Try HTML-PDF export instead.');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

module.exports = { htmlToPDF, latexToPDF };
```

---

## 9. Frontend — Pages & Components

### 9.1 Page Specifications

#### `AuthPage.jsx`
- Two tabs: "Sign Up" / "Log In"
- Sign up: Name (text) + Passcode (password input, min 4 chars) + Confirm Passcode
- Login: Name + Passcode
- On success: store JWT in Zustand + localStorage, redirect to `/dashboard`
- Show inline errors, no modal

#### `DashboardPage.jsx`
- Greeting: "Welcome back, {name}"
- Profile completeness bar (0–100%, calculated from filled fields)
- Two CTA cards: "Edit Profile" and "New Resume"
- Recent resumes list (last 3) with ATS score badges and download links

#### `ProfileWizardPage.jsx`
- 7-step wizard: Personal → Education → Experience → Projects → Skills → Certifications → Achievements
- Step indicator at top (numbered pills, completed steps highlighted)
- "Back" / "Save & Continue" navigation
- Auto-save on step complete (POST/PUT to API)
- Final step: "Done — Go to Dashboard"
- Alternative: "Upload Resume" button at top — shortcut to upload flow

#### `ProfilePage.jsx`
- Full profile view — all sections expandable
- Each section has "Add item" + edit/delete per item
- Inline editing (no modals) — click pencil → form expands in place
- "Upload new resume" button to re-extract

#### `NewResumePage.jsx`

**Step 1 — JD Input**
- Large textarea for JD paste
- "(Optional) Paste LinkedIn Job URL" input — triggers scrape
- "Analyse JD →" button
- Shows spinner with message: "Reading the job description..."

**Step 2 — Profile Review (auto)**
- Shows: "We've selected these items based on the JD..."
- Selected projects list (2 items) with relevance score badges
- Selected experiences list (2 items)
- "Change selections" toggle to manually swap items

**Step 3 — Skill Gap Panel**
- List of suggested skills with ATS boost estimate
- Accept / Skip toggle per skill
- "Continue →" button

**Step 4 — Generating**
- Full-page spinner: "Building your resume..." → "Rewriting bullets..." → "Compiling PDF..."
- Redirects to `/editor/:resume_id` on completion

#### `EditorPage.jsx`

**Layout**: Two-panel full-screen
- Left 40%: Controls panel (mode toggle, chat/editor, skill gap, ATS score)
- Right 60%: PDF preview (PDF.js)

**Mode A — AI Chat:**
- Chat interface with message history
- Text input + Send button
- Each response auto-updates preview

**Mode B — Manual + AI Assist:**
- Monaco Editor with resume HTML
- "Improve selection" button → sends highlighted text to AI → pastes suggestion
- Debounced save (800ms) → triggers recompile → updates preview

**ATS Widget (always visible):**
- Circular gauge: score number in center, ring fills based on score
- Below: tabbed breakdown (Keywords | Skills | Format)
- Missing keywords as removable chips (click chip → auto-adds to prompt)
- "Re-score" button

**Download bar (bottom):**
- "Download PDF (LaTeX)" button
- "Download PDF (Web)" button
- "View in new tab" link

#### `HistoryPage.jsx`
- Table/card list of all past resumes
- Columns: Job Title, Company, ATS Score, Date, Actions
- Actions: Download PDF, Re-edit (opens EditorPage), Delete
- ATS score shown as coloured badge (red <60, amber 60-79, green 80+)

### 9.2 Global Components

#### `ATSWidget.jsx`
```jsx
// Props: { score, breakdown, missingKeywords, onRescore, isLoading }
// Renders:
// - SVG circular gauge (score ring)
// - Score number centre
// - Color: red <60, amber 60-80, green 80+
// - Breakdown rows with mini bars
// - Missing keywords list
```

#### `ChatEditor.jsx`
```jsx
// Props: { resumeId, onResumeUpdate }
// State: messages[], inputText, isLoading
// On send: POST /api/chat/message with full conversation_history
// On response: parse updated_resume_json, call onResumeUpdate(newResume)
```

#### `ResumePreview.jsx`
```jsx
// Props: { pdfUrl }
// Uses pdfjs-dist to render PDF in <canvas>
// Shows page controls if > 1 page
// Shows "Page overflow warning" if resume > 1 page
```

### 9.3 Axios Setup

```javascript
// client/src/api/axios.js

import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: '/api',
  timeout: 90000,  // 90s for AI endpoints
  headers: { 'Content-Type': 'application/json' },
});

// Request: attach JWT
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response: handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/auth';
    }
    return Promise.reject(err);
  }
);

export default api;
```

---

## 10. UI/UX Design System

### 10.1 Visual Identity

| Property | Value |
|---|---|
| Primary color | `#111827` (near-black) |
| Accent color | `#6366F1` (indigo-500) |
| Success | `#22C55E` (green-500) |
| Warning | `#F59E0B` (amber-500) |
| Danger | `#EF4444` (red-500) |
| Background | `#F9FAFB` (gray-50) |
| Surface | `#FFFFFF` |
| Border | `#E5E7EB` (gray-200) |
| Font | Inter (UI), Computer Modern Serif (resume preview only) |
| Border radius | `0.5rem` (8px) default, `1rem` (16px) cards |

### 10.2 Typography Scale

| Use | Class | Size |
|---|---|---|
| Page title | `text-3xl font-semibold` | 30px |
| Section heading | `text-xl font-medium` | 20px |
| Card title | `text-base font-medium` | 16px |
| Body | `text-sm` | 14px |
| Caption | `text-xs text-gray-500` | 12px |

### 10.3 Component Patterns

**Primary Button:**
```jsx
<button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
```

**Input Field:**
```jsx
<input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow" />
```

**Card:**
```jsx
<div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
```

**ATS Score Badge:**
```jsx
const badgeColor = score >= 80 ? 'bg-green-100 text-green-800'
                 : score >= 60 ? 'bg-amber-100 text-amber-800'
                 :               'bg-red-100 text-red-800';
<span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badgeColor}`}>{score}/100</span>
```

### 10.4 Loading States

Every AI operation shows a multi-stage progress indicator:

```jsx
// stages: array of strings shown sequentially
const stages = [
  'Reading the job description...',
  'Matching your profile to the role...',
  'Selecting best-fit projects...',
  'Rewriting bullet points...',
  'Building your resume...',
  'Almost there...',
];
// Each stage auto-advances every 8 seconds (approximate NIM timing)
```

### 10.5 Toast Notifications

Use `react-hot-toast` for all feedback:

```javascript
toast.success('Profile saved!');
toast.error('Failed to generate resume. Please try again.');
toast.loading('Uploading resume...');
```

### 10.6 Responsive Breakpoints

| Breakpoint | Layout |
|---|---|
| Mobile (<768px) | Single column, editor below preview |
| Tablet (768-1024px) | Profile wizard full-width, editor stacked |
| Desktop (>1024px) | Two-panel editor, full sidebar |

### 10.7 Empty States

Every list page has an empty state with:
- Relevant icon (SVG, not emoji)
- Short message: "No resumes yet. Apply for a job to get started."
- CTA button

---

## 11. Logging & Error Handling

### 11.1 Winston Logger

```javascript
// server/utils/logger.js

const winston = require('winston');
const config = require('../config');

const logger = winston.createLogger({
  level: config.NODE_ENV === 'production' ? 'warn' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} [${level}] ${message}${metaStr}`;
        })
      ),
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

module.exports = logger;
```

### 11.2 Log Tags (use consistently across codebase)

| Tag | Where | Example |
|---|---|---|
| `[Auth]` | Auth service/controller | `[Auth] User login attempt: Jake` |
| `[Profile]` | Profile operations | `[Profile] Upload received: resume.pdf` |
| `[NIM]` | All NIM calls | `[NIM] analyse_jd completed in 4200ms` |
| `[Template]` | Template fills | `[Template] Building resume HTML` |
| `[Export]` | PDF generation | `[Export] Puppeteer PDF saved: abc.pdf` |
| `[ATS]` | ATS scoring | `[ATS] Score computed: 82/100` |
| `[Chat]` | Chat edits | `[Chat] Edit applied: swap_project` |
| `[DB]` | DB operations | `[DB] Insert resume: uuid-xxx` |
| `[Error]` | Global errors | `[Error] Unhandled: NIM timeout after 60s` |

### 11.3 Async Handler (eliminates try/catch in controllers)

```javascript
// server/utils/asyncHandler.js
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
module.exports = asyncHandler;

// Usage in route:
router.post('/generate', auth, asyncHandler(resumeController.generate));
```

### 11.4 Global Error Middleware

```javascript
// server/middleware/error.middleware.js
const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const code   = err.code   || 'INTERNAL_ERROR';
  const message = err.message || 'Something went wrong';

  logger.error(`[Error] ${req.method} ${req.path} → ${status} ${code}: ${message}`, {
    stack: err.stack,
    userId: req.user?.id,
    body: req.body,
  });

  res.status(status).json({
    success: false,
    error: message,
    code,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
```

### 11.5 Custom Error Classes

```javascript
// server/utils/errors.js
class AppError extends Error {
  constructor(message, status = 500, code = 'APP_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}
class NotFoundError extends AppError {
  constructor(resource) { super(`${resource} not found`, 404, 'NOT_FOUND'); }
}
class AuthError extends AppError {
  constructor(msg = 'Unauthorized') { super(msg, 401, 'UNAUTHORIZED'); }
}
class ValidationError extends AppError {
  constructor(msg) { super(msg, 400, 'VALIDATION_ERROR'); }
}
class NIMError extends AppError {
  constructor(msg) { super(msg, 502, 'AI_SERVICE_ERROR'); }
}
module.exports = { AppError, NotFoundError, AuthError, ValidationError, NIMError };
```

### 11.6 Frontend Error Handling

```javascript
// client/src/api/axios.js — Error interceptor pattern
// All API calls return { data } or throw with err.response.data.error as string
// Components use this pattern:

try {
  const { data } = await resumeApi.generate(jdAnalysisId);
  // success
} catch (err) {
  const message = err.response?.data?.error || 'Something went wrong';
  toast.error(message);
  logger.error('[Resume] Generate failed:', message);
}
```

---

## 12. Security Practices

### 12.1 Auth

- Passwords (passcodes) hashed with bcrypt, 10 rounds — never stored plain
- JWT signed with strong secret, 7-day expiry
- JWT validated in middleware before every protected route
- No sensitive data in JWT payload (just `{ id, name }`)

### 12.2 Input Validation

- All request bodies validated with Zod schemas in middleware before hitting controllers
- File uploads: type-checked (PDF/DOCX only), size-limited (5MB), stored to temp folder, deleted after processing
- SQL injection: impossible via Knex parameterised queries (never raw string interpolation)
- XSS: all user content escaped before template injection via Handlebars auto-escaping

### 12.3 Rate Limiting

```javascript
// Applied per route group:
// AI endpoints: 10 req/min
// Export endpoints: 5 req/min
// Auth endpoints: 20 req/min
// All others: 100 req/min
```

### 12.4 CORS

```javascript
// server/app.js
app.use(cors({
  origin: config.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
```

### 12.5 Helmet

```javascript
app.use(helmet());  // Sets secure HTTP headers
```

---

## 13. Performance Guidelines

### 13.1 Backend

- **NIM calls in parallel where possible** — score + gap detection can run concurrently
- **Stream PDF response** — use `res.sendFile()` not `fs.readFileSync` into buffer
- **Knex connection pool** — min 2, max 10 connections (already configured)
- **Cleanup orphaned files** — delete temp LaTeX dirs after compile
- **Gzip** — `app.use(compression())` on all responses

### 13.2 Frontend

- **Code splitting** — Monaco Editor and PDF.js in separate chunks (already in vite.config)
- **Lazy load pages** — `React.lazy()` + `Suspense` for all page components
- **Debounce** — 800ms debounce on manual editor saves to prevent thrashing
- **Zustand selectors** — always use selectors, never subscribe to whole store

### 13.3 Resume Preview

- PDF.js renders to canvas — no layout reflows
- On resume update: stream new PDF, swap canvas, avoid full page reload
- Show old PDF while new one loads (no flash)

---

## 14. Sprint Build Order

| Sprint | Focus | Deliverable |
|---|---|---|
| 1 | Scaffold + DB | Running Express + React + Postgres, all migrations, auth working |
| 2 | Profile wizard | Complete CRUD for all 7 profile sections, wizard UI |
| 3 | Resume upload + NIM parse | Upload PDF/DOCX → AI extracts → fills profile |
| 4 | JD analysis + AI tailoring | Full pipeline: JD → NIM → ranked items → rewritten bullets |
| 5 | Template + PDF export | Jake's template filled, Puppeteer PDF download working |
| 6 | Skill gap advisor | NIM gap detection, accept/skip UI, ATS score estimate |
| 7 | AI chat editor | Chat mode, live preview update, conversation history |
| 8 | Manual editor | Monaco + live preview split, highlight + AI improve |
| 9 | ATS scorer | NIM ATS score, gauge widget, keyword breakdown, suggestions |
| 10 | History + polish | History page, keyword highlights, ATS trend chart, URL scraper, responsive |

---

## 15. Vibe-Coding Agent Instructions

> This section is the **direct prompt** for any AI coding agent (Cursor, Windsurf, Copilot, etc.) to use when building this project. Paste this as your system context.

---

### AGENT SYSTEM PROMPT

```
You are a senior full-stack engineer building AlignCV — an AI-powered resume tailoring web app.

STACK: React 18 + Vite (frontend) · Node.js 20 + Express 4 (backend) · PostgreSQL 15 + Knex.js · NVIDIA NIM API · Puppeteer · Handlebars · Winston · Zod · Zustand · Tailwind CSS v3

CRITICAL RULES — FOLLOW WITHOUT EXCEPTION:
1. No .env files. All config in server/config/index.js (template in Section 4.1 of PRD).
2. No secrets in code except NIM API key: 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
3. Winston logger with [Tag] prefix on every significant operation. No bare console.log.
4. Every async Express route wrapped in asyncHandler() — zero try/catch in controllers.
5. Global error middleware catches everything and returns { success: false, error, code }.
6. All DB queries use Knex parameterised queries — never string interpolation.
7. All NIM API calls go through nimService.nimCall() — never direct fetch elsewhere.
8. Resume template: Jake's Resume from resume.lol, Computer Modern Serif font, HTML via Handlebars.
9. PDF export: Puppeteer (primary) + Tectonic LaTeX (secondary). Both must work.
10. 1-page resume enforced: PDF.js page count check; warn user if overflow.
11. All request bodies validated with Zod schema in middleware before controller.
12. Rate limit AI endpoints: 10 req/min. Export: 5 req/min.
13. Frontend: Zustand for state, Axios with JWT interceptor, react-hot-toast for feedback.
14. All loading states show multi-stage progress text (see Section 10.4).
15. NIM calls retry 3x with exponential backoff on failure.
16. Each NIM prompt function is named and labelled (see Section 7.2 for all 7 prompts).
17. File structure must match Section 3 exactly — one file per concern.
18. Migrations in db/migrations/, one file per table, numbered 001–010.
19. API responses always: { success: true, data: {...} } or { success: false, error, code }.
20. CORS restricted to localhost:3000 in dev.

DATABASE: PostgreSQL on localhost:5432, db: aligncv, user: postgres, pass: postgres.

AI MODEL: meta/llama-3.1-70b-instruct via https://integrate.api.nvidia.com/v1/chat/completions
Always set response_format: { type: 'json_object' } for structured prompts.
Always set temperature: 0.2 for consistency.
Always retry 3x with 1s/2s/3s backoff.

WHEN BUILDING A FEATURE:
1. Write migration first (if new table needed).
2. Write Zod validation schema.
3. Write DB query functions.
4. Write service function (business logic).
5. Write controller (thin — just call service, return response).
6. Wire route.
7. Write React API function.
8. Write React component/page.
9. Test the full flow manually.

RESUME TEMPLATE: Use Handlebars to fill server/templates/jake_resume.template.html.
The template uses Computer Modern Serif font loaded from resume.lol CDN.
Section order: Education → Experience → Projects → Technical Skills → Achievements → Certifications.
All sections conditional ({{#if SECTION}}) — only render if data exists.

ATS SCORING WEIGHTS:
- keyword_match: 35%
- skills_match: 25%
- experience_relevance: 20%
- section_completeness: 10%
- format_score: 10%

SKILL GAP: Only suggest skills the user could plausibly add given their background.
Max 5 suggestions. Sort by estimated ATS boost descending.

PDF GENERATION PRIORITY: Try Puppeteer first. If Puppeteer fails, return error with message
"HTML-PDF export failed" — do not silently fall back.

EDITOR MODES:
- Chat mode: POST /api/chat/message → NIM applies edit → recompile → update preview
- Manual mode: Monaco editor + save → POST /api/resume/:id/source → recompile → update preview
Both modes must update the PDF preview without full page reload.

LOG EVERYTHING:
[NIM] before and after every AI call with duration
[DB] before and after every DB write
[Export] on PDF generation start and finish
[Error] on every caught error with stack trace
```

---

### Setup Commands for Agent

```bash
# 1. Clone and install
mkdir aligncv && cd aligncv
git init

# Backend
mkdir server && cd server
npm init -y
npm install express knex pg bcryptjs jsonwebtoken zod winston cors helmet compression multer pdf-parse mammoth puppeteer handlebars uuid express-rate-limit
npm install --save-dev nodemon
cd ..

# Frontend
npm create vite@latest client -- --template react
cd client
npm install axios zustand react-router-dom react-hot-toast pdfjs-dist monaco-editor @monaco-editor/react recharts
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
cd ..

# Database (Docker)
docker run --name aligncv-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=aligncv -p 5432:5432 -d postgres:15

# Run migrations
cd server && npx knex migrate:latest
```

---

*End of AlignCV PRD v1.0*
*Built for: freshers, students, job seekers*
*Goal: From job description to download-ready resume in under 60 seconds.*