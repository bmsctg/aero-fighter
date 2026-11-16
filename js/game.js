// Core Engine, Parallax Background, HUD & State Management

class ParallaxBackground {
  constructor() {
    this.stars = [];
    this.clouds = [];
    this.scrollY = 0;

    // Generate starfield
    for (let i = 0; i < 70; i++) {
      this.stars.push({
        x: Math.random() * 540,
        y: Math.random() * 960,
        size: Math.random() * 2 + 1,
        speed: 40 + Math.random() * 80,
        alpha: 0.3 + Math.random() * 0.7
      });
    }

    // Generate procedural fluffy clouds
    for (let i = 0; i < 7; i++) {
      this.clouds.push({
        x: Math.random() * 480,
        y: Math.random() * 960,
        radius: 40 + Math.random() * 50,
        speed: 70 + Math.random() * 60,
        alpha: 0.15 + Math.random() * 0.2
      });
    }
  }

  update(dt, stage = 1) {
    this.scrollY += 80 * dt;

    // Update stars
    this.stars.forEach(s => {
      s.y += s.speed * dt;
      if (s.y > 960) {
        s.y = -10;
        s.x = Math.random() * 540;
      }
    });

    // Update clouds
    this.clouds.forEach(c => {
      c.y += c.speed * dt;
      if (c.y - c.radius > 960) {
        c.y = -c.radius * 2;
        c.x = Math.random() * 500;
      }
    });
  }

  draw(ctx, stage = 1) {
    // Stage background gradients
    const grad = ctx.createLinearGradient(0, 0, 0, 960);
    if (stage === 1) {
      // Sky Blue to Deep Indigo (Cloud Kingdom)
      grad.addColorStop(0, '#0c2340');
      grad.addColorStop(0.5, '#1e3a8a');
      grad.addColorStop(1, '#0284c7');
    } else if (stage === 2) {
      // Tropical Ocean Sunset (Ocean Strike)
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#0369a1');
      grad.addColorStop(1, '#0891b2');
    } else {
      // Cosmic Space / Star Base
      grad.addColorStop(0, '#030712');
      grad.addColorStop(0.6, '#1e1b4b');
      grad.addColorStop(1, '#312e81');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 540, 960);

    // Draw Stars
    this.stars.forEach(s => {
      ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Parallax Clouds
    this.clouds.forEach(c => {
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${c.alpha})`;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      ctx.arc(c.x + c.radius * 0.7, c.y - 10, c.radius * 0.7, 0, Math.PI * 2);
      ctx.arc(c.x - c.radius * 0.7, c.y - 10, c.radius * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }
}

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.state = 'TITLE'; // 'TITLE', 'PLAYING', 'PAUSED', 'STAGE_CLEAR', 'VICTORY', 'GAME_OVER'

    this.selectedPlaneIndex = 0;
    this.player = new Player(PLANE_TYPES[this.selectedPlaneIndex]);
    this.waveManager = new WaveManager();
    this.background = new ParallaxBackground();

    this.playerBullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.pickups = [];

    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('aero_high_score') || '0', 10);
    this.lastTime = 0;

    this.initUI();
    this.initControls();
    this.updateHighScoreDisplay();

    // Start Animation Loop
    requestAnimationFrame(this.loop.bind(this));
  }

  initUI() {
    // Populate Plane Selection Cards
    const carousel = document.getElementById('plane-carousel');
    carousel.innerHTML = '';

    PLANE_TYPES.forEach((plane, idx) => {
      const card = document.createElement('div');
      card.className = `plane-card ${idx === this.selectedPlaneIndex ? 'selected' : ''}`;
      card.innerHTML = `
        <canvas class="plane-preview" id="preview-${plane.id}" width="60" height="60"></canvas>
        <div class="plane-name">${plane.name}</div>
        <div class="plane-stat-bars">
          <div class="stat-row">
            <span>SPD</span>
            <div class="stat-bar"><div class="stat-fill" style="width: ${plane.stats.speed}%;"></div></div>
          </div>
          <div class="stat-row">
            <span>PWR</span>
            <div class="stat-bar"><div class="stat-fill" style="width: ${plane.stats.power}%;"></div></div>
          </div>
          <div class="stat-row">
            <span>DEF</span>
            <div class="stat-bar"><div class="stat-fill" style="width: ${plane.stats.defense}%;"></div></div>
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        document.querySelectorAll('.plane-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedPlaneIndex = idx;
        this.player.setPlane(PLANE_TYPES[idx]);
        Sounds.playShoot();
      });

      carousel.appendChild(card);
    });

    // Draw mini preview planes
    setTimeout(() => {
      PLANE_TYPES.forEach(plane => {
        const previewCanvas = document.getElementById(`preview-${plane.id}`);
        if (previewCanvas) {
          const pCtx = previewCanvas.getContext('2d');
          pCtx.translate(30, 32);
          pCtx.scale(0.8, 0.8);
          const dummyPlayer = new Player(plane);
          dummyPlayer.x = 0;
          dummyPlayer.y = 0;
          dummyPlayer.draw(pCtx);
        }
      });
    }, 50);

    // Button event listeners
    document.getElementById('btn-start').addEventListener('click', () => {
      Sounds.init();
      Sounds.startBGM();
      this.startGame();
    });

    document.getElementById('btn-toggle-sound').addEventListener('click', (e) => {
      Sounds.init();
      const soundActive = Sounds.toggleMute();
      e.target.textContent = soundActive ? '🔊 SOUND: ON' : '🔇 SOUND: OFF';
    });

    document.getElementById('btn-next-stage').addEventListener('click', () => {
      this.nextStage();
    });

    document.getElementById('btn-game-over-restart').addEventListener('click', () => {
      this.startGame();
    });

    document.getElementById('btn-victory-restart').addEventListener('click', () => {
      this.showScreen('title-screen');
      this.state = 'TITLE';
    });

    // Mobile touch action buttons
    document.getElementById('btn-touch-bomb').addEventListener('click', () => {
      if (this.state === 'PLAYING') {
        this.player.useBomb(this.enemies, this.enemyBullets, this);
      }
    });

    const autoBtn = document.getElementById('btn-touch-autofire');
    autoBtn.addEventListener('click', () => {
      this.player.autoFire = !this.player.autoFire;
      autoBtn.classList.toggle('active', this.player.autoFire);
    });
  }

  initControls() {
    // Keyboard handlers
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) this.player.keys.up = true;
      if (['ArrowDown', 'KeyS'].includes(e.code)) this.player.keys.down = true;
      if (['ArrowLeft', 'KeyA'].includes(e.code)) this.player.keys.left = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) this.player.keys.right = true;
      if (['Space', 'KeyJ'].includes(e.code)) this.player.keys.shoot = true;
      if (['KeyB', 'KeyK'].includes(e.code)) {
        if (this.state === 'PLAYING') {
          this.player.useBomb(this.enemies, this.enemyBullets, this);
        }
      }
      if (e.code === 'KeyP') {
        this.togglePause();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) this.player.keys.up = false;
      if (['ArrowDown', 'KeyS'].includes(e.code)) this.player.keys.down = false;
      if (['ArrowLeft', 'KeyA'].includes(e.code)) this.player.keys.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) this.player.keys.right = false;
      if (['Space', 'KeyJ'].includes(e.code)) this.player.keys.shoot = false;
    });

    // Pointer / Touch Dragging across canvas
    const handlePointerMove = (e) => {
      if (this.state !== 'PLAYING') return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      this.player.targetX = (clientX - rect.left) * scaleX;
      this.player.targetY = (clientY - rect.top) * scaleY;
      this.player.isDragging = true;
    };

    const handlePointerEnd = () => {
      this.player.isDragging = false;
    };

    const touchZone = document.getElementById('touch-move-zone');
    touchZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handlePointerMove(e);
    }, { passive: false });

    touchZone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      handlePointerMove(e);
    }, { passive: false });

    touchZone.addEventListener('touchend', handlePointerEnd);
    touchZone.addEventListener('touchcancel', handlePointerEnd);

    // Mouse support on Canvas
    this.canvas.addEventListener('mousemove', (e) => {
      if (this.state === 'PLAYING' && (e.buttons === 1 || this.player.isDragging)) {
        handlePointerMove(e);
      }
    });
    this.canvas.addEventListener('mousedown', (e) => {
      if (this.state === 'PLAYING') {
        handlePointerMove(e);
      }
    });
    this.canvas.addEventListener('mouseup', handlePointerEnd);
  }

  showScreen(screenId) {
    document.querySelectorAll('.ui-screen').forEach(s => s.classList.add('hidden'));
    if (screenId) {
      const target = document.getElementById(screenId);
      if (target) target.classList.remove('hidden');
    }
  }

  startGame(stage = 1) {
    this.state = 'PLAYING';
    this.showScreen(null); // Hide menu overlays
    document.getElementById('touch-controls').classList.remove('hidden');

    this.player.reset();
    this.waveManager.reset(stage);
    this.playerBullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.pickups = [];
    FX.reset();

    if (stage === 1) {
      this.score = 0;
    }
  }

  nextStage() {
    const next = this.waveManager.currentStage + 1;
    if (next <= this.waveManager.maxStages) {
      this.startGame(next);
    } else {
      this.triggerVictory();
    }
  }

  triggerVictory() {
    this.state = 'VICTORY';
    this.showScreen('victory-screen');
    document.getElementById('victory-score').textContent = this.score.toLocaleString();
    this.checkHighScore();
    Sounds.playPowerup();
  }

  triggerGameOver() {
    this.state = 'GAME_OVER';
    this.showScreen('game-over-screen');
    document.getElementById('game-over-score').textContent = this.score.toLocaleString();
    this.checkHighScore();
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.showScreen('pause-screen');
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.showScreen(null);
    }
  }

  addScore(pts) {
    this.score += pts;
  }

  checkHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('aero_high_score', this.highScore);
      this.updateHighScoreDisplay();
      const tag = document.getElementById('new-high-score-tag');
      if (tag) tag.classList.remove('hidden');
    }
  }

  updateHighScoreDisplay() {
    const display = document.getElementById('best-score-display');
    if (display) display.textContent = this.highScore.toLocaleString();
  }

  // Main Loop
  loop(timestamp) {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1) || 0.016;
    this.lastTime = timestamp;

    this.update(dt);
    this.draw();

    requestAnimationFrame(this.loop.bind(this));
  }

  update(dt) {
    this.background.update(dt, this.waveManager.currentStage);
    FX.update(dt);

    if (this.state !== 'PLAYING') return;

    // Player Update
    this.player.update(dt, this.playerBullets);

    // Wave Spawner Update
    const waveStatus = this.waveManager.update(dt, this.enemies, this.pickups);
    if (waveStatus === 'STAGE_CLEARED') {
      // Stage Cleared!
      this.state = 'STAGE_CLEAR';
      Sounds.playPowerup();
      document.getElementById('stage-clear-title').textContent = `STAGE ${this.waveManager.currentStage} CLEARED!`;
      document.getElementById('stage-clear-stats').textContent = `Score: ${this.score.toLocaleString()} | Stars Collected: ${this.player.stars}`;
      this.showScreen('stage-clear-screen');
      return;
    }

    // Bullets Update
    this.playerBullets = this.playerBullets.filter(b => b.update(dt));
    this.enemyBullets = this.enemyBullets.filter(b => b.update(dt));

    // Pickups Update
    this.pickups = this.pickups.filter(p => {
      const active = p.update(dt, this.player);
      // Check collision with player
      const dist = Math.hypot(p.x - this.player.x, p.y - this.player.y);
      if (dist < p.radius + 18) {
        if (p.type === 'star') this.player.addStar(this);
        if (p.type === 'power') this.player.addPower();
        if (p.type === 'heart') this.player.addHealth();
        if (p.type === 'bomb') this.player.addBomb();
        return false;
      }
      return active;
    });

    // Enemies Update & Bullet Collisions
    this.enemies = this.enemies.filter(enemy => {
      const alive = enemy.update(dt, this.player, this.enemyBullets);

      // Check collision with player bullets
      for (let i = this.playerBullets.length - 1; i >= 0; i--) {
        const bullet = this.playerBullets[i];
        const hitDist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
        const radius = enemy.isBoss ? 75 : 24;

        if (hitDist < radius) {
          this.playerBullets.splice(i, 1);
          FX.createExplosion(bullet.x, bullet.y, 6, 'fire', 0.4);
          Sounds.playExplosion(0.3);

          if (enemy.takeDamage(bullet.damage)) {
            // Enemy Destroyed!
            FX.createExplosion(enemy.x, enemy.y, enemy.isBoss ? 50 : 20, 'fire', enemy.isBoss ? 2 : 1);
            Sounds.playExplosion(enemy.isBoss ? 1.5 : 0.8);
            this.addScore(enemy.isBoss ? 10000 : 250);

            // Chance to drop items
            if (!enemy.isBoss) {
              const r = Math.random();
              if (r < 0.35) {
                this.pickups.push(new Pickup(enemy.x, enemy.y, 'star'));
              } else if (r < 0.45) {
                this.pickups.push(new Pickup(enemy.x, enemy.y, 'power'));
              } else if (r < 0.49) {
                this.pickups.push(new Pickup(enemy.x, enemy.y, 'heart'));
              }
            }
            return false;
          }
        }
      }

      // Check collision directly with player (Ramming damage)
      if (this.player.invulnerableTimer <= 0) {
        const ramDist = Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y);
        if (ramDist < (enemy.isBoss ? 60 : 30)) {
          if (this.player.takeDamage(1)) {
            this.triggerGameOver();
          }
        }
      }

      return alive && enemy.hp > 0;
    });

    // Enemy Bullets collision with Player
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const eb = this.enemyBullets[i];
      const dist = Math.hypot(eb.x - this.player.x, eb.y - this.player.y);
      if (dist < eb.radius + 10) {
        this.enemyBullets.splice(i, 1);
        if (this.player.takeDamage(1)) {
          this.triggerGameOver();
          break;
        }
      }
    }
  }

  draw() {
    this.ctx.save();

    // Screen Shake Offset
    if (FX.screenShake > 0) {
      const sx = (Math.random() - 0.5) * FX.screenShake;
      const sy = (Math.random() - 0.5) * FX.screenShake;
      this.ctx.translate(sx, sy);
    }

    // Draw Background
    this.background.draw(this.ctx, this.waveManager.currentStage);

    // Draw Pickups
    this.pickups.forEach(p => p.draw(this.ctx));

    // Draw Player Bullets
    this.playerBullets.forEach(b => b.draw(this.ctx));

    // Draw Enemies
    this.enemies.forEach(e => e.draw(this.ctx));

    // Draw Enemy Bullets
    this.enemyBullets.forEach(b => b.draw(this.ctx));

    // Draw Player
    if (this.state === 'PLAYING') {
      this.player.draw(this.ctx);
    }

    // Draw Visual FX / Particles
    FX.draw(this.ctx);

    // Draw HUD if in game
    if (this.state === 'PLAYING') {
      this.drawHUD();
    }

    this.ctx.restore();
  }

  // Draw In-Game Heads-Up Display
  drawHUD() {
    const ctx = this.ctx;
    ctx.save();

    // Top HUD Bar background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.fillRect(0, 0, 540, 52);

    // Score Display
    ctx.font = '900 22px "Arial Black", sans-serif';
    ctx.fillStyle = '#ffdd00';
    ctx.fillText(`${this.score.toLocaleString()}`, 16, 34);

    // Health Hearts
    let hearts = '';
    for (let i = 0; i < this.player.maxHp; i++) {
      hearts += i < this.player.hp ? '❤️' : '🖤';
    }
    ctx.font = '18px serif';
    ctx.fillText(hearts, 230, 32);

    // Mega Bombs
    let bombText = '';
    for (let i = 0; i < this.player.bombs; i++) {
      bombText += '💣';
    }
    ctx.font = '16px serif';
    ctx.fillText(bombText || 'EMPTY', 430, 32);

    // Stage Indicator
    ctx.font = '700 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`STAGE ${this.waveManager.currentStage}`, 16, 48);

    // Boss Health Bar (if active boss is on screen)
    if (this.waveManager.activeBoss && this.waveManager.activeBoss.hp > 0) {
      const boss = this.waveManager.activeBoss;
      const barWidth = 360;
      const barHeight = 12;
      const bx = (540 - barWidth) / 2;
      const by = 64;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(bx - 2, by - 2, barWidth + 4, barHeight + 4);

      const hpPercent = Math.max(0, boss.hp / boss.maxHp);
      ctx.fillStyle = boss.color;
      ctx.fillRect(bx, by, barWidth * hpPercent, barHeight);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx, by, barWidth, barHeight);

      ctx.font = '900 11px "Arial Black", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(`⚠️ ${boss.name} ⚠️`, 270, by + 10);
    }

    ctx.restore();
  }
}

// Instantiate Game on Page Load
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
