import * as THREE from 'three';

function ctx2d(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function noise(x, y, scale = 1) {
  return Math.sin(x * scale * 17.3 + y * scale * 31.7) *
         Math.cos(y * scale * 13.1 + x * scale * 19.9) * 0.5 + 0.5;
}

export function makePlanetTexture(id) {
  const W = 512, H = 256;
  const [canvas, ctx] = ctx2d(W, H);

  if (id === 'sun') {
    const grd = ctx.createRadialGradient(W/2, H/2, 10, W/2, H/2, W * 0.7);
    grd.addColorStop(0,   '#FFFF88');
    grd.addColorStop(0.2, '#FFD800');
    grd.addColorStop(0.5, '#FFA500');
    grd.addColorStop(0.8, '#FF6600');
    grd.addColorStop(1,   '#CC3300');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
    // granulation
    for (let i = 0; i < 8000; i++) {
      const x = Math.random() * W, y = Math.random() * H;
      const r = Math.random() * 4;
      ctx.fillStyle = Math.random() > 0.5
        ? `rgba(255,220,0,${Math.random() * 0.3})`
        : `rgba(180,60,0,${Math.random() * 0.25})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }

  } else if (id === 'mercury' || id === 'moon') {
    const base = id === 'mercury' ? '#9B9B9B' : '#888888';
    const dark = id === 'mercury' ? '#555555' : '#4a4a4a';
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, W, H);
    // large maria patches
    for (let i = 0; i < 8; i++) {
      const x = Math.random()*W, y = Math.random()*H;
      const rx = 30+Math.random()*60, ry = 20+Math.random()*40;
      ctx.fillStyle = `rgba(60,60,60,${0.15+Math.random()*0.2})`;
      ctx.beginPath(); ctx.ellipse(x,y,rx,ry,Math.random()*Math.PI,0,Math.PI*2); ctx.fill();
    }
    // craters
    for (let i = 0; i < 400; i++) {
      const x = Math.random()*W, y = Math.random()*H;
      const r = Math.random()*10+1;
      ctx.fillStyle = `rgba(40,40,40,${0.15+Math.random()*0.4})`;
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = `rgba(200,200,200,${0.1+Math.random()*0.2})`;
      ctx.beginPath(); ctx.arc(x-r*.3,y-r*.3,r*.4,0,Math.PI*2); ctx.fill();
    }

  } else if (id === 'venus') {
    const grd = ctx.createLinearGradient(0,0,0,H);
    grd.addColorStop(0,   '#C09038');
    grd.addColorStop(0.3, '#D4B860');
    grd.addColorStop(0.6, '#C09040');
    grd.addColorStop(1,   '#A87830');
    ctx.fillStyle = grd; ctx.fillRect(0,0,W,H);
    for (let i = 0; i < 25; i++) {
      const x = Math.random()*W, y = Math.random()*H;
      const rx = 40+Math.random()*100, ry = 8+Math.random()*18;
      ctx.fillStyle = `rgba(255,230,140,${0.08+Math.random()*0.18})`;
      ctx.beginPath(); ctx.ellipse(x,y,rx,ry,Math.random()*Math.PI,0,Math.PI*2); ctx.fill();
    }

  } else if (id === 'earth') {
    // Ocean
    ctx.fillStyle = '#1a6e8e'; ctx.fillRect(0,0,W,H);
    // Land masses (simplified continents) — all rx/ry must be > 0
    const land = [
      // [x, y, rx, ry, rotation]
      [85,  58,  44, 52, 0.1],   // N America main
      [68,  80,  18, 32, 0.3],   // N America west
      [255, 72,  22, 72, 0.1],   // Europe
      [265, 155, 18, 55, 0.0],   // Africa
      [345, 62,  68, 50, -0.1],  // Asia
      [420, 78,  25, 35, 0.2],   // SE Asia / Indonesia
      [130, 158, 22, 55, 0.1],   // S America
      [392, 178, 28, 22, 0.2],   // Australia
      [470, 160, 18, 14, 0.1],   // New Zealand area
    ];
    ctx.fillStyle = '#3a7a3a';
    land.forEach(([x, y, rx, ry, a]) => {
      ctx.beginPath(); ctx.ellipse(x, y, rx, ry, a, 0, Math.PI * 2); ctx.fill();
    });
    // Extra land detail
    ctx.fillStyle = '#4a8a4a';
    for (let i=0; i<30; i++) {
      const x=Math.random()*W, y=20+Math.random()*(H-40);
      ctx.beginPath(); ctx.ellipse(x,y,5+Math.random()*20,3+Math.random()*12,Math.random()*Math.PI,0,Math.PI*2); ctx.fill();
    }
    // Polar caps
    ctx.fillStyle = '#ddeeff';
    ctx.beginPath(); ctx.ellipse(256,0,256,22,0,0,Math.PI); ctx.fill();
    ctx.fillRect(0,238,W,18);
    // Clouds
    for (let i=0; i<20; i++) {
      const x=Math.random()*W, y=Math.random()*H;
      ctx.fillStyle = `rgba(255,255,255,${0.2+Math.random()*0.25})`;
      ctx.beginPath(); ctx.ellipse(x,y,25+Math.random()*70,5+Math.random()*12,Math.random()*Math.PI,0,Math.PI*2); ctx.fill();
    }

  } else if (id === 'mars') {
    ctx.fillStyle = '#A0522D'; ctx.fillRect(0,0,W,H);
    for (let i=0; i<250; i++) {
      const x=Math.random()*W, y=Math.random()*H, r=Math.random()*18+2;
      const d = Math.random()>.5;
      ctx.fillStyle = d?`rgba(70,25,8,${0.1+Math.random()*.35})`:`rgba(170,90,50,${0.1+Math.random()*.25})`;
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
    }
    // Polar caps
    ctx.fillStyle='rgba(255,248,248,0.85)';
    ctx.beginPath(); ctx.ellipse(256,6,90,12,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(256,249,55,8,0,0,Math.PI*2); ctx.fill();
    // Valles Marineris hint
    ctx.strokeStyle='rgba(60,20,10,0.35)'; ctx.lineWidth=10;
    ctx.beginPath(); ctx.moveTo(140,128); ctx.bezierCurveTo(200,133,300,126,370,130); ctx.stroke();

  } else if (id === 'jupiter') {
    const bands = [
      [0,20,'#7B5914'],[20,16,'#C8A95A'],[36,10,'#9A6820'],
      [46,20,'#D4B870'],[66,9,'#7B4510'],[75,15,'#C8A050'],
      [90,10,'#907030'],[100,20,'#D4B870'],[120,14,'#7B5820'],
      [134,20,'#C09040'],[154,15,'#D4A850'],[169,10,'#907030'],
      [179,14,'#C8A050'],[193,20,'#7B4510'],[213,14,'#C8A95A'],[227,29,'#7B5914'],
    ];
    bands.forEach(([y,h,c])=>{ ctx.fillStyle=c; ctx.fillRect(0,y,W,h); });
    // Great Red Spot
    ctx.fillStyle='#CD5C5C';
    ctx.beginPath(); ctx.ellipse(185,156,38,24,0.12,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#A03030';
    ctx.beginPath(); ctx.ellipse(185,156,22,13,0.12,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(220,120,100,0.4)';
    ctx.beginPath(); ctx.ellipse(185,156,12,6,0.12,0,Math.PI*2); ctx.fill();
    // Belt turbulence
    for (let i=0; i<40; i++) {
      const x=Math.random()*W, y=Math.random()*H;
      ctx.fillStyle=`rgba(120,70,10,${0.05+Math.random()*.12})`;
      ctx.beginPath(); ctx.ellipse(x,y,12+Math.random()*35,3+Math.random()*6,Math.random()*.3,0,Math.PI*2); ctx.fill();
    }

  } else if (id === 'saturn') {
    const bands = [
      [0,28,'#C8B070'],[28,18,'#D4C080'],[46,14,'#B89858'],
      [60,22,'#D0B870'],[82,18,'#C0A060'],[100,24,'#D4BE78'],
      [124,18,'#B89858'],[142,28,'#CEB870'],[170,19,'#B89050'],
      [189,24,'#D4C080'],[213,43,'#C0A868'],
    ];
    bands.forEach(([y,h,c])=>{ ctx.fillStyle=c; ctx.fillRect(0,y,W,h); });
    // Subtle turbulence
    for (let i=0; i<20; i++) {
      const x=Math.random()*W, y=Math.random()*H;
      ctx.fillStyle=`rgba(180,140,60,${0.04+Math.random()*.08})`;
      ctx.beginPath(); ctx.ellipse(x,y,20+Math.random()*60,4+Math.random()*8,0,0,Math.PI*2); ctx.fill();
    }

  } else if (id === 'uranus') {
    const grd = ctx.createLinearGradient(0,0,0,H);
    grd.addColorStop(0,'#5BBCBC'); grd.addColorStop(0.4,'#7DE8E8');
    grd.addColorStop(0.7,'#5CCCCC'); grd.addColorStop(1,'#3AAEAE');
    ctx.fillStyle=grd; ctx.fillRect(0,0,W,H);
    for (let y=0; y<H; y+=18) {
      ctx.fillStyle=`rgba(0,0,0,${0.02+Math.random()*.04})`; ctx.fillRect(0,y,W,6);
    }

  } else if (id === 'neptune') {
    const grd = ctx.createLinearGradient(0,0,0,H);
    grd.addColorStop(0,'#1A3A9E'); grd.addColorStop(0.35,'#2B4FC0');
    grd.addColorStop(0.65,'#1A3A9E'); grd.addColorStop(1,'#122880');
    ctx.fillStyle=grd; ctx.fillRect(0,0,W,H);
    for (let i=0; i<12; i++) {
      const y=Math.random()*H;
      ctx.fillStyle=`rgba(40,70,180,${0.1+Math.random()*.15})`; ctx.fillRect(0,y,W,6+Math.random()*14);
    }
    ctx.fillStyle='rgba(10,20,80,0.35)';
    ctx.beginPath(); ctx.ellipse(185,115,32,20,0.2,0,Math.PI*2); ctx.fill();

  } else if (id === 'earth_clouds') {
    ctx.clearRect(0,0,W,H);
    for (let i=0; i<35; i++) {
      const x=Math.random()*W, y=Math.random()*H;
      const rx=30+Math.random()*90, ry=8+Math.random()*20;
      ctx.fillStyle=`rgba(255,255,255,${0.3+Math.random()*0.4})`;
      ctx.beginPath(); ctx.ellipse(x,y,rx,ry,Math.random()*Math.PI,0,Math.PI*2); ctx.fill();
    }
  } else {
    ctx.fillStyle = '#888'; ctx.fillRect(0,0,W,H);
  }

  return new THREE.CanvasTexture(canvas);
}

export function makeSaturnRingTexture() {
  const [canvas, ctx] = ctx2d(256, 1);
  const grd = ctx.createLinearGradient(0,0,256,0);
  grd.addColorStop(0,    'rgba(170,140,90,0.05)');  // C ring
  grd.addColorStop(0.18, 'rgba(190,155,100,0.55)');
  grd.addColorStop(0.35, 'rgba(210,175,120,0.92)'); // B ring bright
  grd.addColorStop(0.50, 'rgba(200,165,110,0.85)');
  grd.addColorStop(0.54, 'rgba(10,10,10,0.08)');    // Cassini division
  grd.addColorStop(0.58, 'rgba(190,160,105,0.72)'); // A ring
  grd.addColorStop(0.75, 'rgba(175,145,95,0.50)');
  grd.addColorStop(0.88, 'rgba(155,125,80,0.25)');
  grd.addColorStop(1,    'rgba(140,110,70,0.0)');
  ctx.fillStyle = grd; ctx.fillRect(0,0,256,1);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  return tex;
}
