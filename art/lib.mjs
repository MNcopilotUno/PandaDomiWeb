// Shared drawing kit for the landing page art.
// Every illustration is built from these pieces so line weight, paper texture,
// palette and character proportions stay the same across the whole page.

// Main tones from the Panda Domi palette, plus a few in-between shades.
export const C = {
  rust: '#C1502E',
  rustDeep: '#A8442A',
  amber: '#E08A4F',
  amberPale: '#EDB07C',
  chestnut: '#4A2A1F',
  chestnutSoft: '#5C3727',
  cream: '#FBF3E4',
  line: '#3B2A22',
  tear: '#9A3D24',
  eye: '#2E1D16',
  sage: '#8DB37A',
  sageLight: '#B4CE9E',
  moss: '#5E7F4F',
  mossDeep: '#4D6B41',
  rose: '#E39AA0',
  roseDeep: '#CF7F88',
  sky: '#CFE3EC',
  mist: '#A9B8C6',
  mistPale: '#C3CED8',
  wood: '#B98A5A',
  woodDeep: '#93683F',
  woodPale: '#D2AA7C',
  paper: '#F7EEDC',
  indigo: '#3E4A78',
  indigoDeep: '#323C66',
  gold: '#F2C66D',
  owl: '#8A6447',
  owlPale: '#C79F78',
};

const n = (v) => (Math.round(v * 10) / 10).toString();

// Filters: a watercolour wash for fills, a wobbly coloured pencil for lines,
// a soft blur for mist and glow. Values are in user units and tuned for
// characters drawn at roughly the same scale in every file.
export function defs(seed = 1) {
  return `<defs>
  <filter id="paint" x="-8%" y="-8%" width="116%" height="116%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="${seed}" result="warp"/>
    <feDisplacementMap in="SourceGraphic" in2="warp" scale="5" xChannelSelector="R" yChannelSelector="G" result="shape"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="${seed + 7}" result="grain"/>
    <feColorMatrix in="grain" type="matrix" values="0 0 0 0.42 0.7  0 0 0 0.42 0.7  0 0 0 0.42 0.7  0 0 0 0 1" result="tone"/>
    <feBlend in="shape" in2="tone" mode="multiply" result="toned"/>
    <feComposite in="toned" in2="shape" operator="in" result="painted"/>
    <feMorphology in="shape" operator="erode" radius="2.2" result="core"/>
    <feComposite in="shape" in2="core" operator="out" result="rim"/>
    <feGaussianBlur in="rim" stdDeviation="1.1" result="rimSoft"/>
    <feColorMatrix in="rimSoft" type="matrix" values="0 0 0 0 0.25  0 0 0 0 0.14  0 0 0 0 0.1  0 0 0 0.24 0" result="pool"/>
    <feComposite in="pool" in2="shape" operator="in" result="poolIn"/>
    <feMerge><feMergeNode in="painted"/><feMergeNode in="poolIn"/></feMerge>
  </filter>
  <filter id="pencil" x="-8%" y="-8%" width="116%" height="116%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="${seed + 3}" result="warp"/>
    <feDisplacementMap in="SourceGraphic" in2="warp" scale="3.5" xChannelSelector="R" yChannelSelector="G" result="wobble"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="${seed + 5}" result="tooth"/>
    <feColorMatrix in="tooth" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.1 1.75" result="toothA"/>
    <feComposite in="wobble" in2="toothA" operator="in"/>
  </filter>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
    <feGaussianBlur stdDeviation="6"/>
  </filter>
  <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
    <feGaussianBlur stdDeviation="14"/>
  </filter>
</defs>`;
}

// One painted part: a watercolour fill, then (optionally) its pencil outline.
// Pairing fill and line per part keeps hidden outlines hidden.
export function part(d, fill, o = {}) {
  const { line = true, lw = 3, opacity, lineColor = C.line } = o;
  const op = opacity == null ? '' : ` opacity="${opacity}"`;
  let s = fill ? `<path d="${d}" fill="${fill}" filter="url(#paint)"${op}/>` : '';
  if (line) {
    s += `<path d="${d}" fill="none" stroke="${lineColor}" stroke-width="${lw}" stroke-linecap="round" stroke-linejoin="round" filter="url(#pencil)"/>`;
  }
  return s;
}

// A pencil stroke without a fill (whiskers, mouths, grass, folds).
export function stroke(d, o = {}) {
  const { lw = 3, color = C.line, opacity } = o;
  const op = opacity == null ? '' : ` opacity="${opacity}"`;
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${lw}" stroke-linecap="round" stroke-linejoin="round" filter="url(#pencil)"${op}/>`;
}

// The rough bounds of an absolute path (its control points), padded.
// Filters size their region from the geometry and ignore stroke width, so a
// broad stroke needs an invisible rect around it or its edges get clipped.
function bounds(d, pad) {
  const v = d.match(/-?\d*\.?\d+/g).map(Number);
  const xs = v.filter((_, i) => i % 2 === 0);
  const ys = v.filter((_, i) => i % 2 === 1);
  const x = Math.min(...xs) - pad;
  const y = Math.min(...ys) - pad;
  return `<rect x="${n(x)}" y="${n(y)}" width="${n(Math.max(...xs) + pad - x)}" height="${n(Math.max(...ys) + pad - y)}" fill="none"/>`;
}

// A broad painted stroke (tails, stalks, branches) with a pencil outline around it.
export function band(d, color, width, o = {}) {
  const { line = true, lw = 3, dash, under, cap = 'round', ring = false } = o;
  const box = bounds(d, width);
  const wrap = (filter, inner) => `<g filter="url(#${filter})">${box}${inner}</g>`;
  const pl = ring ? ' pathLength="100"' : '';
  let s = '';
  if (line) {
    s += wrap('pencil', `<path d="${d}" fill="none" stroke="${C.line}" stroke-width="${width + lw * 2}" stroke-linecap="${cap}" stroke-linejoin="round"/>`);
  }
  if (under) {
    s += wrap('paint', `<path d="${d}" fill="none" stroke="${under}" stroke-width="${width}" stroke-linecap="${cap}" stroke-linejoin="round"/>`);
  }
  const da = dash ? ` stroke-dasharray="${dash}"` : '';
  s += wrap('paint', `<path d="${d}"${pl} fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="${dash ? 'butt' : cap}" stroke-linejoin="round"${da}/>`);
  return s;
}

export function ellipse(cx, cy, rx, ry) {
  return `M ${n(cx - rx)} ${n(cy)} A ${n(rx)} ${n(ry)} 0 1 0 ${n(cx + rx)} ${n(cy)} A ${n(rx)} ${n(ry)} 0 1 0 ${n(cx - rx)} ${n(cy)} Z`;
}

export function blob(cx, cy, rx, ry, fill, o = {}) {
  return part(ellipse(cx, cy, rx, ry), fill, o);
}

export function g(transform, body) {
  return `<g transform="${transform}">${body}</g>`;
}

export function svg(w, h, body, o = {}) {
  const { seed = 1, label } = o;
  const aria = label ? ` role="img" aria-label="${label}"` : ' aria-hidden="true"';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"${aria}>
${defs(seed)}
${body}
</svg>
`;
}

// A small seeded random generator so every build draws the same picture.
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export { n };
