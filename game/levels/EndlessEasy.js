// game/levels/EndlessEasy.js
import EndlessBase from './EndlessBase.js';

export default class EndlessEasy extends EndlessBase {
    constructor() {
        super({ key: 'EndlessEasy' });
    }

    getDifficultyConfig() {
        return {
            label:             'Easy',
            color:             '#44ff88',   // green
            scoreMultiplier:   1,           // base score, no bonus
            crashBonus:        25,
            baseScorePerSec:   2,
            scalePerLevel:     1,

            // Spawning — slow and capped
            spawnInterval:     2500,        // 2.5s between enemies
            spawnIntervalMin:  1200,        // never faster than 1.2s
            spawnIntervalStep: 100,         // small acceleration per level
            maxEnemies:        15,          // fewer on screen at once

            // Enemy stats — weakened
            enemySpeedMult:    0.75,        // enemies move slower
            enemyHpMult:       0.75,        // easier to kill
            enemyDamageMult:   0.75,        // less collision damage
            enemyFireRateMult: 1.5,         // higher = slower fire (ms between shots)

            // Boss stats
            bossHpMult:        0.7,
            bossSpeedMult:     0.8,

            // Powerups drop more often
            powerupDropChance: 0.40,        // 40%
        };
    }
}