// SmartBite feature tour: a short, swipeable walkthrough shown once after the first login,
// and any time from Profile → "Take the tour". Self-contained: it only needs a language code
// and a callback for the "Try it" buttons, so it cannot break the rest of the app.

const K = '#241034';
const face = (cx, cy, s, mood = 'happy') => {
  const e = 5.2 * s, g = 13 * s;
  const eyes = `<circle cx="${cx - g}" cy="${cy}" r="${e}" fill="${K}"/><circle cx="${cx + g}" cy="${cy}" r="${e}" fill="${K}"/><circle cx="${cx - g + 1.8 * s}" cy="${cy - 1.8 * s}" r="${1.8 * s}" fill="#fff"/><circle cx="${cx + g + 1.8 * s}" cy="${cy - 1.8 * s}" r="${1.8 * s}" fill="#fff"/>`;
  if (mood !== 'happy') return eyes + `<path d="M${cx - 8 * s} ${cy + 15 * s} Q ${cx} ${cy + 7 * s} ${cx + 8 * s} ${cy + 15 * s}" fill="none" stroke="${K}" stroke-width="${3.5 * s}" stroke-linecap="round"/><path d="M${cx - g - 7 * s} ${cy - 10 * s} L ${cx - g + 6 * s} ${cy - 6 * s}M${cx + g + 7 * s} ${cy - 10 * s} L ${cx + g - 6 * s} ${cy - 6 * s}" stroke="${K}" stroke-width="${3.2 * s}" stroke-linecap="round"/>`;
  return eyes + `<ellipse cx="${cx - g - 6 * s}" cy="${cy + 9 * s}" rx="${5 * s}" ry="${3 * s}" fill="#FF8FAB"/><ellipse cx="${cx + g + 6 * s}" cy="${cy + 9 * s}" rx="${5 * s}" ry="${3 * s}" fill="#FF8FAB"/><path d="M${cx - 8 * s} ${cy + 8 * s} Q ${cx} ${cy + 19 * s} ${cx + 8 * s} ${cy + 8 * s} Z" fill="${K}"/>`;
};
const svg = (vb, inner) => `<svg viewBox="${vb}" aria-hidden="true" focusable="false">${inner}</svg>`;
const ART = {
  phone: svg('0 0 120 180', `<path d="M60 140 L 6 178 L 114 178 Z" fill="#FFE27A" opacity=".8"/><rect x="20" y="6" width="80" height="140" rx="18" fill="#5B2A86" stroke="${K}" stroke-width="5"/><rect x="28" y="18" width="64" height="104" rx="10" fill="#E9F7FF" stroke="${K}" stroke-width="3"/><rect x="48" y="128" width="24" height="8" rx="4" fill="#FFC93C"/><path d="M34 30 h10 M34 30 v10 M86 30 h-10 M86 30 v10 M34 110 h10 M34 110 v-10 M86 110 h-10 M86 110 v-10" stroke="#FB8500" stroke-width="4" stroke-linecap="round"/>${face(60, 62, 0.95)}`),
  chips: svg('0 0 130 170', `<path d="M14 20 L 24 12 L 34 20 L 44 12 L 54 20 L 64 12 L 74 20 L 84 12 L 94 20 L 104 12 L 116 20 L 120 156 L 110 164 L 98 156 L 86 164 L 74 156 L 62 164 L 50 156 L 38 164 L 26 156 L 12 160 Z" fill="#FFB703" stroke="${K}" stroke-width="5" stroke-linejoin="round"/><ellipse cx="66" cy="120" rx="30" ry="18" fill="#FFE08A" stroke="${K}" stroke-width="4"/>${face(66, 66, 1, 'grumpy')}`),
  plate: svg('0 0 170 140', `<circle cx="88" cy="74" r="64" fill="${K}"/><circle cx="84" cy="70" r="64" fill="#E4E8EE" stroke="${K}" stroke-width="5"/><circle cx="84" cy="70" r="55" fill="none" stroke="#A7AFBA" stroke-width="2"/><path d="M36 48 A 52 52 0 0 1 66 22" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
    <circle cx="60" cy="44" r="16" fill="#C9D0D8" stroke="${K}" stroke-width="3"/><circle cx="60" cy="44" r="11.5" fill="#F5B528"/><circle cx="56" cy="41" r="1.6" fill="#B5300B"/><circle cx="63" cy="46" r="1.6" fill="#2E7D32"/>
    <circle cx="92" cy="34" r="16" fill="#C9D0D8" stroke="${K}" stroke-width="3"/><circle cx="92" cy="34" r="11.5" fill="#E2621F"/><rect x="86" y="29" width="5" height="5" rx="1" fill="#FFF4DC"/><rect x="94" y="35" width="5" height="5" rx="1" fill="#FFF4DC"/>
    <circle cx="120" cy="52" r="15" fill="#C9D0D8" stroke="${K}" stroke-width="3"/><circle cx="120" cy="52" r="10.5" fill="#FBFBF7"/>
    <circle cx="56" cy="88" r="21" fill="#EBC27E" stroke="${K}" stroke-width="3"/><circle cx="51" cy="84" r="2.6" fill="#A8692A"/><circle cx="62" cy="92" r="2.2" fill="#A8692A"/><circle cx="54" cy="96" r="1.8" fill="#A8692A"/>
    <path d="M86 78 C 84 64, 106 60, 114 70 C 124 74, 120 94, 106 96 C 94 100, 84 92, 86 78 Z" fill="#fff" stroke="${K}" stroke-width="3"/>
    <circle cx="88" cy="112" r="12" fill="#F6DFA8" stroke="${K}" stroke-width="2.5"/><circle cx="85" cy="110" r="1.3" fill="#6B4A2B"/><circle cx="91" cy="115" r="1.3" fill="#6B4A2B"/>
    <circle cx="124" cy="94" r="8" fill="#E63946" stroke="${K}" stroke-width="2.5"/><circle cx="116" cy="104" r="7" fill="#3E9B4F" stroke="${K}" stroke-width="2.5"/><circle cx="116" cy="104" r="4.5" fill="#D9F2C4"/>
    <circle cx="70" cy="64" r="5" fill="#D9480F" stroke="${K}" stroke-width="2"/>
    <circle cx="103" cy="80" r="2.6" fill="${K}"/><circle cx="111" cy="80" r="2.6" fill="${K}"/><path d="M102 86 Q 107 91 112 86" fill="none" stroke="${K}" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="99" cy="85" rx="2.6" ry="1.6" fill="#FF8FAB"/><ellipse cx="115" cy="85" rx="2.6" ry="1.6" fill="#FF8FAB"/>`),
  apple: svg('0 0 120 130', `<path d="M60 30 C 20 10, -5 55, 18 95 C 32 122, 50 118, 60 112 C 70 118, 88 122, 102 95 C 125 55, 100 10, 60 30 Z" fill="#FF4D4D" stroke="${K}" stroke-width="5"/><path d="M30 45 Q 24 60 28 72" stroke="#fff" stroke-width="6" stroke-linecap="round" fill="none" opacity=".7"/><path d="M60 30 Q 58 14 66 4" stroke="${K}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M64 14 C 78 0, 98 6, 96 16 C 86 24, 72 22, 64 14 Z" fill="#3DBE6E" stroke="${K}" stroke-width="4"/>${face(60, 66, 1)}`),
  bubble: svg('0 0 150 130', `<path d="M14 14 H 136 Q 146 14 146 24 V 84 Q 146 94 136 94 H 62 L 34 120 L 40 94 H 14 Q 4 94 4 84 V 24 Q 4 14 14 14 Z" fill="#fff" stroke="${K}" stroke-width="5" stroke-linejoin="round"/>${face(75, 46, 1)}`),
  star: svg('0 0 100 100', `<path d="M50 4 61 37 96 38 68 59 78 94 50 73 22 94 32 59 4 38 39 37Z" fill="#FFC93C" stroke="${K}" stroke-width="6" stroke-linejoin="round"/>`),
  carrot: svg('0 0 110 170', `<path d="M42 30 Q 30 0 44 4 Q 52 18 55 28 Q 58 2 72 6 Q 74 22 64 32 Q 92 12 92 26 Q 82 38 66 40 Z" fill="#3DBE6E" stroke="${K}" stroke-width="4"/><path d="M20 40 Q 55 22 92 40 Q 82 110 58 162 Q 52 168 48 160 Q 26 110 20 40 Z" fill="#FF8A1F" stroke="${K}" stroke-width="5"/>${face(56, 62, 0.95)}`),
};

// go: what the "Try it" button does (a page link, or a named action handled by the app)
const SLIDES = [
  { art: ['phone'], bg: '#FFF1C7', go: null },
  { art: ['phone', 'chips'], bg: '#FFE3EC', go: '#/scan/barcode' },
  { art: ['plate'], bg: '#E3F6FF', go: '#/scan/plate' },
  { art: ['chips', 'apple'], bg: '#E6F8EC', go: '#/swaps' },
  { art: ['bubble'], bg: '#EFE6FB', go: 'chat' },
  { art: ['star', 'carrot'], bg: '#FFF1C7', go: '#/play' },
  { art: ['apple', 'carrot'], bg: '#FFE9D6', go: '#/profile' },
];
const TEXT = {
  en: {
    skip: 'Skip', next: 'Next', back: 'Back', done: "Let's go!", tryit: 'Try it', of: 'of', label: 'SmartBite tour',
    s: [
      ['Welcome to SmartBite!', 'Find out what is really inside your food in 5 seconds. Here is a quick tour of what you can do.'],
      ['Scan any packet', 'Scan the barcode or take a photo of the pack. You get an honest verdict for adults and a separate one for kids.'],
      ['Check your thali', 'Snap a photo of your plate, thali or street food. SmartBite estimates the calories, sugar, salt and fat.'],
      ['Find a healthier swap', 'Type any dish, from vada pav to rasmalai, and get a tasty desi swap that is better for you.'],
      ['Ask Bitu anything', 'Bitu is your AI food buddy. Ask about snacks, E-numbers or tiffin ideas in English, हिन्दी or मराठी.'],
      ['Track, play and earn', 'Track your sugar and salt, play food games and quizzes, and earn SmartBite Coins for healthy choices.'],
      ['Make it yours', 'Add your age group, diet and allergies in Profile so every verdict fits you. You can open this tour again from Profile.'],
    ],
  },
  hi: {
    skip: 'छोड़ें', next: 'आगे', back: 'पीछे', done: 'चलो शुरू करें!', tryit: 'आज़माएँ', of: '/', label: 'SmartBite टूर',
    s: [
      ['SmartBite में आपका स्वागत है!', '5 सेकंड में जानिए आपके खाने में असल में क्या है। आइए देखें आप क्या-क्या कर सकते हैं।'],
      ['कोई भी पैकेट स्कैन करें', 'बारकोड स्कैन करें या पैकेट की फ़ोटो लें। बड़ों और बच्चों के लिए अलग-अलग सच्चा फ़ैसला मिलेगा।'],
      ['अपनी थाली जाँचें', 'अपनी थाली, प्लेट या स्ट्रीट फ़ूड की फ़ोटो लें। SmartBite कैलोरी, चीनी, नमक और फ़ैट का अंदाज़ा बताएगा।'],
      ['हेल्दी स्वैप खोजें', 'वड़ा पाव से रसमलाई तक, कोई भी डिश लिखें और एक स्वादिष्ट, बेहतर देसी विकल्प पाएँ।'],
      ['बिटू से कुछ भी पूछें', 'बिटू आपका AI फ़ूड दोस्त है। स्नैक्स, E-नंबर या टिफ़िन आइडिया के बारे में पूछें, English, हिन्दी या मराठी में।'],
      ['ट्रैक करें, खेलें, कमाएँ', 'अपनी चीनी और नमक ट्रैक करें, फ़ूड गेम और क्विज़ खेलें, और हेल्दी चुनाव पर SmartBite कॉइन कमाएँ।'],
      ['इसे अपना बनाएँ', 'प्रोफ़ाइल में अपनी उम्र, खान-पान और एलर्जी जोड़ें ताकि हर फ़ैसला आपके हिसाब से हो। यह टूर प्रोफ़ाइल से फिर खोल सकते हैं।'],
    ],
  },
  mr: {
    skip: 'वगळा', next: 'पुढे', back: 'मागे', done: 'चला सुरू करूया!', tryit: 'वापरून पाहा', of: '/', label: 'SmartBite टूर',
    s: [
      ['SmartBite मध्ये स्वागत आहे!', '5 सेकंदांत जाणून घ्या तुमच्या अन्नात खरंच काय आहे. तुम्ही काय काय करू शकता ते पाहूया.'],
      ['कोणतंही पॅकेट स्कॅन करा', 'बारकोड स्कॅन करा किंवा पॅकेटचा फोटो घ्या. मोठ्यांसाठी आणि मुलांसाठी वेगवेगळा प्रामाणिक निर्णय मिळेल.'],
      ['तुमचं ताट तपासा', 'तुमच्या ताटाचा, प्लेटचा किंवा स्ट्रीट फूडचा फोटो घ्या. SmartBite कॅलरी, साखर, मीठ आणि फॅटचा अंदाज देईल.'],
      ['हेल्दी पर्याय शोधा', 'वडा पाव ते रसमलाई, कोणतीही डिश लिहा आणि चविष्ट, अधिक चांगला देसी पर्याय मिळवा.'],
      ['बिटूला काहीही विचारा', 'बिटू तुमचा AI फूड मित्र आहे. स्नॅक्स, E-नंबर किंवा डब्याच्या कल्पनांबद्दल English, हिन्दी किंवा मराठीत विचारा.'],
      ['ट्रॅक करा, खेळा, कमवा', 'साखर आणि मीठ ट्रॅक करा, फूड गेम्स आणि क्विझ खेळा, आणि हेल्दी निवडीसाठी SmartBite कॉइन्स कमवा.'],
      ['ते तुमचं बनवा', 'प्रोफाइलमध्ये तुमचा वयोगट, आहार आणि ॲलर्जी भरा म्हणजे प्रत्येक निर्णय तुमच्यासाठी योग्य असेल. हा टूर प्रोफाइलमधून पुन्हा उघडता येतो.'],
    ],
  },
};

let open = false;
export function openTour({ lang = 'en', onGo = () => {}, onClose = () => {} } = {}) {
  if (open) return;
  open = true;
  const tx = TEXT[lang] || TEXT.en;
  const prevFocus = document.activeElement;
  const root = document.createElement('div');
  root.className = 'tour';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', tx.label);
  root.innerHTML = `<div class="tour-card">
      <button class="tour-skip" type="button">${tx.skip}</button>
      <div class="tour-track">${SLIDES.map((s, i) => `
        <section class="tour-slide" aria-hidden="${i ? 'true' : 'false'}" style="--tbg:${s.bg}">
          <div class="tour-art">${s.art.map((a, j) => `<span class="tour-mascot m${j}">${ART[a]}</span>`).join('')}<span class="tour-spark s1">${ART.star}</span></div>
          <h2>${tx.s[i][0]}</h2>
          <p>${tx.s[i][1]}</p>
          ${s.go ? `<button class="tour-try" type="button" data-go="${s.go}">${tx.tryit} →</button>` : ''}
        </section>`).join('')}</div>
      <div class="tour-foot">
        <button class="tour-back" type="button">${tx.back}</button>
        <div class="tour-dots" aria-hidden="true">${SLIDES.map(() => '<i></i>').join('')}</div>
        <button class="tour-next" type="button">${tx.next}</button>
      </div>
      <p class="tour-count" aria-live="polite"></p>
    </div>`;
  document.body.appendChild(root);
  document.body.classList.add('tour-open');
  const card = root.querySelector('.tour-card');
  card.addEventListener('scroll', () => { if (card.scrollLeft) card.scrollLeft = 0; });
  const track = root.querySelector('.tour-track'), slides = [...root.querySelectorAll('.tour-slide')], dots = [...root.querySelectorAll('.tour-dots i')];
  const next = root.querySelector('.tour-next'), back = root.querySelector('.tour-back'), count = root.querySelector('.tour-count');
  let i = 0;
  const show = (n) => {
    i = Math.max(0, Math.min(SLIDES.length - 1, n));
    track.style.transform = `translateX(${-i * 100}%)`;
    slides.forEach((s, k) => { s.setAttribute('aria-hidden', k === i ? 'false' : 'true'); s.classList.toggle('on', k === i); s.inert = k !== i; });
    card.scrollLeft = 0; track.scrollLeft = 0; // never let focus or the browser nudge the slides sideways
    dots.forEach((d, k) => d.classList.toggle('on', k === i));
    back.style.visibility = i ? 'visible' : 'hidden';
    next.textContent = i === SLIDES.length - 1 ? tx.done : tx.next;
    count.textContent = `${i + 1} ${tx.of} ${SLIDES.length}`;
  };
  const close = (go) => {
    if (!open) return;
    open = false;
    document.removeEventListener('keydown', onKey);
    root.classList.add('closing');
    document.body.classList.remove('tour-open');
    setTimeout(() => root.remove(), 220);
    try { prevFocus && prevFocus.focus && prevFocus.focus(); } catch {}
    onClose();
    if (go) onGo(go);
  };
  const onKey = (e) => {
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') show(i + 1);
    else if (e.key === 'ArrowLeft') show(i - 1);
    else if (e.key === 'Tab') { // keep focus inside the tour
      const f = [...root.querySelectorAll('button')].filter((b) => b.offsetParent && b.style.visibility !== 'hidden' && !b.closest('[aria-hidden="true"]'));
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  };
  document.addEventListener('keydown', onKey);
  root.addEventListener('click', (e) => {
    if (e.target === root) return close();
    if (e.target.closest('.tour-skip')) return close();
    const t = e.target.closest('[data-go]');
    if (t) return close(t.dataset.go);
    if (e.target.closest('.tour-next')) return i === SLIDES.length - 1 ? close() : show(i + 1);
    if (e.target.closest('.tour-back')) return show(i - 1);
  });
  // swipe
  let x0 = null;
  track.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', (e) => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1)); x0 = null; });
  show(0);
  requestAnimationFrame(() => { root.classList.add('in'); next.focus(); });
}
export { ART };
