import BootScene from './game/scenes/BootScene.js';
import PreloadScene from './game/scenes/PreloadScene.js';
import MenuScene from './game/scenes/MenuScene.js';
import GameScene from './game/scenes/GameScene.js';
import UIScene from './game/scenes/UIScene.js';
import Endless from './game/levels/Endless.js';
import Level1Scene from './game/levels/Level1.js';
import Level2Scene from './game/levels/Level2.js';

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    scene: [BootScene, PreloadScene, MenuScene, GameScene, Endless, Level1Scene, Level2Scene, UIScene],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: true
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

console.log("main.js Done");
window.game = new Phaser.Game(config);