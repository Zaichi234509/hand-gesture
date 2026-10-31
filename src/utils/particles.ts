export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  decay: number;
  rotation: number;
  vRot: number;
  kind: 'heart' | 'mote';
  color: string;
}

const PALETTE = ['#E0636B', '#EE8B92', '#F8C6CA', '#FAF8F5', '#E8D5B7'];

export class ParticleSystem {
  private particles: Particle[] = [];

  burst(normX: number, normY: number, width: number, height: number, count = 24): void {
    const cx = normX * width;
    const cy = normY * height;

    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.35;
      const speed = 1.1 + Math.random() * 2.8;
      this.particles.push({
        x: cx + (Math.random() - 0.5) * 20,
        y: cy + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.7,
        size: 5 + Math.random() * 7,
        alpha: 0.95,
        decay: 0.011 + Math.random() * 0.009,
        rotation: (Math.random() - 0.5) * 0.6,
        vRot: (Math.random() - 0.5) * 0.025,
        kind: i % 3 === 2 ? 'mote' : 'heart',
        color: PALETTE[i % PALETTE.length],
      });
    }
  }

  emitTrail(normX: number, normY: number, width: number, height: number): void {
    if (this.particles.length > 90 || Math.random() > 0.35) return;

    this.particles.push({
      x: normX * width + (Math.random() - 0.5) * 14,
      y: normY * height + (Math.random() - 0.5) * 14,
      vx: (Math.random() - 0.5) * 0.45,
      vy: -0.55 - Math.random() * 0.65,
      size: 3.5 + Math.random() * 3.5,
      alpha: 0.75,
      decay: 0.022,
      rotation: (Math.random() - 0.5) * 0.4,
      vRot: (Math.random() - 0.5) * 0.02,
      kind: Math.random() > 0.45 ? 'heart' : 'mote',
      color: Math.random() > 0.35 ? '#E6737B' : '#FAF8F5',
    });
  }

  updateAndDraw(ctx: CanvasRenderingContext2D): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.985;
      p.vy *= 0.988;
      p.vy -= 0.012; // subtle upward float
      p.rotation += p.vRot;
      p.alpha -= p.decay;

      if (p.alpha <= 0.01) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      if (p.kind === 'heart') {
        drawMinimalHeart(ctx, p.size, p.color);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.36, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }
}

function drawMinimalHeart(ctx: CanvasRenderingContext2D, size: number, color: string): void {
  const s = size * 0.55;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, s * 0.85);
  ctx.bezierCurveTo(-s * 1.25, s * 0.05, -s * 1.15, -s * 0.95, 0, -s * 0.35);
  ctx.bezierCurveTo(s * 1.15, -s * 0.95, s * 1.25, s * 0.05, 0, s * 0.85);
  ctx.closePath();
  ctx.fill();
}
