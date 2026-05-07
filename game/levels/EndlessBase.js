// game/levels/EndlessBase.js
import Player        from '../entities/player/Player.js';
import Bullet        from '../entities/bullets/Bullet.js';
import SpawnSystem   from '../systems/SpawnSystem.js';
import LevelSystem   from '../systems/LevelSystem.js';
import CombatSystem  from '../systems/CombatSystem.js';
import PowerupSystem from '../systems/PowerupSystem.js';
import PlayerData    from '../data/PlayerData.js';
import AudioSystem   from '../systems/AudioSystem.js';

const HUD_H = 60;
const KC    = Phaser.Input.Keyboard.KeyCodes;

// P1: WASD + Space   P2: Arrows + Enter
const P1_CONTROLS = { up: KC.W,    down: KC.S,    left: KC.A,    right: KC.D,     fire: KC.SPACE };
const P2_CONTROLS = { up: KC.UP,   down: KC.DOWN, left: KC.LEFT, right: KC.RIGHT, fire: KC.ENTER };

export default class EndlessBase extends Phaser.Scene {

    getDifficultyConfig() {
        return {
            label:             'Easy',
            color:             '#44ff88',
            scoreMultiplier:   1,
            crashBonus:        25,
            baseScorePerSec:   2,
            scalePerLevel:     1,
            spawnInterval:     2500,
            spawnIntervalMin:  1200,
            spawnIntervalStep: 100,
            enemySpeedMult:    0.75,
            enemyHpMult:       0.75,
            enemyDamageMult:   0.75,
            enemyFireRateMult: 1.5,
            bossHpMult:        0.7,
            bossSpeedMult:     0.8,
            maxEnemies:        15,
            powerupDropChance: 0.40,
        };
    }

    // Called from GameScene with { mode, coop }
    init(data) {
        this.isCoop = data?.coop === true;
    }

    create() {
        this.cfg        = this.getDifficultyConfig();
        this.score      = 0;
        this.level      = 1;
        this.scoreTimer = 0;
        this.gameEnded  = false;

        const W = this.scale.width;
        const H = this.scale.height;

        this.cameras.main.setViewport(0, HUD_H, W, H - HUD_H);
        this.bg = this.add.tileSprite(0, 0, W, H, 'game_bg').setOrigin(0);

        // Difficulty watermark
        this.add.text(W - 14, 8,
            this.cfg.label.toUpperCase() + (this.isCoop ? ' · CO-OP' : ''), {
            fontSize: '12px', color: this.cfg.color,
        }).setOrigin(1, 0).setAlpha(0.5);

        // ── Ship stats & Setup ──────────────────────────────────────────
        const shipsData    = this.cache.json.get('shipsData');
        const rawSelection = PlayerData.getSelectedShip();
        const shipConfig   = shipsData?.[rawSelection] || Object.values(shipsData)[0];
        
        // This is the string ('player', 'ship2', 'ship3', etc.)
        const shipTexture  = shipConfig.texture || 'player';


        this.playerSpeed         = shipConfig.speed;
        this.fireCooldown        = shipConfig.fireRate;
        this.playerHealth        = shipConfig.health;
        this.playerDamage        = shipConfig.damage;
        this.playerBulletTexture = shipConfig.bulletTexture || 'bullet_player';

        // Shared health pool — lives on scene so both players share it
        this.maxSharedHealth = this.playerHealth;
        this.sharedHealth    = this.playerHealth;
        this.sharedShield    = 0;

        // Groups
        this.playerBullets = this.physics.add.group({ classType: Bullet, maxSize: 80, runChildUpdate: true });
        this.enemies       = this.physics.add.group({ runChildUpdate: true });
        this.enemyBullets  = this.physics.add.group({ classType: Bullet, maxSize: 80, runChildUpdate: true });

        // ── Spawn player(s) ───────────────────────────────────────────────
        this.players = [];

        this.player = new Player(this, 100, (H - HUD_H) / 2, this.playerBullets, P1_CONTROLS, 1,shipTexture);
        this.player.setTexture(shipConfig.texture || 'player');
        this.players.push(this.player);

        if (this.isCoop) {
            // P2 spawns slightly offset, same ship texture
            this.player2 = new Player(this, 100, (H - HUD_H) / 2 + 80, this.playerBullets, P2_CONTROLS, 2,shipTexture);
            this.player2.setTexture(shipConfig.texture || 'player');
            this.player2.setTint(0xaaddff); // slight blue tint to distinguish P2
            this.players.push(this.player2);
        }

        // Systems
        this.spawnSystem   = new SpawnSystem(this);
        this.levelSystem   = new LevelSystem(this);
        this.combatSystem  = new CombatSystem(this);
        this.powerupSystem = new PowerupSystem(this);
        this.audio         = new AudioSystem(this);

        this.spawnSystem.spawnInterval    = this.cfg.spawnInterval;
        this.spawnSystem.spawnIntervalMin = this.cfg.spawnIntervalMin;
        this.spawnSystem.maxEnemies       = this.cfg.maxEnemies;

        // ── Overlaps for each player ──────────────────────────────────────
        this.players.forEach(p => this.registerPlayerOverlaps(p));

        // HUD reset
        this.registry.events.emit('update-max-health', this.maxSharedHealth);
        this.registry.events.emit('update-score',      this.score);
        this.registry.events.emit('update-health',     this.sharedHealth);
        this.registry.events.emit('update-shield',     0);

        // Co-op P2 indicator
        if (this.isCoop) {
            this.add.text(this.player2.x - 20, this.player2.y - 40, 'P2', {
                fontSize: '14px', color: '#aaddff',
            }).setOrigin(0.5);

            this.add.text(this.player.x - 20, this.player.y - 40, 'P1', {
                fontSize: '14px', color: '#ffffff',
            }).setOrigin(0.5);
        }

        this.audio.playMusic('music_game');

        this.events.on('shutdown', () => {
            this.audio.destroy();
        });

        this.events.on('destroy', () => {
            this.audio.destroy();
        });
    }

    registerPlayerOverlaps(playerRef) {
        // Player bullets → enemies
        this.physics.add.overlap(
            this.playerBullets, this.enemies,
            this.combatSystem.handleBulletHitEnemy, null, this.combatSystem
        );

        // Enemy bullets → this player
        this.physics.add.overlap(
            this.enemyBullets, playerRef,
            (a, b) => {
                const bullet = (a instanceof Bullet) ? a : b;
                bullet.setActive(false).setVisible(false);
                bullet.body.enable = false;
                playerRef.takeDamage(bullet.damage || 10);
            },
            () => playerRef.active && !playerRef.isDead
        );

        // Enemy body → this player
        this.physics.add.overlap(
            this.enemies, playerRef,
            (a, b) => {
                if (!playerRef.active || playerRef.isDead) return;
                const enemy = (a === playerRef) ? b : a;
                if (!enemy.active) return;
                this.onEnemyKilled(enemy, true);
                enemy.destroy();
                playerRef.takeDamage(20);
            },
            () => playerRef.active && !playerRef.isDead
        );
    }

    // Called when a player dies — in co-op game ends only when ALL dead
    onPlayerDied(deadPlayer) {
        const allDead = this.players.every(p => p.isDead || !p.active);

        if (allDead) {
            this.registry.events.emit('game-over');
            this.endGame('dead');
        } else if (this.isCoop) {
            // Show "P1/P2 down" message but keep going
            const who = deadPlayer.playerIndex === 1 ? 'P1' : 'P2';
            const msg = this.add.text(
                this.scale.width / 2,
                this.scale.height / 2 - 40,
                `${who} DOWN!`, {
                    fontSize: '40px', color: '#ff4444',
                    stroke: '#000000', strokeThickness: 5,
                }
            ).setOrigin(0.5).setDepth(80);

            this.tweens.add({
                targets: msg, alpha: 0, y: msg.y - 60,
                delay: 800, duration: 600,
                onComplete: () => msg.destroy(),
            });
        } else {
            // Solo
            this.registry.events.emit('game-over');
            this.endGame('dead');
        }
    }

    update(time, delta) {
        this.bg.tilePositionX += 1;

        this.players.forEach(p => {
            if (p?.active) p.update(time, delta);
        });

        this.spawnSystem.update(time, delta);
        this.levelSystem.update(time, delta);

        // Time-based score
        this.scoreTimer += delta;
        if (this.scoreTimer >= 1000) {
            this.scoreTimer = 0;
            const perSec = Math.ceil(
                (this.cfg.baseScorePerSec + (this.level - 1) * this.cfg.scalePerLevel)
                * this.cfg.scoreMultiplier
            );
            this.addScore(perSec);
        }
    }

    addScore(amount) {
        this.score += amount;
        this.registry.events.emit('update-score', this.score);
    }

    onEnemyKilled(enemy, isCrash = false) {
        const base  = Math.ceil((enemy.scoreValue || 10) * this.cfg.scoreMultiplier);
        const bonus = isCrash ? Math.ceil(this.cfg.crashBonus * this.cfg.scoreMultiplier) : 0;
        this.addScore(base + bonus);
        if (this.powerupSystem) this.powerupSystem.onEnemyKilled(enemy.x, enemy.y);
    }

    onBossKilled() {
        this.addScore(Math.ceil(500 * this.cfg.scoreMultiplier));
        this.registry.events.emit('game-win');
        this.time.delayedCall(2000, () => this.endGame('boss'));
    }

    onLevelUp(level) {
        this.level = level;
    }

    getModifiedEnemyConfig(config) {
        return {
            ...config,
            hp:       Math.ceil(config.hp     * this.cfg.enemyHpMult),
            speed:    Math.ceil(config.speed  * this.cfg.enemySpeedMult),
            damage:   Math.ceil(config.damage * this.cfg.enemyDamageMult),
            fireRate: config.fireRate > 0
                ? Math.max(150, Math.ceil(config.fireRate * this.cfg.enemyFireRateMult))
                : 0,
        };
    }

    endGame(reason) {
        if (this.gameEnded) return;
        this.gameEnded = true;

        try { this.powerupSystem?.destroy(); } catch(e) {}
        try { this.audio?.destroy(); } catch(e) {}

        const coinsEarned = Math.floor(this.score / 10);
        const isNewHigh   = PlayerData.submitScore(this.score);
        PlayerData.addMoney(coinsEarned);

        this.showResultScreen(coinsEarned, isNewHigh, PlayerData.getHighscore(), reason);
    }

    showResultScreen(coinsEarned, isNewHigh, highscore, reason) {
        const W = this.scale.width;
        const H = this.scale.height;

        this.add.rectangle(0, 0, W, H, 0x000000, 0.82).setOrigin(0).setDepth(90);

        const modeLabel = this.cfg.label.toUpperCase() + (this.isCoop ? ' · CO-OP' : '');
        this.add.text(W / 2, H / 2 - 210, modeLabel, {
            fontSize: '18px', color: this.cfg.color, fontStyle: 'bold',
            backgroundColor: '#111111', padding: { x: 14, y: 4 },
        }).setOrigin(0.5).setDepth(91);

        const title = isNewHigh ? '🏆 NEW HIGH SCORE!' : (reason === 'quit' ? 'GAME QUIT' : 'GAME OVER');
        this.add.text(W / 2, H / 2 - 158, title, {
            fontSize: '40px', color: isNewHigh ? '#ffdd00' : '#ff4444',
            fontStyle: 'bold', stroke: '#000000', strokeThickness: 5,
        }).setOrigin(0.5).setDepth(91);

        this.add.text(W / 2, H / 2 - 95,  `Score: ${this.score}`,                    { fontSize: '30px', color: '#ffffff' }).setOrigin(0.5).setDepth(91);
        this.add.text(W / 2, H / 2 - 50,  `Best: ${highscore}`,                      { fontSize: '20px', color: '#aaaaaa' }).setOrigin(0.5).setDepth(91);
        this.add.text(W / 2, H / 2 - 10,  `Multiplier: ×${this.cfg.scoreMultiplier}`,{ fontSize: '18px', color: this.cfg.color }).setOrigin(0.5).setDepth(91);
        this.add.text(W / 2, H / 2 + 35,  `💰 +${coinsEarned} coins`,                { fontSize: '26px', color: '#ffdd00', fontStyle: 'bold' }).setOrigin(0.5).setDepth(91);
        this.add.text(W / 2, H / 2 + 75,  `Total: ${PlayerData.getMoney()} coins`,   { fontSize: '16px', color: '#aaaaaa' }).setOrigin(0.5).setDepth(91);

        const btn = this.add.text(W / 2, H / 2 + 140, '[ Main Menu ]', {
            fontSize: '28px', color: '#ffffff',
            backgroundColor: '#222222', padding: { x: 20, y: 8 },
        }).setOrigin(0.5).setDepth(91).setInteractive({ useHandCursor: true });

        btn.on('pointerover',  () => btn.setStyle({ color: '#ffff00' }));
        btn.on('pointerout',   () => btn.setStyle({ color: '#ffffff' }));
        btn.on('pointerdown',  () => {
            this.sound.stopAll();
            this.audio.destroy(); // fade out nicely
            this.scene.stop(this.scene.key);
            this.scene.stop('UIScene');
            this.scene.start('MenuScene');
        });
    }
}