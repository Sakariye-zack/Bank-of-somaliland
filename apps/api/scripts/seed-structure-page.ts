import { pool } from '../src/db/pool';
import { icon as svgIcon } from './lib/icons';

const SLUG = 'bosl-structure';
// Same cropped Bank of Somaliland headquarters photo used across the "About" section.
const BANNER_IMAGE_URL = '/uploads/images/93ed3661-84a5-4f92-b4b5-52df9969313b.png';

const DEPT_ICONS = ['trendingUp', 'bank', 'coin', 'monitor', 'trendingUp', 'barChart'] as const;
const CORP_ICONS = ['calculator', 'users', 'monitor', 'cart', 'scale', 'megaphone'] as const;
const OVERSIGHT_ICONS = ['shieldCheck', 'alertTriangle', 'clipboardCheck'] as const;
const OBJECTIVE_ICONS = ['shieldCheck', 'bank', 'smartphone', 'users', 'gear', 'trendingUp', 'lightbulb', 'shield'] as const;
// Governor / Deputy Governor / Executive Directors / Internal Audit / Department
// Directors / Division Managers / Officers & Staff — in chart render order.
const CHART_ICONS = ['users', 'user', 'briefcase', 'users', 'user'] as const;

interface Item { title: string; body: string }

function deptCard(iconName: (typeof DEPT_ICONS)[number], d: Item): string {
  return `<div class="struct-dept-card"><div class="struct-dept-icon">${svgIcon(iconName, 24)}</div><h4>${d.title}</h4><p>${d.body}</p></div>`;
}
function miniCard(iconName: string, m: Item): string {
  return `<div class="struct-mini-card"><div class="struct-mini-icon">${svgIcon(iconName, 18)}</div><div><h5>${m.title}</h5><p>${m.body}</p></div></div>`;
}
function objective(iconName: (typeof OBJECTIVE_ICONS)[number], label: string): string {
  return `<div class="struct-objective">${svgIcon(iconName, 24)}${label}</div>`;
}

function buildBody(t: {
  intro: string[];
  bodiesHeading: string;
  govTitle: string;
  govBody: string;
  govList: string[];
  boardTitle: string;
  boardBody: string;
  boardList: string[];
  deptsHeading: string;
  depts: Item[];
  corpHeading: string;
  corp: Item[];
  oversightHeading: string;
  oversight: Item[];
  chartHeading: string;
  chartBoard: string;
  chartGovernor: string;
  chartDeputy: string;
  chartExecDirectors: string;
  chartInternalAudit: string;
  chartDeptDirectors: string;
  chartDivisionManagers: string;
  chartStaff: string;
  objectivesHeading: string;
  objectives: string[];
  ctaTitle: string;
  ctaBody: string;
  ctaBtn: string;
}): string {
  // The first intro paragraph is surfaced as the hero lede (the `subtitle`
  // column), so only the remaining ones belong in the body.
  const introParas = t.intro.slice(1).map((p) => `<p>${p}</p>`).join('\n');
  const govListHtml = t.govList.map((g) => `<li>${g}</li>`).join('');
  const boardListHtml = t.boardList.map((g) => `<li>${g}</li>`).join('');
  const deptCards = t.depts.map((d, i) => deptCard(DEPT_ICONS[i], d)).join('');
  const corpCards = t.corp.map((c, i) => miniCard(CORP_ICONS[i], c)).join('');
  const oversightCards = t.oversight.map((o, i) => miniCard(OVERSIGHT_ICONS[i], o)).join('');
  const objectiveCards = t.objectives.map((o, i) => objective(OBJECTIVE_ICONS[i], o)).join('');
  const [boardIcon, governorIcon, deptDirIcon, divMgrIcon, staffIcon] = CHART_ICONS;

  return `
${introParas}

<div class="content-wide"><div class="content-wide-inner">
<h2 class="gov-section-heading">${t.bodiesHeading}</h2>
<div class="struct-bodies">
  <div class="struct-body-card">
    <div class="struct-body-head">
      <div class="struct-body-icon">${svgIcon('user', 24)}</div>
      <h3>${t.govTitle}</h3>
    </div>
    <p>${t.govBody}</p>
    <ul>${govListHtml}</ul>
  </div>
  <div class="struct-body-card is-gold">
    <div class="struct-body-head">
      <div class="struct-body-icon">${svgIcon('users', 24)}</div>
      <h3>${t.boardTitle}</h3>
    </div>
    <p>${t.boardBody}</p>
    <ul>${boardListHtml}</ul>
  </div>
</div>
</div></div>

<div class="content-wide"><div class="content-wide-inner">
<h2 class="gov-section-heading">${t.deptsHeading}</h2>
<div class="struct-depts">${deptCards}</div>
</div></div>

<div class="content-wide"><div class="content-wide-inner">
<div class="struct-columns">
  <div>
    <h3 class="struct-col-heading">${t.corpHeading}</h3>
    <div class="struct-corp">${corpCards}</div>
  </div>
  <div>
    <h3 class="struct-col-heading">${t.oversightHeading}</h3>
    <div class="struct-oversight">${oversightCards}</div>
  </div>
  <div class="struct-chart-wrap">
    <h3 class="struct-col-heading">${t.chartHeading}</h3>
    <div class="struct-chart">
      <div class="struct-node">${svgIcon(boardIcon, 16)} ${t.chartBoard}</div>
      <div class="struct-chart-arrow">▼</div>
      <div class="struct-node is-gold">${svgIcon(governorIcon, 16)} ${t.chartGovernor}</div>
      <div class="struct-chart-arrow">▼</div>
      <div class="struct-chart-branch">
        <div class="struct-node is-soft">${t.chartDeputy}</div>
        <div class="struct-node is-soft">${t.chartExecDirectors}</div>
        <div class="struct-node is-soft">${t.chartInternalAudit}</div>
      </div>
      <div class="struct-chart-arrow">▼</div>
      <div class="struct-node">${svgIcon(deptDirIcon, 16)} ${t.chartDeptDirectors}</div>
      <div class="struct-chart-arrow">▼</div>
      <div class="struct-node">${svgIcon(divMgrIcon, 16)} ${t.chartDivisionManagers}</div>
      <div class="struct-chart-arrow">▼</div>
      <div class="struct-node">${svgIcon(staffIcon, 16)} ${t.chartStaff}</div>
    </div>
  </div>
</div>
</div></div>

<div class="content-wide"><div class="content-wide-inner">
<h2 class="gov-section-heading">${t.objectivesHeading}</h2>
<div class="struct-objectives">${objectiveCards}</div>
</div></div>

<div class="content-wide"><div class="content-wide-inner">
<div class="struct-cta">
  <div class="struct-cta-icon">${svgIcon('bank', 30)}</div>
  <div class="struct-cta-text">
    <h4>${t.ctaTitle}</h4>
    <p>${t.ctaBody}</p>
  </div>
  <a class="struct-cta-btn" href="/core-functions">${t.ctaBtn} →</a>
</div>
</div></div>
`.trim();
}

const enBody = buildBody({
  intro: [
    'The Bank of Somaliland (BoSL) operates through a well-defined organizational structure designed to ensure effective leadership, sound governance, operational efficiency, and accountability. The Bank\'s structure enables departments and functional units to work collaboratively in delivering its mandate of maintaining monetary stability, supervising the financial sector, and supporting sustainable economic development.',
    'The organizational framework promotes clear reporting lines, efficient decision-making, effective coordination, and continuous institutional improvement.',
  ],
  bodiesHeading: 'Governance Bodies',
  govTitle: 'Office of the Governor',
  govBody: 'The Office of the Governor provides executive leadership and representation of the Bank. It oversees the implementation of monetary policy, financial sector supervision, and the day-to-day management of the Bank.',
  govList: ['Executive Leadership', 'Strategic Direction', 'Policy Coordination', 'National & International Representation', 'Institutional Governance'],
  boardTitle: 'Board of Directors',
  boardBody: 'The Board provides strategic oversight and ensures the Bank acts in accordance with its legal mandate and long-term objectives.',
  boardList: ['Strategic Direction', 'Policy Approval', 'Budget Oversight', 'Institutional Performance', 'Risk Governance'],
  deptsHeading: 'Core Functional Departments',
  depts: [
    { title: 'Monetary Policy Department', body: 'Develops monetary policies, conducts economic analysis, and supports macroeconomic stability.' },
    { title: 'Banking Supervision Department', body: 'Licenses and supervises banks, financial institutions, remittance companies, and other regulated entities.' },
    { title: 'Currency Operations Department', body: 'Responsible for issuing, distributing, and safeguarding Somaliland banknotes and coins.' },
    { title: 'National Payment Systems Department', body: 'Develops and oversees secure, efficient, and modern payment infrastructure.' },
    { title: 'Financial Markets Department', body: 'Monitors financial markets, foreign exchange activities, and liquidity conditions.' },
    { title: 'Research & Statistics Department', body: 'Collects economic data, prepares financial reports, and conducts research to support policy decisions.' },
  ],
  corpHeading: 'Corporate Services',
  corp: [
    { title: 'Finance Department', body: 'Financial management, budgeting, accounting, and reporting.' },
    { title: 'Human Resources', body: 'Recruitment, training, staff development, and performance management.' },
    { title: 'Information Technology', body: 'Digital transformation, cybersecurity, IT systems, and infrastructure.' },
    { title: 'Procurement & Administration', body: 'Procurement, logistics, facilities management, and administrative services.' },
    { title: 'Legal Affairs', body: 'Legal advisory services, regulatory interpretation, and contract management.' },
    { title: 'Communications & Public Relations', body: 'Public communication, media relations, stakeholder engagement, and awareness.' },
  ],
  oversightHeading: 'Oversight Functions',
  oversight: [
    { title: 'Internal Audit', body: 'Provides independent assurance on governance, financial controls, and operational effectiveness.' },
    { title: 'Risk Management', body: 'Identifies, assesses, and mitigates strategic, operational, financial, and cyber risks.' },
    { title: 'Compliance', body: 'Ensures adherence to laws, regulations, policies, and international standards.' },
  ],
  chartHeading: 'Organizational Structure',
  chartBoard: 'Board of Directors',
  chartGovernor: 'Governor',
  chartDeputy: 'Deputy Governor',
  chartExecDirectors: 'Executive Directors',
  chartInternalAudit: 'Internal Audit',
  chartDeptDirectors: 'Department Directors',
  chartDivisionManagers: 'Division Managers',
  chartStaff: 'Officers & Staff',
  objectivesHeading: 'Strategic Objectives',
  objectives: [
    'Maintain Monetary Stability',
    'Strengthen Financial Supervision',
    'Modernize Payment Systems',
    'Promote Financial Inclusion',
    'Enhance Institutional Capacity',
    'Improve Operational Efficiency',
    'Foster Innovation',
    'Strengthen Risk Management',
  ],
  ctaTitle: 'Organizational Excellence',
  ctaBody: 'BoSL continuously strengthens its organizational structure to remain responsive to economic developments, technological advancements, and the evolving needs of the financial sector and the people of Somaliland.',
  ctaBtn: 'Explore Our Departments',
});

const soBody = buildBody({
  intro: [
    'Baanka Somaliland (BoSL) wuxuu ku shaqeeyaa qaab-dhismeed hay\'adeed oo si wanaagsan loo qeexay oo loogu talagalay hubinta hoggaan waxtar leh, maamul wanaagsan, waxtarka hawlgalka, iyo xisaabtan. Qaab-dhismeedka Baanku wuxuu awood u siiyaa waaxyaha iyo cutubyada shaqada inay si wadajir ah u shaqeeyaan si loo gaaro waajibaadka ah ilaalinta xasilloonida lacagta, kormeerka qaybta maaliyadeed, iyo taageeridda horumarka dhaqaale ee waarta.',
    'Qaab-dhismeedka hay\'adeed wuxuu dhiirigeliyaa xariiqyo warbixin oo cad, go\'aan-qaadasho hufan, isku-duwid waxtar leh, iyo horumar hay\'adeed oo joogto ah.',
  ],
  bodiesHeading: 'Hay\'adaha Maamulka',
  govTitle: 'Xafiiska Guddoomiyaha',
  govBody: 'Xafiiska Guddoomiyuhu wuxuu bixiyaa hoggaanka fulinta iyo matalaadda Baanka. Wuxuu kormeeraa hirgelinta siyaasadda lacagta, kormeerka qaybta maaliyadeed, iyo maaraynta maalinlaha ah ee Baanka.',
  govList: ['Hoggaanka Fulinta', 'Jihada Istaraatiijiga', 'Isku-duwidda Siyaasadda', 'Matalaad Qaran & Caalami', 'Maamulka Hay\'adda'],
  boardTitle: 'Guddiga Maamulka',
  boardBody: 'Guddigu wuxuu bixiyaa kormeer istaraatiiji ah wuxuuna hubiyaa in Baanku u dhaqmo si waafaqsan waajibaadkiisa sharciga iyo yoolalkiisa muddada-dheer.',
  boardList: ['Jihada Istaraatiijiga', 'Ansixinta Siyaasadda', 'Kormeerka Miisaaniyadda', 'Waxqabadka Hay\'adda', 'Maamulka Khatarta'],
  deptsHeading: 'Waaxaha Shaqada Aasaasiga ah',
  depts: [
    { title: 'Waaxda Siyaasadda Lacagta', body: 'Waxay dejisaa siyaasadaha lacagta, samaysaa falanqayn dhaqaale, taageertaa xasilloonida dhaqaalaha guud.' },
    { title: 'Waaxda Kormeerka Bangiyada', body: 'Waxay shati siisaa oo kormeertaa bangiyada, hay\'adaha maaliyadeed, shirkadaha xawaaladda, iyo hay\'ado kale oo xakameysan.' },
    { title: 'Waaxda Hawlaha Lacagta', body: 'Waxay mas\'uul ka tahay soo saarista, qaybinta, iyo ilaalinta warqadaha lacagta iyo qadaadiicda Somaliland.' },
    { title: 'Waaxda Nidaamyada Bixinta Qaranka', body: 'Waxay horumarisaa oo kormeertaa kaabayaasha bixinta ee ammaanka, hufan, iyo casriga ah.' },
    { title: 'Waaxda Suuqyada Maaliyadeed', body: 'Waxay kormeertaa suuqyada maaliyadeed, hawlaha sarrifka lacagaha shisheeye, iyo xaaladaha dareeraha.' },
    { title: 'Waaxda Cilmi-baarista & Tirakoobka', body: 'Waxay ururisaa xogta dhaqaalaha, diyaarisaa warbixinno maaliyadeed, samaysaa cilmi-baaris taageerta go\'aannada siyaasadda.' },
  ],
  corpHeading: 'Adeegyada Hay\'adda',
  corp: [
    { title: 'Waaxda Maaliyadda', body: 'Maaraynta maaliyadda, miisaaniyadda, xisaabaadka, iyo warbixinta.' },
    { title: 'Kheyraadka Aadanaha', body: 'Shaqaalaysiinta, tababarka, horumarinta shaqaalaha, iyo maaraynta waxqabadka.' },
    { title: 'Teknoolajiyadda Macluumaadka', body: 'Isbeddelka dhijitaalka, ammaanka cyber-ka, nidaamyada IT, iyo kaabayaasha.' },
    { title: 'Iibsiga & Maamulka', body: 'Iibsiga, saadka, maaraynta tas-hiilaadka, iyo adeegyada maamulka.' },
    { title: 'Arrimaha Sharciga', body: 'Adeegyada la-talinta sharciga, fasiraadda sharciyada, iyo maaraynta qandaraasyada.' },
    { title: 'Isgaarsiinta & Xiriirka Dadweynaha', body: 'Isgaarsiinta dadweynaha, xiriirka warbaahinta, ka-qaybgalka danaha, iyo wacyigelinta.' },
  ],
  oversightHeading: 'Hawlaha Kormeerka',
  oversight: [
    { title: 'Kormeerka Gudaha', body: 'Wuxuu bixiyaa hubin madax-bannaan oo ku saabsan maamulka, xakamaynta maaliyadeed, iyo waxtarka hawlgalka.' },
    { title: 'Maaraynta Khatarta', body: 'Waxay aqoonsataa, qiimaysaa, oo yareysaa khataraha istaraatiijiga, hawlgalka, maaliyadeed, iyo cyber-ka.' },
    { title: 'U-hoggaansanaanta', body: 'Waxay hubisaa u-hoggaansanaanta sharciyada, xeerarka, siyaasadaha, iyo heerarka caalamiga ah.' },
  ],
  chartHeading: 'Qaab-dhismeedka Hay\'adda',
  chartBoard: 'Guddiga Maamulka',
  chartGovernor: 'Guddoomiye',
  chartDeputy: 'Ku-xigeenka Guddoomiyaha',
  chartExecDirectors: 'Agaasimayaasha Fulinta',
  chartInternalAudit: 'Kormeerka Gudaha',
  chartDeptDirectors: 'Agaasimayaasha Waaxaha',
  chartDivisionManagers: 'Maareeyayaasha Qaybaha',
  chartStaff: 'Saraakiisha & Shaqaalaha',
  objectivesHeading: 'Yoolalka Istaraatiijiga ah',
  objectives: [
    'Ilaalinta Xasilloonida Lacagta',
    'Xoojinta Kormeerka Maaliyadeed',
    'Casriyaynta Nidaamyada Bixinta',
    'Horumarinta Dhaqan-galinta Maaliyadeed',
    'Kordhinta Awoodda Hay\'adda',
    'Hagaajinta Waxtarka Hawlgalka',
    'Dhiirigelinta Hal-abuurka',
    'Xoojinta Maaraynta Khatarta',
  ],
  ctaTitle: 'Heer-sarreynta Hay\'adda',
  ctaBody: 'BoSL wuxuu si joogto ah u xoojiyaa qaab-dhismeedkiisa hay\'adeed si uu ugu jawaabo horumarka dhaqaalaha, horumarka teknoolajiyadda, iyo baahiyaha isbeddelaya ee qaybta maaliyadeed iyo dadka Somaliland.',
  ctaBtn: 'Eeg Waaxahayaga',
});

const arBody = buildBody({
  intro: [
    'يعمل بنك أرض الصومال (BoSL) من خلال هيكل تنظيمي محدد بوضوح مصمم لضمان القيادة الفعالة والحوكمة السليمة والكفاءة التشغيلية والمساءلة. يمكّن هيكل البنك الإدارات والوحدات الوظيفية من العمل بشكل تعاوني في تنفيذ ولايته المتمثلة في الحفاظ على الاستقرار النقدي، والإشراف على القطاع المالي، ودعم التنمية الاقتصادية المستدامة.',
    'يعزز الإطار التنظيمي خطوط إبلاغ واضحة، واتخاذ قرارات فعالة، وتنسيقًا فعالًا، وتحسينًا مؤسسيًا مستمرًا.',
  ],
  bodiesHeading: 'هيئات الحوكمة',
  govTitle: 'مكتب المحافظ',
  govBody: 'يوفر مكتب المحافظ القيادة التنفيذية وتمثيل البنك. ويشرف على تنفيذ السياسة النقدية، والرقابة على القطاع المالي، والإدارة اليومية للبنك.',
  govList: ['القيادة التنفيذية', 'التوجيه الاستراتيجي', 'تنسيق السياسات', 'التمثيل الوطني والدولي', 'الحوكمة المؤسسية'],
  boardTitle: 'مجلس الإدارة',
  boardBody: 'يوفر المجلس الرقابة الاستراتيجية ويضمن أن يتصرف البنك وفقًا لولايته القانونية وأهدافه طويلة الأجل.',
  boardList: ['التوجيه الاستراتيجي', 'اعتماد السياسات', 'الرقابة على الميزانية', 'الأداء المؤسسي', 'حوكمة المخاطر'],
  deptsHeading: 'الإدارات الوظيفية الأساسية',
  depts: [
    { title: 'إدارة السياسة النقدية', body: 'تضع السياسات النقدية، وتجري التحليل الاقتصادي، وتدعم استقرار الاقتصاد الكلي.' },
    { title: 'إدارة الرقابة المصرفية', body: 'ترخص وتشرف على البنوك والمؤسسات المالية وشركات التحويلات والكيانات المنظمة الأخرى.' },
    { title: 'إدارة عمليات العملة', body: 'مسؤولة عن إصدار وتوزيع وحماية الأوراق النقدية والعملات المعدنية لأرض الصومال.' },
    { title: 'إدارة أنظمة الدفع الوطنية', body: 'تطور وتشرف على بنية تحتية للمدفوعات آمنة وفعالة وحديثة.' },
    { title: 'إدارة الأسواق المالية', body: 'ترصد الأسواق المالية وأنشطة الصرف الأجنبي وظروف السيولة.' },
    { title: 'إدارة البحوث والإحصاءات', body: 'تجمع البيانات الاقتصادية وتعد التقارير المالية وتجري البحوث لدعم قرارات السياسة.' },
  ],
  corpHeading: 'الخدمات المؤسسية',
  corp: [
    { title: 'الإدارة المالية', body: 'الإدارة المالية والميزانية والمحاسبة وإعداد التقارير.' },
    { title: 'الموارد البشرية', body: 'التوظيف والتدريب وتطوير الموظفين وإدارة الأداء.' },
    { title: 'تكنولوجيا المعلومات', body: 'التحول الرقمي والأمن السيبراني وأنظمة تكنولوجيا المعلومات والبنية التحتية.' },
    { title: 'المشتريات والإدارة', body: 'المشتريات واللوجستيات وإدارة المرافق والخدمات الإدارية.' },
    { title: 'الشؤون القانونية', body: 'خدمات الاستشارات القانونية وتفسير اللوائح وإدارة العقود.' },
    { title: 'الاتصالات والعلاقات العامة', body: 'الاتصال العام والعلاقات الإعلامية وإشراك أصحاب المصلحة والتوعية.' },
  ],
  oversightHeading: 'وظائف الرقابة',
  oversight: [
    { title: 'التدقيق الداخلي', body: 'يوفر ضمانًا مستقلًا بشأن الحوكمة والضوابط المالية والفعالية التشغيلية.' },
    { title: 'إدارة المخاطر', body: 'تحدد وتقيّم وتخفف المخاطر الاستراتيجية والتشغيلية والمالية والسيبرانية.' },
    { title: 'الامتثال', body: 'يضمن الالتزام بالقوانين واللوائح والسياسات والمعايير الدولية.' },
  ],
  chartHeading: 'الهيكل التنظيمي',
  chartBoard: 'مجلس الإدارة',
  chartGovernor: 'المحافظ',
  chartDeputy: 'نائب المحافظ',
  chartExecDirectors: 'المديرون التنفيذيون',
  chartInternalAudit: 'التدقيق الداخلي',
  chartDeptDirectors: 'مديرو الإدارات',
  chartDivisionManagers: 'مديرو الأقسام',
  chartStaff: 'الموظفون والكوادر',
  objectivesHeading: 'الأهداف الاستراتيجية',
  objectives: [
    'الحفاظ على الاستقرار النقدي',
    'تعزيز الرقابة المالية',
    'تحديث أنظمة الدفع',
    'تعزيز الشمول المالي',
    'تعزيز القدرات المؤسسية',
    'تحسين الكفاءة التشغيلية',
    'تعزيز الابتكار',
    'تقوية إدارة المخاطر',
  ],
  ctaTitle: 'التميز المؤسسي',
  ctaBody: 'يعزز بنك أرض الصومال باستمرار هيكله التنظيمي ليظل مستجيبًا للتطورات الاقتصادية والتقدم التكنولوجي والاحتياجات المتطورة للقطاع المالي وشعب أرض الصومال.',
  ctaBtn: 'استكشف إداراتنا',
});

async function main() {
  const pageRes = await pool.query('SELECT id FROM content_pages WHERE slug = $1', [SLUG]);
  if (pageRes.rows.length === 0) {
    console.error(`No content_pages row found for slug '${SLUG}'.`);
    process.exit(1);
  }
  const id = pageRes.rows[0].id;

  await pool.query('UPDATE content_pages SET banner_image_url = $1, banner_video_url = NULL WHERE id = $2', [BANNER_IMAGE_URL, id]);

  const updates: { lang: string; title: string; subtitle: string; body: string }[] = [
    {
      lang: 'en',
      title: 'BoSL Structure',
      subtitle:
        'The Bank of Somaliland operates through a clear organizational structure that ensures effective governance, collaboration, and efficient service delivery in achieving its mandate of maintaining monetary stability and supervising the financial sector.',
      body: enBody,
    },
    {
      lang: 'so',
      title: 'Qaab-dhismeedka BoSL',
      subtitle:
        'Baanka Somaliland wuxuu ku shaqeeyaa qaab-dhismeed hay\'adeed oo cad kaas oo hubiya maamul wanaagsan, iskaashi, iyo adeeg hufan si loo gaaro waajibaadka ah ilaalinta xasilloonida lacagta iyo kormeerka qaybta maaliyadeed.',
      body: soBody,
    },
    {
      lang: 'ar',
      title: 'هيكل بنك أرض الصومال',
      subtitle:
        'يعمل بنك أرض الصومال من خلال هيكل تنظيمي واضح يضمن الحوكمة الفعالة والتعاون وتقديم الخدمات بكفاءة في تحقيق ولايته المتمثلة في الحفاظ على الاستقرار النقدي والإشراف على القطاع المالي.',
      body: arBody,
    },
  ];

  for (const u of updates) {
    await pool.query(
      `INSERT INTO content_translations (content_id, content_table, language_code, title, subtitle, body)
       VALUES ($1, 'content_pages', $2, $3, $4, $5)
       ON CONFLICT (content_id, content_table, language_code)
       DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, body = EXCLUDED.body, updated_at = now()`,
      [id, u.lang, u.title, u.subtitle, u.body]
    );
    console.log(`Updated ${u.lang} translation for '${SLUG}'.`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
