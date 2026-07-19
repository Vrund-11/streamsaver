# StreamSaver HD — Video Downloader

A fast, modern Windows desktop app for downloading videos from YouTube and 1000+ other video sites in 4K, 1080p, 720p, and MP3.

## Tech Stack
- **Electron 31** + **React 18** + **Vite 5**
- **yt-dlp** + **ffmpeg** (bundled binaries — no install needed by users)
- **Microsoft Store** in-app subscriptions (INR)

## Project Structure
```
src/
  main/
    index.js          — Electron main process, window & IPC
    downloader.js     — yt-dlp download engine
    store-license.js  — MS Store subscription checker
  preload/
    index.js          — Secure IPC bridge
  renderer/
    index.html        — HTML root
    main.jsx          — React entry
    App.jsx           — Root app component
    components/
      TitleBar.jsx
      UrlInput.jsx
      VideoCard.jsx
      ProgressBar.jsx
      SubscriptionGate.jsx
      DownloadHistory.jsx
    styles/
      app.css         — Full design system
resources/
  yt-dlp.exe          — Bundled downloader binary
  ffmpeg.exe          — Bundled media processor
assets/
  icon.ico            — App icon
```

## Commands
```bash
npm run dev         # Start in development (hot-reload)
npm run build       # Build .exe + .msix in dist/
npm run build:exe   # Build only .exe installer
npm run build:msix  # Build only .msix for Microsoft Store
```

## Output Files (in dist/)
- `StreamSaver HD Setup 1.0.0.exe` — Share on WhatsApp / direct install
- `StreamSaver HD 1.0.0.appx`      — Upload to Microsoft Partner Center

## Free vs Pro
| Feature        | Free | Pro (₹99/mo or ₹499/yr) |
|----------------|------|--------------------------|
| Max resolution | 720p | 4K / 1080p / 1080p60fps  |
| Daily limit    | 5    | Unlimited                |
| MP3 extraction | ❌   | ✅                       |
