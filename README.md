# ⚡ PRO DJ AUTOMIXER — AI-Powered Web DJ Console

<div align="center">

![License](https://img.shields.io/badge/License-MIT-green.svg)
![React](https://img.shields.io/badge/React-18-blue.svg?logo=react)
![Vite](https://img.shields.io/badge/Vite-5-purple.svg?logo=vite)
![Web Audio API](https://img.shields.io/badge/Web%20Audio-Hardware%20Accelerated-orange.svg)
![Spotify Web API](https://img.shields.io/badge/Spotify-OAuth%20PKCE-1db954.svg?logo=spotify)

**Turn your browser into a full-scale Pioneer-style club DJ setup with automated beatmatching, harmonic Camelot mixing, vinyl scratching, and direct Spotify integration.**

[🚀 Quick Start](#-quick-start) • [🎧 How to Play Music](#-how-to-play-music) • [🔥 Key Features](#-features) • [⌨️ Keyboard Shortcuts](#-dj-keyboard-shortcuts)

</div>

---

## 🌟 Highlights

- 🎛️ **Dual Hardware Decks**: Interactive vinyl jog wheels with real-time scratching, spinbacks, and pitch bending.
- 🤖 **Smart Auto-DJ Engine**: Hands-free club transitions featuring seamless beatmatching, bass-swapping, and outro auto-looping.
- 🟢 **Direct Spotify Premium Integration**: Browse your personal Spotify playlists, Liked Songs, and Top Tracks, or live search 100M+ songs.
- 🔊 **Studio-Quality Audio Processing**: Web Audio 3-Band EQ kills (-24dB to +6dB), bi-directional High-Pass/Low-Pass resonant sweep filters, and master crossfader curves.
- ✨ **AI Vibe & Mood Mix Generator**: Generates festival sets tailored to your mood, genre, and language, harmonically sorted by the **Camelot Wheel**.
- 📊 **Real-Time Visuals**: 60 FPS animated audio waveforms, cue flags, and stereo LED peak/RMS VU meters.

---

## 🎧 How to Play Music (Step-by-Step)

### 1. Launch the Mixer
Open your browser and navigate to:
```
http://127.0.0.1:5173/
```

### 2. Enable Web Audio
Click the glowing **`▶ ENABLE AUDIO`** button in the top navigation bar to initialize high-performance Web Audio.

### 3. Load Songs into the Decks
You can load music in 3 different ways:

* **From Your Spotify Account**:
  1. Click **`👤 Spotify Library`** in the top navigation.
  2. Browse your **Playlists**, **Top Tracks**, or **Liked Songs**.
  3. Click **`🎧 Load to Mixer`** on any playlist to load all songs and automatically place Track 1 on **Deck A** and Track 2 on **Deck B**.
  4. Or click **`DECK A`** / **`DECK B`** on any individual track to load it into a specific deck.
* **Via Catalog Search**:
  1. Go to the **`🔍 Search Spotify Catalog`** tab in the browser.
  2. Type any artist or track name (e.g. *Avicii*, *Arijit Singh*, *Daft Punk*).
  3. Hit **`DECK A`** or **`DECK B`** to load it instantly.
* **Via AI Vibe Mix**:
  1. Click **`✨ AI Vibe Mix`** in the top bar.
  2. Pick your mood (e.g. *Late Night Club*, *Festival Mainstage*, *Sunset Lounge*), genre, and language.
  3. Click **`⚡ GENERATE & LOAD AI MIX`** — the engine harmonically aligns the tracks and loads them into both decks.

### 4. Start Mixing & Performing
- **Play/Pause**: Click **PLAY** on Deck A or press <kbd>SPACE</kbd>. You will see the **`🟢 REAL AUDIO`** indicator and the vinyl platter will spin.
- **Mix to Deck B**:
  - **Automated**: Click **`⚡ AUTO-DJ`** or press <kbd>TAB</kbd> (**MIX NOW**) — the auto-DJ beatmatches Deck B, triggers a club bass-swap, loops the outro, and blends the crossfader smoothly!
  - **Manual**: Slide the central **Crossfader** or use <kbd>◄</kbd> and <kbd>►</kbd> arrow keys.
- **Scratch & Backspin**: Grab the vinyl platter with your mouse or touch and flick to scratch!
- **Shape the Sound**: Cut the bass using the **LOW** knob or sweep the **FILTER** knob for buildup drops.
- **Hot Cues**: Hit pads **1**, **2**, **3**, or **4** to jump to drop points in real-time.

---

## ⌨️ DJ Keyboard Shortcuts

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| <kbd>SPACE</kbd> | **Play / Pause** | Toggles playback on the active deck |
| <kbd>TAB</kbd> | **Mix Now** | Triggers instantaneous smart auto-transition |
| <kbd>◄</kbd> Left Arrow | **Crossfader Left** | Moves crossfader toward Deck A |
| <kbd>►</kbd> Right Arrow | **Crossfader Right** | Moves crossfader toward Deck B |
| <kbd>1</kbd> - <kbd>4</kbd> | **Hot Cues** | Jumps to cue points on Deck A |
| <kbd>5</kbd> - <kbd>8</kbd> | **Hot Cues** | Jumps to cue points on Deck B |

---

## 🛠️ Architecture & Tech Stack

```
dj-mixer/
├── src/
│   ├── audio/
│   │   ├── audioEngine.js     # Dual Web Audio pipelines, EQ, filters, scratch, beat analysis
│   │   └── autoDjEngine.js    # Smart transition automation, bass-swap, outro looping
│   ├── components/
│   │   ├── Deck.jsx           # Hardware deck chassis with vinyl platter & pads
│   │   ├── JogWheel.jsx       # Physics-based interactive vinyl scratch platter
│   │   ├── WaveformDisplay.jsx# 60fps dynamic audio waveform renderer
│   │   ├── MixerCenter.jsx    # Central hardware mixer strip with crossfader & master VU
│   │   ├── PlaylistManager.jsx# Track table, auto-DJ queue, and drag-and-drop
│   │   ├── SpotifyAccountBrowser.jsx # Tabbed Spotify library & search portal
│   │   └── VibeMixModal.jsx   # AI harmonic set generator (Camelot Wheel)
│   └── services/
│       └── spotifyService.js  # OAuth 2.0 PKCE, Spotify Web API, and audio resolvers
```

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- A modern web browser with Web Audio API support (Chrome, Edge, Firefox, Brave, Safari)

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/RITESH-we/DJ-RITESH.git
cd DJ-RITESH

# 2. Install dependencies
npm install

# 3. Launch development server
npm run dev
```

The app will start at `http://127.0.0.1:5173/`.

---

## 🟢 Spotify Developer Setup (Optional for Full Personal Library)

1. Head over to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Click **Create App**:
   - **App Name**: `DJ Mixer`
   - **Redirect URI**: `http://127.0.0.1:5173/` *(Must use 127.0.0.1)*
3. Copy your **Client ID**.
4. In the DJ Mixer app, click **`👤 Spotify Library`** ➔ paste your Client ID ➔ click **`🟢 LOG IN WITH SPOTIFY`**.
5. Authorize with your Spotify account to unlock your playlists, liked songs, and top tracks!

---

## 📄 License
MIT License © 2026 [RITESH-we](https://github.com/RITESH-we). Built with passion for DJs, producers, and music lovers.
