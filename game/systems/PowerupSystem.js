// game/systems/PowerupSystem.js
import Powerup, { POWERUP_TYPES } from '../entities/powerups/Powerup.js';

const ALL_TYPES   = Object.values(POWERUP_TYPES);
const DURATION    = 10000;
const DROP_CHANCE = 0.25;
const TIMER_SPAWN = 15000;

// ── Powerup config per type ───────────────────────────────────────────────────
// Adjust scale here to fit whatever image size you use.
// At 128x128px: 0.5 = 64px, 0.4 = 51px, 0.3 = 38px
const POWERUP_CONFIG = {
    [POWERUP_TYPES.SHIELD]:       { texture: 'powerup_shield',       scale: 0.08 },
    [POWERUP_TYPES.ATTACK_SPEED]: { texture: 'powerup_attack_speed', scale: 0.08 },
    [POWERUP_TYPES.HEALTH]:       { texture: 'powerup_health',       scale: 0.5  },
    [POWERUP_TYPES.GOLDEN_STAR]:  { texture: 'powerup_golden_star',  scale: 0.08 },
};

export default class PowerupSystem {
    constructor(scene) {
        this.scene          = scene;
        this.active         = {};
        this._goldenOverlap = null;

        this.group = scene.physics.add.group({
            classType:      Powerup,
            runChildUpdate: true,
        });

        const playerRef = scene.player;

        scene.physics.add.overlap(
            this.group,
            playerRef,
            (objA, objB) => {
                const powerup = (objA instanceof Powerup) ? objA : objB;
                if (!powerup.powerupType) {
                    console.error("Powerup missing type", powerup);
                    powerup.destroy();
                    return;
                }
                this.collect(powerup, playerRef);
            },
            () => playerRef.active && !playerRef.isDead
        );

        this.spawnTimer = scene.time.addEvent({
            delay:    TIMER_SPAWN,
            loop:     true,
            callback: () => this.spawnRandom(),
        });
    }

    // ── Called by Enemy on death ──────────────────────────────────────────
    onEnemyKilled(x, y) {
        if (Math.random() < DROP_CHANCE) {
            const type = Phaser.Utils.Array.GetRandom(ALL_TYPES);
            this.spawn(x, y, type);
        }
    }

    // ── Spawn ─────────────────────────────────────────────────────────────
    spawn(x, y, type) {
        const cfg = POWERUP_CONFIG[type] || POWERUP_CONFIG[POWERUP_TYPES.SHIELD];

        const p = this.group.create(x, y, null);
        p.powerupType = type;
        p.setTexture(cfg.texture);
        p.setScale(cfg.scale);
        p.setOrigin(0.5, 0.5);
        p.setAngle(0);
        p.applyVelocity();

        console.log("Powerup spawned:", type, "scale:", cfg.scale, "group size:", this.group.getLength());
    }

    spawnRandom() {
        const x    = this.scene.game.config.width + 30;
        const y    = Phaser.Math.Between(60, this.scene.scale.height - 60);
        const type = Phaser.Utils.Array.GetRandom(ALL_TYPES);
        this.spawn(x, y, type);
    }

    // ── Collect ───────────────────────────────────────────────────────────
    collect(powerup, player) {
        const type = powerup.powerupType;
        powerup.destroy();
        console.log("Powerup collected:", type);

        if (this.active[type] && type !== POWERUP_TYPES.HEALTH) {
            this.active[type].reset({ delay: DURATION, repeat: 0 });
            this.showLabel(type, true);
            if (type === POWERUP_TYPES.SHIELD) player.addShield(50);
            return;
        }

        this.applyEffect(type, player);
        this.showLabel(type, false);

        if (type === POWERUP_TYPES.HEALTH) return;

        this.active[type] = this.scene.time.delayedCall(DURATION, () => {
            this.expireEffect(type, player);
            delete this.active[type];
        });
    }

    // ── Apply effects ─────────────────────────────────────────────────────
    applyEffect(type, player) {
        switch (type) {
            case POWERUP_TYPES.SHIELD:
                player.addShield(50);
                break;

            case POWERUP_TYPES.ATTACK_SPEED:
                player._origCooldown = player.fireCooldown;
                player.fireCooldown  = Math.floor(player.fireCooldown / 2);
                break;

            case POWERUP_TYPES.HEALTH:
                player.addHealth(30);
                break;

            case POWERUP_TYPES.GOLDEN_STAR:
                player._origTakeDamage = player.takeDamage.bind(player);
                player._origCooldown   = player.fireCooldown;
                player.takeDamage      = () => {};
                player.fireCooldown    = Math.floor(player.fireCooldown / 3);
                player._goldenState    = true;
                player.setTint(0xffdd00);

                this._goldenOverlap = this.scene.physics.add.overlap(
                    this.scene.enemies,
                    player,
                    (objA, objB) => {
                        const enemy = (objA === player) ? objB : objA;
                        if (!enemy.active || !player._goldenState) return;
                        this.scene.onEnemyKilled(enemy);
                        enemy.destroy();
                    },
                    () => player.active && player._goldenState && !player.isDead
                );
                break;
        }
    }

    // ── Expire effects ────────────────────────────────────────────────────
    expireEffect(type, player) {
        if (!player?.active) return;

        switch (type) {
            case POWERUP_TYPES.SHIELD:
                player.shield = 0;
                player.emit('shield-changed', 0);
                break;

            case POWERUP_TYPES.ATTACK_SPEED:
                if (player._origCooldown !== undefined) {
                    player.fireCooldown = player._origCooldown;
                    delete player._origCooldown;
                }
                break;

            case POWERUP_TYPES.GOLDEN_STAR:
                if (player._origTakeDamage) {
                    player.takeDamage = player._origTakeDamage;
                    delete player._origTakeDamage;
                }
                if (player._origCooldown !== undefined) {
                    player.fireCooldown = player._origCooldown;
                    delete player._origCooldown;
                }
                player._goldenState = false;
                player.clearTint();

                if (this._goldenOverlap) {
                    this.scene.physics.world.removeCollider(this._goldenOverlap);
                    this._goldenOverlap = null;
                }
                break;
        }
    }

    // ── Floating label ────────────────────────────────────────────────────
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
                fontSize:        '26px',
                color:           '#ffdd00',
                fontStyle:       'bold',
                stroke:          '#000000',
                strokeThickness: 4,
            }
        ).setOrigin(0.5).setDepth(100);

        this.scene.tweens.add({
            targets:    txt,
            alpha:      0,
            y:          txt.y - 40,
            delay:      900,
            duration:   600,
            onComplete: () => txt.destroy(),
        });
    }

    // ── Cleanup ───────────────────────────────────────────────────────────
    destroy() {
        if (this.spawnTimer) this.spawnTimer.remove();
        Object.values(this.active).forEach(t => { if (t) t.remove(); });
        this.active = {};
    }
}