/**
 * Procedural and AI-grounded educational SVG diagram generator
 * Provides guaranteed, high-resolution visual aids for Egyptian curriculum STEM concepts
 */

export interface SvgResult {
  svg: string;
  title: string;
  description: string;
}

export function getProceduralSvg(prompt: string, aspectRatio: string = '1:1'): SvgResult {
  const p = prompt.toLowerCase();
  
  // Dimensions based on aspect ratio
  let width = 800;
  let height = 800;
  if (aspectRatio === '16:9') { width = 960; height = 540; }
  else if (aspectRatio === '4:3') { width = 800; height = 600; }
  else if (aspectRatio === '3:4') { width = 600; height = 800; }
  else if (aspectRatio === '9:16') { width = 540; height = 960; }

  const cx = width / 2;
  const cy = height / 2;

  // 1. Plant Cell (تركيب الخلية النباتية)
  if (p.includes('خلية') && (p.includes('نبات') || p.includes('نباتية'))) {
    return {
      title: 'تركيب الخلية النباتية النموذجية',
      description: 'وسيلة تعليمية ملونة توضح الجدار الخلوي، الغشاء البلازمي، الفجوة العصارية، البلاستيدات الخضراء، والنواة.',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#064e3b" />
      <stop offset="100%" stop-color="#022c22" />
    </linearGradient>
    <linearGradient id="wallGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>
    <linearGradient id="cytoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#d1fae5" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#a7f3d0" stop-opacity="0.1" />
    </linearGradient>
    <linearGradient id="vacuoleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>
    <linearGradient id="nucGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f43f5e" />
      <stop offset="100%" stop-color="#be123c" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bgGrad)" />

  <!-- Grid decoration -->
  <g opacity="0.08" stroke="#34d399" stroke-width="1">
    <line x1="0" y1="100" x2="${width}" y2="100" />
    <line x1="0" y1="200" x2="${width}" y2="200" />
    <line x1="0" y1="300" x2="${width}" y2="300" />
    <line x1="0" y1="400" x2="${width}" y2="400" />
    <line x1="0" y1="500" x2="${width}" y2="500" />
    <line x1="0" y1="600" x2="${width}" y2="600" />
    <line x1="0" y1="700" x2="${width}" y2="700" />
    <line x1="100" y1="0" x2="100" y2="${height}" />
    <line x1="200" y1="0" x2="200" y2="${height}" />
    <line x1="300" y1="0" x2="300" y2="${height}" />
    <line x1="400" y1="0" x2="400" y2="${height}" />
    <line x1="500" y1="0" x2="500" y2="${height}" />
    <line x1="600" y1="0" x2="600" y2="${height}" />
    <line x1="700" y1="0" x2="700" y2="${height}" />
  </g>

  <!-- Cell Title Badge -->
  <g transform="translate(40, 45)">
    <rect width="280" height="44" rx="12" fill="#047857" opacity="0.8" />
    <text x="140" y="28" font-family="system-ui, Cairo, sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">🌱 تركيب الخلية النباتية النموذجية</text>
  </g>

  <!-- Outer Cell Wall (Hexagonal/Rounded Polygonal shape) -->
  <polygon points="${cx-220},${cy-180} ${cx+220},${cy-180} ${cx+290},${cy} ${cx+220},${cy+200} ${cx-220},${cy+200} ${cx-290},${cy}" 
           fill="none" stroke="url(#wallGrad)" stroke-width="22" stroke-linejoin="round" filter="url(#glow)"/>

  <!-- Inner Plasma Membrane -->
  <polygon points="${cx-210},${cy-170} ${cx+210},${cy-170} ${cx+275},${cy} ${cx+210},${cy+190} ${cx-210},${cy+190} ${cx-275},${cy}" 
           fill="url(#cytoGrad)" stroke="#34d399" stroke-width="4" stroke-linejoin="round"/>

  <!-- Large Central Vacuole -->
  <ellipse cx="${cx+30}" cy="${cy-10}" rx="140" ry="110" fill="url(#vacuoleGrad)" opacity="0.85" filter="url(#glow)"/>
  <text x="${cx+30}" y="${cy-5}" font-family="system-ui, Cairo, sans-serif" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">فجوة عصارية مركزية كبرى</text>

  <!-- Nucleus -->
  <circle cx="${cx-140}" cy="${cy-40}" r="55" fill="url(#nucGrad)" filter="url(#glow)"/>
  <circle cx="${cx-140}" cy="${cy-40}" r="22" fill="#881337" opacity="0.8"/>
  <text x="${cx-140}" y="${cy-35}" font-family="system-ui, Cairo, sans-serif" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle">النواة</text>

  <!-- Chloroplasts (بلاستيدات خضراء) -->
  <g transform="translate(${cx-120}, ${cy+100})">
    <ellipse cx="0" cy="0" rx="35" ry="20" fill="#22c55e" stroke="#15803d" stroke-width="3"/>
    <ellipse cx="0" cy="0" rx="20" ry="8" fill="#16a34a"/>
    <text x="0" y="32" font-family="system-ui, Cairo, sans-serif" font-size="11" font-weight="bold" fill="#a7f3d0" text-anchor="middle">بلاستيدة خضراء</text>
  </g>

  <g transform="translate(${cx+160}, ${cy+90})">
    <ellipse cx="0" cy="0" rx="35" ry="20" fill="#22c55e" stroke="#15803d" stroke-width="3"/>
    <ellipse cx="0" cy="0" rx="20" ry="8" fill="#16a34a"/>
    <text x="0" y="32" font-family="system-ui, Cairo, sans-serif" font-size="11" font-weight="bold" fill="#a7f3d0" text-anchor="middle">بلاستيدة خضراء</text>
  </g>

  <!-- Mitochondria -->
  <g transform="translate(${cx-40}, ${cy-130})">
    <ellipse cx="0" cy="0" rx="28" ry="14" fill="#fb923c" stroke="#c2410c" stroke-width="2"/>
    <path d="M-18,0 Q-10,-5 0,0 Q10,5 18,0" stroke="#7c2d12" stroke-width="2" fill="none"/>
    <text x="0" y="24" font-family="system-ui, Cairo, sans-serif" font-size="11" font-weight="bold" fill="#fed7aa" text-anchor="middle">ميتوكوندريا</text>
  </g>

  <!-- Labels and pointers -->
  <g stroke="#ffffff" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.8">
    <line x1="${cx-290}" y1="${cy}" x2="${cx-340}" y2="${cy-50}" />
    <line x1="${cx+220}" y1="${cy-180}" x2="${cx+280}" y2="${cy-220}" />
  </g>

  <rect x="${cx-390}" y="${cy-75}" width="110" height="28" rx="8" fill="#111827" opacity="0.9" />
  <text x="${cx-335}" y="${cy-56}" font-family="system-ui, Cairo, sans-serif" font-size="12" font-weight="bold" fill="#34d399" text-anchor="middle">الجدار الخلوي</text>

  <rect x="${cx+240}" y="${cy-245}" width="120" height="28" rx="8" fill="#111827" opacity="0.9" />
  <text x="${cx+300}" y="${cy-226}" font-family="system-ui, Cairo, sans-serif" font-size="12" font-weight="bold" fill="#38bdf8" text-anchor="middle">السيتوبلازم</text>

  <!-- Watermark / Footer -->
  <text x="${width - 30}" y="${height - 25}" font-family="system-ui, Cairo, sans-serif" font-size="12" font-weight="bold" fill="#6ee7b7" text-anchor="end">منصة عائلة حنيش التعليمية 2026 · وسيلة العلوم الذكية</text>
</svg>`
    };
  }

  // 2. Solar System (المجموعة الشمسية)
  if (p.includes('شمس') || p.includes('كواكب') || p.includes('فضاء') || p.includes('مدار')) {
    return {
      title: 'المجموعة الشمسية ومدارات الكواكب',
      description: 'مخطط فلكي يوضح الشمس وكواكب المجموعة الشمسية الثمانية مع مسافاتها ومداراتها الإهليلجية.',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <radialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fffbeb" />
      <stop offset="30%" stop-color="#fbbf24" />
      <stop offset="80%" stop-color="#f97316" />
      <stop offset="100%" stop-color="#ea580c" />
    </radialGradient>
    <linearGradient id="spaceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#030712" />
      <stop offset="50%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e1b4b" />
    </linearGradient>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#spaceGrad)" />

  <!-- Stars -->
  <g fill="#ffffff" opacity="0.7">
    <circle cx="80" cy="120" r="1.5" /><circle cx="240" cy="80" r="1.2" /><circle cx="450" cy="60" r="2" />
    <circle cx="680" cy="140" r="1.5" /><circle cx="120" cy="640" r="2" /><circle cx="340" cy="720" r="1.2" />
    <circle cx="620" cy="680" r="1.8" /><circle cx="750" cy="480" r="1.5" /><circle cx="50" cy="400" r="1" />
  </g>

  <!-- Orbits -->
  <g fill="none" stroke="#64748b" stroke-width="1.2" stroke-dasharray="4,4" opacity="0.6">
    <circle cx="${cx}" cy="${cy}" r="70" />
    <circle cx="${cx}" cy="${cy}" r="110" />
    <circle cx="${cx}" cy="${cy}" r="160" />
    <circle cx="${cx}" cy="${cy}" r="210" />
    <circle cx="${cx}" cy="${cy}" r="260" />
    <circle cx="${cx}" cy="${cy}" r="310" />
    <circle cx="${cx}" cy="${cy}" r="350" />
  </g>

  <!-- The Sun -->
  <circle cx="${cx}" cy="${cy}" r="45" fill="url(#sunGrad)" filter="drop-shadow(0 0 25px #f97316)"/>
  <text x="${cx}" y="${cy+5}" font-family="system-ui, Cairo, sans-serif" font-size="13" font-weight="black" fill="#ffffff" text-anchor="middle">الشمس</text>

  <!-- Mercury -->
  <circle cx="${cx+70}" cy="${cy}" r="6" fill="#94a3b8" />
  <text x="${cx+70}" y="${cy-12}" font-family="system-ui, Cairo, sans-serif" font-size="10" font-weight="bold" fill="#cbd5e1" text-anchor="middle">عطارد</text>

  <!-- Venus -->
  <circle cx="${cx-85}" cy="${cy-70}" r="9" fill="#fde047" />
  <text x="${cx-85}" y="${cy-85}" font-family="system-ui, Cairo, sans-serif" font-size="10" font-weight="bold" fill="#fef08a" text-anchor="middle">الزهرة</text>

  <!-- Earth -->
  <circle cx="${cx+115}" cy="${cy+110}" r="11" fill="#38bdf8" />
  <text x="${cx+115}" y="${cy+135}" font-family="system-ui, Cairo, sans-serif" font-size="11" font-weight="bold" fill="#7dd3fc" text-anchor="middle">الأرض 🌍</text>

  <!-- Mars -->
  <circle cx="${cx-190}" cy="${cy+90}" r="8" fill="#ef4444" />
  <text x="${cx-190}" y="${cy+112}" font-family="system-ui, Cairo, sans-serif" font-size="10" font-weight="bold" fill="#fca5a5" text-anchor="middle">المريخ</text>

  <!-- Jupiter -->
  <circle cx="${cx+240}" cy="${cy-100}" r="24" fill="#d97706" />
  <text x="${cx+240}" y="${cy-130}" font-family="system-ui, Cairo, sans-serif" font-size="11" font-weight="bold" fill="#fcd34d" text-anchor="middle">المشتري (الأكبر)</text>

  <!-- Saturn -->
  <g transform="translate(${cx-270}, ${cy-150})">
    <ellipse cx="0" cy="0" rx="32" ry="7" fill="none" stroke="#fef08a" stroke-width="3" transform="rotate(-20)" />
    <circle cx="0" cy="0" rx="18" fill="#eab308" />
    <text x="0" y="32" font-family="system-ui, Cairo, sans-serif" font-size="11" font-weight="bold" fill="#fde047" text-anchor="middle">زحل (الحلقات)</text>
  </g>

  <!-- Header Badge -->
  <g transform="translate(40, 45)">
    <rect width="260" height="40" rx="10" fill="#1e1b4b" stroke="#6366f1" stroke-width="1.5" />
    <text x="130" y="25" font-family="system-ui, Cairo, sans-serif" font-size="14" font-weight="bold" fill="#e0e7ff" text-anchor="middle">🌌 المجموعة الشمسية المعتمدة</text>
  </g>
</svg>`
    };
  }

  // 3. Electric Circuit (الدائرة الكهربائية البسيطة)
  if (p.includes('كهربا') || p.includes('دائرة') || p.includes('فيزياء') || p.includes('تيار')) {
    return {
      title: 'الدائرة الكهربائية البسيطة ومسار التيار',
      description: 'مخطط فيزيائي للدائرة المغلقة يضم بطارية، مفتاح تشغيل، ومصباح متوهج واتجاه التيار المستمر.',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="cirBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
    <radialGradient id="bulbGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="40%" stop-color="#eab308" />
      <stop offset="100%" stop-color="#854d0e" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#cirBg)" />

  <!-- Circuit Title -->
  <g transform="translate(40, 45)">
    <rect width="270" height="42" rx="12" fill="#1e3a8a" stroke="#3b82f6" stroke-width="1.5" />
    <text x="135" y="27" font-family="system-ui, Cairo, sans-serif" font-size="15" font-weight="bold" fill="#ffffff" text-anchor="middle">⚡ مخطط الدائرة الكهربائية المغلقة</text>
  </g>

  <!-- Copper Wires (Square Circuit) -->
  <rect x="${cx-220}" y="${cy-140}" width="440" height="280" rx="16" fill="none" stroke="#f59e0b" stroke-width="8" stroke-linejoin="round"/>

  <!-- Battery / Power Source (Left Side) -->
  <g transform="translate(${cx-220}, ${cy})">
    <rect x="-18" y="-45" width="36" height="90" rx="6" fill="#334155" stroke="#94a3b8" stroke-width="2"/>
    <rect x="-10" y="-55" width="20" height="10" rx="2" fill="#ef4444"/>
    <text x="0" y="-20" font-family="system-ui, Cairo, sans-serif" font-size="16" font-weight="black" fill="#ef4444" text-anchor="middle">+</text>
    <text x="0" y="35" font-family="system-ui, Cairo, sans-serif" font-size="20" font-weight="black" fill="#38bdf8" text-anchor="middle">-</text>
    <text x="-65" y="5" font-family="system-ui, Cairo, sans-serif" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">عمود كهربي</text>
  </g>

  <!-- Switch / المفتاح الكهربائي (Bottom Side) -->
  <g transform="translate(${cx}, ${cy+140})">
    <circle cx="-35" cy="0" r="8" fill="#e2e8f0"/>
    <circle cx="35" cy="0" r="8" fill="#e2e8f0"/>
    <line x1="-35" y1="0" x2="35" y2="0" stroke="#22c55e" stroke-width="6"/>
    <text x="0" y="35" font-family="system-ui, Cairo, sans-serif" font-size="14" font-weight="bold" fill="#86efac" text-anchor="middle">مفتاح تشغيل مغلق (دائرة متصلة)</text>
  </g>

  <!-- Light Bulb / المصباح الكهربائي (Right Side) -->
  <g transform="translate(${cx+220}, ${cy})">
    <!-- Glow circle -->
    <circle cx="0" cy="0" r="60" fill="url(#bulbGlow)"/>
    <circle cx="0" cy="0" r="28" fill="#fef08a" stroke="#ca8a04" stroke-width="3"/>
    <path d="M-8,18 L8,18 L6,28 L-6,28 Z" fill="#64748b"/>
    <path d="M-10,0 Q0,-15 10,0" fill="none" stroke="#eab308" stroke-width="2"/>
    <text x="85" y="5" font-family="system-ui, Cairo, sans-serif" font-size="14" font-weight="bold" fill="#fef08a" text-anchor="middle">مصباح مضيء 💡</text>
  </g>

  <!-- Current Direction Arrows (اتجاه التيار التقليدي) -->
  <g fill="#38bdf8">
    <polygon points="${cx-60},${cy-148} ${cx-40},${cy-140} ${cx-60},${cy-132}" />
    <polygon points="${cx+60},${cy-148} ${cx+80},${cy-140} ${cx+60},${cy-132}" />
    <text x="${cx}" y="${cy-160}" font-family="system-ui, Cairo, sans-serif" font-size="13" font-weight="bold" fill="#38bdf8" text-anchor="middle">اتجاه التيار الكهربائي ➔</text>
  </g>
</svg>`
    };
  }

  // 4. Atom Structure & Electrons (تركيب الذرة والإلكترونات)
  if (p.includes('ذرة') || p.includes('نواة') || p.includes('إلكترون') || p.includes('كيمياء')) {
    return {
      title: 'النموذج الذري ومستويات الطاقة (Bohr Model)',
      description: 'مخطط كيميائي يوضح نواة الذرة (البروتونات والنيوترونات) ومستويات الطاقة المحيطة وحركة الإلكترونات.',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <radialGradient id="nucCore" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#f43f5e" />
      <stop offset="100%" stop-color="#9f1239" />
    </radialGradient>
    <linearGradient id="atomBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16" />
      <stop offset="100%" stop-color="#111827" />
    </linearGradient>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#atomBg)" />

  <g transform="translate(40, 45)">
    <rect width="290" height="42" rx="12" fill="#881337" stroke="#fb7185" stroke-width="1.5" />
    <text x="145" y="27" font-family="system-ui, Cairo, sans-serif" font-size="15" font-weight="bold" fill="#ffffff" text-anchor="middle">⚛️ التركيب الذري ومستويات الطاقة</text>
  </g>

  <!-- Orbits / Energy Levels -->
  <g fill="none" stroke="#0ea5e9" stroke-width="2" opacity="0.6">
    <ellipse cx="${cx}" cy="${cy}" rx="230" ry="80" transform="rotate(0 ${cx} ${cy})"/>
    <ellipse cx="${cx}" cy="${cy}" rx="230" ry="80" transform="rotate(60 ${cx} ${cy})"/>
    <ellipse cx="${cx}" cy="${cy}" rx="230" ry="80" transform="rotate(120 ${cx} ${cy})"/>
  </g>

  <!-- Central Nucleus -->
  <circle cx="${cx}" cy="${cy}" r="45" fill="url(#nucCore)" filter="drop-shadow(0 0 20px #e11d48)"/>
  <text x="${cx}" y="${cy-8}" font-family="system-ui, Cairo, sans-serif" font-size="12" font-weight="black" fill="#ffffff" text-anchor="middle">النواة (+)</text>
  <text x="${cx}" y="${cy+12}" font-family="system-ui, Cairo, sans-serif" font-size="10" font-weight="bold" fill="#fecdd3" text-anchor="middle">بروتونات + نيوترونات</text>

  <!-- Orbiting Electrons -->
  <circle cx="${cx+230}" cy="${cy}" r="11" fill="#38bdf8" filter="drop-shadow(0 0 8px #0284c7)"/>
  <text x="${cx+230}" y="${cy+4}" font-family="system-ui, Cairo, sans-serif" font-size="10" font-weight="black" fill="#ffffff" text-anchor="middle">-</text>

  <circle cx="${cx-115}" cy="${cy+70}" r="11" fill="#38bdf8" filter="drop-shadow(0 0 8px #0284c7)"/>
  <text x="${cx-115}" y="${cy+74}" font-family="system-ui, Cairo, sans-serif" font-size="10" font-weight="black" fill="#ffffff" text-anchor="middle">-</text>

  <circle cx="${cx-115}" cy="${cy-70}" r="11" fill="#38bdf8" filter="drop-shadow(0 0 8px #0284c7)"/>
  <text x="${cx-115}" y="${cy-66}" font-family="system-ui, Cairo, sans-serif" font-size="10" font-weight="black" fill="#ffffff" text-anchor="middle">-</text>

  <!-- Explanation Legend -->
  <g transform="translate(${cx-180}, ${height-100})">
    <rect width="360" height="50" rx="12" fill="#1f2937" stroke="#374151" stroke-width="1"/>
    <circle cx="30" cy="25" r="8" fill="#f43f5e"/>
    <text x="75" y="30" font-family="system-ui, Cairo, sans-serif" font-size="12" font-weight="bold" fill="#fecdd3">بروتونات موجبة</text>
    <circle cx="190" cy="25" r="8" fill="#38bdf8"/>
    <text x="245" y="30" font-family="system-ui, Cairo, sans-serif" font-size="12" font-weight="bold" fill="#7dd3fc">إلكترونات سالبة</text>
  </g>
</svg>`
    };
  }

  // 5. Default General Educational Illustration
  return {
    title: `وسيلة تعليمية: ${prompt}`,
    description: `مخطط بياني ورسم توضيحي علمي ملون يشرح مفهوم (${prompt}) للمناهج المصرية.`,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="genBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e1b4b" />
      <stop offset="50%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#064e3b" />
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.12" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.04" />
    </linearGradient>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#genBg)" />

  <!-- Center Presentation Card -->
  <rect x="50" y="50" width="${width-100}" height="${height-100}" rx="24" fill="url(#cardGrad)" stroke="#4338ca" stroke-width="2" />

  <!-- Badge -->
  <g transform="translate(${cx}, 110)">
    <rect x="-180" y="-22" width="360" height="44" rx="14" fill="#047857" stroke="#10b981" stroke-width="2" />
    <text x="0" y="6" font-family="system-ui, Cairo, sans-serif" font-size="16" font-weight="black" fill="#ffffff" text-anchor="middle">🎓 وسيلة تعليمية بيانية ذكية</text>
  </g>

  <!-- Prompt Subject Banner -->
  <text x="${cx}" y="200" font-family="system-ui, Cairo, sans-serif" font-size="24" font-weight="black" fill="#f8fafc" text-anchor="middle">${prompt}</text>

  <!-- Educational Diagram Grid Blocks -->
  <g transform="translate(${cx-220}, ${cy-80})">
    <rect width="200" height="140" rx="16" fill="#1e293b" stroke="#38bdf8" stroke-width="2" />
    <text x="100" y="45" font-family="system-ui, Cairo, sans-serif" font-size="32" text-anchor="middle">🔬</text>
    <text x="100" y="85" font-family="system-ui, Cairo, sans-serif" font-size="14" font-weight="bold" fill="#38bdf8" text-anchor="middle">الملاحظة العلمية</text>
    <text x="100" y="112" font-family="system-ui, Cairo, sans-serif" font-size="11" fill="#94a3b8" text-anchor="middle">دراسة الخصائص والعناصر</text>
  </g>

  <g transform="translate(${cx+20}, ${cy-80})">
    <rect width="200" height="140" rx="16" fill="#1e293b" stroke="#a855f7" stroke-width="2" />
    <text x="100" y="45" font-family="system-ui, Cairo, sans-serif" font-size="32" text-anchor="middle">💡</text>
    <text x="100" y="85" font-family="system-ui, Cairo, sans-serif" font-size="14" font-weight="bold" fill="#c084fc" text-anchor="middle">الاستنتاج والتطبيق</text>
    <text x="100" y="112" font-family="system-ui, Cairo, sans-serif" font-size="11" fill="#94a3b8" text-anchor="middle">قوانين وحقائق المنهج</text>
  </g>

  <!-- Connecting Arrow -->
  <path d="M${cx-15}, ${cy-10} L${cx+15}, ${cy-10}" stroke="#fbbf24" stroke-width="4" stroke-dasharray="4,4"/>

  <!-- Bottom Explanatory Strip -->
  <g transform="translate(90, ${height-180})">
    <rect width="${width-180}" height="70" rx="16" fill="#0f172a" stroke="#334155" stroke-width="1.5" />
    <text x="${(width-180)/2}" y="32" font-family="system-ui, Cairo, sans-serif" font-size="13" font-weight="bold" fill="#e2e8f0" text-anchor="middle">تم إنتاج هذا المخطط التعليمي بدقة لمساعدة الطالب على الحفظ والتذكر البصري.</text>
    <text x="${(width-180)/2}" y="54" font-family="system-ui, Cairo, sans-serif" font-size="11" font-weight="bold" fill="#10b981" text-anchor="middle">منصة عائلة حنيش التعليمية 2026 · استوديو الوسائل الذكية</text>
  </g>
</svg>`
  };
}
