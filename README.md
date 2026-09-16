# ⚡ PRO DJ AUTOMIXER — AI-Powered Web DJ Console

<div align="center">

[![Live Demo](https://img.shields.io/badge/LIVE%20DEMO-OPEN%20DJ%20MIXER-00ff88?style=for-the-badge&logo=google-chrome&logoColor=black)](https://ritesh-we.github.io/DJ-RITESH/)
[![GitHub](https://img.shields.io/badge/GitHub-DJ--RITESH-00f0ff?style=for-the-badge&logo=github&logoColor=black)](https://github.com/RITESH-we/DJ-RITESH)
[![React](https://img.shields.io/badge/React-18-blue.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-purple.svg?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Spotify Web API](https://img.shields.io/badge/Spotify-VIP%20Streaming-1db954.svg?style=for-the-badge&logo=spotify)](https://developer.spotify.com/)

**Turn your browser or mobile phone into a full-scale Pioneer CDJ club console with automated beatmatching, harmonic Camelot mixing, tactile touchscreen vinyl scratching, and direct Spotify integration.**

[🚀 Open Live App](https://ritesh-we.github.io/DJ-RITESH/) • [📱 Mobile & Laptop Features](#-mobile--laptop-responsive-console) • [🎧 How to Play](#-how-to-play-music-step-by-step) • [🔑 Device Verification](#-one-time-device-verification) • [⌨️ Keyboard Shortcuts](#-dj-keyboard-shortcuts)

</div>

---

## 🌟 Key Features

* 🎛️ **Dual Pioneer-Style Hardware Decks**:
  * Realistic vinyl jogwheels with tactile scratching, pitch bending, and spinbacks.
  * Real-time 60 FPS animated audio waveforms, cue flags, and loop indicators.
  * 4 Hot Cue pads per deck, beat sync, and variable tempo pitch slider ($\pm 16\%$).
* 📱 **Mobile & Laptop Responsive Console**:
  * **Touchscreen Vinyl Scratching**: Native multi-touch gesture support (`touchstart`, `touchmove`, `touchend`) with gesture locking so you can scratch on mobile without page scrolling.
  * **Dedicated Mobile Console Switcher**: Toggle instantly between `[⚡ ALL CONSOLE]`, `[🔵 DECK A]`, `[🎛️ MIXER]`, and `[🔴 DECK B]`.
* 🛡️ **One-Time Device Verification**:
  * Authorize your phone, tablet, or laptop **once**, and it is **permanently remembered** in `localStorage`.
  * **Never asks again!** Next time you open the app, it instantly launches straight into full DJ mixing mode.
* 🎵 **5+ Minute Extended Real Audio Playback**:
  * Dynamic high-definition audio streaming decoded directly through the Web Audio API.
  * Proprietary sinusoidal 50ms crossfade cross-looping extends tracks to **5+ minutes** with zero clicks or dropouts.
* 🤖 **Smart Auto-DJ Transition Engine**:
  * Hands-free club mixing: automated beatmatching, Camelot harmonic key compatibility, bass-swapping, and outro loop smoothing.
* 🟢 **Spotify VIP & Personal OAuth Library**:
  * **Instant 1-Click VIP Pro Access**: Instant access to curated playlists, global top charts, and search across 100M+ songs.
  * **Personal Account Link**: Connect your personal Spotify account via OAuth 2.0 PKCE to spin your private playlists.
* 🔊 **Studio-Grade DSP Processing Strip**:
  * 3-Band isolator EQ with complete kill switches ($-24\text{ dB}$ to $+6\text{ dB}$).
  * Bi-directional resonant sweep filter (Low-Pass $\leftrightarrow$ High-Pass).
  * Smooth crossfader with configurable curves and stereo LED peak/RMS VU meters.

---

## 🚀 Live App (Ready to Spin)

Experience the DJ mixer directly in any modern browser on laptop, tablet, or smartphone:

👉 **[https://ritesh-we.github.io/DJ-RITESH/](https://ritesh-we.github.io/DJ-RITESH/)**

---

## 🎧 How to Play Music (Step-by-Step)

### 1. Open the App
Visit [https://ritesh-we.github.io/DJ-RITESH/](https://ritesh-we.github.io/DJ-RITESH/) or run it locally.

### 2. Enable Web Audio
Click the pulsing green **`▶ ENABLE AUDIO`** button at the top to activate the browser's hardware-accelerated audio engine.

### 3. Verify Device (Done Once per Device)
Click **`🔑 Verify Device`** (or open the Spotify modal):
* **Recommended (1-Click)**: Tap **`⚡ VERIFY & UNLOCK THIS DEVICE`** for instant VIP Pro access. Your device is permanently authorized and will never prompt again!
* **Optional**: Log in with your personal Spotify account via the expandable login card.

### 4. Load Tracks onto the Decks
* **From Playlists**: Open your Spotify Library, click **`🎧 Load All`** on any playlist (e.g. *Club Bangers*, *Desi Hits*, *Afrobeats*, *Techno*), and Track 1 goes to **Deck A** while Track 2 goes to **Deck B**.
* **Individual Tracks**: Click **`A`** or **`B`** next to any song to load it directly onto that deck.
* **Via Search**: Use the **`🔍 Search Catalog`** tab to search any song or artist across 100M+ tracks.
* **Via AI Vibe Mix**: Click **`✨ AI Vibe Mix`**, choose your mood (*Late Night Club*, *Festival Mainstage*, *Sunset Lounge*), genre, and target BPM.

### 5. Mix, Scratch, and Perform
* **Play / Pause**: Click **PLAY** or press <kbd>SPACE</kbd>.
* **Scratch**: Click & drag (or touch & drag on your phone) the vinyl platter.
* **Mix to the other Deck**:
  * **Automated**: Press <kbd>TAB</kbd> (or click **`⚡ AUTO-DJ`**) to trigger a smooth beatmatched transition.
  * **Manual**: Slide the central crossfader or use <kbd>◄</kbd> and <kbd>►</kbd> arrow keys.
* **Drops & Buildups**: Cut the low frequencies using the **LOW** knob or turn the **FILTER** knob for sweep effects!

---

## 📱 Mobile & Laptop Responsive Console

| Desktop / Laptop View | Mobile Smartphone View |
| :--- | :--- |
| **Side-by-side Pioneer 3-chassis layout**: Deck A on the left, hardware mixer in the center, Deck B on the right. | **Touch-optimized console switcher**: Switch seamlessly with the top tabs between `[⚡ ALL]`, `[🔵 DECK A]`, `[🎛️ MIXER]`, and `[🔴 DECK B]`. |
| Full 180px vinyl jogwheels, wide crossfader, multi-column playlist table. | Fullscreen tactile deck, large touch-friendly pads, responsive faders with gesture lock. |

---

## ⌨️ DJ Keyboard Shortcuts

| Shortcut | Action | Description |
| :---: | :--- | :--- |
| <kbd>SPACE</kbd> | **Play / Pause** | Toggles playback on the active deck |
| <kbd>TAB</kbd> | **Mix Now** | Triggers instantaneous smart auto-transition |
| <kbd>◄</kbd> | **Crossfader Left** | Moves crossfader toward Deck A |
| <kbd>►</kbd> | **Crossfader Right** | Moves crossfader toward Deck B |
| <kbd>1</kbd> - <kbd>4</kbd> | **Hot Cues A** | Jump to drop cue points on Deck A |
| <kbd>5</kbd> - <kbd>8</kbd> | **Hot Cues B** | Jump to drop cue points on Deck B |

---

## 🛠️ Architecture & Codebase

```
dj-mixer/
├── src/
│   ├── audio/
│   │   ├── audioEngine.js       # Web Audio graph, 5+ min loop tiling, real audio resolution, scratch physics
│   │   └── autoDjEngine.js      # Auto-DJ transition curves, BPM alignment, Camelot harmonic sorting
│   ├── components/
│   │   ├── Deck.jsx             # CDJ hardware chassis, pitch tempo slider, hot cue triggers
│   │   ├── JogWheel.jsx         # Touch & mouse physics-based scratch vinyl platter
│   │   ├── WaveformDisplay.jsx  # 60fps dynamic audio waveform canvas
│   │   ├── MixerCenter.jsx      # Hardware mixer strip with crossfader, master volume, and VU meter
│   │   ├── PlaylistManager.jsx  # Track library, queue management, and drag-and-drop
│   │   ├── SpotifyAccountBrowser.jsx # One-time device verification portal, playlist browser, catalog search
│   │   ├── SpotifyModal.jsx     # Direct Spotify link importer & catalog search
│   │   └── VibeMixModal.jsx     # AI harmonic set generator (Camelot Wheel)
│   └── services/
│       └── spotifyService.js    # Persistent device verification, Spotify OAuth 2.0 PKCE, audio stream resolution
├── dist/                        # Production build deployed live to GitHub Pages
├── deploy-gh-pages.js           # Automated GitHub Pages build & subtree deployment script
└── vite.config.js               # Vite build configuration with relative asset paths
```

---

## 💻 Local Development Setup

### Prerequisites
* [Node.js](https://nodejs.org/) (v18.0.0 or higher)
* Modern web browser with Web Audio API support (Chrome, Brave, Edge, Safari, Firefox)

### Steps
```bash
# 1. Clone repository
git clone https://github.com/RITESH-we/DJ-RITESH.git
cd DJ-RITESH

# 2. Install dependencies
npm install

# 3. Launch development server
npm run dev

# 4. Open in browser
http://127.0.0.1:5173/
```

### Build & Deploy to GitHub Pages
```bash
# Build production bundle and push to gh-pages branch
npm run deploy
```

---

## 🟢 Spotify Developer App Setup (Optional for Custom Client ID)

If you wish to authenticate with your own Spotify Developer Client ID:

1. Log in to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Click your app and go to **Settings**.
3. In **Redirect URIs**, add both:
   ```text
   https://ritesh-we.github.io/DJ-RITESH/
   https://ritesh-we.github.io/DJ-RITESH
   ```
   *(For local testing, also add `http://127.0.0.1:5173/`)*
4. Click **Save** at the bottom of the page.
5. In the DJ app, click **`🔑 Verify Device`** ➔ **`Show Login ▼`** ➔ paste your Client ID ➔ click **`LOG IN SPOTIFY`**.

---

## 📄 License
MIT License © 2026 [RITESH-we](https://github.com/RITESH-we). Crafted with passion for DJs, music producers, and developers worldwide.
