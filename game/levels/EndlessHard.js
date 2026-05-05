// game/levels/EndlessHard.js
import EndlessBase from './EndlessBase.js';

export default class EndlessHard extends EndlessBase {
    constructor() {
        super({ key: 'EndlessHard' });
    }

    getDifficultyConfig() {
        return {
            label:             'Hard',
            color:             '#ff3333',   // red
            scoreMultiplier:   5,           // 5x all score gains — massive reward if you survive
            crashBonus:        125,
            baseScorePerSec:   8,
            scalePerLevel:     4,

            // Spawning — relentless wall of enemies
            spawnInterval:     700,         // enemies spawn nearly every second from the start
            spawnIntervalMin:  250,         // at high levels, near-constant stream
            spawnIntervalStep: 250,         // ramps up extremely fast
            maxEnemies:        40,          // screen flooded with enemies

            // Enemy stats — near-impossible
            enemySpeedMult:    2.0,         // twice as fast as normal
            enemyHpMult:       2.5,         // very tanky — takes lots of hits
            enemyDamageMult:   2.0,         // two hits and you're near dead
            enemyFireRateMult: 0.4,         // shoot 2.5x more often than normal

            // Boss stats — nightmare tier
            bossHpMult:        3.0,
            bossSpeedMult:     1.8,

            // Almost no powerups — survival is on you
            powerupDropChance: 0.08,        // 8% — rare
        };
    }
}