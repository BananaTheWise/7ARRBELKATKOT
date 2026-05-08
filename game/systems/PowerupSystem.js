// game/systems/PowerupSystem.js
import Powerup, { POWERUP_TYPES } from '../entities/powerups/Powerup.js';

const ALL_TYPES = Object.values(POWERUP_TYPES);
const DURATION  = 10000;

export default class PowerupSystem {
    constructor(scene) {
        this.scene          = scene;
        this.active         = {};
        this._goldenOverlap = [];
        this.DROP_CHANCE    = 0.25;

        this.group = scene.physics.add.group({
            classType:      Powerup,
            runChildUpdate: true,
        });

        // Register overlap for ALL players in the scene
        const players = scene.players || [scene.player];
        players.forEach(p => this.registerPlayerOverlap(p));

        this.spawnTimer = scene.time.addEvent({
            delay:    15000,
            loop:     true,
            callback: () => this.spawnRandom(),
        });
    }

    registerPlayerOverlap(playerRef) {
        this.scene.physics.add.overlap(
            this.group,
            playerRef,
            (objA, objB) => {
                const powerup = (objA instanceof Powerup) ? objA : objB;
                if (!powerup.powerupType) { powerup.destroy(); return; }
                this.collect(powerup, playerRef);
            },
            () => playerRef.active && !playerRef.isDead
        );
    }

    onEnemyKilled(x, y) {
        if (Math.random() < this.DROP_CHANCE) {
            this.spawn(x, y, Phaser.Utils.Array.GetRandom(ALL_TYPES));
        }
    }

    spawn(x, y, type) {
        const cfg = this._configFor(type);
        const p   = this.group.create(x, y, null);
        p.powerupType = type;
        p.setTexture(cfg.texture);
        p.setScale(cfg.scale);
        p.setOrigin(0.5, 0.5);
        p.setAngle(0);
        p.applyVelocity();
    }

    spawnRandom() {
        const x = this.scene.game.config.width + 30;
        const y = Phaser.Math.Between(60, this.scene.scale.height - 60);
        this.spawn(x, y, Phaser.Utils.Array.GetRandom(ALL_TYPES));
    }

    collect(powerup, player) {
        const type = powerup.powerupType;
        powerup.destroy();
        console.log("Powerup collected:", type, "by P" + player.playerIndex);

        // Refresh if already active
        if (this.active[type] && type !== POWERUP_TYPES.HEALTH) {
            this.active[type].reset({ delay: DURATION, repeat: 0 });
            this.showLabel(type, true);
            if (type === POWERUP_TYPES.SHIELD) {
                // Apply to all players
                this.getAllPlayers().forEach(p => p.addShield(50));
            }
            return;
        }

        this.applyEffect(type);
        this.showLabel(type, false);

        if (type === POWERUP_TYPES.HEALTH) return;

        this.active[type] = this.scene.time.delayedCall(DURATION, () => {
            this.expireEffect(type);
            delete this.active[type];
        });
    }

    // Returns all active players in the scene
    getAllPlayers() {
        const arr = this.scene.players || [this.scene.player];
        return arr.filter(p => p?.active && !p.isDead);
    }

    applyEffect(type) {
        const players = this.getAllPlayers();

        switch (type) {
            case POWERUP_TYPES.SHIELD:
                // Shield is shared pool — one call is enough
                players[0]?.addShield(50);
                break;

            case POWERUP_TYPES.ATTACK_SPEED:
                // Speed buff applies to ALL players
                players.forEach(p => {
                    p._origCooldown = p.fireCooldown;
                    p.fireCooldown  = Math.floor(p.fireCooldown / 2);
                });
                break;

            case POWERUP_TYPES.HEALTH:
                // Health is shared pool — one call
                players[0]?.addHealth(30);
                break;

            case POWERUP_TYPES.GOLDEN_STAR:
                // ALL players go golden
                players.forEach(p => {
                    p._origTakeDamage = p.takeDamage.bind(p);
                    p._origCooldown   = p.fireCooldown;
                    p.takeDamage      = () => {};
                    p.fireCooldown    = Math.floor(p.fireCooldown / 3);
                    p._goldenState    = true;
                    p.setTint(0xffdd00);
                });

                // Golden contact kill overlap for each player
                players.forEach(p => {
                    const ov = this.scene.physics.add.overlap(
                        this.scene.enemies, p,
                        (a, b) => {
                            const enemy = (a === p) ? b : a;
                            if (!enemy.active || !p._goldenState) return;
                            this.scene.onEnemyKilled(enemy);
                            enemy.destroy();
                        },
                        () => p.active && p._goldenState && !p.isDead
                    );
                    this._goldenOverlap.push(ov);
                });
                break;
        }
    }

    expireEffect(type) {
        const players = this.scene.players || [this.scene.player];

        switch (type) {
            case POWERUP_TYPES.SHIELD:
                this.scene.sharedShield = 0;
                this.scene.registry.events.emit('update-shield', 0);
                break;

            case POWERUP_TYPES.ATTACK_SPEED:
                players.forEach(p => {
                    if (!p?.active) return;
                    if (p._origCooldown !== undefined) {
                        p.fireCooldown = p._origCooldown;
                        delete p._origCooldown;
                    }
                });
                break;

            case POWERUP_TYPES.GOLDEN_STAR:
                players.forEach(p => {
                    if (!p?.active) return;
                    if (p._origTakeDamage) { p.takeDamage = p._origTakeDamage; delete p._origTakeDamage; }
                    if (p._origCooldown !== undefined) { p.fireCooldown = p._origCooldown; delete p._origCooldown; }
                    p._goldenState = false;
                    p.clearTint();
                    if (this.scene.isCoop && p.playerIndex === 2) p.setTint(0xaaddff);
                });

                this._goldenOverlap.forEach(ov => {
                    try { this.scene.physics.world.removeCollider(ov); } catch(e) {}
                });
                this._goldenOverlap = [];
                break;
        }
    }

    _configFor(type) {
        const map = {
            [POWERUP_TYPES.SHIELD]:       { texture: 'powerup_shield',       scale: 0.08 },
            [POWERUP_TYPES.ATTACK_SPEED]: { texture: 'powerup_attack_speed', scale: 0.08 },
            [POWERUP_TYPES.HEALTH]:       { texture: 'powerup_health',       scale: 0.08 },
            [POWERUP_TYPES.GOLDEN_STAR]:  { texture: 'powerup_golden_star',  scale: 0.08 },
        };
        return map[type] || map[POWERUP_TYPES.SHIELD];
    }

    showLabel(type, isRefresh) {
        const labels = {
            [POWERUP_TYPES.SHIELD]:       '🛡 Shield',
            [POWERUP_TYPES.ATTACK_SPEED]: '⚡ Attack Speed',
            [POWERUP_TYPES.HEALTH]:       '❤ Health +30',
            [POWERUP_TYPES.GOLDEN_STAR]:  '⭐ Golden Star',
        };
        const txt = this.scene.add.text(
            this.scene.scale.width / 2,
            this.scene.scale.height - 80,
            (isRefresh ? 'Refreshed: ' : '') + (labels[type] || type), {
                fontSize: '26px', color: '#ffdd00', fontStyle: 'bold',
                stroke: '#000000', strokeThickness: 4,
            }
        ).setOrigin(0.5).setDepth(100);

        this.scene.tweens.add({
            targets: txt, alpha: 0, y: txt.y - 40,
            delay: 900, duration: 600,
            onComplete: () => txt.destroy(),
        });
    }

    destroy() {
        if (this.spawnTimer) this.spawnTimer.remove();
        Object.values(this.active).forEach(t => { try { t?.remove(); } catch(e) {} });
        this.active = {};
    }
}