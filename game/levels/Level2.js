// game/levels/Level2.js
import Player        from '../entities/player/Player.js';
import Bullet        from '../entities/bullets/Bullet.js';
import Enemy         from '../entities/enemies/Enemy.js';
import Boss          from '../entities/bosses/Boss.js';
import CombatSystem  from '../systems/CombatSystem.js';
import PowerupSystem from '../systems/PowerupSystem.js';
import PlayerData    from '../data/PlayerData.js';

const HUD_H = 60;

const WAVES = [
    ['basic', 'zigzagger', 'basic', 'zigzagger'],
    ['shooter', 'basic', 'basic', 'zigzagger', 'zigzagger'],
    ['waver', 'waver', 'waver', 'shooter', 'basic'],
    ['shooter', 'shooter', 'zigzagger', 'waver', 'basic', 'basic'],
    ['shooter', 'waver', 'zigzagger', 'shooter', 'waver', 'zigzagger'],
    ['shooter', 'shooter', 'shooter', 'zigzagger', 'waver', 'waver', 'basic'],
    ['shooter', 'shooter', 'zigzagger', 'zigzagger', 'waver', 'waver', 'basic', 'shooter', 'zigzagger'],
];

export default class Level2 extends Phaser.Scene {
    constructor() {
        super({ key: 'Level2Scene' });
    }

    create() {
        this.score       = 0;
        this.health      = 100;
        this.currentWave = 0;
        this.waveActive  = false;
        this.bossSpawned = false;
        this.levelDone   = false;

        const W = this.scale.width;
        const H = this.scale.height;

        this.cameras.main.setViewport(0, HUD_H, W, H - HUD_H);

        // Level 2 specific background
        this.bg = this.add.tileSprite(0, 0, W, H, 'bg_level2').setOrigin(0);

        const shipsData  = this.cache.json.get('shipsData');
        const shipConfig = shipsData?.[PlayerData.getSelectedShip()] || Object.values(shipsData)[0];

        this.playerSpeed         = shipConfig.speed;
        this.fireCooldown        = shipConfig.fireRate;
        this.playerHealth        = shipConfig.health;
        this.playerDamage        = shipConfig.damage;
        this.playerBulletTexture = shipConfig.bulletTexture || 'bullet_player';

        this.playerBullets = this.physics.add.group({ classType: Bullet, maxSize: 50, runChildUpdate: true });
        this.enemies       = this.physics.add.group({ runChildUpdate: true });
        this.enemyBullets  = this.physics.add.group({ classType: Bullet, maxSize: 50, runChildUpdate: true });

        this.player = new Player(this, 100, (H - HUD_H) / 2, this.playerBullets);
        this.player.setTexture(shipConfig.texture || 'player');

        this.player.on('damaged',        hp => { this.health = hp; this.registry.events.emit('update-health', hp); });
        this.player.on('shield-changed', s  => { this.registry.events.emit('update-shield', s); });
        this.player.on('dead',           () => { this.registry.events.emit('game-over'); this.endGame('dead'); });

        this.combatSystem  = new CombatSystem(this);
        this.powerupSystem = new PowerupSystem(this);

        const playerRef = this.player;

        this.physics.add.overlap(this.playerBullets, this.enemies, this.combatSystem.handleBulletHitEnemy, null, this.combatSystem);

        this.physics.add.overlap(this.enemyBullets, playerRef,
            (a, b) => {
                const bullet = (a instanceof Bullet) ? a : b;
                bullet.setActive(false).setVisible(false);
                bullet.body.enable = false;
                playerRef.takeDamage(bullet.damage || 10);
            },
            () => playerRef.active && !playerRef.isDead
        );

        this.physics.add.overlap(this.enemies, playerRef,
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

        this.waveText = this.add.text(W / 2, 40, '', {
            fontSize: '36px', color: '#ffffff', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 4,
        }).setOrigin(0.5).setAlpha(0);

        this.registry.events.emit('update-max-health', this.playerHealth);
        this.registry.events.emit('update-score',      0);
        this.registry.events.emit('update-health',     this.playerHealth);
        this.registry.events.emit('update-shield',     0);

        this.time.delayedCall(1000, () => this.startNextWave());
    }

    startNextWave() {
        if (this.levelDone) return;
        if (this.currentWave >= WAVES.length) { this.spawnBoss(); return; }

        const keys = WAVES[this.currentWave];
        this.waveActive = true;
        this.currentWave++;
        this.showWaveLabel(`Wave ${this.currentWave} / 7`);

        keys.forEach((key, i) => {
            this.time.delayedCall(i * 400, () => {
                if (!this.player?.active) return;
                this.spawnEnemy(key);
            });
        });

        this.time.addEvent({ delay: 500, loop: true, callback: () => {
            if (this.levelDone || !this.waveActive) return;
            if (this.enemies.countActive(true) === 0) {
                this.waveActive = false;
                this.time.delayedCall(1200, () => { if (this.player?.active) this.startNextWave(); });
            }
        }});
    }

    spawnEnemy(key) {
        const base = this.cache.json.get('enemiesData')[key];
        if (!base) return;

        const textureMap = {
            basic:     'enemy_basic_level2',
            zigzagger: 'enemy_zigzag_level2',
            waver:     'enemy_basic_level2',
            shooter:   'enemy_shooter_level2',
            tank:      'enemy_tank_level2',
        };

        const config = {
            ...base,
            key:    textureMap[key] || 'enemy_level2',
            hp:     Math.ceil(base.hp    * 1.3),
            speed:  Math.ceil(base.speed * 1.2),
            damage: Math.ceil(base.damage * 1.2),
        };

        const x     = this.game.config.width + 50;
        const y     = Phaser.Math.Between(60, this.scale.height - 60);
        const enemy = new Enemy(this, x, y, config, this.enemyBullets);
        this.enemies.add(enemy);
        enemy.applyVelocity();
    }

    spawnBoss() {
        this.bossSpawned = true;
        this.showWaveLabel('⚠ BOSS ⚠');

        const bossesData = this.cache.json.get('bossesData');
        const baseConfig = bossesData[Phaser.Utils.Array.GetRandom(Object.keys(bossesData))];

        const config = {
            ...baseConfig,
            key:   'boss_level2',
            hp:    Math.floor(baseConfig.hp    * 1.5),
            speed: Math.floor(baseConfig.speed * 1.3),
        };

        const boss = new Boss(this, this.game.config.width + 50, this.scale.height / 2, config, this.enemyBullets);
        this.enemies.add(boss);
        boss.applyVelocity();

        this.time.addEvent({ delay: 300, loop: true, callback: () => {
            if (this.levelDone) return;
            if (this.enemies.countActive(true) === 0 && this.bossSpawned) this.onLevelComplete();
        }});
    }

    onLevelComplete() {
        if (this.levelDone) return;
        this.levelDone = true;
        this.registry.events.emit('game-win');
        if (this.player?.active) this.player.isDead = true;
        this.time.delayedCall(1500, () => this.showScoreScreen());
    }

    showScoreScreen() {
        const W = this.scale.width, H = this.scale.height;
        const earned      = Math.floor(this.score / 10);
        const healthBonus = this.health * 2;
        PlayerData.addMoney(earned);

        this.add.rectangle(0, 0, W, H, 0x000000, 0.8).setOrigin(0).setDepth(90);
        this.add.text(W/2, H/2-160, 'LEVEL 2 COMPLETE', { fontSize: '48px', color: '#ffdd00', fontStyle: 'bold', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5).setDepth(91);
        this.add.text(W/2, H/2-80,  `Score: ${this.score}`,             { fontSize: '30px', color: '#fff' }).setOrigin(0.5).setDepth(91);
        this.add.text(W/2, H/2-30,  `Health Bonus: +${healthBonus}`,    { fontSize: '22px', color: '#aaffaa' }).setOrigin(0.5).setDepth(91);
        this.add.text(W/2, H/2+20,  `Total: ${this.score+healthBonus}`, { fontSize: '36px', color: '#ffdd00', fontStyle: 'bold' }).setOrigin(0.5).setDepth(91);
        this.add.text(W/2, H/2+65,  `💰 +${earned} coins`,              { fontSize: '24px', color: '#ffdd00' }).setOrigin(0.5).setDepth(91);

        const btn = this.add.text(W/2, H/2+135, '[ Main Menu ]', {
            fontSize: '28px', color: '#fff', backgroundColor: '#222', padding: { x: 20, y: 8 },
        }).setOrigin(0.5).setDepth(91).setInteractive({ useHandCursor: true });
        btn.on('pointerover',  () => btn.setStyle({ color: '#ffff00' }));
        btn.on('pointerout',   () => btn.setStyle({ color: '#ffffff' }));
        btn.on('pointerdown',  () => { this.scene.stop('Level2Scene'); this.scene.stop('UIScene'); this.scene.start('MenuScene'); });
    }

    endGame(reason) {
        if (this.levelDone) return;
        this.levelDone = true;
        try { this.powerupSystem?.destroy(); } catch(e) {}
        PlayerData.addMoney(Math.floor(this.score / 10));
        this.time.delayedCall(100, () => { this.scene.stop('Level2Scene'); this.scene.stop('UIScene'); this.scene.start('MenuScene'); });
    }

    showWaveLabel(text) {
        this.waveText.setText(text).setAlpha(1);
        this.tweens.add({ targets: this.waveText, alpha: 0, delay: 1500, duration: 800 });
    }

    onEnemyKilled(enemy, isCrash = false) {
        this.score += (enemy.scoreValue || 10) + (isCrash ? 25 : 0);
        this.registry.events.emit('update-score', this.score);
        this.powerupSystem?.onEnemyKilled(enemy.x, enemy.y);
    }

    onBossKilled() { this.registry.events.emit('game-win'); }

    update(time, delta) {
        this.bg.tilePositionX += 1;
        if (this.player?.active) this.player.update(time, delta);
    }
}