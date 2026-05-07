// game/scenes/GameScene.js
export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.mode = data?.mode || 'endless_easy';
        this.coop = data?.coop || false;
    }

    create() {
        const routes = {
            'endless_easy':   'EndlessEasy',
            'endless_medium': 'EndlessMedium',
            'endless_hard':   'EndlessHard',
            'level1':         'Level1Scene',
            'level2':         'Level2Scene',
        };

        const key = routes[this.mode];

        if (key) {
            // Pass coop flag so the endless scene knows which mode
            this.scene.start(key, { coop: this.coop });
        } else {
            console.warn("Unknown mode:", this.mode);
            this.scene.start('EndlessEasy', { coop: this.coop });
        }
    }
}