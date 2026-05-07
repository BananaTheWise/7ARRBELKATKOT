// game/levels/EndlessHard.js
import EndlessBase from './EndlessBase.js';

export default class EndlessHard extends EndlessBase {
    constructor() { super({ key: 'EndlessHard' }); }

    getDifficultyConfig() {
        return {
            label:             'Hard',
            color:             '#ff3333',
            scoreMultiplier:   5,
            crashBonus:        125,
            baseScorePerSec:   8,
            scalePerLevel:     4,
            spawnInterval:     700,
            spawnIntervalMin:  250,
            spawnIntervalStep: 250,
            enemySpeedMult:    2.0,
            enemyHpMult:       2.5,
            enemyDamageMult:   2.0,
            enemyFireRateMult: 0.4,
            bossHpMult:        3.0,
            bossSpeedMult:     1.8,
            maxEnemies:        40,
            powerupDropChance: 0.08,
        };
    }
}