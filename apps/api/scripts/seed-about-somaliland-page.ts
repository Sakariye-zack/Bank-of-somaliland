import { pool } from '../src/db/pool';
import { icon as svgIcon } from './lib/icons';

const SLUG = 'about-somaliland';

// One icon per fact row, in render order. Monochrome SVG rather than emoji so the
// icons inherit the surrounding colour — emoji render in their own fixed
// multi-colour glyph form on some platforms and break the design.
const FACT_ICONS = ['building', 'users', 'trendingUp', 'coin', 'globe', 'flag'] as const;

interface Fact { label: string; value: string }

function factRow(iconName: (typeof FACT_ICONS)[number], f: Fact): string {
  return `<div class="fact-card"><span class="fact-icon">${svgIcon(iconName, 18)}</span><div><div class="fact-label">${f.label}</div><div class="fact-value">${f.value}</div></div></div>`;
}

function buildBody(t: { facts: Fact[]; paras: string[]; regionsLabel: string; regions: string; note: string }): string {
  const rows = t.facts.map((f, i) => factRow(FACT_ICONS[i], f)).join('');
  const paras = t.paras.map((p) => `<p>${p}</p>`).join('');
  return [
    `<div class="fact-grid">${rows}</div>`,
    paras,
    `<p><strong>${t.regionsLabel}</strong> ${t.regions}</p>`,
    `<p class="fact-note">${t.note}</p>`,
  ].join('');
}

const REGIONS = 'Awdal, Woqooyi Galbeed, Togdheer, Sanaag, Sool, Maroodi Jeex.';

const enBody = buildBody({
  facts: [
    { label: 'Capital City', value: 'Hargeisa' },
    { label: 'Population (est.)', value: '~5.7 million' },
    { label: 'GDP (nominal, est.)', value: '~US$2 billion' },
    { label: 'Currency', value: 'Somaliland Shilling (SLSH)' },
    { label: 'Official Languages', value: 'Somali, Arabic, English' },
    { label: 'Area', value: '~137,600 km²' },
  ],
  paras: [
    'Somaliland is a self-governing territory in the Horn of Africa that declared its independence from Somalia in 1991. It has maintained its own government, currency, and institutions — including the Bank of Somaliland — for over three decades, though it is not yet recognised as a sovereign state by the United Nations or the African Union.',
  ],
  regionsLabel: 'Main regions:',
  regions: REGIONS,
  note: 'Figures above are commonly cited estimates and are reviewed periodically by the Bank of Somaliland.',
});

const soBody = buildBody({
  facts: [
    { label: 'Caasimadda', value: 'Hargeysa' },
    { label: 'Dadweynaha (qiyaas)', value: '~5.7 milyan' },
    { label: 'GDP (qiyaas)', value: '~US$2 bilyan' },
    { label: 'Lacagta', value: 'Shilingka Somaliland (SLSH)' },
    { label: 'Luqadaha Rasmiga ah', value: 'Soomaali, Carabi, Ingiriisi' },
    { label: 'Bedka', value: '~137,600 km²' },
  ],
  paras: [
    'Somaliland waa dhul is-maamula oo ku yaal Geeska Afrika kaas oo ku dhawaaqay madax-bannaanidiisa 1991-kii. Waxay ilaalisay dawladdeeda, lacagteeda, iyo hay\'adaheeda — oo ay ku jirto Baanka Somaliland — muddo in ka badan saddex iyo toban sano, inkastoo aan weli looga aqoonsanayn dal madax-bannaan Qaramada Midoobay ama Midowga Afrika.',
  ],
  regionsLabel: 'Gobolladii waaweyn:',
  regions: REGIONS,
  note: 'Tirooyinka kor ku xusan waa qiyaaso caadi ah oo si joogto ah dib u eegis ku sameeyo Baanka Somaliland.',
});

const arBody = buildBody({
  facts: [
    { label: 'العاصمة', value: 'هرجيسا' },
    { label: 'عدد السكان (تقديري)', value: '~5.7 مليون' },
    { label: 'الناتج المحلي (تقديري)', value: '~2 مليار دولار' },
    { label: 'العملة', value: 'شلن أرض الصومال (SLSH)' },
    { label: 'اللغات الرسمية', value: 'الصومالية، العربية، الإنجليزية' },
    { label: 'المساحة', value: '~137,600 كم²' },
  ],
  paras: [
    'أرض الصومال إقليم يحكم نفسه في القرن الأفريقي أعلن استقلاله عن الصومال في عام 1991. وقد حافظ على حكومته وعملته ومؤسساته — بما في ذلك بنك أرض الصومال — لأكثر من ثلاثة عقود، وإن لم يُعترف به بعد كدولة ذات سيادة من قبل الأمم المتحدة أو الاتحاد الأفريقي.',
  ],
  regionsLabel: 'المناطق الرئيسية:',
  regions: REGIONS,
  note: 'الأرقام أعلاه تقديرات شائعة الاستخدام ويراجعها بنك أرض الصومال بشكل دوري.',
});

async function main() {
  const pageRes = await pool.query('SELECT id FROM content_pages WHERE slug = $1', [SLUG]);
  if (pageRes.rows.length === 0) {
    console.error(`No content_pages row found for slug '${SLUG}'.`);
    process.exit(1);
  }
  const id = pageRes.rows[0].id;

  const updates = [
    { lang: 'en', title: 'About Somaliland', body: enBody },
    { lang: 'so', title: 'Ku Saabsan Somaliland', body: soBody },
    { lang: 'ar', title: 'عن أرض الصومال', body: arBody },
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
