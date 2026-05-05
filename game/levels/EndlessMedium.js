// game/levels/EndlessMedium.js
import EndlessBase from './EndlessBase.js';

export default class EndlessMedium extends EndlessBase {
    constructor() {
        super({ key: 'EndlessMedium' });
    }

    getDifficultyConfig() {
        return {
            label:             'Medium',
            color:             '#ffaa00',   // orange
            scoreMultiplier:   2.5,         // 2.5x all score gains
            crashBonus:        60,
            baseScorePerSec:   4,
            scalePerLevel:     2,

            // Spawning — noticeably faster
            spawnInterval:     1500,        // 1.5s between enemies
            spawnIntervalMin:  600,         // can get very fast at high levels
            spawnIntervalStep: 180,         // faster acceleration
            maxEnemies:        25,

            // Enemy stats — stronger
            enemySpeedMult:    1.3,         // noticeably faster
            enemyHpMult:       1.4,         // take more hits to kill
            enemyDamageMult:   1.3,         // hit harder
            enemyFireRateMult: 0.7,         // shoot significantly more often

            // Boss stats — substantially tougher
            bossHpMult:        1.5,
            bossSpeedMult:     1.3,

            // Fewer powerups — you have to earn them
            powerupDropChance: 0.20,        // 20%
        };
    }
}