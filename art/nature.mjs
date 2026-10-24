// The valley: bamboo, leaves, bushes, mountains, trees, lanterns, stars.
import { C, part, stroke, band, blob, ellipse, n } from './lib.mjs';

// A pointed leaf from (x, y), pointing at angle a (degrees), length len.
export function leaf(x, y, len, a, fill = C.sage, o = {}) {
  const r = (a * Math.PI) / 180;
  const w = len * (o.w ?? 0.28);
  const tx = x + Math.cos(r) * len;
  const ty = y + Math.sin(r) * len;
  const nx = -Math.sin(r) * w;
  const ny = Math.cos(r) * w;
  const mx = x + Math.cos(r) * len * 0.45;
  const my = y + Math.sin(r) * len * 0.45;
  const d = `M ${n(x)} ${n(y)} Q ${n(mx + nx)} ${n(my + ny)} ${n(tx)} ${n(ty)} Q ${n(mx - nx)} ${n(my - ny)} ${n(x)} ${n(y)} Z`;
  return part(d, fill, { lw: o.lw ?? 2.4 }) + (o.vein === false ? '' : stroke(`M ${n(x)} ${n(y)} L ${n(x + (tx - x) * 0.8)} ${n(y + (ty - y) * 0.8)}`, { lw: 1.4, opacity: 0.5 }));
}

// A bamboo stalk from the ground (x, base) up to top, gently leaning.
export function bamboo(x, base, top, rand, o = {}) {
  const { width = 22, lean = 0, leaves = true, color = C.sage } = o;
  const h = base - top;
  const d = `M ${n(x)} ${n(base)} C ${n(x + lean * 0.2)} ${n(base - h * 0.4)} ${n(x + lean * 0.7)} ${n(base - h * 0.7)} ${n(x + lean)} ${n(top)}`;
  let s = band(d, color, width, { cap: 'butt', lw: 2.6 });
  const nodes = Math.max(2, Math.round(h / 110));
  const at = (t) => {
    // the cubic above, evaluated at t
    const p0 = [x, base];
    const p1 = [x + lean * 0.2, base - h * 0.4];
    const p2 = [x + lean * 0.7, base - h * 0.7];
    const p3 = [x + lean, top];
    const u = 1 - t;
    return [0, 1].map((i) => u * u * u * p0[i] + 3 * u * u * t * p1[i] + 3 * u * t * t * p2[i] + t * t * t * p3[i]);
  };
  let foliage = '';
  for (let i = 1; i <= nodes; i++) {
    const [nx, ny] = at(i / (nodes + 0.4));
    s += stroke(`M ${n(nx - width / 2 - 1)} ${n(ny + 2)} Q ${n(nx)} ${n(ny - 3)} ${n(nx + width / 2 + 1)} ${n(ny + 2)}`, { lw: 2.6, color: C.mossDeep });
    if (leaves && i > nodes / 3) {
      const side = rand() > 0.5 ? 1 : -1;
      const base = side > 0 ? -20 : -160;
      const count = 2 + Math.floor(rand() * 2);
      for (let k = 0; k < count; k++) {
        const ang = base + (rand() - 0.5) * 40 + k * 18 * side;
        foliage += leaf(nx + (side * width) / 2, ny, 42 + rand() * 26, ang, rand() > 0.4 ? C.sage : C.moss);
      }
    }
  }
  return s + foliage;
}

// A rhododendron bush: soft green mounds with dusty-rose bloom clusters.
export function bush(x, y, size, rand, o = {}) {
  const { blooms = true } = o;
  let s = '';
  const mounds = [
    [-0.55, -0.15, 0.55, 0.42],
    [0.5, -0.12, 0.55, 0.44],
    [0, -0.42, 0.62, 0.5],
    [0, 0, 0.9, 0.4],
  ];
  for (const [dx, dy, rx, ry] of mounds) {
    s += blob(x + dx * size, y + dy * size, rx * size, ry * size, rand() > 0.5 ? C.moss : C.mossDeep, { lw: 2.6 });
  }
  for (let i = 0; i < 9; i++) {
    const lx = x + (rand() - 0.5) * size * 1.5;
    const ly = y - rand() * size * 0.7;
    s += leaf(lx, ly, size * 0.28, -150 + rand() * 120, C.sage, { vein: false, lw: 2 });
  }
  if (blooms) {
    const clusters = 3 + Math.floor(rand() * 3);
    for (let i = 0; i < clusters; i++) {
      const bx = x + (rand() - 0.5) * size * 1.3;
      const by = y - size * 0.15 - rand() * size * 0.55;
      s += flowerCluster(bx, by, size * 0.18, rand);
    }
  }
  return s;
}

export function flowerCluster(x, y, r, rand) {
  let s = '';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + rand();
    s += blob(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.45, r * 0.5, r * 0.45, i % 2 ? C.rose : C.roseDeep, { lw: 1.8 });
  }
  s += blob(x, y, r * 0.22, r * 0.22, C.gold, { line: false });
  return s;
}

// A row of misty mountains between y and base, across width w.
export function mountains(w, y, base, rand, o = {}) {
  const { color = C.mist, peaks = 5, snow = true, line = true } = o;
  let d = `M -40 ${base + 40} L -40 ${n(y + 80)} L 0 ${n(y + 80)}`;
  const tops = [];
  const step = w / peaks;
  for (let i = 0; i < peaks; i++) {
    const px = step * (i + 0.3 + rand() * 0.4);
    const py = y + rand() * 90;
    const vx = step * (i + 1);
    const vy = y + 120 + rand() * 80;
    tops.push([px, py]);
    d += ` Q ${n(px - step * 0.25)} ${n(py + 10)} ${n(px)} ${n(py)} Q ${n(px + step * 0.25)} ${n(py + 10)} ${n(vx)} ${n(vy)}`;
  }
  d += ` L ${w + 40} ${n(y + 200)} L ${w + 40} ${base + 40} Z`;
  let s = part(d, color, { line, lw: 2.4 });
  if (snow) {
    for (const [px, py] of tops) {
      const sd = `M ${n(px - 38)} ${n(py + 34)} Q ${n(px - 20)} ${n(py + 6)} ${n(px)} ${n(py)} Q ${n(px + 20)} ${n(py + 6)} ${n(px + 38)} ${n(py + 34)} Q ${n(px + 18)} ${n(py + 24)} ${n(px + 8)} ${n(py + 38)} Q ${n(px - 6)} ${n(py + 22)} ${n(px - 18)} ${n(py + 36)} Q ${n(px - 26)} ${n(py + 26)} ${n(px - 38)} ${n(py + 34)} Z`;
      s += part(sd, C.cream, { line: false, opacity: 0.85 });
    }
  }
  return s;
}

// A rolling hill line from the left edge to the right, filled down to base.
export function hill(w, ys, base, fill, o = {}) {
  const step = w / (ys.length - 1);
  let d = `M -40 ${base + 40} L -40 ${n(ys[0])} L 0 ${n(ys[0])}`;
  for (let i = 1; i < ys.length; i++) {
    const x0 = step * (i - 1);
    const x1 = step * i;
    d += ` C ${n(x0 + step * 0.5)} ${n(ys[i - 1])} ${n(x1 - step * 0.5)} ${n(ys[i])} ${n(x1)} ${n(ys[i])}`;
  }
  d += ` L ${w + 40} ${n(ys[ys.length - 1])} L ${w + 40} ${base + 40} Z`;
  if (o.flat) return `<path d="${d}" fill="${fill}"/>`;
  return part(d, fill, { lw: 2.6, ...o });
}

// Grass tufts along a line.
export function grass(x0, x1, y, rand, count = 20, color = C.mossDeep) {
  let d = '';
  for (let i = 0; i < count; i++) {
    const x = x0 + (x1 - x0) * rand();
    const h = 10 + rand() * 16;
    d += `M ${n(x - 6)} ${n(y)} Q ${n(x - 4)} ${n(y - h * 0.6)} ${n(x - 8)} ${n(y - h)} M ${n(x)} ${n(y)} Q ${n(x + 1)} ${n(y - h * 0.7)} ${n(x + 3)} ${n(y - h * 1.2)} M ${n(x + 6)} ${n(y)} Q ${n(x + 6)} ${n(y - h * 0.5)} ${n(x + 11)} ${n(y - h * 0.9)} `;
  }
  return stroke(d, { lw: 2.2, color });
}

// A small hanging lantern with a soft glow, centred on (x, y).
export function lantern(x, y, s = 1, o = {}) {
  const { glow = true, string = 0 } = o;
  let out = '';
  if (glow) out += `<circle cx="${x}" cy="${y}" r="${n(70 * s)}" fill="${C.gold}" opacity="0.45" filter="url(#glow)"/>`;
  if (string) out += stroke(`M ${x} ${n(y - 30 * s - string)} L ${x} ${n(y - 30 * s)}`, { lw: 2 });
  out += part(`M ${n(x - 12 * s)} ${n(y - 30 * s)} L ${n(x + 12 * s)} ${n(y - 30 * s)} L ${n(x + 9 * s)} ${n(y - 22 * s)} L ${n(x - 9 * s)} ${n(y - 22 * s)} Z`, C.woodDeep, { lw: 2 });
  out += part(ellipse(x, y, 20 * s, 24 * s), C.gold, { lw: 2.4 });
  out += blob(x, y + 2 * s, 8 * s, 11 * s, '#FBE3A6', { line: false });
  out += part(`M ${n(x - 10 * s)} ${n(y + 22 * s)} L ${n(x + 10 * s)} ${n(y + 22 * s)} L ${n(x + 7 * s)} ${n(y + 30 * s)} L ${n(x - 7 * s)} ${n(y + 30 * s)} Z`, C.woodDeep, { lw: 2 });
  return out;
}

// A soft five-point star.
export function star(x, y, r, fill = C.gold, o = {}) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.5 : r;
    d += `${i ? 'L' : 'M'} ${n(x + Math.cos(a) * rr)} ${n(y + Math.sin(a) * rr)} `;
  }
  return part(d + 'Z', fill, { lw: o.lw ?? 2, line: o.line ?? true });
}

// A tiny footprint (a decoration and a trail mark).
export function footprint(x, y, s = 1, a = 0, fill = C.chestnutSoft) {
  let out = `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(a)}) scale(${s})">`;
  out += blob(0, 6, 9, 11, fill, { line: false });
  out += blob(-9, -9, 3.6, 4.2, fill, { line: false });
  out += blob(-3, -13, 3.6, 4.2, fill, { line: false });
  out += blob(4, -13, 3.6, 4.2, fill, { line: false });
  out += blob(10, -8, 3.6, 4.2, fill, { line: false });
  return out + '</g>';
}

// A heart, for decorations.
export function heart(x, y, r, fill = C.rose) {
  const d = `M ${n(x)} ${n(y + r * 0.9)} C ${n(x - r * 1.6)} ${n(y - r * 0.1)} ${n(x - r * 0.9)} ${n(y - r * 1.3)} ${n(x)} ${n(y - r * 0.45)} C ${n(x + r * 0.9)} ${n(y - r * 1.3)} ${n(x + r * 1.6)} ${n(y - r * 0.1)} ${n(x)} ${n(y + r * 0.9)} Z`;
  return part(d, fill, { lw: 2.2 });
}

// A crescent moon.
export function moon(x, y, r) {
  return (
    `<circle cx="${x}" cy="${y}" r="${n(r * 2.2)}" fill="${C.gold}" opacity="0.25" filter="url(#glow)"/>` +
    part(`M ${n(x)} ${n(y - r)} A ${r} ${r} 0 1 0 ${n(x)} ${n(y + r)} A ${n(r * 0.55)} ${r} 0 0 1 ${n(x)} ${n(y - r)} Z`, '#F6DE9C', { lw: 2.4 })
  );
}
