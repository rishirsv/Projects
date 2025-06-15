# Project Overview

This project contains code, prompts, and configuration files for automation and scripting tasks. It is structured for compatibility with OpenAI Codex and similar AI code assistants.

## Structure

- `src/` - Python source code
- `Prompts/` - Prompt and instruction files
- `tests/` - Test scripts (optional)
- `appsscript.json` and related files - Google Apps Script configuration (if used)

## Setup

1. (Optional) Create a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

- Place your Python scripts in the `src/` directory.
- Place prompt files in the `Prompts/` directory.
- Run scripts as needed:
   ```bash
   python src/<your_script>.py
   ```

## Notes
- If using Google Apps Script, keep those files at the root or in their own folder.
- Update `requirements.txt` as you add Python dependencies.
