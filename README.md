# Hrishikesh Browser

Hrishikesh is a Windows-first desktop browser built with Electron, React, and Vite. It includes browser tabs and navigation, a customizable start page, shortcuts, bookmarks, gaming controls, and the HRX AI interface.

## Run locally

Install [Node.js](https://nodejs.org/) and then run:

```powershell
npm install
npm run dev
```

The optional local model can be installed with Ollama:

```powershell
ollama pull llama3.2
ollama pull llama3.2-vision
```

The vision model is large; install it only if you want local image analysis. The app will explain when the configured model is missing.

## Build an installer

```powershell
npm run build:win
```

The configured Windows package output is `release/win-x64`. `npm run build` also produces the production web renderer at `out/renderer`.

## Android wrapper

The Capacitor wrapper renders the standalone home experience; it is not a full multi-tab Android browser. To sync and build it:

```powershell
npm install
npm run build
npx cap sync android
npx cap open android
```

Build and launch the Android app from Android Studio on an emulator or device. Electron-only tab/session APIs do not run in the Android wrapper.

## Render API deployment

`render.yaml` defines the `hrishikesh-api` Node service with `backend` as its root. Connect the GitHub repository in Render and configure `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, and `ALLOWED_ORIGINS` in Render's Environment settings. The secret key belongs only in Render's secret environment variables. `HRX_AI_URL` and `HRX_AI_API_KEY` are optional; without them, hosted AI reports unavailable. Render checks `/health` after deployment.

## HRX AI

HRX AI connects to an Ollama service running on this computer at `http://127.0.0.1:11434`. Install Ollama and download a model before using the chat. Prompts are sent to that local service; this project does not include a hosted AI service or model weights. Text responses stream from Ollama and can be stopped. Chat titles, pinning, search, and persona settings are saved locally in this browser profile. Generated fenced code has copy/save controls and a sandboxed HTML/JavaScript preview. Text and code file attachments are sent to the local model; images require a vision model, for example `ollama pull llama3.2-vision`.

AI limitations: Supabase conversation sync, PDF text extraction, regenerate, and persistent image attachments are not implemented. Image analysis was not run in this environment because no vision model is installed. Local text streaming was verified against the installed Ollama service; the desktop UI path was not end-to-end exercised in this phase.

The optional AI Agent mode is off by default. When enabled, the AI can propose only `open_tab`, HTTP/HTTPS `navigate`, `add_bookmark`, `add_shortcut`, `set_theme`, `switch_workspace`, `screenshot`, or `save_code`. The user must click to review a proposal, and settings/bookmark/shortcut/file changes request confirmation. It cannot execute shell commands or delete data. Actions are logged locally. Agent actions are suggestion-driven; the model does not run app commands silently.

## Local backend and saved data

The Electron main process is the local backend for the desktop app. It keeps browser preferences, shortcuts, bookmarks, and HRX AI conversation history in Electron's per-user data folder. AI chat history is limited to the latest 200 messages; incognito windows do not read or save that history. Passwords use Electron's operating-system encryption when it is available, and browser site data uses a persistent Chromium profile.

This local backend does not sync data to GitHub or another computer. A shared service for other users needs a hosted API, database, and account authentication; none are configured in this repository yet.

For the Node backend, copy `backend/.env.example` to `backend/.env.local` and fill it locally. `.env.local` and other environment files are ignored by Git and excluded from the Windows package. On Render, set those values in the service's Environment dashboard; never put the Supabase secret key in source or a committed `.env` file. Authenticated API endpoints verify the Supabase bearer token before accessing account data or hosted AI.

Electron renderer security uses context isolation, disabled Node integration, sandboxed renderer and web views, a restrictive Content Security Policy, denied new windows, and local-only top-level navigation for the application shell. IPC handlers accept calls only from the top-level Hrishikesh window; untrusted website views do not receive the preload API.

## Notes

- Preferences and HRX AI chat history stay on this device.
- Cross-device account sync and hosted AI are not configured.
- Windows may show a security warning for an unsigned installer. A code-signing setup is not included.

## Original interface audio

The browser's own interface uses short Web Audio tones for clicks, pointer hover, keyboard focus, and navigation-key feedback. The home-page wordmark has a brief original launch animation. Sound effects, launch cue, and hover cues have separate saved switches; the volume slider and preview are in Mods → Interface & sound. These controls do not inject audio into websites opened in browser tabs.

Browsers and embedded web views generally require a user gesture before audio can play. For that reason, the launch cue is queued until the first pointer or keyboard interaction after opening the app. Web Audio may also be unavailable or muted by operating-system/device settings; the interface continues to work without sound. Reduced-motion preferences disable the wordmark animation.

## Screenshots and recordings (Electron desktop)

Use the capture icon beside the address bar, or press `Ctrl+Shift+S` for a screenshot and `Ctrl+Shift+R` to start/stop a recording. Screenshots can capture the primary display, the current web tab, or the Hrishikesh renderer window; a tab screenshot can be cropped by dragging its preview. PNG and WebM saves use a native save dialog, and full screenshots can be copied to the clipboard. The recorder uses the operating system's display chooser and supports WebM; it requests system audio and microphone separately when selected. The capture panel stores screenshot/recorder enable switches locally.

Capture limitations: the display chooser may include another app/window if the user selects it. The current Screen Shield status is only a UI indicator and does not enable Electron/OS capture protection. DRM/protected video may be black. MP4 export, choosing an arbitrary default folder, crop-to-clipboard, configurable hotkey bindings, and 2K/4K recording presets are not implemented. System audio availability depends on the OS and selected capture source; microphone permission is requested by the OS.
