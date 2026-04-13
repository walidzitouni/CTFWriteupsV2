// Live2D Character
(function() {
  const container = document.getElementById('character-container');
  if (!container) return;

  // Pin character to the red zone = extreme RIGHT of viewport; keep her on top so staff is never hidden
  function pinToViewportRight() {
    const wrapper = document.getElementById('hero3d-viewport-wrapper');
    if (wrapper) {
      wrapper.style.setProperty('position', 'fixed', 'important');
      wrapper.style.setProperty('top', '0', 'important');
      wrapper.style.setProperty('right', '0', 'important');
      wrapper.style.setProperty('bottom', '0', 'important');
      wrapper.style.setProperty('left', '0', 'important');
      wrapper.style.setProperty('z-index', '2147483647', 'important');
      wrapper.style.setProperty('pointer-events', 'none', 'important');
    }
    // Stick container to viewport RIGHT edge (red zone) – use right: 0 so she’s not pushed left
    container.style.setProperty('position', 'fixed', 'important');
    const customRight = document.body.dataset.charRight;
    container.style.setProperty('right', customRight !== undefined ? customRight : '-80px', 'important');
    container.style.setProperty('left', 'auto', 'important');
    container.style.setProperty('bottom', '0', 'important');
    container.style.setProperty('top', 'auto', 'important');
    container.style.setProperty('margin', '0', 'important');
    container.style.setProperty('z-index', '2147483647', 'important');
  }
  pinToViewportRight();
  window.addEventListener('resize', pinToViewportRight);

  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 700;
  container.appendChild(canvas);

  // Load Pixi.js first
  const pixiScript = document.createElement('script');
  pixiScript.src = 'https://cdn.jsdelivr.net/npm/pixi.js@6.5.2/dist/browser/pixi.min.js';
  pixiScript.onload = () => {
    window.PIXI = PIXI;
    
    // Load Live2D Cubism Core
    const coreScript = document.createElement('script');
    coreScript.src = '/assets/js/live2dcubismcore.min.js';
    coreScript.onload = () => {
      // Load pixi-live2d-display for Cubism 4
      const live2dScript = document.createElement('script');
      live2dScript.src = 'https://cdn.jsdelivr.net/npm/pixi-live2d-display@0.4.0/dist/cubism4.min.js';
      live2dScript.onload = () => {
        const app = new PIXI.Application({
          view: canvas,
          transparent: true,
          autoStart: true
        });

        // Handle WebGL context loss/restore
        canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); }, false);
        canvas.addEventListener('webglcontextrestored', () => { app.renderer.reset(); }, false);

        PIXI.live2d.Live2DModel.from('/assets/live2d/mao_pro_t02.model3.json').then(model => {
          app.stage.addChild(model);
          model.anchor.set(0.5, 1);
          model.position.set(240, 700);
          model.scale.set(0.08);

          // Eye tracking
          let mouseX = 0, mouseY = 0;
          document.addEventListener('mousemove', (e) => {
            mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
            mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
          });

          app.ticker.add(() => {
            if (model.internalModel && model.internalModel.coreModel) {
              model.internalModel.coreModel.setParameterValueById('ParamAngleX', mouseX * 30);
              model.internalModel.coreModel.setParameterValueById('ParamAngleY', -mouseY * 30);
              model.internalModel.coreModel.setParameterValueById('ParamEyeBallX', mouseX);
              model.internalModel.coreModel.setParameterValueById('ParamEyeBallY', -mouseY);
            }
          });

          // Random normal expressions every 20 seconds
          const normalExpressions = ['exp_01', 'exp_02', 'exp_03'];
          setInterval(() => {
            const randomExp = normalExpressions[Math.floor(Math.random() * normalExpressions.length)];
            model.expression(randomExp);
          }, 20000);

          // Particle effect function
          function createParticles(x, y) {
            for (let i = 0; i < 8; i++) {
              const particle = new PIXI.Graphics();
              particle.beginFill(0xff69b4);
              particle.drawCircle(0, 0, 3);
              particle.endFill();
              particle.x = x;
              particle.y = y;
              app.stage.addChild(particle);

              const angle = (Math.PI * 2 * i) / 8;
              const speed = 2 + Math.random() * 2;
              let vx = Math.cos(angle) * speed;
              let vy = Math.sin(angle) * speed;
              let life = 1;

              const animateParticle = () => {
                particle.x += vx;
                particle.y += vy;
                life -= 0.02;
                particle.alpha = life;
                
                if (life > 0) {
                  requestAnimationFrame(animateParticle);
                } else {
                  app.stage.removeChild(particle);
                }
              };
              animateParticle();
            }
          }

          // Interactive expressions on click with particles
          canvas.style.pointerEvents = 'auto';
          canvas.style.cursor = 'pointer';
          
          canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            const canvasHeight = rect.height;
            const canvasWidth = rect.width;
            
            // Create particles at click position
            createParticles(clickX, clickY);
            
            // Play tap motion
            const randomTap = Math.floor(Math.random() * 2);
            model.motion('Tap@Body', randomTap);
            
            // Normalize click position (0-1)
            const normalizedY = clickY / canvasHeight;
            
            // Head area (top 30%)
            if (normalizedY < 0.3) {
              model.expression('exp_04'); // Happy/pleased
            }
            // Upper body/chest (30-50%)
            else if (normalizedY < 0.5) {
              model.expression('exp_06'); // Embarrassed
            }
            // Stomach area (50-70%)
            else if (normalizedY < 0.7) {
              model.expression('exp_05'); // Comfortable/happy
            }
            // Lower body (70-100%)
            else {
              model.expression('exp_07'); // Very embarrassed/shocked
            }
          });

          // Wave on hover
          let isHovering = false;
          canvas.addEventListener('mouseenter', () => {
            if (!isHovering) {
              isHovering = true;
              model.motion('Tap@Body', 0);
              setTimeout(() => { isHovering = false; }, 3000);
            }
          });

          // Startled when mouse gets close
          let lastDistance = Infinity;
          document.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const distance = Math.sqrt(Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2));
            
            // If mouse suddenly gets close (within 150px)
            if (distance < 150 && lastDistance > 200) {
              model.expression('exp_08'); // Startled
              setTimeout(() => model.expression('exp_01'), 2000); // Back to normal
            }
            lastDistance = distance;
          });
        }).catch(err => console.error('Live2D load error:', err));
      };
      document.head.appendChild(live2dScript);
    };
    document.head.appendChild(coreScript);
  };
  document.head.appendChild(pixiScript);
})();
