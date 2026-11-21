/* Автограф-сессия с ИИ — демо интерфейса станции (планшет, холст 1280×800).
   new AutographApp(rootEl, {theme, film, interactive})
   Всё движение идёт через requestAnimationFrame + performance.now — поэтому съёмка
   трейлера с поддельными часами Playwright даёт ровные кадры. */
(function (global) {
'use strict';
const W = 1280, H = 800, CW = 1000, CH = 440;

const THEMES = {
  vrg:  { bg:'#0f2a20', bg2:'#1b4434', paper:'#f1ece2', ink:'#1b1a17', text:'#f1ece2', muted:'rgba(241,236,226,.62)', accent:'#c9a466', seal:'#b23a22',
          brand:'VR<b>·</b>GROUP', mark:'vr', event:'Корпоративный вечер · 2026' },
  corp: { bg:'#0c1a31', bg2:'#1a3460', paper:'#f4f6fa', ink:'#0f1b2d', text:'#eef3fb', muted:'rgba(238,243,251,.6)', accent:'#7cbcff', seal:'#ff6b3d',
          brand:'ВАША<b>·</b>КОМПАНИЯ', mark:'dia', event:'Конференция партнёров' },
  ny:   { bg:'#3a0e15', bg2:'#64202a', paper:'#fbf4e8', ink:'#2a0f12', text:'#fbf1e4', muted:'rgba(251,241,228,.62)', accent:'#ebc777', seal:'#e0483e',
          brand:'ВАША<b>·</b>КОМПАНИЯ', mark:'star', event:'Новогодний корпоратив' },
};

// подписи для автопоказа: штрихи в координатах карточки 1000×440 и время каждого штриха (с)
const SIGS = [
  { strokes: [
      'M150,300 C160,200 200,120 240,140 C280,160 230,260 200,300 C185,320 210,330 240,300 C270,270 290,230 310,240 C330,250 300,300 330,300 C360,300 370,240 395,240 C420,240 400,300 430,298 C460,296 470,230 500,180 C520,150 540,160 525,220 C510,280 520,305 555,290 C590,275 600,250 625,255 C650,260 640,300 670,296 C700,292 720,250 745,252 C775,255 760,300 795,295 C840,288 880,230 910,190',
      'M215,346 C400,372 650,366 880,322'],
    dur: [3.1, 0.55], gap: 0.32 },
  { strokes: [
      'M180,286 C186,190 262,150 272,214 C280,268 214,318 236,332 C268,350 300,224 332,216 C362,210 342,300 372,300 C404,300 424,196 452,150 C470,122 486,200 474,262 C466,312 502,302 522,270 C546,234 572,240 582,270 C592,302 622,302 652,262 C684,222 724,232 764,242 C808,252 852,220 884,196',
      'M298,352 C460,330 700,342 864,364'],
    dur: [2.9, 0.5], gap: 0.3 },
  { strokes: [
      'M160,250 C210,170 300,160 290,230 C282,290 210,320 220,300 C232,276 300,250 340,262 C380,274 352,316 390,312 C430,308 440,252 470,250 C500,248 480,306 512,306 C548,306 566,232 600,214 C630,198 640,250 620,290 C606,318 650,318 676,290 C706,258 740,250 790,262 C840,274 880,262 920,240',
      'M250,350 C420,372 640,370 860,336'],
    dur: [3.0, 0.5], gap: 0.3 },
];

const MARKS = {
  vr: '<svg viewBox="0 0 80 64"><path d="M10 8 L27.4 56" stroke="currentColor" stroke-width="6" fill="none"/><path d="M27.4 56 L44.6 8" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M3 8 H17.5" stroke="currentColor" stroke-width="1.6"/><path d="M38.5 8.8 H54 C66.6 8.8 66.6 31 54 31 H35.9 V29.4 H54 C59.6 29.4 59.6 10.4 54 10.4 H38.5 Z" fill="currentColor"/><path d="M46.5 30.2 L61.4 56" stroke="currentColor" stroke-width="5.6" fill="none"/><path d="M56 56.2 H70" stroke="currentColor" stroke-width="1.6"/></svg>',
  dia: '<svg viewBox="0 0 80 64"><path d="M40 4 L68 32 L40 60 L12 32 Z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M40 18 L54 32 L40 46 L26 32 Z" fill="currentColor"/></svg>',
  star: '<svg viewBox="0 0 80 64"><path d="M40 4 L46 26 L68 32 L46 38 L40 60 L34 38 L12 32 L34 26 Z" fill="currentColor"/><circle cx="62" cy="10" r="3" fill="currentColor"/><circle cx="18" cy="54" r="2.4" fill="currentColor"/></svg>',
};

const PEN_SVG = '<svg class="ag-pen" viewBox="0 0 60 470"><defs><linearGradient id="pb" x1="0" x2="1"><stop offset="0" stop-color="#1c1c1f"/><stop offset=".35" stop-color="#4a4a50"/><stop offset=".55" stop-color="#2a2a2e"/><stop offset="1" stop-color="#121214"/></linearGradient>' +
  '<linearGradient id="pt" x1="0" x2="1"><stop offset="0" stop-color="#8d8d93"/><stop offset=".45" stop-color="#e9e9ee"/><stop offset="1" stop-color="#77777d"/></linearGradient></defs>' +
  '<rect x="14" y="0" width="32" height="380" rx="16" fill="url(#pb)"/><rect class="pr" x="14" y="300" width="32" height="10" fill="var(--accent)"/>' +
  '<path d="M14 372 L46 372 L34 452 L26 452 Z" fill="url(#pt)"/><path d="M26 452 L34 452 L30 466 Z" fill="#2b2b2e"/></svg>';

const NB = ' ';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const E = {
  lin: k => k, out: k => 1 - Math.pow(1 - k, 3), inOut: k => (k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
  back: k => { const c = 1.4; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); },
};
const seg = (a, t0, t1) => clamp((a - t0) / (t1 - t0), 0, 1);

let _sampler = null;
function samplePath(d, step) {
  if (!_sampler) {
    _sampler = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    _sampler.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden');
    document.body.appendChild(_sampler);
  }
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', d); _sampler.appendChild(p);
  const L = p.getTotalLength(), pts = [];
  for (let s = 0; s <= L; s += step) { const q = p.getPointAtLength(s); pts.push({ x: q.x, y: q.y }); }
  _sampler.removeChild(p);
  return pts;
}

// синтетический росчерк: медленнее на изгибах, нажим «дышит», в начале и конце — сход на нет
function synthStroke(d, dur, seed) {
  const pts = samplePath(d, 2.2), n = pts.length, w = [0];
  for (let i = 1; i < n; i++) {
    let k = 0;
    if (i > 2 && i < n - 1) {
      const a1 = Math.atan2(pts[i].y - pts[i - 2].y, pts[i].x - pts[i - 2].x), a2 = Math.atan2(pts[i + 1].y - pts[i - 1].y, pts[i + 1].x - pts[i - 1].x);
      k = Math.abs(Math.atan2(Math.sin(a2 - a1), Math.cos(a2 - a1)));
    }
    pts[i].k = k; w.push(1 + 9 * k);
  }
  const tot = w.reduce((s, v) => s + v, 0); let acc = 0;
  for (let i = 0; i < n; i++) {
    acc += w[i]; pts[i].t = acc / tot * dur;
    const taper = Math.min(1, i / 10, (n - 1 - i) / 16);
    pts[i].p = clamp((0.6 + 0.22 * Math.sin(i * 0.045 + seed) + 0.1 * Math.sin(i * 0.17 + seed * 2) - 0.9 * (pts[i].k || 0)) * (0.25 + 0.75 * taper), 0.12, 1);
  }
  return pts;
}

// ───────── признаки почерка из точек ─────────
// Честный разбор: всё считается по реальным точкам. Нажим и угол пера — только с датчиков стилуса;
// если датчика нет, признак помечается «нет данных» и в выводы не идёт.
// mmPerUnit — сколько миллиметров экрана в одной единице холста (по умолчанию для планшета ~10,9″).
function analyse(strokes, mmPerUnit = 0.175) {
  const all = strokes.flat();
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, turn = 0;
  for (const p of all) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
  const lens = strokes.map(s => { let l = 0; for (let i = 1; i < s.length; i++) l += Math.hypot(s[i].x - s[i - 1].x, s[i].y - s[i - 1].y); return l; });
  const L = lens.reduce((a, b) => a + b, 0) || 1;
  // наклон: отрезки, идущие ближе к вертикали
  let sx = 0, sw = 0; const verts = [];
  for (const s of strokes) for (let i = 6; i < s.length; i += 3) {
    const dx = s[i].x - s[i - 6].x, dy = s[i].y - s[i - 6].y, l = Math.hypot(dx, dy);
    if (l > 7 && Math.abs(dy) > Math.abs(dx) * 1.3) {
      const a = dy < 0 ? Math.atan2(dx, -dy) : Math.atan2(-dx, dy);
      sx += a * l; sw += l; verts.push({ i, s, a, l, x: (s[i].x + s[i - 6].x) / 2, y: (s[i].y + s[i - 6].y) / 2 });
    }
    if (i >= 9) {
      const a1 = Math.atan2(s[i - 3].y - s[i - 6].y, s[i - 3].x - s[i - 6].x), a2 = Math.atan2(s[i].y - s[i - 3].y, s[i].x - s[i - 3].x);
      turn += Math.abs(Math.atan2(Math.sin(a2 - a1), Math.cos(a2 - a1)));
    }
  }
  const slant = clamp(sw ? sx / sw * 180 / Math.PI : 0, -40, 40);
  // строка: регрессия по самому длинному росчерку
  const main = strokes[lens.indexOf(Math.max(...lens))];
  let n = 0, mx = 0, my = 0, mxx = 0, mxy = 0;
  for (const p of main) { n++; mx += p.x; my += p.y; mxx += p.x * p.x; mxy += p.x * p.y; }
  const slope = (n * mxy - mx * my) / Math.max(1, n * mxx - mx * mx);
  const rise = clamp(-Math.atan(slope) * 180 / Math.PI, -20, 20);
  const bw = x1 - x0, bh = Math.max(20, y1 - y0);
  // нажим — только реальные значения с датчика (pr), без подмен
  const prs = all.map(p => p.pr).filter(v => typeof v === 'number');
  const pm = prs.length ? prs.reduce((a, b) => a + b, 0) / prs.length : 0;
  const psd = prs.length ? Math.sqrt(prs.reduce((a, b) => a + (b - pm) * (b - pm), 0) / prs.length) : 0;
  const hasPressure = prs.length > all.length * 0.7 && psd > 0.012 && pm > 0.02;
  // угол пера к экрану — только если стилус его отдаёт
  const tilts = all.map(p => p.tilt).filter(v => typeof v === 'number');
  const hasTilt = tilts.length > all.length * 0.7 && Math.max(...tilts) - Math.min(...tilts) > 0.5;
  const tilt = hasTilt ? tilts.reduce((a, b) => a + b, 0) / tilts.length : null;
  // время и темп: по отметкам времени, только пока перо касается экрана
  let down = 0; for (const s of strokes) if (s.length > 1) down += Math.max(0, (s[s.length - 1].ts - s[0].ts) / 1000);
  const span0 = all.length > 1 ? (all[all.length - 1].ts - all[0].ts) / 1000 : 0;
  const hasTime = down > 0.25;
  const speed = hasTime ? L * mmPerUnit / down : null;
  const f = {
    box: { x0, y0, x1, y1 }, slant, rise, slope, b: (my - slope * mx) / Math.max(1, n),
    hasPressure, press: hasPressure ? pm : null, pressSd: hasPressure ? psd : null, pressMax: hasPressure ? Math.max(...prs) : null,
    hasTilt, tilt, speed: speed && Math.round(speed), time: hasTime ? +span0.toFixed(1) : null,
    span: bw / bh, mm: Math.round(bh * mmPerUnit), widthMm: Math.round(bw * mmPerUnit),
    connect: Math.round(Math.max(...lens) / L * 100), round: turn / L * 100, strokes: strokes.length, points: all.length, verts,
  };
  f.guides = verts.slice().sort((a, b) => b.l - a.l).filter((v, i, arr) => arr.findIndex(u => Math.abs(u.x - v.x) < 90) === i).slice(0, 3);
  f.peaks = hasPressure ? all.filter(p => typeof p.pr === 'number').sort((a, b) => b.pr - a.pr).filter((v, i, arr) => arr.findIndex(u => Math.hypot(u.x - v.x, u.y - v.y) < 140) === i).slice(0, 3) : [];
  return f;
}

// строки замеров: [название, значение, что значит, доля для полоски, ключ]
function rows(f) {
  const sg = v => (v > 0.5 ? '+' : v < -0.5 ? '−' : '') + Math.abs(Math.round(v));
  const r = [
    ['Наклон', sg(f.slant) + '°', f.slant > 6 ? 'вправо — открытость' : f.slant < -6 ? 'влево — сдержанность' : 'прямой — баланс', clamp(0.5 + f.slant / 50, .08, 1), 'slant'],
    f.hasPressure
      ? ['Нажим', Math.round(f.press * 100) + NB + '%', (f.press > 0.55 ? 'сильный' : f.press < 0.32 ? 'лёгкий' : 'средний') + (f.pressSd < 0.1 ? ' и ровный' : ' и живой'), f.press, 'press']
      : ['Нажим', '—', 'нет датчика нажима', 0, 'press'],
    ['Размах', '×' + f.span.toFixed(1).replace('.', ','), f.span > 3.2 ? 'широкий — масштаб' : f.span < 2 ? 'компактный — фокус' : 'средний — гибкость', clamp(f.span / 5, .1, 1), 'span'],
    ['Высота подписи', f.mm + NB + 'мм', f.mm >= 45 ? 'крупная — на виду' : f.mm <= 22 ? 'компактная — к деталям' : 'средняя — открытость', clamp(f.mm / 70, .1, 1), 'mm'],
    ['Связность', f.connect + NB + '%', f.connect > 80 ? 'слитная — логика' : f.connect < 60 ? 'раздельная — интуиция' : 'смешанная — гибкость', f.connect / 100, 'connect'],
    ['Строка', sg(f.rise) + '°', f.rise > 2 ? 'вверх — оптимизм' : f.rise < -2 ? 'вниз — осторожность' : 'ровно — стабильность', clamp(0.5 + f.rise / 20, .08, 1), 'rise'],
  ];
  if (f.speed) r.push(['Темп', f.speed + NB + 'мм/с', f.speed > 140 ? 'быстрый — решительность' : f.speed < 60 ? 'размеренный — обстоятельность' : 'уверенный — ритм', clamp(f.speed / 220, .08, 1), 'speed']);
  if (f.hasTilt) r.push(['Угол пера', Math.round(f.tilt) + '°', f.tilt < 45 ? 'пологий — свобода' : f.tilt > 65 ? 'крутой — собранность' : 'средний — уверенность', clamp(f.tilt / 90, .08, 1), 'tilt']);
  return r;
}
const rowOf = (f, key) => rows(f).find(r => r[4] === key) || ['', '', '', 0, key];

const TRAIT = { energy: 'Драйв', lead: 'Лидерство', open: 'Общительность', crea: 'Креатив', prec: 'Точность' };
// образы: по 4–5 на пару сильных сторон, выбор зависит от самих замеров
const TITLES = {
  'energy+lead': ['Энергичный стратег', 'Капитан дедлайнов', 'Мотор с рулём', 'Генерал хорошего настроения', 'Человек-план', 'Укротитель дедлайнов', 'Локомотив проекта', 'Командир движухи'],
  'energy+open': ['Вдохновитель команды', 'Батарейка опенспейса', 'Душа любого созвона', 'Ходячий тимбилдинг', 'Заводила с дипломом', 'Душа планёрки', 'Дирижёр хорошего настроения', 'Солнце в переговорке'],
  'crea+energy': ['Генератор идей', 'Мозговой штурм в одном лице', 'Фонтан креатива', 'Изобретатель на скорости', 'Искра в розетке', 'Фейерверк идей', 'Креативный турбодвигатель'],
  'energy+prec': ['Точный игрок', 'Снайпер задач', 'Метроном с огоньком', 'Скоростной перфекционист', 'Тихий ураган', 'Швейцарские часы на турбо'],
  'lead+open': ['Прирождённый капитан', 'Дипломат с характером', 'Тот, за кем идут', 'Главный по общему делу', 'Президент кофе-брейка', 'Гроссмейстер кофе-брейка', 'Мэр опенспейса'],
  'crea+lead': ['Смелый новатор', 'Архитектор смелых идей', 'Капитан эксперимента', 'Режиссёр перемен', 'Первооткрыватель планёрок', 'Генеральный конструктор идей'],
  'lead+prec': ['Надёжный архитектор', 'Скала в пиджаке', 'Главный по порядку', 'Регламент с душой', 'Человек-план с огоньком', 'Хранитель дедлайнов'],
  'crea+open': ['Творческий дипломат', 'Художник общения', 'Сказочник переговоров', 'Креативный миротворец', 'Поэт рабочего чата', 'Мастер тёплых идей'],
  'open+prec': ['Внимательный наставник', 'Тихий гений деталей', 'Добрый аудитор', 'Наставник со стажем', 'Вежливый перфекционист', 'Друг всех таблиц'],
  'crea+prec': ['Изобретательный мастер', 'Ювелир идей', 'Инженер чудес', 'Часовщик креатива', 'Конструктор красоты', 'Алхимик презентаций'],
};
const CLOSERS = {
  energy: 'Вы из тех, кто зажигает команду идеей и доводит её до результата.',
  lead: 'Рядом с вами людям спокойно: вы берёте ответственность и не теряете курс.',
  open: 'Вы легко находите общий язык с кем угодно — и люди тянутся к вам сами.',
  crea: 'Вы видите решения там, где другие видят тупик, и не боитесь пробовать новое.',
  prec: 'Вы держите в голове детали, о которых другие забывают, — и на вас можно положиться.',
};
const WORK = {
  energy: 'Берётесь за сложное и задаёте темп всей команде.',
  lead: 'Умеете взять ответственность и довести проект до финиша.',
  open: 'Раскрываетесь там, где нужны люди и переговоры.',
  crea: 'Сильны там, где нет готовых решений.',
  prec: 'Видите детали и риски, которые другие пропускают.',
};
const TEAM = {
  energy: 'Вас зовут, когда нужно поднять настроение.',
  lead: 'К вам идут за советом — вы точка опоры.',
  open: 'Объединяете людей и легко находите общий язык.',
  crea: 'Подкидываете идеи, с которых начинаются лучшие проекты.',
  prec: 'На вас держится порядок — и все это ценят.',
};
const TODAY = {
  energy: 'Позовите коллег туда, где интереснее всего.',
  lead: 'Скажите первый тост — у вас получится.',
  open: 'Познакомьтесь с тем, с кем ещё не говорили.',
  crea: 'Предложите идею, которую давно откладывали.',
  prec: 'Доверьтесь интуиции — вам понравится.',
};
const QR_D = 'M0 0.5h7m2 0h4m1 0h1m1 0h1m1 0h7M0 1.5h1m5 0h1m2 0h1m1 0h3m1 0h1m2 0h1m5 0h1M0 2.5h1m1 0h3m1 0h1m1 0h1m5 0h1m1 0h1m1 0h1m1 0h3m1 0h1M0 3.5h1m1 0h3m1 0h1m1 0h7m3 0h1m1 0h3m1 0h1M0 4.5h1m1 0h3m1 0h1m1 0h1m2 0h1m2 0h1m3 0h1m1 0h3m1 0h1M0 5.5h1m5 0h1m1 0h5m1 0h2m2 0h1m5 0h1M0 6.5h7m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h7M8 7.5h3m3 0h2M0 8.5h1m1 0h5m2 0h3m3 0h2m1 0h5M0 9.5h1m1 0h1m1 0h2m1 0h3m3 0h1m2 0h2m1 0h1m3 0h1M0 10.5h1m2 0h4m4 0h6m1 0h1m1 0h2m1 0h2M0 11.5h2m2 0h1m4 0h5m1 0h2m2 0h1m4 0h1M4 12.5h5m1 0h3m1 0h3m1 0h3m1 0h3M0 13.5h4m1 0h1m10 0h1m2 0h1m1 0h1m1 0h1M0 14.5h1m5 0h2m1 0h4m2 0h3m1 0h3m1 0h2M0 15.5h1m1 0h3m2 0h5m2 0h1m1 0h5m3 0h1M0 16.5h1m1 0h1m1 0h1m1 0h3m1 0h2m4 0h5m1 0h1M8 17.5h3m1 0h5m3 0h2M0 18.5h7m2 0h2m2 0h2m1 0h1m1 0h1m1 0h1m1 0h3M0 19.5h1m5 0h1m1 0h1m3 0h2m2 0h1m3 0h2m1 0h1M0 20.5h1m1 0h3m1 0h1m1 0h2m2 0h1m1 0h7m1 0h1m1 0h1M0 21.5h1m1 0h3m1 0h1m1 0h2m5 0h4m1 0h5M0 22.5h1m1 0h3m1 0h1m1 0h1m2 0h2m2 0h1m5 0h2m1 0h1M0 23.5h1m5 0h1m2 0h1m1 0h1m2 0h1m1 0h6m2 0h1M0 24.5h7m1 0h1m1 0h2m5 0h1m1 0h6';
const TIPS = {
  energy: 'Совет на сегодня: позовите коллег туда, где интереснее всего, — за вами пойдут.',
  lead: 'Совет на сегодня: скажите первый тост — у вас получится лучше всех.',
  open: 'Совет на сегодня: познакомьтесь с тем, с кем ещё ни разу не говорили.',
  crea: 'Совет на сегодня: предложите идею, которую давно откладывали.',
  prec: 'Совет на сегодня: доверьтесь интуиции хотя бы раз — вам понравится.',
};

function portrait(f) {
  const pr = f.hasPressure ? f.press : 0.45;                 // без датчика нажим в выводы не идёт
  const sp = f.speed ? clamp((f.speed - 90) / 120, -0.2, 0.25) : 0;
  const sc = {
    energy: 0.32 + pr * 0.3 + clamp((f.span - 2) * 0.07, -0.1, 0.2) + f.rise * 0.01 + sp,
    lead: 0.3 + clamp(f.mm / 60, 0, 1) * 0.32 + pr * 0.24,
    open: 0.42 + f.slant / 35 * 0.38 + f.rise / 12 * 0.12,
    crea: 0.3 + clamp(f.round / 6, 0, 1) * 0.36 + (1 - f.connect / 100) * 0.3 + (f.strokes > 1 ? 0.08 : 0),
    prec: 0.32 + f.connect / 100 * 0.3 + (1 - Math.abs(f.slant) / 35) * 0.2 - sp * 0.5,
  };
  const keys = Object.keys(sc).sort((a, b) => sc[b] - sc[a]);
  const top = keys.slice(0, 2), pool = TITLES[top.slice().sort().join('+')] || ['Яркая личность'];
  const h = Math.abs(Math.round(f.slant * 7 + f.span * 13 + f.mm * 3 + f.connect + f.rise * 5 + (f.speed || 0)));
  const title = pool[h % pool.length];
  const lo = Math.min(...Object.values(sc)), hi = Math.max(...Object.values(sc));
  const traits = keys.slice(0, 4).map(k => [TRAIT[k], Math.round(62 + (sc[k] - lo) / Math.max(.01, hi - lo) * 32)]);
  const sl = rowOf(f, 'slant')[1];
  const s1 = f.slant > 6 ? `Наклон вправо (${sl}) выдаёт человека, который тянется к людям и легко идёт навстречу новому.`
    : f.slant < -6 ? `Наклон влево (${sl}) — признак сдержанности: вы сначала думаете, потом говорите, и поэтому вас слушают.`
    : `Почти вертикальные буквы (${sl}) говорят о балансе разума и чувств: вы не теряете голову даже в аврал.`;
  const s2 = f.hasPressure && f.press > 0.55 ? `Нажим ${rowOf(f, 'press')[1]} — энергии хватит и на работу, и на праздник.`
    : f.speed && f.speed > 140 ? `Темп ${f.speed} мм/с: вы расписываетесь так, будто опаздываете на собственный успех.`
    : f.span > 3.2 ? 'Широкий размах росчерка — любовь к большим задачам и простору для решений.'
    : f.connect > 80 ? 'Буквы идут одной линией — вы мыслите последовательно и доводите начатое до конца.'
    : 'Свободные связки букв — признак гибкого ума и хорошей интуиции.';
  const s3 = f.rise > 2 ? 'Строка уходит вверх — вы смотрите в будущее с оптимизмом и заражаете им других.'
    : f.rise < -2 ? 'Строка чуть опускается — вы трезво оцениваете риски и не обещаете лишнего.'
    : f.mm >= 45 ? 'Крупная подпись выдаёт желание быть на виду и вести за собой.'
    : 'Ровная строка — признак внутренней устойчивости: вас сложно выбить из колеи.';
  return { title, text: `${s1} ${s2} ${s3} ${CLOSERS[top[0]]}`, tip: TIPS[top[0]], traits,
    facets: [['В работе', WORK[top[0]]], ['В команде', TEAM[top[1]]], ['Сегодня', TODAY[top[0]]]] };
}

const newId = () => Array.from(crypto.getRandomValues(new Uint8Array(9)), b => 'abcdefghjkmnpqrstuvwxyz23456789'[b % 31]).join('');

// датчики стилуса: нажим (0…1) и угол пера к экрану (°). У мыши и пальца их нет — возвращаем null.
function sensors(e) {
  if (e.pointerType !== 'pen') return { pr: null, tilt: null };
  const pr = e.pressure > 0 ? e.pressure : null;
  let tilt = null;
  if (typeof e.altitudeAngle === 'number' && e.altitudeAngle > 0) tilt = e.altitudeAngle * 180 / Math.PI;
  else if (e.tiltX || e.tiltY) tilt = 90 - Math.min(90, Math.hypot(e.tiltX, e.tiltY));
  return { pr, tilt };
}

// ───────── приложение ─────────
class AutographApp {
  constructor(root, opt = {}) {
    this.root = root; this.opt = Object.assign({ theme: 'vrg', film: false, interactive: true, dpr: 2, inkDpr: 3 }, opt);
    this.tw = []; this.state = 'none'; this.strokes = []; this.events = [];
    this.build(); this.setTheme(this.opt.theme);
    this.t0 = performance.now(); this.loop = this.loop.bind(this); requestAnimationFrame(this.loop);
  }
  ev(name) { this.events.push({ name, t: performance.now() }); if (this.opt.onEvent) this.opt.onEvent(name); }

  build() {
    const r = this.root; r.classList.add('ag');
    r.innerHTML = `
      <canvas class="ag-bg"></canvas><div class="ag-glow"></div><canvas class="ag-ghost abs" style="left:0;top:0;width:${W}px;height:${H}px"></canvas>
      <div class="ag-head"><div class="ag-brand"><span class="mk"></span><span class="bn"></span></div><div class="ag-event lbl dim"></div></div>
      <section class="ag-scr ag-attract">
        <div class="k abs lbl">Автограф-сессия · ИИ</div>
        <h1 class="abs">Распишитесь —<br>и узнайте, <em>какой вы&nbsp;человек</em></h1>
        <p class="abs">Искусственный интеллект разберёт ваш почерк и&nbsp;напишет портрет личности. Это займёт меньше минуты.</p>
        <div class="ag-cta abs"><span class="dot"><i class="ring"></i></span>Коснитесь экрана стилусом</div>
      </section>
      <section class="ag-scr ag-sign">
        <h2 class="abs">Распишитесь, <em>как в&nbsp;паспорте</em></h2>
        <div class="k abs lbl dim">Шаг 1 из 3</div>
        <div class="ag-btn ghost" data-a="clear" style="left:140px;top:676px"><svg viewBox="0 0 20 20"><path d="M4 4 L16 16 M16 4 L4 16" stroke="currentColor" stroke-width="1.8"/></svg>Стереть</div>
        <div class="ag-btn solid" data-a="done" style="right:140px;top:676px">Готово<svg viewBox="0 0 20 20"><path d="M3 10 H16 M11 5 L16 10 L11 15" stroke="currentColor" stroke-width="2" fill="none"/></svg></div>
      </section>
      <section class="ag-scr ag-an">
        <h2 class="abs" style="left:48px">ИИ читает <em>ваш почерк</em></h2>
        <div class="k abs lbl dim">Шаг 2 из 3</div>
        <div class="ag-rows"></div>
        <div class="ag-status"><div class="t"></div><div class="bar"><i></i></div><div class="pc"></div></div>
        <div class="ag-graph"><div class="lbl dim">Нажим по ходу росчерка</div><canvas></canvas></div>
      </section>
      <section class="ag-scr ag-res">
        <div class="k abs lbl">Портрет личности · ИИ</div>
        <h3 class="abs"></h3>
        <div class="txt abs"></div>
        <div class="ag-facets abs"></div>
        <div class="ag-traits"><div class="h lbl dim">Ваши сильные стороны</div></div>
        <div class="ag-qr"><div class="code"><svg viewBox="0 0 25 25" shape-rendering="crispEdges"><path stroke="currentColor" d="${QR_D}"/></svg></div>
          <div class="qt"><div class="lbl">Хотите больше?</div><p>Отсканируйте QR-код и&nbsp;заберите <b>полное описание своей личности</b> по&nbsp;подписи</p></div></div>
        <div class="ag-foot"><span class="lbl dim">Сфотографируйте экран или отсканируйте QR-код</span>
          <div class="ag-next" data-a="next"><svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" stroke-opacity=".25" stroke-width="2"/><circle class="cd" cx="16" cy="16" r="13" fill="none" stroke="var(--accent)" stroke-width="2" stroke-dasharray="81.7" stroke-dashoffset="0" transform="rotate(-90 16 16)"/></svg>Следующий гость</div></div>
      </section>
      <div class="ag-card"><div class="tex"></div><div class="base"></div><div class="x">×</div><div class="cl">ПОДПИСЬ</div><div class="cr"></div>
        <canvas class="ink"></canvas><canvas class="ov"></canvas></div>
      ${PEN_SVG}<div class="ag-tap"></div>`;
    const $ = s => r.querySelector(s);
    this.el = { bg: $('.ag-bg'), glow: $('.ag-glow'), ghost: $('.ag-ghost'), mk: $('.ag-brand .mk'), bn: $('.ag-brand .bn'), event: $('.ag-event'),
      attract: $('.ag-attract'), sign: $('.ag-sign'), an: $('.ag-an'), res: $('.ag-res'), ring: $('.ag-cta .ring'),
      card: $('.ag-card'), ink: $('.ag-card .ink'), ov: $('.ag-card .ov'), cr: $('.ag-card .cr'), rows: $('.ag-rows'),
      st: $('.ag-status .t'), graph: $('.ag-graph canvas'), graphLbl: $('.ag-graph .lbl'), stBar: $('.ag-status .bar i'), stPc: $('.ag-status .pc'),
      title: $('.ag-res h3'), txt: $('.ag-res .txt'), facets: $('.ag-facets'), qr: $('.ag-qr'), traits: $('.ag-traits'), cd: $('.ag-next .cd'),
      pen: $('.ag-pen'), tap: $('.ag-tap') };
    const sz = (c, w, h, d) => { c.width = Math.round(w * d); c.height = Math.round(h * d); const x = c.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); return x; };
    this.cx = { bg: sz(this.el.bg, W, H, 1), ghost: sz(this.el.ghost, W, H, this.opt.dpr), ink: sz(this.el.ink, CW, CH, this.opt.inkDpr), ov: sz(this.el.ov, CW, CH, this.opt.dpr), graph: sz(this.el.graph, 740, 92, this.opt.dpr) };
    this.el.bg.style.cssText = `width:${W}px;height:${H}px`;
    this.cardPos = { x: 140, y: 200, s: 1, o: 0 }; this.applyCard();
    if (this.opt.interactive) this.bindInput();
  }

  setTheme(name) {
    const th = THEMES[name] || THEMES.vrg; this.th = th; this.themeName = name;
    for (const k of ['bg', 'bg2', 'paper', 'ink', 'text', 'muted', 'accent', 'seal']) this.root.style.setProperty('--' + k, th[k]);
    this.el.mk.innerHTML = MARKS[th.mark]; this.el.bn.innerHTML = th.brand; this.el.event.textContent = th.event;
    const c = this.cx.bg, g = c.createRadialGradient(360, 300, 40, 520, 420, 1100);
    g.addColorStop(0, th.bg2); g.addColorStop(1, th.bg); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.strokeStyle = th.accent; c.globalAlpha = 0.07; c.lineWidth = 1;
    for (let y = 120; y < H; y += 40) { c.beginPath(); c.moveTo(0, y + .5); c.lineTo(W, y + .5); c.stroke(); }
    c.globalAlpha = 1;
    const v = c.createRadialGradient(W / 2, H / 2, 300, W / 2, H / 2, 900); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.35)');
    c.fillStyle = v; c.fillRect(0, 0, W, H);
    this.el.cr.textContent = th.event.split('·')[0].trim().toUpperCase();
    if (this.strokes.length) this.redrawInk();
  }

  // ── твины ──
  tween(ms, fn, ease = E.inOut) { return new Promise(res => this.tw.push({ t0: performance.now(), ms, fn, ease, res })); }
  wait(ms) { return this.tween(ms, () => {}); }
  loop() {
    const now = performance.now(), keep = [];
    for (const t of this.tw) { const k = clamp((now - t.t0) / t.ms, 0, 1); t.fn(t.ease(k), k); if (k < 1) keep.push(t); else t.res(); }
    this.tw = keep;
    this.tick(now);
    requestAnimationFrame(this.loop);
  }
  tick(now) {
    const s = (now - this.t0) / 1000;
    this.el.glow.style.transform = `translate(${-80 + Math.sin(s * .23) * 140}px,${-200 + Math.cos(s * .17) * 90}px)`;
    if (this.state === 'attract') this.drawGhost(s);
    const pk = (s * 0.8) % 1; this.el.ring.style.transform = `scale(${1 + pk * 2.6})`; this.el.ring.style.opacity = 1 - pk;
    if (this.state === 'result' && this.resT0 && this.opt.interactive) {
      const k = clamp((now - this.resT0) / 30000, 0, 1); this.el.cd.style.strokeDashoffset = (81.7 * k).toFixed(1);
      if (k >= 1 && !this.busy) this.toAttract();
    }
    if (this.anim) this.anim(now);
  }

  show(scr, on) { const e = this.el[scr]; e.classList.toggle('on', on); }
  fade(scr, to, ms = 600) { const e = this.el[scr], from = +e.style.opacity || 0; this.show(scr, to > 0); return this.tween(ms, k => { e.style.opacity = lerp(from, to, k); }); }
  applyCard() { const c = this.cardPos; this.el.card.style.transform = `translate(${c.x}px,${c.y}px) scale(${c.s})`; this.el.card.style.opacity = c.o; }
  moveCard(to, ms = 900, ease = E.inOut) { const from = Object.assign({}, this.cardPos); return this.tween(ms, k => { for (const key in to) this.cardPos[key] = lerp(from[key], to[key], k); this.applyCard(); }, ease); }
  toRoot(x, y) { const c = this.cardPos; return { x: c.x + x * c.s, y: c.y + y * c.s }; }

  // ── заставка: призрачная подпись сама пишется по кругу ──
  drawGhost(s) {
    if (!this.ghostPts) {
      const sg = SIGS[2], tr = { x: 560, y: 160, s: 0.74 };
      this.ghostPts = sg.strokes.map((d, i) => synthStroke(d, sg.dur[i] * 1.6, 2 + i).map(p => ({ x: tr.x + p.x * tr.s, y: tr.y + p.y * tr.s, p: p.p, t: p.t + (i ? sg.dur[0] * 1.6 + 0.4 : 0) })));
    }
    const c = this.cx.ghost, cyc = 8, u = s % cyc, a = u < 6.4 ? 0.42 : 0.42 * (1 - (u - 6.4) / 1.6);
    c.clearRect(0, 0, W, H); c.strokeStyle = this.th.accent; c.globalAlpha = Math.max(0, a); c.lineCap = 'round'; c.lineJoin = 'round';
    for (const st of this.ghostPts) for (let i = 1; i < st.length && st[i].t <= u; i++) {
      c.lineWidth = 2 + 6 * st[i].p; c.beginPath(); c.moveTo(st[i - 1].x, st[i - 1].y); c.lineTo(st[i].x, st[i].y); c.stroke();
    }
    c.globalAlpha = 1;
  }
  clearGhost() { this.cx.ghost.clearRect(0, 0, W, H); }

  // ── рисование чернилами ──
  inkSeg(a, b, c) {
    const x = this.cx.ink, w = 1.3 + 6.4 * b.p;
    x.strokeStyle = this.th.ink; x.lineCap = 'round'; x.lineJoin = 'round'; x.lineWidth = w;
    x.beginPath();
    if (c) { x.moveTo((a.x + b.x) / 2, (a.y + b.y) / 2); x.quadraticCurveTo(b.x, b.y, (b.x + c.x) / 2, (b.y + c.y) / 2); }
    else { x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); }
    x.stroke();
  }
  addPoint(st, p) {
    if (p.ts == null) p.ts = performance.now();
    st.push(p); const n = st.length;
    if (n === 2) this.inkSeg(st[0], st[1]);
    else if (n > 2) this.inkSeg(st[n - 3], st[n - 2], st[n - 1]);
  }
  redrawInk() {
    this.cx.ink.clearRect(0, 0, CW, CH);
    for (const st of this.strokes) { const tmp = []; for (const p of st) this.addPoint(tmp, p); }
  }
  clearInk() { this.strokes = []; this.cx.ink.clearRect(0, 0, CW, CH); this.cx.ov.clearRect(0, 0, CW, CH); }

  // ── ввод ──
  bindInput() {
    const r = this.root;
    const local = e => { const b = r.getBoundingClientRect(), sc = b.width / W; return { x: (e.clientX - b.left) / sc, y: (e.clientY - b.top) / sc }; };
    let cur = null, last = null;
    r.addEventListener('pointerdown', e => {
      const a = e.target.closest('[data-a]');
      if (a) { this.action(a.dataset.a); return; }
      if (this.state === 'attract' && !this.busy) { const p = local(e); this.start(p.x, p.y); return; }
      if (this.state !== 'sign') return;
      const p = local(e), c = this.cardPos, q = { x: (p.x - c.x) / c.s, y: (p.y - c.y) / c.s };
      if (q.x < 0 || q.y < 0 || q.x > CW || q.y > CH) return;
      r.setPointerCapture(e.pointerId); cur = []; this.strokes.push(cur); last = { ...q, t: e.timeStamp || performance.now() };
      const sn = sensors(e);
      this.addPoint(cur, { x: q.x, y: q.y, p: sn.pr != null ? sn.pr : 0.55, pr: sn.pr, tilt: sn.tilt, t: last.t, ts: last.t });
    });
    r.addEventListener('pointermove', e => {
      if (!cur) return;
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      for (const ev of evs) {
        const p = local(ev), c = this.cardPos, q = { x: (p.x - c.x) / c.s, y: (p.y - c.y) / c.s }, now = ev.timeStamp || performance.now();
        const d = Math.hypot(q.x - last.x, q.y - last.y); if (d < 1.2) continue;
        const v = d / Math.max(1, now - last.t), sn = sensors(ev);
        // толщина линии: с датчика нажима, а без него — только для красоты по скорости (в замеры не идёт)
        const w = sn.pr != null ? sn.pr : clamp(0.85 - v * 0.35, 0.18, 0.9);
        const prev = cur[cur.length - 1].p, pp = prev * 0.6 + w * 0.4;
        this.addPoint(cur, { x: q.x, y: q.y, p: pp, pr: sn.pr, tilt: sn.tilt, t: now, ts: now }); last = { ...q, t: now };
      }
    });
    const up = () => { cur = null; };
    r.addEventListener('pointerup', up); r.addEventListener('pointercancel', up);
  }
  action(a) {
    if (this.busy) return;
    if (a === 'clear') this.clearInk();
    if (a === 'done') { const L = this.strokes.flat().length; if (L > 25) this.analyseNow(); else this.nudge(); }
    if (a === 'next') this.toAttract();
  }
  nudge() { const e = this.el.card, c = this.cardPos; this.tween(420, (k, r) => { e.style.transform = `translate(${c.x + Math.sin(r * 18) * 10 * (1 - r)}px,${c.y}px) scale(${c.s})`; }, E.lin); }

  // ── сцены ──
  async toAttract() {
    this.busy = true; this.resT0 = 0;
    await Promise.all([this.fade('res', 0, 500), this.fade('sign', 0, 500), this.fade('an', 0, 500), this.moveCard({ o: 0, y: this.cardPos.y + 40 }, 500)]);
    this.clearInk(); this.ghostPts = null; this.state = 'attract'; this.ev('attract');
    await this.fade('attract', 1, 700); this.busy = false;
  }
  async start(x, y) {
    if (this.busy) return; this.busy = true; this.ev('tap');
    this.ripple(x, y);
    this.state = 'sign'; this.clearGhost();
    this.cardPos = { x: 140, y: 240, s: 1, o: 0 }; this.applyCard();
    await this.fade('attract', 0, 450);
    this.ev('sign');
    await Promise.all([this.fade('sign', 1, 600), this.moveCard({ y: 200, o: 1 }, 700, E.out)]);
    this.busy = false;
  }
  ripple(x, y) {
    const t = this.el.tap; t.style.left = x + 'px'; t.style.top = y + 'px';
    this.tween(700, k => { t.style.opacity = 1 - k; t.style.transform = `scale(${0.4 + k * 1.6})`; }, E.out);
  }

  // ── автопоказ (съёмка): стилус подписывает за гостя ──
  penAt(x, y, lift, rot) {
    const p = this.el.pen; p.style.opacity = 1; this.pp = { x, y };
    p.style.transform = `translate(${x - 30}px,${y - 466 - lift}px) rotate(${rot}deg)`;
  }
  async penMove(from, to, ms, liftFrom, liftTo, ease = E.inOut) {
    await this.tween(ms, k => { this.penAt(lerp(from.x, to.x, k), lerp(from.y, to.y, k), lerp(liftFrom, liftTo, k), 24 - 4 * Math.sin(k * Math.PI)); }, ease);
  }
  async autoSign(i = 0, speed = 1) {
    const sg = SIGS[i % SIGS.length]; this.state = 'sign'; this.busy = true;
    const sts = sg.strokes.map((d, j) => synthStroke(d, sg.dur[j] / speed, 1 + j + i));
    const off = this.pp && this.el.pen.style.opacity === '1' ? this.pp : { x: 1500, y: 980 };
    let at = this.toRoot(sts[0][0].x, sts[0][0].y);
    await this.penMove(off, at, 700, this.pp ? 30 : 60, 0, E.out);
    for (let j = 0; j < sts.length; j++) {
      const st = sts[j], cur = []; this.strokes.push(cur); let idx = 0; this.ev('pendown');
      await this.tween(st[st.length - 1].t * 1000, (k, r) => {
        const tt = r * st[st.length - 1].t;
        while (idx < st.length && st[idx].t <= tt) { const q = st[idx]; q.pr = q.p; q.tilt = 54 + 7 * Math.sin(idx * 0.02 + j); this.addPoint(cur, q); idx++; }
        const p = st[Math.max(0, idx - 1)], q = this.toRoot(p.x, p.y);
        this.penAt(q.x, q.y, (1 - p.p) * 4, 24 + Math.sin(tt * 3) * 1.5);
      }, E.lin);
      while (idx < st.length) { const q = st[idx++]; q.pr = q.p; q.tilt = 54; this.addPoint(cur, q); }
      this.ev('penup');
      if (j < sts.length - 1) {
        const a = this.toRoot(st[st.length - 1].x, st[st.length - 1].y), b = this.toRoot(sts[j + 1][0].x, sts[j + 1][0].y);
        await this.penMove(a, b, sg.gap * 1000 / speed, 0, 0);
        this.penAt(b.x, b.y, 0, 24);
      }
    }
    this.busy = false;
  }
  async autoDone() {
    // стилус нажимает «Готово»
    const end = this.strokes[this.strokes.length - 1], last = end[end.length - 1], a = this.toRoot(last.x, last.y);
    const btn = { x: 1050, y: 706 };
    await this.penMove(a, btn, 650, 0, 40);
    await this.penMove(btn, btn, 160, 40, 0, E.out);
    this.ripple(btn.x, btn.y); this.ev('tap');
    const b = this.root.querySelector('[data-a="done"]');
    this.tween(260, (k, r) => { b.style.transform = `scale(${1 - 0.06 * Math.sin(r * Math.PI)})`; }, E.lin);
    await this.penMove(btn, { x: 1500, y: 1000 }, 700, 0, 80, E.inOut);
    this.el.pen.style.opacity = 0; this.pp = null;
    await this.analyseNow();
  }

  // ── анализ ──
  async analyseNow() {
    this.busy = true; this.state = 'analyse'; this.ev('analyse');
    const f = analyse(this.strokes, this.mmPerUnit()); this.f = f; this.pt = portrait(f); this.pt.src = 'local';
    // краткий и полный разборы стартуют одновременно; полный сохраняется в облаке под номером сеанса для QR
    this.sid = this.opt.api ? newId() : null; this.aiReq = null; this.gv = null;
    if (this.opt.api) { const img = this.sigImage(); this.aiReq = this.fetchPortrait(f, img); this.postFull(f, img); }
    const rs = rows(f);
    this.el.rows.classList.toggle('compact', rs.length > 6);
    this.el.rows.innerHTML = rs.map(r => `<div class="ag-row${r[1] === '—' ? ' off' : ''}"><span class="n">${r[0].toUpperCase()}</span><span class="v">${r[1]}</span><span class="d">${r[2]}</span><span class="tr"><i class="fi"></i></span></div>`).join('');
    const rowEls = [...this.el.rows.children];
    const ST = ['Сканируем подпись…', 'Измеряем наклон букв…', f.hasPressure ? 'Читаем датчик нажима…' : 'Датчика нажима нет — пропускаем…', 'Считаем размах и высоту…', f.speed ? 'Засекаем темп росчерка…' : 'Смотрим, как связаны буквы…', 'Пишем портрет личности…'];
    const step = 0.78 / rs.length;
    await Promise.all([this.fade('sign', 0, 450), this.moveCard({ x: 48, y: 176, s: 0.74 }, 900)]);
    this.fade('an', 1, 500);
    const D = this.opt.anD || 6200, t0 = performance.now(), shown = new Set();
    this.anim = now => {
      const a = clamp((now - t0) / D, 0, 1);
      this.drawOverlay(a); this.drawGraph(a);
      const si = Math.min(ST.length - 1, Math.floor(a * ST.length * 1.02));
      if (this.el.st.textContent !== ST[si]) this.el.st.textContent = ST[si];
      this.el.stBar.style.width = (a * 100).toFixed(2) + '%'; this.el.stPc.textContent = Math.round(a * 100) + ' %';
      rowEls.forEach((el, i) => {
        const r = seg(a, 0.1 + i * step, 0.1 + i * step + 0.12);
        el.style.opacity = r; el.style.transform = `translateX(${(1 - E.out(r)) * 24}px)`;
        el.querySelector('.fi').style.width = (E.out(r) * rs[i][3] * 100).toFixed(1) + '%';
        if (r > 0 && !shown.has(i)) { shown.add(i); this.ev('row'); }
      });
    };
    await this.wait(D + 500);
    this.anim = null;
    await this.toResult();
  }

  drawOverlay(a) {
    const c = this.cx.ov, f = this.f, th = this.th, all = this.strokes.flat();
    c.clearRect(0, 0, CW, CH); c.lineCap = 'round';
    const mono = sz => `500 ${sz}px "IBM Plex Mono", monospace`;
    const tag = (txt, x, y, al = 'left', col = th.seal) => { c.font = mono(17); c.textAlign = al; c.fillStyle = col; c.fillText(txt.toUpperCase(), x, y); };
    // 1. луч сканирования и вспыхивающие точки
    const sa = seg(a, 0, 0.3), bx = lerp(-160, CW + 160, E.inOut(sa));
    if (sa > 0 && sa < 1) {
      const g = c.createLinearGradient(bx - 140, 0, bx + 20, 0);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, th.accent);
      c.globalAlpha = 0.28; c.fillStyle = g; c.fillRect(bx - 140, 0, 160, CH); c.globalAlpha = 1;
      c.fillStyle = th.accent; c.fillRect(bx, 0, 2.5, CH);
    }
    c.fillStyle = th.accent;
    for (let i = 0; i < all.length; i += 4) {
      const p = all[i], d = bx - p.x; if (d < 0) continue;
      const al = Math.max(0, 1 - d / 420) * (1 - seg(a, 0.3, 0.42));
      if (al > 0) { c.globalAlpha = al; c.beginPath(); c.arc(p.x, p.y, 2.6, 0, 7); c.fill(); }
    }
    c.globalAlpha = 1;
    // 2. линия строки
    const ba = seg(a, 0.16, 0.34);
    if (ba > 0) {
      const xa = f.box.x0 - 30, xb = lerp(xa, f.box.x1 + 30, E.out(ba)), y = x => f.slope * x + f.b;
      c.strokeStyle = th.seal; c.lineWidth = 2; c.setLineDash([10, 8]);
      c.beginPath(); c.moveTo(xa, y(xa)); c.lineTo(xb, y(xb)); c.stroke(); c.setLineDash([]);
      c.globalAlpha = seg(a, 0.28, 0.34); tag('строка ' + rowOf(f, 'rise')[1], f.box.x1 + 30, y(f.box.x1 + 30) + 30, 'right'); c.globalAlpha = 1;
    }
    // 3. наклон
    const sl = seg(a, 0.3, 0.5);
    if (sl > 0) f.guides.forEach((g, i) => {
      const k = E.out(seg(sl, i * 0.15, i * 0.15 + 0.6)); if (!k) return;
      const len = 120 * k, dx = Math.sin(g.a) * len, dy = Math.cos(g.a) * len;
      c.strokeStyle = th.accent; c.lineWidth = 2.2;
      c.beginPath(); c.moveTo(g.x - dx, g.y + dy); c.lineTo(g.x + dx, g.y - dy); c.stroke();
      c.globalAlpha = 0.5; c.lineWidth = 1.4; c.beginPath(); c.moveTo(g.x, g.y + len); c.lineTo(g.x, g.y - len); c.stroke(); c.globalAlpha = 1;
      c.beginPath(); c.arc(g.x, g.y, 46 * k, -Math.PI / 2, -Math.PI / 2 + g.a, g.a < 0); c.stroke();
      if (i === 0) { c.globalAlpha = k; const rt = g.x + 260 > CW; tag('наклон ' + rowOf(f, 'slant')[1], rt ? g.x - 54 : g.x + 54, g.y - 70, rt ? 'right' : 'left', th.ink); c.globalAlpha = 1; }
    });
    // 4. размах и высота
    const bb = seg(a, 0.46, 0.64);
    if (bb > 0) {
      const k = E.out(bb), { x0, y0, x1, y1 } = f.box, cx = (x0 + x1) / 2, ty = Math.max(18, y0 - 22);
      c.strokeStyle = th.ink; c.globalAlpha = 0.75; c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(cx - (cx - x0) * k, ty); c.lineTo(cx + (x1 - cx) * k, ty); c.stroke();
      c.beginPath(); c.moveTo(cx - (cx - x0) * k, ty - 8); c.lineTo(cx - (cx - x0) * k, ty + 8); c.moveTo(cx + (x1 - cx) * k, ty - 8); c.lineTo(cx + (x1 - cx) * k, ty + 8); c.stroke();
      const rx = Math.min(CW - 26, x1 + 26), my = (y0 + y1) / 2;
      c.beginPath(); c.moveTo(rx, my - (my - y0) * k); c.lineTo(rx, my + (y1 - my) * k); c.stroke();
      c.beginPath(); c.moveTo(rx - 8, my - (my - y0) * k); c.lineTo(rx + 8, my - (my - y0) * k); c.moveTo(rx - 8, my + (y1 - my) * k); c.lineTo(rx + 8, my + (y1 - my) * k); c.stroke();
      c.globalAlpha = k; tag('размах ' + rowOf(f, 'span')[1], cx, ty - 12, 'center', th.ink); tag(rowOf(f, 'mm')[1], rx - 14, y0 + 18, 'right', th.ink); c.globalAlpha = 1;
    }
    // 5. нажим
    const pa = seg(a, 0.6, 0.8);
    if (pa > 0) f.peaks.forEach((p, i) => {
      const k = seg(pa, i * 0.2, i * 0.2 + 0.5); if (!k) return;
      c.strokeStyle = th.seal; c.lineWidth = 2.4; c.globalAlpha = 1;
      c.beginPath(); c.arc(p.x, p.y, 10 + 22 * E.back(k), 0, 7); c.stroke();
      c.globalAlpha = 0.35 * (1 - k); c.beginPath(); c.arc(p.x, p.y, 20 + 50 * k, 0, 7); c.stroke(); c.globalAlpha = 1;
      if (i === 0) { c.globalAlpha = k; tag('нажим ' + rowOf(f, 'press')[1], p.x + 40, p.y + 44); c.globalAlpha = 1; }
    });
    // 6. связность — линия бежит по росчерку
    const ca = seg(a, 0.74, 0.96);
    if (ca > 0) {
      const tot = all.length, upto = Math.floor(tot * E.inOut(ca));
      c.strokeStyle = th.accent; c.lineWidth = 3.2; c.globalAlpha = 0.9; let n = 0;
      for (const st of this.strokes) { c.beginPath(); for (let i = 0; i < st.length && n < upto; i++, n++) i ? c.lineTo(st[i].x, st[i].y) : c.moveTo(st[i].x, st[i].y); c.stroke(); }
      if (upto < tot) { const p = all[upto]; c.fillStyle = th.accent; c.beginPath(); c.arc(p.x, p.y, 7, 0, 7); c.fill(); }
      c.globalAlpha = 1;
    }
  }

  drawGraph(a) {
    const c = this.cx.graph, all = this.strokes.flat(), n = all.length, gw = 740, gh = 92, th = this.th;
    c.clearRect(0, 0, gw, gh); if (n < 2) return;
    if (!this.gv) {
      // график: нажим с датчика, а без датчика — скорость пера (честно подписываем, что это)
      if (this.f.hasPressure) this.gv = all.map(p => typeof p.pr === 'number' ? p.pr : 0);
      else {
        const v = all.map((p, i) => { const q = all[i - 1]; return q && p.ts > q.ts ? Math.hypot(p.x - q.x, p.y - q.y) / (p.ts - q.ts) : 0; });
        const sm = v.map((_, i) => { let s = 0, k = 0; for (let j = Math.max(0, i - 4); j <= Math.min(v.length - 1, i + 4); j++) { s += v[j]; k++; } return s / k; });
        const mx = Math.max(...sm) || 1; this.gv = sm.map(x => x / mx);
      }
      this.el.graphLbl.textContent = this.f.hasPressure ? 'Нажим по ходу росчерка · датчик стилуса' : 'Скорость пера по ходу росчерка · датчика нажима нет';
    }
    const V = this.gv;
    const upto = Math.floor(n * E.inOut(seg(a, 0.05, 0.9)));
    c.strokeStyle = th.text; c.globalAlpha = 0.12; c.lineWidth = 1;
    for (let y = 0; y <= 3; y++) { c.beginPath(); c.moveTo(0, 6 + y * 26 + .5); c.lineTo(gw, 6 + y * 26 + .5); c.stroke(); }
    c.globalAlpha = 1;
    const X = i => i / (n - 1) * gw, Y = p => gh - 6 - p * (gh - 14);
    const g = c.createLinearGradient(0, 0, 0, gh); g.addColorStop(0, th.accent); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.beginPath(); c.moveTo(0, gh);
    for (let i = 0; i < upto; i += 2) c.lineTo(X(i), Y(V[i]));
    c.lineTo(X(Math.max(0, upto - 1)), gh); c.closePath(); c.globalAlpha = 0.35; c.fillStyle = g; c.fill(); c.globalAlpha = 1;
    c.beginPath(); for (let i = 0; i < upto; i += 2) i ? c.lineTo(X(i), Y(V[i])) : c.moveTo(X(i), Y(V[i]));
    c.strokeStyle = th.accent; c.lineWidth = 2; c.stroke();
    if (upto > 1 && upto < n) { c.fillStyle = th.accent; c.beginPath(); c.arc(X(upto - 1), Y(V[upto - 1]), 4.5, 0, 7); c.fill(); }
  }

  // ── результат ──
  async toResult() {
    if (this.aiReq) {
      const ai = await Promise.race([this.aiReq, new Promise(r => setTimeout(() => r(null), 7000))]);
      if (ai) Object.assign(this.pt, { title: ai.title, text: ai.text, facets: ai.facets, src: 'ai' });
      this.aiReq = null;
    }
    if (this.opt.api && this.sid) this.post({ mode: 'title', id: this.sid, title: this.pt.title, traits: this.pt.traits }).catch(() => {});
    this.state = 'result'; this.ev('result');
    const pt = this.pt; this.makeQr();
    this.el.title.innerHTML = pt.title.replace(/ (\S+)$/, ' <em>$1</em>');
    this.layoutRes(); this.fillFacets(pt, 0); this.el.qr.style.opacity = 0; this.el.txt.innerHTML = '';
    this.el.traits.querySelectorAll('.ag-tr').forEach(e => e.remove());
    pt.traits.forEach(([n, v]) => this.el.traits.insertAdjacentHTML('beforeend', `<div class="ag-tr"><span>${n}</span><b>${v}${NB}%</b><div class="tr"><i class="fi"></i></div></div>`));
    const trs = [...this.el.traits.querySelectorAll('.ag-tr')];
    this.el.title.style.opacity = 0;
    const ov = this.el.ov;
    await Promise.all([this.fade('an', 0, 500), this.tween(500, k => { ov.style.opacity = 1 - k; })]);
    this.cx.ov.clearRect(0, 0, CW, CH); ov.style.opacity = 1;
    this.fade('res', 1, 500);
    this.moveCard({ x: 56, y: 150, s: 0.46 }, 1000);
    await this.tween(900, k => { this.el.title.style.opacity = k; this.el.title.style.transform = `translateY(${(1 - k) * 26}px)`; }, E.out);
    trs.forEach((el, i) => this.tween(700 + i * 160, (k, r) => { const q = seg(r, i * 160 / (700 + i * 160), 1); el.style.opacity = q; el.querySelector('.fi').style.width = (E.out(q) * pt.traits[i][1]) + '%'; }, E.lin));
    const txt = pt.text, cps = this.opt.cps || 62;
    await this.tween(txt.length / cps * 1000, (k, r) => {
      const n = Math.floor(r * txt.length);
      this.el.txt.innerHTML = txt.slice(0, n) + (r < 1 ? '<i class="caret"></i>' : '');
    }, E.lin);
    const fs = [...this.el.facets.children];
    fs.forEach((el, i) => this.tween(600 + i * 180, (k, r) => { const q = E.out(seg(r, i * 180 / (600 + i * 180), 1)); el.style.opacity = q; el.style.transform = `translateY(${(1 - q) * 14}px)`; }, E.lin));
    await this.wait(700);
    await this.tween(800, k => { this.el.qr.style.opacity = k; this.el.qr.style.transform = `translateY(${(1 - k) * 16}px)`; }, E.out);
    this.ev('qr');
    this.resT0 = performance.now(); this.busy = false; this.ev('done');
  }

  mmPerUnit() {
    if (this.opt.mmPerUnit) return this.opt.mmPerUnit;
    const w = this.root.getBoundingClientRect().width;
    return (this.opt.mmPerCssPx || 0.19) * (w > 50 ? w / W : 1);   // 0,19 мм — CSS-пиксель планшета ~10–11″
  }
  featsOut(f) {
    const r1 = v => v == null ? null : +(+v).toFixed(1), r2 = v => v == null ? null : +(+v).toFixed(2);
    return { slant: r1(f.slant), rise: r1(f.rise), span: r1(f.span), mm: f.mm, widthMm: f.widthMm, connect: f.connect, strokes: f.strokes,
      hasPressure: f.hasPressure, press: r2(f.press), pressSd: r2(f.pressSd), pressMax: r2(f.pressMax), hasTilt: f.hasTilt, tilt: r1(f.tilt),
      speed: f.speed, time: f.time, round: r1(f.round) };
  }
  // подпись картинкой (чёрным по белому) — чтобы модель с компьютерным зрением видела саму форму букв
  sigImage() {
    const { x0, y0, x1, y1 } = this.f.box, pad = 24, sc = Math.min(560 / Math.max(1, x1 - x0), 240 / Math.max(1, y1 - y0), 1.2);
    const c = document.createElement('canvas'); c.width = Math.round((x1 - x0) * sc + pad * 2); c.height = Math.round((y1 - y0) * sc + pad * 2);
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
    x.strokeStyle = '#000'; x.lineCap = 'round'; x.lineJoin = 'round';
    for (const st of this.strokes) for (let i = 1; i < st.length; i++) {
      x.lineWidth = Math.max(1.2, (1.3 + 6.4 * st[i].p) * sc); x.beginPath();
      x.moveTo((st[i - 1].x - x0) * sc + pad, (st[i - 1].y - y0) * sc + pad); x.lineTo((st[i].x - x0) * sc + pad, (st[i].y - y0) * sc + pad); x.stroke();
    }
    return c.toDataURL('image/png');
  }
  post(body, ms = 12000) {
    const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), ms);
    return fetch(this.opt.api, { method: 'POST', signal: ctl.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .finally(() => clearTimeout(tm));
  }
  async fetchPortrait(f, image) {
    try {
      const r = await this.post({ mode: 'short', id: this.sid, f: this.featsOut(f), event: this.th.event, title: this.pt.title, image }, 9000);
      if (!r.ok) return null;
      const o = await r.json();
      return o && o.title && o.text && Array.isArray(o.facets) ? o : null;
    } catch (e) { return null; }
  }
  postFull(f, image) {
    this.post({ mode: 'full', id: this.sid, f: this.featsOut(f), event: this.th.event, theme: this.themeName, title: this.pt.title, image }, 60000).catch(() => {});
  }
  // QR: с облаком — короткая ссылка на номер сеанса (полный разбор уже готовится); без облака — замеры в адресе
  makeQr() {
    if (!this.opt.fullUrl || !global.qrcode || !this.f) return;
    let url;
    if (this.sid) url = this.opt.fullUrl + '?' + new URLSearchParams({ id: this.sid, e: this.themeName }).toString();
    else {
      const f = this.featsOut(this.f), q = new URLSearchParams({ s: f.slant, w: f.span, h: f.mm, c: f.connect, r: f.rise, n: f.strokes, e: this.themeName, t: this.pt.title });
      if (f.hasPressure) q.set('p', f.press); if (f.speed) q.set('v', f.speed);
      url = this.opt.fullUrl + '?' + q.toString();
    }
    this.qrUrl = url;
    const qr = global.qrcode(0, 'M'); qr.addData(url); qr.make();
    const n = qr.getModuleCount(); let d = '';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.isDark(y, x)) d += `M${x} ${y}h1v1h-1z`;
    this.el.qr.querySelector('.code').innerHTML = `<svg viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges"><path fill="currentColor" d="${d}"/></svg>`;
  }
  layoutRes() { this.el.txt.style.top = (154 + this.el.title.offsetHeight + 30) + 'px'; }
  fillFacets(pt, op) {
    this.el.facets.innerHTML = pt.facets.map(([h, t]) => `<div style="opacity:${op}"><div class="lbl">${h}</div><p>${t}</p></div>`).join('');
  }

  // мгновенно показать готовый результат (для витрины тем в трейлере)
  instantResult(i = 0) {
    const sg = SIGS[i % SIGS.length]; this.clearInk(); this.clearGhost();
    for (let j = 0; j < sg.strokes.length; j++) { const st = synthStroke(sg.strokes[j], sg.dur[j], 1 + j + i), cur = []; this.strokes.push(cur); for (const p of st) { p.pr = p.p; p.tilt = 55; p.ts = p.t * 1000; this.addPoint(cur, p); } }
    this.f = analyse(this.strokes, this.mmPerUnit()); this.pt = portrait(this.f);
    const pt = this.pt; this.state = 'result';
    this.el.title.innerHTML = pt.title.replace(/ (\S+)$/, ' <em>$1</em>'); this.el.txt.textContent = pt.text; this.layoutRes(); this.fillFacets(pt, 1); this.el.qr.style.opacity = 1;
    this.el.traits.querySelectorAll('.ag-tr').forEach(e => e.remove());
    pt.traits.forEach(([n, v]) => this.el.traits.insertAdjacentHTML('beforeend', `<div class="ag-tr" style="opacity:1"><span>${n}</span><b>${v}${NB}%</b><div class="tr"><i class="fi" style="width:${v}%"></i></div></div>`));
    for (const s of ['attract', 'sign', 'an']) { this.el[s].style.opacity = 0; this.show(s, false); }
    this.el.res.style.opacity = 1; this.show('res', true);
    this.cardPos = { x: 56, y: 150, s: 0.46, o: 1 }; this.applyCard();
  }
}

global.AutographApp = AutographApp;
global.AutographApp.SIGS = SIGS; global.AutographApp.portrait = portrait; global.AutographApp.rows = rows; global.AutographApp.synthStroke = synthStroke; global.AutographApp.THEMES = THEMES; global.AutographApp.MARKS = MARKS;
})(window);
