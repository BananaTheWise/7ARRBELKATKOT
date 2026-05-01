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

            c.add(this.add.text(80, 210, `💰 ${money} coins`, { fontSize: '18px', color: '#ffdd00' }));
            c.add(this.add.text(80, 235, `🏆 Best: ${highscore}`, { fontSize: '16px', color: '#aaffaa' }));

            this.addButton(c, 80, 280, "Play",      () => this.showPlayMenu());
            this.addButton(c, 80, 355, "Shop",      () => this.showShop());
            this.addButton(c, 80, 430, "Save",      () => this.showSaveSlots());
            this.addButton(c, 80, 505, "Load",      () => this.showLoadSlots());
            this.addButton(c, 80, 580, "Options",   () => this.showOptions());
        });
    }

    // ── Play / Endless menus ──────────────────────────────────────────────
    showPlayMenu() {
        this.switchTo((c) => {
            c.add(this.makeTitle(80, 100, "SELECT MODE"));
            this.addButton(c, 80, 250, "Level 1", () => this.startGame('level1'));
            this.addButton(c, 80, 330, "Level 2", () => this.startGame('level2'));
            this.addButton(c, 80, 410, "Endless",  () => this.showEndlessMenu());
            this.addButton(c, 80, 490, "Back",     () => this.showMainMenu());
        });
    }

    showEndlessMenu() {
        this.switchTo((c) => {
            c.add(this.makeTitle(80, 100, "ENDLESS"));
            this.addButton(c, 80, 250, "Solo",  () => this.startGame('endless'));
            this.addButton(c, 80, 330, "Co-op", () => console.log("Co-op coming soon"));
            this.addButton(c, 80, 410, "Back",  () => this.showPlayMenu());
        });
    }

    // ── Save slots ────────────────────────────────────────────────────────
    showSaveSlots() {
        this.switchTo((c) => {
            c.add(this.makeTitle(80, 60, "SAVE GAME"));
            c.add(this.add.text(80, 140, "Choose a slot to save:", { fontSize: '18px', color: '#aaaaaa' }));

            ['1', '2', '3'].forEach((slot, i) => {
                const info  = PlayerData.getSlotInfo(slot);
                const y     = 200 + i * 110;
                this.buildSaveSlotCard(c, 80, y, slot, info, false);
            });

            this.addButton(c, 80, 560, "Back", () => this.showMainMenu());
        });
    }

    showLoadSlots() {
        this.switchTo((c) => {
            c.add(this.makeTitle(80, 60, "LOAD GAME"));
            c.add(this.add.text(80, 140, "Choose a slot to load:", { fontSize: '18px', color: '#aaaaaa' }));

            ['1', '2', '3'].forEach((slot, i) => {
                const info = PlayerData.getSlotInfo(slot);
                const y    = 200 + i * 110;
                this.buildSaveSlotCard(c, 80, y, slot, info, true);
            });

            this.addButton(c, 80, 560, "Back", () => this.showMainMenu());
        });
    }

    buildSaveSlotCard(container, x, y, slot, info, isLoad) {
        const W  = 380;
        const H  = 90;

        const bg = this.add.rectangle(x, y, W, H, 0x111122, 0.9)
            .setOrigin(0).setStrokeStyle(1, info ? 0x446644 : 0x333333);
        container.add(bg);

        if (info) {
            container.add(this.add.text(x + 14, y + 12,
                `Slot ${slot}  💰${info.money}  🏆${info.highscore}`, {
                fontSize: '16px', color: '#ffffff', fontStyle: 'bold',
            }));

            const date = info.lastSaved
                ? new Date(info.lastSaved).toLocaleString()
                : 'Unknown';
            container.add(this.add.text(x + 14, y + 36, `Ship: ${info.ship}`, { fontSize: '13px', color: '#aaaaaa' }));
            container.add(this.add.text(x + 14, y + 54, `Saved: ${date}`, { fontSize: '11px', color: '#666666' }));
        } else {
            container.add(this.add.text(x + 14, y + 30, `Slot ${slot}  — Empty —`, {
                fontSize: '16px', color: '#555555',
            }));
        }

        // Action button
        const canAct = isLoad ? !!info : true;
        const label  = isLoad ? 'Load' : 'Save';
        const btn    = this.add.text(x + W - 10, y + H / 2, label, {
            fontSize: '16px', color: canAct ? '#ffffff' : '#444444',
            backgroundColor: canAct ? '#224422' : '#111111',
            padding: { x: 10, y: 5 },
        }).setOrigin(1, 0.5);

        if (canAct) {
            btn.setInteractive({ useHandCursor: true });
            btn.on('pointerover',  () => btn.setStyle({ color: '#ffff00' }));
            btn.on('pointerout',   () => btn.setStyle({ color: '#ffffff' }));
            btn.on('pointerdown',  () => {
                if (isLoad) {
                    const result = PlayerData.loadFromSlot(slot);
                    if (result) {
                        this.showToast(`Slot ${slot} loaded!`, '#aaffaa');
                        this.time.delayedCall(800, () => this.showMainMenu());
                    }
                } else {
                    PlayerData.saveToSlot(slot);
                    this.showToast(`Saved to slot ${slot}!`, '#aaffaa');
                    this.time.delayedCall(800, () => this.showSaveSlots());
                }
            });
        }

        container.add(btn);
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
            this.addToggleButton(c, 80, 250, "Music", "music");
            this.addToggleButton(c, 80, 330, "SFX",   "sfx");
            this.addButton(c,      80, 410, "Back",   () => this.showMainMenu());
        });
    }

    // ── Toast notification ────────────────────────────────────────────────
    showToast(message, color = '#ffdd00') {
        const txt = this.add.text(
            this.scale.width / 2, this.scale.height - 60,
            message, {
                fontSize: '20px', color,
                backgroundColor: '#111111',
                padding: { x: 14, y: 6 },
            }
        ).setOrigin(0.5).setDepth(100);

        if (this.activeContainer) this.activeContainer.add(txt);

        this.tweens.add({
            targets: txt, alpha: 0, y: txt.y - 30,
            delay: 800, duration: 500,
            onComplete: () => txt.destroy(),
        });
    }

    // ── Widget factories ──────────────────────────────────────────────────
    makeTitle(x, y, label) {
        return this.add.text(x, y, label, {
            fontSize: '46px', color: '#ffffff', fontStyle: 'bold',
        });
    }

    addButton(container, x, y, label, callback) {
        const btn = this.add.text(x, y, label, {
            fontSize: '30px', color: '#ffffff',
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
            fontSize: '30px',
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