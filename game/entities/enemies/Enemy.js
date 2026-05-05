// game/entities/enemies/Enemy.js
export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, config, enemyBullets) {
        super(scene, x, y, config.key || 'enemy');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.hp            = config.hp;
        this.speed         = config.speed;
        this.damage        = config.damage;
        this.behavior      = config.behavior;
        this.canShoot      = config.shoot         || false;
        this.fireRate      = config.fireRate       || 0;
        this.bulletTexture = config.bulletTexture  || 'bullet_enemy';
        this.bulletDamage  = config.bulletDamage   || 10;
        this.scoreValue    = config.scoreValue     || 10;
        this.lastShot      = 0;
        this.enemyBullets  = enemyBullets;

        this.setAngle(90);

        // Scale from JSON — each enemy type has correct visual size
        const scale = config.scale ?? 0.1;
        this.setScale(scale);

        // FIX: shrink physics body to 60% of visual so hitbox matches
        // what the player sees. Without this a tank-sized sprite has a
        // hitbox that sticks out far beyond the visible ship edges.
        this.body.setSize(
            this.width  * 0.6,
            this.height * 0.6
        );

        // Velocity set in applyVelocity() AFTER enemies.add()
        // so group.add() reset doesn't wipe it
        this._ready = false;
    }

    applyVelocity() {
        this.setVelocityX(-this.speed);
        this._ready = true;
    }

    update(time) {
        if (!this._ready) return;

        if (this.x < -50 || this.x > this.scene.game.config.width + 200) {
            this.destroy();
            return;
        }

        switch (this.behavior) {
            case 'zigzag':
                this.setVelocityX(-this.speed);
                this.setVelocityY(Math.sin(time * 0.008) * this.speed * 0.9);
                break;
            case 'wave':
                this.setVelocityX(-this.speed);
                this.setVelocityY(Math.cos(time * 0.003) * 60);
                break;
            case 'straight':
            default:
                this.setVelocityX(-this.speed);
                this.setVelocityY(0);
                break;
        }

        if (this.canShoot && this.active && time > this.lastShot) {
            const bullet = this.enemyBullets.get();
            if (bullet) {
                bullet.fire(this.x, this.y, -300, 0, this.bulletTexture, this.bulletDamage);
                this.lastShot = time + this.fireRate;
            }
        }
    }

    takeDamage(amount = 10) {
        this.hp -= amount;

        if (this.hp <= 0) {
            this.spawnExplosion();
            this.scene.onEnemyKilled(this);
            if (this.scene.powerupSystem) {
                this.scene.powerupSystem.onEnemyKilled(this.x, this.y);
            }
            this.destroy();
        } else {
            this.setTint(0xff0000);
            this.scene.time.delayedCall(100, () => {
                if (this.active) this.clearTint();
            });
        }
    }

    spawnExplosion() {
        if (!this.scene.anims.exists('explode')) return;

        const ex = this.scene.add.sprite(this.x, this.y, 'explosion');
        // Scale explosion relative to enemy visual size
        ex.setScale(Math.max(0.4, this.scaleX * 2.5));
        ex.play('explode');
        ex.on('animationcomplete', () => ex.destroy());

        // Play sound
        try {
            this.scene.sound.play('explosion', { volume: 0.4 });
        } catch(e) {}
    }
}