// game/scenes/UIScene.js
const BAR_W  = 120;
const BAR_H  = 14;
const ICON_S = 28;
const HUD_H  = 60;

const PROTECTED = new Set(['UIScene', 'MenuScene', 'BootScene', 'PreloadScene']);

export default class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    create() {
        console.log("UIScene.js Loaded");

        const W = this.scale.width;

        this.score  = 0;
        this.health = 100;
        this.shield = 0;
        this.paused = false;

        // ── HUD strip ─────────────────────────────────────────────────────
        this.add.rectangle(0, 0, W, HUD_H, 0x111111, 0.92).setOrigin(0);
        this.add.rectangle(0, HUD_H - 1, W, 1, 0x444444).setOrigin(0);

        const MID = HUD_H / 2;
        let   CX  = 14;

        // ── Health icon + bar ─────────────────────────────────────────────
        this.add.image(CX + ICON_S / 2, MID, 'health_icon').setDisplaySize(ICON_S, ICON_S);
        CX += ICON_S + 6;
        this.add.rectangle(CX, MID, BAR_W, BAR_H, 0x333333).setOrigin(0, 0.5);
        this.healthBar   = this.add.rectangle(CX, MID, BAR_W, BAR_H, 0x2ecc71).setOrigin(0, 0.5);
        this.healthLabel = this.add.text(CX + BAR_W + 6, MID, '100', { fontSize: '13px', color: '#ffffff' }).setOrigin(0, 0.5);
        CX += BAR_W + 30;

        // ── Shield icon + bar ─────────────────────────────────────────────
        this.add.image(CX + ICON_S / 2, MID, 'shield_icom').setDisplaySize(ICON_S, ICON_S);
        CX += ICON_S + 6;
        this.add.rectangle(CX, MID, BAR_W, BAR_H, 0x333333).setOrigin(0, 0.5);
        this.shieldBar   = this.add.rectangle(CX, MID, 0, BAR_H, 0x3498db).setOrigin(0, 0.5);
        this.shieldLabel = this.add.text(CX + BAR_W + 6, MID, '0', { fontSize: '13px', color: '#aaddff' }).setOrigin(0, 0.5);

        // ── Logo ──────────────────────────────────────────────────────────
        const LOGO_R  = 24;
        const LOGO_CX = W / 2;
        const LOGO_CY = MID;
        this.add.circle(LOGO_CX, LOGO_CY, LOGO_R + 2, 0x222222);
        const logoImg = this.add.image(LOGO_CX, LOGO_CY, 'logo').setDisplaySize(LOGO_R * 2, LOGO_R * 2);
        const mask = this.make.graphics({ x: 0, y: 0, add: false });
        mask.fillStyle(0xffffff);
        mask.fillCircle(LOGO_CX, LOGO_CY, LOGO_R);
        logoImg.setMask(mask.createGeometryMask());
        this.add.circle(LOGO_CX, LOGO_CY, LOGO_R + 2, 0xffffff, 0).setStrokeStyle(1.5, 0x666666);

        // ── Score ─────────────────────────────────────────────────────────
        const SCORE_X = W / 2 + 80;
        this.add.text(SCORE_X, MID - 9, 'SCORE', { fontSize: '10px', color: '#aaaaaa' }).setOrigin(0, 0.5);
        this.scoreText = this.add.text(SCORE_X, MID + 8, '0', { fontSize: '20px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0, 0.5);

        // ── Pause button ──────────────────────────────────────────────────
        this.pauseBtn = this.add.text(W - 16, MID, '❚❚', {
            fontSize: '16px', color: '#ffffff',
            backgroundColor: '#333333', padding: { x: 8, y: 5 },
        }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
        this.pauseBtn.on('pointerover', () => this.pauseBtn.setStyle({ color: '#ffff00' }));
        this.pauseBtn.on('pointerout',  () => this.pauseBtn.setStyle({ color: '#ffffff' }));
        this.pauseBtn.on('pointerdown', () => this.togglePause());

        // ESC shortcut
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

        // ── Pause menu ────────────────────────────────────────────────────
        this.pauseMenu = this.add.container(0, 0).setVisible(false).setDepth(50);
        this.buildPauseMenu(W);

        // ── Game state message ────────────────────────────────────────────
        this.messageText = this.add.text(W / 2, this.scale.height / 2, '', {
            fontSize: '64px', color: '#ffdd00', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 8,
        }).setOrigin(0.5).setVisible(false).setDepth(60);

        // ── Events ───────────────────────────────────────────────────────
        this.registry.events.on('update-score',  this.updateScore,  this);
        this.registry.events.on('update-health', this.updateHealth, this);
        this.registry.events.on('update-shield', this.updateShield, this);
        this.registry.events.on('game-over',     this.showGameOver, this);
        this.registry.events.on('game-win',      this.showWin,      this);
    }

    // ── Pause menu ────────────────────────────────────────────────────────
    buildPauseMenu(W) {
        const H     = this.scale.height;
        const BOX_W = 320;
        const BOX_H = 280;
        const BOX_X = (W - BOX_W) / 2;
        const BOX_Y = (H - BOX_H) / 2;

        const dim   = this.add.rectangle(0, 0, W, H, 0x000000, 0.65).setOrigin(0);
        const box   = this.add.rectangle(BOX_X, BOX_Y, BOX_W, BOX_H, 0x1a1a2e, 0.97).setOrigin(0).setStrokeStyle(1.5, 0x444466);
        const title = this.add.text(W / 2, BOX_Y + 36, 'PAUSED', {
            fontSize: '32px', color: '#ffffff', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 4,
        }).setOrigin(0.5);

        const continueBtn = this.makePauseBtn(W / 2, BOX_Y + 110, 'Continue',  () => this.togglePause());
        const settingsBtn = this.makePauseBtn(W / 2, BOX_Y + 170, 'Settings',  () => console.log('Settings'));
        // FIX: Main Menu now calls endGame() on the active scene so
        // score is calculated and coins are awarded before leaving
        const backBtn     = this.makePauseBtn(W / 2, BOX_Y + 230, 'Main Menu', () => this.goToMenu());

        this.pauseMenu.add([dim, box, title, continueBtn, settingsBtn, backBtn]);
    }

    makePauseBtn(x, y, label, callback) {
        const btn = this.add.text(x, y, label, {
            fontSize: '22px', color: '#ffffff',
            backgroundColor: '#2c2c4a', padding: { x: 24, y: 8 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        btn.on('pointerover',  () => btn.setStyle({ color: '#ffff00' }));
        btn.on('pointerout',   () => btn.setStyle({ color: '#ffffff' }));
        btn.on('pointerdown',  callback);
        return btn;
    }

    // ── Find active game scenes ───────────────────────────────────────────
    getGameScenes() {
        return this.scene.manager.scenes.filter(scene => {
            const key = scene.scene.key;
            if (PROTECTED.has(key)) return false;
            return this.scene.isActive(key) || this.scene.isPaused(key);
        });
    }

    // ── Pause / resume ────────────────────────────────────────────────────
    togglePause() {
        this.paused = !this.paused;
        this.pauseMenu.setVisible(this.paused);
        this.pauseBtn.setText(this.paused ? '▶' : '❚❚');

        this.getGameScenes().forEach(scene => {
            const key = scene.scene.key;
            if (this.paused) this.scene.pause(key);
            else             this.scene.resume(key);
        });
    }

    // ── Main Menu — calculate gold first, then leave ──────────────────────
    goToMenu() {
        // Unpause state
        this.paused = false;
        this.pauseMenu.setVisible(false);
        this.pauseBtn.setText('❚❚');

        // Resume all paused scenes so endGame() can run
        this.getGameScenes().forEach(scene => {
            const key = scene.scene.key;
            if (this.scene.isPaused(key)) this.scene.resume(key);
        });

        // FIX: call endGame() on the active scene instead of just stopping it.
        // This lets the scene calculate coins, submit highscore, and show
        // the result screen before transitioning — instead of silently wiping.
        let handled = false;
        this.getGameScenes().forEach(scene => {
            const key      = scene.scene.key;
            const sceneObj = this.scene.get(key);

            if (typeof sceneObj?.endGame === 'function') {
                // Scene handles its own cleanup and transition
                sceneObj.endGame('quit');
                handled = true;
            }
        });

        // Fallback for scenes without endGame (Level1, Level2 etc)
        if (!handled) {
            this.getGameScenes().forEach(scene => {
                const key = scene.scene.key;
                this.scene.stop(key);
            });
            this.time.delayedCall(50, () => {
                this.scene.stop('UIScene');
                this.scene.start('MenuScene');
            });
        }
    }

    // ── Update ────────────────────────────────────────────────────────────
    update() {
        if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
            this.togglePause();
        }
    }

    // ── Stat updates ──────────────────────────────────────────────────────
    updateScore(value) {
        this.score = value;
        this.scoreText.setText(String(this.score));
    }

    updateHealth(value) {
        this.health = Phaser.Math.Clamp(value, 0, 100);
        this.healthBar.width = Math.max(0, Math.floor((this.health / 100) * BAR_W));
        this.healthLabel.setText(String(Math.ceil(this.health)));
        if (this.health > 60)      this.healthBar.setFillStyle(0x2ecc71);
        else if (this.health > 30) this.healthBar.setFillStyle(0xe67e22);
        else                       this.healthBar.setFillStyle(0xe74c3c);
    }

    updateShield(value) {
        this.shield = Phaser.Math.Clamp(value, 0, 100);
        this.shieldBar.width = Math.max(0, Math.floor((this.shield / 100) * BAR_W));
        this.shieldLabel.setText(String(Math.ceil(this.shield)));
    }

    showGameOver() { this.messageText.setText('GAME OVER').setVisible(true); }
    showWin()      { this.messageText.setText('YOU WIN!').setVisible(true);  }

    shutdown() {
        this.registry.events.off('update-score',  this.updateScore,  this);
        this.registry.events.off('update-health', this.updateHealth, this);
        this.registry.events.off('update-shield', this.updateShield, this);
        this.registry.events.off('game-over',     this.showGameOver, this);
        this.registry.events.off('game-win',      this.showWin,      this);
    }
}