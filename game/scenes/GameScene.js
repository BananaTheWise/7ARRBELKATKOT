// game/scenes/GameScene.js
export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.mode = data?.mode || 'endless_easy';
    }

    create() {
        console.log("GameScene routing to:", this.mode);

        const routes = {
            'endless_easy':   'EndlessEasy',
            'endless_medium': 'EndlessMedium',
            'endless_hard':   'EndlessHard',
            'level1':         'Level1Scene',
            'level2':         'Level2Scene',
        };

        const key = routes[this.mode];

        if (key) {
            this.scene.start(key);
        } else {
            console.warn("Unknown mode:", this.mode, "— falling back to EndlessEasy");
            this.scene.start('EndlessEasy');
        }
    }
}