// All club data lives here. Empty strings mean "not provided yet": the page then shows a visible
// pending marker instead of inventing a value.
import { base } from './url';

export type Day = 'LUN' | 'MAR' | 'MIÉ' | 'JUE' | 'VIE' | 'SÁB';
export type ProgramName = 'Infantil' | 'Juvenil' | 'Adultos' | 'Competición';

export interface Program {
  id: string;
  name: ProgramName;
  focus: string;
  ages: string;
  minor: boolean;
  schedule: Partial<Record<Day, string>>;
  media: { video?: string; poster?: string; position?: string; pending?: string };
  cta: string;
}

export const DAYS: Day[] = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

export const academy = {
  name: 'Club Deportivo de Judo Hikawa',
  whatsappNumber: '+57 315 2036137', // Shown as written; links use the digits only. Empty = WhatsApp CTA disabled.
  contactEmail: '',
  address: 'Cl. 9c Bis #46-139',
  city: 'Cali, Valle del Cauca',
  mapsUrl: 'https://maps.app.goo.gl/wwWNhT8iPRPbXvrH7',
  // Data controller details for the privacy policy (Ley 1581 de 2012). Empty = shown as pending.
  legal: { nit: '', representative: '', policyDate: '28 de octubre de 2026' },
  socials: { instagram: '', facebook: '', tiktok: '' },
  firstClass: '', // 'Gratis' or a price
  whatToBring: '', // what to bring to the first class, in the club's words
  sensei: { name: 'Carlos Riascos', rank: '', philosophy: '', milestones: [] as { year: string; text: string; place: string }[] },
  programs: [
    { id: 'infantil', name: 'Infantil', focus: 'Confianza, coordinación, disciplina y respeto.', ages: '', minor: true, schedule: {}, media: { pending: 'INFANTIL: foto real de clase, plano abierto' }, cta: 'QUIERO ENTRENAR' },
    { id: 'juvenil', name: 'Juvenil', focus: 'Desarrollo técnico, trabajo en equipo y preparación física.', ages: '', minor: true, schedule: {}, media: { video: base + '/video/6253407.mp4', poster: base + '/posters/6253407.webp' }, cta: 'QUIERO ENTRENAR' },
    { id: 'adultos', name: 'Adultos', focus: 'Condición física, seguridad personal y crecimiento.', ages: '', minor: false, schedule: {}, media: { video: base + '/video/6254568.mp4', poster: base + '/posters/6254568.webp', position: '50% 30%' }, cta: 'QUIERO ENTRENAR' },
    { id: 'competicion', name: 'Competición', focus: 'Entrenamiento avanzado y preparación competitiva.', ages: '', minor: false, schedule: {}, media: { video: base + '/video/6253404.mp4', poster: base + '/posters/6253404.webp', position: '50% 45%' }, cta: 'QUIERO COMPETIR' },
  ] as Program[],
  footage: {
    credit: 'Vídeo: Artem Podrez · Pexels (licencia Pexels)',
    page: 'https://www.pexels.com/video/men-doing-judo-6254569/',
  },
};

// The signature throw. Frames were extracted from Pexels 6254569 with scripts/extract-frames.mjs using
// segments 0 to 4.4 s (dense), 4.5 to 7.1 s (sparse ground hold) and 7.2 to 8.88 s, so the scroll spends its
// length on the throw itself. Phase ranges are in frame-progress (0 to 1) and were timed against the
// actual footage: grips 0 to 0.55 s, pull to 1.3 s, entry to 2.0 s, lift and projection to 3.2 s,
// landing and ground control to 7.1 s, tori standing over uke 7.2 to 8.9 s.
export const sequence = {
  desktop: { path: base + '/frames/d/f', count: 120 },
  mobile: { path: base + '/frames/m/f', count: 102 },
  phases: [
    { n: '01', name: 'POSE INICIAL', line: 'No es fuerza bruta. Es control.', note: 'Shizentai: tori y uke frente a frente, atención total antes del contacto.', from: 0, to: 0.096, still: 6 }, // taste-skill-ignore: approved, the order of the throw is the content
    { n: '02', name: 'KUZUSHI', line: 'Lee el movimiento.', note: 'Agarre de manga y solapa. Tracción hacia delante y arriba: uke pierde el equilibrio.', from: 0.096, to: 0.222, still: 19 }, // taste-skill-ignore: approved, the order of the throw is the content
    { n: '03', name: 'TSUKURI', line: 'Encuentra el equilibrio.', note: 'Giro de entrada, espalda pegada a uke, cadera por debajo de la suya.', from: 0.222, to: 0.348, still: 35 }, // taste-skill-ignore: approved, the order of the throw is the content
    { n: '04', name: 'KAKE', line: 'Convierte la técnica en instinto.', note: 'Rotación y proyección: uke pasa por encima de tori.', from: 0.348, to: 0.556, still: 55 }, // taste-skill-ignore: approved, the order of the throw is the content
    { n: '05', name: 'UKEMI', line: 'Caída controlada.', note: 'Uke cae de espaldas y tori mantiene el control.', from: 0.556, to: 0.844, still: 72 }, // taste-skill-ignore: approved, the order of the throw is the content
    { n: '06', name: 'ZANSHIN', line: 'Hikawa.', note: 'Club Deportivo de Judo. La técnica termina en atención y control.', from: 0.844, to: 1, still: 115 }, // taste-skill-ignore: approved, the order of the throw is the content
  ],
  // Camera keys over the source frame: [progress, zoom, centreX, centreY]. Zoom 1 = the crop is as wide
  // as the source (desktop pane) or as tall as the source (phone). Centres are fractions of the source.
  camera: {
    desktop: [
      // Full-bleed: opens tight on the grip (kumikata), pulls back for the throw, settles on zanshin.
      [0, 1.7, 0.47, 0.37], [0.1, 1.55, 0.5, 0.38], [0.22, 1.25, 0.5, 0.4], [0.35, 1.05, 0.5, 0.42],
      [0.48, 1.0, 0.5, 0.42], [0.6, 1.05, 0.5, 0.56], [0.75, 1.15, 0.5, 0.6], [0.86, 1.0, 0.5, 0.55], [1, 1.08, 0.5, 0.52],
    ],
    mobile: [
      [0, 1.0, 0.5, 0.5], [0.2, 1.1, 0.52, 0.45], [0.45, 1.0, 0.5, 0.48], [0.7, 1.08, 0.5, 0.55], [1, 1.0, 0.5, 0.52],
    ],
  },
};

export const values = [
  { name: 'DISCIPLINA', kanji: '規律', lines: ['Se entrena', 'cuando nadie', 'mira.'], text: 'La constancia en el tatami construye el carácter fuera de él.', video: '6253400', caption: 'EN EL VIDEO: JUDOKA AJUSTANDO SU CINTURÓN' },
  { name: 'RESPETO', kanji: '礼', lines: ['Todo empieza', 'y termina con', 'un saludo.'], text: 'El rei es el primer gesto del judo: respeto por el compañero, el sensei y el dojo.', video: '6253406', caption: 'EN EL VIDEO: SALUDO (REI) ANTES DEL ENTRENAMIENTO' },
  { name: 'EQUILIBRIO', kanji: '崩し', lines: ['Quien domina', 'su centro,', 'domina el combate.'], text: 'Kuzushi: romper el equilibrio del otro sin perder el propio.', video: '6254568', caption: 'EN EL VIDEO: AGARRE Y DESEQUILIBRIO EN RANDORI' },
  { name: 'EFICACIA', kanji: '精力善用', lines: ['Máxima eficacia,', 'mínimo', 'esfuerzo.'], text: 'Seiryoku zen’yō, el principio que Jigoro Kano puso en el centro del judo.', video: '6254569', caption: 'EN EL VIDEO: PROYECCIÓN COMPLETA' },
  { name: 'BENEFICIO MUTUO', kanji: '自他共栄', lines: ['Creces', 'cuando crece', 'tu compañero.'], text: 'Jita kyōei: en el dojo nadie progresa solo.', video: '6253401', caption: 'EN EL VIDEO: RANDORI ENTRE COMPAÑEROS' },
  { name: 'CARÁCTER', kanji: '七転八起', lines: ['Caer siete veces.', 'Levantarse', 'ocho.'], text: 'Nana korobi ya oki. Tu camino empieza en Hikawa.', video: '6266891', caption: 'EN EL VIDEO: JUDOKA EN EL TATAMI TRAS UNA CAÍDA', cta: true },
];

export const techs = [
  { id: 'uchi-mata', name: 'UCHI-MATA', kanji: '内股', group: 'NAGE-WAZA · ASHI-WAZA', desc: 'Proyección por el interior del muslo. Una de las técnicas más utilizadas en competición.', keys: ['Kuzushi hacia delante y arriba', 'Giro con la espalda pegada a uke', 'La pierna barre el interior del muslo'] },
  { id: 'seoi-nage', name: 'SEOI-NAGE', kanji: '背負投', group: 'NAGE-WAZA · TE-WAZA', desc: 'Proyección cargando a uke sobre la espalda y el hombro.', keys: ['Entrada baja, rodillas flexionadas', 'Brazo bajo la axila de uke', 'Extensión de piernas y giro del tronco'] },
  { id: 'o-goshi', name: 'O-GOSHI', kanji: '大腰', group: 'NAGE-WAZA · KOSHI-WAZA', desc: 'Gran proyección de cadera. Base para aprender las técnicas de cadera.', keys: ['El brazo rodea la espalda de uke', 'Cadera por debajo de la de uke', 'Elevar con las piernas y girar'] },
  { id: 'osoto-gari', name: 'OSOTO-GARI', kanji: '大外刈', group: 'NAGE-WAZA · ASHI-WAZA', desc: 'Gran siega exterior. Uke cae hacia atrás.', keys: ['Kuzushi hacia atrás, sobre el talón', 'Paso profundo junto a uke', 'Segar la pierna de apoyo desde atrás'] },
  { id: 'tai-otoshi', name: 'TAI-OTOSHI', kanji: '体落', group: 'NAGE-WAZA · TE-WAZA', desc: 'Caída del cuerpo sobre la pierna extendida, sin contacto de cadera.', keys: ['Giro y pierna cruzada ante las tibias de uke', 'Tracción de las manos en arco', 'Uke rueda sobre la pierna de tori'] },
  { id: 'ukemi', name: 'UKEMI', kanji: '受身', group: 'FUNDAMENTOS · USHIRO-UKEMI', desc: 'Caída hacia atrás. Lo primero que se aprende para entrenar con seguridad.', keys: ['Barbilla al pecho', 'Rodar sobre la espalda redondeada', 'Palmear el tatami con los brazos a unos 45°'] },
];

export const pillars = [
  { name: 'Fuerza', text: 'Fuerza máxima y de agarre para dominar el kumikata.', tag: 'AGARRE · TRACCIÓN · BASE' },
  { name: 'Potencia', text: 'Explosividad en la entrada y en la proyección.', tag: 'ENTRADA · ROTACIÓN · KAKE' },
  { name: 'Movilidad', text: 'Rango articular de cadera, hombros y columna para la técnica y la prevención de lesiones.', tag: 'CADERA · HOMBRO · COLUMNA' },
  { name: 'Resistencia', text: 'Capacidad de repetir esfuerzos intensos durante el combate.', tag: 'ESPECÍFICA · RANDORI · SHIAI' },
];

export const levels = [
  { n: 'N1', name: 'INICIACIÓN', w: 25, text: 'Ukemi, postura, desplazamientos y primeras técnicas.' },
  { n: 'N2', name: 'DESARROLLO', w: 50, text: 'Nage-waza y katame-waza fundamentales. Randori controlado.' },
  { n: 'N3', name: 'RENDIMIENTO', w: 75, text: 'Combinaciones, estrategia y preparación física planificada.' },
  { n: 'N4', name: 'ALTO RENDIMIENTO', w: 100, text: 'Planificación anual, competición y análisis de combate.' },
];

export const belts = [
  { grade: '6º KYU', name: 'blanco', bg: '#FFFFFF', stage: 'GRADO DE ALUMNO · KYU' },
  { grade: '5º KYU', name: 'amarillo', bg: '#F2C230', stage: 'GRADO DE ALUMNO · KYU' },
  { grade: '4º KYU', name: 'naranja', bg: '#EE7B22', stage: 'GRADO DE ALUMNO · KYU' },
  { grade: '3º KYU', name: 'verde', bg: '#2E9B4F', stage: 'GRADO DE ALUMNO · KYU' },
  { grade: '2º KYU', name: 'azul', bg: '#2F5FD0', stage: 'GRADO DE ALUMNO · KYU' },
  { grade: '1º KYU', name: 'marrón', bg: '#6B4226', stage: 'GRADO DE ALUMNO · KYU' },
  { grade: '1º a 5º DAN', name: 'negro', bg: '#111111', stage: 'CINTURÓN NEGRO · DAN' },
  { grade: '6º a 8º DAN', name: 'rojo y blanco', bg: 'repeating-linear-gradient(90deg,#E31B23 0 28px,#F5F5F5 28px 56px)', stage: 'ALTO GRADO · DAN' }, // taste-skill-ignore: the real red-and-white belt pattern
  { grade: '9º a 10º DAN', name: 'rojo', bg: '#E31B23', stage: 'ALTO GRADO · DAN' },
];
