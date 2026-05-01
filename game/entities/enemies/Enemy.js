// game/entities/enemies/Enemy.js
export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, config, enemyBullets) {
        super(scene, x, y, config.key || 'enemy');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.hp       = config.hp;
        this.speed    = config.speed;
        this.damage   = config.damage;
        this.behavior = config.behavior;

        this.canShoot     = config.shoot        || false;
        this.fireRate     = config.fireRate      || 0;
        this.bulletTexture = config.bulletTexture || 'bullet_enemy';
        this.bulletDamage  = config.bulletDamage  || 10;
        this.lastShot     = 0;

        this.enemyBullets = enemyBullets;

        this.setAngle(90);
        this.setScale(config.scale ?? 0.1);

        this._ready = false;
    }

    applyVelocity() {
        this.setVelocityX(-this.speed);
        this._ready = true;
    }

    update(time) {
        if (!this._ready) return;

        const gameWidth = this.scene.game.config.width;

        if (this.x < -50 || this.x > gameWidth + 200) {
            this.destroy();
            return;
        }

        switch (this.behavior) {
            case "zigzag":
                this.setVelocityX(-this.speed);
                this.setVelocityY(Math.sin(time * 0.008) * this.speed * 0.9);
                break;
            case "wave":
                this.setVelocityX(-this.speed);
                this.setVelocityY(Math.cos(time * 0.003) * 60);
                break;
            case "straight":
            default:
                this.setVelocityX(-this.speed);
                this.setVelocityY(0);
                break;
        }

        if (this.canShoot && this.active && time > this.lastShot) {
            const bullet = this.enemyBullets.get();
            if (bullet) {
                // Pass enemy-specific bullet texture and damage
                bullet.fire(
                    this.x, this.y,
                    -300, 0,
                    this.bulletTexture,
                    this.bulletDamage
                );
                this.lastShot = time + this.fireRate;
            }
        }
    }

    takeDamage(amount = 1) {
        this.hp -= amount;

        if (this.hp <= 0) {
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
}