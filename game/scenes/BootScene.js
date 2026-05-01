// game/scenes/BootScene.js
export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Load minimal assets needed for the loading screen
        // e.g., progress bar background, logo, etc.
        // this.load.image('logo', 'assets/logo.png');
    }

    create() {
        console.log("BootScene.js Loaded");
        this.scene.start('PreloadScene');
    }
}
