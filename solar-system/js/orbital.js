const J2000 = 2451545.0;
const TO_RAD = Math.PI / 180;

export function julianDate(date = new Date()) {
  let y = date.getUTCFullYear();
  let m = date.getUTCMonth() + 1;
  const d = date.getUTCDate() + (date.getUTCHours() + date.getUTCMinutes() / 60) / 24;
  if (m <= 2) { y--; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}

export function centuriesSinceJ2000(date = new Date()) {
  return (julianDate(date) - J2000) / 36525;
}

function solveKepler(M, e) {
  let E = M;
  for (let i = 0; i < 50; i++) {
    const dE = (M - E + e * Math.sin(E)) / (1 - e * Math.cos(E));
    E += dE;
    if (Math.abs(dE) < 1e-8) break;
  }
  return E;
}

function mod360(x) {
  return ((x % 360) + 360) % 360;
}

export function planetPosition(orbital, T) {
  const a = orbital.a + orbital.da * T;
  const e = orbital.e + orbital.de * T;
  const I = (orbital.I + orbital.dI * T) * TO_RAD;
  const L = mod360(orbital.L + orbital.dL * T) * TO_RAD;
  const lPeri = (orbital.lPeri + orbital.dlPeri * T) * TO_RAD;
  const lNode = (orbital.lNode + orbital.dlNode * T) * TO_RAD;

  const omega = lPeri - lNode;
  let M = L - lPeri;
  M = ((M * 180 / Math.PI % 360) + 360) % 360 * TO_RAD;

  const E = solveKepler(M, e);

  const xOrb = a * (Math.cos(E) - e);
  const yOrb = a * Math.sqrt(1 - e * e) * Math.sin(E);

  const cosO = Math.cos(lNode), sinO = Math.sin(lNode);
  const cosI = Math.cos(I), sinI = Math.sin(I);
  const cosw = Math.cos(omega), sinw = Math.sin(omega);

  const x = (cosO * cosw - sinO * sinw * cosI) * xOrb + (-cosO * sinw - sinO * cosw * cosI) * yOrb;
  const y = (sinO * cosw + cosO * sinw * cosI) * xOrb + (-sinO * sinw + cosO * cosw * cosI) * yOrb;

  return { x, y };
}
