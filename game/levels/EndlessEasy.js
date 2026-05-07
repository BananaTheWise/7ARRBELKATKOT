// game/levels/EndlessEasy.js
import EndlessBase from './EndlessBase.js';

export default class EndlessEasy extends EndlessBase {
    constructor() { super({ key: 'EndlessEasy' }); }

    getDifficultyConfig() {
        return {
            label:             'Easy',
            color:             '#44ff88',
            scoreMultiplier:   1,
            crashBonus:        25,
            baseScorePerSec:   2,
            scalePerLevel:     1,
            spawnInterval:     2500,
            spawnIntervalMin:  1200,
            spawnIntervalStep: 100,
            enemySpeedMult:    0.75,
            enemyHpMult:       0.75,
            enemyDamageMult:   0.75,
            enemyFireRateMult: 1.5,
            bossHpMult:        0.7,
            bossSpeedMult:     0.8,
            maxEnemies:        15,
            powerupDropChance: 0.40,
        };
    }
}