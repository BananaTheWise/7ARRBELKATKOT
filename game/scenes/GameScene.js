// game/scenes/GameScene.js
// GameScene is a router — it receives the mode from MenuScene
// and immediately hands off to the correct scene.
// All game logic lives in EndlessScene, Level1Scene, Level2Scene etc.

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.mode = data?.mode || 'endless';
    }

    create() {
        console.log("GameScene routing to mode:", this.mode);

        switch (this.mode) {
            case 'endless':
                this.scene.start('EndlessScene');
                break;
            case 'level1':
                this.scene.start('Level1Scene');
                break;
            case 'level2':
                this.scene.start('Level2Scene');
                break;
            default:
                console.warn("Unknown mode:", this.mode, "— falling back to endless");
                this.scene.start('EndlessScene');
                break;
        }
    }
}