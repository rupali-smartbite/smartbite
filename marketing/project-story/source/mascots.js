// Hand-drawn style kawaii food mascots (flat colours, thick outlines). size = px height.
const K = '#241034';
const face = (cx, cy, s, mood = 'happy') => {
  const e = 5.2 * s, gap = 13 * s;
  const eyes = `<circle cx="${cx - gap}" cy="${cy}" r="${e}" fill="${K}"/><circle cx="${cx + gap}" cy="${cy}" r="${e}" fill="${K}"/>
    <circle cx="${cx - gap + 1.8 * s}" cy="${cy - 1.8 * s}" r="${1.8 * s}" fill="#fff"/><circle cx="${cx + gap + 1.8 * s}" cy="${cy - 1.8 * s}" r="${1.8 * s}" fill="#fff"/>`;
  const blush = `<ellipse cx="${cx - gap - 6 * s}" cy="${cy + 9 * s}" rx="${5 * s}" ry="${3 * s}" fill="#FF8FAB" opacity=".9"/><ellipse cx="${cx + gap + 6 * s}" cy="${cy + 9 * s}" rx="${5 * s}" ry="${3 * s}" fill="#FF8FAB" opacity=".9"/>`;
  const mouth = mood === 'happy'
    ? `<path d="M${cx - 8 * s} ${cy + 8 * s} Q ${cx} ${cy + 19 * s} ${cx + 8 * s} ${cy + 8 * s} Z" fill="${K}"/><path d="M${cx - 4 * s} ${cy + 13 * s} Q ${cx} ${cy + 17 * s} ${cx + 4 * s} ${cy + 13 * s}" fill="#FF5D8F"/>`
    : `<path d="M${cx - 8 * s} ${cy + 15 * s} Q ${cx} ${cy + 7 * s} ${cx + 8 * s} ${cy + 15 * s}" fill="none" stroke="${K}" stroke-width="${3.5 * s}" stroke-linecap="round"/>
       <path d="M${cx - gap - 7 * s} ${cy - 10 * s} L ${cx - gap + 6 * s} ${cy - 6 * s}" stroke="${K}" stroke-width="${3.2 * s}" stroke-linecap="round"/><path d="M${cx + gap + 7 * s} ${cy - 10 * s} L ${cx + gap - 6 * s} ${cy - 6 * s}" stroke="${K}" stroke-width="${3.2 * s}" stroke-linecap="round"/>
       <path d="M${cx + gap + 16 * s} ${cy - 16 * s} q ${4 * s} ${7 * s} 0 ${10 * s} q ${-4 * s} ${-3 * s} 0 ${-10 * s}Z" fill="#7CC8FF" stroke="${K}" stroke-width="${2 * s}"/>`;
  return eyes + (mood === 'happy' ? blush : '') + mouth;
};
const W = (vb, inner, h) => `<svg viewBox="${vb}" height="${h}" style="overflow:visible;display:block">${inner}</svg>`;
const limbs = (x1, y1, x2, y2, c) => `<path d="M${x1} ${y1} q -16 -6 -22 -22" fill="none" stroke="${K}" stroke-width="5" stroke-linecap="round"/><path d="M${x2} ${y2} q 16 -6 22 -22" fill="none" stroke="${K}" stroke-width="5" stroke-linecap="round"/>`;
window.MASCOT = {
  apple: (h) => W('0 0 120 130', `
    <path d="M60 30 C 20 10, -5 55, 18 95 C 32 122, 50 118, 60 112 C 70 118, 88 122, 102 95 C 125 55, 100 10, 60 30 Z" fill="#FF4D4D" stroke="${K}" stroke-width="5"/>
    <path d="M30 45 Q 24 60 28 72" stroke="#fff" stroke-width="6" stroke-linecap="round" fill="none" opacity=".7"/>
    <path d="M60 30 Q 58 14 66 4" stroke="${K}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M64 14 C 78 0, 98 6, 96 16 C 86 24, 72 22, 64 14 Z" fill="#3DBE6E" stroke="${K}" stroke-width="4"/>
    ${face(60, 66, 1)}`, h),
  carrot: (h) => W('0 0 110 170', `
    <path d="M42 30 Q 30 0 44 4 Q 52 18 55 28 Q 58 2 72 6 Q 74 22 64 32 Q 92 12 92 26 Q 82 38 66 40 Z" fill="#3DBE6E" stroke="${K}" stroke-width="4"/>
    <path d="M20 40 Q 55 22 92 40 Q 82 110 58 162 Q 52 168 48 160 Q 26 110 20 40 Z" fill="#FF8A1F" stroke="${K}" stroke-width="5"/>
    <path d="M30 92 L 42 90 M 62 112 L 72 110 M 34 120 L 44 120" stroke="${K}" stroke-width="3.5" stroke-linecap="round"/>
    ${face(56, 62, .95)}`, h),
  banana: (h) => W('0 0 150 120', `
    <path d="M18 22 C 10 70, 50 112, 110 104 C 132 100, 142 88, 140 80 C 120 90, 70 92, 46 52 C 38 38, 36 26, 34 18 Z" fill="#FFD43B" stroke="${K}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M18 22 L 22 8 L 36 12 L 34 18" fill="#8B5E34" stroke="${K}" stroke-width="4" stroke-linejoin="round"/>
    ${face(78, 76, .9)}`, h),
  soda: (h) => W('0 0 110 170', `
    <rect x="18" y="22" width="74" height="138" rx="16" fill="#8E3FC9" stroke="${K}" stroke-width="5"/>
    <rect x="26" y="10" width="58" height="18" rx="6" fill="#C9CED6" stroke="${K}" stroke-width="4"/>
    <rect x="18" y="104" width="74" height="22" fill="#B479E8" stroke="${K}" stroke-width="4"/>
    <circle cx="36" cy="44" r="4" fill="#fff" opacity=".7"/><circle cx="44" cy="58" r="3" fill="#fff" opacity=".7"/>
    <rect x="72" y="-14" width="18" height="18" rx="3" fill="#fff" stroke="${K}" stroke-width="3" transform="rotate(14 81 -5)"/>
    <rect x="88" y="4" width="14" height="14" rx="3" fill="#fff" stroke="${K}" stroke-width="3" transform="rotate(-10 95 11)"/>
    ${face(55, 66, 1, 'grumpy')}`, h),
  chips: (h) => W('0 0 130 170', `
    <path d="M14 20 L 24 12 L 34 20 L 44 12 L 54 20 L 64 12 L 74 20 L 84 12 L 94 20 L 104 12 L 116 20 L 120 156 L 110 164 L 98 156 L 86 164 L 74 156 L 62 164 L 50 156 L 38 164 L 26 156 L 12 160 Z" fill="#FFB703" stroke="${K}" stroke-width="5" stroke-linejoin="round"/>
    <ellipse cx="66" cy="120" rx="30" ry="18" fill="#FFE08A" stroke="${K}" stroke-width="4"/>
    <path d="M30 40 L 34 56" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/>
    <circle cx="26" cy="96" r="5" fill="#FFD25A" stroke="${K}" stroke-width="2"/><circle cx="104" cy="70" r="4" fill="#FFD25A" stroke="${K}" stroke-width="2"/>
    ${face(66, 66, 1, 'grumpy')}`, h),
  phone: (h) => W('0 0 120 180', `
    <path d="M60 140 L 6 178 L 114 178 Z" fill="#FFE27A" opacity=".75"/>
    <rect x="20" y="6" width="80" height="140" rx="18" fill="#5B2A86" stroke="${K}" stroke-width="5"/>
    <rect x="28" y="18" width="64" height="104" rx="10" fill="#E9F7FF" stroke="${K}" stroke-width="3"/>
    <rect x="48" y="128" width="24" height="8" rx="4" fill="#FFC93C"/>
    <path d="M34 30 h10 M34 30 v10 M86 30 h-10 M86 30 v10 M34 110 h10 M34 110 v-10 M86 110 h-10 M86 110 v-10" stroke="#FB8500" stroke-width="4" stroke-linecap="round"/>
    ${face(60, 62, .95)}`, h),
  sugar: (h) => W('0 0 60 60', `<rect x="6" y="10" width="44" height="44" rx="8" fill="#fff" stroke="${K}" stroke-width="4"/><path d="M6 22 L 18 10 M50 42 L 38 54" stroke="#E5DDF0" stroke-width="5"/><circle cx="20" cy="30" r="2" fill="#D9CFE6"/><circle cx="34" cy="38" r="2" fill="#D9CFE6"/><circle cx="30" cy="24" r="2" fill="#D9CFE6"/>`, h),
  star: (h, c = '#FFC93C') => W('0 0 100 100', `<path d="M50 4 61 37 96 38 68 59 78 94 50 73 22 94 32 59 4 38 39 37Z" fill="${c}" stroke="${K}" stroke-width="6" stroke-linejoin="round"/>`, h),
};
