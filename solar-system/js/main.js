import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PLANETS, PLANET_MAP } from './data.js';
import { centuriesSinceJ2000, planetPosition } from './orbital.js';
import { makePlanetTexture, makeSaturnRingTexture } from './textures.js';

const ATM_VERT = `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;
const ATM_FRAG = `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  uniform vec3 glowColor;
  void main() {
    float intensity = pow(max(0.0, 0.65 - dot(vNormal, vViewDir)), 3.0);
    gl_FragColor = vec4(glowColor, intensity * 0.85);
  }
`;

// ── Build nav dots ────────────────────────────────────────────────────────────
function buildNav() {
  const container = document.getElementById('nav-planets');
  const labels = [{ id: 'hero', label: 'Map', color: '#4466cc' }, ...PLANETS.map(p => ({ id: p.id, label: p.name, color: p.accentColor }))];
  labels.forEach(({ id, label, color }) => {
    const a = document.createElement('a');
    a.className = 'nav-dot';
    a.href = id === 'hero' ? '#hero' : `#${id}`;
    a.dataset.label = label;
    a.title = label;
    a.style.setProperty('--dot-color', color);
    container.appendChild(a);
  });
}

// ── Build planet sections ─────────────────────────────────────────────────────
function buildSections() {
  const container = document.getElementById('planet-sections');
  PLANETS.forEach((planet, i) => {
    const reverse = i % 2 === 1;
    const sec = document.createElement('section');
    sec.className = `planet-section${reverse ? ' reverse' : ''}`;
    sec.id = planet.id;
    sec.dataset.planet = planet.id;
    sec.style.cssText = `--accent: ${planet.accentColor}; --section-bg: ${planet.sectionBg};`;

    const stats = [
      { label: 'Radius', value: planet.radius },
      { label: 'Mass', value: planet.mass },
      { label: 'Gravity', value: planet.gravity },
      { label: 'Day Length', value: planet.dayLength },
      { label: 'Year Length', value: planet.yearLength },
      { label: 'Temperature', value: planet.temperature },
    ];

    sec.innerHTML = `
      <div class="planet-canvas-wrap">
        <canvas class="planet-canvas"></canvas>
      </div>
      <div class="planet-info">
        <span class="planet-number">0${planet.index + 1}</span>
        <span class="planet-tag">${planet.tag}</span>
        <h2 class="planet-name">${planet.name}</h2>
        <p class="planet-subtitle">${planet.subtitle}</p>
        <div class="planet-stats">
          ${stats.slice(0, 4).map(s => `
            <div class="stat">
              <span class="stat-label">${s.label}</span>
              <span class="stat-value">${s.value}</span>
            </div>`).join('')}
        </div>
        <a href="planet.html?id=${planet.id}" class="btn-learn">Learn More <span>→</span></a>
      </div>`;
    container.appendChild(sec);
  });
}

// ── Atmosphere mesh helper ────────────────────────────────────────────────────
function makeAtmosphere(glowColor, radius = 1.06) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius, 32, 32),
    new THREE.ShaderMaterial({
      uniforms: { glowColor: { value: new THREE.Vector3(...glowColor) } },
      vertexShader: ATM_VERT,
      fragmentShader: ATM_FRAG,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
      depthWrite: false,
    })
  );
}

// ── Saturn ring ───────────────────────────────────────────────────────────────
function makeSaturnRing() {
  const geo = new THREE.RingGeometry(1.4, 2.5, 128);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    uv.setXY(i, (v.length() - 1.4) / (2.5 - 1.4), 0);
  }
  const mat = new THREE.MeshBasicMaterial({
    map: makeSaturnRingTexture(),
    side: THREE.DoubleSide, transparent: true, opacity: 0.95,
  });
  const ring = new THREE.Mesh(geo, mat);
  ring.rotation.x = 1.15;
  return ring;
}

// ── Create planet scene ───────────────────────────────────────────────────────
function createPlanetScene(canvas, planet) {
  const wrap = canvas.parentElement;
  const w = wrap.clientWidth || 600;
  const h = wrap.clientHeight || 600;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 100);
  camera.position.z = planet.hasRings ? 5 : 3.2;

  scene.add(new THREE.AmbientLight(0x222244, 2));
  const sun = new THREE.DirectionalLight(0xffffff, planet.isStar ? 0 : 2.5);
  sun.position.set(-5, 2, 5);
  scene.add(sun);

  // Stars
  const starBuf = new THREE.BufferGeometry();
  const starPos = new Float32Array(3000 * 3);
  for (let i = 0; i < starPos.length; i++) starPos[i] = (Math.random() - 0.5) * 200;
  starBuf.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  scene.add(new THREE.Points(starBuf, new THREE.PointsMaterial({ color: 0xffffff, size: 0.08 })));

  // Planet sphere
  const geo = new THREE.SphereGeometry(1, 64, 64);
  const tex = makePlanetTexture(planet.id);
  let mat;
  if (planet.isStar) {
    mat = new THREE.MeshBasicMaterial({ map: tex });
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.3, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.08 })));
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.8, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.03 })));
  } else {
    mat = new THREE.MeshPhongMaterial({ map: tex, shininess: planet.id === 'earth' ? 20 : 6 });
  }

  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);

  // Atmosphere glow
  if (!planet.isStar) scene.add(makeAtmosphere(planet.glowColor));

  // Saturn rings
  if (planet.hasRings) scene.add(makeSaturnRing());

  // Earth cloud layer (white semi-transparent overlay)
  let clouds = null;
  if (planet.id === 'earth') {
    const cloudTex = makePlanetTexture('earth_clouds');
    clouds = new THREE.Mesh(
      new THREE.SphereGeometry(1.02, 64, 64),
      new THREE.MeshPhongMaterial({ map: cloudTex, transparent: true, opacity: 0.45, depthWrite: false })
    );
    scene.add(clouds);
  }

  let animId = null;
  function animate() {
    animId = requestAnimationFrame(animate);
    mesh.rotation.y += 0.0015;
    if (clouds) clouds.rotation.y += 0.002;
    renderer.render(scene, camera);
  }

  function resize() {
    const nw = wrap.clientWidth, nh = wrap.clientHeight;
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
    renderer.setSize(nw, nh);
  }

  window.addEventListener('resize', resize);

  return {
    start() { if (!animId) animate(); },
    stop() { cancelAnimationFrame(animId); animId = null; },
    dispose() { renderer.dispose(); },
  };
}

// ── Solar System Map ──────────────────────────────────────────────────────────
function initSolarMap() {
  const canvas = document.getElementById('solar-map');
  const hero = document.getElementById('hero');
  const tooltip = document.getElementById('planet-tooltip');
  const W = hero.clientWidth, H = hero.clientHeight;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.setClearColor(0x050510);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 2000);
  camera.position.set(0, 55, 0);
  camera.lookAt(0, 0, 0);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 15;
  controls.maxDistance = 120;
  controls.maxPolarAngle = Math.PI * 0.48;

  // Stars
  const starBuf = new THREE.BufferGeometry();
  const sp = new Float32Array(8000 * 3);
  for (let i = 0; i < sp.length; i++) sp[i] = (Math.random() - 0.5) * 1200;
  starBuf.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  scene.add(new THREE.Points(starBuf, new THREE.PointsMaterial({ color: 0xffffff, size: 0.15 })));

  // Sun
  const sunMesh = new THREE.Mesh(
    new THREE.SphereGeometry(2, 32, 32),
    new THREE.MeshBasicMaterial({ map: makePlanetTexture('sun') })
  );
  scene.add(sunMesh);
  // Sun glow rings
  [3.5, 5].forEach((r, i) => {
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(r, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: i === 0 ? 0.06 : 0.025 })
    ));
  });

  const T = centuriesSinceJ2000();
  const SCALE = 5.5;
  const planetMeshes = [];

  // Orbital scale: compress outer planets for visual balance
  const orbitScale = (a) => {
    if (a < 2) return a * SCALE;
    return (2 * SCALE) + Math.pow(a - 2, 0.72) * SCALE * 1.3;
  };

  PLANETS.filter(p => !p.isStar && p.orbital).forEach(planet => {
    const scaledA = orbitScale(planet.orbital.a);
    const e = planet.orbital.e;
    const b = scaledA * Math.sqrt(1 - e * e);

    // Orbit ellipse
    const pts = [];
    for (let deg = 0; deg <= 360; deg += 2) {
      const t = deg * Math.PI / 180;
      pts.push(new THREE.Vector3(scaledA * Math.cos(t), 0, b * Math.sin(t)));
    }
    const orbitLine = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: 0x223355, transparent: true, opacity: 0.6 })
    );
    scene.add(orbitLine);

    // Current position
    const pos = planetPosition(planet.orbital, T);
    const dist = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
    const angle = Math.atan2(pos.y, pos.x);
    const sx = orbitScale(dist) * Math.cos(angle);
    const sz = -orbitScale(dist) * Math.sin(angle);

    // Planet dot size
    const sizes = { mercury: 0.18, venus: 0.28, earth: 0.3, mars: 0.22, jupiter: 0.55, saturn: 0.48, uranus: 0.36, neptune: 0.34 };
    const radius = sizes[planet.id] || 0.25;

    const pMesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 16, 16),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(planet.color) })
    );
    pMesh.position.set(sx, 0, sz);
    pMesh.userData.planet = planet;
    scene.add(pMesh);
    planetMeshes.push(pMesh);

    // Glow halo
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 2.2, 16, 16),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(planet.color), transparent: true, opacity: 0.08 })
    );
    halo.position.copy(pMesh.position);
    scene.add(halo);

    // Saturn map ring
    if (planet.hasRings) {
      const rg = new THREE.RingGeometry(radius * 1.6, radius * 2.8, 64);
      const rm = new THREE.MeshBasicMaterial({ color: 0xc8a060, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(rg, rm);
      ring.position.copy(pMesh.position);
      ring.rotation.x = Math.PI / 2;
      scene.add(ring);
    }
  });

  // Raycaster for hover + click
  const raycaster = new THREE.Raycaster();
  raycaster.params.Points.threshold = 0.5;
  const mouse = new THREE.Vector2();

  function updateTooltip(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(planetMeshes);
    if (hits.length) {
      const p = hits[0].object.userData.planet;
      tooltip.textContent = p.name;
      tooltip.style.left = (e.clientX + 14) + 'px';
      tooltip.style.top = (e.clientY - 10) + 'px';
      tooltip.classList.remove('hidden');
      canvas.style.cursor = 'pointer';
    } else {
      tooltip.classList.add('hidden');
      canvas.style.cursor = 'default';
    }
  }

  canvas.addEventListener('mousemove', updateTooltip);
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(planetMeshes);
    if (hits.length) {
      const p = hits[0].object.userData.planet;
      document.getElementById(p.id)?.scrollIntoView({ behavior: 'smooth' });
    }
  });

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    sunMesh.rotation.y += 0.001;
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    const nw = hero.clientWidth, nh = hero.clientHeight;
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
    renderer.setSize(nw, nh);
  });
}

// ── Intersection observers ────────────────────────────────────────────────────
function setupObservers() {
  const scenes = new Map();

  // Lazy-init planet 3D scenes
  const sceneObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = entry.target.dataset.planet;
      if (entry.isIntersecting && !scenes.has(id)) {
        const canvas = entry.target.querySelector('.planet-canvas');
        if (!canvas) return;
        const planet = PLANET_MAP[id];
        if (!planet) return;
        const s = createPlanetScene(canvas, planet);
        scenes.set(id, s);
        s.start();
      }
    });
  }, { threshold: 0.05 });

  // Animate info panels in
  const infoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.15 });

  // Animate stat chips in with stagger
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.stat').forEach((s, i) => {
          setTimeout(() => s.classList.add('visible'), i * 100);
        });
      }
    });
  }, { threshold: 0.2 });

  // Nav dot active state
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        document.querySelectorAll('.nav-dot').forEach(d => d.classList.remove('active'));
        const dot = document.querySelector(`.nav-dot[href="#${entry.target.id}"]`);
        if (dot) dot.classList.add('active');
      }
    });
  }, { threshold: 0.4 });

  document.querySelectorAll('.planet-section').forEach(sec => {
    sceneObserver.observe(sec);
    infoObserver.observe(sec.querySelector('.planet-info'));
    statObserver.observe(sec.querySelector('.planet-stats'));
    sectionObserver.observe(sec);
  });

  // Hero nav dot active
  const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        document.querySelectorAll('.nav-dot').forEach(d => d.classList.remove('active'));
        document.querySelector('.nav-dot[href="#hero"]')?.classList.add('active');
      }
    });
  }, { threshold: 0.5 });
  const hero = document.getElementById('hero');
  if (hero) heroObserver.observe(hero);
}

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildNav();
  buildSections();
  initSolarMap();
  setupObservers();
});
