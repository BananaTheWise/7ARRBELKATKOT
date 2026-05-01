// game/systems/SpawnSystem.js
import Enemy from '../entities/enemies/Enemy.js';

export default class SpawnSystem {
    constructor(scene) {
        this.scene         = scene;
        this.timer         = 0;
        this.spawnInterval = 2000;
    }

    update(time, delta) {
        this.timer += delta;

        if (this.timer > this.spawnInterval) {
            if (this.scene.enemies.countActive(true) < 20) {
                this.spawnEnemy();
            }
            this.timer = 0;
        }
    }

    spawnEnemy() {
        const enemiesData = this.scene.cache.json.get('enemiesData');
        const keys        = Object.keys(enemiesData);
        const randomKey   = Phaser.Utils.Array.GetRandom(keys);
        const config      = enemiesData[randomKey];

        const x = this.scene.game.config.width + 50;
        const y = Phaser.Math.Between(50, this.scene.scale.height - 50);

        const enemy = new Enemy(this.scene, x, y, config, this.scene.enemyBullets);
        this.scene.enemies.add(enemy);
        enemy.applyVelocity();
    }

    increaseDifficulty(level) {
        this.spawnInterval = Math.max(500, 2000 - (level * 150));
        console.log("SpawnSystem: interval →", this.spawnInterval);
    }
}