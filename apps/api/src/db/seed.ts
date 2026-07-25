import bcrypt from 'bcryptjs';
import { pool } from './pool';

const DEV_PASSWORD = 'ChangeMe123!';

async function upsertAdmin(name: string, email: string, role: string) {
  const password_hash = await bcrypt.hash(DEV_PASSWORD, 10);
  const { rows } = await pool.query(
    `INSERT INTO admin_users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [name, email, password_hash, role]
  );
  return rows[0].id as string;
}

async function insertContent(
  contentTable: string,
  contentId: string,
  title: string,
  body: string,
  language: 'en' | 'so' | 'ar' = 'en'
) {
  await pool.query(
    `INSERT INTO content_translations (content_id, content_table, language_code, title, body)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (content_id, content_table, language_code) DO NOTHING`,
    [contentId, contentTable, language, title, body]
  );
}

// press_releases / publications / laws_regulations / job_postings have no natural unique
// key of their own (content_id is generated fresh per insert), so re-running seed would
// duplicate them. Skip seeding an item if a translation with the same title already exists
// for that table.
async function titleAlreadySeeded(contentTable: string, title: string): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT 1 FROM content_translations WHERE content_table = $1 AND title = $2 LIMIT 1`,
    [contentTable, title]
  );
  return rows.length > 0;
}

async function run() {
  console.log('Seeding admin users (dev password: %s)...', DEV_PASSWORD);
  const superAdminId = await upsertAdmin('Amina Warsame', 'super.admin@bankofsomaliland.so', 'super_admin');
  await upsertAdmin('Content Editor', 'content.editor@bankofsomaliland.so', 'content_editor');
  await upsertAdmin('Supervision Officer', 'supervision.officer@bankofsomaliland.so', 'supervision_data_officer');
  const rateOfficerId = await upsertAdmin('Rate Officer', 'rate.officer@bankofsomaliland.so', 'exchange_rate_officer');

  console.log('Seeding exchange rates...');
  const rates: [string, string][] = [
    ['USD', '8900.0000'],
    ['SAR', '2373.0000'],
    ['ETB', '158.4000'],
    ['AED', '2423.0000'],
  ];
  for (const [currency_code, rate_to_ssh] of rates) {
    await pool.query(
      `INSERT INTO exchange_rates (currency_code, rate_to_ssh, rate_date, entered_by)
       VALUES ($1, $2, CURRENT_DATE, $3)
       ON CONFLICT (currency_code, rate_date) DO NOTHING`,
      [currency_code, rate_to_ssh, rateOfficerId]
    );
    await pool.query(
      `INSERT INTO exchange_rates (currency_code, rate_to_ssh, rate_date, entered_by)
       VALUES ($1, $2, CURRENT_DATE - INTERVAL '1 day', $3)
       ON CONFLICT (currency_code, rate_date) DO NOTHING`,
      [currency_code, (parseFloat(rate_to_ssh) * 0.998).toFixed(4), rateOfficerId]
    );
  }

  console.log('Seeding licensed institutions...');
  const institutions: [string, string, string, string, string][] = [
    ['Dahabshiil Bank', 'bank', 'active', 'CBK-BNK-0012', 'Hargeisa'],
    ['Dahabshiil Money Transfer', 'remit', 'active', 'CBK-REM-0004', 'Hargeisa'],
    ['Amal Bank', 'bank', 'active', 'CBK-BNK-0007', 'Hargeisa'],
    ['Zaad Mobile Money', 'mm', 'active', 'CBK-MM-0002', 'Hargeisa'],
    ['Salaam Somali Bank', 'bank', 'active', 'CBK-BNK-0003', 'Hargeisa'],
    ['Tawakal Money Transfer', 'remit', 'active', 'CBK-REM-0009', 'Burao'],
    ['Kaah Express', 'remit', 'revoked', 'CBK-REM-0011', 'Hargeisa'],
    ['IBS Bank', 'bank', 'active', 'CBK-BNK-0015', 'Hargeisa'],
    ['Somtel eDahab', 'mm', 'active', 'CBK-MM-0006', 'Hargeisa'],
    ['Takaful Insurance of Somaliland', 'takaful', 'active', 'CBK-TAK-0001', 'Hargeisa'],
  ];
  for (const [name, institution_type, status, license_number, headquarters] of institutions) {
    await pool.query(
      `INSERT INTO licensed_institutions (name, institution_type, status, license_number, headquarters, license_date, updated_by)
       VALUES ($1, $2, $3, $4, $5, CURRENT_DATE - INTERVAL '2 years', $6)
       ON CONFLICT (license_number) WHERE license_number IS NOT NULL DO NOTHING`,
      [name, institution_type, status, license_number, headquarters, superAdminId]
    );
  }

  console.log('Seeding press releases...');
  const pressReleases: [string, string, boolean, string, string, string, string][] = [
    [
      'Governor meets licensed remittance operators',
      'The Governor of the Bank of Somaliland met with representatives of licensed remittance operators to discuss compliance with anti-money-laundering guidance.',
      true,
      'Guddoomiyuhu wuxuu la kulmay hay\'adaha xawaaladda ee shatiga leh',
      'Guddoomiyaha Baanka Somaliland ayaa la kulmay wakiilada hay\'adaha xawaaladda ee shatiga leh, si ay uga wada hadlaan waajibaadka ka dhanka ah dhaqashada lacagta la maalgeliyay.',
      'محافظ البنك يلتقي بمشغلي الحوالات المرخصين',
      'التقى محافظ بنك أرض الصومال بممثلي مشغلي الحوالات المرخصين لمناقشة الالتزام بإرشادات مكافحة غسل الأموال.',
    ],
    [
      'Bank of Somaliland publishes Q2 stability report',
      'The Bank has released its quarterly financial stability report, covering the licensed banking and remittance sectors.',
      true,
      'Baanka Somaliland ayaa daabacay warbixinta xasillooni ee rubuca 2aad',
      'Baanku wuxuu sii daayay warbixintiisa rubuc-sanadeed ee xasilloonida maaliyadeed, oo daboolaysa qaybaha bangiyada iyo xawaaladda ee shatiga leh.',
      'بنك أرض الصومال ينشر تقرير الاستقرار للربع الثاني',
      'أصدر البنك تقريره الفصلي حول الاستقرار المالي، ويغطي قطاعي البنوك والحوالات المرخصة.',
    ],
    [
      'Notice: revised licensing fee schedule',
      'Effective the next fiscal quarter, the Bank is updating its licensing fee schedule for supervised institutions.',
      false,
      'Ogeysiis: jadwalka lacagaha shatiga oo la cusboonaysiiyay',
      'Laga bilaabo rubuca dhaqaale ee soo socda, Baanku wuxuu cusboonaysiinayaa jadwalka lacagaha shatiga ee hay\'adaha la kormeero.',
      'إشعار: تحديث جدول رسوم الترخيص',
      'اعتباراً من الربع المالي القادم، يقوم البنك بتحديث جدول رسوم الترخيص للمؤسسات الخاضعة للرقابة.',
    ],
  ];
  for (const [title, body, featured, titleSo, bodySo, titleAr, bodyAr] of pressReleases) {
    if (await titleAlreadySeeded('press_releases', title)) continue;
    const { rows } = await pool.query(
      `INSERT INTO press_releases (publish_date, content_id, status, featured)
       VALUES (CURRENT_DATE, uuid_generate_v4(), 'published', $1)
       RETURNING content_id`,
      [featured]
    );
    await insertContent('press_releases', rows[0].content_id, title, body, 'en');
    await insertContent('press_releases', rows[0].content_id, titleSo, bodySo, 'so');
    await insertContent('press_releases', rows[0].content_id, titleAr, bodyAr, 'ar');
  }

  console.log('Seeding publications...');
  const publications: [string, string, string, string, string][] = [
    ['Annual Report 2025', 'annual_report', 'https://example-spaces.local/annual-report-2025.pdf', 'Warbixinta Sannadlaha ah 2025', 'التقرير السنوي 2025'],
    ['Circular 2026-03: Remittance AML Guidance', 'circular', 'https://example-spaces.local/circular-2026-03.pdf', 'Wareegto 2026-03: Tilmaamaha Ka Hortagga Dhaqashada Lacagta ee Xawaaladda', 'التعميم 2026-03: إرشادات مكافحة غسل الأموال للحوالات'],
    ['Q2 2026 Financial Stability Report', 'stability_report', 'https://example-spaces.local/stability-report-q2-2026.pdf', 'Warbixinta Xasillooni ee Maaliyadeed Q2 2026', 'تقرير الاستقرار المالي للربع الثاني 2026'],
  ];
  for (const [title, category, file_url, titleSo, titleAr] of publications) {
    if (await titleAlreadySeeded('publications', title)) continue;
    const { rows } = await pool.query(
      `INSERT INTO publications (title_content_id, file_url, category, publish_date)
       VALUES (uuid_generate_v4(), $1, $2, CURRENT_DATE)
       RETURNING title_content_id`,
      [file_url, category]
    );
    await insertContent('publications', rows[0].title_content_id, title, '', 'en');
    await insertContent('publications', rows[0].title_content_id, titleSo, '', 'so');
    await insertContent('publications', rows[0].title_content_id, titleAr, '', 'ar');
  }

  console.log('Seeding content pages...');
  const pages: [string, string, string, string, string, string, string, string][] = [
    [
      'about-the-bank',
      'about',
      'About the Bank',
      '<p>The Bank of Somaliland is the central monetary authority of Somaliland, responsible for currency issuance, financial supervision, and monetary policy.</p>',
      'Ku Saabsan Baanka',
      '<p>Baanka Somaliland waa maamulaha rasmiga ah ee lacagta Jamhuuriyadda Somaliland, kaas oo mas\'uul ka ah soo saarista lacagta, kormeerka nidaamka maaliyadeed, iyo siyaasadda lacagta.</p>',
      'عن البنك',
      '<p>بنك أرض الصومال هو السلطة النقدية المركزية لأرض الصومال، وهو مسؤول عن إصدار العملة والرقابة المالية والسياسة النقدية.</p>',
    ],
    [
      'governance',
      'governance',
      'Governance',
      '<p>The Bank is governed by a Board chaired by the Governor, with oversight of monetary policy and financial sector supervision.</p>',
      'Maamulka',
      '<p>Baanka waxaa hoggaamiya Guddi uu madaxweyne ka yahay Guddoomiyaha, kaas oo kormeer ka sameeya siyaasadda lacagta iyo kormeerka qaybta maaliyadeed.</p>',
      'الحوكمة',
      '<p>يدير البنك مجلس إدارة يرأسه المحافظ، ويشرف على السياسة النقدية والرقابة على القطاع المالي.</p>',
    ],
    [
      'core-functions',
      'core_function',
      'Core Functions',
      '<p>The Bank regulates licensed financial institutions, manages the national currency, and publishes official exchange rates.</p>',
      'Shaqooyinka Aasaasiga ah',
      '<p>Baanku wuxuu xakameeyaa hay\'adaha maaliyadeed ee shatiga leh, wuxuu maamulaa lacagta qaranka, wuxuuna daabacaa qiimaha sarraafka rasmiga ah.</p>',
      'المهام الأساسية',
      '<p>ينظم البنك المؤسسات المالية المرخصة، ويدير العملة الوطنية، وينشر أسعار الصرف الرسمية.</p>',
    ],
    [
      'governors-statement',
      'about',
      "Governor's Statement",
      "<p>This section carries the Governor's statement on the Bank's priorities and outlook. Content is maintained by the Office of the Governor and updated periodically.</p>",
      'Bayaanka Guddoomiyaha',
      '<p>Qaybtan waxay ka kooban tahay bayaanka Guddoomiyaha ee ku saabsan mudnaanta iyo aragtida Baanka. Qoraalka waxaa maamula Xafiiska Guddoomiyaha, waxaana la cusboonaysiiyaa xilli kasta.</p>',
      'بيان المحافظ',
      '<p>يتضمن هذا القسم بيان المحافظ حول أولويات البنك وتوجهاته. يتم صيانة المحتوى من قبل مكتب المحافظ وتحديثه دوريًا.</p>',
    ],
    [
      'bosl-overview',
      'about',
      'BoSL Overview',
      '<p>The Bank of Somaliland is the central monetary authority of Somaliland, established to safeguard monetary stability, supervise the financial sector, and support the development of a sound national payment system.</p>',
      'Dulmar Guud oo Baanka ah',
      '<p>Baanka Somaliland waa maamulaha rasmiga ah ee lacagta, oo loo aasaasay si loo ilaaliyo xasillooni lacageed, loo kormeeriyo qaybta maaliyadeed, oo loo taageero horumarinta nidaam bixin oo qaran oo dhismo leh.</p>',
      'نظرة عامة على البنك',
      '<p>بنك أرض الصومال هو السلطة النقدية المركزية لأرض الصومال، تأسس لحماية الاستقرار النقدي والإشراف على القطاع المالي ودعم تطوير نظام مدفوعات وطني سليم.</p>',
    ],
    [
      'history',
      'about',
      'History',
      "<p>The Bank of Somaliland traces its role to Somaliland's efforts to establish an independent monetary and financial system. Its mandate has expanded over time to cover currency management, supervision of licensed institutions, and oversight of the national payment system.</p>",
      'Taariikhda',
      '<p>Baanka Somaliland wuxuu xiriir la leeyahay dadaalladii Somaliland ee lagu dhisay nidaam lacageed iyo maaliyadeed madax-bannaan. Waajibaadkiisu wuxuu ku sii kordhay muddo ka dib, isagoo hadda daboolaya maamulka lacagta, kormeerka hay\'adaha shatiga leh, iyo kormeerka nidaamka bixinta qaranka.</p>',
      'التاريخ',
      '<p>يرتبط بنك أرض الصومال بجهود أرض الصومال لإنشاء نظام نقدي ومالي مستقل. توسعت مهامه بمرور الوقت لتشمل إدارة العملة والإشراف على المؤسسات المرخصة والإشراف على نظام المدفوعات الوطني.</p>',
    ],
    [
      'senior-management',
      'about',
      'Senior Management',
      "<p>The Bank's senior management team oversees day-to-day operations across currency, supervision, monetary policy, and payment systems, reporting to the Governor.</p>",
      'Maamulka Sare',
      '<p>Kooxda maamulka sare ee Baanka waxay kormeertaa hawlaha maalinlaha ah ee ku saabsan lacagta, kormeerka, siyaasadda lacagta, iyo nidaamyada bixinta, waxayna warbixin u gudbisaa Guddoomiyaha.</p>',
      'الإدارة العليا',
      '<p>يشرف فريق الإدارة العليا في البنك على العمليات اليومية المتعلقة بالعملة والرقابة والسياسة النقدية وأنظمة الدفع، ويرفع تقاريره إلى المحافظ.</p>',
    ],
    [
      'office-of-the-governor',
      'about',
      'Office of the Governor',
      "<p>The Office of the Governor coordinates the Bank's leadership functions and represents the Bank in its dealings with government, the financial sector, and international partners.</p>",
      'Xafiiska Guddoomiyaha',
      '<p>Xafiiska Guddoomiyaha wuxuu iskuduwaa shaqooyinka hoggaaminta ee Baanka, wuxuuna Baanka u matalaa xiriirka uu la leeyahay dawladda, qaybta maaliyadeed, iyo saaxiibbada caalamiga ah.</p>',
      'مكتب المحافظ',
      '<p>ينسق مكتب المحافظ وظائف القيادة في البنك، ويمثل البنك في تعاملاته مع الحكومة والقطاع المالي والشركاء الدوليين.</p>',
    ],
    [
      'bosl-structure',
      'about',
      'BoSL Structure',
      '<p>The Bank is organized under the Governor and Board of Directors, with core function groups covering currency and banking operations, monetary and regulatory policy, and payment systems, supported by administrative and support services.</p>',
      'Qaab-dhismeedka Baanka',
      '<p>Baanka waxaa loo abaabulay Guddoomiyaha iyo Guddiga Maamulka hoostooda, isagoo leh kooxo shaqo oo aasaasi ah oo daboolaya lacagta iyo hawlaha bangiga, siyaasadda lacagta iyo xeer-hormarinta, iyo nidaamyada bixinta, oo ay taageeraan adeegyada maamulka iyo taageerada.</p>',
      'الهيكل التنظيمي للبنك',
      '<p>يُنظَّم البنك تحت إشراف المحافظ ومجلس الإدارة، مع مجموعات وظيفية أساسية تغطي العملة والعمليات المصرفية، والسياسة النقدية والتنظيمية، وأنظمة الدفع، مدعومة بخدمات إدارية ودعم.</p>',
    ],
    [
      'currency-banking-operations',
      'core_function',
      'Currency & Banking Operations Group',
      '<p>This group manages the issuance and circulation of the national currency and provides banking operations for the government and licensed financial institutions.</p>',
      'Kooxda Lacagta iyo Hawlaha Bangiga',
      '<p>Kooxdani waxay maamashaa soo saarista iyo wareegga lacagta qaranka, waxayna bixisaa adeegyada bangiga ee dawladda iyo hay\'adaha maaliyadeed ee shatiga leh.</p>',
      'مجموعة العملة والعمليات المصرفية',
      '<p>تدير هذه المجموعة إصدار وتداول العملة الوطنية، وتقدم العمليات المصرفية للحكومة والمؤسسات المالية المرخصة.</p>',
    ],
    [
      'monetary-financial-regulatory-policy',
      'core_function',
      'Monetary, Financial & Regulatory Policy Group',
      '<p>This group formulates monetary policy and sets the regulatory framework for supervising licensed financial institutions to maintain a sound and stable financial sector.</p>',
      'Kooxda Siyaasadda Lacagta, Maaliyadda iyo Xeer-hormarinta',
      '<p>Kooxdani waxay dejisaa siyaasadda lacagta waxayna dhisaa qaab-xeeraadka lagu kormeeriyo hay\'adaha maaliyadeed ee shatiga leh, si loo ilaaliyo qayb maaliyadeed oo dhismo iyo xasillooni leh.</p>',
      'مجموعة السياسة النقدية والمالية والتنظيمية',
      '<p>تضع هذه المجموعة السياسة النقدية وتحدد الإطار التنظيمي للإشراف على المؤسسات المالية المرخصة للحفاظ على قطاع مالي سليم ومستقر.</p>',
    ],
    [
      'payment-systems-nps',
      'core_function',
      'Payment Systems (NPS)',
      "<p>The National Payment System function promotes the safety, efficiency, and reliability of Somaliland's payment infrastructure, overseeing payment service providers and settlement systems.</p>",
      'Nidaamka Bixinta Qaranka (NPS)',
      '<p>Shaqada Nidaamka Bixinta Qaranka waxay kor u qaaddaa ammaanka, waxtarka, iyo kalsoonida kaabayaasha bixinta Somaliland, iyadoo kormeeraysa bixiyeyaasha adeegga bixinta iyo nidaamyada xisaabinta.</p>',
      'نظام المدفوعات الوطني (NPS)',
      '<p>تعمل وظيفة نظام المدفوعات الوطني على تعزيز سلامة وكفاءة وموثوقية البنية التحتية للمدفوعات في أرض الصومال، والإشراف على مزودي خدمات الدفع وأنظمة التسوية.</p>',
    ],
    [
      'financial-admin-support',
      'support_function',
      'Financial Administrative & Support Services Group',
      "<p>This group provides the internal administrative, financial, human resources, and information technology support that enables the Bank's core functions to operate effectively.</p>",
      'Kooxda Adeegyada Maamulka Maaliyadeed iyo Taageerada',
      '<p>Kooxdani waxay bixisaa taageerada gudaha ee maamulka, maaliyadda, kheyraadka aadanaha, iyo tignoolajiyada macluumaadka, taasoo suurtogelinaysa in shaqooyinka aasaasiga ah ee Baanka si wax ku ool ah u shaqeeyaan.</p>',
      'مجموعة الخدمات الإدارية والمالية والدعم',
      '<p>تقدم هذه المجموعة الدعم الإداري والمالي والموارد البشرية وتقنية المعلومات الداخلي الذي يمكّن المهام الأساسية للبنك من العمل بفعالية.</p>',
    ],
    [
      'training',
      'opportunities',
      'Training',
      '<p>The Bank periodically offers training and capacity-building opportunities for its staff and the wider financial sector. Check back here for upcoming programs.</p>',
      'Tababarka',
      '<p>Baanku xilli kasta wuxuu bixiyaa fursado tababar iyo dhisidda kartida shaqaalihiisa iyo qaybta maaliyadeed ee ballaaran. Halkan dib u soo booqo barnaamijyada soo socda.</p>',
      'التدريب',
      '<p>يقدم البنك بشكل دوري فرص تدريب وبناء قدرات لموظفيه وللقطاع المالي بشكل أوسع. يرجى مراجعة هذه الصفحة للاطلاع على البرامج القادمة.</p>',
    ],
  ];
  for (const [slug, page_type, title, body, titleSo, bodySo, titleAr, bodyAr] of pages) {
    const { rows } = await pool.query(
      `INSERT INTO content_pages (slug, page_type, status, updated_by)
       VALUES ($1, $2, 'published', $3)
       ON CONFLICT (slug) DO UPDATE SET status = EXCLUDED.status
       RETURNING id`,
      [slug, page_type, superAdminId]
    );
    await insertContent('content_pages', rows[0].id, title, body, 'en');
    await insertContent('content_pages', rows[0].id, titleSo, bodySo, 'so');
    await insertContent('content_pages', rows[0].id, titleAr, bodyAr, 'ar');
  }

  console.log('Seeding laws & regulations...');
  const laws: [string, string, string, string, string, string][] = [
    ['Central Bank of Somaliland Act', 'https://example-spaces.local/central-bank-act.pdf', '54/2012', '2012-06-01', 'Sharciga Baanka Dhexe ee Somaliland', 'قانون البنك المركزي لأرض الصومال'],
    ['Anti-Money Laundering Regulation', 'https://example-spaces.local/aml-regulation.pdf', '12/2019', '2019-03-15', 'Xeerka Ka Hortagga Dhaqashada Lacagta', 'لائحة مكافحة غسل الأموال'],
    ['Licensed Institutions Supervision Directive', 'https://example-spaces.local/supervision-directive.pdf', '07/2023', '2023-01-10', 'Tilmaanta Kormeerka Hay\'adaha Shatiga leh', 'توجيه الرقابة على المؤسسات المرخصة'],
  ];
  for (const [title, file_url, law_number, effective_date, titleSo, titleAr] of laws) {
    if (await titleAlreadySeeded('laws_regulations', title)) continue;
    const { rows } = await pool.query(
      `INSERT INTO laws_regulations (title_content_id, file_url, law_number, effective_date)
       VALUES (uuid_generate_v4(), $1, $2, $3) RETURNING title_content_id`,
      [file_url, law_number, effective_date]
    );
    await insertContent('laws_regulations', rows[0].title_content_id, title, '', 'en');
    await insertContent('laws_regulations', rows[0].title_content_id, titleSo, '', 'so');
    await insertContent('laws_regulations', rows[0].title_content_id, titleAr, '', 'ar');
  }

  console.log('Seeding job postings...');
  const jobs: [string, string, string, string, string][] = [
    ['Senior Bank Examiner', 'Bank Supervision Department', '2026-08-15', 'Baadhe Bangi oo Sare', 'مفتش بنكي أول'],
    ['Currency Operations Officer', 'Currency Department', '2026-08-01', 'Sarkaal Hawlaha Lacagta', 'موظف عمليات العملة'],
  ];
  for (const [title, department, closing_date, titleSo, titleAr] of jobs) {
    if (await titleAlreadySeeded('job_postings', title)) continue;
    const { rows } = await pool.query(
      `INSERT INTO job_postings (title_content_id, department, closing_date)
       VALUES (uuid_generate_v4(), $1, $2) RETURNING title_content_id`,
      [department, closing_date]
    );
    await insertContent('job_postings', rows[0].title_content_id, title, '', 'en');
    await insertContent('job_postings', rows[0].title_content_id, titleSo, '', 'so');
    await insertContent('job_postings', rows[0].title_content_id, titleAr, '', 'ar');
  }

  console.log('Seeding tenders...');
  const tenders: [string, string, string, string, string, string][] = [
    ['Supply of IT Infrastructure Equipment', 'BOS-TND-2026-014', '2026-08-20', 'https://example-spaces.local/tender-2026-014.pdf', 'Bixinta Qalabka Tignoolajiyadda IT', 'توريد معدات البنية التحتية لتقنية المعلومات'],
  ];
  for (const [title, reference_number, closing_date, file_url, titleSo, titleAr] of tenders) {
    const { rows } = await pool.query(
      `INSERT INTO tenders (title_content_id, reference_number, closing_date, file_url)
       VALUES (uuid_generate_v4(), $1, $2, $3)
       ON CONFLICT (reference_number) DO NOTHING RETURNING title_content_id`,
      [reference_number, closing_date, file_url]
    );
    if (rows[0]) {
      await insertContent('tenders', rows[0].title_content_id, title, '', 'en');
      await insertContent('tenders', rows[0].title_content_id, titleSo, '', 'so');
      await insertContent('tenders', rows[0].title_content_id, titleAr, '', 'ar');
    }
  }

  console.log('Seeding navigation...');
  const existingNav = await pool.query('SELECT count(*)::int AS n FROM nav_items');
  if (existingNav.rows[0].n === 0) {
    const aboutId = (
      await pool.query(
        `INSERT INTO nav_items (label, label_so, label_ar, path, sort_order, updated_by) VALUES ('About', 'Ku Saabsan', 'عن البنك', '#', 1, $1) RETURNING id`,
        [superAdminId]
      )
    ).rows[0].id;
    const resourcesId = (
      await pool.query(
        `INSERT INTO nav_items (label, label_so, label_ar, path, sort_order, updated_by) VALUES ('Resources', 'Ilaha', 'الموارد', '#', 3, $1) RETURNING id`,
        [superAdminId]
      )
    ).rows[0].id;

    const navRows: [string, string, string, string, string | null, number][] = [
      ['About the Bank', 'Ku Saabsan Baanka', 'عن البنك', '/about', aboutId, 1],
      ['Governance', 'Maamulka', 'الحوكمة', '/governance', aboutId, 2],
      ['Core Functions', 'Shaqooyinka Aasaasiga ah', 'المهام الأساسية', '/core-functions', aboutId, 3],
      ['Licensed Institutions', 'Hay\'adaha Shatiga leh', 'المؤسسات المرخصة', '/institutions', null, 2],
      ['Publications', 'Daabacaadaha', 'المنشورات', '/publications', resourcesId, 1],
      ['Laws & Regulations', 'Sharciyada & Xeerarka', 'القوانين واللوائح', '/laws', resourcesId, 2],
      ['Press Releases', 'War-saxaafadeedyo', 'البيانات الصحفية', '/press', resourcesId, 3],
      ['Careers & Tenders', 'Shaqooyin & Dalabyo', 'الوظائف والمناقصات', '/careers', resourcesId, 4],
      ['Contact', 'La Xiriir', 'اتصل بنا', '/contact', null, 4],
    ];
    for (const [label, labelSo, labelAr, path, parent_id, sort_order] of navRows) {
      await pool.query(
        `INSERT INTO nav_items (label, label_so, label_ar, path, parent_id, sort_order, updated_by) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [label, labelSo, labelAr, path, parent_id, sort_order, superAdminId]
      );
    }
  }

  console.log('Seeding hero slides...');
  const existingSlides = await pool.query('SELECT count(*)::int AS n FROM hero_slides');
  if (existingSlides.rows[0].n === 0) {
    const slides: [string, string, string, string, string, string][] = [
      [
        'The official monetary authority of Somaliland',
        'Maamulaha rasmiga ah ee lacagta Somaliland',
        'Daily exchange rates, licensed institutions, and official publications.',
        'Qiimaha sarraafka maalinlaha ah, hay\'adaha shatiga leh, iyo daabacaadaha rasmiga ah.',
        'السلطة النقدية الرسمية لأرض الصومال',
        'أسعار الصرف اليومية، والمؤسسات المرخصة، والمنشورات الرسمية.',
      ],
      [
        'Verify a licensed institution in seconds',
        'Hubi hay\'ad shati leh daqiiqado gudahood',
        'Search the official register maintained by the Bank Supervision Department.',
        'Ka raadi diiwaanka rasmiga ah ee uu maamulo Waaxda Kormeerka Bangiyada.',
        'تحقق من مؤسسة مرخصة في ثوانٍ',
        'ابحث في السجل الرسمي الذي تديره إدارة الرقابة المصرفية.',
      ],
    ];
    for (let i = 0; i < slides.length; i++) {
      const [title, titleSo, subtitle, subtitleSo, titleAr, subtitleAr] = slides[i];
      await pool.query(
        `INSERT INTO hero_slides (title, title_so, title_ar, subtitle, subtitle_so, subtitle_ar, link_url, sort_order, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, '/press', $7, $8)`,
        [title, titleSo, titleAr, subtitle, subtitleSo, subtitleAr, i + 1, superAdminId]
      );
    }
  }

  console.log('Seed complete.');
  await pool.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
