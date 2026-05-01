// game/systems/LevelSystem.js
import Boss from '../entities/bosses/Boss.js';

export default class LevelSystem {
    constructor(scene) {
        this.scene       = scene;
        this.time        = 0;
        this.level       = 1;
        this.bossSpawned = false;
    }

    update(time, delta) {
        this.time += delta;

        if (this.time > 10000) {
            this.level++;
            this.time        = 0;
            this.bossSpawned = false;
            console.log("Level up →", this.level);

            if (typeof this.scene.spawnSystem.increaseDifficulty === 'function') {
                this.scene.spawnSystem.increaseDifficulty(this.level);
            }
        }

        if (this.level % 5 === 0 && !this.bossSpawned) {
            this.spawnBoss();
            this.bossSpawned = true;
        }
    }

    spawnBoss() {
        console.log("Spawning boss at level", this.level);

        // Read from bossesData JSON — pick a random boss type
        const bossesData = this.scene.cache.json.get('bossesData');
        const keys       = Object.keys(bossesData);
        const randomKey  = Phaser.Utils.Array.GetRandom(keys);
        const config     = bossesData[randomKey];

        console.log("Boss type:", randomKey);

        const boss = new Boss(
            this.scene,
            this.scene.game.config.width + 50,
            this.scene.scale.height / 2,
            config,
            this.scene.enemyBullets
        );

        this.scene.enemies.add(boss);

        // FIX: call applyVelocity after add() same as regular enemies
        boss.applyVelocity();

        boss.on('killed', () => this.scene.onBossKilled());
    }
}