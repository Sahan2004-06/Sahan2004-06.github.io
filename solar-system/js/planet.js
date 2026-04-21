import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PLANETS, PLANET_MAP } from './data.js';
import { makePlanetTexture, makeSaturnRingTexture } from './textures.js';

const ATM_VERT = `
  varying vec3 vNormal; varying vec3 vViewDir;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;
const ATM_FRAG = `
  varying vec3 vNormal; varying vec3 vViewDir;
  uniform vec3 glowColor;
  void main() {
    float intensity = pow(max(0.0, 0.65 - dot(vNormal, vViewDir)), 3.0);
    gl_FragColor = vec4(glowColor, intensity * 0.9);
  }
`;

function makeAtmosphere(glowColor, r = 1.07) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(r, 32, 32),
    new THREE.ShaderMaterial({
      uniforms: { glowColor: { value: new THREE.Vector3(...glowColor) } },
      vertexShader: ATM_VERT, fragmentShader: ATM_FRAG,
      transparent: true, blending: THREE.AdditiveBlending,
      side: THREE.FrontSide, depthWrite: false,
    })
  );
}

function makeSaturnRing() {
  const geo = new THREE.RingGeometry(1.4, 2.6, 128);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    uv.setXY(i, (v.length() - 1.4) / (2.6 - 1.4), 0);
  }
  const ring = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    map: makeSaturnRingTexture(), side: THREE.DoubleSide, transparent: true, opacity: 0.95,
  }));
  ring.rotation.x = 1.1;
  return ring;
}

function initDetailScene(planet) {
  const wrap = document.getElementById('detail-canvas-wrap');
  const canvas = document.getElementById('detail-canvas');
  const W = wrap.clientWidth, H = wrap.clientHeight;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, W / H, 0.1, 1000);
  camera.position.z = planet.hasRings ? 6 : 3.8;

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.6;
  controls.enableZoom = false;

  scene.add(new THREE.AmbientLight(0x222244, 2));
  const sunLight = new THREE.DirectionalLight(0xffffff, planet.isStar ? 0 : 3);
  sunLight.position.set(-6, 2, 5);
  scene.add(sunLight);

  // Stars
  const sp = new Float32Array(5000 * 3);
  for (let i = 0; i < sp.length; i++) sp[i] = (Math.random() - 0.5) * 500;
  const starBuf = new THREE.BufferGeometry();
  starBuf.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  scene.add(new THREE.Points(starBuf, new THREE.PointsMaterial({ color: 0xffffff, size: 0.08 })));

  const geo = new THREE.SphereGeometry(1, 128, 128);
  const tex = makePlanetTexture(planet.id);
  let mat;
  if (planet.isStar) {
    mat = new THREE.MeshBasicMaterial({ map: tex });
    [1.4, 1.9].forEach((r, i) => {
      scene.add(new THREE.Mesh(
        new THREE.SphereGeometry(r, 32, 32),
        new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: i === 0 ? 0.07 : 0.03 })
      ));
    });
  } else {
    mat = new THREE.MeshPhongMaterial({ map: tex, shininess: planet.id === 'earth' ? 20 : 8 });
  }

  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);

  if (!planet.isStar) scene.add(makeAtmosphere(planet.glowColor, planet.hasRings ? 1.05 : 1.08));
  if (planet.hasRings) scene.add(makeSaturnRing());

  let clouds = null;
  if (planet.id === 'earth') {
    clouds = new THREE.Mesh(
      new THREE.SphereGeometry(1.025, 64, 64),
      new THREE.MeshPhongMaterial({
        map: makePlanetTexture('earth_clouds'),
        transparent: true, opacity: 0.4, depthWrite: false,
      })
    );
    scene.add(clouds);
  }

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    mesh.rotation.y += 0.0008;
    if (clouds) clouds.rotation.y += 0.0012;
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    const nw = wrap.clientWidth, nh = wrap.clientHeight;
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
    renderer.setSize(nw, nh);
  });
}

function buildDetailPage(planet) {
  document.title = `${planet.name} — Solar System Explorer`;
  document.documentElement.style.setProperty('--accent', planet.accentColor);

  const stats = [
    { label: 'Radius', value: planet.radius },
    { label: 'Mass', value: planet.mass },
    { label: 'Gravity', value: planet.gravity },
    { label: 'Temperature', value: planet.temperature },
    { label: 'Day Length', value: planet.dayLength },
    { label: 'Year / Orbit', value: planet.yearLength },
    { label: 'Distance from Sun', value: planet.distanceFromSun },
    { label: 'Moons', value: planet.moons.length > 0 ? `${planet.moons.length} known` : 'None' },
  ];

  document.getElementById('detail-tag').textContent = planet.tag;
  document.getElementById('detail-name').textContent = planet.name;
  document.getElementById('detail-subtitle').textContent = planet.subtitle;
  document.getElementById('detail-desc').textContent = planet.description;
  document.getElementById('detail-atmo-value').textContent = planet.atmosphere;

  const statsEl = document.getElementById('detail-stats');
  statsEl.innerHTML = stats.map(s => `
    <div class="detail-stat">
      <span class="detail-stat-label">${s.label}</span>
      <span class="detail-stat-value">${s.value}</span>
    </div>`).join('');

  // Moons
  const moonsSection = document.getElementById('moons-section');
  if (planet.moons.length === 0) {
    moonsSection.style.display = 'none';
  } else {
    document.getElementById('moon-count').textContent = planet.moons.length;
    const grid = document.getElementById('moons-grid');
    grid.innerHTML = planet.moons.map(m => `
      <div class="moon-card">
        <div class="moon-ball" style="background: radial-gradient(circle at 35% 35%, ${m.color}cc, ${m.color}44)"></div>
        <div class="moon-name">${m.name}</div>
        <div class="moon-stat">Radius: <span>${m.radius}</span></div>
        <div class="moon-stat">Orbit: <span>${m.distance}</span></div>
        <div class="moon-stat">Period: <span>${m.period}</span></div>
        <div class="moon-stat">Discovered: <span>${m.discovery}</span></div>
        <div class="moon-desc">${m.description}</div>
      </div>`).join('');
  }

  // Facts
  const factsList = document.getElementById('facts-list');
  factsList.innerHTML = planet.facts.map((f, i) => `
    <div class="fact-item">
      <span class="fact-num">0${i + 1}</span>
      <span class="fact-text">${f}</span>
    </div>`).join('');

  // Prev / Next navigation
  const idx = PLANETS.findIndex(p => p.id === planet.id);
  const prev = PLANETS[idx - 1];
  const next = PLANETS[idx + 1];
  const navEl = document.getElementById('planet-nav');
  navEl.innerHTML = `
    ${prev ? `<a class="planet-nav-btn" href="planet.html?id=${prev.id}">← <span class="nav-planet-name">${prev.name}</span></a>` : '<span></span>'}
    <a class="planet-nav-btn" href="index.html">↑ Solar System</a>
    ${next ? `<a class="planet-nav-btn" href="planet.html?id=${next.id}"><span class="nav-planet-name">${next.name}</span> →</a>` : '<span></span>'}
  `;
}

// Boot
document.addEventListener('DOMContentLoaded', () => {
  const id = new URLSearchParams(window.location.search).get('id') || 'earth';
  const planet = PLANET_MAP[id];
  if (!planet) { window.location.href = 'index.html'; return; }
  buildDetailPage(planet);
  initDetailScene(planet);
});
