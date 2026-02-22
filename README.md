# CBO Prep 🧬

An AI-powered biology exam prep app that sends your student **daily flashcards and quizzes** by email — automatically, every day, even when your computer is off.

Built for the Canadian Biology Olympiad (CBO) / National Biology Competition (NBC), but works for any biology exam.

**Live demo:** https://cbo-prep.vercel.app

---

## Features

- 📚 **Daily flashcards** — AI-generated each morning, weighted toward weak topics
- 🧪 **Daily pop quiz** — 10 questions, 15-minute timer, instant explanations
- 📝 **Full exam simulation** — timed 40-question exam with per-topic results
- 📊 **Progress tracking** — topic heatmap, score history, adaptive weights
- 📧 **Automatic emails** — morning delivery + afternoon reminder, no Mac required
- 🤖 **Adaptive learning** — weak topics get more coverage over time

---

## How to Deploy Your Own Copy

### 1. Clone the repo

```bash
git clone https://github.com/codergirl1387/cbo-prep.git
cd cbo-prep
npm install
```

### 2. Get your API keys

You need accounts on three free services:

**Anthropic (Claude AI)**
- Sign up at https://console.anthropic.com
- Create an API key

**Turso (cloud database)**
- Sign up at https://turso.tech
- Install CLI: `brew install tursodatabase/tap/turso`
- Login: `turso auth login`
- Create DB: `turso db create my-prep-app`
- Get URL: `turso db show my-prep-app --url`
- Get token: `turso db tokens create my-prep-app`

**Gmail (for sending emails)**
- Enable 2-factor authentication on your Gmail account
- Go to https://myaccount.google.com/apppasswords
- Create an App Password for "Mail"
- Copy the 16-character password it gives you

### 3. Set up environment variables

Create a `.env.local` file in the project root:

```env
ANTHROPIC_API_KEY=sk-ant-...
EMAIL_USER=youremail@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx   # Gmail App Password (16 chars)
RECIPIENT_EMAIL=student@gmail.com
RECIPIENT_NAME=StudentName
EXAM_DATE=2026-04-09
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=eyJhbGci...
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
```

### 4. Deploy to Vercel

```bash
npm install -g vercel
vercel login
vercel --prod
```

Then add all your environment variables in the Vercel dashboard under **Settings → Environment Variables**.

### 5. Seed the question bank

Once deployed, open your app locally (`npm run dev`) and click **"Download Questions"** on the dashboard. This downloads past NBC exam PDFs and populates your database with ~500+ questions. Only needs to be done once.

### 6. Verify cron jobs

Go to your Vercel project → **Settings → Cron Jobs**. You should see two jobs:
- `0 11 * * *` → 6:00 AM EST (generates content + sends morning email)
- `40 19 * * *` → 2:40 PM EST (sends reminder email)

That's it — emails will go out every day automatically.

---

## Tech Stack

| | |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| Database | [Turso](https://turso.tech) (cloud SQLite) |
| AI | [Anthropic Claude](https://anthropic.com) API |
| Hosting | [Vercel](https://vercel.com) + cron jobs |
| Email | Nodemailer + Gmail SMTP |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Animation | Framer Motion |

---

## Local Development

```bash
npm run dev
# App runs at http://localhost:3000
```

The app works fully locally too — it connects to the same Turso cloud DB.

---

## Question Bank

Questions are sourced from the [National Biology Competition (NBC)](https://www.biocomp.utoronto.ca/) at the University of Toronto — freely available past papers from 2015–2024 (~500+ questions across 9 biology topics).
