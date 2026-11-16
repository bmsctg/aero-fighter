# ✈️ Aero Fighters: Sky Guardians (Kids Edition)

A fun, fast, and colorful vertical arcade shoot 'em up game inspired by **Aero Fighters 2 (Sonic Wings)**, designed specifically for kids.

- **🎮 Play Anywhere**: Works on computer keyboards, mouse, or touch screens (iPads, Android tablets, iPhones).
- **⚡ Zero Setup / Zero Cost**: 100% static client-side web game. Host it for free on **GitHub Pages**, Netlify, or Vercel.
- **🎨 Minimum Graphics / Pure Code**: No heavy image or 3D asset downloads. All planes, lasers, explosions, and backdrops are rendered procedurally with HTML5 Canvas (under 50 KB total!).
- **🎵 Retro Arcade Audio**: 100% synthesized sound effects & background music using the Web Audio API (no external MP3/WAV files to load).

---

## 🕹️ Game Features

1. **3 Playable Fighter Jets**:
   - **F-15 Phoenix**: Balanced speed, rapid twin Vulcan lasers, and carpet bomb.
   - **A-10 Viper**: Heavily armored, wide-angle plasma spread shot, and nuke buster.
   - **Cosmo Hawk**: Hypersonic speed, piercing laser beams, and quantum vortex.
2. **Kid-Friendly Gameplay**:
   - Generous health (hearts) and respawn invulnerability shields.
   - Power-Up badges (`P`) that upgrade weapons up to Level 5.
   - Star pickups with automatic magnetic pull.
   - Mega Screen Bombs (`💣`) that clear enemy bullets into score stars!
3. **Multi-Stage Missions & Epic Bosses**:
   - **Stage 1 (Cloud Kingdom)**: *Iron Behemoth*
   - **Stage 2 (Ocean Strike)**: *Cyber Shark*
   - **Stage 3 (Star Base)**: *Nova Overlord*

---

## 🕹️ Controls

| Control | Computer / Keyboard | Mouse | Mobile / Tablet (Touch) |
|---|---|---|---|
| **Move Jet** | `Arrow Keys` or `WASD` | Move mouse | Touch and drag anywhere |
| **Shoot** | `Spacebar` or `J` | Left click / Auto-fire | On-screen `AUTO` toggle |
| **Mega Bomb** | `B` or `K` | Click Bomb button | Tap `💣 BOMB` button |
| **Pause** | `P` | - | - |

---

## 🚀 How to Deploy to GitHub Pages (100% Free)

### Option 1: Automatic GitHub Action (Included)
1. Initialize git and push this repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Aero Fighters Sky Guardians"
   git branch -M main
   git remote add origin https://github.com/<your-username>/aero-fighter-2.git
   git push -u origin main
   ```
2. In your GitHub repository:
   - Go to **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, select **GitHub Actions**.
   - Your game will be live at `https://<your-username>.github.io/aero-fighter-2/` in 1-2 minutes!

### Option 2: Deploy directly from Branch
1. Go to **Settings** > **Pages**.
2. Under **Source**, choose **Deploy from a branch**.
3. Select branch `main` and folder `/ (root)`, then click **Save**.

---

## 💻 How to Test Locally

Simply double-click [index.html](file:///c:/Personal/work/aero-fighter-2/index.html) in your file explorer to open it in any modern browser (Chrome, Edge, Firefox, Safari).

Or run a quick local web server:
```bash
npx serve
# or
python -m http.server 8000
```
