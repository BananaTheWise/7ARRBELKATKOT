// game/levels/Endless.js
import Player        from '../entities/player/Player.js';
import Bullet        from '../entities/bullets/Bullet.js';
import SpawnSystem   from '../systems/SpawnSystem.js';
import LevelSystem   from '../systems/LevelSystem.js';
import CombatSystem  from '../systems/CombatSystem.js';
import PowerupSystem from '../systems/PowerupSystem.js';
import PlayerData    from '../data/PlayerData.js';

const HUD_H              = 60;
const BASE_SCORE_PER_SEC = 2;
const SCALE_PER_LEVEL    = 1;
const CRASH_KILL_BONUS   = 25;

export default class Endless extends Phaser.Scene {
    constructor() {
        super({ key: 'EndlessScene' });
    }

    create() {
        console.log("Endless.js Started");

        this.score       = 0;
        this.health      = 100;
        this.level       = 1;
        this.scoreTimer  = 0;
        this.gameEnded   = false;

        const W = this.scale.width;
        const H = this.scale.height;

        this.cameras.main.setViewport(0, HUD_H, W, H - HUD_H);
        this.bg = this.add.tileSprite(0, 0, W, H, 'game_bg').setOrigin(0);

        // Load selected ship stats
        const shipsData   = this.cache.json.get('shipsData');
        const selectedKey = PlayerData.getSelectedShip();
        const shipConfig  = shipsData?.[selectedKey] || Object.values(shipsData)[0];

        this.playerSpeed  = shipConfig.speed;
        this.fireCooldown = shipConfig.fireRate;
        this.playerHealth = shipConfig.health;
        this.playerDamage = shipConfig.damage;

        // Groups
        this.playerBullets = this.physics.add.group({
            classType: Bullet, maxSize: 50, runChildUpdate: true,
        });
        this.enemies = this.physics.add.group({ runChildUpdate: true });
        this.enemyBullets = this.physics.add.group({
            classType: Bullet, maxSize: 50, runChildUpdate: true,
        });

        // Player
        this.player = new Player(this, 100, (H - HUD_H) / 2, this.playerBullets);
        this.player.setTexture(shipConfig.texture || 'player');

        this.player.on('damaged', (hp) => {
            this.health = hp;
            this.registry.events.emit('update-health', hp);
        });
        this.player.on('shield-changed', (shield) => {
            this.registry.events.emit('update-shield', shield);
        });
        this.player.on('dead', () => {
            this.registry.events.emit('game-over');
            this.endGame('dead');
        });

        // Systems
        this.spawnSystem   = new SpawnSystem(this);
        this.levelSystem   = new LevelSystem(this);
        this.combatSystem  = new CombatSystem(this);
        this.powerupSystem = new PowerupSystem(this);

        const playerRef = this.player;

        this.physics.add.overlap(
            this.playerBullets, this.enemies,
            this.combatSystem.handleBulletHitEnemy, null, this.combatSystem
        );

        this.physics.add.overlap(
            this.enemyBullets, playerRef,
            (objA, objB) => {
                const bullet = (objA instanceof Bullet) ? objA : objB;
                bullet.setActive(false).setVisible(false);
                bullet.body.enable = false;
                playerRef.takeDamage(10);
            },
            () => playerRef.active && !playerRef.isDead
        );

        this.physics.add.overlap(
            this.enemies, playerRef,
            (objA, objB) => {
                if (!playerRef.active || playerRef.isDead) return;
                const enemy = (objA === playerRef) ? objB : objA;
                if (!enemy.active) return;
                this.onEnemyKilled(enemy, true);
                enemy.destroy();
                playerRef.takeDamage(20);
            },
            () => playerRef.active && !playerRef.isDead
        );

        this.registry.events.emit('update-score',  this.score);
        this.registry.events.emit('update-health', this.health);
        this.registry.events.emit('update-shield', 0);
    }

    update(time, delta) {
        this.bg.tilePositionX += 1;
        if (this.player?.active) this.player.update(time, delta);
        this.spawnSystem.update(time, delta);
        this.levelSystem.update(time, delta);

        // Time-based score scaling with level
        this.scoreTimer += delta;
        if (this.scoreTimer >= 1000) {
            this.scoreTimer = 0;
            const perSec = BASE_SCORE_PER_SEC + (this.level - 1) * SCALE_PER_LEVEL;
            this.addScore(perSec);
        }
    }

    addScore(amount) {
        this.score += amount;
        this.registry.events.emit('update-score', this.score);
    }

    onEnemyKilled(enemy, isCrash = false) {
        const base  = enemy.scoreValue || 10;
        const bonus = isCrash ? CRASH_KILL_BONUS : 0;
        this.addScore(base + bonus);
        if (this.powerupSystem) {
            this.powerupSystem.onEnemyKilled(enemy.x, enemy.y);
        }
    }

    onBossKilled() {
        this.addScore(500);
        this.registry.events.emit('game-win');
        this.time.delayedCall(2000, () => this.endGame('boss'));
    }

    onLevelUp(level) {
        this.level = level;
    }

    // ── End game — calculate result, show screen ──────────────────────────
    endGame(reason) {
        if (this.gameEnded) return;
        this.gameEnded = true;

        if (this.powerupSystem) this.powerupSystem.destroy();

        // Calculate earnings
        const coinsEarned = Math.floor(this.score / 10);
        const isNewHigh   = PlayerData.submitScore(this.score);
        PlayerData.addMoney(coinsEarned);

        const highscore = PlayerData.getHighscore();

        // Show result overlay then go to menu
        this.showResultScreen(coinsEarned, isNewHigh, highscore);
    }

    showResultScreen(coinsEarned, isNewHigh, highscore) {
        const W = this.scale.width;
        const H = this.scale.height;

        // Pause game objects
        this.scene.pause('EndlessScene');

        // Overlay drawn on top via UIScene depth or directly here
        const overlay = this.add.rectangle(0, 0, W, H, 0x000000, 0.8)
            .setOrigin(0).setDepth(90);

        const title = isNewHigh
            ? '🏆 NEW HIGH SCORE!'
            : 'GAME OVER';

        this.add.text(W / 2, H / 2 - 160, title, {
            fontSize: '42px', color: isNewHigh ? '#ffdd00' : '#ff4444',
            fontStyle: 'bold', stroke: '#000000', strokeThickness: 5,
        }).setOrigin(0.5).setDepth(91);

        this.add.text(W / 2, H / 2 - 90, `Score: ${this.score}`, {
            fontSize: '32px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(91);

        this.add.text(W / 2, H / 2 - 40, `Best: ${highscore}`, {
            fontSize: '22px', color: '#aaaaaa',
        }).setOrigin(0.5).setDepth(91);

        this.add.text(W / 2, H / 2 + 10, `💰 +${coinsEarned} coins earned`, {
            fontSize: '26px', color: '#ffdd00',
            fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(91);

        const totalMoney = PlayerData.getMoney();
        this.add.text(W / 2, H / 2 + 50, `Total: ${totalMoney} coins`, {
            fontSize: '18px', color: '#aaaaaa',
        }).setOrigin(0.5).setDepth(91);

        // Back to menu button
        const btn = this.add.text(W / 2, H / 2 + 120, '[ Main Menu ]', {
            fontSize: '28px', color: '#ffffff',
            backgroundColor: '#222222',
            padding: { x: 20, y: 8 },
        }).setOrigin(0.5).setDepth(91).setInteractive({ useHandCursor: true });

        btn.on('pointerover',  () => btn.setStyle({ color: '#ffff00' }));
        btn.on('pointerout',   () => btn.setStyle({ color: '#ffffff' }));
        btn.on('pointerdown',  () => {
            this.scene.stop('EndlessScene');
            this.scene.stop('UIScene');
            this.scene.start('MenuScene');
        });
    }
}