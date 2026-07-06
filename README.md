# 7ARRBELKATKOT - Space Shooter

A fast-paced, web-based 2D space shooter built with **Phaser 3**. Battle through intense levels, fight giant bosses, collect coins, and upgrade your ships in the shop! The game features both solo and local co-op gameplay.

## Team Members

*   Ahmed Badr 20235622
*   Hamza Sayed 20232888
*   Nader Sherif 20231538
*   Youssef Ahmed 20230172

## Features
- **Game Modes**: 
  - **Level Progression**: Hand-crafted levels (Level 1: Ice, Level 2: Lava) with unique enemies and boss fights.
  - **Endless Mode**: Survive as long as you can across Easy, Medium, and Hard difficulties.
- **Local Co-op**: Play together with a friend on the same keyboard in Endless mode.
- **Shop System**: Collect coins during gameplay to unlock and equip new ships with different stats (Speed, Health, Damage, Fire Rate).
- **Powerups**: Grab drops from enemies including Shields, Attack Speed boosts, Health packs, and the invincible Golden Star.
- **Dynamic Settings**: Custom UI for audio toggles (Music/SFX) and Fullscreen mode.
- **Persistent Data**: High scores, unlocked ships, and money are saved directly to your browser's `localStorage`.

## Controls

**Player 1 (Solo / Co-op)**
- **Move**: `W`, `A`, `S`, `D`
- **Shoot**: `SPACE`

**Player 2 (Co-op only)**
- **Move**: `UP`, `DOWN`, `LEFT`, `RIGHT` Arrows
- **Shoot**: `ENTER`

**Global**
- **Pause Menu**: `ESC`

## How to Run

Because this game uses ES6 JavaScript Modules (`import` and `export`), you **cannot** simply double-click the `index.html` file to play it. Your browser will block the scripts due to CORS security policies. 

You must host the game folder using a local web server.

### Option 1: VS Code (Recommended)
1. Install the **Live Server** extension in Visual Studio Code.
2. Right-click on `index.html` and select **"Open with Live Server"**.

### Option 2: Python
If you have Python installed, open your terminal in the game folder and run:
```bash
python -m http.server 5500
```
Then open your browser and navigate to `http://localhost:5500`.

### Option 3: Node.js
If you have Node.js and npm installed, you can use `npx`:
```bash
npx serve .
```
