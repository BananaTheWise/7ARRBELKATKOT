// ====================================================================
// Config
const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },  
    Scene: {
        preload,
        create,
        update
// src/scenes/MainScene.js
import Player from '../gameobjects/Player.js';
import EnemySpawner from '../systems/EnemySpawner.js';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
        this.gameState = 'menu';
    }
};

const game = new Phaser.Game(config);
// ====================================================================
    preload() {
        this.load.image('player', 'assets/imgs/player.png');
        this.load.image('background', 'assets/imgs/background2.png');
        this.load.image('enemy', 'assets/imgs/enemy.png');
        this.load.image('boss', 'assets/imgs/boss.png');
        this.load.image('rock', 'assets/imgs/rock.png');
        this.load.image('bullet', 'assets/imgs/bullet.png');

let player;
let cursors;
let playerSpeed;
let bullets;
let fireKey;
let enemies;
let enemyData;
let score;
let scoreText;
let playerHealth;
let healthText;
let background;
let shootSound;
let lastFired = 0;
let fireCooldown = 300;
let enemyTypes;
let enemyBullets;   
let gameState = 'menu';
let restartKey;
let menuText;
let pauseKey;  
let waveIndex = 0; 
        this.load.audio('explosion', 'assets/sounds/explosion.wav');
        this.load.audio('shoot', 'assets/sounds/shoot.wav');

// ====================================================================
// Preload
        this.load.json('config', 'data/config.json');

function preload() {
    this.load.image('player', 'assets/imgs/player.png');
    this.load.image('background', 'assets/imgs/background2.png');
    this.load.image('enemy', 'assets/imgs/enemy.png');
    this.load.image('boss', 'assets/imgs/boss.png');
    this.load.image('rock', 'assets/imgs/rock.png');
    this.load.image('bullet', 'assets/imgs/bullet.png');
        this.load.spritesheet('explosion', 'assets/imgs/boom.png', {
            frameWidth: 128,
            frameHeight: 128
        });
    }

    this.load.audio('explosion', 'assets/sounds/explosion.wav');
    this.load.audio('shoot', 'assets/sounds/shoot.wav');
    create() {
        this.background = this.add.tileSprite(0, 0, 1280, 720, 'background').setOrigin(0, 0);

    this.load.json('config', 'data/config.json');   
        const configData = this.cache.json.get('config');
        this.playerSpeed = configData.playerSpeed;
        this.fireCooldown = configData.fireCooldown;
        this.playerHealth = configData.playerHealth;
        this.score = 0;

    this.load.spritesheet('explosion', 'assets/imgs/boom.png', { 
        frameWidth: 128, 
        frameHeight: 128, 
        margin: 0,       
        spacing: 0       
    });
}
// ====================================================================
        this.player = new Player(this, 100, 300);
        
        this.enemySpawner = new EnemySpawner(this);

        this.physics.add.overlap(this.player.bullets, this.enemySpawner.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemySpawner.enemies, this.hitPlayer, null, this);
        this.physics.add.overlap(this.player, this.enemySpawner.enemyBullets, this.hitPlayer, null, this);

// ====================================================================
// Create
        this.anims.create({
            key: 'boom',
            frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 15 }),
            frameRate: 12,
            repeat: 0,
            hideOnComplete: true
        });

function create() 
{
    background = this.add.tileSprite(0,0,1280,720,'background');
    background.setOrigin(0,0);
    this.explosionSound = this.sound.add('explosion');

    pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    
    player = this.physics.add.sprite(100, 300, 'player');
    player.setAngle(90);
    player.setScale(0.1);
    
    cursors = this.input.keyboard.createCursorKeys();
    
    const data = this.cache.json.get('config');
    enemyTypes = data.enemies;
    playerSpeed = data.playerSpeed;
    
    bullets = this.physics.add.group({
        classType: Phaser.Physics.Arcade.Image,
        maxSize: 20,
        runChildUpdate: true
    });
    fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    enemies = this.physics.add.group({
        maxSize: 30
    });
        this.restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
        this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    enemyBullets = this.physics.add.group({
        maxSize: 30
    });
    
    this.time.addEvent(
        {
            delay: 1000,
            callback: () => 
                {
                    if (gameState !== 'playing') return;
                    spawnEnemy.call(this);
                },
            callbackScope: this,
            loop: true
        });   
            
    this.physics.add.overlap(bullets, enemies, hitEnemy, null, this);
            
    enemyData = data.enemyWaves;

    score = 0;
    playerHealth = 3;
    
    this.physics.add.overlap(player, enemies, hitPlayer, null, this);
    
    this.anims.create({
        key: 'boom',
        frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 15 }),
        frameRate: 12, 
        repeat: 0,    
        hideOnComplete: true 
    });
    
    shootSound = this.sound.add('shoot');
    
    this.physics.add.overlap(player, enemyBullets, hitPlayer, null, this);
    
    scoreText = this.add.text(10,10,'Score: 0', {fontSize: '20px', fill: '#fff'} );
    healthText = this.add.text(10,40,'Health: 3', {fontSize: '20px',fill: '#fff' } );
    Instructions3 = this.add.text(10,70,'Arrows: Move.', {fontSize: '20px',fill: '#fff' } );
    Instructions2 = this.add.text(10,100,'Space: Shoot.', {fontSize: '20px',fill: '#fff' } );
    Instructions = this.add.text(10,130,'P: Pause.', {fontSize: '20px',fill: '#fff' } );
    menuText = this.add.text(250, 300, 'Press SPACE to Start', {
        fontSize: '30px',
        fill: '#fff'
    });
    pauseText = this.add.text(540, 300, 'PAUSED', { fontSize: '40px', fill: '#ffff00' });
    pauseText.setVisible(false);
}
// ====================================================================





// ====================================================================
// Update
function update() {
    if (gameState === 'menu' && Phaser.Input.Keyboard.JustDown(fireKey)) 
        {
            gameState = 'playing';
        menuText.setVisible(false);
        this.setGameState('menu');
    }

    restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    if (gameState === 'gameover' && Phaser.Input.Keyboard.JustDown(restartKey)) 
    {
        gameState = 'menu';
        this.scene.restart();
    }
    
    if (Phaser.Input.Keyboard.JustDown(pauseKey)) 
    {
        if (gameState === 'playing')
        {
            gameState = 'paused';
            this.physics.pause();
        } 
        else if (gameState === 'paused') 
        {
            gameState = 'playing';
            this.physics.resume();
    update(time, delta) {
        if (this.gameState === 'menu' && Phaser.Input.Keyboard.JustDown(this.fireKey)) {
            this.setGameState('playing');
        }
    }

    if (gameState !== 'playing') return;

    background.tilePositionX += 2;

    player.setVelocity(player.body.velocity.x * 0.9);
    
    if (cursors.left.isDown) {
        player.setVelocityX(-playerSpeed);
    }
    else if (cursors.right.isDown) {
        player.setVelocityX(playerSpeed);
    }
    if (cursors.up.isDown) {
        player.setVelocityY(-playerSpeed);
    }
    else if (cursors.down.isDown) {
        player.setVelocityY(playerSpeed);
    }
    


    if (Phaser.Input.Keyboard.JustDown(fireKey)) {
        shoot.call(this);
    }

    bullets.getChildren().forEach(function(bullet) 
        {
        if (bullet.x > 1280) {
            bullet.setActive(false);
            bullet.setVisible(false);
            bullet.body.enable = false;
        if (this.gameState === 'gameover' && Phaser.Input.Keyboard.JustDown(this.restartKey)) {
            this.scene.restart();
        }
    });

    enemies.getChildren().forEach(function(enemy)
        {
            if (enemy.x < 0)
            {
                enemy.setActive(false);
                enemy.setVisible(false);
                enemy.body.enable = false;
        if (Phaser.Input.Keyboard.JustDown(this.pauseKey)) {
            if (this.gameState === 'playing') {
                this.setGameState('paused');
                this.physics.pause();
                this.enemySpawner.pause();
            } else if (this.gameState === 'paused') {
                this.setGameState('playing');
                this.physics.resume();
                this.enemySpawner.start();
            }
        }
    );

    enemies.getChildren().forEach((enemy) => {       
        if (!enemy.active || !enemy.shoot) return;
        if (this.gameState !== 'playing') return;

        if (this.time.now > enemy.lastShot) 
        {           
            let bullet = enemyBullets.get(enemy.x, enemy.y, 'bullet');
        this.background.tilePositionX += 2;
        this.player.update(time, delta);
    }

            if (bullet) 
            {
                bullet.setActive(true);
                bullet.setVisible(true);
                bullet.body.enable = true;
                bullet.setVelocityX(-200);
                bullet.setAngle(-90);
                bullet.setScale(0.025);
                enemy.lastShot = this.time.now + enemy.fireRate;
            }
        }
    }, this);
    setGameState(state) {
        this.gameState = state;
        this.events.emit('gamestatechange', this.gameState);
    }

    enemies.getChildren().forEach((enemy) => {
    hitEnemy(bullet, enemy) {
        if (!enemy.active) return;

        if (enemy.type === 'fast') 
        {
            enemy.setVelocityX(-enemy.speed);           
            enemy.setVelocityY(Math.sin(this.time.now * 0.005) * 100);
        }

        if (enemy.type === 'tank') 
        {
            enemy.setVelocityX(-enemy.speed);          
        }

        if (enemy.type === 'shooter') 
        {
            enemy.setVelocityX(-enemy.speed);
            enemy.setVelocityY(Math.cos(this.time.now * 0.003) * 50);
        }

    });

if (Phaser.Input.Keyboard.JustDown(pauseKey) && 
    (gameState === 'playing' || gameState === 'paused')) {
    
    if (gameState === 'playing') 
    {
        gameState = 'paused';
        this.physics.world.isPaused = true;
        pauseText.setVisible(true);
    } 
    else 
    {
        gameState = 'playing';
        this.physics.world.isPaused = false;
        pauseText.setVisible(false);
        bullet.setActive(false).setVisible(false).body.enable = false;
        enemy.takeDamage();
    }
}
}
// ====================================================================

    destroyEnemy(enemy) {
        let explosion = this.add.sprite(enemy.x, enemy.y, 'explosion');
        explosion.play('boom');
        explosion.on('animationcomplete', () => {
            explosion.destroy();
        });

        this.explosionSound.play();
        enemy.destroy();

        this.score += 10;
        this.events.emit('scorechange', this.score);



// ====================================================================
// Functions


function spawnEnemy() {
    let keys = Object.keys(enemyTypes);
    let type = Phaser.Utils.Array.GetRandom(keys);
    let config = enemyTypes[type];

    let enemy = enemies.get(
        1280,
        Phaser.Math.Between(50, 670),
        'enemy'
    );

    if (enemy) {
        enemy.setActive(true);
        enemy.setVisible(true); 
        enemy.body.enable = true;
        enemy.type = type;
        enemy.health = config.health;
        enemy.speed = config.speed;
        enemy.shoot = config.shoot;
        enemy.fireRate = config.fireRate || 0;
        enemy.lastShot = 0;
        enemy.setVelocityX(-config.speed);
        enemy.setAngle(90);
        enemy.setScale(0.1);
        this.cameras.main.shake(100, 0.01);
    }
}

function hitEnemy(bullet, enemy) {
    if (!enemy.active) return;
    hitPlayer(player, enemyOrBullet) {
        if (!enemyOrBullet.active) return;

    bullet.setActive(false).setVisible(false);
    bullet.body.enable = false;

    enemy.health--;

    if (enemy.health <= 0) {
        destroyEnemy.call(this, enemy);
    } else {
        enemy.setTint(0xff0000);
        this.time.delayedCall(100, () => {
            enemy.clearTint();
        });
        enemyOrBullet.setActive(false).setVisible(false);
        if (enemyOrBullet.body) {
            enemyOrBullet.body.enable = false;
        }
        if (enemyOrBullet.destroy) {
            enemyOrBullet.destroy();
        }
        
        player.takeDamage();
    }
}
    
function destroyEnemy(enemy) {
    let explosion = this.add.sprite(enemy.x, enemy.y, 'explosion');
    explosion.play('boom');
    explosion.on('animationcomplete', () => {
        explosion.destroy();
    });

    this.sound.play('explosion');

    enemy.setActive(false).setVisible(false);
    enemy.body.enable = false;

    score += 10;
    scoreText.setText('Score: ' + score);

    this.cameras.main.shake(100, 0.01);
}

function shoot() {
    let now = this.time.now;
    if (now - lastFired < fireCooldown) return;
    lastFired = now;

    let bullet = bullets.get(player.x + 20, player.y, 'bullet');
    if (bullet) {
        bullet.setActive(true);
        bullet.setVisible(true);
        bullet.body.enable = true;
        bullet.setVelocityX(400);
        bullet.setAngle(90);
        bullet.setScale(0.025);
    gameOver() {
        this.setGameState('gameover');
        this.player.setActive(false).setVisible(false);
        this.player.body.enable = false;
        this.physics.pause();
        this.enemySpawner.stop();
    }

    shootSound.play();
}

function hitPlayer(player, enemy) {
    enemy.setActive(false);
    enemy.setVisible(false);
    enemy.body.enable = false;

    playerHealth--;

    healthText.setText("Health: " + playerHealth);

    if (playerHealth <= 0) {
        gameOver.call(this);
        return; 
    }

    player.setTint(0xff0000);
    this.time.delayedCall(100, () => {
        player.clearTint();
    });
}

function gameOver(){
    gameState = 'gameover';             
                
    player.setActive(false).setVisible(false);
    player.body.enable = false;
    
    this.add.text(540, 360, 'GAME OVER\nPress R to Restart', {
        fontSize: '40px',
        fill: '#ff0000'
    });                                             

    this.physics.pause();
}