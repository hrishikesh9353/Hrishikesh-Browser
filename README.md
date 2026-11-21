# Hrishikesh Browser

Hrishikesh is a Windows-first desktop browser built with Electron, React, and Vite. It includes browser tabs and navigation, a customizable start page, shortcuts, bookmarks, gaming controls, and the HRX AI interface.

## Run locally

Install [Node.js](https://nodejs.org/) and then run:

```powershell
npm install
npm run dev
```

## Build an installer

```powershell
npm run build:win
```

The installer is written to the `dist` folder.

## HRX AI

HRX AI connects to an Ollama service running on this computer at `http://127.0.0.1:11434`. Install Ollama and download a model before using the chat. Prompts are sent to that local service; this project does not include a hosted AI service or model weights.

## Local backend and saved data

The Electron main process is the local backend for the desktop app. It keeps browser preferences, shortcuts, bookmarks, and HRX AI conversation history in Electron's per-user data folder. AI chat history is limited to the latest 200 messages; incognito windows do not read or save that history. Passwords use Electron's operating-system encryption when it is available, and browser site data uses a persistent Chromium profile.

This local backend does not sync data to GitHub or another computer. A shared service for other users needs a hosted API, database, and account authentication; none are configured in this repository yet.

## Notes

- Preferences and HRX AI chat history stay on this device.
- Cross-device account sync and hosted AI are not configured.
- Windows may show a security warning for an unsigned installer. A code-signing setup is not included.
