import { pool } from '../src/db/pool';
import { icon as svgIcon } from './lib/icons';

const SLUG = 'history';

const JOURNEY_ICONS = [
  svgIcon('flag'),
  svgIcon('bank'),
  svgIcon('coin'),
  svgIcon('shield'),
  svgIcon('trendingUp'),
  svgIcon('smartphone'),
];
const MILESTONE_ICONS = [
  svgIcon('flag', 20),
  svgIcon('bank', 20),
  svgIcon('coin', 20),
  svgIcon('shield', 20),
  svgIcon('trendingUp', 20),
  svgIcon('smartphone', 20),
  svgIcon('smartphone', 20),
  svgIcon('bank', 20),
];

function journeyItem(icon: string, year: string, title: string, body: string): string {
  return `
  <div class="history-journey-item">
    <div class="history-journey-dot">${icon}</div>
    <div class="history-journey-year">${year}</div>
    <h4>${title}</h4>
    <p>${body}</p>
  </div>`;
}

function milestoneCard(icon: string, year: string, label: string): string {
  return `<div class="history-milestone-card"><div class="history-milestone-icon">${icon}</div><div class="history-milestone-year">${year}</div><div class="history-milestone-label">${label}</div></div>`;
}

function buildBody(t: {
  intro: string[];
  foundationTitle: string;
  foundationBody: string;
  quote: string;
  journeyTitle: string;
  journey: { year: string; title: string; body: string }[];
  milestonesTitle: string;
  milestones: { year: string; label: string }[];
  legacyTitle: string;
  legacyBody: string;
  aheadTitle: string;
  aheadBody: string;
  ctaTitle: string;
  ctaBody: string;
  ctaButton: string;
}): string {
  const introParas = t.intro.map((p) => `<p>${p}</p>`).join('\n');
  const journeyItems = t.journey.map((j, i) => journeyItem(JOURNEY_ICONS[i], j.year, j.title, j.body)).join('\n');
  const milestoneCards = t.milestones.map((m, i) => milestoneCard(MILESTONE_ICONS[i], m.year, m.label)).join('');

  return `
<div class="history-intro-grid">
  <div class="history-intro-text">
    ${introParas}
  </div>
  <div class="history-intro-side">
    <div class="history-fact-box">
      <div class="history-fact-icon">${svgIcon('calendar', 24)}</div>
      <h4>${t.foundationTitle}</h4>
      <p>${t.foundationBody}</p>
    </div>
    <div class="history-quote-box">
      <div class="history-quote-icon">&ldquo;</div>
      <p>${t.quote}</p>
    </div>
  </div>
</div>

<div class="history-fullbleed history-journey">
  <div class="history-journey-inner">
    <h2 class="history-journey-title">${t.journeyTitle}</h2>
    <div class="history-journey-underline"></div>
    <div class="history-journey-track">
      ${journeyItems}
    </div>
  </div>
</div>

<div class="content-wide"><div class="content-wide-inner">
<h2 class="history-milestones-heading">${t.milestonesTitle}</h2>
<div class="history-milestones">
  ${milestoneCards}
</div>
</div></div>

<div class="content-wide"><div class="content-wide-inner">
<div class="history-callouts">
  <div class="history-callout history-callout-legacy">
    <h3>${t.legacyTitle}</h3>
    <p>${t.legacyBody}</p>
  </div>
  <div class="history-callout history-callout-ahead">
    <h3>${t.aheadTitle}</h3>
    <p>${t.aheadBody}</p>
  </div>
</div>
</div></div>

<div class="history-fullbleed history-cta">
  <div class="history-cta-inner">
    <div class="history-cta-icon">${svgIcon('building', 26)}</div>
    <div class="history-cta-text">
      <h3>${t.ctaTitle}</h3>
      <p>${t.ctaBody}</p>
    </div>
    <a class="history-cta-btn" href="/core-functions">${t.ctaButton} →</a>
  </div>
</div>
`.trim();
}

const enBody = buildBody({
  intro: [
    "The Bank of Somaliland (BoSL) was established as the Central Monetary Authority of the Republic of Somaliland following the restoration of Somaliland's independence in 1991. As the country rebuilt its national institutions, the creation of a central bank became essential for developing a stable financial system, issuing a national currency, and supporting economic growth.",
    'Since its establishment, the Bank has played a leading role in strengthening monetary policy, regulating financial institutions, maintaining public confidence, and promoting financial stability. Over the years, BoSL has expanded its responsibilities to oversee banks, money transfer businesses, mobile money operators, insurance companies, and national payment systems.',
    'Today, the Bank continues to modernize its operations by embracing digital financial services, strengthening financial regulation, improving payment infrastructure, and aligning its supervisory framework with international best practices.',
  ],
  foundationTitle: 'Our Foundation',
  foundationBody: "Established in 1994 as Somaliland's Central Monetary Authority.",
  quote: 'Committed to monetary stability, financial integrity, and sustainable economic growth for Somaliland.',
  journeyTitle: 'Our Journey Through Time',
  journey: [
    { year: '1991', title: 'Restoration of Independence', body: 'Following the restoration of the Republic of Somaliland, the government began establishing key national institutions.' },
    { year: '1994', title: 'Establishment of BoSL', body: "The Bank of Somaliland was officially established as the country's Central Monetary Authority." },
    { year: '1995', title: 'Introduction of the Somaliland Shilling', body: 'The Somaliland Shilling became the official national currency, providing economic sovereignty.' },
    { year: '2000–2010', title: 'Expansion of Financial Regulation', body: 'The Bank strengthened its supervisory role by licensing banks and regulating financial institutions.' },
    { year: '2011–2020', title: 'Financial Sector Modernization', body: 'Stronger regulatory frameworks, improved foreign exchange management, and financial inclusion.' },
    { year: '2021–Present', title: 'Digital Transformation', body: 'Focus on digital payments, mobile money, FinTech, cybersecurity, consumer protection and modernization.' },
  ],
  milestonesTitle: 'Key Milestones',
  milestones: [
    { year: '1991', label: "Restoration of Somaliland's Independence" },
    { year: '1994', label: 'Bank of Somaliland Established' },
    { year: '1995', label: 'Somaliland Shilling Introduced' },
    { year: '2000', label: 'Banking Supervision Expanded' },
    { year: '2010', label: 'Stronger Financial Regulations' },
    { year: '2018', label: 'Modern Payment System Initiatives' },
    { year: '2022', label: 'Digital Financial Services Strengthened' },
    { year: 'Today', label: 'Modern Central Bank Serving Somaliland' },
  ],
  legacyTitle: 'Our Legacy',
  legacyBody:
    'For more than three decades, the Bank of Somaliland has remained committed to maintaining monetary stability, safeguarding the financial system, and supporting national development. Through sound governance, effective regulation, and continuous modernization, the Bank continues to build a resilient financial sector that serves businesses, investors, and citizens across Somaliland.',
  aheadTitle: 'Looking Ahead',
  aheadBody:
    'The Bank of Somaliland is committed to becoming a modern, transparent, and technology-driven central bank that supports sustainable economic growth, financial innovation, and greater financial inclusion for future generations.',
  ctaTitle: 'Learn More About BoSL',
  ctaBody: "Explore our functions, publications, exchange rates, and initiatives that strengthen Somaliland's financial system.",
  ctaButton: 'Explore BoSL Functions',
});

const soBody = buildBody({
  intro: [
    "Baanka Somaliland (BoSL) waxaa loo aasaasay inuu noqdo Xafiiska Dhexe ee Lacagta ee Jamhuuriyadda Somaliland ka dib soo-noqoshada madax-bannaanida Somaliland ee 1991. Markii dalku dib u dhisayay hay'adihiisa qaranka, aasaaska bangi dhexe wuxuu noqday mid lagama maarmaan ah si loo horumariyo nidaam maaliyadeed oo xasilloon, loo soo saaro lacag qaran, oo loo taageero koritaanka dhaqaalaha.",
    "Tan iyo aasaaskiisa, Baanku wuxuu door weyn ka ciyaaray xoojinta siyaasadda lacagta, kormeerka hay'adaha maaliyadeed, ilaalinta kalsoonida dadweynaha, iyo horumarinta xasilloonida maaliyadeed. BoSL waxay ballaarisay masuuliyadaheeda si ay u kormeerto bangiyada, ganacsiyada wareejinta lacagta, hay'adaha lacagta mobilada, shirkadaha caymiska, iyo nidaamyada bixinta qaranka.",
    'Maanta, Baanku wuxuu sii wadaa casriyeynta hawlihiisa isagoo qaadanaya adeegyada maaliyadeed ee dhijitaalka ah, xoojinta sharciyada maaliyadeed, iyo isku-duubidda qaab-dhismeedka kormeerka heerarka caalamiga ah.',
  ],
  foundationTitle: 'Aasaaskeenna',
  foundationBody: "Waxaa la aasaasay 1994 inuu noqdo Xafiiska Dhexe ee Lacagta ee Somaliland.",
  quote: 'Ku dadaalka xasilloonida lacagta, daacadnimada maaliyadeed, iyo koritaanka dhaqaale ee waarta ee Somaliland.',
  journeyTitle: 'Safarkeenna Waqtiga',
  journey: [
    { year: '1991', title: 'Soo Noqoshada Madax-bannaanida', body: 'Ka dib soo-noqoshada Jamhuuriyadda Somaliland, dawladdu waxay bilowday dhismaha hay\'adaha qaranka.' },
    { year: '1994', title: 'Aasaaska BoSL', body: 'Baanka Somaliland waxaa si rasmi ah loo aasaasay inuu noqdo Xafiiska Dhexe ee Lacagta.' },
    { year: '1995', title: 'Shilingka Somaliland', body: 'Shilingka Somaliland wuxuu noqday lacagta rasmiga ah, isagoo xoojinaya madax-bannaanida dhaqaalaha.' },
    { year: '2000–2010', title: 'Ballaarinta Sharciyada Maaliyadeed', body: 'Baanku wuxuu xoojiyay doorkiisa kormeerka isagoo shati siinaya bangiyada.' },
    { year: '2011–2020', title: 'Casriyeynta Qaybta Maaliyadeed', body: 'Qaab-dhismeedyo sharci oo xoog badan, maamul sarifa oo la horumariyay, iyo dhaqan-galin maaliyadeed.' },
    { year: '2021–Hadda', title: 'Kala-guurka Dhijitaalka ah', body: 'Diiradda waxaa lagu saaray bixinta dhijitaalka ah, lacagta mobilka, FinTech, amniga, iyo ilaalinta macaamiisha.' },
  ],
  milestonesTitle: 'Guulaha Muhiimka ah',
  milestones: [
    { year: '1991', label: 'Soo Noqoshada Madax-bannaanida Somaliland' },
    { year: '1994', label: 'Aasaaska Baanka Somaliland' },
    { year: '1995', label: 'Soo Bandhigidda Shilingka Somaliland' },
    { year: '2000', label: 'Kormeerka Bangiyada oo la Ballaariyay' },
    { year: '2010', label: 'Sharciyo Maaliyadeed oo la Xoojiyay' },
    { year: '2018', label: 'Hindisayaal Nidaam Bixineed oo Casri ah' },
    { year: '2022', label: 'Adeegyada Dhijitaalka ah oo la Xoojiyay' },
    { year: 'Hadda', label: 'Bangi Dhexe oo Casri ah oo u Adeega Somaliland' },
  ],
  legacyTitle: 'Dhaxalkeenna',
  legacyBody:
    "In ka badan saddex tobanle-sano, Baanka Somaliland wuxuu sii ilaaliyay ballan-qaadkiisa xasilinta lacagta, ilaalinta nidaamka maaliyadeed, iyo taageeridda horumarka qaranka. Baanku wuxuu sii wadaa dhismaha qayb maaliyadeed oo adkaysi leh oo u adeegta ganacsiyada, maalgashadayaasha, iyo muwaadiniinta Somaliland oo dhan.",
  aheadTitle: 'Aragtida Mustaqbalka',
  aheadBody:
    'Baanka Somaliland waxa uu ballan-qaad u haya inuu noqdo bangi dhexe casri ah, la daaha-furan, oo tignoolajiyad ku dhisan, kaas oo taageeraya koritaanka dhaqaale ee waarta iyo dhaqan-galinta maaliyadeed ee jiilalka soo socda.',
  ctaTitle: 'Wax Badan ka Ogow BoSL',
  ctaBody: "Sahami hawlaha, daabacadaha, qiimaha sarifka, iyo hindisayaasha xoojinaya nidaamka maaliyadeed ee Somaliland.",
  ctaButton: 'Sahami Hawlaha BoSL',
});

const arBody = buildBody({
  intro: [
    'تأسس بنك أرض الصومال (BoSL) ليكون السلطة النقدية المركزية لجمهورية أرض الصومال عقب استعادة استقلال أرض الصومال عام 1991. ومع إعادة بناء البلاد لمؤسساتها الوطنية، أصبح إنشاء بنك مركزي أمرًا ضروريًا لتطوير نظام مالي مستقر، وإصدار عملة وطنية، ودعم النمو الاقتصادي.',
    'منذ تأسيسه، لعب البنك دورًا رائدًا في تعزيز السياسة النقدية، وتنظيم المؤسسات المالية، والحفاظ على ثقة الجمهور، وتعزيز الاستقرار المالي. وسّع البنك مسؤولياته لتشمل الإشراف على البنوك، وشركات تحويل الأموال، ومشغلي الأموال عبر الهاتف المحمول، وشركات التأمين، وأنظمة الدفع الوطنية.',
    'واليوم، يواصل البنك تحديث عملياته من خلال تبني الخدمات المالية الرقمية، وتعزيز التنظيم المالي، ومواءمة إطاره الرقابي مع أفضل الممارسات الدولية.',
  ],
  foundationTitle: 'تأسيسنا',
  foundationBody: 'تأسس عام 1994 ليكون السلطة النقدية المركزية لأرض الصومال.',
  quote: 'ملتزمون بالاستقرار النقدي والنزاهة المالية والنمو الاقتصادي المستدام لأرض الصومال.',
  journeyTitle: 'رحلتنا عبر الزمن',
  journey: [
    { year: '1991', title: 'استعادة الاستقلال', body: 'عقب استعادة جمهورية أرض الصومال، بدأت الحكومة في إنشاء المؤسسات الوطنية الرئيسية.' },
    { year: '1994', title: 'تأسيس البنك', body: 'تأسس بنك أرض الصومال رسميًا ليكون السلطة النقدية المركزية للبلاد.' },
    { year: '1995', title: 'إصدار شلن أرض الصومال', body: 'أصبح شلن أرض الصومال العملة الوطنية الرسمية معززًا السيادة الاقتصادية.' },
    { year: '2000–2010', title: 'توسيع التنظيم المالي', body: 'عزز البنك دوره الرقابي من خلال ترخيص البنوك وتنظيم المؤسسات المالية.' },
    { year: '2011–2020', title: 'تحديث القطاع المالي', body: 'أطر تنظيمية أقوى، وتحسين إدارة الصرف الأجنبي، وتعزيز الشمول المالي.' },
    { year: '2021–الحاضر', title: 'التحول الرقمي', body: 'التركيز على المدفوعات الرقمية، والأموال عبر الهاتف، والتكنولوجيا المالية، والأمن السيبراني.' },
  ],
  milestonesTitle: 'أبرز الإنجازات',
  milestones: [
    { year: '1991', label: 'استعادة استقلال أرض الصومال' },
    { year: '1994', label: 'تأسيس بنك أرض الصومال' },
    { year: '1995', label: 'إصدار شلن أرض الصومال' },
    { year: '2000', label: 'توسيع الرقابة المصرفية' },
    { year: '2010', label: 'تعزيز اللوائح المالية' },
    { year: '2018', label: 'مبادرات نظام دفع حديث' },
    { year: '2022', label: 'تعزيز الخدمات المالية الرقمية' },
    { year: 'اليوم', label: 'بنك مركزي حديث يخدم أرض الصومال' },
  ],
  legacyTitle: 'إرثنا',
  legacyBody:
    'لأكثر من ثلاثة عقود، ظل بنك أرض الصومال ملتزمًا بالحفاظ على الاستقرار النقدي، وحماية النظام المالي، ودعم التنمية الوطنية. يواصل البنك بناء قطاع مالي مرن يخدم الشركات والمستثمرين والمواطنين في جميع أنحاء أرض الصومال.',
  aheadTitle: 'نظرة إلى المستقبل',
  aheadBody:
    'يلتزم بنك أرض الصومال بأن يصبح بنكًا مركزيًا حديثًا وشفافًا وقائمًا على التكنولوجيا، يدعم النمو الاقتصادي المستدام والابتكار المالي وزيادة الشمول المالي للأجيال القادمة.',
  ctaTitle: 'اعرف المزيد عن البنك',
  ctaBody: 'استكشف وظائفنا ومنشوراتنا وأسعار الصرف والمبادرات التي تعزز النظام المالي لأرض الصومال.',
  ctaButton: 'استكشف وظائف البنك',
});

async function main() {
  const pageRes = await pool.query('SELECT id FROM content_pages WHERE slug = $1', [SLUG]);
  if (pageRes.rows.length === 0) {
    console.error(`No content_pages row found for slug '${SLUG}'.`);
    process.exit(1);
  }
  const id = pageRes.rows[0].id;

  const updates: { lang: string; title: string; body: string }[] = [
    { lang: 'en', title: 'History of the Bank of Somaliland', body: enBody },
    { lang: 'so', title: 'Taariikhda Baanka Somaliland', body: soBody },
    { lang: 'ar', title: 'تاريخ بنك أرض الصومال', body: arBody },
  ];

  for (const u of updates) {
    await pool.query(
      `INSERT INTO content_translations (content_id, content_table, language_code, title, body)
       VALUES ($1, 'content_pages', $2, $3, $4)
       ON CONFLICT (content_id, content_table, language_code)
       DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body, updated_at = now()`,
      [id, u.lang, u.title, u.body]
    );
    console.log(`Updated ${u.lang} translation for '${SLUG}'.`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
