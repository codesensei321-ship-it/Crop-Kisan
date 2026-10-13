export interface SampleCrop {
  id: string;
  name: string;
  label: string;
  crop: string;
  expectedCondition: string;
  description: string;
  dataUrl: string;
}

export function rasterizeSvgToPngDataUrl(svgDataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(svgDataUrl);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#1a202c';
          ctx.fillRect(0, 0, 400, 400);
          ctx.drawImage(img, 0, 0, 400, 400);
          resolve(canvas.toDataURL('image/png'));
          return;
        }
      } catch (e) {
        console.warn('Canvas rasterize error:', e);
      }
      resolve(svgDataUrl);
    };
    img.onerror = () => resolve(svgDataUrl);
    img.src = svgDataUrl;
  });
}

// Generate realistic SVG vector plant representations encoded as data URLs
function createLeafSvgDataUrl(type: 'tomato_early_blight' | 'rice_blast' | 'corn_leaf_blight' | 'healthy_chilli' | 'unclear_desk'): string {
  let svgContent = '';

  if (type === 'tomato_early_blight') {
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <defs>
        <radialGradient id="bg" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stop-color="#2d3748"/>
          <stop offset="100%" stop-color="#1a202c"/>
        </radialGradient>
        <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#48bb78"/>
          <stop offset="50%" stop-color="#2f855a"/>
          <stop offset="100%" stop-color="#22543d"/>
        </linearGradient>
        <radialGradient id="blightSpot" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#2c1810"/>
          <stop offset="40%" stop-color="#5c3818"/>
          <stop offset="70%" stop-color="#8a5e24"/>
          <stop offset="100%" stop-color="#ecc94b"/>
        </radialGradient>
      </defs>
      <rect width="400" height="400" fill="url(#bg)"/>
      <g transform="translate(200, 200) rotate(-15) translate(-200, -200)">
        <!-- Stem -->
        <path d="M 200 370 Q 200 240 200 50" stroke="#276749" stroke-width="8" stroke-linecap="round" fill="none"/>
        <path d="M 200 280 Q 260 250 310 230" stroke="#276749" stroke-width="4" stroke-linecap="round" fill="none"/>
        <path d="M 200 220 Q 130 190 80 170" stroke="#276749" stroke-width="4" stroke-linecap="round" fill="none"/>
        
        <!-- Main Leaf Blade -->
        <path d="M 200 60 C 270 110 320 200 290 280 C 260 340 200 360 200 360 C 200 360 140 340 110 280 C 80 200 130 110 200 60 Z" fill="url(#leafGrad)" stroke="#1c4532" stroke-width="3"/>
        
        <!-- Veins -->
        <path d="M 200 60 L 200 360" stroke="#68d391" stroke-width="3" stroke-linecap="round"/>
        <path d="M 200 140 Q 250 120 280 130" stroke="#68d391" stroke-width="2" fill="none"/>
        <path d="M 200 180 Q 140 160 115 170" stroke="#68d391" stroke-width="2" fill="none"/>
        <path d="M 200 220 Q 250 200 275 220" stroke="#68d391" stroke-width="2" fill="none"/>
        <path d="M 200 260 Q 145 250 125 270" stroke="#68d391" stroke-width="2" fill="none"/>
        
        <!-- Early Blight Concentric Rings Lesions -->
        <circle cx="160" cy="190" r="28" fill="url(#blightSpot)"/>
        <circle cx="160" cy="190" r="18" fill="none" stroke="#1a110b" stroke-width="2"/>
        <circle cx="160" cy="190" r="9" fill="none" stroke="#2c1810" stroke-width="2"/>
        
        <circle cx="235" cy="240" r="34" fill="url(#blightSpot)"/>
        <circle cx="235" cy="240" r="22" fill="none" stroke="#1a110b" stroke-width="2"/>
        <circle cx="235" cy="240" r="12" fill="none" stroke="#2c1810" stroke-width="2"/>
        
        <circle cx="180" cy="290" r="22" fill="url(#blightSpot)"/>
        <circle cx="220" cy="140" r="16" fill="url(#blightSpot)"/>
        
        <!-- Chlorotic Yellow Halo -->
        <path d="M 230 200 Q 280 230 260 280 Q 210 270 200 230 Z" fill="#d69e2e" opacity="0.4"/>
      </g>
      <text x="20" y="380" font-family="sans-serif" font-size="14" font-weight="bold" fill="#a0aec0">KisanDr Specimen: Tomato Early Blight</text>
    </svg>`;
  } else if (type === 'rice_blast') {
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <defs>
        <radialGradient id="bg2" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stop-color="#1a202c"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </radialGradient>
        <linearGradient id="paddyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#38a169"/>
          <stop offset="50%" stop-color="#48bb78"/>
          <stop offset="100%" stop-color="#2f855a"/>
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill="url(#bg2)"/>
      <g transform="translate(200, 200) rotate(10) translate(-200, -200)">
        <!-- Long Slender Rice Blade -->
        <path d="M 190 380 Q 185 200 170 30 C 185 30 220 180 215 380 Z" fill="url(#paddyGrad)"/>
        <line x1="195" y1="380" x2="180" y2="30" stroke="#9ae6b4" stroke-width="2"/>
        
        <!-- Spindle / Diamond Shaped Blast Lesions with Grey Ash Center and Brown Margin -->
        <g transform="translate(188, 140)">
          <!-- Outer brown margin -->
          <path d="M 0 -35 C 18 -10 18 10 0 35 C -18 10 -18 -10 0 -35 Z" fill="#744210"/>
          <!-- Yellow halo -->
          <path d="M 0 -42 C 24 -12 24 12 0 42 C -24 12 -24 -12 0 -42 Z" fill="#d69e2e" opacity="0.3"/>
          <!-- Ash grey necrotic center -->
          <path d="M 0 -22 C 10 -6 10 6 0 22 C -10 6 -10 -6 0 -22 Z" fill="#e2e8f0"/>
        </g>
        
        <g transform="translate(193, 230) scale(0.8)">
          <path d="M 0 -35 C 18 -10 18 10 0 35 C -18 10 -18 -10 0 -35 Z" fill="#744210"/>
          <path d="M 0 -22 C 10 -6 10 6 0 22 C -10 6 -10 -6 0 -22 Z" fill="#cbd5e1"/>
        </g>
        
        <g transform="translate(185, 290) scale(0.6)">
          <path d="M 0 -30 C 15 -8 15 8 0 30 C -15 8 -15 -8 0 -30 Z" fill="#744210"/>
          <path d="M 0 -18 C 8 -5 8 5 0 18 C -8 5 -8 -5 0 -18 Z" fill="#cbd5e1"/>
        </g>
      </g>
      <text x="20" y="380" font-family="sans-serif" font-size="14" font-weight="bold" fill="#a0aec0">KisanDr Specimen: Paddy Rice Blast</text>
    </svg>`;
  } else if (type === 'corn_leaf_blight') {
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <defs>
        <radialGradient id="bg3" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stop-color="#1f2937"/>
          <stop offset="100%" stop-color="#111827"/>
        </radialGradient>
        <linearGradient id="cornGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#2d7a4c"/>
          <stop offset="50%" stop-color="#48bb78"/>
          <stop offset="100%" stop-color="#276749"/>
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill="url(#bg3)"/>
      <g transform="translate(200, 200) rotate(-5) translate(-200, -200)">
        <!-- Broad Maize Blade -->
        <path d="M 130 390 C 140 220 160 120 200 20 C 240 120 260 220 270 390 Z" fill="url(#cornGrad)"/>
        <line x1="200" y1="20" x2="200" y2="390" stroke="#9ae6b4" stroke-width="4"/>
        
        <!-- Cigar-shaped elongated tan/grey lesions (Northern Corn Leaf Blight) -->
        <rect x="145" y="120" width="35" height="110" rx="16" fill="#c09a6f" stroke="#78350f" stroke-width="2" transform="rotate(-3, 160, 175)"/>
        <rect x="152" y="130" width="22" height="90" rx="10" fill="#e5e7eb" opacity="0.8" transform="rotate(-3, 160, 175)"/>
        
        <rect x="215" y="190" width="38" height="130" rx="18" fill="#c09a6f" stroke="#78350f" stroke-width="2" transform="rotate(4, 230, 255)"/>
        <rect x="222" y="205" width="24" height="100" rx="12" fill="#e5e7eb" opacity="0.8" transform="rotate(4, 230, 255)"/>
      </g>
      <text x="20" y="380" font-family="sans-serif" font-size="14" font-weight="bold" fill="#a0aec0">KisanDr Specimen: Corn Leaf Blight</text>
    </svg>`;
  } else if (type === 'healthy_chilli') {
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <defs>
        <radialGradient id="bg4" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stop-color="#111827"/>
          <stop offset="100%" stop-color="#030712"/>
        </radialGradient>
        <linearGradient id="healthyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#10b981"/>
          <stop offset="60%" stop-color="#059669"/>
          <stop offset="100%" stop-color="#047857"/>
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill="url(#bg4)"/>
      <g transform="translate(200, 200) rotate(5) translate(-200, -200)">
        <!-- Beautiful vibrant healthy chili pepper leaf -->
        <path d="M 200 40 C 270 100 310 190 270 290 C 240 360 200 375 200 375 C 200 375 160 360 130 290 C 90 190 130 100 200 40 Z" fill="url(#healthyGrad)" stroke="#065f46" stroke-width="2"/>
        <!-- Clear healthy green veins -->
        <path d="M 200 40 L 200 375" stroke="#a7f3d0" stroke-width="3" stroke-linecap="round"/>
        <path d="M 200 120 Q 240 100 270 120" stroke="#6ee7b7" stroke-width="2" fill="none"/>
        <path d="M 200 160 Q 150 140 130 160" stroke="#6ee7b7" stroke-width="2" fill="none"/>
        <path d="M 200 210 Q 250 190 270 215" stroke="#6ee7b7" stroke-width="2" fill="none"/>
        <path d="M 200 260 Q 150 240 135 265" stroke="#6ee7b7" stroke-width="2" fill="none"/>
      </g>
      <!-- Small glossy highlight -->
      <ellipse cx="230" cy="180" rx="35" ry="70" fill="#ffffff" opacity="0.12" transform="rotate(25, 230, 180)"/>
      <text x="20" y="380" font-family="sans-serif" font-size="14" font-weight="bold" fill="#34d399">KisanDr Specimen: Healthy Chilli Leaf</text>
    </svg>`;
  } else {
    // Unclear image (e.g., photo of a wooden table/coffee cup without clear plant leaf)
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <rect width="400" height="400" fill="#78350f"/>
      <circle cx="200" cy="200" r="80" fill="#fef3c7" stroke="#b45309" stroke-width="8"/>
      <circle cx="200" cy="200" r="60" fill="#451a03"/>
      <path d="M 280 180 C 310 180 310 220 280 220" stroke="#b45309" stroke-width="8" fill="none"/>
      <text x="20" y="380" font-family="sans-serif" font-size="14" font-weight="bold" fill="#fde68a">Test Image: Office Coffee Mug (Non-Crop)</text>
    </svg>`;
  }

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
}

export const SAMPLE_CROPS: SampleCrop[] = [
  {
    id: 'tomato-early-blight',
    name: 'Tomato Leaf',
    label: 'Tomato Early Blight',
    crop: 'Tomato (Solanum lycopersicum)',
    expectedCondition: 'Early Blight (Alternaria solani)',
    description: 'Target-like dark brown concentric rings with chlorotic yellow halo',
    dataUrl: createLeafSvgDataUrl('tomato_early_blight'),
  },
  {
    id: 'rice-blast',
    name: 'Paddy / Rice Leaf',
    label: 'Rice Blast Disease',
    crop: 'Paddy (Oryza sativa)',
    expectedCondition: 'Rice Blast (Magnaporthe oryzae)',
    description: 'Spindle-shaped diamond lesions with grey center and brown margins',
    dataUrl: createLeafSvgDataUrl('rice_blast'),
  },
  {
    id: 'corn-blight',
    name: 'Maize / Corn Leaf',
    label: 'Corn Leaf Blight',
    crop: 'Corn (Zea mays)',
    expectedCondition: 'Northern Corn Leaf Blight (Exserohilum turcicum)',
    description: 'Elongated cigar-shaped tan lesions along leaf veins',
    dataUrl: createLeafSvgDataUrl('corn_leaf_blight'),
  },
  {
    id: 'healthy-chilli',
    name: 'Chilli Pepper Leaf',
    label: 'Healthy Chilli Leaf',
    crop: 'Chilli Pepper (Capsicum annuum)',
    expectedCondition: 'Healthy / No Pathogen Detected',
    description: 'Vibrant green, unblemished foliage with optimal vigor',
    dataUrl: createLeafSvgDataUrl('healthy_chilli'),
  },
  {
    id: 'unclear-test',
    name: 'Unclear / Non-Plant',
    label: 'Non-Plant Test Image',
    crop: 'Non-Plant Object',
    expectedCondition: 'Unclear Image (Tests rejection accuracy)',
    description: 'Validates that the AI refuses to guess if no crop leaf is present',
    dataUrl: createLeafSvgDataUrl('unclear_desk'),
  },
];
