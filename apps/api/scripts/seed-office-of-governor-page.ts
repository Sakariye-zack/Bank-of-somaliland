import { pool } from '../src/db/pool';
import { icon as svgIcon } from './lib/icons';

const SLUG = 'office-of-the-governor';
// Same cropped Bank of Somaliland headquarters photo used on /about/history, kept
// consistent across the "About" section's rich content pages.
const BANNER_IMAGE_URL = '/uploads/images/93ed3661-84a5-4f92-b4b5-52df9969313b.png';
// Governor's official photo, uploaded via the admin panel's "Upload Image" tool.
// Must be an absolute URL (API origin) since it's embedded directly in raw body
// HTML, which — unlike banner_image_url — is not passed through the public
// site's mediaUrl() helper and would otherwise resolve against the wrong origin.
// Set to null to fall back to the generic placeholder icon.
const GOVERNOR_PHOTO_URL: string | null = 'http://localhost:4000/uploads/images/7da7cde6-0208-4729-9f2a-4936fdcd911b.jpg';

const RESP_ICONS = ['bank', 'clipboardCheck', 'shieldCheck', 'building', 'coin', 'globe', 'users', 'users', 'barChart', 'eye'] as const;
const PRIORITY_ICONS = ['target', 'bank', 'smartphone', 'users', 'gear', 'users'] as const;

interface RespItem { title: string; body: string }
interface PriorityItem { title: string; body: string }

function respCard(iconName: (typeof RESP_ICONS)[number], r: RespItem): string {
  return `<div class="gov-resp-card"><div class="gov-resp-icon">${svgIcon(iconName, 18)}</div><h5>${r.title}</h5><p>${r.body}</p></div>`;
}
function priorityCard(iconName: (typeof PRIORITY_ICONS)[number], p: PriorityItem): string {
  return `<div class="gov-priority-card"><div class="gov-structure-icon">${svgIcon(iconName)}</div><h4>${p.title}</h4><p>${p.body}</p></div>`;
}
function leadershipItem(label: string): string {
  return `<div class="gov-leadership-item"><div class="gov-leadership-avatar">${svgIcon('user', 18)}</div><span>${label}</span></div>`;
}

function buildBody(t: {
  intro: string[];
  profileCaptionName: string;
  profileCaptionOrg: string;
  aboutHeading: string;
  aboutBody: string[];
  profileLinkLabel: string;
  quote: string;
  quoteAttribution: string;
  respHeading: string;
  respSub: string;
  resp: RespItem[];
  prioritiesHeading: string;
  priorities: PriorityItem[];
  leadershipHeading: string;
  leadershipIntro: string;
  leadership: string[];
  leadershipOutro: string;
  govHeading: string;
  govBody: string;
  govList: string[];
  intlHeading: string;
  intlList: string[];
  objHeading: string;
  objList: string[];
  contactHeading: string;
  contactOfficeLabel: string;
  contactAddress: string;
  contactBtn: string;
}): string {
  // The first intro paragraph is surfaced as the hero lede (the `subtitle`
  // column), so only the remaining ones belong in the body.
  const introParas = t.intro.slice(1).map((p) => `<p>${p}</p>`).join('\n');
  const aboutParas = t.aboutBody.map((p) => `<p>${p}</p>`).join('\n');
  const respCards = t.resp.map((r, i) => respCard(RESP_ICONS[i], r)).join('');
  const priorityCards = t.priorities.map((p, i) => priorityCard(PRIORITY_ICONS[i], p)).join('');
  const leadershipItems = t.leadership.map((l) => leadershipItem(l)).join('');
  const govListHtml = t.govList.map((g) => `<li>${g}</li>`).join('\n');
  const intlListHtml = t.intlList.map((g) => `<li>${g}</li>`).join('\n');
  const objListHtml = t.objList.map((g) => `<li>${g}</li>`).join('\n');
  const photoInner = GOVERNOR_PHOTO_URL
    ? `<img src="${GOVERNOR_PHOTO_URL}" alt="" />`
    : svgIcon('user', 64);

  return `
${introParas}

<div class="content-wide"><div class="content-wide-inner">
<div class="gov-profile-grid">
  <div class="gov-profile-photo">
    <div class="gov-profile-photo-art">${photoInner}</div>
    <div class="gov-profile-photo-caption">
      <strong>${t.profileCaptionName}</strong>
      <span>${t.profileCaptionOrg}</span>
    </div>
  </div>
  <div class="gov-profile-bio">
    <h3>${t.aboutHeading}</h3>
    ${aboutParas}
    <a class="gov-outline-btn" href="/about/senior-management">${t.profileLinkLabel} →</a>
  </div>
  <div class="gov-quote-panel">
    <div class="gov-quote-mark">&ldquo;</div>
    <p>${t.quote}</p>
    <div class="gov-quote-attribution">— ${t.quoteAttribution}</div>
  </div>
</div>
</div></div>

<div class="content-wide"><div class="content-wide-inner">
<h2 class="gov-section-heading">${t.respHeading}</h2>
<p style="text-align:center; color: var(--bronze); margin-top: -8px;">${t.respSub}</p>
<div class="gov-resp-grid">${respCards}</div>
</div></div>

<div class="content-wide"><div class="content-wide-inner">
<h2 class="gov-section-heading">${t.prioritiesHeading}</h2>
<div class="gov-priorities">${priorityCards}</div>
</div></div>

<div class="content-wide"><div class="content-wide-inner">
<h2 class="gov-section-heading">${t.leadershipHeading}</h2>
<p style="text-align:center; color: var(--bronze); margin-top: -8px;">${t.leadershipIntro}</p>
<div class="gov-leadership-grid">${leadershipItems}</div>
<p style="text-align:center; color: var(--bronze); font-size: 13px; margin-top: 18px;">${t.leadershipOutro}</p>
</div></div>

<div class="content-wide"><div class="content-wide-inner">
<div class="gov-info-cards">
  <div class="gov-info-card gov-info-card-dark">
    <h4>${svgIcon('scale', 18)} ${t.govHeading}</h4>
    <p>${t.govBody}</p>
    <ul>${govListHtml}</ul>
  </div>
  <div class="gov-info-card gov-info-card-light">
    <h4>${svgIcon('globe', 18)} ${t.intlHeading}</h4>
    <ul>${intlListHtml}</ul>
  </div>
  <div class="gov-info-card gov-info-card-light">
    <h4>${svgIcon('target', 18)} ${t.objHeading}</h4>
    <ul>${objListHtml}</ul>
  </div>
  <div class="gov-info-card gov-info-card-gold">
    <h4>${svgIcon('mail', 18)} ${t.contactHeading}</h4>
    <div class="gov-info-contact-row">${svgIcon('building', 15)} ${t.contactOfficeLabel}</div>
    <div class="gov-info-contact-row">${svgIcon('globe', 15)} ${t.contactAddress}</div>
    <div class="gov-info-contact-row">${svgIcon('mail', 15)} social.bank@sldgov.org</div>
    <div class="gov-info-contact-row">📞 +252-63-4411000</div>
    <a class="gov-info-btn" href="/contact">${t.contactBtn} →</a>
  </div>
</div>
</div></div>
`.trim();
}

const enBody = buildBody({
  intro: [
    'The Office of the Governor serves as the executive leadership of the Bank of Somaliland (BoSL), providing strategic direction and ensuring that the Bank fulfills its mandate of maintaining monetary stability, safeguarding financial sector integrity, and supporting sustainable economic development.',
    'The Governor oversees the implementation of monetary policy, financial sector regulation, currency management, payment system development, and institutional governance. Working closely with the Board of Directors, Executive Management, and national stakeholders, the Governor ensures that the Bank operates with independence, professionalism, transparency, and accountability.',
    "The Office also represents the Bank in national and international engagements, strengthens cooperation with financial institutions and development partners, and promotes public confidence in Somaliland's financial system.",
  ],
  profileCaptionName: 'Governor',
  profileCaptionOrg: 'Bank of Somaliland',
  aboutHeading: 'About the Governor',
  aboutBody: [
    'The Governor leads the Bank of Somaliland and is responsible for its overall direction, for representing the Bank before Government and the public, and for the final decisions on monetary policy and financial sector regulation.',
    "The Governor is supported by a Deputy Governor and the heads of the Bank's core functional groups, and works with the Board of Directors on matters of strategy, budget, and major policy decisions.",
  ],
  profileLinkLabel: 'View Full Profile',
  quote: 'A strong and resilient financial system is essential for sustainable economic growth. The Bank of Somaliland remains committed to maintaining monetary stability, strengthening financial sector supervision, embracing innovation, and promoting financial inclusion for the benefit of all citizens. Together, we will continue building a modern, trusted, and transparent central bank that supports the prosperity of Somaliland.',
  quoteAttribution: 'Governor, Bank of Somaliland',
  respHeading: 'Responsibilities of the Governor',
  respSub: 'The Governor is responsible for providing strategic leadership and ensuring the effective operation of the Bank.',
  resp: [
    { title: 'Lead the Bank', body: 'Lead the overall operations and activities of the Bank.' },
    { title: 'Implement Policies', body: 'Implement monetary and financial policies approved by the Board.' },
    { title: 'Maintain Stability', body: 'Maintain price and financial system stability.' },
    { title: 'Supervise Institutions', body: 'Supervise and regulate licensed financial institutions.' },
    { title: 'Currency Management', body: 'Oversee currency issuance, management, and integrity.' },
    { title: 'Represent the Bank', body: 'Represent the Bank nationally and internationally.' },
    { title: 'Chair Meetings', body: 'Chair Executive Management and policy meetings.' },
    { title: 'Chair Meetings', body: 'Chair Board meetings and steer strategic decisions.' },
    { title: 'Report to the Board', body: 'Report regularly to the Board of Directors on bank performance.' },
    { title: 'Promote Transparency', body: 'Promote institutional transparency and accountability.' },
  ],
  prioritiesHeading: 'Strategic Priorities',
  priorities: [
    { title: 'Monetary Stability', body: 'Maintain confidence in the Somaliland Shilling through sound monetary policy.' },
    { title: 'Financial Sector Development', body: 'Strengthen banks, insurance companies, remittance providers, and financial institutions.' },
    { title: 'Digital Financial Services', body: 'Support secure digital payments, financial innovation, and FinTech development.' },
    { title: 'Financial Inclusion', body: 'Expand access to affordable financial services across Somaliland.' },
    { title: 'Institutional Excellence', body: 'Improve governance, operational efficiency, and staff capacity.' },
    { title: 'International Cooperation', body: 'Build partnerships with regional and international financial institutions.' },
  ],
  leadershipHeading: 'Executive Leadership',
  leadershipIntro: 'The Governor works closely with:',
  leadership: ['Deputy Governor', 'Executive Directors', 'Directors General', 'Department Directors', 'Internal Audit', 'Risk Management', 'Legal Affairs', 'Corporate Services'],
  leadershipOutro: "Together, they provide strategic leadership and ensure effective implementation of the Bank's policies and objectives.",
  govHeading: 'Governance & Accountability',
  govBody: 'The Office of the Governor operates in accordance with the Central Bank Law and the governance framework approved by the Board of Directors. The Office is committed to:',
  govList: ['Transparency', 'Accountability', 'Professionalism', 'Integrity', 'Independence', 'Good Governance'],
  intlHeading: 'International Representation',
  intlList: [
    'International financial forums',
    'Regional central bank meetings',
    'Monetary policy conferences',
    'Development partner engagements',
    'Financial sector dialogues',
    'Bilateral cooperation initiatives',
  ],
  objHeading: 'Office Objectives',
  objList: [
    'Maintain monetary stability',
    'Strengthen financial supervision',
    'Promote financial inclusion',
    'Improve payment systems',
    'Enhance institutional governance',
    'Support sustainable economic growth',
  ],
  contactHeading: 'Contact the Office',
  contactOfficeLabel: 'Office of the Governor',
  contactAddress: 'Hargeisa, Republic of Somaliland',
  contactBtn: 'Send an Inquiry',
});

const soBody = buildBody({
  intro: [
    "Xafiiska Guddoomiyaha waa hoggaanka fulinta ee Baanka Somaliland (BoSL), kaas oo bixiya jihada istaraatiijiga ah oo hubiya in Baanku buuxiyo waajibaadkiisa ah xasilinta lacagta, ilaalinta daacadnimada qaybta maaliyadeed, iyo taageeridda horumarka dhaqaale ee waarta.",
    "Guddoomiyuhu wuxuu kormeeraa hirgelinta siyaasadda lacagta, sharciyada qaybta maaliyadeed, maareynta lacagta, horumarinta nidaamyada bixinta, iyo maamulka hay'adda. Isagoo si dhow ula shaqeynaya Guddiga Maamulka, Maamulka Fulinta, iyo danaha qaranka, Guddoomiyuhu wuxuu hubiyaa in Baanku uga shaqeeyo madax-bannaani, xirfad, daaha-furnaan, iyo xisaabtan.",
    'Xafiisku sidoo kale wuxuu matalaa Baanka arrimaha qaranka iyo caalamiga ah, xoojiyaa iskaashiga hay\'adaha maaliyadeed iyo lammaanayaasha horumarka, wuxuuna dhiirigeliyaa kalsoonida dadweynaha nidaamka maaliyadeed ee Somaliland.',
  ],
  profileCaptionName: 'Guddoomiye',
  profileCaptionOrg: 'Baanka Somaliland',
  aboutHeading: 'Ku Saabsan Guddoomiyaha',
  aboutBody: [
    'Guddoomiyuhu wuxuu hoggaamiyaa Baanka Somaliland waana mas\'uul ka ah jihadiisa guud, matalaadda Baanka dawladda iyo dadweynaha hortooda, iyo go\'aannada ugu dambeeya ee siyaasadda lacagta iyo sharciyada qaybta maaliyadeed.',
    'Guddoomiyaha waxaa taageera Ku-xigeenka Guddoomiyaha iyo hoggaamiyeyaasha kooxaha shaqada ee Baanka, wuxuuna la shaqeeyaa Guddiga Maamulka arrimaha istaraatiijiga, miisaaniyadda, iyo go\'aannada sharciga ee waaweyn.',
  ],
  profileLinkLabel: 'Eeg Astaanta Buuxda',
  quote: "Nidaam maaliyadeed oo xoog badan oo adkaysi leh ayaa lagama maarmaan u ah koritaanka dhaqaale ee waarta. Baanka Somaliland wuxuu sii wadaa ballan-qaadkiisa xasilinta lacagta, xoojinta kormeerka qaybta maaliyadeed, qaadashada hal-abuurka, iyo dhaqan-galinta maaliyadeed ee dadweynaha oo dhan. Wada-jir ahaan, waxaan sii wadi doonaa dhismaha bangi dhexe oo casri ah, la aamini karo, oo daaha-furan, kaas oo taageeraya barwaaqada Somaliland.",
  quoteAttribution: 'Guddoomiye, Baanka Somaliland',
  respHeading: 'Mas\'uuliyadaha Guddoomiyaha',
  respSub: 'Guddoomiyuhu waa mas\'uul ka ah bixinta hoggaanka istaraatiijiga ah iyo hubinta hawlgalka waxtarka leh ee Baanka.',
  resp: [
    { title: 'Hoggaanka Baanka', body: 'Hoggaan ka hawlaha iyo hawlgallada guud ee Baanka.' },
    { title: 'Hirgelinta Siyaasadaha', body: 'Hirgeli siyaasadaha lacagta iyo maaliyadeed ee Guddigu ansixiyay.' },
    { title: 'Ilaalinta Xasilloonida', body: 'Ilaali xasilloonida qiimaha iyo nidaamka maaliyadeed.' },
    { title: 'Kormeerka Hay\'adaha', body: 'Kormeer oo xakameey hay\'adaha maaliyadeed ee shatiga leh.' },
    { title: 'Maareynta Lacagta', body: 'Kormeer soo saarista, maareynta, iyo daacadnimada lacagta.' },
    { title: 'Matalaadda Baanka', body: 'Matal Baanka heer qaran iyo caalami ahba.' },
    { title: 'Hoggaanka Kulamada', body: 'Hoggaan kulamada Maamulka Fulinta iyo siyaasadda.' },
    { title: 'Hoggaanka Kulamada', body: 'Hoggaan kulamada Guddiga oo hagaya go\'aannada istaraatiijiga.' },
    { title: 'Warbixin Guddiga', body: 'Si joogto ah ugu warbixi Guddiga Maamulka waxqabadka Baanka.' },
    { title: 'Horumarinta Daaha-furnaanta', body: 'Horumari daaha-furnaanta iyo xisaabtanka hay\'adda.' },
  ],
  prioritiesHeading: 'Mudnaanta Istaraatiijiga ah',
  priorities: [
    { title: 'Xasilloonida Lacagta', body: 'Ilaali kalsoonida Shilingka Somaliland iyada oo loo marayo siyaasad lacageed oo hufan.' },
    { title: 'Horumarinta Qaybta Maaliyadeed', body: 'Xoojin bangiyada, shirkadaha caymiska, bixiyeyaasha xawaaladda, iyo hay\'adaha maaliyadeed.' },
    { title: 'Adeegyada Maaliyadeed ee Dhijitaalka ah', body: 'Taageer bixinta dhijitaalka ah ee ammaanka leh, hal-abuurka maaliyadeed, iyo horumarinta FinTech.' },
    { title: 'Dhaqan-galinta Maaliyadeed', body: 'Ballaari helitaanka adeegyada maaliyadeed ee la awoodo ee Somaliland oo dhan.' },
    { title: 'Heer Sarreynta Hay\'adda', body: 'Horumari maamulka, waxtarka hawlgalka, iyo awoodda shaqaalaha.' },
    { title: 'Iskaashiga Caalamiga ah', body: 'Dhis lammaanayaal la leh hay\'adaha maaliyadeed ee gobolka iyo caalamiga ah.' },
  ],
  leadershipHeading: 'Hoggaanka Fulinta',
  leadershipIntro: 'Guddoomiyuhu si dhow ula shaqeeyaa:',
  leadership: ['Ku-xigeenka Guddoomiyaha', 'Agaasimayaasha Fulinta', 'Agaasimayaasha Guud', 'Agaasimayaasha Waaxaha', 'Kormeerka Gudaha', 'Maareynta Khatarta', 'Arrimaha Sharciga', 'Adeegyada Hay\'adda'],
  leadershipOutro: "Wada-jir ahaan, waxay bixiyaan hoggaan istaraatiiji ah waxayna hubiyaan hirgelinta waxtarka leh ee siyaasadaha iyo yoolalka Baanka.",
  govHeading: 'Maamulka & Xisaabtanka',
  govBody: 'Xafiiska Guddoomiyaha wuxuu uga shaqeeyaa si waafaqsan Sharciga Baanka Dhexe iyo qaab-dhismeedka maamulka ee ay ansixiday Guddiga Maamulka. Xafiisku wuxuu ku dadaalayaa:',
  govList: ['Daaha-furnaan', 'Xisaabtan', 'Xirfad', 'Daacadnimo', 'Madax-bannaani', 'Maamul Wanaagsan'],
  intlHeading: 'Matalaadda Caalamiga ah',
  intlList: [
    'Munaasabadaha maaliyadeed ee caalamiga ah',
    'Kulamada bangiyada dhexe ee gobolka',
    'Shirarka siyaasadda lacagta',
    'La-xiriirka lammaanayaasha horumarka',
    'Wada-hadallada qaybta maaliyadeed',
    'Hindisayaasha iskaashiga labada dhinac',
  ],
  objHeading: 'Yoolalka Xafiiska',
  objList: [
    'Ilaali xasilloonida lacagta',
    'Xoojin kormeerka maaliyadeed',
    'Horumari dhaqan-galinta maaliyadeed',
    'Horumari nidaamyada bixinta',
    'Xoojin maamulka hay\'adda',
    'Taageer koritaanka dhaqaale ee waarta',
  ],
  contactHeading: 'La Xiriir Xafiiska',
  contactOfficeLabel: 'Xafiiska Guddoomiyaha',
  contactAddress: 'Hargeisa, Jamhuuriyadda Somaliland',
  contactBtn: 'Dir Su\'aal',
});

const arBody = buildBody({
  intro: [
    'يشكل مكتب المحافظ القيادة التنفيذية لبنك أرض الصومال (BoSL)، حيث يوفر التوجيه الاستراتيجي ويضمن وفاء البنك بولايته المتمثلة في الحفاظ على الاستقرار النقدي، وحماية نزاهة القطاع المالي، ودعم التنمية الاقتصادية المستدامة.',
    'يشرف المحافظ على تنفيذ السياسة النقدية، وتنظيم القطاع المالي، وإدارة العملة، وتطوير أنظمة الدفع، والحوكمة المؤسسية. وبالعمل الوثيق مع مجلس الإدارة والإدارة التنفيذية وأصحاب المصلحة الوطنيين، يضمن المحافظ أن يعمل البنك باستقلالية ومهنية وشفافية ومساءلة.',
    'كما يمثل المكتب البنك في المشاركات الوطنية والدولية، ويعزز التعاون مع المؤسسات المالية وشركاء التنمية، ويعزز ثقة الجمهور في النظام المالي لأرض الصومال.',
  ],
  profileCaptionName: 'المحافظ',
  profileCaptionOrg: 'بنك أرض الصومال',
  aboutHeading: 'عن المحافظ',
  aboutBody: [
    'يقود المحافظ بنك أرض الصومال وهو مسؤول عن توجيهه العام، وتمثيل البنك أمام الحكومة والجمهور، والقرارات النهائية بشأن السياسة النقدية وتنظيم القطاع المالي.',
    'يدعم المحافظ نائب المحافظ ورؤساء المجموعات الوظيفية الأساسية في البنك، ويعمل مع مجلس الإدارة في مسائل الاستراتيجية والميزانية وقرارات السياسة الرئيسية.',
  ],
  profileLinkLabel: 'عرض السيرة الكاملة',
  quote: 'يعد النظام المالي القوي والمرن أمرًا أساسيًا للنمو الاقتصادي المستدام. يظل بنك أرض الصومال ملتزمًا بالحفاظ على الاستقرار النقدي، وتعزيز الرقابة على القطاع المالي، وتبني الابتكار، وتعزيز الشمول المالي لصالح جميع المواطنين. معًا، سنواصل بناء بنك مركزي حديث وموثوق وشفاف يدعم ازدهار أرض الصومال.',
  quoteAttribution: 'المحافظ، بنك أرض الصومال',
  respHeading: 'مسؤوليات المحافظ',
  respSub: 'المحافظ مسؤول عن توفير القيادة الاستراتيجية وضمان التشغيل الفعال للبنك.',
  resp: [
    { title: 'قيادة البنك', body: 'قيادة العمليات والأنشطة العامة للبنك.' },
    { title: 'تنفيذ السياسات', body: 'تنفيذ السياسات النقدية والمالية التي يعتمدها المجلس.' },
    { title: 'الحفاظ على الاستقرار', body: 'الحفاظ على استقرار الأسعار والنظام المالي.' },
    { title: 'الإشراف على المؤسسات', body: 'الإشراف على المؤسسات المالية المرخصة وتنظيمها.' },
    { title: 'إدارة العملة', body: 'الإشراف على إصدار العملة وإدارتها ونزاهتها.' },
    { title: 'تمثيل البنك', body: 'تمثيل البنك على المستويين الوطني والدولي.' },
    { title: 'رئاسة الاجتماعات', body: 'رئاسة اجتماعات الإدارة التنفيذية والسياسات.' },
    { title: 'رئاسة الاجتماعات', body: 'رئاسة اجتماعات المجلس وتوجيه القرارات الاستراتيجية.' },
    { title: 'تقديم التقارير للمجلس', body: 'تقديم تقارير منتظمة لمجلس الإدارة عن أداء البنك.' },
    { title: 'تعزيز الشفافية', body: 'تعزيز الشفافية والمساءلة المؤسسية.' },
  ],
  prioritiesHeading: 'الأولويات الاستراتيجية',
  priorities: [
    { title: 'الاستقرار النقدي', body: 'الحفاظ على الثقة في شلن أرض الصومال من خلال سياسة نقدية سليمة.' },
    { title: 'تطوير القطاع المالي', body: 'تعزيز البنوك وشركات التأمين ومزودي التحويلات والمؤسسات المالية.' },
    { title: 'الخدمات المالية الرقمية', body: 'دعم المدفوعات الرقمية الآمنة والابتكار المالي وتطوير التكنولوجيا المالية.' },
    { title: 'الشمول المالي', body: 'توسيع الوصول إلى الخدمات المالية بأسعار معقولة في جميع أنحاء أرض الصومال.' },
    { title: 'التميز المؤسسي', body: 'تحسين الحوكمة والكفاءة التشغيلية وقدرات الموظفين.' },
    { title: 'التعاون الدولي', body: 'بناء شراكات مع المؤسسات المالية الإقليمية والدولية.' },
  ],
  leadershipHeading: 'القيادة التنفيذية',
  leadershipIntro: 'يعمل المحافظ بشكل وثيق مع:',
  leadership: ['نائب المحافظ', 'المديرون التنفيذيون', 'المديرون العامون', 'مديرو الإدارات', 'التدقيق الداخلي', 'إدارة المخاطر', 'الشؤون القانونية', 'الخدمات المؤسسية'],
  leadershipOutro: 'معًا، يقدمون القيادة الاستراتيجية ويضمنون التنفيذ الفعال لسياسات البنك وأهدافه.',
  govHeading: 'الحوكمة والمساءلة',
  govBody: 'يعمل مكتب المحافظ وفقًا لقانون البنك المركزي وإطار الحوكمة الذي اعتمده مجلس الإدارة. يلتزم المكتب بـ:',
  govList: ['الشفافية', 'المساءلة', 'الاحترافية', 'النزاهة', 'الاستقلالية', 'الحوكمة الرشيدة'],
  intlHeading: 'التمثيل الدولي',
  intlList: [
    'المنتديات المالية الدولية',
    'اجتماعات البنوك المركزية الإقليمية',
    'مؤتمرات السياسة النقدية',
    'المشاركات مع شركاء التنمية',
    'حوارات القطاع المالي',
    'مبادرات التعاون الثنائي',
  ],
  objHeading: 'أهداف المكتب',
  objList: [
    'الحفاظ على الاستقرار النقدي',
    'تعزيز الرقابة المالية',
    'تعزيز الشمول المالي',
    'تحسين أنظمة الدفع',
    'تعزيز الحوكمة المؤسسية',
    'دعم النمو الاقتصادي المستدام',
  ],
  contactHeading: 'اتصل بالمكتب',
  contactOfficeLabel: 'مكتب المحافظ',
  contactAddress: 'هرجيسا، جمهورية أرض الصومال',
  contactBtn: 'إرسال استفسار',
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
      title: 'Office of the Governor',
      subtitle:
        'Providing strategic leadership and ensuring the Bank of Somaliland fulfills its mandate of maintaining monetary stability, safeguarding financial integrity, and supporting sustainable economic development.',
      body: enBody,
    },
    {
      lang: 'so',
      title: 'Xafiiska Guddoomiyaha',
      subtitle:
        'Bixinta hoggaan istaraatiiji ah iyo hubinta in Baanka Somaliland uu buuxiyo waajibaadkiisa ah ilaalinta xasilloonida lacagta, dhawrista daacadnimada maaliyadeed, iyo taageeridda horumarka dhaqaale ee waarta.',
      body: soBody,
    },
    {
      lang: 'ar',
      title: 'مكتب المحافظ',
      subtitle:
        'توفير القيادة الاستراتيجية وضمان وفاء بنك أرض الصومال بولايته المتمثلة في الحفاظ على الاستقرار النقدي وحماية النزاهة المالية ودعم التنمية الاقتصادية المستدامة.',
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
