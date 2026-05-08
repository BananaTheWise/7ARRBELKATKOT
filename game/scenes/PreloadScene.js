// game/scenes/PreloadScene.js
export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }
    
    preload() {
        this.createProgressBar();

        // --- Error Handling ---
        // Set default values for failed JSON files to prevent crashes.
        this.load.on('filefail', (file) => {
            console.error(`Error loading asset: ${file.key} [${file.type}] @ ${file.url}`);
            if (file.type === 'json') {
                console.log(`Providing default empty object for failed JSON: ${file.key}`);
                this.cache.json.add(file.key, {});
            }
        });

        this.load.image('story_panel', 'assets/story.png');
        
        // ── Cursor img ────────────────────────────────────────────────────
        this.load.image('cursor_anim_1', 'assets/cursor_1.png');
        this.load.image('cursor_anim_2', 'assets/cursor_2.png');
        this.load.image('cursor_anim_3', 'assets/cursor_3.png');
        this.load.image('cursor_anim_4', 'assets/cursor_4.png');
        
        // ── JSON data ─────────────────────────────────────────────────────
        this.load.json('shipsData',   'game/data/ships.json');
        this.load.json('enemiesData', 'game/data/enemies.json');
        this.load.json('bossesData',  'game/data/bosses.json');
 
        // ── Ships ─────────────────────────────────────────────────────────
        this.load.image('player',   'assets/imgs/ships/player.png');
        this.load.image('player2',   'assets/imgs/ships/player2.png');
        this.load.image('player3',   'assets/imgs/ships/player3.png');
        this.load.image('player4',   'assets/imgs/ships/player4.png');
        this.load.image('player5',   'assets/imgs/ships/player5.png');
 
        // ── Enemies ───────────────────────────────────────────────────────
        this.load.image('enemy',    'assets/imgs/enemies/enemy_normal.png');
        this.load.image('enemy_basic',    'assets/imgs/enemies/enemy_basic.png');
        this.load.image('enemy_shooter',    'assets/imgs/enemies/enemy_shooter.png');
        this.load.image('enemy_tank',    'assets/imgs/enemies/enemy_tank.png');
        this.load.image('enemy_zigzag',    'assets/imgs/enemies/enemy_zigzag.png');
        this.load.image('boss1',    'assets/imgs/bosses/EndlessBoss1.png');
        this.load.image('boss2',     'assets/imgs/bosses/EndlessBoss2.png');
        // ── Enemies ICE ────────────────────────────────────────────────────
        this.load.image('enemy_level1',    'assets/imgs/enemies/icyenemy_normal.png');
        this.load.image('enemy_basic_level1',    'assets/imgs/enemies/icyenemy_basic.png');
        this.load.image('enemy_shooter_level1',    'assets/imgs/enemies/icyenemy_shooter.png');
        this.load.image('enemy_tank_level1',    'assets/imgs/enemies/icyenemy_tank.png');
        this.load.image('enemy_zigzag_level1',    'assets/imgs/enemies/icyenemy_zigzag.png');
        this.load.image('boss_level1',     'assets/imgs/bosses/BossLevel2.png');
        this.load.image('bg_level1',  'assets/imgs/backgrounds/background12.png');
        // ── Enemies LAVA ───────────────────────────────────────────────────
        this.load.image('enemy_level2',    'assets/imgs/enemies/lavaenemy_normal.png');
        this.load.image('enemy_basic_level2',    'assets/imgs/enemies/lavaenemy_basic.png');
        this.load.image('enemy_shooter_level2',    'assets/imgs/enemies/lavaenemy_shooter.png');
        this.load.image('enemy_tank_level2',    'assets/imgs/enemies/lavaenemy_tank.png');
        this.load.image('enemy_zigzag_level2',    'assets/imgs/enemies/lavaenemy_zigzag.png');
        this.load.image('boss_level2',     'assets/imgs/bosses/BossLevel2.png');
        this.load.image('bg_level2',  'assets/imgs/backgrounds/backgroundlava.png');
        
 
        // ── Bullets ───────────────────────────────────────────────────────
        this.load.image('bullet_player', 'assets/imgs/bullets/BulletSmall.png');
        this.load.image('bullet_enemy',  'assets/imgs/bullets/rocket.png');
        this.load.image('bullet_boss',   'assets/imgs/bullets/BulletLava.png');
 
        // ── Backgrounds ───────────────────────────────────────────────────
        this.load.image('menu_bg',  'assets/imgs/backgrounds/MainMenu.png');    
        this.load.image('game_bg',  'assets/imgs/backgrounds/endless.png');
 
        // ── UI ────────────────────────────────────────────────────────────
        this.load.image('health_icon',  'assets/imgs/health.png');
        this.load.image('shield_icom',  'assets/imgs/shield.png'); // typo matches usage
        this.load.image('logo',         'assets/imgs/logo.jpg');
 
        // ── Powerups ──────────────────────────────────────────────────────
        this.load.image('powerup_shield', 'assets/imgs/powerups/temppowerup.png');
        this.load.image('powerup_attack_speed', 'assets/imgs/powerups/temppowerup.png');
        this.load.image('powerup_health', 'assets/imgs/powerups/temppowerup.png');
        this.load.image('powerup_golden_star', 'assets/imgs/powerups/temppowerup.png');

        // ── FX ────────────────────────────────────────────────────────────
        this.load.spritesheet('explosion', 'assets/imgs/boom/boom1.png', {
            frameWidth: 128, frameHeight: 128,
        });    
 
        // ── Audio ─────────────────────────────────────────────────────────
        this.load.audio('shoot',     'assets/sounds/sfx/shoot.wav');
        this.load.audio('explosion', 'assets/sounds/sfx/explosion.wav');
        

        // Background music — one per scene
        this.load.audio('music_menu',    'assets/sounds/music/MenuMusic.mp3');
        this.load.audio('music_game',    'assets/sounds/music/GameMusic.mp3');
        this.load.audio('music_level1',  'assets/sounds/music/Level12.mp3');
        this.load.audio('music_level2',  'assets/sounds/music/Level12.mp3');

        // SFX
        this.load.audio('shoot',           'assets/sounds/sfx/shoot.wav');
        this.load.audio('explosion',       'assets/sounds/sfx/explosion.wav');
        this.load.audio('powerup_collect', 'assets/sounds/sfx/powerup.wav');
        this.load.audio('boss_dead',       'assets/sounds/sfx/boss_dead.wav');
        this.load.audio('level_up',        'assets/sounds/sfx/level_up.wav');

        // ── Difficulties ──────────────────────────────────────────────────
        this.load.image('easy', 'assets/imgs/easy.png');
        this.load.image('medium', 'assets/imgs/medium.png');
        this.load.image('hard', 'assets/imgs/hard.png');

        this.load.image('money_icon', 'assets/imgs/money.png');

    }

    create() {
        console.log("PreloadScene.js Loaded");
        this.scene.start('MenuScene');
    }

    createProgressBar() {
        const { width, height } = this.scale;
        const barWidth  = 400;
        const barHeight = 30;
        const x = (width  - barWidth)  / 2;
        const y = (height / 2) - (barHeight / 2);
 
        const bgBar = this.add.graphics();
        bgBar.fillStyle(0x222222, 1);
        bgBar.fillRect(x - 2, y - 2, barWidth + 4, barHeight + 4);
 
        const progressBar  = this.add.graphics();
        const loadingText  = this.add.text(width / 2, y - 30, 'Loading...', { fontSize: '20px', fill: '#ffffff' }).setOrigin(0.5);
        const percentText  = this.add.text(width / 2, y + barHeight / 2, '0%', { fontSize: '16px', fill: '#ffffff' }).setOrigin(0.5);
        const assetText    = this.add.text(width / 2, y + barHeight + 20, '', { fontSize: '13px', fill: '#aaaaaa' }).setOrigin(0.5);
 
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x00cc66, 1);
            progressBar.fillRect(x, y, barWidth * value, barHeight);
            percentText.setText(Math.floor(value * 100) + '%');
        });
 
        this.load.on('fileprogress', (file) => {
            assetText.setText('Loading: ' + file.key);
        });
 
        this.load.on('complete', () => {
            progressBar.destroy();
            bgBar.destroy();
            loadingText.destroy();
            percentText.destroy();
            assetText.destroy();
        });
    }
}
