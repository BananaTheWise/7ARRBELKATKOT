// game/levels/EndlessMedium.js
import EndlessBase from './EndlessBase.js';

export default class EndlessMedium extends EndlessBase {
    constructor() { super({ key: 'EndlessMedium' }); }

    getDifficultyConfig() {
        return {
            label:             'Medium',
            color:             '#ffaa00',
            scoreMultiplier:   2.5,
            crashBonus:        60,
            baseScorePerSec:   4,
            scalePerLevel:     2,
            spawnInterval:     1500,
            spawnIntervalMin:  600,
            spawnIntervalStep: 180,
            enemySpeedMult:    1.3,
            enemyHpMult:       1.4,
            enemyDamageMult:   1.3,
            enemyFireRateMult: 0.7,
            bossHpMult:        1.5,
            bossSpeedMult:     1.3,
            maxEnemies:        25,
            powerupDropChance: 0.20,
        };
    }
}