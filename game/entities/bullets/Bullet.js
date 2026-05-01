// game/entities/bullets/Bullet.js
export default class Bullet extends Phaser.Physics.Arcade.Image {
    constructor(scene, x, y) {
        // Default texture — overridden by fire() per bullet type
        super(scene, x, y, 'bullet_player');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // FIX: disable body immediately so pooled bullets at (0,0)
        // don't trigger phantom overlaps that kill the player on scene start
        this.setActive(false);
        this.setVisible(false);
        this.body.enable = false;

        this.damage = 10; // default, overridden by fire()
    }

    // textureKey — which bullet image to use
    // damage     — how much damage this bullet deals
    fire(x, y, velX, velY, textureKey = 'bullet_player', damage = 10) {
        this.body.reset(x, y);
        this.setActive(true);
        this.setVisible(true);
        this.body.enable = true;

        this.setTexture(textureKey);
        this.damage = damage;

        this.setVelocity(velX, velY);
        this.setAngle(velX > 0 ? 90 : -90);
        this.setScale(0.05);
    }

    update() {
        if (!this.active) return;
        if (
            this.x > this.scene.scale.width  + 50 ||
            this.x < -50
        ) {
            this.setActive(false);
            this.setVisible(false);
            this.body.enable = false;
        }
    }
}