/*!
 * Flow-field equations adapted from aitezazdev/Portfolio, FlowField.tsx.
 * Copyright (c) 2026 Aitezaz Sikandar — MIT.
 * Full license included in public/THIRD-PARTY-NOTICES.txt (also shipped in dist).
 * Vanilla adaptation: shared ticker, delta-time physics, bounded DPR and observers.
 */
export function createFlowField(canvas, { mobile, pointer, hasPointer, isBlocked }) {
  const context = canvas?.getContext('2d');
  if (!context) return null;
  let width = 1, height = 1, left = 0, top = 0, visible = false;
  let lastDraw = 0, fieldTime = 0;
  let particles = [];
  const spawn = () => ({ x: Math.random() * width, y: Math.random() * height,
    life: 0, maxLife: 90 + Math.random() * 160, speed: .5 + Math.random() * 1.1 });
  const noiseAngle = (x, y, time) => (
    Math.sin(x * 1.7 + time) * Math.cos(y * 1.35 - time * .7) +
    Math.sin((x + y) * .85 + time * .45) * .8 +
    Math.sin(x * .55 - y * .9 - time * .3) * .6
  ) * 2.4;

  function resize() {
    const box = canvas.getBoundingClientRect();
    width = box.width; height = box.height;
    left = box.left; top = box.top + scrollY;
    const dpr = mobile ? 1 : Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    particles = Array.from({ length: mobile ? 28 : 140 }, () => {
      const particle = spawn(); particle.life = Math.random() * particle.maxLife;
      return particle;
    });
    lastDraw = 0;
  }
  const sizeObserver = new ResizeObserver(resize);
  sizeObserver.observe(canvas);
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting; lastDraw = 0;
  }, { threshold: .02 });
  visibilityObserver.observe(canvas);
  resize();

  return {
    draw(time) {
      if (!visible || document.hidden || isBlocked()) { lastDraw = 0; return; }
      if (lastDraw && time - lastDraw < (mobile ? .05 : .032)) return;
      const step = lastDraw ? Math.min(3, (time - lastDraw) * 60) : 1;
      lastDraw = time;
      // Fade the transparent trail layer, preserving the original forest background.
      context.globalCompositeOperation = 'destination-out';
      context.fillStyle = `rgba(0,0,0,${1 - Math.pow(.955, step)})`;
      context.fillRect(0, 0, width, height);
      context.globalCompositeOperation = 'source-over';
      context.lineWidth = mobile ? .85 : 1.1;
      const mx = pointer.x - left, my = pointer.y + scrollY - top;
      for (const particle of particles) {
        const angle = noiseAngle(particle.x * .0042, particle.y * .0042, fieldTime);
        let vx = Math.cos(angle) * particle.speed;
        let vy = Math.sin(angle) * particle.speed * .85;
        if (!mobile && hasPointer()) {
          const dx = particle.x - mx, dy = particle.y - my, distance = Math.hypot(dx, dy);
          if (distance > 1 && distance < 130) {
            const push = (1 - distance / 130) * 2.2;
            vx += dx / distance * push; vy += dy / distance * push;
          }
        }
        const px = particle.x, py = particle.y;
        particle.x += vx * step; particle.y += vy * step; particle.life += step;
        if (particle.life > particle.maxLife || particle.x < -20 || particle.x > width + 20 ||
          particle.y < -20 || particle.y > height + 20) { Object.assign(particle, spawn()); continue; }
        const fade = Math.sin(particle.life / particle.maxLife * Math.PI);
        context.strokeStyle = `rgba(195,216,167,${.18 + fade * .32})`;
        context.beginPath(); context.moveTo(px, py); context.lineTo(particle.x, particle.y); context.stroke();
      }
      fieldTime += .0028 * step;
    },
    destroy() {
      sizeObserver.disconnect(); visibilityObserver.disconnect();
      context.clearRect(0, 0, width, height); particles = [];
    }
  };
}
