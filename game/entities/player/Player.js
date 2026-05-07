// game/entities/player/Player.js
import Bullet from '../bullets/Bullet.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {

    // controls config:
    // { up, down, left, right, fire } — Phaser.Input.Keyboard.KeyCodes values
    // playerIndex: 1 or 2 — used for tint color on damage
    constructor(scene, x, y, bulletGroup, controls = null, playerIndex = 1, texture = 'player') {
        super(scene, x, y, 'player');

        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.playerIndex  = playerIndex;
        this.setCollideWorldBounds(true);
        this.setAngle(90);

        console.log(texture);

        switch (texture) {
        case 'player2':{
            const physicsWidth = 1000;   
            const physicsHeight = 750; 
            this.setScale(0.1);
            this.body.setSize(physicsWidth, physicsHeight, true);
            this.body.setOffset(0, 120);
            break;
        }
        case 'player3':{
            const physicsWidth = 250; 
            const physicsHeight = 300; 
            this.setScale(0.4);
            this.body.setSize(physicsWidth, physicsHeight, true);
            this.body.setOffset(0, 0);
            break;
        }
        case 'player4':{
            const physicsWidth = 250; 
            const physicsHeight = 400; 
            this.setScale(0.5);
            this.body.setSize(physicsWidth, physicsHeight, true);
            this.body.setOffset(40, -60);
            break;
        }
        case 'player5':{
            const physicsWidth = 250; 
            const physicsHeight = 300; 
            this.setScale(0.6);
            this.body.setSize(physicsWidth, physicsHeight, true);
            this.body.setOffset(0, 0);
            break;
        }
        default:{
            this.setScale(0.1);
            this.setCollideWorldBounds(true);
            break;
        }
    }

        // Stats from scene
        this.speed        = scene.playerSpeed  ?? 300;
        this.fireCooldown = scene.fireCooldown ?? 250;
        this.maxHealth    = scene.playerHealth ?? 100;
        this.bulletDamage = scene.playerDamage ?? 10;
        this.bulletTexture = scene.playerBulletTexture ?? 'bullet_player';

        // In co-op, health/shield live on the SCENE (shared pool)
        // In solo, health/shield live on the player itself
        // We always read/write via scene helpers so both modes work the same
        if (!scene.sharedHealth) {
            // Solo mode — init scene health from playerHealth
            scene.sharedHealth = scene.playerHealth ?? 100;
            scene.sharedShield = 0;
            scene.maxSharedHealth = scene.playerHealth ?? 100;
        }

        this.isDead    = false;
        this.lastFired = 0;
        this.bullets   = bulletGroup;

        // Sound
        try { this.shootSound = scene.sound.add('shoot'); }
        catch(e) { this.shootSound = null; }

        // Controls — default P1 (WASD + Space)
        const KC = Phaser.Input.Keyboard.KeyCodes;
        const defaultControls = {
            up:    KC.W,
            down:  KC.S,
            left:  KC.A,
            right: KC.D,
            fire:  KC.SPACE,
        };

        const cfg = controls || defaultControls;
        this.keys = {
            up:    scene.input.keyboard.addKey(cfg.up),
            down:  scene.input.keyboard.addKey(cfg.down),
            left:  scene.input.keyboard.addKey(cfg.left),
            right: scene.input.keyboard.addKey(cfg.right),
            fire:  scene.input.keyboard.addKey(cfg.fire),
        };
    }

    update(time, delta) {
        if (this.isDead || !this.active) return;
        this.handleMovement();
        this.handleShooting(time);
    }

    handleMovement() {
        this.setVelocity(0);
        if (this.keys.left.isDown)       this.setVelocityX(-this.speed);
        else if (this.keys.right.isDown) this.setVelocityX(this.speed);
        if (this.keys.up.isDown)         this.setVelocityY(-this.speed);
        else if (this.keys.down.isDown)  this.setVelocityY(this.speed);
    }

    handleShooting(time) {
        if (!this.keys.fire.isDown) return;
        if (time < this.lastFired + this.fireCooldown) return;

        const bullet = this.bullets.get();
        if (bullet) {
            bullet.fire(this.x + 20, this.y, 400, 0, this.bulletTexture, this.bulletDamage);
            this.lastFired = time;
            if (this.scene.audio) this.scene.audio.playShoot();
        }
    }

    takeDamage(amount = 10) {
        if (this.isDead || !this.active) return;

        // All damage goes to SHARED pool on scene
        const scene = this.scene;

        // Shield absorbs first
        if (scene.sharedShield > 0) {
            const absorbed     = Math.min(scene.sharedShield, amount);
            scene.sharedShield -= absorbed;
            amount             -= absorbed;
            scene.registry.events.emit('update-shield', scene.sharedShield);

            // Blue flash
            this.setTint(0x4488ff);
            scene.time.delayedCall(120, () => { if (this.active) this.clearTint(); });
        }

        if (amount > 0) {
            scene.sharedHealth = Math.max(0, scene.sharedHealth - amount);
            scene.registry.events.emit('update-health', scene.sharedHealth);

            // Red flash — different tint per player so you can see who got hit
            const tint = this.playerIndex === 1 ? 0xff0000 : 0xff6600;
            this.setTint(tint);
            scene.time.delayedCall(120, () => { if (this.active) this.clearTint(); });

            if (scene.sharedHealth <= 0) this.die();
        }
    }

    // addShield / addHealth operate on shared pool
    addShield(amount = 50) {
        const scene = this.scene;
        scene.sharedShield = Math.min(100, (scene.sharedShield || 0) + amount);
        scene.registry.events.emit('update-shield', scene.sharedShield);
    }

    addHealth(amount = 30) {
        const scene = this.scene;
        scene.sharedHealth = Math.min(scene.maxSharedHealth, (scene.sharedHealth || 0) + amount);
        scene.registry.events.emit('update-health', scene.sharedHealth);
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;

        // In co-op: only end game if ALL players are dead
        if (typeof this.scene.onPlayerDied === 'function') {
            this.scene.onPlayerDied(this);
        } else {
            // Solo fallback
            this.scene.registry.events.emit('game-over');
            this.scene.endGame?.('dead');
        }

        this.destroy();
    }
}