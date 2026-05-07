// main.js
import BootScene    from './game/scenes/BootScene.js';
import PreloadScene from './game/scenes/PreloadScene.js';
import MenuScene    from './game/scenes/MenuScene.js';
import GameScene    from './game/scenes/GameScene.js';
import UIScene      from './game/scenes/UIScene.js';

import EndlessEasy   from './game/levels/EndlessEasy.js';
import EndlessMedium from './game/levels/EndlessMedium.js';
import EndlessHard   from './game/levels/EndlessHard.js';
import Level1        from './game/levels/Level1.js';
import Level2        from './game/levels/Level2.js';

const config = {
    type:   Phaser.AUTO,
    width:  1280,
    height: 720,

    scene: [
        BootScene,
        PreloadScene,
        MenuScene,
        GameScene,
        EndlessEasy,
        EndlessMedium,
        EndlessHard,
        Level1,
        Level2,
        UIScene,
    ],

    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug:   true,   // set true to see hitboxes
        },
    },

    scale: {
        mode:       Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
};

console.log("main.js Done");
window.game = new Phaser.Game(config);