import { pool } from '../src/db/pool';
import { icon as svgIcon } from './lib/icons';

const SLUG = 'governance';

const PRINCIPLE_ICONS = [svgIcon('shieldCheck'), svgIcon('user'), svgIcon('eye'), svgIcon('scale')];
const STRUCTURE_ICONS = [svgIcon('user'), svgIcon('users'), svgIcon('briefcase'), svgIcon('clipboardCheck'), svgIcon('shield')];
const COMMITTEE_ICONS = [svgIcon('barChart'), svgIcon('shield'), svgIcon('users'), svgIcon('trendingUp')];
const VALUE_ICONS = [svgIcon('user'), svgIcon('checkCircle'), svgIcon('eye'), svgIcon('lightbulb'), svgIcon('shieldCheck'), svgIcon('star')];

interface Principle { title: string; body: string }
interface StructureItem { title: string; body: string; tag: string }
interface FlowStep { label: string; variant?: 'highlight' | 'soft' }
interface FrameworkRow { body: string; role: string }
interface Committee { title: string; body: string }
interface ValueItem { title: string; body: string }

function principleCard(icon: string, p: Principle): string {
  return `<div class="gov-principle-card"><div class="gov-principle-icon">${icon}</div><h4>${p.title}</h4><p>${p.body}</p></div>`;
}
function structureCard(icon: string, s: StructureItem): string {
  return `<div class="gov-structure-card"><div class="gov-structure-icon">${icon}</div><h4>${s.title}</h4><p>${s.body}</p><span class="gov-structure-tag">${s.tag}</span></div>`;
}
function flowStep(step: FlowStep, icon: string): string {
  const cls = step.variant === 'highlight' ? ' is-highlight' : step.variant === 'soft' ? ' is-soft' : '';
  return `<div class="gov-flow-step${cls}"><span class="gov-flow-icon">${icon}</span><span>${step.label}</span></div>`;
}
function committeeCard(icon: string, c: Committee): string {
  return `<div class="gov-structure-card"><div class="gov-structure-icon">${icon}</div><h4>${c.title}</h4><p>${c.body}</p></div>`;
}
function valueItem(icon: string, v: ValueItem): string {
  return `<div class="gov-value-item"><div class="gov-value-icon">${icon}</div><h5>${v.title}</h5><p>${v.body}</p></div>`;
}

function buildBody(t: {
  intro: string[];
  principlesHeading: string;
  principles: Principle[];
  structureHeading: string;
  structure: StructureItem[];
  flowHeading: string;
  flowSteps: FlowStep[];
  frameworkHeading: string;
  frameworkCols: [string, string];
  frameworkRows: FrameworkRow[];
  committeesHeading: string;
  committeesIntro: string;
  committees: Committee[];
  valuesHeading: string;
  values: ValueItem[];
  objectivesHeading: string;
  objectives: string[];
  commitmentTitle: string;
  commitmentBody: string;
  commitmentButton: string;
}): string {
  const introParas = t.intro.map((p) => `<p>${p}</p>`).join('\n');
  const principleCards = t.principles.map((p, i) => principleCard(PRINCIPLE_ICONS[i], p)).join('');
  const structureCards = t.structure.map((s, i) => structureCard(STRUCTURE_ICONS[i], s)).join('');
  const flowIcons = [svgIcon('users', 18), svgIcon('user', 18), svgIcon('users', 18), svgIcon('building', 18), svgIcon('barChart', 18)];
  const flowStepsHtml = t.flowSteps
    .map((s, i) => (i === 0 ? '' : '<div class="gov-flow-arrow">↓</div>') + flowStep(s, flowIcons[i]))
    .join('\n');
  const frameworkRows = t.frameworkRows
    .map((r) => `<tr><td>${r.body}</td><td>${r.role}</td></tr>`)
    .join('\n');
  const committeeCards = t.committees.map((c, i) => committeeCard(COMMITTEE_ICONS[i], c)).join('');
  const valueItems = t.values.map((v, i) => valueItem(VALUE_ICONS[i], v)).join('');
  const objectivesList = t.objectives.map((o) => `<li>${o}</li>`).join('\n');

  return `
${introParas}

<div class="content-wide"><div class="content-wide-inner">
<h2 class="gov-section-heading">${t.principlesHeading}</h2>
<div class="gov-principles">${principleCards}</div>
</div></div>

<div class="content-wide"><div class="content-wide-inner">
<h2 class="gov-section-heading">${t.structureHeading}</h2>
<div class="gov-structure">${structureCards}</div>
</div></div>

<div class="content-wide"><div class="content-wide-inner">
<div class="gov-flow-grid">
  <div class="gov-flow-panel">
    <h4>${t.flowHeading}</h4>
    <div class="gov-flow-steps">
      ${flowStepsHtml}
    </div>
  </div>
  <div class="gov-framework-panel">
    <h4>${t.frameworkHeading}</h4>
    <table>
      <thead><tr><th>${t.frameworkCols[0]}</th><th>${t.frameworkCols[1]}</th></tr></thead>
      <tbody>
        ${frameworkRows}
      </tbody>
    </table>
  </div>
</div>
</div></div>

<div class="content-wide"><div class="content-wide-inner">
<h2 class="gov-section-heading">${t.committeesHeading}</h2>
<p style="text-align:center; color: var(--bronze); margin-top: -8px;">${t.committeesIntro}</p>
<div class="gov-committees">${committeeCards}</div>
</div></div>

<div class="content-wide"><div class="content-wide-inner">
<h2 class="gov-section-heading">${t.valuesHeading}</h2>
<div class="gov-values">${valueItems}</div>
</div></div>

<div class="content-wide"><div class="content-wide-inner">
<h2 class="gov-section-heading">${t.objectivesHeading}</h2>
<ul class="gov-objectives">
${objectivesList}
</ul>
</div></div>

<div class="history-fullbleed history-cta">
  <div class="history-cta-inner">
    <div class="history-cta-icon">${svgIcon('building', 26)}</div>
    <div class="history-cta-text">
      <h3>${t.commitmentTitle}</h3>
      <p>${t.commitmentBody}</p>
    </div>
    <a class="history-cta-btn" href="/about">${t.commitmentButton} →</a>
  </div>
</div>
`.trim();
}

const enBody = buildBody({
  intro: [
    "The Bank of Somaliland (BoSL) is governed through a robust framework that ensures independence, accountability, transparency, and sound decision-making. The Bank's governance structure enables it to fulfill its mandate of maintaining monetary stability, supervising financial institutions, and supporting sustainable economic development.",
    "Governance at BoSL is guided by the Central Bank Law, internal policies, and internationally recognized principles of good corporate governance. The Bank strives to maintain public confidence by operating with integrity, professionalism, and transparency.",
  ],
  principlesHeading: 'Governance Principles',
  principles: [
    { title: 'Independence', body: 'The Bank performs its statutory responsibilities independently, free from undue influence, while cooperating with government institutions on matters affecting the national economy.' },
    { title: 'Accountability', body: 'BoSL is accountable for its decisions and performance through financial reporting, regulatory compliance, internal oversight, and public communication.' },
    { title: 'Transparency', body: 'The Bank promotes openness by publishing regulations, annual reports, monetary policy updates, exchange rates, and statistical information for the benefit of stakeholders.' },
    { title: 'Integrity', body: 'Every employee and official of the Bank is expected to uphold the highest ethical standards, professionalism, honesty, and public trust.' },
  ],
  structureHeading: 'Governance Structure',
  structure: [
    { title: 'Governor', body: "The Governor serves as the Chief Executive Officer of the Bank and is responsible for overall leadership, strategic direction, policy implementation, and representation of the Bank at national and international levels.", tag: 'Key Leadership' },
    { title: 'Board of Directors', body: "The Board of Directors provides strategic oversight and ensures that the Bank operates in accordance with its legal mandate and long-term objectives.", tag: 'Strategic Oversight' },
    { title: 'Executive Management', body: 'Executive Management oversees the day-to-day operations of the Bank and coordinates the activities of all departments.', tag: 'Operations' },
    { title: 'Internal Audit & Compliance', body: 'The Internal Audit function independently reviews the effectiveness of governance, risk management, financial controls, and operational procedures while ensuring compliance with applicable laws and regulations.', tag: 'Independent Assurance' },
    { title: 'Risk Management', body: 'BoSL operates an enterprise-wide risk management framework to identify, assess, monitor, and mitigate financial, operational, legal, cyber, and strategic risks.', tag: 'Risk Oversight' },
  ],
  flowHeading: 'Decision-Making Structure',
  flowSteps: [
    { label: 'Board of Directors' },
    { label: 'Governor', variant: 'highlight' },
    { label: 'Executive Management' },
    { label: 'Departments', variant: 'soft' },
    { label: 'Implementation & Monitoring', variant: 'soft' },
  ],
  frameworkHeading: 'Governance Framework',
  frameworkCols: ['Governance Body', 'Primary Role'],
  frameworkRows: [
    { body: 'Board of Directors', role: 'Strategic oversight and major decision-making' },
    { body: 'Governor', role: 'Executive leadership and day-to-day management' },
    { body: 'Executive Management', role: 'Operational management and implementation' },
    { body: 'Internal Audit', role: 'Independent assurance and internal control review' },
    { body: 'Risk Management', role: 'Enterprise risk oversight and mitigation' },
    { body: 'Compliance', role: 'Regulatory compliance and policy adherence' },
  ],
  committeesHeading: 'Governance Committees',
  committeesIntro: 'The Board may establish specialized committees to strengthen oversight and improve decision-making.',
  committees: [
    { title: 'Audit Committee', body: 'Oversees financial reporting, internal controls, external audits, and compliance.' },
    { title: 'Risk Committee', body: 'Monitors institutional and financial risks while ensuring appropriate mitigation measures.' },
    { title: 'Human Resources Committee', body: 'Provides oversight on senior appointments, organizational development, and performance management.' },
    { title: 'Finance Committee', body: 'Reviews budgets, financial performance, procurement, and resource allocation.' },
  ],
  valuesHeading: 'Corporate Values',
  values: [
    { title: 'Professionalism', body: 'Delivering services with competence, responsibility, and excellence.' },
    { title: 'Accountability', body: 'Taking responsibility for decisions and institutional performance.' },
    { title: 'Transparency', body: 'Providing clear, timely, and accurate information.' },
    { title: 'Innovation', body: 'Adopting modern technologies and best practices.' },
    { title: 'Integrity', body: 'Maintaining honesty, fairness, and ethical conduct.' },
    { title: 'Service Excellence', body: 'Serving the public and financial sector with dedication and efficiency.' },
  ],
  objectivesHeading: 'Governance Objectives',
  objectives: [
    'Promote transparency and accountability',
    'Maintain institutional independence',
    'Ensure effective decision-making',
    'Strengthen public confidence',
    'Protect financial stability',
    'Improve operational efficiency',
    'Support sustainable economic growth',
    'Strengthen risk management',
    'Ensure legal and regulatory compliance',
  ],
  commitmentTitle: 'Our Commitment',
  commitmentBody: "The Bank of Somaliland is committed to maintaining the highest standards of governance by fostering transparency, accountability, ethical leadership, and institutional independence. Through effective governance, the Bank continues to strengthen Somaliland's financial system and contribute to long-term economic prosperity.",
  commitmentButton: 'Learn More About Our Policies',
});

const soBody = buildBody({
  intro: [
    "Baanka Somaliland (BoSL) waxaa lagu maamulaa qaab-dhismeed adag oo hubinaya madax-bannaanida, xisaabtanka, daaha-furnaanta, iyo go'aan-qaadista wanaagsan. Qaab-dhismeedka maamulka Baanku wuxuu awood u siiyaa inuu buuxiyo waajibaadkiisa ah xasilinta lacagta, kormeerka hay'adaha maaliyadeed, iyo taageerida horumarka dhaqaale ee waarta.",
    "Maamulka BoSL wuxuu ku salaysan yahay Sharciga Baanka Dhexe, siyaasadaha gudaha, iyo mabaadi'da caalamiga ah ee maamulka wanaagsan ee shirkadaha. Baanku wuxuu isku dayaa inuu ilaaliyo kalsoonida dadweynaha isagoo ka shaqeynaya daacadnimo, xirfad, iyo daaha-furnaan.",
  ],
  principlesHeading: 'Mabaadi\'da Maamulka',
  principles: [
    { title: 'Madax-bannaani', body: 'Baanku wuxuu si madax-bannaan u fuliyaa waajibaadkiisa sharciga ah, isagoo ka fog saameyn aan habboonayn, isagoo la shaqeynaya hay\'adaha dawladda arrimaha saameeya dhaqaalaha qaranka.' },
    { title: 'Xisaabtan', body: 'BoSL waa xisaabtan go\'aannadiisa iyo waxqabadkiisa iyada oo loo marayo warbixin maaliyadeed, waafaqsanaanta sharciga, kormeer gudaha, iyo isgaarsiin dadweyne.' },
    { title: 'Daaha-furnaan', body: 'Baanku wuxuu horumariyaa furfurnaanta isagoo daabacaya sharciyada, warbixinnada sanadlaha ah, cusboonaysiinta siyaasadda lacagta, qiimaha sarifka, iyo macluumaadka tirakoobka.' },
    { title: 'Daacadnimo', body: 'Shaqaale kasta iyo sarkaal kasta oo Baanka ka tirsan waxaa laga filayaa inuu ilaaliyo heerarka ugu sarreeya ee anshaxa, xirfadda, daacadnimada, iyo kalsoonida dadweynaha.' },
  ],
  structureHeading: 'Qaab-dhismeedka Maamulka',
  structure: [
    { title: 'Guddoomiyaha', body: 'Guddoomiyuhu waa Sarkaalka Fulinta ee Sare ee Baanka waana mas\'uul ka ah hoggaanka guud, jihada istaraatiijiga ah, hirgelinta siyaasadaha, iyo matalaadda Baanka heer qaran iyo caalami ahba.', tag: 'Hoggaanka Muhiimka ah' },
    { title: 'Guddiga Maamulka', body: 'Guddiga Maamulku wuxuu bixiyaa kormeer istaraatiiji ah wuxuuna hubiyaa in Baanku uga shaqeeyo waafaqsan waajibaadkiisa sharciga ah iyo yoolalka mustaqbalka.', tag: 'Kormeer Istaraatiiji' },
    { title: 'Maamulka Fulinta', body: 'Maamulka Fulintu wuxuu kormeeraa hawlaha maalinlaha ah ee Baanka wuxuuna iskuduba hawlaha dhammaan waaxyaha.', tag: 'Hawlaha' },
    { title: 'Kormeerka Gudaha & Waafaqsanaanta', body: 'Shaqada Kormeerka Gudaha si madax-bannaan ayey u eegtaa waxtarka maamulka, maareynta khatarta, kontoroolka maaliyadeed, iyo nidaamyada hawlgalka iyadoo hubinaysa waafaqsanaanta sharciyada iyo xeerarka.', tag: 'Xaqiijin Madax-bannaan' },
    { title: 'Maareynta Khatarta', body: 'BoSL waxay maamushaa qaab-dhismeed maareyn khatar oo ballaadhan si loo aqoonsado, loo qiimeeyo, loo kormeeryo, loona yareeyo khataraha maaliyadeed, hawlgalka, sharciga, dhijitaalka, iyo istaraatiijiga.', tag: 'Kormeerka Khatarta' },
  ],
  flowHeading: 'Qaab-dhismeedka Go\'aan-qaadista',
  flowSteps: [
    { label: 'Guddiga Maamulka' },
    { label: 'Guddoomiyaha', variant: 'highlight' },
    { label: 'Maamulka Fulinta' },
    { label: 'Waaxyaha', variant: 'soft' },
    { label: 'Hirgelinta & Kormeerka', variant: 'soft' },
  ],
  frameworkHeading: 'Qaab-dhismeedka Maamulka',
  frameworkCols: ['Hay\'adda Maamulka', 'Doorka Ugu Weyn'],
  frameworkRows: [
    { body: 'Guddiga Maamulka', role: 'Kormeer istaraatiiji ah iyo go\'aammada waaweyn' },
    { body: 'Guddoomiyaha', role: 'Hoggaanka fulinta iyo maamulka maalinlaha ah' },
    { body: 'Maamulka Fulinta', role: 'Maamulka hawlgalka iyo hirgelinta' },
    { body: 'Kormeerka Gudaha', role: 'Xaqiijin madax-bannaan iyo dib-u-eegis kontorool gudaha' },
    { body: 'Maareynta Khatarta', role: 'Kormeer iyo yareyn khatar guud' },
    { body: 'Waafaqsanaanta', role: 'Waafaqsanaanta sharciga iyo siyaasadaha' },
  ],
  committeesHeading: 'Guddiyada Maamulka',
  committeesIntro: 'Guddigu wuxuu dhisan karaa guddiyo khaas ah si loo xoojiyo kormeerka iyo loo horumariyo go\'aan-qaadista.',
  committees: [
    { title: 'Guddiga Kormeerka', body: 'Waxay kormeeraan warbixinta maaliyadeed, kontoroolka gudaha, kormeerka dibedda, iyo waafaqsanaanta.' },
    { title: 'Guddiga Khatarta', body: 'Waxay kormeeraan khataraha hay\'adda iyo kuwa maaliyadeed iyagoo hubinaya tallaabooyin yareyn oo habboon.' },
    { title: 'Guddiga Kheyraadka Aadanaha', body: 'Waxay bixiyaan kormeer ku saabsan magacaabista sare, horumarka hay\'adeed, iyo maareynta waxqabadka.' },
    { title: 'Guddiga Maaliyadda', body: 'Waxay dib u eegaan miisaaniyadaha, waxqabadka maaliyadeed, iibsiga, iyo qaybinta kheyraadka.' },
  ],
  valuesHeading: 'Qiyamka Hay\'adda',
  values: [
    { title: 'Xirfad', body: 'Bixinta adeegyo leh xirfad, mas\'uuliyad, iyo heer sare.' },
    { title: 'Xisaabtan', body: 'Qaadashada mas\'uuliyadda go\'aannada iyo waxqabadka hay\'adda.' },
    { title: 'Daaha-furnaan', body: 'Bixinta macluumaad cad, wakhtiga ku habboon, oo sax ah.' },
    { title: 'Hal-abuur', body: 'Qaadashada tignoolajiyadaha casriga ah iyo dhaqamada ugu wanaagsan.' },
    { title: 'Daacadnimo', body: 'Ilaalinta daacadnimada, caddaaladda, iyo anshaxa.' },
    { title: 'Adeeg Heer Sare ah', body: 'U adeegidda dadweynaha iyo qaybta maaliyadeed si dadaal iyo waxtar leh.' },
  ],
  objectivesHeading: 'Yoolalka Maamulka',
  objectives: [
    'Horumarinta daaha-furnaanta iyo xisaabtanka',
    'Ilaalinta madax-bannaanida hay\'adda',
    'Xaqiijinta go\'aan-qaadis waxtar leh',
    'Xoojinta kalsoonida dadweynaha',
    'Ilaalinta xasilloonida maaliyadeed',
    'Horumarinta waxtarka hawlgalka',
    'Taageeridda koritaanka dhaqaale ee waarta',
    'Xoojinta maareynta khatarta',
    'Xaqiijinta waafaqsanaanta sharciga iyo xeerarka',
  ],
  commitmentTitle: 'Ballan-qaadkeenna',
  commitmentBody: "Baanka Somaliland waxa uu ballan-qaad u haya inuu ilaaliyo heerarka ugu sarreeya ee maamulka isagoo horumarinaya daaha-furnaanta, xisaabtanka, hoggaanka anshaxa leh, iyo madax-bannaanida hay'adda. Iyada oo loo marayo maamul waxtar leh, Baanku wuxuu sii wadaa xoojinta nidaamka maaliyadeed ee Somaliland iyo ka qaybqaadashada barwaaqada dhaqaale ee waarta.",
  commitmentButton: 'Baro Wax Badan oo ku saabsan Siyaasadahayaga',
});

const arBody = buildBody({
  intro: [
    "يُدار بنك أرض الصومال (BoSL) من خلال إطار حوكمة متين يضمن الاستقلالية والمساءلة والشفافية وسلامة اتخاذ القرار. يمكّن هيكل الحوكمة في البنك من الوفاء بولايته المتمثلة في الحفاظ على الاستقرار النقدي، والإشراف على المؤسسات المالية، ودعم التنمية الاقتصادية المستدامة.",
    "تسترشد الحوكمة في بنك أرض الصومال بقانون البنك المركزي، والسياسات الداخلية، والمبادئ المعترف بها دولياً للحوكمة المؤسسية الرشيدة. ويسعى البنك للحفاظ على ثقة الجمهور من خلال العمل بنزاهة ومهنية وشفافية.",
  ],
  principlesHeading: 'مبادئ الحوكمة',
  principles: [
    { title: 'الاستقلالية', body: 'يؤدي البنك مسؤولياته القانونية بشكل مستقل، دون تأثير لا مبرر له، مع التعاون مع المؤسسات الحكومية في الأمور التي تؤثر على الاقتصاد الوطني.' },
    { title: 'المساءلة', body: 'بنك أرض الصومال مسؤول عن قراراته وأدائه من خلال التقارير المالية والامتثال التنظيمي والرقابة الداخلية والتواصل العام.' },
    { title: 'الشفافية', body: 'يعزز البنك الانفتاح من خلال نشر اللوائح والتقارير السنوية وتحديثات السياسة النقدية وأسعار الصرف والمعلومات الإحصائية لفائدة أصحاب المصلحة.' },
    { title: 'النزاهة', body: 'يُتوقع من كل موظف ومسؤول في البنك الالتزام بأعلى معايير الأخلاق والمهنية والصدق وثقة الجمهور.' },
  ],
  structureHeading: 'هيكل الحوكمة',
  structure: [
    { title: 'المحافظ', body: 'يشغل المحافظ منصب الرئيس التنفيذي للبنك وهو مسؤول عن القيادة العامة والتوجيه الاستراتيجي وتنفيذ السياسات وتمثيل البنك على المستويين الوطني والدولي.', tag: 'القيادة الرئيسية' },
    { title: 'مجلس الإدارة', body: 'يوفر مجلس الإدارة الرقابة الاستراتيجية ويضمن عمل البنك وفقًا لولايته القانونية وأهدافه طويلة المدى.', tag: 'الرقابة الاستراتيجية' },
    { title: 'الإدارة التنفيذية', body: 'تشرف الإدارة التنفيذية على العمليات اليومية للبنك وتنسق أنشطة جميع الإدارات.', tag: 'العمليات' },
    { title: 'التدقيق الداخلي والامتثال', body: 'تراجع وظيفة التدقيق الداخلي بشكل مستقل فعالية الحوكمة وإدارة المخاطر والضوابط المالية والإجراءات التشغيلية مع ضمان الامتثال للقوانين واللوائح المعمول بها.', tag: 'ضمان مستقل' },
    { title: 'إدارة المخاطر', body: 'يدير بنك أرض الصومال إطارًا شاملاً لإدارة المخاطر على مستوى المؤسسة لتحديد وتقييم ومراقبة وتخفيف المخاطر المالية والتشغيلية والقانونية والسيبرانية والاستراتيجية.', tag: 'الرقابة على المخاطر' },
  ],
  flowHeading: 'هيكل اتخاذ القرار',
  flowSteps: [
    { label: 'مجلس الإدارة' },
    { label: 'المحافظ', variant: 'highlight' },
    { label: 'الإدارة التنفيذية' },
    { label: 'الإدارات', variant: 'soft' },
    { label: 'التنفيذ والمتابعة', variant: 'soft' },
  ],
  frameworkHeading: 'إطار الحوكمة',
  frameworkCols: ['هيئة الحوكمة', 'الدور الرئيسي'],
  frameworkRows: [
    { body: 'مجلس الإدارة', role: 'الرقابة الاستراتيجية واتخاذ القرارات الرئيسية' },
    { body: 'المحافظ', role: 'القيادة التنفيذية والإدارة اليومية' },
    { body: 'الإدارة التنفيذية', role: 'الإدارة التشغيلية والتنفيذ' },
    { body: 'التدقيق الداخلي', role: 'ضمان مستقل ومراجعة الرقابة الداخلية' },
    { body: 'إدارة المخاطر', role: 'الرقابة على المخاطر المؤسسية وتخفيفها' },
    { body: 'الامتثال', role: 'الامتثال التنظيمي والالتزام بالسياسات' },
  ],
  committeesHeading: 'لجان الحوكمة',
  committeesIntro: 'يجوز للمجلس تشكيل لجان متخصصة لتعزيز الرقابة وتحسين اتخاذ القرار.',
  committees: [
    { title: 'لجنة التدقيق', body: 'تشرف على التقارير المالية والضوابط الداخلية والتدقيق الخارجي والامتثال.' },
    { title: 'لجنة المخاطر', body: 'تراقب المخاطر المؤسسية والمالية مع ضمان اتخاذ تدابير التخفيف المناسبة.' },
    { title: 'لجنة الموارد البشرية', body: 'توفر الرقابة على التعيينات العليا والتطوير المؤسسي وإدارة الأداء.' },
    { title: 'لجنة المالية', body: 'تراجع الميزانيات والأداء المالي والمشتريات وتخصيص الموارد.' },
  ],
  valuesHeading: 'القيم المؤسسية',
  values: [
    { title: 'الاحترافية', body: 'تقديم الخدمات بكفاءة ومسؤولية وتميز.' },
    { title: 'المساءلة', body: 'تحمل المسؤولية عن القرارات والأداء المؤسسي.' },
    { title: 'الشفافية', body: 'تقديم معلومات واضحة وفي الوقت المناسب ودقيقة.' },
    { title: 'الابتكار', body: 'تبني التقنيات الحديثة وأفضل الممارسات.' },
    { title: 'النزاهة', body: 'الحفاظ على الصدق والعدالة والسلوك الأخلاقي.' },
    { title: 'التميز في الخدمة', body: 'خدمة الجمهور والقطاع المالي بتفانٍ وكفاءة.' },
  ],
  objectivesHeading: 'أهداف الحوكمة',
  objectives: [
    'تعزيز الشفافية والمساءلة',
    'الحفاظ على الاستقلالية المؤسسية',
    'ضمان فعالية اتخاذ القرار',
    'تعزيز ثقة الجمهور',
    'حماية الاستقرار المالي',
    'تحسين الكفاءة التشغيلية',
    'دعم النمو الاقتصادي المستدام',
    'تعزيز إدارة المخاطر',
    'ضمان الامتثال القانوني والتنظيمي',
  ],
  commitmentTitle: 'التزامنا',
  commitmentBody: 'يلتزم بنك أرض الصومال بالحفاظ على أعلى معايير الحوكمة من خلال تعزيز الشفافية والمساءلة والقيادة الأخلاقية والاستقلالية المؤسسية. ومن خلال الحوكمة الفعالة، يواصل البنك تعزيز النظام المالي في أرض الصومال والمساهمة في الازدهار الاقتصادي طويل الأمد.',
  commitmentButton: 'اعرف المزيد عن سياساتنا',
});

async function main() {
  const pageRes = await pool.query('SELECT id FROM content_pages WHERE slug = $1', [SLUG]);
  if (pageRes.rows.length === 0) {
    console.error(`No content_pages row found for slug '${SLUG}'.`);
    process.exit(1);
  }
  const id = pageRes.rows[0].id;

  const updates: { lang: string; title: string; body: string }[] = [
    { lang: 'en', title: 'Effective Governance for Financial Stability', body: enBody },
    { lang: 'so', title: 'Maamul Waxtar leh oo u ah Xasilloonida Maaliyadeed', body: soBody },
    { lang: 'ar', title: 'حوكمة فعالة من أجل الاستقرار المالي', body: arBody },
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
