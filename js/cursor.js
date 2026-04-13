// Custom arrow cursor with canvas trail — no DOM spam
(function() {
  if (window.innerWidth < 769) return;

  // Arrow
  const arrow = document.createElement('div');
  arrow.id = 'custom-arrow';
  const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="24" viewBox="0 0 20 24">
    <polygon points="0,0 0,18 5,13 9,22 12,21 8,12 14,12" fill="#ffffff" stroke="#ff4757" stroke-width="1.2"/>
  </svg>`;
  arrow.innerHTML = SVG;
  Object.assign(arrow.style, {
    position: 'fixed', top: '0', left: '0',
    pointerEvents: 'none', zIndex: '2147483646',
    willChange: 'transform',
  });
  document.body.appendChild(arrow);

  // Trail canvas — full viewport, behind arrow
  const tc = document.createElement('canvas');
  Object.assign(tc.style, {
    position: 'fixed', top: '0', left: '0',
    pointerEvents: 'none', zIndex: '2147483645',
  });
  tc.width = window.innerWidth;
  tc.height = window.innerHeight;
  document.body.appendChild(tc);
  const ctx = tc.getContext('2d');

  window.addEventListener('resize', () => {
    tc.width = window.innerWidth;
    tc.height = window.innerHeight;
  });

  let mx = 0, my = 0;
  const particles = [];

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    arrow.style.transform = `translate(${mx - 1}px, ${my - 1}px)`;
    if (Math.random() < 0.4) {
      particles.push({
        x: mx + (Math.random()-0.5)*6,
        y: my + (Math.random()-0.5)*6,
        r: 2 + Math.random()*2,
        a: 0.7,
        vx: (Math.random()-0.5)*1.5,
        vy: -1 - Math.random()*2,
        color: Math.random() > 0.5 ? '#ff4757' : '#ffffff',
      });
    }
  }, { passive: true });

  document.addEventListener('mousedown', () => {
    arrow.style.transform = `translate(${mx - 1}px, ${my - 1}px) scale(0.85)`;
  });
  document.addEventListener('mouseup', () => {
    arrow.style.transform = `translate(${mx - 1}px, ${my - 1}px) scale(1)`;
  });

  function loop() {
    ctx.clearRect(0, 0, tc.width, tc.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.a -= 0.04;
      if (p.a <= 0) { particles.splice(i, 1); continue; }
      ctx.globalAlpha = p.a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(loop);
  }
  loop();
})();
