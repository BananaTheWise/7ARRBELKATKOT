// game/scenes/MenuScene.js
import PlayerData from '../data/PlayerData.js';
import AudioSystem from '../systems/AudioSystem.js'
import CursorManager from '../systems/CursorManager.js';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const { width, height } = this.scale;
        this.add.image(0, 0, "menu_bg").setOrigin(0).setDisplaySize(width, height);
        this.add.rectangle(0, 0, 480, height, 0x000000, 0.75).setOrigin(0);
        this.add.rectangle(480, 0, 4, height, 0xffdd00, 0.8).setOrigin(0);
        this.optionsState    = { music: true, sfx: true };
        this.activeContainer = null;
        this.showMainMenu();
        // Play menu music — AudioSystem works in any scene
        this.menuAudio = new AudioSystem(this);
        this.menuAudio.playMusic('music_menu');
        this.cursor = new CursorManager(this);
        // Stop it when leaving to game
        this.events.once('shutdown', () => this.menuAudio.destroy());
    }

    switchTo(builderFn) {
        if (this.activeContainer) this.activeContainer.destroy(true);
        this.activeContainer = this.add.container(0, 0);
        builderFn(this.activeContainer);
    }

    startGame(mode, coop = false) {
        this.sound.stopAll();
        this.scene.stop('UIScene');
        this.scene.start('GameScene', { mode, coop });
        this.scene.launch('UIScene');
        this.registry.events.emit('update-score',  0);
        this.registry.events.emit('update-health', 100);
        this.registry.events.emit('update-shield', 0);
    }

    // ── Screens ───────────────────────────────────────────────────────────

    showMainMenu() {
        this.switchTo((c) => {
            c.add(this.add.text(80, 100, `💰 ${PlayerData.getMoney()} Coins`,    { fontSize: '24px', color: '#ffdd00', fontStyle: 'bold' }));
            c.add(this.add.text(80, 134, `🏆 Best Score: ${PlayerData.getHighscore()}`, { fontSize: '20px', color: '#aaffaa', fontStyle: 'bold' }));

            this.addButton(c, 80, 200, "Play",      () => this.showPlayMenu());
            this.addButton(c, 80, 270, "Story",     () => this.showStory());
            this.addButton(c, 80, 340, "Shop",      () => this.showShop());
            this.addButton(c, 80, 410, "Options",   () => this.showOptions());
            this.addButton(c, 80, 480, "Save Game", () => {
                try { this.showToast(`Saved: ${PlayerData.saveToFile()}`, '#aaffaa'); }
                catch(e) { this.showToast('Save failed', '#ff4444'); }
            });
            this.addButton(c, 80, 550, "Load Game", () => {
                PlayerData.loadFromFile().then(data => {
                    if (data) { this.showToast('Loaded!', '#aaffaa'); this.time.delayedCall(600, () => this.showMainMenu()); }
                    else       { this.showToast('Cancelled', '#888888'); }
                });
            });
        });
    }

    showStory() {
        const W = this.scale.width;
        const H = this.scale.height;

        // Create a dark overlay background to focus on the story
        const overlay = this.add.rectangle(0, 0, W, H, 0x000000, 0.8)
            .setOrigin(0)
            .setInteractive(); // Blocks clicks to buttons underneath
            
        // Add the story_panel image (already preloaded in PreloadScene)
        const storyImg = this.add.image(W / 2, H / 2, 'story_panel')
            .setOrigin(0.5)
            .setInteractive();
            
        // Calculate a scale to fit the image comfortably within the screen limits
        const scale = Math.min((W - 100) / storyImg.width, (H - 100) / storyImg.height);
        storyImg.setScale(scale);

        const closeTxt = this.add.text(W / 2, H - 50, 'Click anywhere to close', {
            fontSize: '20px', color: '#aaaaaa'
        }).setOrigin(0.5);

        const storyGroup = this.add.container(0, 0, [overlay, storyImg, closeTxt]).setDepth(100);

        overlay.on('pointerdown', () => storyGroup.destroy());
        storyImg.on('pointerdown', () => storyGroup.destroy());
    }

    showPlayMenu() {
        this.switchTo((c) => {
            c.add(this.makeTitle(80, 100, "SELECT MODE"));
            this.addButton(c, 80, 200, "Level 1", () => this.startGame('level1'));
            this.addButton(c, 80, 270, "Level 2", () => this.startGame('level2'));
            this.addButton(c, 80, 340, "Endless",  () => this.showEndlessMenu());
            this.addButton(c, 80, 410, "Back",     () => this.showMainMenu());
        });
    }

    showEndlessMenu() {
        this.switchTo((c) => {
            c.add(this.makeTitle(80, 100, "ENDLESS"));

            // Solo → difficulty picker (coop = false)
            this.addButton(c, 80, 200, "Solo",  () => this.showDifficultyPicker(false));

            // Co-op → same difficulty picker but passes coop = true
            this.addButton(c, 80, 270, "Co-op", () => this.showDifficultyPicker(true));

            this.addButton(c, 80, 340, "Back",  () => this.showPlayMenu());
        });
    }

    showDifficultyPicker(isCoop) {
        const coopLabel = isCoop ? ' (CO-OP)' : '';

        this.switchTo((c) => {
            c.add(this.makeTitle(80, 60, `DIFFICULTY${coopLabel}`));

            if (isCoop) {
                c.add(this.add.text(80, 130, 'P1: WASD + Space   P2: Arrows + Enter', {
                    fontSize: '16px', color: '#aaddff',
                }));
            }

            const diffs = [
                { mode: 'endless_easy',   icon: 'easy',   label: 'Easy',   color: '#44ff88', desc: 'Relaxed pace.',                  mult: '×1',   y: isCoop ? 185 : 210 },
                { mode: 'endless_medium', icon: 'medium', label: 'Medium', color: '#ffaa00', desc: 'Hard but fair.',                 mult: '×2.5', y: isCoop ? 320 : 360 },
                { mode: 'endless_hard',   icon: 'hard',   label: 'Hard',   color: '#ff3333', desc: 'Near impossible. Good luck.',    mult: '×5',   y: isCoop ? 455 : 510 },
            ];

            diffs.forEach(d => this.buildDiffCard(c, 80, d, isCoop));

            this.addButton(c, 80, isCoop ? 590 : 640, "Back", () => this.showEndlessMenu());
        });
    }

    buildDiffCard(container, x, d, isCoop) {
        const W   = 380;
        const H   = 110;
        const hex = parseInt(d.color.replace('#', '0x'));

        const bg = this.add.rectangle(x, d.y, W, H, 0x111111, 0.92)
            .setOrigin(0).setStrokeStyle(2, hex);
        container.add(bg);

        container.add(this.add.image(x + 50, d.y + H / 2, d.icon).setDisplaySize(60, 60));
        container.add(this.add.text(x + 100, d.y + 16, d.label, { fontSize: '24px', color: d.color, fontStyle: 'bold' }));
        container.add(this.add.text(x + 100, d.y + 48, d.desc,  { fontSize: '13px', color: '#aaaaaa' }));
        container.add(this.add.text(x + W - 10, d.y + 16, d.mult + ' score', {
            fontSize: '15px', color: d.color, fontStyle: 'bold',
            backgroundColor: '#000000', padding: { x: 6, y: 3 },
        }).setOrigin(1, 0));

        // Whole card is clickable
        const hit = this.add.rectangle(x, d.y, W, H, 0xffffff, 0)
            .setOrigin(0).setInteractive();
        hit.on('pointerover',  () => bg.setFillStyle(0x1a1a1a));
        hit.on('pointerout',   () => bg.setFillStyle(0x111111));
        hit.on('pointerdown',  () => this.startGame(d.mode, isCoop));
        container.add(hit);
        if (this.cursor) {
            this.cursor.attachTo(hit);
        }
    }

    showShop() {
        const shipsData = this.cache.json.get('shipsData');
        const shipKeys  = Object.keys(shipsData);
        const owned     = PlayerData.getOwnedShips();
        const selected  = PlayerData.getSelectedShip();

        this.switchTo((c) => {
            c.add(this.makeTitle(80, 40, "HANGAR"));
            c.add(this.add.text(80, 110, `💰 ${PlayerData.getMoney()} coins`, { fontSize: '20px', color: '#ffdd00' }));

            shipKeys.forEach((key, i) => {
                const ship       = shipsData[key];
                const isOwned    = owned.includes(key);
                const isSelected = key === selected;
                this.buildShipCard(c, 80, 155 + i * 100, ship, key, isOwned, isSelected, () => {
                    if (isOwned) {
                        PlayerData.selectShip(key);
                        this.showShop();
                    } else {
                        const r = PlayerData.buyShip(key, ship.price);
                        if (r.success)                       this.showShop();
                        else if (r.reason === 'not_enough_money') this.showToast('Not enough coins!', '#ff4444');
                    }
                });
            });

            this.addButton(c, 80, 670, "Back", () => this.showMainMenu());
        });
    }

    buildShipCard(container, x, y, ship, key, isOwned, isSelected, onAction) {
        const W   = 400;
        const H   = 88;
        const bc  = isSelected ? 0xffdd00 : (isOwned ? 0x446644 : 0x444444);
        const bg  = this.add.rectangle(x, y, W, H, isSelected ? 0x1a1a00 : 0x111111, 0.9).setOrigin(0).setStrokeStyle(isSelected ? 2 : 1, bc);
        container.add(bg);
        if (isSelected) container.add(this.add.rectangle(x - 2, y - 2, W + 4, H + 4, 0xffdd00, 0.12).setOrigin(0));
        container.add(this.add.image(x + 44, y + H / 2, ship.texture || 'player').setDisplaySize(60, 60).setAngle(90));
        container.add(this.add.text(x + 90, y + 10, ship.name,        { fontSize: '18px', color: isSelected ? '#ffdd00' : '#ffffff', fontStyle: 'bold' }));
        container.add(this.add.text(x + 90, y + 32, ship.description, { fontSize: '12px', color: '#aaaaaa' }));
        container.add(this.add.text(x + 90, y + 52, `SPD:${ship.speed}  HP:${ship.health}  DMG:${ship.damage}  FR:${ship.fireRate}ms`, { fontSize: '11px', color: '#88ccff' }));

        const lbl = isSelected ? '★ SELECTED' : (isOwned ? 'SELECT' : `BUY 💰${ship.price}`);
        const col = isSelected ? '#ffdd00' : '#ffffff';
        const btn = this.add.text(x + W - 10, y + H / 2, lbl, {
            fontSize: '14px', color: col, backgroundColor: isSelected ? '#332200' : '#222222', padding: { x: 8, y: 4 },
        }).setOrigin(1, 0.5);
        if (!isSelected) {
            btn.setInteractive();
            btn.on('pointerover',  () => btn.setStyle({ color: '#ffff00' }));
            btn.on('pointerout',   () => btn.setStyle({ color: col }));
            btn.on('pointerdown',  onAction);
        }
        container.add(btn);
    }

    showOptions() {
        this.switchTo((c) => {
            c.add(this.makeTitle(80, 100, "OPTIONS"));
            this.addToggleButton(c, 80, 200, "Music", "music");
            this.addToggleButton(c, 80, 270, "SFX",   "sfx");
            this.addFullscreenButton(c, 80, 340);
            this.addButton(c,      80, 410, "Back",   () => this.showMainMenu());
        });
    }

    showToast(message, color = '#ffdd00') {
        const txt = this.add.text(this.scale.width / 2, this.scale.height - 60, message, {
            fontSize: '20px', color, backgroundColor: '#111111', padding: { x: 14, y: 6 },
        }).setOrigin(0.5).setDepth(100);
        if (this.activeContainer) this.activeContainer.add(txt);
        this.tweens.add({ targets: txt, alpha: 0, y: txt.y - 30, delay: 1000, duration: 500, onComplete: () => txt.destroy() });
    }

    makeTitle(x, y, label) {
        return this.add.text(x, y, label, { fontSize: '46px', color: '#ffffff', fontStyle: 'bold' });
    }

    addButton(container, x, y, label, callback) {
        const btn = this.add.text(x, y, label, {
            fontSize: '30px', color: '#ffffff', backgroundColor: '#000000', padding: { x: 16, y: 8 }, fontStyle: 'bold'
        }).setInteractive();
        btn.on('pointerover',  () => btn.setStyle({ color: '#ffff00', backgroundColor: '#222222' }));
        btn.on('pointerout',   () => btn.setStyle({ color: '#ffffff', backgroundColor: '#000000' }));
        btn.on('pointerdown',  callback);
        if (this.cursor) {
            this.cursor.attachTo(btn);
        }

        container.add(btn);
        return btn;
    }

    addToggleButton(container, x, y, label, key) {
        const getLabel = () => `${label}: ${this.optionsState[key] ? "ON" : "OFF"}`;
        const getStyle = () => ({
            fontSize: '30px',
            fontStyle: 'bold',
            backgroundColor: '#000000',
            padding: { x: 16, y: 8 },
            color: this.optionsState[key] ? '#44ff88' : '#ff4444'
        });

        const btn = this.add.text(x, y, getLabel(), getStyle())
            .setInteractive();

        btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#222222' }));
        btn.on('pointerout',  () => btn.setStyle({ backgroundColor: '#000000' }));
        btn.on('pointerdown', () => {
            // Toggle state
            this.optionsState[key] = !this.optionsState[key];

            // Update UI
            btn.setText(getLabel());
            btn.setStyle(getStyle());
            btn.setStyle({ backgroundColor: '#222222' });

            // Save to localStorage
            const raw = JSON.parse(localStorage.getItem('audio_settings') || '{}');
            raw[key === 'music' ? 'musicEnabled' : 'sfxEnabled'] = this.optionsState[key];
            localStorage.setItem('audio_settings', JSON.stringify(raw));
        });

        if (this.cursor) {
            this.cursor.attachTo(btn);
        }

        container.add(btn);
    }

    addFullscreenButton(container, x, y) {
        const getLabel = () => `Fullscreen: ${this.scale.isFullscreen ? "ON" : "OFF"}`;
        const getStyle = () => ({
            fontSize: '30px',
            fontStyle: 'bold',
            backgroundColor: '#000000',
            padding: { x: 16, y: 8 },
            color: this.scale.isFullscreen ? '#44ff88' : '#ff4444'
        });

        const btn = this.add.text(x, y, getLabel(), getStyle()).setInteractive();

        const updateBtn = () => {
            if (!btn.active) return;
            btn.setText(getLabel());
            btn.setStyle(getStyle());
        };

        btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#222222' }));
        btn.on('pointerout',  () => btn.setStyle({ backgroundColor: '#000000' }));
        btn.on('pointerdown', () => {
            this.scale.toggleFullscreen();
            this.time.delayedCall(100, updateBtn); // Slight delay allows browser to catch up
        });

        this.scale.on('enterfullscreen', updateBtn);
        this.scale.on('leavefullscreen', updateBtn);
        btn.on('destroy', () => {
            this.scale.off('enterfullscreen', updateBtn);
            this.scale.off('leavefullscreen', updateBtn);
        });

        if (this.cursor) {
            this.cursor.attachTo(btn);
        }
        container.add(btn);
    }

    update() {
        this.cursor?.update();
    }
}