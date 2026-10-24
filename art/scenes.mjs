// Every illustration on the landing page. Each entry is drawn by code, so the
// picture is reproducible: `pnpm art` writes the same SVG bytes every time.
import { C, part, stroke, band, blob, ellipse, g, rng } from './lib.mjs';
import { pandaHead, bigPandaSitting, cubStanding, cubSleeping, owl, tail } from './characters.mjs';
import { leaf, bamboo, bush, mountains, hill, grass, lantern, star, footprint, heart, moon, flowerCluster } from './nature.mjs';

// Far layer of the opening scene: misty mountains, transparent sky.
function valleyFar() {
  const r = rng(11);
  let s = '';
  s += mountains(1600, 120, 600, r, { color: C.mistPale, peaks: 6, line: false });
  s += mountains(1600, 230, 600, r, { color: C.mist, peaks: 5 });
  s += hill(1600, [470, 430, 455, 410, 440, 420, 450], 600, C.sageLight, { line: false, opacity: 0.9 });
  return { w: 1600, h: 600, body: s, seed: 11 };
}

// Near layer: rolling hills, rhododendrons and bamboo at both edges.
function valleyNear() {
  const r = rng(23);
  let s = '';
  s += hill(1600, [210, 180, 230, 190, 215, 170, 200], 500, C.sage);
  for (const [x, y, sz] of [[180, 230, 90], [520, 250, 70], [1120, 240, 80], [1430, 215, 95]]) s += bush(x, y, sz, r);
  s += hill(1600, [330, 300, 340, 320, 350, 310, 335], 500, C.moss);
  s += grass(0, 1600, 340, r, 46);
  for (let i = 0; i < 4; i++) s += bamboo(30 + i * 34, 500, 40 + r() * 80, r, { lean: 10 + r() * 20 });
  for (let i = 0; i < 4; i++) s += bamboo(1470 + i * 34, 500, 40 + r() * 80, r, { lean: -10 - r() * 20 });
  return { w: 1600, h: 500, body: s, seed: 23 };
}

// The shy panda peeking out from behind an old tree, as two layers of the
// same size: the head (behind) and the tree with paws and tail tip (in front).
// The page's own CSS slides the head out, so prefers-reduced-motion is honoured
// there; a media query inside an <img> SVG does not follow the page's setting.
function shyHead() {
  const s = g('translate(440 440) rotate(14) scale(0.95)', pandaHead({ eyes: 'open' }));
  return { w: 640, h: 900, body: s, seed: 5 };
}

function shyTree() {
  const r = rng(5);
  // the tail tip, poking out on the far side of the trunk
  let s = tail('M 236 770 C 176 780 132 750 120 696', 40, { rings: 3 });
  // the trunk, flaring into roots
  s += part('M 120 900 C 190 870 222 800 228 700 C 236 560 222 420 236 250 L 400 250 C 410 420 396 560 404 700 C 410 800 450 870 530 900 Z', C.wood, { lw: 3.4 });
  s += part('M 258 300 C 272 520 262 700 244 880 L 292 880 C 298 700 304 500 292 300 Z', C.woodPale, { line: false, opacity: 0.55 });
  for (const d of ['M 270 330 C 276 360 274 390 268 420', 'M 360 300 C 366 340 362 370 368 400', 'M 250 560 C 256 600 252 640 246 680', 'M 372 600 C 380 640 376 680 384 720', 'M 320 470 C 324 500 320 520 324 540', 'M 300 760 C 306 800 300 840 304 880', 'M 190 880 C 210 860 226 830 232 800', 'M 460 884 C 430 866 412 840 404 810']) {
    s += stroke(d, { lw: 2.6, color: C.woodDeep });
  }
  s += part(ellipse(318, 640, 18, 24), C.chestnut, { lw: 2.6 });
  s += blob(200, 880, 50, 16, C.sage, { line: false, opacity: 0.8 });
  s += blob(440, 884, 56, 16, C.sage, { line: false, opacity: 0.8 });
  // the crown, resting on the top of the trunk
  for (const [x, y, rx, ry, c] of [[170, 200, 140, 100, C.moss], [470, 190, 150, 104, C.moss], [320, 130, 190, 120, C.mossDeep], [320, 250, 210, 80, C.sage]]) {
    s += blob(x, y, rx, ry, c);
  }
  for (let i = 0; i < 24; i++) s += leaf(70 + r() * 500, 60 + r() * 230, 28 + r() * 18, -180 + r() * 360, r() > 0.5 ? C.sage : C.sageLight, { vein: false, lw: 2 });
  s += flowerCluster(150, 230, 18, r) + flowerCluster(510, 150, 16, r) + flowerCluster(380, 90, 14, r);
  // two front paws holding on to the bark
  s += blob(408, 400, 20, 15, C.chestnut) + blob(406, 500, 20, 15, C.chestnut);
  s += stroke('M 400 392 l 2 8 M 410 391 l 1 8 M 398 492 l 2 8 M 408 491 l 1 8', { lw: 1.8, color: C.chestnutSoft });
  s += grass(120, 520, 900, r, 18);
  return { w: 640, h: 900, body: s, seed: 5 };
}

// The den: a warm tree hollow, the big panda awake, the newborn cub asleep.
function den() {
  const r = rng(31);
  let s = '';
  s += part('M 0 0 L 1000 0 L 1000 760 L 0 760 Z', C.woodDeep, { line: false });
  s += part('M 90 760 C 60 520 120 120 500 90 C 880 120 940 520 910 760 Z', C.woodPale, { lw: 3.4 });
  for (const d of ['M 180 300 C 190 360 186 420 178 470', 'M 820 260 C 830 330 826 380 834 440', 'M 140 560 C 146 610 142 650 136 700', 'M 860 560 C 868 610 864 650 872 700']) {
    s += stroke(d, { lw: 2.4, color: C.wood });
  }
  // round window with the valley outside
  s += part(ellipse(700, 250, 92, 92), C.sky, { lw: 4 });
  s += part('M 612 290 C 650 240 700 270 740 230 C 770 210 790 240 792 270 C 790 300 760 340 700 342 C 650 340 620 320 612 290 Z', C.mist, { line: false, opacity: 0.8 });
  s += part('M 612 300 C 660 290 720 310 790 290 C 786 320 760 342 700 342 C 650 340 620 322 612 300 Z', C.sage, { line: false });
  s += stroke('M 608 250 L 792 250 M 700 158 L 700 342', { lw: 4, color: C.woodDeep });
  // a shelf with the first decoration (tiny footprints)
  s += part('M 400 420 L 600 420 L 600 438 L 400 438 Z', C.wood, { lw: 2.6 });
  s += part('M 420 350 L 500 350 L 500 420 L 420 420 Z', C.cream, { lw: 2.6 });
  s += footprint(446, 390, 0.9, -12);
  s += footprint(474, 374, 0.9, 10);
  s += part('M 530 420 C 526 400 550 392 554 380 L 566 380 C 570 392 594 400 590 420 Z', C.rose, { lw: 2.4 });
  s += flowerCluster(560, 360, 18, r);
  // lantern
  s += lantern(500, 200, 1.2, { string: 60 });
  // the moss bed
  s += part('M 470 700 C 470 620 560 590 700 590 C 840 590 900 620 900 700 Z', C.moss, { lw: 3 });
  s += part('M 490 690 C 500 640 580 620 700 620 C 820 620 880 640 884 690 Z', C.sage, { line: false });
  s += g('translate(690 620) scale(0.9)', cubSleeping());
  // the big panda, sitting by the bed
  s += g('translate(260 390) scale(1.1)', bigPandaSitting({ eyes: 'sleepy' }));
  s += part('M 0 700 L 1000 700 L 1000 760 L 0 760 Z', C.woodDeep, { line: false });
  s += grass(90, 910, 704, r, 30, C.moss);
  return { w: 1000, h: 760, body: s, seed: 31 };
}

// A shelf in the den, full of decorations from shared moments.
function shelf() {
  const r = rng(43);
  let s = '';
  s += part('M 0 0 L 900 0 L 900 560 L 0 560 Z', C.woodPale, { line: false });
  for (const d of ['M 60 40 C 70 120 64 200 58 260', 'M 840 300 C 850 370 846 430 852 500', 'M 460 20 C 466 60 462 90 468 120']) s += stroke(d, { lw: 2.4, color: C.wood });
  for (const y of [250, 470]) s += part(`M 40 ${y} L 860 ${y} L 860 ${y + 24} L 40 ${y + 24} Z`, C.wood, { lw: 3 });
  // top shelf: framed footprints, a little drawing, a flower pot
  s += part('M 90 90 L 250 90 L 250 250 L 90 250 Z', C.woodDeep, { lw: 3 });
  s += part('M 106 106 L 234 106 L 234 234 L 106 234 Z', C.cream, { lw: 2 });
  s += footprint(148, 192, 1.4, -14);
  s += footprint(194, 150, 1.4, 12);
  s += part('M 320 70 L 520 90 L 512 250 L 312 238 Z', C.cream, { lw: 2.6 });
  s += blob(370, 130, 26, 26, C.gold, { lw: 2 });
  s += stroke('M 370 90 L 370 80 M 410 130 L 422 130 M 398 102 L 406 94 M 342 102 L 334 94 M 330 130 L 318 130', { lw: 3, color: C.gold });
  s += stroke('M 340 220 C 380 180 420 230 460 190 C 480 170 490 200 500 210', { lw: 4, color: C.sage });
  s += blob(450, 140, 22, 30, C.rust, { lw: 2 });
  s += blob(482, 176, 12, 14, C.amber, { lw: 2 });
  s += part('M 610 250 C 600 200 630 190 636 170 L 704 170 C 710 190 740 200 730 250 Z', C.roseDeep, { lw: 2.6 });
  s += band('M 670 172 C 668 140 660 110 672 80', C.moss, 6);
  s += leaf(668, 130, 40, -150, C.sage);
  s += leaf(668, 110, 40, -30, C.sage);
  s += flowerCluster(672, 72, 30, r);
  s += star(800, 180, 46, C.gold);
  // bottom shelf: a jar of bamboo leaves, a heart, a wooden toy, a pebble row
  s += part('M 100 470 L 100 340 C 100 320 200 320 200 340 L 200 470 Z', C.sky, { lw: 2.6, opacity: 0.85 });
  for (let i = 0; i < 6; i++) s += leaf(150, 440, 70 + r() * 30, -120 + r() * 60, C.sage, { vein: false });
  s += heart(320, 410, 46, C.rose);
  s += part('M 430 470 L 430 400 L 520 400 L 520 470 Z', C.rust, { lw: 2.6 });
  s += part('M 430 400 L 475 350 L 520 400 Z', C.gold, { lw: 2.6 });
  s += part(ellipse(475, 436, 14, 18), C.woodDeep, { lw: 2 });
  for (const [x, rx, c] of [[620, 34, C.mist], [700, 26, C.mistPale], [770, 30, C.sage]]) s += blob(x, 470 - rx * 0.7, rx, rx * 0.7, c, { lw: 2.4 });
  return { w: 900, h: 560, body: s, seed: 43 };
}

// The cub grown up: its own den nearby, and the big panda waving across.
function visit() {
  const r = rng(57);
  let s = '';
  s += mountains(1200, 140, 520, r, { color: C.mistPale, peaks: 4, line: false });
  s += hill(1200, [420, 380, 410, 370, 400], 760, C.sageLight, { line: false });
  s += hill(1200, [560, 520, 560, 530, 560], 760, C.sage);
  // an old tree with a round doorway; the crown sits on top of the trunk
  const tree = (x, w, top, door) => {
    let t = '';
    t += part(`M ${x - w * 0.85} 720 C ${x - w * 0.45} 700 ${x - w * 0.48} 640 ${x - w * 0.5} 560 C ${x - w * 0.52} 440 ${x - w * 0.44} ${top + 80} ${x - w * 0.4} ${top} L ${x + w * 0.4} ${top} C ${x + w * 0.44} ${top + 80} ${x + w * 0.52} 440 ${x + w * 0.5} 560 C ${x + w * 0.48} 640 ${x + w * 0.45} 700 ${x + w * 0.85} 720 Z`, C.wood, { lw: 3 });
    t += stroke(`M ${x - w * 0.3} ${top + 60} C ${x - w * 0.28} ${top + 100} ${x - w * 0.3} ${top + 130} ${x - w * 0.27} ${top + 160}`, { lw: 2.4, color: C.woodDeep });
    t += stroke(`M ${x + w * 0.32} 600 C ${x + w * 0.34} 630 ${x + w * 0.31} 660 ${x + w * 0.36} 690`, { lw: 2.4, color: C.woodDeep });
    t += blob(x - w * 0.75, top + 10, w * 0.75, 70, C.mossDeep);
    t += blob(x + w * 0.75, top + 16, w * 0.72, 66, C.moss);
    t += blob(x - w * 0.4, top - 90, w * 0.7, 80, C.mossDeep);
    t += blob(x + w * 0.45, top - 70, w * 0.65, 74, C.moss);
    t += blob(x, top - 40, w * 1.1, 100, C.moss);
    t += blob(x, top + 24, w * 0.95, 46, C.sage, { line: false });
    t += part(ellipse(x, door.y, door.rx, door.ry), C.chestnut, { lw: 3.4 });
    t += part(`M ${x - door.rx} ${door.y + door.ry * 0.55} C ${x - door.rx * 0.5} ${door.y + door.ry * 0.4} ${x + door.rx * 0.5} ${door.y + door.ry * 0.4} ${x + door.rx} ${door.y + door.ry * 0.55} L ${x + door.rx * 0.7} ${door.y + door.ry} L ${x - door.rx * 0.7} ${door.y + door.ry} Z`, C.moss, { line: false, opacity: 0.9 });
    return t;
  };
  s += tree(250, 230, 240, { y: 560, rx: 92, ry: 112 });
  s += tree(950, 190, 300, { y: 590, rx: 72, ry: 90 });
  s += lantern(386, 380, 0.8, { string: 20 });
  s += lantern(1060, 440, 0.7, { string: 20 });
  // a little path between the two dens
  s += part('M 300 700 C 480 640 700 690 900 640 L 940 660 C 720 720 480 680 320 730 Z', C.woodPale, { line: false, opacity: 0.8 });
  for (const [x, y, a] of [[420, 690, 70], [480, 680, 100], [550, 684, 70], [620, 676, 100], [690, 680, 70], [760, 668, 100], [830, 664, 70]]) s += footprint(x, y, 0.7, a, C.wood);
  s += bush(600, 600, 56, r);
  s += g('translate(250 498) scale(0.62)', bigPandaSitting({ eyes: 'open', wave: true }));
  s += g('translate(950 574) scale(0.6)', cubStanding({ eyes: 'happy', pose: 'up' }));
  s += hill(1200, [740, 720, 735, 715, 740], 760, C.moss);
  s += grass(0, 1200, 742, r, 40);
  return { w: 1200, h: 760, body: s, seed: 57 };
}

function cardBack(w, h, color) {
  return `<rect width="${w}" height="${h}" fill="${C.paper}"/>` + blob(w / 2, h * 0.58, w * 0.42, h * 0.4, color, { line: false, opacity: 0.55 });
}

// Example card: a milestone.
function cardFirstSteps() {
  const r = rng(61);
  let s = cardBack(600, 460, C.sky);
  s += hill(600, [400, 390, 396, 386], 460, C.sageLight, { line: false });
  for (const [x, y, a] of [[90, 420, 80], [140, 404, 100], [190, 416, 80], [240, 400, 100]]) s += footprint(x, y, 0.9, a);
  s += bush(520, 400, 50, r);
  s += g('translate(330 200) scale(1.05)', cubStanding({ eyes: 'open', pose: 'wobble' }));
  return { w: 600, h: 460, body: s, seed: 61 };
}

// Example card: a funny moment (a bamboo-leaf hat).
function cardFunny() {
  const r = rng(67);
  let s = cardBack(600, 460, C.rose);
  s += hill(600, [404, 392, 400, 390], 460, C.sageLight, { line: false });
  s += g('translate(300 220) scale(1.05)', cubStanding({ eyes: 'happy', pose: 'stand' }));
  // the leafy hat
  s += g('translate(300 220) scale(1.05)', leaf(-6, -72, 74, -150, C.sage) + leaf(0, -74, 80, -100, C.moss) + leaf(6, -72, 74, -40, C.sage) + leaf(0, -74, 60, -70, C.sageLight));
  for (let i = 0; i < 4; i++) s += leaf(70 + i * 30, 430, 40, -60 - r() * 60, C.sage, { vein: false, lw: 2 });
  return { w: 600, h: 460, body: s, seed: 67 };
}

// Example card: something the child said (the moon, at bedtime).
function cardSaid() {
  const r = rng(71);
  let s = part('M 0 0 L 600 0 L 600 460 L 0 460 Z', C.indigo, { line: false });
  for (let i = 0; i < 14; i++) s += star(30 + r() * 540, 20 + r() * 200, 4 + r() * 5, C.gold, { line: false });
  s += moon(470, 110, 52);
  s += hill(600, [400, 380, 396, 384], 460, C.indigoDeep, { line: false });
  s += g('translate(250 230) scale(1.0)', cubStanding({ eyes: 'open', pose: 'up' }));
  s += lantern(100, 360, 0.8);
  return { w: 600, h: 460, body: s, seed: 71 };
}

// The promise: the big panda holding the sleeping cub close.
function promise() {
  const r = rng(79);
  let s = blob(350, 380, 300, 260, C.sageLight, { line: false, opacity: 0.6 });
  for (const [x, y] of [[110, 520], [600, 520]]) s += bush(x, y, 70, r);
  s += g('translate(350 200) scale(1.25)', bigPandaSitting({ eyes: 'closed' }));
  s += g('translate(350 470) scale(0.62)', cubSleeping());
  s += heart(470, 150, 22, C.rose);
  s += heart(510, 110, 14, C.roseDeep);
  return { w: 700, h: 640, body: s, seed: 79 };
}

// Bedtime: the owl on a branch with a lantern, the cub asleep beside it.
function night() {
  const r = rng(83);
  let s = '';
  for (let i = 0; i < 40; i++) s += star(r() * 1600, 20 + r() * 380, 3 + r() * 6, C.gold, { line: false });
  s += moon(1300, 130, 60);
  s += mountains(1600, 300, 700, r, { color: C.indigoDeep, peaks: 6, snow: false, line: false });
  // the nearest hill is flat, in exactly the page's night colour, so the
  // picture runs on into the footer without a seam
  s += hill(1600, [560, 530, 560, 520, 550, 530, 560], 700, '#2C3459', { flat: true });
  s += band('M 220 360 C 420 330 640 350 900 300', C.woodDeep, 30);
  s += band('M 600 340 C 640 300 660 270 700 250', C.woodDeep, 16);
  for (let i = 0; i < 8; i++) s += leaf(640 + r() * 120, 250 + r() * 60, 38, -180 + r() * 360, C.mossDeep, { vein: false, lw: 2 });
  s += lantern(820, 380, 1, { string: 50 });
  s += g('translate(460 236) scale(0.95)', owl({}));
  s += g('translate(300 314) scale(0.6)', cubSleeping());
  return { w: 1600, h: 700, body: s, seed: 83 };
}

// A small mark: the panda face, used as the site icon and the card mark.
function mark() {
  const s = g('translate(128 140) scale(1.12)', pandaHead({ eyes: 'open' }));
  return { w: 256, h: 256, body: s, seed: 3 };
}

// Paper texture, tiled behind the whole page.
function paper() {
  const body = `<filter id="tooth" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" seed="9" stitchTiles="stitch"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.32  0 0 0 0 0.2  0 0 0 0.35 -0.12"/>
  </filter>
  <filter id="blot" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="4" stitchTiles="stitch"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0.6  0 0 0 0 0.42  0 0 0 0 0.25  0 0 0 0.4 -0.14"/>
  </filter>
  <rect width="400" height="400" filter="url(#blot)"/>
  <rect width="400" height="400" filter="url(#tooth)"/>`;
  return { w: 400, h: 400, body, raw: true };
}

export const assets = {
  'valley-far': valleyFar,
  'valley-near': valleyNear,
  'shy-head': shyHead,
  'shy-tree': shyTree,
  den,
  shelf,
  visit,
  'card-first-steps': cardFirstSteps,
  'card-funny': cardFunny,
  'card-said': cardSaid,
  promise,
  night,
  mark,
  paper,
};
