// game/systems/AudioSystem.js
// Central audio manager. One instance lives on the scene.
// Handles background music, SFX, volume, and mute state.
// Respects the music/sfx toggles from MenuScene options.

export default class AudioSystem {
    constructor(scene) {
        this.scene = scene;

        // Load persisted settings
        this._loadSettings();

        this.music      = null;  // current background music track
        this.sfxSounds  = {};    // cached SFX objects keyed by name
    }

    // ── Settings persistence ──────────────────────────────────────────────
    _loadSettings() {
        try {
            const raw = localStorage.getItem('audio_settings');
            const saved = raw ? JSON.parse(raw) : {};
            this.musicEnabled = saved.musicEnabled ?? true;
            this.sfxEnabled   = saved.sfxEnabled   ?? true;
            this.musicVolume  = saved.musicVolume   ?? 0.5;
            this.sfxVolume    = saved.sfxVolume     ?? 0.8;
        } catch(e) {
            this.musicEnabled = true;
            this.sfxEnabled   = true;
            this.musicVolume  = 0.5;
            this.sfxVolume    = 0.8;
        }
    }

    _saveSettings() {
        try {
            localStorage.setItem('audio_settings', JSON.stringify({
                musicEnabled: this.musicEnabled,
                sfxEnabled:   this.sfxEnabled,
                musicVolume:  this.musicVolume,
                sfxVolume:    this.sfxVolume,
            }));
        } catch(e) {}
    }

    // ── Music ─────────────────────────────────────────────────────────────

    // Play background music track. Loops by default.
    // key — preloaded audio key e.g. 'music_game'
    playMusic(key, fadeInMs = 1000) {
        // Stop existing track first
        this.stopMusic(0);

        if (!this.musicEnabled) return;
        if (!this.scene.cache.audio.has(key)) {
            console.warn("AudioSystem: music key not found:", key);
            return;
        }

        try {
            this.music = this.scene.sound.add(key, {
                loop:   true,
                volume: 0,
            });
            this.music.play();

            // Fade in
            this.scene.tweens.add({
                targets:  this.music,
                volume:   this.musicVolume,
                duration: fadeInMs,
            });
        } catch(e) {
            console.warn("AudioSystem: failed to play music:", key, e);
        }
    }

    stopMusic(fadeOutMs = 800) {
        if (!this.music) return;

        if (fadeOutMs > 0) {
            this.scene.tweens.add({
                targets:  this.music,
                volume:   0,
                duration: fadeOutMs,
                onComplete: () => {
                    if (this.music) {
                        this.music.stop();
                        this.music.destroy();
                        this.music = null;
                    }
                },
            });
        } else {
            this.music.stop();
            this.music.destroy();
            this.music = null;
        }
    }

    setMusicEnabled(enabled) {
        this.musicEnabled = enabled;
        this._saveSettings();

        if (!enabled) {
            this.stopMusic(500);
        }
    }

    setMusicVolume(volume) {
        this.musicVolume = Phaser.Math.Clamp(volume, 0, 1);
        if (this.music) this.music.setVolume(this.musicVolume);
        this._saveSettings();
    }

    // ── SFX ───────────────────────────────────────────────────────────────

    // Play a one-shot sound effect
    playSFX(key, volumeOverride) {
        if (!this.sfxEnabled) return;
        if (!this.scene.cache.audio.has(key)) {
            console.warn("AudioSystem: sfx key not found:", key);
            return;
        }

        try {
            const vol = volumeOverride ?? this.sfxVolume;
            this.scene.sound.play(key, { volume: vol });
        } catch(e) {
            console.warn("AudioSystem: failed to play sfx:", key, e);
        }
    }

    setSFXEnabled(enabled) {
        this.sfxEnabled = enabled;
        this._saveSettings();
    }

    setSFXVolume(volume) {
        this.sfxVolume = Phaser.Math.Clamp(volume, 0, 1);
        this._saveSettings();
    }

    // ── Convenience wrappers — call these from game scenes ─────────────────
    playShoot()     { this.playSFX('shoot'); }
    playExplosion() { this.playSFX('explosion'); }
    playPowerup()   { this.playSFX('powerup_collect'); }
    playBossDead()  { this.playSFX('boss_dead'); }
    playLevelUp()   { this.playSFX('level_up'); }

    // ── Cleanup ───────────────────────────────────────────────────────────
    destroy() {
        this.stopMusic(0);
    }
}