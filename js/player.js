// Player Jet, Weapons, Controls & Procedural Canvas Plane Renderers

const PLANE_TYPES = [
  {
    id: 'phoenix',
    name: 'F-15 PHOENIX',
    desc: 'Balanced Speed & Rapid Vulcan Lasers',
    speed: 380,
    maxHp: 4,
    bombs: 3,
    shotType: 'vulcan',
    colorMain: '#2563eb',
    colorAccent: '#ef4444',
    colorCockpit: '#67e8f9',
    stats: { speed: 80, power: 85, defense: 75 }
  },
  {
    id: 'viper',
    name: 'A-10 VIPER',
    desc: 'Heavy Armor & Wide Spread Cannon',
    speed: 320,
    maxHp: 5,
    bombs: 3,
    shotType: 'spread',
    colorMain: '#15803d',
    colorAccent: '#f59e0b',
    colorCockpit: '#fde047',
    stats: { speed: 60, power: 95, defense: 100 }
  },
  {
    id: 'cosmo',
    name: 'COSMO HAWK',
    desc: 'Hypersonic Speed & Piercing Beams',
    speed: 450,
    maxHp: 3,
    bombs: 4,
    shotType: 'laser',
    colorMain: '#9333ea',
    colorAccent: '#ec4899',
    colorCockpit: '#38bdf8',
    stats: { speed: 100, power: 80, defense: 60 }
  }
];

class PlayerBullet {
  constructor(x, y, vx, vy, damage = 1, type = 'normal', color = '#00ffff') {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.type = type;
    this.color = color;
    this.radius = type === 'laser' ? 5 : 4;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    return this.y > -20 && this.y < 980 && this.x > -20 && this.x < 560;
  }

  draw(ctx) {
    ctx.save();
    if (this.type === 'laser') {
      // Sleek long piercing laser
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;
      ctx.fillRect(this.x - 3, this.y - 12, 6, 24);
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x - 1.5, this.y - 14, 3, 28);
    } else if (this.type === 'spread') {
      // Golden heavy plasma pellet
      ctx.beginPath();
      ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffdd00';
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    } else {
      // Standard dual vulcan bullet
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(this.x - 2.5, this.y - 8, 5, 16, 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(this.x - 1, this.y - 6, 2, 8);
    }
    ctx.restore();
  }
}

class Player {
  constructor(planeType = PLANE_TYPES[0]) {
    this.plane = planeType;
    this.x = 270;
    this.y = 800;
    this.width = 46;
    this.height = 54;
    this.hp = this.plane.maxHp;
    this.maxHp = this.plane.maxHp;
    this.bombs = this.plane.bombs;
    this.powerLevel = 1; // 1 to 5
    this.invulnerableTimer = 0;
    this.shootTimer = 0;
    this.autoFire = true;
    this.tilt = 0; // -1 (left), 0, +1 (right)
    this.stars = 0;

    // Movement flags
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      shoot: false,
      bomb: false
    };

    // Touch / Pointer controls
    this.targetX = this.x;
    this.targetY = this.y;
    this.isDragging = false;
  }

  setPlane(planeType) {
    this.plane = planeType;
    this.hp = this.plane.maxHp;
    this.maxHp = this.plane.maxHp;
    this.bombs = this.plane.bombs;
  }

  reset(x = 270, y = 800) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.hp = this.plane.maxHp;
    this.bombs = this.plane.bombs;
    this.powerLevel = 1;
    this.invulnerableTimer = 2.5; // Spawn shield
    this.shootTimer = 0;
    this.tilt = 0;
    this.isDragging = false;
  }

  takeDamage(amount = 1) {
    if (this.invulnerableTimer > 0) return false;
    this.hp -= amount;
    this.invulnerableTimer = 2.0;
    Sounds.playHurt();
    FX.addShake(12);

    // Downgrade power by 1 if hit, but min level 1
    if (this.powerLevel > 1) {
      this.powerLevel--;
    }

    if (this.hp <= 0) {
      FX.createExplosion(this.x, this.y, 45, 'fire', 1.8);
      Sounds.playExplosion(2);
      return true; // Destroyed
    }
    return false;
  }

  addPower() {
    if (this.powerLevel < 5) {
      this.powerLevel++;
      FX.addFloatingText(this.x, this.y - 25, 'POWER UP!', '#ffdd00', 18);
    } else {
      FX.addFloatingText(this.x, this.y - 25, '+1000 MAX!', '#00ffcc', 16);
    }
    Sounds.playPowerup();
  }

  addHealth() {
    if (this.hp < this.maxHp) {
      this.hp++;
      FX.addFloatingText(this.x, this.y - 25, '+1 HEART ❤️', '#ff3366', 16);
    } else {
      FX.addFloatingText(this.x, this.y - 25, '+500 BONUS', '#ffdd00', 16);
    }
    Sounds.playStar();
  }

  addBomb() {
    this.bombs++;
    FX.addFloatingText(this.x, this.y - 25, '+1 MEGA BOMB 💣', '#ff3366', 16);
    Sounds.playPowerup();
  }

  addStar(scoreSystem) {
    this.stars++;
    scoreSystem.addScore(100);
    Sounds.playStar();
    FX.createStarSparkle(this.x, this.y);
  }

  useBomb(enemies, enemyBullets, scoreSystem) {
    if (this.bombs <= 0) return false;
    this.bombs--;

    Sounds.playBomb();
    FX.createShockwave(this.x, this.y, 500, '#00ffff');
    FX.addFloatingText(270, 480, '💥 MEGA BOMB! 💥', '#ff3366', 28);

    // Clear all enemy bullets on screen and convert to stars
    enemyBullets.forEach(b => {
      FX.createStarSparkle(b.x, b.y);
      scoreSystem.addScore(25);
    });
    enemyBullets.length = 0;

    // Massive damage to all active enemies
    enemies.forEach(e => {
      e.takeDamage(15);
      FX.createExplosion(e.x, e.y, 15, 'fire', 0.8);
    });

    return true;
  }

  update(dt, bullets) {
    // Invulnerability timer countdown
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    // Keyboard / Touch Velocity Handling
    let vx = 0;
    let vy = 0;
    const speed = this.plane.speed;

    if (this.keys.left) vx -= speed;
    if (this.keys.right) vx += speed;
    if (this.keys.up) vy -= speed;
    if (this.keys.down) vy += speed;

    // Touch drag interpolation
    if (this.isDragging) {
      const dx = this.targetX - this.x;
      const dy = (this.targetY - 50) - this.y; // Slight vertical offset so finger doesn't obscure jet
      const dist = Math.hypot(dx, dy);
      if (dist > 3) {
        vx = (dx / dist) * Math.min(dist * 12, speed * 1.3);
        vy = (dy / dist) * Math.min(dist * 12, speed * 1.3);
      }
    }

    this.x += vx * dt;
    this.y += vy * dt;

    // Boundary constraints (within 540x960 canvas)
    this.x = Math.max(26, Math.min(514, this.x));
    this.y = Math.max(40, Math.min(920, this.y));

    // Jet tilt effect
    if (vx < -20) {
      this.tilt = Math.max(-1, this.tilt - 6 * dt);
    } else if (vx > 20) {
      this.tilt = Math.min(1, this.tilt + 6 * dt);
    } else {
      this.tilt *= Math.max(0, 1 - 10 * dt);
    }

    // Engine exhaust particles
    FX.createThruster(this.x - 7, this.y + 24, this.plane.colorCockpit);
    FX.createThruster(this.x + 7, this.y + 24, this.plane.colorCockpit);

    // Shooting logic
    this.shootTimer -= dt;
    const fireInterval = this.plane.shotType === 'laser' ? 0.12 : 0.14;

    if ((this.keys.shoot || this.autoFire) && this.shootTimer <= 0) {
      this.shoot(bullets);
      this.shootTimer = fireInterval;
    }
  }

  shoot(bullets) {
    Sounds.playShoot(this.plane.shotType);

    const dmg = 1;
    const p = this.powerLevel;

    if (this.plane.shotType === 'spread') {
      // Wide spread shot
      const bulletSpeed = 750;
      if (p === 1) {
        bullets.push(new PlayerBullet(this.x - 8, this.y - 15, 0, -bulletSpeed, dmg, 'spread'));
        bullets.push(new PlayerBullet(this.x + 8, this.y - 15, 0, -bulletSpeed, dmg, 'spread'));
      } else if (p === 2) {
        bullets.push(new PlayerBullet(this.x, this.y - 20, 0, -bulletSpeed, dmg, 'spread'));
        bullets.push(new PlayerBullet(this.x - 12, this.y - 10, -100, -bulletSpeed, dmg, 'spread'));
        bullets.push(new PlayerBullet(this.x + 12, this.y - 10, 100, -bulletSpeed, dmg, 'spread'));
      } else if (p === 3) {
        bullets.push(new PlayerBullet(this.x - 6, this.y - 20, 0, -bulletSpeed, dmg, 'spread'));
        bullets.push(new PlayerBullet(this.x + 6, this.y - 20, 0, -bulletSpeed, dmg, 'spread'));
        bullets.push(new PlayerBullet(this.x - 16, this.y - 10, -180, -bulletSpeed, dmg, 'spread'));
        bullets.push(new PlayerBullet(this.x + 16, this.y - 10, 180, -bulletSpeed, dmg, 'spread'));
      } else {
        // Levels 4 & 5: 5 to 7 bullets screen cover!
        bullets.push(new PlayerBullet(this.x, this.y - 20, 0, -bulletSpeed, dmg + 0.5, 'spread'));
        bullets.push(new PlayerBullet(this.x - 10, this.y - 15, -120, -bulletSpeed, dmg, 'spread'));
        bullets.push(new PlayerBullet(this.x + 10, this.y - 15, 120, -bulletSpeed, dmg, 'spread'));
        bullets.push(new PlayerBullet(this.x - 20, this.y - 10, -260, -bulletSpeed * 0.95, dmg, 'spread'));
        bullets.push(new PlayerBullet(this.x + 20, this.y - 10, 260, -bulletSpeed * 0.95, dmg, 'spread'));
        if (p === 5) {
          bullets.push(new PlayerBullet(this.x - 28, this.y, -360, -bulletSpeed * 0.9, dmg, 'spread'));
          bullets.push(new PlayerBullet(this.x + 28, this.y, 360, -bulletSpeed * 0.9, dmg, 'spread'));
        }
      }
    } else if (this.plane.shotType === 'laser') {
      // Piercing Lasers
      const speed = 900;
      if (p <= 2) {
        bullets.push(new PlayerBullet(this.x - 8, this.y - 20, 0, -speed, 1.2, 'laser', '#d946ef'));
        bullets.push(new PlayerBullet(this.x + 8, this.y - 20, 0, -speed, 1.2, 'laser', '#d946ef'));
      } else if (p <= 4) {
        bullets.push(new PlayerBullet(this.x - 12, this.y - 20, -40, -speed, 1.4, 'laser', '#ec4899'));
        bullets.push(new PlayerBullet(this.x, this.y - 24, 0, -speed, 1.8, 'laser', '#a855f7'));
        bullets.push(new PlayerBullet(this.x + 12, this.y - 20, 40, -speed, 1.4, 'laser', '#ec4899'));
      } else {
        // Max level 5
        bullets.push(new PlayerBullet(this.x - 16, this.y - 15, -80, -speed, 1.5, 'laser', '#ec4899'));
        bullets.push(new PlayerBullet(this.x - 6, this.y - 25, 0, -speed, 2.0, 'laser', '#d946ef'));
        bullets.push(new PlayerBullet(this.x + 6, this.y - 25, 0, -speed, 2.0, 'laser', '#d946ef'));
        bullets.push(new PlayerBullet(this.x + 16, this.y - 15, 80, -speed, 1.5, 'laser', '#ec4899'));
      }
    } else {
      // Standard Vulcan (F-15 Phoenix)
      const speed = 820;
      if (p === 1) {
        bullets.push(new PlayerBullet(this.x - 8, this.y - 16, 0, -speed, 1.0, 'normal', '#38bdf8'));
        bullets.push(new PlayerBullet(this.x + 8, this.y - 16, 0, -speed, 1.0, 'normal', '#38bdf8'));
      } else if (p === 2) {
        bullets.push(new PlayerBullet(this.x - 12, this.y - 16, 0, -speed, 1.0, 'normal', '#38bdf8'));
        bullets.push(new PlayerBullet(this.x, this.y - 22, 0, -speed, 1.2, 'normal', '#38bdf8'));
        bullets.push(new PlayerBullet(this.x + 12, this.y - 16, 0, -speed, 1.0, 'normal', '#38bdf8'));
      } else if (p === 3) {
        bullets.push(new PlayerBullet(this.x - 14, this.y - 14, -40, -speed, 1.1, 'normal', '#38bdf8'));
        bullets.push(new PlayerBullet(this.x - 5, this.y - 20, 0, -speed, 1.2, 'normal', '#38bdf8'));
        bullets.push(new PlayerBullet(this.x + 5, this.y - 20, 0, -speed, 1.2, 'normal', '#38bdf8'));
        bullets.push(new PlayerBullet(this.x + 14, this.y - 14, 40, -speed, 1.1, 'normal', '#38bdf8'));
      } else {
        // Levels 4 & 5
        bullets.push(new PlayerBullet(this.x - 18, this.y - 10, -80, -speed, 1.2, 'normal', '#38bdf8'));
        bullets.push(new PlayerBullet(this.x - 8, this.y - 20, 0, -speed, 1.4, 'normal', '#38bdf8'));
        bullets.push(new PlayerBullet(this.x + 8, this.y - 20, 0, -speed, 1.4, 'normal', '#38bdf8'));
        bullets.push(new PlayerBullet(this.x + 18, this.y - 10, 80, -speed, 1.2, 'normal', '#38bdf8'));
        if (p === 5) {
          bullets.push(new PlayerBullet(this.x, this.y - 26, 0, -speed * 1.1, 2.0, 'normal', '#ffffff'));
        }
      }
    }
  }

  // Draw Procedural Vector Fighter Jet
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Invulnerability Flashing
    if (this.invulnerableTimer > 0) {
      const flash = Math.floor(this.invulnerableTimer * 14) % 2 === 0;
      if (flash) {
        // Glowing energy bubble shield
        ctx.beginPath();
        ctx.arc(0, 0, 32, 0, Math.PI * 2);
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.fillStyle = 'rgba(0, 255, 255, 0.15)';
        ctx.fill();
      }
    }

    // Tilt perspective transformation
    const tiltScaleX = 1 - Math.abs(this.tilt) * 0.25;
    ctx.scale(tiltScaleX, 1);

    const mainColor = this.plane.colorMain;
    const accentColor = this.plane.colorAccent;
    const cockpitColor = this.plane.colorCockpit;

    // Delta Wings
    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.lineTo(24, 14);
    ctx.lineTo(12, 18);
    ctx.lineTo(5, 26);
    ctx.lineTo(-5, 26);
    ctx.lineTo(-12, 18);
    ctx.lineTo(-24, 14);
    ctx.closePath();
    ctx.fillStyle = mainColor;
    ctx.fill();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Wing Stripe Decals
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.moveTo(10, 8);
    ctx.lineTo(20, 14);
    ctx.lineTo(16, 17);
    ctx.lineTo(8, 12);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-10, 8);
    ctx.lineTo(-20, 14);
    ctx.lineTo(-16, 17);
    ctx.lineTo(-8, 12);
    ctx.closePath();
    ctx.fill();

    // Fuselage / Nose Body
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.lineTo(7, -8);
    ctx.lineTo(6, 24);
    ctx.lineTo(-6, 24);
    ctx.lineTo(-7, -8);
    ctx.closePath();
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Jet Cockpit Canopy (Glass with glare)
    ctx.beginPath();
    ctx.ellipse(0, -4, 4, 11, 0, 0, Math.PI * 2);
    ctx.fillStyle = cockpitColor;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Cockpit Glare reflection
    ctx.beginPath();
    ctx.ellipse(-1.5, -6, 1.2, 4, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Wingtip Missile / Gun Pods
    ctx.fillStyle = '#475569';
    ctx.fillRect(21, 6, 3, 12);
    ctx.fillRect(-24, 6, 3, 12);
    ctx.fillStyle = accentColor;
    ctx.fillRect(21, 4, 3, 3);
    ctx.fillRect(-24, 4, 3, 3);

    ctx.restore();
  }
}
