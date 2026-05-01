// game/entities/enemies/Boss.js
import Enemy from '../enemies/Enemy.js';

export default class Boss extends Enemy {
    constructor(scene, x, y, config, enemyBullets) {
        super(scene, x, y, config, enemyBullets);

        // Enemy constructor already calls setScale(config.scale)
        // so no need to override it here — boss scale comes from bosses.json
        this.maxHp = this.hp;
        this.body.setCollideWorldBounds(true);
    }

    applyVelocity() {
        this.setVelocityX(-this.speed);
        this._ready = true;
    }

    update(time, delta) {
        if (!this._ready) return;

        const gameWidth = this.scene.game.config.width;

        // Enter from right, stop at 70% of screen width
        if (this.x > gameWidth * 0.7) {
            this.setVelocityX(-this.speed);
        } else {
            this.setVelocityX(0);
        }

        this.setVelocityY(Math.sin(time * 0.001) * 150);

        if (this.canShoot && this.active && time > this.lastShot) {
            const bullet = this.enemyBullets.get();
            if (bullet) {
                bullet.fire(this.x, this.y, -300, 0);
                this.lastShot = time + this.fireRate;
            }
        }
    }

    takeDamage(amount = 10) {
        super.takeDamage(amount);
        if (this.active) {
            this.scene.registry.events.emit('boss-health', this.hp, this.maxHp);
        }
    }
}