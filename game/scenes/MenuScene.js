// game/scenes/MenuScene.js
import PlayerData from '../data/PlayerData.js';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        console.log("MenuScene Started");
        const { width, height } = this.scale;

        this.add.image(0, 0, "menu_bg").setOrigin(0).setDisplaySize(width, height);
        this.add.rectangle(0, 0, 500, height, 0x000000, 0.6).setOrigin(0);

        this.optionsState    = { music: true, sfx: true };
        this.activeContainer = null;

        this.showMainMenu();
    }

    // ── Screen switcher ───────────────────────────────────────────────────
    switchTo(builderFn) {
        if (this.activeContainer) this.activeContainer.destroy(true);
        this.activeContainer = this.add.container(0, 0);
        builderFn(this.activeContainer);
    }

    startGame(mode) {
        this.scene.stop('UIScene');
        this.scene.start('GameScene', { mode });
        this.scene.launch('UIScene');
        this.registry.events.emit('update-score',  0);
        this.registry.events.emit('update-health', 100);
        this.registry.events.emit('update-shield', 0);
    }

    // ── Main menu ─────────────────────────────────────────────────────────
    showMainMenu() {
        this.switchTo((c) => {
            c.add(this.makeTitle(80, 80, "SPACE\nSHOOTER"));

            const money     = PlayerData.getMoney();
            const highscore = PlayerData.getHighscore();
            c.add(this.add.text(80, 210, `💰 ${money} coins`,    { fontSize: '18px', color: '#ffdd00' }));
            c.add(this.add.text(80, 234, `🏆 Best: ${highscore}`, { fontSize: '16px', color: '#aaffaa' }));

            this.addButton(c, 80, 278, "Play",      () => this.showPlayMenu());
            this.addButton(c, 80, 348, "Shop",      () => this.showShop());
            this.addButton(c, 80, 418, "Options",   () => this.showOptions());
            this.addButton(c, 80, 488, "Save Game", () => {
                const f = PlayerData.saveToFile();
                this.showToast(`Saved: ${f}`, '#aaffaa');
            });
            this.addButton(c, 80, 558, "Load Game", () => {
                PlayerData.loadFromFile().then(data => {
                    if (data) {
                        this.showToast('Save loaded!', '#aaffaa');
                        this.time.delayedCall(600, () => this.showMainMenu());
                    } else {
                        this.showToast('Cancelled', '#888888');
                    }
                });
            });
        });
    }

    // ── Play menu ─────────────────────────────────────────────────────────
    showPlayMenu() {
        this.switchTo((c) => {
            c.add(this.makeTitle(80, 100, "SELECT MODE"));
            this.addButton(c, 80, 260, "Level 1", () => this.startGame('level1'));
            this.addButton(c, 80, 340, "Level 2", () => this.startGame('level2'));
            this.addButton(c, 80, 420, "Endless",  () => this.showEndlessMenu());
            this.addButton(c, 80, 500, "Back",     () => this.showMainMenu());
        });
    }

    // ── Endless menu — Solo / Co-op / Back ───────────────────────────────
    showEndlessMenu() {
        this.switchTo((c) => {
            c.add(this.makeTitle(80, 100, "ENDLESS"));
            this.addButton(c, 80, 260, "Solo",  () => this.showDifficultyPicker());
            this.addButton(c, 80, 340, "Co-op", () => this.showToast('Coming soon!', '#ffdd00'));
            this.addButton(c, 80, 420, "Back",  () => this.showPlayMenu());
        });
    }

    // ── Difficulty picker ─────────────────────────────────────────────────
    showDifficultyPicker() {
        this.switchTo((c) => {
            c.add(this.makeTitle(80, 80, "DIFFICULTY"));

            const diffs = [
                {
                    mode:        'endless_easy',
                    icon:        'easy',
                    label:       'Easy',
                    color:       '#44ff88',
                    desc:        'Relaxed pace. Great for beginners.',
                    multiplier:  '×1 score',
                    y:           210,
                },
                {
                    mode:        'endless_medium',
                    icon:        'medium',
                    label:       'Medium',
                    color:       '#ffaa00',
                    desc:        'Hard but fair. Fast enemies, rare powerups.',
                    multiplier:  '×2.5 score',
                    y:           360,
                },
                {
                    mode:        'endless_hard',
                    icon:        'hard',
                    label:       'Hard',
                    color:       '#ff3333',
                    desc:        'Near impossible. Enemy wall. Good luck.',
                    multiplier:  '×5 score',
                    y:           510,
                },
            ];

            diffs.forEach(d => this.buildDiffCard(c, 80, d));

            this.addButton(c, 80, 660, "Back", () => this.showEndlessMenu());
        });
    }

    buildDiffCard(container, x, d) {
        const W   = 380;
        const H   = 120;
        const y   = d.y;

        // Card background with colored border
        const borderHex = parseInt(d.color.replace('#', '0x'));
        const bg = this.add.rectangle(x, y, W, H, 0x111111, 0.92)
            .setOrigin(0).setStrokeStyle(2, borderHex);
        container.add(bg);

        // Difficulty icon
        const icon = this.add.image(x + 52, y + H / 2, d.icon)
            .setDisplaySize(64, 64);
        container.add(icon);

        // Label
        container.add(this.add.text(x + 112, y + 14, d.label, {
            fontSize: '26px', color: d.color, fontStyle: 'bold',
        }));

        // Description
        container.add(this.add.text(x + 112, y + 48, d.desc, {
            fontSize: '13px', color: '#aaaaaa',
            wordWrap: { width: 200 },
        }));

        // Multiplier badge
        container.add(this.add.text(x + W - 10, y + 14, d.multiplier, {
            fontSize: '15px', color: d.color, fontStyle: 'bold',
            backgroundColor: '#000000', padding: { x: 6, y: 3 },
        }).setOrigin(1, 0));

        // Make whole card clickable
        const hitArea = this.add.rectangle(x, y, W, H, 0xffffff, 0)
            .setOrigin(0).setInteractive({ useHandCursor: true });

        hitArea.on('pointerover',  () => bg.setFillStyle(0x1a1a1a));
        hitArea.on('pointerout',   () => bg.setFillStyle(0x111111));
        hitArea.on('pointerdown',  () => this.startGame(d.mode));

        container.add(hitArea);
    }

    // ── Shop ──────────────────────────────────────────────────────────────
    showShop() {
        const shipsData = this.cache.json.get('shipsData');
        const shipKeys  = Object.keys(shipsData);
        const owned     = PlayerData.getOwnedShips();
        const selected  = PlayerData.getSelectedShip();
        const money     = PlayerData.getMoney();

        this.switchTo((c) => {
            c.add(this.makeTitle(80, 40, "HANGAR"));
            c.add(this.add.text(80, 110, `💰 ${money} coins`, { fontSize: '20px', color: '#ffdd00' }));

            shipKeys.forEach((key, i) => {
                const ship       = shipsData[key];
                const isOwned    = owned.includes(key);
                const isSelected = key === selected;
                this.buildShipCard(c, 80, 155 + i * 100, ship, key, isOwned, isSelected, () => {
                    if (isOwned) {
                        PlayerData.selectShip(key);
                        this.showShop();
                    } else {
                        const result = PlayerData.buyShip(key, ship.price);
                        if (result.success) {
                            this.showShop();
                        } else if (result.reason === 'not_enough_money') {
                            this.showToast('Not enough coins!', '#ff4444');
                        }
                    }
                });
            });

            this.addButton(c, 80, 690, "Back", () => this.showMainMenu());
        });
    }

    buildShipCard(container, x, y, ship, key, isOwned, isSelected, onAction) {
        const W         = 400;
        const H         = 88;
        const borderCol = isSelected ? 0xffdd00 : (isOwned ? 0x446644 : 0x444444);

        const bg = this.add.rectangle(x, y, W, H, isSelected ? 0x1a1a00 : 0x111111, 0.9)
            .setOrigin(0).setStrokeStyle(isSelected ? 2 : 1, borderCol);
        container.add(bg);

        if (isSelected) {
            container.add(this.add.rectangle(x - 2, y - 2, W + 4, H + 4, 0xffdd00, 0.12).setOrigin(0));
        }

        container.add(this.add.image(x + 44, y + H / 2, ship.texture || 'player').setDisplaySize(60, 60).setAngle(90));
        container.add(this.add.text(x + 90, y + 10, ship.name, { fontSize: '18px', color: isSelected ? '#ffdd00' : '#ffffff', fontStyle: 'bold' }));
        container.add(this.add.text(x + 90, y + 32, ship.description, { fontSize: '12px', color: '#aaaaaa' }));
        container.add(this.add.text(x + 90, y + 52, `SPD:${ship.speed}  HP:${ship.health}  DMG:${ship.damage}  FR:${ship.fireRate}ms`, { fontSize: '11px', color: '#88ccff' }));

        const btnLabel = isSelected ? '★ SELECTED' : (isOwned ? 'SELECT' : `BUY 💰${ship.price}`);
        const btnColor = isSelected ? '#ffdd00' : '#ffffff';
        const btn      = this.add.text(x + W - 10, y + H / 2, btnLabel, {
            fontSize: '14px', color: btnColor,
            backgroundColor: isSelected ? '#332200' : '#222222',
            padding: { x: 8, y: 4 },
        }).setOrigin(1, 0.5);

        if (!isSelected) {
            btn.setInteractive({ useHandCursor: true });
            btn.on('pointerover',  () => btn.setStyle({ color: '#ffff00' }));
            btn.on('pointerout',   () => btn.setStyle({ color: btnColor }));
            btn.on('pointerdown',  onAction);
        }
        container.add(btn);
    }

    // ── Options ───────────────────────────────────────────────────────────
    showOptions() {
        this.switchTo((c) => {
            c.add(this.makeTitle(80, 100, "OPTIONS"));
            this.addToggleButton(c, 80, 260, "Music", "music");
            this.addToggleButton(c, 80, 340, "SFX",   "sfx");
            this.addButton(c,      80, 420, "Back",   () => this.showMainMenu());
        });
    }

    // ── Toast ─────────────────────────────────────────────────────────────
    showToast(message, color = '#ffdd00') {
        const txt = this.add.text(
            this.scale.width / 2, this.scale.height - 60, message, {
                fontSize: '20px', color,
                backgroundColor: '#111111', padding: { x: 14, y: 6 },
            }
        ).setOrigin(0.5).setDepth(100);

        if (this.activeContainer) this.activeContainer.add(txt);

        this.tweens.add({
            targets: txt, alpha: 0, y: txt.y - 30,
            delay: 1000, duration: 500,
            onComplete: () => txt.destroy(),
        });
    }

    // ── Widgets ───────────────────────────────────────────────────────────
    makeTitle(x, y, label) {
        return this.add.text(x, y, label, { fontSize: '46px', color: '#ffffff', fontStyle: 'bold' });
    }

    addButton(container, x, y, label, callback) {
        const btn = this.add.text(x, y, label, {
            fontSize: '28px', color: '#ffffff',
            backgroundColor: '#000000', padding: { x: 10, y: 5 },
        }).setInteractive({ useHandCursor: true });
        btn.on('pointerover',  () => btn.setStyle({ color: '#ffff00' }));
        btn.on('pointerout',   () => btn.setStyle({ color: '#ffffff' }));
        btn.on('pointerdown',  callback);
        container.add(btn);
        return btn;
    }

    addToggleButton(container, x, y, label, key) {
        const getStyle = () => ({
            fontSize: '28px',
            color: this.optionsState[key] ? '#ffffff' : '#555555',
            backgroundColor: '#000000', padding: { x: 10, y: 5 },
        });
        const getLabel = () => `${label}: ${this.optionsState[key] ? 'ON' : 'OFF'}`;
        const btn = this.add.text(x, y, getLabel(), getStyle()).setInteractive({ useHandCursor: true });
        btn.on('pointerover', () => { if (this.optionsState[key]) btn.setStyle({ color: '#ffff00' }); });
        btn.on('pointerout',  () => btn.setStyle({ color: this.optionsState[key] ? '#ffffff' : '#555555' }));
        btn.on('pointerdown', () => {
            this.optionsState[key] = !this.optionsState[key];
            btn.setText(getLabel());
            btn.setStyle(getStyle());
        });
        container.add(btn);
        return btn;
    }
}