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

export default class EndlessBase extends Phaser.Scene {

    // Subclasses override this to set difficulty numbers
    getDifficultyConfig() {
        return {
            label:             'Easy',
            color:             '#44ff88',
            scoreMultiplier:   1,
            crashBonus:        25,
            baseScorePerSec:   2,
            scalePerLevel:     1,
            spawnInterval:     2000,
            spawnIntervalMin:  800,
            spawnIntervalStep: 150,
            enemySpeedMult:    1.0,
            enemyHpMult:       1.0,
            enemyDamageMult:   1.0,
            enemyFireRateMult: 1.0,
            bossHpMult:        1.0,
            bossSpeedMult:     1.0,
            maxEnemies:        20,
            powerupDropChance: 0.30,
        };
    }

    create() {
        this.cfg        = this.getDifficultyConfig();
        this.score      = 0;
        this.health     = 100;
        this.level      = 1;
        this.scoreTimer = 0;
        this.gameEnded  = false;

        const W = this.scale.width;
        const H = this.scale.height;

        this.cameras.main.setViewport(0, HUD_H, W, H - HUD_H);
        this.bg = this.add.tileSprite(0, 0, W, H, 'game_bg').setOrigin(0);

        // Difficulty watermark top-right
        this.add.text(W - 14, 8, this.cfg.label.toUpperCase(), {
            fontSize: '12px', color: this.cfg.color,
        }).setOrigin(1, 0).setAlpha(0.5);

        // Ship stats
        const shipsData   = this.cache.json.get('shipsData');
        const selectedKey = PlayerData.getSelectedShip();
        const shipConfig  = shipsData?.[selectedKey] || Object.values(shipsData)[0];

        this.playerSpeed         = shipConfig.speed;
        this.fireCooldown        = shipConfig.fireRate;
        this.playerHealth        = shipConfig.health;
        this.playerDamage        = shipConfig.damage;
        this.playerBulletTexture = shipConfig.bulletTexture || 'bullet_player';

        // Groups
        this.playerBullets = this.physics.add.group({ classType: Bullet, maxSize: 50, runChildUpdate: true });
        this.enemies       = this.physics.add.group({ runChildUpdate: true });
        this.enemyBullets  = this.physics.add.group({ classType: Bullet, maxSize: 50, runChildUpdate: true });

        // Player
        this.player = new Player(this, 100, (H - HUD_H) / 2, this.playerBullets);
        this.player.setTexture(shipConfig.texture || 'player');

        this.player.on('damaged',        (hp)     => { this.health = hp; this.registry.events.emit('update-health', hp); });
        this.player.on('shield-changed', (shield) => { this.registry.events.emit('update-shield', shield); });
        this.player.on('dead',           ()       => { this.registry.events.emit('game-over'); this.endGame('dead'); });

        // Systems
        this.spawnSystem   = new SpawnSystem(this);
        this.levelSystem   = new LevelSystem(this);
        this.combatSystem  = new CombatSystem(this);
        this.powerupSystem = new PowerupSystem(this);
        this.audio         = new AudioSystem(this);

        // Apply difficulty to spawn system
        this.spawnSystem.spawnInterval    = this.cfg.spawnInterval;
        this.spawnSystem.spawnIntervalMin = this.cfg.spawnIntervalMin;
        this.spawnSystem.maxEnemies       = this.cfg.maxEnemies;

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
                playerRef.takeDamage(bullet.damage || 10);
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
                playerRef.takeDamage(Math.ceil(20 * this.cfg.enemyDamageMult));
            },
            () => playerRef.active && !playerRef.isDead
        );

        this.registry.events.emit('update-max-health', this.playerHealth);
        this.registry.events.emit('update-score',      this.score);
        this.registry.events.emit('update-health',     this.playerHealth);
        this.registry.events.emit('update-shield',     0);
    }

    update(time, delta) {
        this.bg.tilePositionX += 1;
        if (this.player?.active) this.player.update(time, delta);
        this.spawnSystem.update(time, delta);
        this.levelSystem.update(time, delta);

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

    // SpawnSystem calls this — we inject difficulty multipliers into config
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

        if (this.powerupSystem) this.powerupSystem.destroy();
        if (this.audio)         this.audio.destroy();

        const coinsEarned = Math.floor(this.score / 10);
        const isNewHigh   = PlayerData.submitScore(this.score);
        PlayerData.addMoney(coinsEarned);

        this.showResultScreen(coinsEarned, isNewHigh, PlayerData.getHighscore(), reason);
    }

    showResultScreen(coinsEarned, isNewHigh, highscore, reason) {
        const W = this.scale.width;
        const H = this.scale.height;

        this.add.rectangle(0, 0, W, H, 0x000000, 0.82).setOrigin(0).setDepth(90);

        this.add.text(W / 2, H / 2 - 210, this.cfg.label.toUpperCase() + ' MODE', {
            fontSize: '18px', color: this.cfg.color, fontStyle: 'bold',
            backgroundColor: '#111111', padding: { x: 14, y: 4 },
        }).setOrigin(0.5).setDepth(91);

        const title = isNewHigh ? '🏆 NEW HIGH SCORE!' : (reason === 'quit' ? 'GAME QUIT' : 'GAME OVER');
        this.add.text(W / 2, H / 2 - 158, title, {
            fontSize: '40px', color: isNewHigh ? '#ffdd00' : '#ff4444',
            fontStyle: 'bold', stroke: '#000000', strokeThickness: 5,
        }).setOrigin(0.5).setDepth(91);

        this.add.text(W / 2, H / 2 - 95,  `Score: ${this.score}`,              { fontSize: '30px', color: '#ffffff' }).setOrigin(0.5).setDepth(91);
        this.add.text(W / 2, H / 2 - 50,  `Best: ${highscore}`,               { fontSize: '20px', color: '#aaaaaa' }).setOrigin(0.5).setDepth(91);
        this.add.text(W / 2, H / 2 - 10,  `Multiplier: ×${this.cfg.scoreMultiplier}`, { fontSize: '18px', color: this.cfg.color }).setOrigin(0.5).setDepth(91);
        this.add.text(W / 2, H / 2 + 35,  `💰 +${coinsEarned} coins`,         { fontSize: '26px', color: '#ffdd00', fontStyle: 'bold' }).setOrigin(0.5).setDepth(91);
        this.add.text(W / 2, H / 2 + 75,  `Total: ${PlayerData.getMoney()} coins`, { fontSize: '16px', color: '#aaaaaa' }).setOrigin(0.5).setDepth(91);

        const btn = this.add.text(W / 2, H / 2 + 140, '[ Main Menu ]', {
            fontSize: '28px', color: '#ffffff',
            backgroundColor: '#222222', padding: { x: 20, y: 8 },
        }).setOrigin(0.5).setDepth(91).setInteractive({ useHandCursor: true });

        btn.on('pointerover',  () => btn.setStyle({ color: '#ffff00' }));
        btn.on('pointerout',   () => btn.setStyle({ color: '#ffffff' }));
        btn.on('pointerdown',  () => {
            this.scene.stop(this.scene.key);
            this.scene.stop('UIScene');
            this.scene.start('MenuScene');
        });
    }
}