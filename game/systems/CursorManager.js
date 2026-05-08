// game/systems/CursorManager.js
// Animated custom cursor that works in any scene.
// Usage:
//   In create():  this.cursor = new CursorManager(this);
//   In update():  this.cursor.update();
//   On shutdown:  this.cursor.destroy();

export default class CursorManager {
    constructor(scene) {
        this.scene = scene;

        // Hide the real OS cursor over the canvas
        scene.input.setDefaultCursor('none');

        // Create cursor sprite — sits above everything
        this.sprite = scene.add.sprite(
            scene.input.x,
            scene.input.y,
            'cursor_anim_1'
        ).setDepth(9999).setOrigin(0.15, 0.15).setScale(0.10);

        // Create animation if it doesn't exist yet
        if (!scene.anims.exists('cursor_idle')) {
            scene.anims.create({
                key:       'cursor_idle',
                frames: [
                    { key: 'cursor_anim_1' },
                    { key: 'cursor_anim_2' },
                    { key: 'cursor_anim_3' },
                    { key: 'cursor_anim_4' },
                ],
                frameRate: 10,
                repeat:    -1,
            });
        }

        this.sprite.play('cursor_idle');

        // Click — scale down then back (squeeze effect)
        scene.input.on('pointerdown', () => {
            scene.tweens.add({
                targets:  this.sprite,
                duration: 80,
                yoyo:     true,
            });
        });

        // Keep a ref so destroy() can clean up
        this._scene = scene;
    }

    // Call from scene's update() every frame
    update() {
        if (!this.sprite?.active) return;

        this.sprite.x = this._scene.input.x - 20;
        this.sprite.y = this._scene.input.y - 20;
        
        // Smooth follow — feels better than hard snap
        this.sprite.x += (this._scene.input.x - this.sprite.x) * 0.35;
        this.sprite.y += (this._scene.input.y - this.sprite.y) * 0.35;
    }

    // Call on button pointerover to tint cursor yellow
    onHover() {
        this.sprite?.setTint(0xffff00);
    }

    // Call on button pointerout to clear tint
    onHoverEnd() {
        this.sprite?.clearTint();
    }

    // Attach hover effects to any Phaser interactive object automatically
    // Usage: this.cursor.attachTo(btn);
    attachTo(gameObject) {
        gameObject.on('pointerover',  () => this.onHover());
        gameObject.on('pointerout',   () => this.onHoverEnd());
    }

    destroy(restoreCursor = true) {
        // Restore real cursor when scene shuts down
        if (restoreCursor) {
            try { this._scene.input.setDefaultCursor('default'); } catch(e) {}
        }
        try { this.sprite?.destroy(); } catch(e) {}
    }
}