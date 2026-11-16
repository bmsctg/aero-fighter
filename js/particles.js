// Particle System & Visual FX (Clean 60 FPS Procedural Graphics)

class Particle {
  constructor(x, y, vx, vy, color, size, life, decay, shape = 'circle') {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.maxLife = life;
    this.life = life;
    this.decay = decay;
    this.shape = shape; // 'circle', 'square', 'spark', 'ring'
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= this.decay * dt;
    return this.life > 0;
  }

  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.color;

    if (this.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.shape === 'square') {
      const s = this.size * alpha;
      ctx.fillRect(this.x - s / 2, this.y - s / 2, s, s);
    } else if (this.shape === 'ring') {
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * (1 - alpha * 0.5), 0, Math.PI * 2);
      ctx.stroke();
    } else if (this.shape === 'spark') {
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.vx * 0.08, this.y - this.vy * 0.08);
      ctx.stroke();
    }
    ctx.restore();
  }
}

// Floating Text (e.g. "+100", "POWER UP")
class FloatingText {
  constructor(x, y, text, color = '#ffcc00', size = 16) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.size = size;
    this.life = 1.0;
    this.vy = -45;
  }

  update(dt) {
    this.y += this.vy * dt;
    this.life -= 1.2 * dt;
    return this.life > 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.font = `900 ${this.size}px 'Arial Black', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText(this.text, this.x, this.y);
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

// Shockwave from Mega Bomb
class Shockwave {
  constructor(x, y, maxRadius = 380, color = '#00ffff') {
    this.x = x;
    this.y = y;
    this.radius = 10;
    this.maxRadius = maxRadius;
    this.color = color;
    this.life = 1.0;
  }

  update(dt) {
    this.radius += (this.maxRadius - this.radius) * 6 * dt + 150 * dt;
    this.life -= 1.6 * dt;
    return this.life > 0 && this.radius < this.maxRadius;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 6 * this.life;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Secondary inner glow
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2 * this.life;
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(5, this.radius - 8), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

// Global Particle Manager
class ParticleManager {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
    this.shockwaves = [];
    this.screenShake = 0;
  }

  reset() {
    this.particles = [];
    this.floatingTexts = [];
    this.shockwaves = [];
    this.screenShake = 0;
  }

  addShake(amount) {
    this.screenShake = Math.min(this.screenShake + amount, 25);
  }

  update(dt) {
    // Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake -= 25 * dt;
      if (this.screenShake < 0) this.screenShake = 0;
    }

    this.particles = this.particles.filter(p => p.update(dt));
    this.floatingTexts = this.floatingTexts.filter(ft => ft.update(dt));
    this.shockwaves = this.shockwaves.filter(sw => sw.update(dt));
  }

  draw(ctx) {
    this.particles.forEach(p => p.draw(ctx));
    this.shockwaves.forEach(sw => sw.draw(ctx));
    this.floatingTexts.forEach(ft => ft.draw(ctx));
  }

  // Create explosion effect
  createExplosion(x, y, count = 25, colorScheme = 'fire', sizeMult = 1) {
    this.addShake(count > 30 ? 10 : 4);
    const colors = colorScheme === 'blue'
      ? ['#00d2ff', '#0077ff', '#ffffff', '#88eeff']
      : ['#ffdd00', '#ff6600', '#ff0033', '#ffffff', '#ffaa00'];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (60 + Math.random() * 220) * sizeMult;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = (4 + Math.random() * 6) * sizeMult;
      const life = 0.5 + Math.random() * 0.4;
      const shape = Math.random() > 0.4 ? 'circle' : 'spark';
      this.particles.push(new Particle(x, y, vx, vy, color, size, life, 1.0, shape));
    }

    // Add ring burst
    this.particles.push(new Particle(x, y, 0, 0, '#ffffff', 40 * sizeMult, 0.4, 2.0, 'ring'));
  }

  // Create Jet Engine Exhaust Thruster
  createThruster(x, y, color = '#00d2ff') {
    const vx = (Math.random() - 0.5) * 30;
    const vy = 120 + Math.random() * 80;
    const size = 3 + Math.random() * 4;
    const life = 0.25;
    this.particles.push(new Particle(x, y, vx, vy, color, size, life, 4.0, 'circle'));
  }

  // Star pickup sparkle
  createStarSparkle(x, y) {
    const colors = ['#fff700', '#ffffff', '#ffcc00'];
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 80;
      this.particles.push(new Particle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        colors[Math.floor(Math.random() * colors.length)],
        3 + Math.random() * 3,
        0.35, 2.5, 'spark'
      ));
    }
  }

  addFloatingText(x, y, text, color = '#ffcc00', size = 16) {
    this.floatingTexts.push(new FloatingText(x, y, text, color, size));
  }

  createShockwave(x, y, radius = 400, color = '#00ffff') {
    this.shockwaves.push(new Shockwave(x, y, radius, color));
    this.addShake(18);
  }
}

const FX = new ParticleManager();
