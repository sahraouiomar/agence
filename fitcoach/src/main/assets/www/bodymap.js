// Interactive anatomical body map (front + back). Tap a muscle -> data-group on the <path>.
// Shapes are drawn for one half of the body (x >= 100) and mirrored.
(function () {
  const mirror = (d) => {
    let i = 0;
    return d.replace(/-?\d+(\.\d+)?/g, (n) => (i++ % 2 === 0 ? String(200 - parseFloat(n)) : n));
  };

  const SILHOUETTE = 'M100,8 C113,8 121,19 121,33 C121,45 115,53 111,57 L111,62 C121,66 134,66 145,70 C157,74 163,86 163,101 C165,124 163,140 163,158 C167,178 171,204 171,234 C172,247 169,257 165,262 C158,265 154,256 155,244 C152,222 146,197 144,177 C142,169 141,162 140,156 C140,172 138,190 137,204 C143,214 147,228 147,241 C149,270 145,300 141,318 C141,326 141,331 139,341 C141,362 137,382 133,396 C135,402 133,408 125,408 L114,408 C112,401 114,395 114,388 C110,370 108,351 110,335 C108,327 108,321 108,313 C104,291 102,263 100,245 Z';

  // region id -> [group, path] (right half)
  const FRONT = {
    traps_f: ['traps', 'M111,60 C118,64 126,66 134,68 L122,72 C116,70 112,68 111,64 Z'],
    delt_f: ['shoulders', 'M124,70 C141,65 156,73 158,93 C158,105 152,113 147,117 C143,101 136,88 123,80 C121,77 121,73 124,70 Z'],
    pec: ['chest', 'M102,79 L121,77 C136,85 146,99 146,115 C134,127 117,131 102,127 Z'],
    biceps: ['biceps', 'M147,120 C155,126 159,141 158,157 C153,161 147,159 143,151 C141,139 142,127 147,120 Z'],
    forearm_f: ['forearms', 'M144,162 C153,162 161,168 164,184 C167,202 167,221 166,236 L157,238 C153,220 148,197 144,179 Z'],
    abs: ['abs', 'M102,131 L118,131 C120,161 119,190 116,212 L102,214 Z'],
    oblique: ['abs', 'M121,133 C133,135 140,151 138,173 C136,193 130,206 121,212 C123,186 124,158 121,133 Z'],
    quad: ['quads', 'M106,240 C116,229 133,228 141,238 C147,263 145,293 137,313 C129,319 119,319 113,313 C107,291 104,263 106,240 Z'],
    adductor: ['quads', 'M101,238 C104,239 106,241 107,245 C105,266 108,291 112,309 C106,302 103,289 101,276 Z'],
    calf_f: ['calves', 'M113,331 C121,327 133,329 137,341 C139,361 135,379 129,393 L119,393 C113,373 111,351 113,331 Z'],
  };
  const BACK = {
    traps_b: ['traps', 'M100,55 L111,58 C121,64 132,68 141,72 C129,80 116,96 100,121 Z'],
    delt_b: ['shoulders', 'M129,70 C147,66 157,78 157,96 C151,104 147,108 145,111 C141,95 135,85 127,79 Z'],
    lats: ['back', 'M103,125 C116,105 131,93 144,99 C146,121 140,150 129,175 C120,184 110,189 104,190 Z'],
    lowerback: ['lowerback', 'M101,171 C105,170 111,168 115,166 C119,182 119,200 117,214 L101,216 Z'],
    triceps: ['triceps', 'M147,115 C155,119 161,135 159,157 C153,163 147,161 143,153 C141,139 143,125 147,115 Z'],
    forearm_b: ['forearms', 'M144,162 C153,162 161,168 164,184 C167,202 167,221 166,236 L157,238 C153,220 148,197 144,179 Z'],
    glute: ['glutes', 'M101,221 C115,209 136,213 143,227 C147,245 141,261 127,265 C115,267 104,259 101,251 Z'],
    hamstring: ['hamstrings', 'M104,268 C116,270 132,268 141,263 C145,287 141,305 135,319 L113,319 C107,301 102,285 104,268 Z'],
    calf_b: ['calves', 'M111,331 C121,323 135,325 139,341 C141,361 135,375 129,389 L119,389 C111,371 107,351 111,331 Z'],
  };
  // decorative lines (abs grid, knee caps…)
  const DECOR_F = 'M102,151 L118,150 M102,171 L118,170 M102,191 L117,190 M100,131 L100,214 M114,318 C120,322 128,322 134,318';
  const DECOR_B = 'M100,121 L100,216 M110,268 C118,272 128,272 138,266';

  function region(id, group, d, fill, extra) {
    return `<path class="bm-m" data-act="bodyMuscle" data-group="${group}" data-region="${id}" d="${d}" style="fill:${fill}" ${extra || ''}/>`;
  }

  /**
   * opts.fill(group) -> CSS colour for that muscle group
   * opts.label: text shown under the figure
   */
  function view(side, opts) {
    const R = side === 'front' ? FRONT : BACK;
    let s = `<path class="bm-body" d="${SILHOUETTE}"/><path class="bm-body" d="${mirror(SILHOUETTE)}"/>`;
    // head detail
    s += side === 'front'
      ? '<path class="bm-line" d="M92,30 L94,30 M106,30 L108,30 M96,44 C99,46 101,46 104,44"/>'
      : '<path class="bm-hair" d="M79,34 C76,6 124,6 121,34 C114,24 86,24 79,34 Z"/>';
    for (const id in R) {
      const [g, d] = R[id];
      const f = opts.fill(g);
      s += region(id, g, d, f) + region(id + '_m', g, mirror(d), f);
    }
    s += `<path class="bm-line" d="${side === 'front' ? DECOR_F : DECOR_B}"/><path class="bm-line" d="${mirror(side === 'front' ? DECOR_F : DECOR_B)}"/>`;
    return `<svg class="bodymap" viewBox="20 0 160 415" role="img" aria-label="${opts.label || side}">${s}</svg>`;
  }

  function render(opts) {
    return `<div class="bm-wrap"><figure>${view('front', opts)}<figcaption>${opts.front || ''}</figcaption></figure><figure>${view('back', opts)}<figcaption>${opts.back || ''}</figcaption></figure></div>`;
  }

  window.BodyMap = { render };
})();
