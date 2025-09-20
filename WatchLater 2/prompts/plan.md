# Beginner-Friendly Project Plan

## New Directory Structure
Here's the proposed structure to make the project more accessible to beginners, following standard Vite conventions:

```
WatchLater/
├── public/
│   └── index.html        # Main HTML file
├── src/
│   ├── components/        # React components
│   │   └── App.tsx       # Main application component
│   ├── styles/           # Stylesheets
│   │   └── index.css
│   └── main.tsx          # Application entry point
├── .gitignore            # Git ignore file
├── package.json          # Node.js dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite build configuration
├── data/
│   └── metadata.json     # Project metadata
├── docs/
│   └── README.md         # Setup instructions
└── prompts/              # AI and project prompts
    ├── create-prd.md
    ├── generate-tasks.md
    ├── process-task-list.md
    ├── gemini-review-prompt.md
    └── youtube-transcripts.md
```

## Steps for New Structure
1. **Create** the `src`, `public`, `docs`, and `data` directories.
2. **Move** React components to `src/components`.
3. **Create** `src/main.tsx` as the application entry point.
4. **Move** `index.html` to the `public` folder.
5. **Place** configuration files (`vite.config.ts`, `package.json`, `tsconfig.json`) in the root directory.
6. **Move** metadata to the `data` folder.

## Setup Guide
1. Ensure Node.js is installed.
2. Run `npm install` to install dependencies.
3. Set the `GEMINI_API_KEY` in `.env.local`.
4. Start the development server with `npm run dev`.

This plan aims to make the project more intuitive by grouping similar files together and providing extensive documentation for beginners to easily set up and contribute to the project.
