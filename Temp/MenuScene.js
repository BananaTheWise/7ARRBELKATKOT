// game/scenes/MenuScene.js
export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        console.log("MenuScene Started");
        const { width, height } = this.scale;

        // Background
        this.add.image(0, 0, "menu_bg")
            .setOrigin(0)
            .setDisplaySize(width, height);

        this.add.rectangle(0, 0, 500, height, 0x000000, 0.5)
            .setOrigin(0);

        // Options state persists across sub-menu switches
        this.optionsState = {
            music: true,
            sfx:   true,
        };

        this.activeContainer = null;

        this.showMainMenu();
    }

    // ── Screen switcher ───────────────────────────────────────────────────

    switchTo(builderFn) {
        if (this.activeContainer) {
            this.activeContainer.destroy(true);
        }
        this.activeContainer = this.add.container(0, 0);
        builderFn(this.activeContainer);
    }

    // ── Helper: start GameScene cleanly with UIScene ───────────────────────
    // CHANGE: extracted into one shared method so every launch point
    // (Level 1, Level 2, Solo, future Co-op) does the exact same setup.
    // Previously only the old "Play" button did this correctly; Solo was missing it.
    startGame(mode) {
        this.scene.stop('UIScene');          // stop any stale UIScene first
        this.scene.start('GameScene', { mode });
        this.scene.launch('UIScene');        // run HUD in parallel
        this.registry.events.emit('update-score',  0);
        this.registry.events.emit('update-health', 100);
        this.registry.events.emit('update-shield', 0);
    }

    // ── Screens ───────────────────────────────────────────────────────────

    showMainMenu() {
        this.switchTo((c) => {
            c.add(this.makeTitle(80, 100, "SPACE SHOOTER"));

            this.addButton(c, 80, 250, "Play",    () => this.showPlayMenu());
            this.addButton(c, 80, 330, "Options", () => this.showOptions());
            this.addButton(c, 80, 410, "Exit",    () => console.log("Exit clicked"));
        });
    }

    showPlayMenu() {
        this.switchTo((c) => {
            c.add(this.makeTitle(80, 100, "SELECT MODE"));

            // CHANGE: Level 1 and Level 2 now call startGame() so UIScene
            // is always launched and the HUD is reset before the game starts.
            this.addButton(c, 80, 250, "Level 1", () => {
                console.log("Level 1 clicked");
                this.startGame('level1');
            });

            this.addButton(c, 80, 330, "Level 2", () => {
                console.log("Level 2 clicked");
                this.startGame('level2');
            });

            this.addButton(c, 80, 410, "Endless", () => this.showEndlessMenu());
            this.addButton(c, 80, 490, "Back",    () => this.showMainMenu());
        });
    }

    showEndlessMenu() {
        this.switchTo((c) => {
            c.add(this.makeTitle(80, 100, "ENDLESS"));

            // CHANGE: Solo now calls startGame('endless') instead of a bare
            // this.scene.start() — this ensures UIScene is launched and the
            // HUD score/health are reset, matching what all other modes do.
            this.addButton(c, 80, 250, "Solo", () => {
                console.log("Solo clicked");
                this.startGame('endless');
            });

            this.addButton(c, 80, 330, "Co-op", () => {
                console.log("Co-op clicked");
                // TODO: start Co-op endless
            });

            this.addButton(c, 80, 410, "Back", () => this.showPlayMenu());
        });
    }

    showOptions() {
        this.switchTo((c) => {
            c.add(this.makeTitle(80, 100, "OPTIONS"));

            this.addToggleButton(c, 80, 250, "Music", "music");
            this.addToggleButton(c, 80, 330, "SFX",   "sfx");
            this.addButton(c,      80, 410, "Back",   () => this.showMainMenu());
        });
    }

    // ── Widget factories ──────────────────────────────────────────────────

    makeTitle(x, y, label) {
        return this.add.text(x, y, label, {
            fontSize:  "48px",
            color:     "#ffffff",
            fontStyle: "bold",
        });
    }

    addButton(container, x, y, label, callback) {
        const btn = this.add.text(x, y, label, {
            fontSize:        "32px",
            color:           "#ffffff",
            backgroundColor: "#000000",
            padding:         { x: 10, y: 5 },
        }).setInteractive({ useHandCursor: true });

        btn.on("pointerover",  () => btn.setStyle({ color: "#ffff00" }));
        btn.on("pointerout",   () => btn.setStyle({ color: "#ffffff" }));
        btn.on("pointerdown",  callback);

        container.add(btn);
        return btn;
    }

    addToggleButton(container, x, y, label, key) {
        const getStyle = () => ({
            fontSize:        "32px",
            color:           this.optionsState[key] ? "#ffffff" : "#555555",
            backgroundColor: "#000000",
            padding:         { x: 10, y: 5 },
        });

        const getLabel = () =>
            `${label}: ${this.optionsState[key] ? "ON" : "OFF"}`;

        const btn = this.add.text(x, y, getLabel(), getStyle())
            .setInteractive({ useHandCursor: true });

        btn.on("pointerover", () => {
            if (this.optionsState[key]) btn.setStyle({ color: "#ffff00" });
        });

        btn.on("pointerout", () => {
            btn.setStyle({ color: this.optionsState[key] ? "#ffffff" : "#555555" });
        });

        btn.on("pointerdown", () => {
            this.optionsState[key] = !this.optionsState[key];

            if (key === "music") console.log("Music toggled:", this.optionsState.music);
            if (key === "sfx")   console.log("SFX toggled:",   this.optionsState.sfx);

            btn.setText(getLabel());
            btn.setStyle(getStyle());
        });

        container.add(btn);
        return btn;
    }
}
    