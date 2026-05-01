// game/data/PlayerData.js
// Persistent player progress with named save slots.
// Slot 'auto' is always used during gameplay.
// Players can save to slot 1/2/3 from the menu.

const SAVE_PREFIX = 'space_shooter_v1_';
const AUTO_SLOT   = 'auto';

const DEFAULT = {
    money:        0,
    highscore:    0,
    ownedShips:   ['ship_01'],
    selectedShip: 'ship_01',
    lastSaved:    null,
};

export default class PlayerData {

    // ── Core ──────────────────────────────────────────────────────────────
    static load(slot = AUTO_SLOT) {
        try {
            const raw = localStorage.getItem(SAVE_PREFIX + slot);
            if (!raw) return { ...DEFAULT };
            return { ...DEFAULT, ...JSON.parse(raw) };
        } catch(e) {
            console.warn("PlayerData.load failed:", e);
            return { ...DEFAULT };
        }
    }

    static save(data, slot = AUTO_SLOT) {
        try {
            data.lastSaved = new Date().toISOString();
            localStorage.setItem(SAVE_PREFIX + slot, JSON.stringify(data));
            console.log("Saved to slot:", slot);
        } catch(e) {
            console.warn("PlayerData.save failed:", e);
        }
    }

    // Copy auto slot into a named slot
    static saveToSlot(slot) {
        const data = PlayerData.load(AUTO_SLOT);
        PlayerData.save(data, slot);
        return data;
    }

    // Load named slot into auto slot
    static loadFromSlot(slot) {
        const data = PlayerData.load(slot);
        if (!data.lastSaved) return null; // slot is empty
        PlayerData.save(data, AUTO_SLOT);
        return data;
    }

    static getSlotInfo(slot) {
        try {
            const raw = localStorage.getItem(SAVE_PREFIX + slot);
            if (!raw) return null;
            const data = JSON.parse(raw);
            return {
                slot,
                money:     data.money     || 0,
                highscore: data.highscore || 0,
                ship:      data.selectedShip || 'ship_01',
                lastSaved: data.lastSaved || null,
            };
        } catch(e) {
            return null;
        }
    }

    static deleteSlot(slot) {
        localStorage.removeItem(SAVE_PREFIX + slot);
    }

    // ── Money ─────────────────────────────────────────────────────────────
    static getMoney() {
        return PlayerData.load().money || 0;
    }

    static addMoney(amount) {
        const data  = PlayerData.load();
        data.money  = (data.money || 0) + Math.floor(amount);
        PlayerData.save(data);
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
        ['auto','1','2','3'].forEach(s => localStorage.removeItem(SAVE_PREFIX + s));
        console.log("All save data cleared");
    }
}