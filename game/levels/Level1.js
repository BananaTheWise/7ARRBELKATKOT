// game/scenes/Level1Scene.js
import Player       from '../entities/player/Player.js';
import Bullet       from '../entities/bullets/Bullet.js';
import Enemy        from '../entities/enemies/Enemy.js';
import Boss         from '../entities/bosses/Boss.js';
import CombatSystem from '../systems/CombatSystem.js';
import PowerupSystem from '../systems/PowerupSystem.js';

// ── Wave definitions ──────────────────────────────────────────────────────────
// Each wave is an array of enemy config keys (from enemiesData JSON).
// Enemies spawn one at a time with a small delay between each.
const WAVES = [
    // Wave 1 — gentle intro, slow straights
    ['basic', 'basic', 'basic'],

    // Wave 2 — add a zigzagger
    ['basic', 'basic', 'zigzagger', 'zigzagger'],

    // Wave 3 — wavers appear
    ['waver', 'waver', 'basic', 'basic', 'basic'],

    // Wave 4 — mixed pressure
    ['zigzagger', 'waver', 'basic', 'zigzagger', 'waver'],

    // Wave 5 — first shooter
    ['shooter', 'basic', 'basic', 'zigzagger', 'zigzagger'],

    // Wave 6 — heavier shooters
    ['shooter', 'shooter', 'waver', 'waver', 'zigzagger', 'zigzagger'],

    // Wave 7 — everything at once, pre-boss rush
    ['shooter', 'zigzagger', 'waver', 'basic', 'shooter', 'zigzagger', 'waver', 'basic'],
];

const BOSS_WAVE = 8; // displayed wave number for the boss

export default class Level1Scene extends Phaser.Scene {
    constructor() {
        super({ key: 'Level1Scene' });
    }

    create() {
        console.log("Level1Scene Started");

        this.score       = 0;
        this.health      = 100;
        this.currentWave = 0;   // index into WAVES array
        this.waveActive  = false;
        this.bossSpawned = false;
        this.levelDone   = false;

        // ── Background ────────────────────────────────────────────────────
        this.bg = this.add.tileSprite(
            0, 0,
            this.scale.width, this.scale.height,
            'game_bg'
        ).setOrigin(0);

        // ── Player config ─────────────────────────────────────────────────
        this.playerSpeed  = 300;
        this.fireCooldown = 250;
        this.playerHealth = 100;

        // ── Groups ────────────────────────────────────────────────────────
        this.playerBullets = this.physics.add.group({
            classType:      Bullet,
            maxSize:        50,
            runChildUpdate: true,
        });

        this.enemies = this.physics.add.group({
            runChildUpdate: true,
        });

        this.enemyBullets = this.physics.add.group({
            classType:      Bullet,
            maxSize:        50,
            runChildUpdate: true,
        });

        // ── Player ────────────────────────────────────────────────────────
        this.player = new Player(
            this,
            100,
            this.scale.height / 2,
            this.playerBullets
        );

        this.player.on('damaged', (hp) => {
            this.health = hp;
            this.registry.events.emit('update-health', hp);
        });

        this.player.on('shield-changed', (shield) => {
            this.registry.events.emit('update-shield', shield);
        });

        this.player.on('dead', () => {
            this.registry.events.emit('game-over');
            this.time.delayedCall(1500, () => {
                this.scene.stop('Level1Scene');
                this.scene.stop('UIScene');
                this.scene.start('MenuScene');
            });
        });

        // ── Combat system ─────────────────────────────────────────────────
        this.combatSystem = new CombatSystem(this);
        this.powerupSystem = new PowerupSystem(this);

        // ── Overlaps ──────────────────────────────────────────────────────
        this.physics.add.overlap(
            this.playerBullets,
            this.enemies,
            this.combatSystem.handleBulletHitEnemy,
            null,
            this.combatSystem
        );

        this.physics.add.overlap(
            this.enemyBullets,
            this.player,
            (bullet, player) => {
                bullet.setActive(false).setVisible(false);
                bullet.body.enable = false;
                player.takeDamage(10);
            },
            (bullet, player) => player.active && !player.isDead
        );

        this.physics.add.overlap(
            this.enemies,
            this.player,
            (enemy, player) => {
                if (!enemy.active || !player.active || player.isDead) return;
                enemy.destroy();
                player.takeDamage(20);
            },
            (enemy, player) => player.active && !player.isDead
        );

        // ── Wave label UI ─────────────────────────────────────────────────
        this.waveText = this.add.text(
            this.scale.width / 2, 80,
            '', {
                fontSize:  '36px',
                color:     '#ffffff',
                fontStyle: 'bold',
                stroke:        '#000000',
                strokeThickness: 4,
            }
        ).setOrigin(0.5).setAlpha(0);

        // ── HUD reset ─────────────────────────────────────────────────────
        this.registry.events.emit('update-score',  this.score);
        this.registry.events.emit('update-health', this.health);
        this.registry.events.emit('update-shield', 0);

        // ── Start first wave after a short intro pause ────────────────────
        this.time.delayedCall(1000, () => this.startNextWave());
    }

    // ── Wave management ───────────────────────────────────────────────────

    startNextWave() {
        if (this.levelDone) return;

        // All 7 waves done — spawn boss
        if (this.currentWave >= WAVES.length) {
            this.spawnBoss();
            return;
        }

        const waveIndex  = this.currentWave;
        const waveNumber = waveIndex + 1;
        const enemyKeys  = WAVES[waveIndex];

        this.waveActive = true;
        this.currentWave++;

        this.showWaveLabel(`Wave ${waveNumber} / 7`);

        // Spawn enemies one by one with 600ms between each
        enemyKeys.forEach((key, i) => {
            this.time.delayedCall(i * 600, () => {
                if (!this.player?.active) return;
                this.spawnEnemy(key);
            });
        });

        // Check wave complete — poll until all enemies are gone
        this.time.addEvent({
            delay:    500,
            loop:     true,
            callback: () => {
                if (this.levelDone) return;
                if (!this.waveActive) return;

                const alive = this.enemies.countActive(true);
                if (alive === 0) {
                    this.waveActive = false;

                    // Brief pause between waves
                    this.time.delayedCall(1500, () => {
                        if (this.player?.active) this.startNextWave();
                    });
                }
            },
        });
    }

    spawnEnemy(key) {
        const enemiesData = this.cache.json.get('enemiesData');
        const config      = enemiesData[key];

        if (!config) {
            console.warn("Unknown enemy key:", key);
            return;
        }

        const x = this.game.config.width + 50;
        const y = Phaser.Math.Between(60, this.scale.height - 60);

        const enemy = new Enemy(this, x, y, config, this.enemyBullets);
        this.enemies.add(enemy);
        enemy.applyVelocity();
    }

    spawnBoss() {
        this.bossSpawned = true;
        this.showWaveLabel('⚠ BOSS ⚠');

        const bossesData = this.cache.json.get('bossesData');
        const keys       = Object.keys(bossesData);
        const randomKey  = Phaser.Utils.Array.GetRandom(keys);
        const config     = bossesData[randomKey];

        console.log("Level 1 boss:", randomKey);

        const boss = new Boss(
            this,
            this.game.config.width + 50,
            this.scale.height / 2,
            config,
            this.enemyBullets
        );

        this.enemies.add(boss);
        boss.applyVelocity();

        // Poll for boss death
        this.time.addEvent({
            delay:    300,
            loop:     true,
            callback: () => {
                if (this.levelDone) return;
                if (this.enemies.countActive(true) === 0 && this.bossSpawned) {
                    this.onLevelComplete();
                }
            },
        });
    }

    // ── Level complete ────────────────────────────────────────────────────

    onLevelComplete() {
        if (this.levelDone) return;
        this.levelDone = true;

        console.log("Level 1 Complete!");
        this.registry.events.emit('game-win');

        // Stop player input
        if (this.player?.active) {
            this.player.isDead = true;
        }

        // Show score screen after a short delay
        this.time.delayedCall(1500, () => this.showScoreScreen());
    }

    showScoreScreen() {
        // Dim overlay
        const overlay = this.add.rectangle(
            0, 0,
            this.scale.width, this.scale.height,
            0x000000, 0.75
        ).setOrigin(0);

        // Title
        this.add.text(this.scale.width / 2, 180, 'LEVEL 1 COMPLETE', {
            fontSize:        '52px',
            color:           '#ffdd00',
            fontStyle:       'bold',
            stroke:          '#000000',
            strokeThickness: 6,
        }).setOrigin(0.5);

        // Score
        this.add.text(this.scale.width / 2, 300, `Score: ${this.score}`, {
            fontSize:  '38px',
            color:     '#ffffff',
            stroke:    '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5);

        // Health remaining bonus
        const healthBonus = this.health * 2;
        this.add.text(this.scale.width / 2, 370, `Health Bonus: +${healthBonus}`, {
            fontSize:  '28px',
            color:     '#aaffaa',
            stroke:    '#000000',
            strokeThickness: 3,
        }).setOrigin(0.5);

        const total = this.score + healthBonus;
        this.add.text(this.scale.width / 2, 440, `Total: ${total}`, {
            fontSize:        '42px',
            color:           '#ffdd00',
            fontStyle:       'bold',
            stroke:          '#000000',
            strokeThickness: 5,
        }).setOrigin(0.5);

        // Back to menu button
        const btn = this.add.text(this.scale.width / 2, 560, '[ Main Menu ]', {
            fontSize:  '32px',
            color:     '#ffffff',
            stroke:    '#000000',
            strokeThickness: 3,
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => btn.setStyle({ color: '#ffff00' }));
        btn.on('pointerout',  () => btn.setStyle({ color: '#ffffff' }));
        btn.on('pointerdown', () => {
            this.scene.stop('Level1Scene');
            this.scene.stop('UIScene');
            this.scene.start('MenuScene');
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    showWaveLabel(text) {
        this.waveText.setText(text).setAlpha(1);
        this.tweens.add({
            targets:  this.waveText,
            alpha:    0,
            delay:    1500,
            duration: 800,
        });
    }

    // Called by Enemy.takeDamage() when an enemy dies
    onEnemyKilled(enemy) {
        this.score += enemy.scoreValue || 10;
        this.registry.events.emit('update-score', this.score);
    }

    onBossKilled() {
        this.registry.events.emit('game-win');
    }

    // ── Game loop ─────────────────────────────────────────────────────────

    update(time, delta) {
        this.bg.tilePositionX += 1;

        if (this.player?.active) {
            this.player.update(time, delta);
        }
    }
}