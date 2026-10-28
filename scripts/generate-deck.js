import pptxgenjs from 'pptxgenjs';
import fs from 'fs';
import path from 'path';

async function generate() {
  const pptx = new pptxgenjs();

  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Arshad Basha Momin & Team';
  pptx.company = 'KisanDr - AI AgriTech Solutions';
  pptx.title = 'KisanDr — AI Crop Disease Scanner & Voice Assistant Pitch Deck';
  pptx.subject = 'Agricultural AI Innovation & Crop Pathology';

  const C_EMERALD_DARK = '064E3B';
  const C_EMERALD_MED = '059669';
  const C_SLATE_DARK = '0F172A';
  const C_SLATE_MUTED = '475569';
  const C_SLATE_BG = 'F8FAFC';
  const C_WHITE = 'FFFFFF';

  const addSlideHeader = (
    slide,
    slideNum,
    tag,
    title,
    subtitle
  ) => {
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: '100%',
      h: 0.12,
      fill: { color: C_EMERALD_MED },
    });

    slide.addText(tag.toUpperCase(), {
      x: 0.8,
      y: 0.45,
      w: 8.0,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: C_EMERALD_MED,
      fontFace: 'Arial',
      charSpacing: 2,
    });

    slide.addText(title, {
      x: 0.8,
      y: 0.75,
      w: 11.5,
      h: 0.65,
      fontSize: 24,
      bold: true,
      color: C_SLATE_DARK,
      fontFace: 'Arial',
    });

    slide.addText(subtitle, {
      x: 0.8,
      y: 1.35,
      w: 11.5,
      h: 0.4,
      fontSize: 12,
      color: C_SLATE_MUTED,
      fontFace: 'Arial',
    });

    slide.addText('KisanDr • AI Crop Disease Scanner & Voice Assistant', {
      x: 0.8,
      y: 7.05,
      w: 8.0,
      h: 0.3,
      fontSize: 9,
      color: '94A3B8',
      fontFace: 'Arial',
    });

    slide.addText(`Slide ${slideNum} of 7`, {
      x: 10.5,
      y: 7.05,
      w: 2.0,
      h: 0.3,
      fontSize: 9,
      align: 'right',
      color: '94A3B8',
      fontFace: 'Arial',
    });
  };

  // ==========================================
  // SLIDE 1: Headline & Names (Title Slide)
  // ==========================================
  const slide1 = pptx.addSlide();
  slide1.background = { color: C_EMERALD_DARK };

  slide1.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 0.8,
    w: 11.7,
    h: 5.9,
    rectRadius: 0.2,
    fill: { color: '0A5C46' },
    line: { color: '10B981', width: 1 },
  });

  slide1.addText('AGRITECH INNOVATION PITCH • 2026', {
    x: 1.3,
    y: 1.3,
    w: 8.0,
    h: 0.35,
    fontSize: 11,
    bold: true,
    color: '6EE7B7',
    fontFace: 'Arial',
    charSpacing: 2,
  });

  slide1.addText('KisanDr (किसान डॉक्टर)', {
    x: 1.3,
    y: 1.7,
    w: 10.5,
    h: 1.1,
    fontSize: 42,
    bold: true,
    color: C_WHITE,
    fontFace: 'Arial',
  });

  slide1.addText('AI Crop Disease Scanner & Real-Time Multilingual Voice Doctor', {
    x: 1.3,
    y: 2.75,
    w: 10.5,
    h: 0.6,
    fontSize: 20,
    color: 'A7F3D0',
    fontFace: 'Arial',
  });

  slide1.addText(
    'Empowering 100M+ smallholder farmers with instant multimodal plant pathology diagnosis, localized seasonal context, and hands-free voice advisory in 7 native languages — with zero friction and zero login required.',
    {
      x: 1.3,
      y: 3.45,
      w: 10.5,
      h: 0.9,
      fontSize: 13,
      color: 'E2E8F0',
      fontFace: 'Arial',
      lineSpacing: 18,
    }
  );

  slide1.addShape(pptx.ShapeType.rect, {
    x: 1.3,
    y: 4.6,
    w: 10.5,
    h: 1.6,
    fill: { color: '043B2C' },
    line: { color: '059669', width: 1 },
  });

  slide1.addText('PROJECT LEAD & PRESENTERS', {
    x: 1.6,
    y: 4.8,
    w: 4.5,
    h: 0.3,
    fontSize: 10,
    bold: true,
    color: '34D399',
    fontFace: 'Arial',
    charSpacing: 1,
  });

  slide1.addText('Arshad Basha Momin & Team', {
    x: 1.6,
    y: 5.15,
    w: 4.5,
    h: 0.45,
    fontSize: 16,
    bold: true,
    color: C_WHITE,
    fontFace: 'Arial',
  });

  slide1.addText('Full-Stack AI & AgriTech Solutions Group\narshadbashamomin@gmail.com', {
    x: 1.6,
    y: 5.6,
    w: 4.5,
    h: 0.45,
    fontSize: 10,
    color: '94A3B8',
    fontFace: 'Arial',
  });

  slide1.addText('DEPLOYMENT & SPECS', {
    x: 6.8,
    y: 4.8,
    w: 4.5,
    h: 0.3,
    fontSize: 10,
    bold: true,
    color: '34D399',
    fontFace: 'Arial',
    charSpacing: 1,
  });

  slide1.addText('• 100% Mobile Optimized PWA\n• Zero Login / Frictionless Field Access\n• 7 Regional Indian Languages', {
    x: 6.8,
    y: 5.15,
    w: 4.7,
    h: 0.9,
    fontSize: 11,
    color: 'E2E8F0',
    fontFace: 'Arial',
    lineSpacing: 16,
  });

  // ==========================================
  // SLIDE 2: Introduction (The Problem)
  // ==========================================
  const slide2 = pptx.addSlide();
  slide2.background = { color: C_SLATE_BG };
  addSlideHeader(
    slide2,
    2,
    'The Agricultural Crisis',
    'Introduction: The Hidden Cost of Crop Diseases',
    'Smallholder farmers lose an estimated 20% to 40% of their annual yield to preventable crop blights.'
  );

  const pCards = [
    {
      title: 'Devastating Crop Losses',
      stat: '20% - 40%',
      desc: 'Global annual harvest destroyed by plant blights, pathogens, and insect infestations ($220B+ annual economic impact).',
      highlight: 'Global Yield Loss',
    },
    {
      title: 'Agronomist Shortage',
      stat: '1 : 12,000',
      desc: 'Extension agent to farmer ratio across rural belts. Physical visits take days or weeks — far too late for fast-spreading fungal spores.',
      highlight: 'Delayed Diagnosis',
    },
    {
      title: 'Language & Literacy Barrier',
      stat: '7+ Languages',
      desc: 'Most agriculture apps require English typing and complex accounts, alienating millions of illiterate or regional-first field farmers.',
      highlight: 'Digital Divide',
    },
    {
      title: 'Excessive Chemical Guesswork',
      stat: '₹8,500/Acre',
      desc: 'Farmers spray expensive, incorrect chemical fungicides out of panic, poisoning groundwater and eroding their razor-thin margins.',
      highlight: 'Wasteful Spraying',
    },
  ];

  pCards.forEach((c, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const xPos = 0.8 + col * 5.9;
    const yPos = 1.95 + row * 2.4;

    slide2.addShape(pptx.ShapeType.roundRect, {
      x: xPos,
      y: yPos,
      w: 5.6,
      h: 2.2,
      rectRadius: 0.15,
      fill: { color: C_WHITE },
      line: { color: 'E2E8F0', width: 1 },
    });

    slide2.addText(c.stat, {
      x: xPos + 0.3,
      y: yPos + 0.25,
      w: 2.5,
      h: 0.5,
      fontSize: 22,
      bold: true,
      color: C_EMERALD_MED,
      fontFace: 'Arial',
    });

    slide2.addText(c.highlight.toUpperCase(), {
      x: xPos + 2.8,
      y: yPos + 0.35,
      w: 2.5,
      h: 0.3,
      fontSize: 9,
      bold: true,
      align: 'right',
      color: '64748B',
      fontFace: 'Arial',
    });

    slide2.addText(c.title, {
      x: xPos + 0.3,
      y: yPos + 0.8,
      w: 5.0,
      h: 0.4,
      fontSize: 14,
      bold: true,
      color: C_SLATE_DARK,
      fontFace: 'Arial',
    });

    slide2.addText(c.desc, {
      x: xPos + 0.3,
      y: yPos + 1.25,
      w: 5.0,
      h: 0.8,
      fontSize: 11,
      color: C_SLATE_MUTED,
      fontFace: 'Arial',
      lineSpacing: 15,
    });
  });

  // ==========================================
  // SLIDE 3: Abstract (The Solution)
  // ==========================================
  const slide3 = pptx.addSlide();
  slide3.background = { color: C_SLATE_BG };
  addSlideHeader(
    slide3,
    3,
    'Executive Summary',
    'Abstract: A Voice-First Agricultural AI Doctor',
    'KisanDr bridges the agricultural expertise gap by delivering instant leaf pathology & regional voice advice.'
  );

  slide3.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 1.95,
    w: 5.8,
    h: 4.85,
    rectRadius: 0.2,
    fill: { color: C_EMERALD_DARK },
  });

  slide3.addText('CORE PRODUCT PHILOSOPHY', {
    x: 1.2,
    y: 2.3,
    w: 5.0,
    h: 0.3,
    fontSize: 10,
    bold: true,
    color: '6EE7B7',
    fontFace: 'Arial',
    charSpacing: 1.5,
  });

  slide3.addText('Turn Every Smartphone Into a Certified Agronomist Clinic', {
    x: 1.2,
    y: 2.65,
    w: 5.0,
    h: 0.9,
    fontSize: 20,
    bold: true,
    color: C_WHITE,
    fontFace: 'Arial',
  });

  slide3.addText(
    'KisanDr removes all technical friction for rural communities. With zero logins, zero passwords, and zero account setup, farmers simply open the app, point their camera at infected foliage, and receive an instant plant pathology verdict backed by verified agronomic models.\n\nGoing beyond static text sheets, KisanDr integrates bidirectional voice interaction in 7 native languages (Hindi, Kannada, Telugu, Tamil, Marathi, Bengali, English). Farmers can talk to the AI as naturally as consulting an expert friend standing in their field.',
    {
      x: 1.2,
      y: 3.65,
      w: 5.0,
      h: 2.8,
      fontSize: 12,
      color: 'E2E8F0',
      fontFace: 'Arial',
      lineSpacing: 18,
    }
  );

  const pillars = [
    {
      badge: 'PILLAR 1',
      title: 'Multimodal Pathology Engine',
      desc: 'State-of-the-art vision models recognize crops, fungal blights, bacterial cankers, and nutrient deficiencies. Includes rigorous anti-hallucination checks that reject blurry or non-plant images.',
    },
    {
      badge: 'PILLAR 2',
      title: 'Location & Seasonal Intelligence',
      desc: 'Browser geolocation and harvest calendars correlate local humidity and weather (e.g. monsoon moisture driving Early Blight in Karnataka) for regionally accurate treatment plans.',
    },
    {
      badge: 'PILLAR 3',
      title: 'Hands-Free Regional Voice AI',
      desc: 'Natural, spoken question-and-answer interface allowing farmers to ask questions verbally and receive concise, 1-2 sentence actionable answers in their mother tongue.',
    },
  ];

  pillars.forEach((p, idx) => {
    const yP = 1.95 + idx * 1.62;

    slide3.addShape(pptx.ShapeType.roundRect, {
      x: 6.9,
      y: yP,
      w: 5.6,
      h: 1.48,
      rectRadius: 0.15,
      fill: { color: C_WHITE },
      line: { color: 'E2E8F0', width: 1 },
    });

    slide3.addText(p.badge, {
      x: 7.2,
      y: yP + 0.18,
      w: 2.0,
      h: 0.25,
      fontSize: 9,
      bold: true,
      color: C_EMERALD_MED,
      fontFace: 'Arial',
    });

    slide3.addText(p.title, {
      x: 7.2,
      y: yP + 0.42,
      w: 5.0,
      h: 0.35,
      fontSize: 13,
      bold: true,
      color: C_SLATE_DARK,
      fontFace: 'Arial',
    });

    slide3.addText(p.desc, {
      x: 7.2,
      y: yP + 0.78,
      w: 5.0,
      h: 0.6,
      fontSize: 10,
      color: C_SLATE_MUTED,
      fontFace: 'Arial',
      lineSpacing: 13,
    });
  });

  // ==========================================
  // SLIDE 4: Benefits & Usage (Part 1)
  // ==========================================
  const slide4 = pptx.addSlide();
  slide4.background = { color: C_SLATE_BG };
  addSlideHeader(
    slide4,
    4,
    'Value Proposition',
    'Benefits & Usage (1/2): Agronomic & User Advantages',
    'Engineered specifically for rural field constraints, low connectivity, and diverse literacy levels.'
  );

  const bCards = [
    {
      title: 'Instant Sub-Second Diagnosis',
      desc: 'Detects diseases, severity level (Low, Medium, Critical), visible leaf symptoms, and nutrient deficiencies with confidence scoring.',
      tag: 'Speed & Precision',
    },
    {
      title: 'Anti-Hallucination Safe Mode',
      desc: 'Strict rejection safeguards: If the photo is out of focus, poorly lit, or not a crop, the AI refuses to guess and guides the user to retake.',
      tag: 'Clinical Safety',
    },
    {
      title: 'Organic-First Treatment Plans',
      desc: 'Prioritizes biological remedies (Neem formulations, Trichoderma viride, crop hygiene) before recommending hazardous chemical sprays.',
      tag: 'Sustainable Farming',
    },
    {
      title: 'Contextual Geo-Awareness',
      desc: 'Uses anonymous browser geolocation to map disease vectors to local agro-climatic zones and seasonal Kharif/Rabi cycles without tracking.',
      tag: 'Privacy Preserved',
    },
    {
      title: '7 Regional Spoken Languages',
      desc: 'Fluid voice conversations in English, Hindi, Kannada, Telugu, Tamil, Marathi, and Bengali. Farmers speak and listen in their native tongue.',
      tag: 'True Inclusivity',
    },
    {
      title: 'Zero Barrier Web Access',
      desc: 'No app store download, no login, no passwords. Operates immediately on any smartphone browser in field conditions.',
      tag: 'Zero Friction',
    },
  ];

  bCards.forEach((b, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const xPos = 0.8 + col * 3.93;
    const yPos = 1.95 + row * 2.45;

    slide4.addShape(pptx.ShapeType.roundRect, {
      x: xPos,
      y: yPos,
      w: 3.73,
      h: 2.25,
      rectRadius: 0.15,
      fill: { color: C_WHITE },
      line: { color: 'E2E8F0', width: 1 },
    });

    slide4.addText(b.tag.toUpperCase(), {
      x: xPos + 0.25,
      y: yPos + 0.22,
      w: 3.2,
      h: 0.25,
      fontSize: 8,
      bold: true,
      color: C_EMERALD_MED,
      fontFace: 'Arial',
    });

    slide4.addText(b.title, {
      x: xPos + 0.25,
      y: yPos + 0.5,
      w: 3.2,
      h: 0.45,
      fontSize: 12,
      bold: true,
      color: C_SLATE_DARK,
      fontFace: 'Arial',
    });

    slide4.addText(b.desc, {
      x: xPos + 0.25,
      y: yPos + 1.0,
      w: 3.2,
      h: 1.1,
      fontSize: 10,
      color: C_SLATE_MUTED,
      fontFace: 'Arial',
      lineSpacing: 14,
    });
  });

  // ==========================================
  // SLIDE 5: Benefits & Usage (Part 2)
  // ==========================================
  const slide5 = pptx.addSlide();
  slide5.background = { color: C_SLATE_BG };
  addSlideHeader(
    slide5,
    5,
    'Real-World Impact',
    'Benefits & Usage (2/2): Field Workflow & Economic ROI',
    'How KisanDr creates quantifiable economic savings for farmers and protects national food security.'
  );

  slide5.addText('3-STEP FARMER WORKFLOW', {
    x: 0.8,
    y: 1.95,
    w: 5.0,
    h: 0.3,
    fontSize: 10,
    bold: true,
    color: C_EMERALD_MED,
    fontFace: 'Arial',
    charSpacing: 1,
  });

  const steps = [
    {
      num: '01',
      title: 'Scan Plant in Field',
      desc: 'Farmer takes a photo with their phone camera or uploads an existing image. Browser auto-detects season & region.',
    },
    {
      num: '02',
      title: 'Instant AI Diagnosis',
      desc: 'Multimodal vision model generates clear report: crop type, pathogen name, severity, visible symptoms & immediate steps.',
    },
    {
      num: '03',
      title: 'Hands-Free Voice Q&A',
      desc: 'Farmer speaks naturally in their mother tongue ("Is it dangerous?", "What spray should I use?") and gets instant verbal guidance.',
    },
  ];

  steps.forEach((s, idx) => {
    const xPos = 0.8 + idx * 3.93;
    slide5.addShape(pptx.ShapeType.roundRect, {
      x: xPos,
      y: 2.3,
      w: 3.73,
      h: 1.95,
      rectRadius: 0.15,
      fill: { color: C_WHITE },
      line: { color: 'E2E8F0', width: 1 },
    });

    slide5.addText(s.num, {
      x: xPos + 0.25,
      y: 2.5,
      w: 1.0,
      h: 0.4,
      fontSize: 18,
      bold: true,
      color: C_EMERALD_MED,
      fontFace: 'Arial',
    });

    slide5.addText(s.title, {
      x: xPos + 0.85,
      y: 2.52,
      w: 2.6,
      h: 0.35,
      fontSize: 12,
      bold: true,
      color: C_SLATE_DARK,
      fontFace: 'Arial',
    });

    slide5.addText(s.desc, {
      x: xPos + 0.25,
      y: 2.95,
      w: 3.2,
      h: 1.1,
      fontSize: 10,
      color: C_SLATE_MUTED,
      fontFace: 'Arial',
      lineSpacing: 14,
    });
  });

  slide5.addText('MEASURABLE ECONOMIC & SOCIAL ROI', {
    x: 0.8,
    y: 4.45,
    w: 6.0,
    h: 0.3,
    fontSize: 10,
    bold: true,
    color: C_EMERALD_MED,
    fontFace: 'Arial',
    charSpacing: 1,
  });

  const impacts = [
    {
      stat: '35% - 50%',
      label: 'Crop Salvaged',
      sub: 'Early stage detection halts blight contagion before irreversible crop loss occurs.',
    },
    {
      stat: '₹4,000 - ₹9,000',
      label: 'Input Cost Savings',
      sub: 'Eliminates wasteful purchases of unneeded broad-spectrum pesticides & fungicides.',
    },
    {
      stat: 'Zero Seconds',
      label: 'Instant Access',
      sub: 'Eliminates technical barriers: no app store login or registration delays in the field.',
    },
    {
      stat: '7 Languages',
      label: 'Vernacular Reach',
      sub: 'Directly addresses rural literacy disparities through spoken voice interaction.',
    },
  ];

  impacts.forEach((imp, idx) => {
    const xPos = 0.8 + idx * 2.95;
    slide5.addShape(pptx.ShapeType.roundRect, {
      x: xPos,
      y: 4.8,
      w: 2.75,
      h: 1.95,
      rectRadius: 0.15,
      fill: { color: C_EMERALD_DARK },
    });

    slide5.addText(imp.stat, {
      x: xPos + 0.2,
      y: 4.95,
      w: 2.35,
      h: 0.45,
      fontSize: 16,
      bold: true,
      color: '6EE7B7',
      fontFace: 'Arial',
    });

    slide5.addText(imp.label, {
      x: xPos + 0.2,
      y: 5.4,
      w: 2.35,
      h: 0.3,
      fontSize: 11,
      bold: true,
      color: C_WHITE,
      fontFace: 'Arial',
    });

    slide5.addText(imp.sub, {
      x: xPos + 0.2,
      y: 5.75,
      w: 2.35,
      h: 0.85,
      fontSize: 9,
      color: 'D1FAE5',
      fontFace: 'Arial',
      lineSpacing: 13,
    });
  });

  // ==========================================
  // SLIDE 6: Tech Stack
  // ==========================================
  const slide6 = pptx.addSlide();
  slide6.background = { color: C_SLATE_BG };
  addSlideHeader(
    slide6,
    6,
    'System Architecture',
    'Tech Stack: Modern Full-Stack & Multimodal Pipeline',
    'High-performance, zero-latency cloud architecture designed for responsive mobile browser performance.'
  );

  const stackBlocks = [
    {
      layer: 'FRONTEND CLIENT LAYER',
      title: 'React 19 + TypeScript + Tailwind CSS',
      items: [
        'Responsive mobile-first single page app built on modern Vite bundling',
        'Tailwind CSS v4 for clean, high-contrast field visibility in sunlight',
        'HTML5 MediaDevices Camera API with dual back/front camera viewfinder',
        'Web Audio API & Web Speech API for seamless in-browser voice recognition',
      ],
    },
    {
      layer: 'MULTIMODAL AI & VISION LAYER',
      title: 'Google GenAI SDK & Gemini Multimodal',
      items: [
        'Gemini Vision Models with strict JSON schema enforcement for diagnostic data',
        'Anti-hallucination verification filters guarding against non-plant inputs',
        'Gemini Live API real-time bidirectional streaming for spoken conversation',
        'Minimal-latency inference pipeline responding in natural conversational speech',
      ],
    },
    {
      layer: 'BACKEND SERVICES LAYER',
      title: 'Full-Stack Express + Node.js Environment',
      items: [
        'Secure server-side API proxy protecting API keys with telemetry headers',
        '25MB high-resolution camera photo intake with automatic MIME sanitization',
        'Multi-model automatic fallback architecture ensuring 99.9% uptime resilience',
        'Zero-database ephemeral architecture ensuring zero user tracking or data leaks',
      ],
    },
    {
      layer: 'LOCALIZATION & PRIVACY LAYER',
      title: 'Geolocation API & Vernacular Engine',
      items: [
        'Browser Geolocation with OpenStreetMap reverse-geocoding for district context',
        'Seasonal calendar correlation (Kharif, Rabi, Zaid, Monsoon humidity triggers)',
        'Multi-language vernacular engine supporting 7 regional Indian languages',
        '100% ephemeral session privacy (user location is never stored or tracked)',
      ],
    },
  ];

  stackBlocks.forEach((sb, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const xPos = 0.8 + col * 5.9;
    const yPos = 1.95 + row * 2.45;

    slide6.addShape(pptx.ShapeType.roundRect, {
      x: xPos,
      y: yPos,
      w: 5.6,
      h: 2.25,
      rectRadius: 0.15,
      fill: { color: C_WHITE },
      line: { color: 'E2E8F0', width: 1 },
    });

    slide6.addText(sb.layer, {
      x: xPos + 0.3,
      y: yPos + 0.2,
      w: 5.0,
      h: 0.25,
      fontSize: 9,
      bold: true,
      color: C_EMERALD_MED,
      fontFace: 'Arial',
    });

    slide6.addText(sb.title, {
      x: xPos + 0.3,
      y: yPos + 0.45,
      w: 5.0,
      h: 0.35,
      fontSize: 13,
      bold: true,
      color: C_SLATE_DARK,
      fontFace: 'Arial',
    });

    const bulletText = sb.items.map((item) => `• ${item}`).join('\n');
    slide6.addText(bulletText, {
      x: xPos + 0.3,
      y: yPos + 0.85,
      w: 5.0,
      h: 1.25,
      fontSize: 10,
      color: C_SLATE_MUTED,
      fontFace: 'Arial',
      lineSpacing: 14,
    });
  });

  // ==========================================
  // SLIDE 7: Thank You & Contact
  // ==========================================
  const slide7 = pptx.addSlide();
  slide7.background = { color: C_EMERALD_DARK };

  slide7.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 0.8,
    w: 11.7,
    h: 5.9,
    rectRadius: 0.2,
    fill: { color: '0A5C46' },
    line: { color: '10B981', width: 1 },
  });

  slide7.addText('VISION FOR THE FUTURE OF AGRICULTURE', {
    x: 1.3,
    y: 1.3,
    w: 8.0,
    h: 0.35,
    fontSize: 11,
    bold: true,
    color: '6EE7B7',
    fontFace: 'Arial',
    charSpacing: 2,
  });

  slide7.addText('Thank You!', {
    x: 1.3,
    y: 1.7,
    w: 10.5,
    h: 1.0,
    fontSize: 46,
    bold: true,
    color: C_WHITE,
    fontFace: 'Arial',
  });

  slide7.addText('Together, Protecting the Hands That Feed the World', {
    x: 1.3,
    y: 2.7,
    w: 10.5,
    h: 0.5,
    fontSize: 18,
    color: 'A7F3D0',
    fontFace: 'Arial',
  });

  slide7.addText(
    'KisanDr demonstrates that cutting-edge AI does not need complex enterprise barriers to create transformative human value. By eliminating sign-up friction and speaking the language of the farmer, we can save millions of tonnes of vital food crops each season.',
    {
      x: 1.3,
      y: 3.3,
      w: 10.5,
      h: 0.9,
      fontSize: 12,
      color: 'E2E8F0',
      fontFace: 'Arial',
      lineSpacing: 18,
    }
  );

  slide7.addShape(pptx.ShapeType.rect, {
    x: 1.3,
    y: 4.4,
    w: 5.0,
    h: 1.8,
    fill: { color: '043B2C' },
    line: { color: '059669', width: 1 },
  });

  slide7.addText('UPCOMING ROADMAP', {
    x: 1.5,
    y: 4.55,
    w: 4.5,
    h: 0.25,
    fontSize: 10,
    bold: true,
    color: '34D399',
    fontFace: 'Arial',
  });

  slide7.addText(
    '• On-device lightweight edge inference for offline fields\n• Live weather radar alerts for fungal spore outbreaks\n• One-touch escalation to local Krishi Vigyan Kendra (KVK)',
    {
      x: 1.5,
      y: 4.85,
      w: 4.6,
      h: 1.2,
      fontSize: 10,
      color: 'E2E8F0',
      fontFace: 'Arial',
      lineSpacing: 15,
    }
  );

  slide7.addShape(pptx.ShapeType.rect, {
    x: 6.8,
    y: 4.4,
    w: 5.0,
    h: 1.8,
    fill: { color: '043B2C' },
    line: { color: '059669', width: 1 },
  });

  slide7.addText('CONTACT & DEMO', {
    x: 7.0,
    y: 4.55,
    w: 4.5,
    h: 0.25,
    fontSize: 10,
    bold: true,
    color: '34D399',
    fontFace: 'Arial',
  });

  slide7.addText(
    '• Email: arshadbashamomin@gmail.com\n• Live Web App: KisanDr AI Crop Scanner\n• Questions & Answers: We welcome your feedback!',
    {
      x: 7.0,
      y: 4.85,
      w: 4.6,
      h: 1.2,
      fontSize: 10,
      color: 'E2E8F0',
      fontFace: 'Arial',
      lineSpacing: 15,
    }
  );

  const outDir = path.resolve('public');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, 'KisanDr_AI_Crop_Pitch_Deck.pptx');
  await pptx.writeFile({ fileName: outPath });
  console.log('Successfully generated PPTX at:', outPath);
}

generate().catch(console.error);
