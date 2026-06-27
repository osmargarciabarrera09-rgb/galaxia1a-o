(function () {
  const err = document.getElementById('err');
  function showError(msg) { err.textContent = msg; err.style.display = 'block'; }

  // ====== AUDIO ======
  const audio = document.getElementById('audio');
  const playBtn = document.getElementById('playBtn');
  const pickBtn = document.getElementById('pickBtn');
  const pickFile = document.getElementById('pickFile');

  playBtn.onclick = async () => {
    try {
      if (audio.paused) { await audio.play(); playBtn.textContent = '⏸︎'; }
      else { audio.pause(); playBtn.textContent = '▶︎'; }
    } catch (e) { showError('Si no suena, toca "Elegir canción" y selecciona tu MP3.'); }
  };
  pickBtn.onclick = () => pickFile.click();
  pickFile.onchange = () => {
    if (pickFile.files && pickFile.files[0]) {
      const url = URL.createObjectURL(pickFile.files[0]);
      audio.src = url;
      audio.play().then(() => playBtn.textContent = '⏸︎').catch(() => {});
    }
  };

  // ====== WEBGL CHECK ======
  try {
    const test = document.createElement('canvas').getContext('webgl') ||
                 document.createElement('canvas').getContext('experimental-webgl');
    if (!test) throw new Error('Tu navegador no tiene WebGL activo');
  } catch (e) {
    showError('WebGL parece desactivado. Prueba con Chrome/Edge/Firefox, o habilita aceleración por hardware.');
    return;
  }

  // ====== THREE.JS GALAXY ======
  try {
    const canvas = document.getElementById('galaxy-canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d0820);
    scene.fog = new THREE.FogExp2(0x1a0a35, 0.0003);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.06;
    controls.minDistance = 10; controls.maxDistance = 220;
    controls.target.set(0, 0, 0);

    function setCam() {
      const w = window.innerWidth, h = window.innerHeight;
      const isMobile = w < 768 || w < h;
      camera.fov = isMobile ? 90 : 75;
      camera.position.set(0, isMobile ? 26 : 22, isMobile ? 110 : 75);
      camera.updateProjectionMatrix();
      controls.update();
    }
    setCam();
    window.addEventListener('resize', () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      setCam();
    });

    // ---------- Starfield con tono morado/azul ----------
    function makePrettyStarTexture(size = 1024, count = 2600) {
      const c = document.createElement('canvas'); c.width = c.height = size;
      const g = c.getContext('2d');
      const r = size / 2;
      const bg = g.createRadialGradient(r, r, r * 0.1, r, r, r);
      bg.addColorStop(0, '#0d0520');
      bg.addColorStop(1, '#000000');
      g.fillStyle = bg; g.fillRect(0, 0, size, size);
      for (let i = 0; i < count; i++) {
        const x = Math.random() * size, y = Math.random() * size;
        const base = Math.random() * 0.7 + 0.3;
        const glow = g.createRadialGradient(x, y, 0, x, y, Math.random() * 2.2 + 1.6);
        const huePick = Math.random();
        let colInner = 'rgba(255,255,255,' + (0.7 * base) + ')';
        let colOuter;
        if      (huePick < 0.30) colOuter = 'rgba(200,150,255,' + (0.14 * base) + ')'; 
        else if (huePick < 0.55) colOuter = 'rgba(140,190,255,' + (0.14 * base) + ')'; 
        else if (huePick < 0.72) colOuter = 'rgba(100,220,230,' + (0.12 * base) + ')'; 
        else                     colOuter = 'rgba(255,200,240,' + (0.11 * base) + ')'; 
        glow.addColorStop(0, colInner);
        glow.addColorStop(1, colOuter);
        g.fillStyle = glow; g.beginPath(); g.arc(x, y, Math.random() * 1.3 + 0.5, 0, Math.PI * 2); g.fill();
      }
      return new THREE.CanvasTexture(c);
    }

    const bgGeo = new THREE.SphereGeometry(600, 64, 64);
    const starTex = makePrettyStarTexture(1024, 2600);
    starTex.wrapS = starTex.wrapT = THREE.RepeatWrapping;
    const bgMesh = new THREE.Mesh(bgGeo, new THREE.MeshBasicMaterial({ map: starTex, side: THREE.BackSide }));
    scene.add(bgMesh);

    // ---------- Galaxy frases ----------
    const galaxy = new THREE.Group(); scene.add(galaxy);
    const phrases = [
      "Pinchecha ✨", " Hermosa 💛", "Mi Bebe", "Mi Cielito 🌌", "Hermosota ✨",
      "Mi Infinita ♾️", "Mi Todo", "Me Encantas 🥰", " Dafne 💫", "Te Amo💛",
      "Mi Canción Favorita 🎶", "Unica 😊", "Mi Reina 👑", "Mi Amor", "Mi Mundo",
      "Mi Luz 🌠", "Mi Niña", "Mi Tesoro💛", "Mi Paz", "Mi Eterna", "Mi Sueño",
      "Mi Pensamiento Favorito", "Mi Bombom", "Mi Diosa", "Te Amo Infinitamente ♾️"
    ];
    const phraseCount = Math.max(phrases.length * 6, 180);
    const arms = 5, radius = 82, maxH = 22;

    function makeTextTexture(text, size = 48) {
      const c = document.createElement('canvas'); c.width = 1024; c.height = 128;
      const g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height);
      g.font = '800 ' + size + 'px -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.shadowColor = 'rgba(180,100,255,0.95)'; g.shadowBlur = 28;
      g.fillStyle = 'rgba(255,240,255,0.98)'; g.fillText(text, c.width / 2, c.height / 2);
      return new THREE.CanvasTexture(c);
    }

    for (let i = 0; i < phraseCount; i++) {
      const text = phrases[i % phrases.length];
      const tex = makeTextTexture(text, 48);
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
      const perArm = phraseCount / arms;
      const ang = (i % perArm) * (Math.PI * 2 / perArm);
      const armAng = Math.floor(i / perArm) * (Math.PI * 2 / arms);
      const dist = Math.pow(i / phraseCount, 0.72) * radius;
      const thickness = Math.pow(1 - (dist / radius), 2);
      const x = Math.cos(ang + armAng) * dist,
            z = Math.sin(ang + armAng) * dist,
            y = (Math.random() - 0.5) * maxH * thickness * .9;
      spr.position.set(x, y, z); spr.scale.set(20, 2.6, 1); galaxy.add(spr);
    }

    const starCount = 8000, geom = new THREE.BufferGeometry(), pos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const ang = Math.random() * Math.PI * 2, dist = Math.random() * radius * 1.15;
      const y = (Math.random() - 0.5) * 36 * Math.pow(1 - Math.min(dist, radius) / radius, 1.5);
      pos[i * 3] = Math.cos(ang) * dist; pos[i * 3 + 1] = y; pos[i * 3 + 2] = Math.sin(ang) * dist;
    }
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    galaxy.add(new THREE.Points(geom, new THREE.PointsMaterial({
      color: 0xccaaff, size: 0.30, transparent: true, opacity: 0.70, blending: THREE.AdditiveBlending
    })));

    // ===================================================================
    // ====== URANO — planeta central =====================================
    // ===================================================================
    const coreR = 18;

    const sunLight = new THREE.DirectionalLight(0xb0d8ff, 1.0);
    sunLight.position.set(120, 60, 80); scene.add(sunLight);

    const ambLight = new THREE.AmbientLight(0x2a0a4a, 1.2); scene.add(ambLight);

    const fillLight = new THREE.DirectionalLight(0x1a2a6a, 0.4);
    fillLight.position.set(-80, -40, -60); scene.add(fillLight);

    const ringGlow = new THREE.PointLight(0x40e0d0, 0.5, 150);
    ringGlow.position.set(0, 0, 0); scene.add(ringGlow);

    function makeUranusTexture(size = 2048) {
      const c = document.createElement('canvas'); c.width = size; c.height = size / 2;
      const g = c.getContext('2d');

      const base = g.createLinearGradient(0, 0, 0, c.height);
      base.addColorStop(0.00, '#a0e0e8'); base.addColorStop(0.50, '#3aa8ba'); base.addColorStop(1.00, '#a0e0e8');
      g.fillStyle = base; g.fillRect(0, 0, c.width, c.height);

      for (let b = 0; b < 32; b++) {
        const yy = (b / 32) * c.height; const bh = c.height / 32;
        const alpha = 0.03 + Math.random() * 0.06;
        g.fillStyle = Math.random() > 0.5 ? `rgba(200,245,250,${alpha})` : `rgba(10,80,110,${alpha})`;
        g.fillRect(0, yy, c.width, bh + 1);
      }

      const eqGrad = g.createLinearGradient(0, c.height * 0.43, 0, c.height * 0.57);
      eqGrad.addColorStop(0, 'rgba(0,50,70,0)'); eqGrad.addColorStop(0.5, 'rgba(0,50,70,0.15)'); eqGrad.addColorStop(1, 'rgba(0,50,70,0)');
      g.fillStyle = eqGrad; g.fillRect(0, 0, c.width, c.height);

      const limbus = g.createRadialGradient(c.width/2, c.height/2, c.width * 0.26, c.width/2, c.height/2, c.width * 0.52);
      limbus.addColorStop(0, 'rgba(0,0,0,0)'); limbus.addColorStop(1, 'rgba(0,15,25,0.50)');
      g.fillStyle = limbus; g.fillRect(0, 0, c.width, c.height);

      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    }

    const uranusMat = new THREE.MeshPhongMaterial({
      map: makeUranusTexture(2048),
      specular: new THREE.Color(0x60c0d0), shininess: 60,
      emissive: new THREE.Color(0x082828), emissiveIntensity: 0.12,
    });

    const core = new THREE.Mesh(new THREE.SphereGeometry(coreR, 128, 64), uranusMat);
    core.rotation.z = THREE.MathUtils.degToRad(98);
    core.renderOrder = 1; scene.add(core);

    const atmoMat = new THREE.MeshPhongMaterial({
      color: 0x40c8d8, transparent: true, opacity: 0.08, side: THREE.FrontSide, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(coreR * 1.05, 64, 64), atmoMat));

    // ===== ANILLOS =====
    function makeRingTexture(size = 2048) {
      const c = document.createElement('canvas'); c.width = size; c.height = 32;
      const g = c.getContext('2d'); g.clearRect(0, 0, size, 32);
      for (let x = 0; x < size; x++) {
        if (Math.random() > 0.25) {
          const bright = 0.25 + Math.random() * 0.65; const alpha  = 0.50 + Math.random() * 0.50;
          const r  = Math.floor(170 + bright * 70); const gb = Math.floor(185 + bright * 65);
          g.fillStyle = `rgba(${r},${gb},${gb},${alpha})`; g.fillRect(x, 0, 1, 32);
        }
      }
      const tex = new THREE.CanvasTexture(c); tex.wrapS = THREE.RepeatWrapping; return tex;
    }

    const ringDefs = [
      [22.5, 22.95, 0x7090a0, 0.55], [23.2, 23.70, 0x7595a5, 0.55], [23.9, 24.35, 0x7595a5, 0.58],
      [24.6, 25.10, 0x80a0b0, 0.60], [25.4, 25.95, 0x82a2b2, 0.62], [26.1, 26.60, 0x88a8b8, 0.55],
      [26.9, 27.50, 0x8aaabc, 0.62], [27.8, 28.40, 0x90b0be, 0.60], [28.9, 29.30, 0x7090a0, 0.42],
      [30.2, 32.20, 0xd8eef5, 0.92], [34.5, 36.20, 0x5070a0, 0.38], [40.0, 43.50, 0x3a5068, 0.28],
    ];

    const ringTex = makeRingTexture(2048);
    const ringGroup = new THREE.Group();

    ringDefs.forEach(([r1, r2, col, opa]) => {
      const rGeo = new THREE.RingGeometry(r1, r2, 256, 1);
      const posAttr = rGeo.attributes.position; const uvAttr  = rGeo.attributes.uv;
      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i), z = posAttr.getZ(i);
        const rr = Math.sqrt(x * x + z * z); const angle = Math.atan2(z, x);
        uvAttr.setXY(i, (angle / (Math.PI * 2) + 0.5) * 10, (rr - r1) / (r2 - r1));
      }
      const rMat = new THREE.MeshBasicMaterial({ map: ringTex, color: col, transparent: true, opacity: opa, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
      const ring = new THREE.Mesh(rGeo, rMat); ring.rotation.x = Math.PI / 2; ringGroup.add(ring);
    });
    scene.add(ringGroup);

    function makeHaloTexture(size = 1024) {
      const c = document.createElement('canvas'); c.width = c.height = size;
      const g = c.getContext('2d'); const r = size / 2;
      const grd = g.createRadialGradient(r, r, r * 0.40, r, r, r);
      grd.addColorStop(0.00, 'rgba(80,200,220,0.25)'); grd.addColorStop(0.30, 'rgba(100,80,220,0.18)');
      grd.addColorStop(0.60, 'rgba(60,20,140,0.10)'); grd.addColorStop(1.00, 'rgba(0,0,0,0)');
      g.fillStyle = grd; g.fillRect(0, 0, size, size); return new THREE.CanvasTexture(c);
    }
    const haloPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(360, 360),
      new THREE.MeshBasicMaterial({ map: makeHaloTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.90 })
    );
    haloPlane.rotation.x = -Math.PI / 2; haloPlane.renderOrder = 0.2; scene.add(haloPlane);

    // ===================================================================
    // ====== LUNA ORBITANDO ==============================================
    // ===================================================================
    const moonGeo = new THREE.SphereGeometry(1.5, 32, 32);
    const moonMat = new THREE.MeshPhongMaterial({ color: 0xdddddd, emissive: 0x111122 });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    scene.add(moon);
    let moonAngle = 0;


    // ===================================================================
    // ====== INTERACCIÓN TÁCTIL (CORREGIDA) =============================
    // ===================================================================
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const planetModal = document.getElementById('planet-modal');
    const btnCloseModal = document.getElementById('close-modal');

    // Esfera invisible MÁS GRANDE para que sea facilísimo atinarle con el dedo
    const hitMesh = new THREE.Mesh(
      new THREE.SphereGeometry(25, 16, 16), 
      new THREE.MeshBasicMaterial({ visible: false })
    );
    scene.add(hitMesh);

    if (btnCloseModal) {
      btnCloseModal.addEventListener('click', () => {
        planetModal.classList.remove('visible');
      });
    }

    function checkPlanetClick(clientX, clientY) {
      mouse.x = (clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      
      const intersects = raycaster.intersectObject(hitMesh);
      if (intersects.length > 0) {
        if (planetModal) {
          planetModal.classList.add('visible');
        } else {
          console.warn('Falta el HTML del cuadro del planeta');
        }
      }
    }


    // ====== ANIMATION LOOP ======
    let tw = 0;
    function animate() {
      requestAnimationFrame(animate);
      const t = performance.now() * 0.001;
      tw = (tw + 0.0003) % 1;
      starTex.offset.set(tw, 0);
      galaxy.rotation.y = t * 0.05;
      core.rotation.y = t * 0.08;
      ringGroup.rotation.y = t * 0.006;
      haloPlane.rotation.z = t * 0.01;

      moonAngle += 0.006;
      moon.position.x = Math.cos(moonAngle) * 48;
      moon.position.z = Math.sin(moonAngle) * 48;
      moon.position.y = Math.sin(moonAngle * 2) * 3;

      controls.update();
      renderer.render(scene, camera);
    }
    animate();


    // ====== CORAZONES 2D ======
    const fx = document.getElementById('fx');
    const ctx2 = fx.getContext('2d');
    function resizeFx() {
      fx.width  = Math.floor(innerWidth  * Math.min(2, window.devicePixelRatio || 1));
      fx.height = Math.floor(innerHeight * Math.min(2, window.devicePixelRatio || 1));
      fx.style.width  = innerWidth  + 'px';
      fx.style.height = innerHeight + 'px';
    }
    addEventListener('resize', resizeFx); resizeFx();
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    const hearts = [];

    function spawnHearts(x, y, n = 20) {
      x *= DPR; y *= DPR;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        hearts.push({ x, y, vx: Math.cos(a)*(0.6+Math.random()*0.8), vy: -(0.8+Math.random()*1.2), life: 1, size: 10+Math.random()*16 });
      }
    }

    function drawHeart(x, y, size) {
      const s = size; ctx2.save(); ctx2.translate(x, y);
      ctx2.beginPath(); ctx2.moveTo(0, -0.25*s);
      ctx2.bezierCurveTo(.5*s, -.9*s, 1.4*s, -.1*s, 0, .9*s);
      ctx2.bezierCurveTo(-1.4*s, -.1*s, -.5*s, -.9*s, 0, -.25*s);
      const g = ctx2.createRadialGradient(0,0,0,0,0,s);
      g.addColorStop(0,'rgba(255,190,220,.95)'); g.addColorStop(1,'rgba(255,90,160,0)');
      ctx2.fillStyle = g; ctx2.fill(); ctx2.restore();
    }

  
    let startX = 0, startY = 0;
    let lastTap = 0;

    window.addEventListener('pointerdown', (e) => {
      startX = e.clientX;
      startY = e.clientY;
    });

    window.addEventListener('pointerup', (e) => {
      // Calculamos cuánto se movió el dedo xd
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Si se movió menos de 10 cuenta como toque sd
      if (dist < 10) {
        // 1. Revisar si tocó el planeta
        checkPlanetClick(e.clientX, e.clientY);

        // 2. Revisar si es doble toque para los corazones
        const now = performance.now();
        if (now - lastTap < 350) {
          spawnHearts(e.clientX, e.clientY, 20);
        }
        lastTap = now;
      }
    });

    function loopFx() {
      ctx2.clearRect(0, 0, fx.width, fx.height);
      for (let i = hearts.length-1; i >= 0; i--) {
        const h = hearts[i]; h.x += h.vx; h.y += h.vy; h.vy -= 0.02; h.life -= 0.015;
        ctx2.globalAlpha = Math.max(0, h.life); drawHeart(h.x, h.y, h.size);
        ctx2.globalAlpha = 1; if (h.life <= 0) hearts.splice(i, 1);
      }
      requestAnimationFrame(loopFx);
    }
    loopFx();

  } catch (e) { showError('Error cargando la galaxia: ' + e.message); console.error(e); }
})();
