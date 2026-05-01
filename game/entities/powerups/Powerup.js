// game/entities/powerups/Powerup.js

export const POWERUP_TYPES = {
    SHIELD:       'shield',
    ATTACK_SPEED: 'attack_speed',
    HEALTH:       'health',
    GOLDEN_STAR:  'golden_star',
};

const TEXTURE_MAP = {
    [POWERUP_TYPES.SHIELD]:       'powerup_shield',
    [POWERUP_TYPES.ATTACK_SPEED]: 'powerup_attack_speed',
    [POWERUP_TYPES.HEALTH]:       'powerup_health',
    [POWERUP_TYPES.GOLDEN_STAR]:  'powerup_golden_star',
};

export default class Powerup extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type) {
        super(scene, x, y, TEXTURE_MAP[type] || 'powerup_shield');

        // FIX: do NOT call scene.add.existing() or scene.physics.add.existing()
        // here. PowerupSystem creates powerups via group.create() which handles
        // registration itself. Calling add.existing() separately causes the
        // object to be registered twice, breaking group membership.

        this.powerupType = type;
        this.setScale(0.08);
    }

    applyVelocity() {
        this.body.enable = true;
        this.setVelocityX(-80);

        // Bob up and down
        this.scene.tweens.add({
            targets:  this,
            y:        this.y + 12,
            duration: 900,
            yoyo:     true,
            repeat:   -1,
            ease:     'Sine.easeInOut',
        });
    }

    update() {
        if (this.x < -50) this.destroy();
    }
}