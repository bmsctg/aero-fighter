// Enemies, Bosses, Wave Spawner & Power-Up Pickups

class EnemyBullet {
  constructor(x, y, vx, vy, color = '#ff3366', radius = 4) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.radius = radius;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    return this.y > -30 && this.y < 990 && this.x > -30 && this.x < 570;
  }

  draw(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.fill();

    // Hot center
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  }
}

// Power-Up / Item Pickups
class Pickup {
  constructor(x, y, type = 'star') {
    this.x = x;
    this.y = y;
    this.type = type; // 'star', 'power', 'heart', 'bomb'
    this.vy = 80;
    this.vx = (Math.random() - 0.5) * 40;
    this.radius = type === 'star' ? 12 : 16;
    this.bob = Math.random() * Math.PI * 2;
  }

  update(dt, player) {
    this.bob += 6 * dt;
    this.y += this.vy * dt;
    this.x += Math.sin(this.bob) * 30 * dt;

    // Magnet effect towards player when nearby
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 160) {
      this.x += (dx / dist) * 260 * dt;
      this.y += (dy / dist) * 260 * dt;
    }

    return this.y < 980;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.type === 'star') {
      // Golden Spinning Star
      ctx.fillStyle = '#ffdd00';
      ctx.shadowColor = '#ffbb00';
      ctx.shadowBlur = 10;
      this.drawStar(ctx, 0, 0, 5, 11, 5);
      ctx.fill();
    } else if (this.type === 'power') {
      // "P" Power Badge
      ctx.beginPath();
      ctx.roundRect(-14, -14, 28, 28, 6);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 16px "Arial Black", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('P', 0, 1);
    } else if (this.type === 'heart') {
      // Red Heart
      ctx.font = '20px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('❤️', 0, 0);
    } else if (this.type === 'bomb') {
      // Mega Bomb Icon
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.strokeStyle = '#ff3366';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = '16px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💣', 0, 0);
    }
    ctx.restore();
  }

  drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      let x = cx + Math.cos(rot) * outerRadius;
      let y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;
      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  }
}

// Base Enemy Class
class Enemy {
  constructor(x, y, hp, type = 'scout') {
    this.x = x;
    this.y = y;
    this.hp = hp;
    this.maxHp = hp;
    this.type = type;
    this.width = 36;
    this.height = 36;
    this.isBoss = false;
    this.time = Math.random() * 10;
    this.shootCooldown = 1.0 + Math.random() * 1.5;
  }

  takeDamage(amount) {
    this.hp -= amount;
    return this.hp <= 0;
  }

  update(dt, player, bullets) {
    this.time += dt;
    this.shootCooldown -= dt;

    if (this.type === 'scout') {
      this.y += 160 * dt;
      this.x += Math.sin(this.time * 3) * 60 * dt;
      if (this.shootCooldown <= 0 && this.y > 60 && this.y < 500) {
        bullets.push(new EnemyBullet(this.x, this.y + 15, 0, 240, '#f43f5e', 4));
        this.shootCooldown = 2.5 + Math.random();
      }
    } else if (this.type === 'interceptor') {
      this.y += 200 * dt;
      // Fast diving swoop
      if (this.time < 1.5) {
        this.x += (player.x > this.x ? 90 : -90) * dt;
      }
      if (this.shootCooldown <= 0 && this.y > 50 && this.y < 650) {
        // Aimed shot towards player
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        bullets.push(new EnemyBullet(this.x, this.y + 15, Math.cos(angle) * 260, Math.sin(angle) * 260, '#f97316', 4.5));
        this.shootCooldown = 2.0;
      }
    } else if (this.type === 'bomber') {
      this.y += 90 * dt;
      this.x += Math.cos(this.time * 1.5) * 45 * dt;
      if (this.shootCooldown <= 0 && this.y > 60 && this.y < 700) {
        // Triple spread shot
        bullets.push(new EnemyBullet(this.x, this.y + 20, 0, 210, '#ec4899', 5));
        bullets.push(new EnemyBullet(this.x, this.y + 20, -70, 190, '#ec4899', 5));
        bullets.push(new EnemyBullet(this.x, this.y + 20, 70, 190, '#ec4899', 5));
        this.shootCooldown = 2.2;
      }
    }

    return this.y < 1000 && this.x > -80 && this.x < 620;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.type === 'scout') {
      // Nimble enemy jet (Orange/Black)
      ctx.beginPath();
      ctx.moveTo(0, 18);
      ctx.lineTo(16, -10);
      ctx.lineTo(8, -14);
      ctx.lineTo(0, -6);
      ctx.lineTo(-8, -14);
      ctx.lineTo(-16, -10);
      ctx.closePath();
      ctx.fillStyle = '#f97316';
      ctx.fill();
      ctx.strokeStyle = '#c2410c';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Cockpit
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.ellipse(0, 4, 3, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'interceptor') {
      // Sleek Dark Fighter (Crimson/Violet)
      ctx.beginPath();
      ctx.moveTo(0, 22);
      ctx.lineTo(20, -12);
      ctx.lineTo(4, -18);
      ctx.lineTo(-4, -18);
      ctx.lineTo(-20, -12);
      ctx.closePath();
      ctx.fillStyle = '#be123c';
      ctx.fill();
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Wing glow
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(16, -10, 3, 6);
      ctx.fillRect(-19, -10, 3, 6);
    } else if (this.type === 'bomber') {
      // Heavy Double-Rotor Gunship
      ctx.beginPath();
      ctx.roundRect(-22, -18, 44, 36, 8);
      ctx.fillStyle = '#334155';
      ctx.fill();
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Rotors
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-28, -22, 16, 4);
      ctx.fillRect(12, -22, 16, 4);

      // Yellow hazard stripes
      ctx.fillStyle = '#eab308';
      ctx.fillRect(-14, 4, 28, 4);
    }

    ctx.restore();
  }
}

// Stage Boss Class (Multi-Phase, Screen-Filling Excitement)
class Boss extends Enemy {
  constructor(stage = 1) {
    super(270, -120, stage === 1 ? 75 : (stage === 2 ? 110 : 160), 'boss');
    this.stage = stage;
    this.isBoss = true;
    this.targetY = 160;
    this.width = 160;
    this.height = 110;
    this.phase = 1;
    this.attackTimer = 0;
    this.attackCycle = 0;
    this.eyeBlink = 0;

    if (stage === 1) {
      this.name = 'IRON BEHEMOTH';
      this.color = '#3b82f6';
    } else if (stage === 2) {
      this.name = 'CYBER SHARK';
      this.color = '#06b6d4';
    } else {
      this.name = 'NOVA OVERLORD';
      this.color = '#a855f7';
    }
  }

  update(dt, player, bullets) {
    this.time += dt;
    this.attackTimer += dt;

    // Fly smoothly onto screen
    if (this.y < this.targetY) {
      this.y += 90 * dt;
      return true;
    }

    // Swaying flight pattern
    this.x = 270 + Math.sin(this.time * 1.2) * 140;

    // Boss attack patterns
    if (this.attackTimer > 1.2) {
      this.attackTimer = 0;
      this.attackCycle++;

      const attackMod = this.attackCycle % 3;

      if (attackMod === 0) {
        // Spiral star burst
        const count = this.stage === 1 ? 8 : 12;
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 / count) * i + this.time;
          bullets.push(new EnemyBullet(this.x, this.y + 40, Math.cos(angle) * 160, Math.sin(angle) * 160, '#f43f5e', 5));
        }
      } else if (attackMod === 1) {
        // Targeted dual cannons at player
        const angle1 = Math.atan2(player.y - this.y, player.x - (this.x - 40));
        const angle2 = Math.atan2(player.y - this.y, player.x - (this.x + 40));
        bullets.push(new EnemyBullet(this.x - 40, this.y + 35, Math.cos(angle1) * 230, Math.sin(angle1) * 230, '#eab308', 6));
        bullets.push(new EnemyBullet(this.x + 40, this.y + 35, Math.cos(angle2) * 230, Math.sin(angle2) * 230, '#eab308', 6));
      } else {
        // Rain of energy orbs
        for (let ox = -60; ox <= 60; ox += 40) {
          bullets.push(new EnemyBullet(this.x + ox, this.y + 45, (Math.random() - 0.5) * 50, 190, '#a855f7', 5.5));
        }
      }
    }

    return true;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Large menacing futuristic fortress hull
    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.lineTo(80, 10);
    ctx.lineTo(85, -30);
    ctx.lineTo(50, -45);
    ctx.lineTo(0, -35);
    ctx.lineTo(-50, -45);
    ctx.lineTo(-85, -30);
    ctx.lineTo(-80, 10);
    ctx.closePath();
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Side Cannon Pods
    ctx.fillStyle = '#475569';
    ctx.fillRect(-70, 0, 16, 32);
    ctx.fillRect(54, 0, 16, 32);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-67, 28, 10, 6);
    ctx.fillRect(57, 28, 10, 6);

    // Glowing Core (Boss Weak Point)
    const pulse = (Math.sin(this.time * 6) + 1) * 0.5;
    ctx.beginPath();
    ctx.arc(0, 8, 18, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 15 * pulse + 5;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 8, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Kid-friendly playful Boss Eyes / Radar
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-22, -18, 14, 8);
    ctx.fillRect(8, -18, 14, 8);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-18, -16, 6, 4);
    ctx.fillRect(12, -16, 6, 4);

    ctx.restore();
  }
}

// Wave Spawner System
class WaveManager {
  constructor() {
    this.currentStage = 1;
    this.maxStages = 3;
    this.stageTimer = 0;
    this.spawnTimer = 0;
    this.bossSpawned = false;
    this.activeBoss = null;
  }

  reset(stage = 1) {
    this.currentStage = stage;
    this.stageTimer = 0;
    this.spawnTimer = 0;
    this.bossSpawned = false;
    this.activeBoss = null;
  }

  update(dt, enemies, pickups) {
    this.stageTimer += dt;
    this.spawnTimer += dt;

    // Boss fight active
    if (this.bossSpawned) {
      if (this.activeBoss && this.activeBoss.hp <= 0) {
        // Boss Defeated!
        FX.createExplosion(this.activeBoss.x, this.activeBoss.y, 60, 'fire', 2.5);
        Sounds.playBomb();

        // Fountain of Stars and Upgrades!
        for (let i = 0; i < 12; i++) {
          pickups.push(new Pickup(this.activeBoss.x + (Math.random() - 0.5) * 80, this.activeBoss.y + (Math.random() - 0.5) * 50, 'star'));
        }
        pickups.push(new Pickup(this.activeBoss.x, this.activeBoss.y, 'power'));
        pickups.push(new Pickup(this.activeBoss.x + 30, this.activeBoss.y, 'heart'));

        this.activeBoss = null;
        return 'STAGE_CLEARED';
      }
      return 'BOSS_FIGHT';
    }

    // Normal wave spawns before boss (Boss appears around 35 seconds into stage)
    if (this.stageTimer > 35 && !this.bossSpawned) {
      this.bossSpawned = true;
      Sounds.playBossAlert();
      FX.addFloatingText(270, 240, '⚠️ WARNING: BOSS APPROACHING! ⚠️', '#ff3366', 22);
      this.activeBoss = new Boss(this.currentStage);
      enemies.push(this.activeBoss);
      return 'BOSS_WARNING';
    }

    // Spawn regular enemy squads
    const spawnInterval = Math.max(1.1, 2.2 - this.currentStage * 0.3);
    if (this.spawnTimer >= spawnInterval) {
      this.spawnTimer = 0;
      this.spawnSquad(enemies);
    }

    return 'WAVE_ACTIVE';
  }

  spawnSquad(enemies) {
    const r = Math.random();
    if (r < 0.45) {
      // V-Formation Scout Squadron
      const startX = 100 + Math.random() * 340;
      enemies.push(new Enemy(startX, -30, 2, 'scout'));
      enemies.push(new Enemy(startX - 35, -60, 2, 'scout'));
      enemies.push(new Enemy(startX + 35, -60, 2, 'scout'));
    } else if (r < 0.8) {
      // Fast Interceptor Duo
      const x1 = 80 + Math.random() * 150;
      const x2 = 320 + Math.random() * 140;
      enemies.push(new Enemy(x1, -40, 3, 'interceptor'));
      enemies.push(new Enemy(x2, -40, 3, 'interceptor'));
    } else {
      // Heavy Bomber
      const x = 120 + Math.random() * 300;
      enemies.push(new Enemy(x, -50, 8, 'bomber'));
    }
  }
}
