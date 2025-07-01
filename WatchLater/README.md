# WatchLater: YouTube Video Summarizer

WatchLater is a local-only React application designed to help you quickly get AI-generated summaries of YouTube videos. Simply paste a YouTube URL, and the app will fetch the transcript, summarize it using Google's Gemini AI, display the summary, and save it as a local Markdown file.

## Features

-   **YouTube URL Processing:** Accepts standard YouTube URLs.
-   **Transcript Fetching:** Automatically attempts to retrieve video transcripts.
-   **AI Summarization:** Utilizes Google Gemini 1.5 Flash for concise summaries.
-   **Local Storage:** Saves generated summaries as Markdown files for easy access and versioning.
-   **Minimalist UI:** Focuses on core functionality with a clean, simple interface.

## Technologies Used

-   **Frontend:** React, Vite, TypeScript
-   **Backend:** Node.js, Express
-   **AI Integration:** Google Generative AI (Gemini 1.5 Flash)
-   **YouTube Transcript:** `youtube-transcript` library

## Project Structure

This section explains the purpose of each major folder and file in the project, with extra detail to help anyone—even those new to web development—understand how everything fits together.

-   **src/**: This is the main folder for all the code that runs in your web browser (the frontend). It contains everything related to what you see and interact with on the website.
    -   `main.tsx`: This is the entry point for the React application. When the app starts, this file is the first to run. It sets up the React environment and tells the browser where to display the app on the page.
    -   `components/App.tsx`: This is the main component of the application. In React, a component is like a building block for the user interface. `App.tsx` brings together all the smaller pieces and controls the overall layout and logic of the app.
    -   `services/summarizer.ts`: This file contains code that handles the process of summarizing YouTube videos. It communicates with the Gemini AI service, sending the video transcript and receiving a summary in return. It acts as a bridge between the app and the AI.
    -   `styles/index.css`: This file contains the styles (colors, fonts, spacing, etc.) that make the app look visually appealing. It ensures the app has a consistent and attractive appearance.

-   **server/**: This folder contains code that runs on your computer (the backend), not in the browser. The backend handles tasks that require more security or access to external services, such as talking to the Gemini AI or managing files.
    -   `index.ts`: This is the main entry point for the backend server. It listens for requests from the frontend (like when you ask for a summary) and coordinates the necessary actions, such as fetching transcripts or calling the AI service.

-   **public/**: This folder holds static files that are directly served to your browser, such as images, icons, or the main HTML file. These files don't change when the app runs and are accessible to anyone using the app.

-   **node_modules/**: This is a special folder automatically created by npm (Node Package Manager) when you install dependencies. It contains all the third-party code libraries that your project needs to work. You don't edit anything here; it's managed for you.

-   **package.json**: This file lists all the dependencies (external code libraries) your project needs, as well as scripts for running and building the app. It also contains metadata like the project name and version. It's essential for managing and sharing your project.

-   **index.html**: This is the main HTML file for the app. It provides the basic structure of the web page and includes a placeholder where the React app will appear. The browser loads this file first when you open the app.

-   **tsconfig.json**, **vite.config.ts**: These are configuration files. `tsconfig.json` tells the TypeScript compiler how to check and build your code, ensuring it's correct and efficient. `vite.config.ts` configures Vite, the tool that builds and serves your app during development, making it fast and easy to work with.

-   **docs/**: This folder contains documentation files, such as product requirements or design documents. For example, `prd-youtube-summarizer.md` describes what the app should do and how it should work. These files help guide development and keep everyone on the same page.

-   **prompts/**: This folder stores prompt templates used for AI summarization. These are special text files that tell the Gemini AI how to summarize a video, ensuring the summaries are clear and useful.

-   **data/**: This folder is used to store application data, such as metadata about videos or saved summaries. It helps the app remember information between sessions or keep track of what's been summarized.

-   **tasks/**: This folder contains lists of tasks, to-dos, or issues that need to be addressed in the project. It's useful for tracking progress and planning future work.

-   **.gitignore**: This file tells Git (the version control system) which files and folders it should ignore. For example, it usually ignores `node_modules/` and sensitive files, so they aren't accidentally shared or uploaded.

-   **.env.local**: This file stores environment variables, such as your Gemini API key. Environment variables are secret values needed for the app to work but should not be shared publicly. This file is not included in version control for security reasons.

## Getting Started

To get started with WatchLater:

1.  **Install dependencies:**
    ```bash
    npm install
    ```
    This will install all required packages.

2.  **Set up environment variables:**
    Create a file named `.env.local` in the project root and add your Google Gemini API key:
    ```
    GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
    ```
    Replace `YOUR_GEMINI_API_KEY_HERE` with your actual key from Google Cloud or AI Studio.

3.  **Start the development server:**
    ```bash
    npm run dev
    ```
    This will start the application, and you can access it in your web browser.
