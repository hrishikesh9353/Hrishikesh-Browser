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

## Notes

- Browser preferences are stored locally on the device.
- Cross-device account sync and hosted AI are not configured.
- Windows may show a security warning for an unsigned installer. A code-signing setup is not included.
