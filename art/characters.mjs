// The characters. Each function draws in its own local coordinates with the
// head centred on (0, 0), so the same proportions come out in every scene.
import { C, part, stroke, band, blob, ellipse, g } from './lib.mjs';

const HEAD =
  'M 0 -70 C 48 -70 82 -44 86 -8 C 89 12 102 30 92 42 C 80 62 46 74 0 74 ' +
  'C -46 74 -80 62 -92 42 C -102 30 -89 12 -86 -8 C -82 -44 -48 -70 0 -70 Z';

const LOWER_FACE =
  'M -92 42 C -88 24 -72 14 -56 18 C -42 22 -30 16 -18 10 C -8 6 8 6 18 10 ' +
  'C 30 16 42 22 56 18 C 72 14 88 24 92 42 C 80 62 46 74 0 74 C -46 74 -80 62 -92 42 Z';

function mirror(fn) {
  return fn(1) + fn(-1);
}

function ear(side, big) {
  const k = big ? 1.12 : 1;
  const sx = side * k;
  const outer = `M ${-84 * side} -22 C ${-98 * sx} ${-62 * k} ${-90 * sx} ${-96 * k} ${-70 * sx} ${-102 * k} C ${-52 * sx} ${-100 * k} ${-36 * side} -82 ${-28 * side} -60 Z`;
  const inner = `M ${-74 * side} -34 C ${-84 * sx} ${-62 * k} ${-80 * sx} ${-84 * k} ${-68 * sx} ${-88 * k} C ${-56 * sx} ${-84 * k} ${-46 * side} -70 ${-40 * side} -56 Z`;
  return part(outer, C.cream) + part(inner, C.chestnut, { line: false });
}

function eyes(kind) {
  return mirror((s) => {
    const x = -30 * s;
    if (kind === 'closed') {
      return stroke(`M ${x - 11} -3 Q ${x} 6 ${x + 11} -3`, { lw: 3.6 });
    }
    if (kind === 'happy') {
      return stroke(`M ${x - 11} 1 Q ${x} -10 ${x + 11} 1`, { lw: 3.6 });
    }
    if (kind === 'sleepy') {
      return (
        part(`M ${x - 11} -5 Q ${x} -10 ${x + 11} -5 Q ${x + 10} 8 ${x} 8 Q ${x - 10} 8 ${x - 11} -5 Z`, C.eye, { lw: 2.4 }) +
        blob(x - 3 * s, 0, 2.6, 2.6, C.cream, { line: false })
      );
    }
    // open: big, round, gentle
    return (
      part(ellipse(x, -3, 10, 12), C.eye, { lw: 2.4 }) +
      blob(x - 3, -8, 3.8, 3.8, C.cream, { line: false }) +
      blob(x + 3.5, 2, 1.8, 1.8, C.cream, { line: false })
    );
  });
}

// A red panda head. eyes: open | sleepy | closed | happy.
export function pandaHead({ eyes: e = 'open', cub = false, blush = true } = {}) {
  let s = '';
  s += mirror((side) => ear(side, cub));
  s += part(HEAD, cub ? C.amber : C.rust, { line: false });
  // forehead glow: lighter fur in the middle of the face
  s += part('M -40 -40 C -30 -66 30 -66 40 -40 C 30 -24 -30 -24 -40 -40 Z', cub ? C.amberPale : C.amber, { line: false, opacity: 0.7 });
  s += part(LOWER_FACE, C.cream, { line: false });
  // eyebrow marks
  s += mirror((side) => part(ellipse(-30 * side, -30, 13, 8.5), C.cream, { line: false }));
  // tear marks from each eye to the corner of the mouth
  s += mirror((side) => `<g opacity="0.8">${band(`M ${-33 * side} 9 C ${-34 * side} 22 ${-29 * side} 34 ${-19 * side} 44`, cub ? C.rust : C.tear, 7, { line: false })}</g>`);
  s += stroke(HEAD, { lw: 3.2 });
  s += eyes(e);
  if (blush) s += mirror((side) => blob(-54 * side, 36, 11, 8, C.rose, { line: false, opacity: 0.55 }));
  // nose and smile
  s += part('M -11 22 C -6 17 6 17 11 22 C 10 30 4 33 0 33 C -4 33 -10 30 -11 22 Z', C.line, { lw: 2 });
  s += blob(-3, 22, 2.6, 1.6, C.cream, { line: false, opacity: 0.8 });
  s += stroke('M 0 33 L 0 38 M -11 39 Q -5 46 0 38 Q 5 46 11 39', { lw: 2.6 });
  return s;
}

// A ringed tail along path d: amber underneath, rust bands on top.
export function tail(d, width, { rings = 6, pale = false, tip = true } = {}) {
  const seg = 100 / (rings * 2);
  let s = band(d, pale ? C.amberPale : C.amberPale, width, { line: true, lw: 3 });
  s += band(d, pale ? C.amber : C.rust, width, { line: false, dash: `${seg} ${seg}`, ring: true });
  if (tip) {
    s += band(d, pale ? C.rust : C.rustDeep, width, { line: false, dash: `0 ${100 - seg * 0.9} ${seg * 0.9} 0`, ring: true });
  }
  return s;
}

// The big panda sitting, facing us. About 2.5 heads tall.
export function bigPandaSitting({ eyes: e = 'sleepy', wave = false } = {}) {
  let s = '';
  s += tail('M 70 236 C 168 246 196 160 156 90', 50, { rings: 6 });
  s += part('M -66 104 C -74 64 -44 46 0 46 C 44 46 74 64 66 104 C 96 160 100 236 52 258 C 24 270 -24 270 -52 258 C -100 236 -96 160 -66 104 Z', C.rust);
  s += part('M -40 100 C -36 78 36 78 40 100 C 58 150 56 222 30 246 C 14 256 -14 256 -30 246 C -56 222 -58 150 -40 100 Z', C.chestnutSoft, { line: false });
  s += mirror((side) => blob(-46 * side, 258, 34, 19, C.chestnut));
  s += mirror((side) => stroke(`M ${-58 * side} 262 l ${4 * side} -7 M ${-46 * side} 264 l 0 -8 M ${-34 * side} 262 l ${-4 * side} -7`, { lw: 2, color: C.chestnutSoft }));
  s += band('M -56 98 C -76 140 -68 184 -36 200', C.chestnut, 32);
  s += blob(-30, 202, 18, 14, C.chestnutSoft);
  if (wave) {
    s += band('M 56 98 C 104 96 134 70 144 30', C.chestnut, 32);
    s += blob(146, 24, 18, 16, C.chestnutSoft);
  } else {
    s += band('M 56 98 C 76 140 68 184 36 200', C.chestnut, 32);
    s += blob(30, 202, 18, 14, C.chestnutSoft);
  }
  s += pandaHead({ eyes: e });
  return s;
}

// The cub standing, facing us. About 1.8 heads tall. pose: stand | wobble | up
export function cubStanding({ eyes: e = 'open', pose = 'stand' } = {}) {
  let s = '';
  s += tail('M 34 128 C 80 136 98 108 92 80', 34, { rings: 4, pale: true, tip: false });
  s += part('M -54 74 C -60 112 -46 146 0 148 C 46 146 60 112 54 74 C 44 54 -44 54 -54 74 Z', C.amber);
  s += part('M -30 86 C -26 72 26 72 30 86 C 34 112 26 136 0 138 C -26 136 -34 112 -30 86 Z', C.chestnutSoft, { line: false, opacity: 0.85 });
  const lift = pose === 'wobble' ? -10 : 0;
  s += blob(-26, 150, 20, 13, C.chestnut);
  s += blob(26, 150 + lift, 20, 13, C.chestnut);
  if (pose === 'wobble') {
    s += band('M -44 84 C -70 82 -88 70 -98 54', C.chestnut, 22);
    s += blob(-100, 50, 12, 11, C.chestnutSoft);
    s += band('M 44 84 C 70 82 88 70 98 54', C.chestnut, 22);
    s += blob(100, 50, 12, 11, C.chestnutSoft);
  } else if (pose === 'up') {
    s += band('M -44 84 C -56 104 -48 120 -30 124', C.chestnut, 22);
    s += blob(-28, 124, 12, 10, C.chestnutSoft);
    s += band('M 46 82 C 92 80 118 56 128 22', C.chestnut, 22);
    s += blob(130, 16, 12, 11, C.chestnutSoft);
  } else {
    s += band('M -44 84 C -56 104 -48 120 -30 124', C.chestnut, 22);
    s += blob(-28, 124, 12, 10, C.chestnutSoft);
    s += band('M 44 84 C 56 104 48 120 30 124', C.chestnut, 22);
    s += blob(28, 124, 12, 10, C.chestnutSoft);
  }
  s += pandaHead({ eyes: e, cub: true });
  return s;
}

// The newborn cub: a small sleeping bundle with its tail wrapped round.
export function cubSleeping() {
  let s = '';
  s += part(ellipse(10, 20, 96, 56), C.amber);
  s += part('M -30 -10 C 0 -40 60 -36 90 -6 C 70 0 20 4 -30 -10 Z', C.amberPale, { line: false, opacity: 0.7 });
  s += tail('M 98 26 C 104 70 40 86 -40 74', 34, { rings: 4, pale: true, tip: false });
  s += g('translate(-62 2) rotate(-12) scale(0.62)', pandaHead({ eyes: 'closed', cub: true }));
  s += blob(-36, 52, 16, 10, C.chestnutSoft);
  return s;
}

// The owl, bedtime narrator: round, soft, speckled, kind.
export function owl({ eyes: e = 'open', spectacles = true } = {}) {
  let s = '';
  s += mirror((side) => part(`M ${-40 * side} -58 C ${-46 * side} -80 ${-40 * side} -92 ${-32 * side} -96 C ${-28 * side} -84 ${-20 * side} -72 ${-12 * side} -66 Z`, C.owl));
  s += part('M 0 -70 C 50 -70 70 -30 70 20 C 70 80 40 110 0 110 C -40 110 -70 80 -70 20 C -70 -30 -50 -70 0 -70 Z', C.owl);
  s += part('M 0 0 C 34 0 46 30 44 60 C 40 92 20 104 0 104 C -20 104 -40 92 -44 60 C -46 30 -34 0 0 0 Z', C.owlPale, { line: false });
  for (const [x, y] of [[-16, 30], [12, 26], [-24, 56], [2, 52], [24, 50], [-12, 80], [14, 78]]) {
    s += stroke(`M ${x - 5} ${y} Q ${x} ${y + 5} ${x + 5} ${y}`, { lw: 2.2, color: C.woodDeep });
  }
  s += mirror((side) => part(`M ${-62 * side} 0 C ${-80 * side} 30 ${-76 * side} 70 ${-54 * side} 92 C ${-50 * side} 60 ${-48 * side} 30 ${-62 * side} 0 Z`, C.woodDeep));
  s += mirror((side) => part(ellipse(-26 * side, -30, 22, 22), C.cream, { lw: 2.6 }));
  s += mirror((side) => {
    const x = -26 * side;
    if (e === 'closed') return stroke(`M ${x - 10} -28 Q ${x} -20 ${x + 10} -28`, { lw: 3.4 });
    return part(ellipse(x, -30, 12, 12), '#D9963C', { lw: 2 }) + blob(x, -30, 6, 6, C.eye, { line: false }) + blob(x - 3, -34, 2.6, 2.6, C.cream, { line: false });
  });
  if (spectacles) {
    s += mirror((side) => stroke(ellipse(-26 * side, -30, 25, 25), { lw: 2.4, color: C.woodDeep }));
    s += stroke('M -3 -34 Q 0 -38 3 -34', { lw: 2.4, color: C.woodDeep });
  }
  s += part('M -7 -10 C -4 -14 4 -14 7 -10 C 6 -2 2 4 0 6 C -2 4 -6 -2 -7 -10 Z', '#D9963C', { lw: 2 });
  s += mirror((side) => stroke(`M ${-14 * side} 108 L ${-18 * side} 120 M ${-10 * side} 108 L ${-10 * side} 121 M ${-6 * side} 108 L ${-2 * side} 120`, { lw: 3, color: C.woodDeep }));
  return s;
}
