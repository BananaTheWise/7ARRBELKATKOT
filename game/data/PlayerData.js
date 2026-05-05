// game/data/PlayerData.js
// Persistent player progress.
// Auto-save uses localStorage (fast, automatic).
// Manual save downloads a .json file to the user's computer.
// Manual load reads a .json file the user picks from their computer.

const LS_KEY = 'space_shooter_v1_auto';

const DEFAULT = {
    money:        0,
    highscore:    0,
    ownedShips:   ['ship_01'],
    selectedShip: 'ship_01',
    lastSaved:    null,
};

export default class PlayerData {

    // ── Auto save / load (localStorage) ──────────────────────────────────
    static load() {
        try {
            const raw = localStorage.getItem(LS_KEY);
            if (!raw) return { ...DEFAULT };
            return { ...DEFAULT, ...JSON.parse(raw) };
        } catch(e) {
            console.warn("PlayerData.load failed:", e);
            return { ...DEFAULT };
        }
    }

    static save(data) {
        try {
            data.lastSaved = new Date().toISOString();
            localStorage.setItem(LS_KEY, JSON.stringify(data));
        } catch(e) {
            console.warn("PlayerData.save failed:", e);
        }
    }

    // ── File save — downloads a .json file to the user's computer ─────────
    // Call this from the menu Save button.
    // Returns the filename used.
    static saveToFile() {
        const data     = PlayerData.load();
        data.lastSaved = new Date().toISOString();
        data.version   = 1;

        const json     = JSON.stringify(data, null, 2);
        const blob     = new Blob([json], { type: 'application/json' });
        const url      = URL.createObjectURL(blob);

        // Create a temporary link and click it to trigger download
        const date     = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const filename = `space_shooter_save_${date}.json`;

        const a        = document.createElement('a');
        a.href         = url;
        a.download     = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log("Save file downloaded:", filename);
        return filename;
    }

    // ── File load — opens a file picker, reads the .json ─────────────────
    // Call this from the menu Load button.
    // Returns a Promise that resolves with the loaded data, or null on cancel.
    static loadFromFile() {
        return new Promise((resolve) => {
            const input    = document.createElement('input');
            input.type     = 'file';
            input.accept   = '.json';
            input.style.display = 'none';

            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) { resolve(null); return; }

                const reader = new FileReader();
                reader.onload = (ev) => {
                    try {
                        const data = JSON.parse(ev.target.result);

                        // Validate it's a real save file
                        if (!data.ownedShips || !Array.isArray(data.ownedShips)) {
                            console.warn("Invalid save file");
                            resolve(null);
                            return;
                        }

                        // Merge with defaults so missing fields are filled
                        const merged = { ...DEFAULT, ...data };

                        // Write to localStorage so the game uses it immediately
                        PlayerData.save(merged);

                        console.log("Save file loaded:", file.name);
                        resolve(merged);
                    } catch(err) {
                        console.warn("Failed to parse save file:", err);
                        resolve(null);
                    }
                };

                reader.readAsText(file);
                document.body.removeChild(input);
            };

            input.oncancel = () => {
                document.body.removeChild(input);
                resolve(null);
            };

            document.body.appendChild(input);
            input.click();
        });
    }

    // ── Money ─────────────────────────────────────────────────────────────
    static getMoney() {
        return PlayerData.load().money || 0;
    }

    static addMoney(amount) {
        const data  = PlayerData.load();
        data.money  = (data.money || 0) + Math.floor(amount);
        PlayerData.save(data);
        console.log(`+${Math.floor(amount)} coins → total: ${data.money}`);
        return data.money;
    }

    static scoreToCoins(score) {
        const earned = Math.floor(score / 10);
        PlayerData.addMoney(earned);
        return earned;
    }

    // ── Highscore ─────────────────────────────────────────────────────────
    static getHighscore() {
        return PlayerData.load().highscore || 0;
    }

    static submitScore(score) {
        const data  = PlayerData.load();
        const isNew = score > (data.highscore || 0);
        if (isNew) {
            data.highscore = score;
            PlayerData.save(data);
        }
        return isNew;
    }

    // ── Ships ─────────────────────────────────────────────────────────────
    static getOwnedShips() {
        return PlayerData.load().ownedShips || ['ship_01'];
    }

    static getSelectedShip() {
        return PlayerData.load().selectedShip || 'ship_01';
    }

    static selectShip(shipKey) {
        const data = PlayerData.load();
        if (!data.ownedShips.includes(shipKey)) return false;
        data.selectedShip = shipKey;
        PlayerData.save(data);
        return true;
    }

    static buyShip(shipKey, price) {
        const data = PlayerData.load();
        if (data.ownedShips.includes(shipKey)) {
            return { success: false, reason: 'already_owned' };
        }
        if ((data.money || 0) < price) {
            return { success: false, reason: 'not_enough_money' };
        }
        data.money -= price;
        data.ownedShips.push(shipKey);
        PlayerData.save(data);
        return { success: true };
    }

    // ── Debug ─────────────────────────────────────────────────────────────
    static reset() {
        localStorage.removeItem(LS_KEY);
        console.log("Save data cleared");
    }
}