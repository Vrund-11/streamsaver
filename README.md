# StreamSaver HD — Video Downloader

StreamSaver HD is a premium Windows desktop application for downloading videos in high definition (4K, 1080p, 720p) and extracting MP3 audio. 

This repository contains the complete source code, custom dark glassmorphism design system, and packaged binaries.

---

## 🤖 Antigravity AI Assistant Prompts (Copy & Paste)

If you are using the **Antigravity AI Assistant**, you don't need to worry about typing terminal commands or configuring code. Just copy and paste the prompt you want below directly into the chat:

### 1. To run and test the app locally
Copy and paste this prompt:
> **Prompt**: Please install any missing node dependencies, start the development server, and open the StreamSaver HD app in Electron so I can run and test it on my screen.

### 2. To compile a portable `.exe` file (to share and test)
Copy and paste this prompt:
> **Prompt**: Build the portable Windows installer executable (.exe) by running the build script, and point me to the exact absolute path of the finished .exe file so I can share it with others.

### 3. To build the final package for Microsoft Store
Copy and paste this prompt:
> **Prompt**: Help me build the final Windows Store package. Check my package.json for the 'appx' fields, ask me for my Partner Center credentials (Identity Name, Publisher ID, Publisher Display Name), write those values into the package.json, run the build:msix command, and output the exact path of the generated .appx package when completed.

---

## 📁 Technical Project Structure

```text
src/
  main/
    index.js          — Electron main process, window creation & IPC channels
    downloader.js     — yt-dlp download pipeline configuration
    store-license.js  — Windows Store API integration and subscription verification
  preload/
    index.js          — Secure context isolation bridge (electronAPI)
  renderer/
    index.html        — Main HTML entrypoint (contains the CSP definition)
    main.jsx          — React rendering engine entry
    App.jsx           — Core app component & startup popup sequences
    components/
      TitleBar.jsx    — Custom title bar (minimize, maximize, close buttons)
      UrlInput.jsx    — Prefillable URL video input bar
      VideoCard.jsx   — Resolution selector & target save folder panel
      ProgressBar.jsx — Real-time percentage & speed progress indicators
      SubscriptionGate.jsx — Pro monthly/yearly plan paywall overlay
      RatingPopup.jsx — Star feedback popups
      PrivacyPolicy.jsx — Scrollable terms of privacy modal
    styles/
      app.css         — CSS design system (glassmorphism rules)
resources/
  yt-dlp.exe          — Bundled downloader binary engine
  ffmpeg.exe          — Bundled media processor binary engine
assets/
  icon.ico            — StreamSaver HD system icon
```

---

## 🛠 Manual Command Line Interface (CLI)

If you prefer using the command line manually, you can run these commands:

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Start Dev Mode (Hot-reloading)**:
   ```bash
   npm run dev
   ```
3. **Build Portable `.exe`**:
   ```bash
   npm run build:exe
   ```
4. **Build Store `.appx` Package**:
   ```bash
   npm run build:msix
   ```

---

## 💎 Free vs Pro Verification Logic
The application enforces subscription verification locally:
* **Free Tier**: Limited to 720p maximum quality, max 1 download per day, no MP3 extraction.
* **Pro Tier**: 4K, 1080p, 60fps quality enabled, unlimited downloads, MP3 audio extraction unlocked.
