// game/systems/CombatSystem.js
export default class CombatSystem {
    constructor(scene) {
        this.scene = scene;
    }

    handleBulletHitEnemy(bullet, enemy) {
        // Use bullet.damage set during fire() — falls back to 10
        const dmg = bullet.damage || 10;
        bullet.setActive(false);
        bullet.setVisible(false);
        bullet.body.enable = false;

        // FIX: removed enemy.isDead() — that method never existed on Enemy.
        // Enemy.takeDamage() handles its own death internally by calling
        // scene.onEnemyKilled() and destroying itself when hp <= 0.
        enemy.takeDamage(dmg);
    }

    handleEnemyHitPlayer(player, enemy) {
        player.takeDamage(enemy.damage || 10);
    }
}