// game/entities/player/Player.js
import Bullet from '../bullets/Bullet.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, bulletGroup) {
        super(scene, x, y, 'player');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setAngle(90);
        this.setScale(0.1);
        this.setCollideWorldBounds(true);

        // Stats from scene — set before new Player()
        this.speed          = scene.playerSpeed   ?? 300;
        this.fireCooldown   = scene.fireCooldown  ?? 250;
        this.maxHealth      = scene.playerHealth  ?? 100;
        this.health         = this.maxHealth;
        this.bulletDamage   = scene.playerDamage  ?? 10;
        // Which bullet texture this ship fires — set by game scene
        this.bulletTexture  = scene.playerBulletTexture ?? 'bullet_player';

        // Shield
        this.maxShield = 100;
        this.shield    = 0;

        // State
        this.isDead    = false;
        this.lastFired = 0;

        // FIX: use shared bulletGroup — NOT a private group.
        // Private group is invisible to overlap detection.
        this.bullets = bulletGroup;

        // Sound guard
        try {
            this.shootSound = scene.sound.add('shoot');
        } catch(e) {
            this.shootSound = null;
        }

        this.cursors = scene.input.keyboard.createCursorKeys();
        this.fireKey = scene.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
        );
    }

    update(time, delta) {
        if (this.isDead || !this.active) return;
        this.handleMovement();
        this.handleShooting(time);
    }

    handleMovement() {
        this.setVelocity(0);
        if (this.cursors.left.isDown)       this.setVelocityX(-this.speed);
        else if (this.cursors.right.isDown) this.setVelocityX(this.speed);
        if (this.cursors.up.isDown)         this.setVelocityY(-this.speed);
        else if (this.cursors.down.isDown)  this.setVelocityY(this.speed);
    }

    handleShooting(time) {
        // isDown instead of JustDown — holding fires continuously
        if (!this.fireKey.isDown) return;
        if (time < this.lastFired + this.fireCooldown) return;

        const bullet = this.bullets.get();
        if (bullet) {
            // Pass ship-specific bullet texture and damage
            bullet.fire(
                this.x + 20, this.y,
                400, 0,
                this.bulletTexture,
                this.bulletDamage
            );
            this.lastFired = time;
            if (this.shootSound) this.shootSound.play();
        }
    }

    takeDamage(amount = 10) {
        // FIX: hard guard — overlaps can fire multiple times per frame.
        // Without this health goes -999 and die() fires repeatedly,
        // crashing on an already-destroyed physics body.
        if (this.isDead || !this.active) return;

        // Shield absorbs first
        if (this.shield > 0) {
            const absorbed = Math.min(this.shield, amount);
            this.shield   -= absorbed;
            amount        -= absorbed;
            this.emit('shield-changed', this.shield);
            this.setTint(0x4488ff);
            this.scene.time.delayedCall(120, () => {
                if (this.active) this.clearTint();
            });
        }

        // Remainder hits health
        if (amount > 0) {
            this.health = Math.max(0, this.health - amount);
            this.emit('damaged', this.health);
            this.setTint(0xff0000);
            this.scene.time.delayedCall(120, () => {
                if (this.active) this.clearTint();
            });
            if (this.health <= 0) this.die();
        }
    }

    addShield(amount = 50) {
        this.shield = Math.min(this.maxShield, this.shield + amount);
        this.emit('shield-changed', this.shield);
    }

    addHealth(amount = 30) {
        this.health = Math.min(this.maxHealth, this.health + amount);
        this.emit('damaged', this.health);
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.emit('dead');
        this.destroy();
    }
}