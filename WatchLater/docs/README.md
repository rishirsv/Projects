# 📄  YouTube Watch-Later Summarizer

Turn any YouTube URL into a concise, well-structured Markdown summary — all on your laptop, no backend server.

---

## 🏗  Architecture (MVP)

```
repo-root/
├── docs/                # PRD, task list, design notes
├── prompts/             # .md prompt templates
├── exports/
│   ├── summaries/       # saved Markdown outputs (git-ignored)
│   └── transcripts/     # saved transcript text files (git-ignored)
├── src/
│   ├── App.tsx         # tiny React UI (URL input + preview)
│   └── api.ts          # youtube-transcript + Gemini API calls
└── .env                # GEMINI_API_KEY
```

* **Front-end** Vite + React (≈ 100 LOC)  
* **Processing** Direct API integration  
  * **youtube-transcript** grabs captions from GitHub  
  * **Gemini 2.5 Flash** generates summary  
  * **Local storage** saves Markdown files  
* **No server** code to maintain — runs entirely in browser.

---

## 🚀  Quick-start (⏱ 3 min)

```bash
# 1 · Clone & install
git clone https://github.com/<you>/watchlater.git
cd watchlater && npm install

# 2 · Create .env
echo "GEMINI_API_KEY=your_gemini_key_here" > .env

# 3 · Run dev server
npm run dev     # http://localhost:5173
```
