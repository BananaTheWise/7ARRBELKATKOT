// game/scenes/UIScene.js
const BAR_W  = 120;
const BAR_H  = 14;
const ICON_S = 28;
const HUD_H  = 60;

const PROTECTED = new Set([
    'UIScene', 'MenuScene', 'BootScene', 'PreloadScene', 'GameScene',
]);

export default class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    create() {
        const W = this.scale.width;

        this.score     = 0;
        this.health    = 100;
        this.maxHealth = 100;
        this.shield    = 0;
        this.paused    = false;

        // HUD strip
        this.add.rectangle(0, 0, W, HUD_H, 0x111111, 0.92).setOrigin(0);
        this.add.rectangle(0, HUD_H - 1, W, 1, 0x444444).setOrigin(0);

        const MID = HUD_H / 2;
        let   CX  = 14;

        // Health
        this.add.image(CX + ICON_S / 2, MID, 'health_icon').setDisplaySize(ICON_S, ICON_S);
        CX += ICON_S + 6;
        this.add.rectangle(CX, MID, BAR_W, BAR_H, 0x333333).setOrigin(0, 0.5);
        this.healthBar   = this.add.rectangle(CX, MID, BAR_W, BAR_H, 0x2ecc71).setOrigin(0, 0.5);
        this.healthLabel = this.add.text(CX + BAR_W + 6, MID, '100', { fontSize: '13px', color: '#ffffff' }).setOrigin(0, 0.5);
        CX += BAR_W + 30;

        // Shield
        this.add.image(CX + ICON_S / 2, MID, 'shield_icom').setDisplaySize(ICON_S, ICON_S);
        CX += ICON_S + 6;
        this.add.rectangle(CX, MID, BAR_W, BAR_H, 0x333333).setOrigin(0, 0.5);
        this.shieldBar   = this.add.rectangle(CX, MID, 0, BAR_H, 0x3498db).setOrigin(0, 0.5);
        this.shieldLabel = this.add.text(CX + BAR_W + 6, MID, '0', { fontSize: '13px', color: '#aaddff' }).setOrigin(0, 0.5);

        // Logo
        const LR  = 24, LX = W / 2, LY = MID;
        this.add.circle(LX, LY, LR + 2, 0x222222);
        const logo = this.add.image(LX, LY, 'logo').setDisplaySize(LR * 2, LR * 2);
        const mask = this.make.graphics({ x: 0, y: 0, add: false });
        mask.fillStyle(0xffffff);
        mask.fillCircle(LX, LY, LR);
        logo.setMask(mask.createGeometryMask());

        // Score
        const SX = W / 2 + 80;
        this.add.text(SX, MID - 9, 'SCORE', { fontSize: '10px', color: '#aaaaaa' }).setOrigin(0, 0.5);
        this.scoreText = this.add.text(SX, MID + 8, '0', { fontSize: '20px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0, 0.5);

        // Pause button
        this.pauseBtn = this.add.text(W - 16, MID, '❚❚', {
            fontSize: '16px', color: '#ffffff',
            backgroundColor: '#333333', padding: { x: 8, y: 5 },
        }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
        this.pauseBtn.on('pointerover', () => this.pauseBtn.setStyle({ color: '#ffff00' }));
        this.pauseBtn.on('pointerout',  () => this.pauseBtn.setStyle({ color: '#ffffff' }));
        this.pauseBtn.on('pointerdown', () => this.togglePause());

        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

        // Pause menu
        this.pauseMenu = this.add.container(0, 0).setVisible(false).setDepth(50);
        this.buildPauseMenu(W);

        // Message
        this.messageText = this.add.text(W / 2, this.scale.height / 2, '', {
            fontSize: '64px', color: '#ffdd00', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 8,
        }).setOrigin(0.5).setVisible(false).setDepth(60);

        this.registry.events.on('update-score',      this.updateScore,     this);
        this.registry.events.on('update-health',     this.updateHealth,    this);
        this.registry.events.on('update-max-health', this.updateMaxHealth, this);
        this.registry.events.on('update-shield',     this.updateShield,    this);
        this.registry.events.on('game-over',         this.showGameOver,    this);
        this.registry.events.on('game-win',          this.showWin,         this);
    }

    buildPauseMenu(W) {
        const H = this.scale.height;
        const BW = 320, BH = 280;
        const BX = (W - BW) / 2, BY = (H - BH) / 2;

        const dim   = this.add.rectangle(0, 0, W, H, 0x000000, 0.65).setOrigin(0);
        const box   = this.add.rectangle(BX, BY, BW, BH, 0x1a1a2e, 0.97).setOrigin(0).setStrokeStyle(1.5, 0x444466);
        const title = this.add.text(W / 2, BY + 36, 'PAUSED', { fontSize: '32px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5);

        this.pauseMenu.add([
            dim, box, title,
            this.makePauseBtn(W / 2, BY + 110, 'Continue',  () => this.togglePause()),
            this.makePauseBtn(W / 2, BY + 170, 'Settings',  () => console.log('Settings')),
            this.makePauseBtn(W / 2, BY + 230, 'Main Menu', () => this.goToMenu()),
        ]);
    }

    makePauseBtn(x, y, label, cb) {
        const btn = this.add.text(x, y, label, {
            fontSize: '22px', color: '#ffffff',
            backgroundColor: '#2c2c4a', padding: { x: 24, y: 8 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        btn.on('pointerover',  () => btn.setStyle({ color: '#ffff00' }));
        btn.on('pointerout',   () => btn.setStyle({ color: '#ffffff' }));
        btn.on('pointerdown',  cb);
        return btn;
    }

    getGameScenes() {
        return this.scene.manager.scenes.filter(s => {
            const k = s.scene.key;
            if (PROTECTED.has(k)) return false;
            return this.scene.isActive(k) || this.scene.isPaused(k);
        });
    }

    togglePause() {
        this.paused = !this.paused;
        this.pauseMenu.setVisible(this.paused);
        this.pauseBtn.setText(this.paused ? '▶' : '❚❚');
        this.getGameScenes().forEach(s => {
            const k = s.scene.key;
            if (this.paused) this.scene.pause(k);
            else             this.scene.resume(k);
        });
    }

    goToMenu() {
        // FIX: crash was caused by wrong stop order.
        // Must be: unpause state → resume scenes → endGame/cleanup → stop UIScene → start Menu
        this.paused = false;
        this.pauseMenu.setVisible(false);
        this.pauseBtn.setText('❚❚');

        const scenes = this.getGameScenes();

        // 1. Resume any paused scenes first — can't stop a paused scene safely
        scenes.forEach(s => {
            if (this.scene.isPaused(s.scene.key)) this.scene.resume(s.scene.key);
        });

        // 2. Call endGame() if available — calculates coins before leaving
        let handled = false;
        scenes.forEach(s => {
            const obj = this.scene.get(s.scene.key);
            if (typeof obj?.endGame === 'function') {
                handled = true;
                obj.endGame('quit');
            }
        });

        // 3. Fallback — stop scenes that don't have endGame()
        if (!handled) {
            scenes.forEach(s => {
                const key = s.scene.key;
                const obj = this.scene.get(key);
                try { obj?.powerupSystem?.destroy(); } catch(e) {}
                try { obj?.audio?.destroy();         } catch(e) {}
                this.scene.stop(key);
            });
            this.time.delayedCall(80, () => {
                this.scene.stop('UIScene');
                this.scene.start('MenuScene');
            });
        }
        // If handled, endGame() takes care of navigation
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.escKey)) this.togglePause();
    }

    updateMaxHealth(v) { this.maxHealth = Math.max(1, v || 100); }

    updateHealth(v) {
        this.health = Math.max(0, v);
        const pct = Phaser.Math.Clamp(this.health / this.maxHealth, 0, 1);
        this.healthBar.width = Math.floor(pct * BAR_W);
        this.healthLabel.setText(String(Math.ceil(this.health)));
        if      (pct > 0.6) this.healthBar.setFillStyle(0x2ecc71);
        else if (pct > 0.3) this.healthBar.setFillStyle(0xe67e22);
        else                this.healthBar.setFillStyle(0xe74c3c);
    }

    updateScore(v)  { this.score = v; this.scoreText.setText(String(v)); }
    updateShield(v) {
        this.shield = Phaser.Math.Clamp(v, 0, 100);
        this.shieldBar.width = Math.floor((this.shield / 100) * BAR_W);
        this.shieldLabel.setText(String(Math.ceil(this.shield)));
    }

    showGameOver() { this.messageText.setText('GAME OVER').setVisible(true); }
    showWin()      { this.messageText.setText('YOU WIN!').setVisible(true);  }

    shutdown() {
        this.registry.events.off('update-score',      this.updateScore,     this);
        this.registry.events.off('update-health',     this.updateHealth,    this);
        this.registry.events.off('update-max-health', this.updateMaxHealth, this);
        this.registry.events.off('update-shield',     this.updateShield,    this);
        this.registry.events.off('game-over',         this.showGameOver,    this);
        this.registry.events.off('game-win',          this.showWin,         this);
    }
}