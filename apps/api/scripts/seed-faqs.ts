import { pool } from '../src/db/pool';

const faqs = [
  {
    question: 'What is the official exchange rate for the Somaliland Shilling?',
    question_so: 'Waa maxay qiimaha rasmiga ah ee Shilingka Somaliland?',
    question_ar: 'ما هو سعر الصرف الرسمي لشلن أرض الصومال؟',
    answer: 'The Bank of Somaliland publishes daily buying and selling rates for major currencies against the Somaliland Shilling on the Exchange Rates page. This is the only official source — no free-floating market rate exists.',
    answer_so: 'Baanka Somaliland wuxuu maalin walba daabacaa qiimayaasha iibsiga iyo iibinta lacagaha waaweyn ee ka soo horjeeda Shilingka Somaliland ee bogga Qiimaha Sarifka. Kani waa isha rasmiga ah oo kaliya.',
    answer_ar: 'ينشر بنك أرض الصومال يوميًا أسعار الشراء والبيع للعملات الرئيسية مقابل شلن أرض الصومال في صفحة أسعار الصرف. هذا هو المصدر الرسمي الوحيد.',
  },
  {
    question: 'How can I confirm whether a financial institution is licensed?',
    question_so: 'Sideen u xaqiijin karaa in hay\'ad maaliyadeed ay shati haysato?',
    question_ar: 'كيف يمكنني التأكد من أن مؤسسة مالية مرخصة؟',
    answer: 'Use the Licensed Institutions Register on this site to search by name. Only institutions listed as "Active" currently hold a valid Bank of Somaliland license.',
    answer_so: 'Isticmaal Diiwaanka Hay\'adaha Shatiga Leh ee boggan si aad ugu raadiso magaca. Hay\'adaha kaliya ee lagu calaamadeeyay "Firfircoon" ayaa hadda haysta shati Baanka Somaliland ah oo sax ah.',
    answer_ar: 'استخدم سجل المؤسسات المرخصة في هذا الموقع للبحث بالاسم. المؤسسات المدرجة كـ "نشطة" فقط هي التي تحمل حاليًا ترخيصًا ساريًا من بنك أرض الصومال.',
  },
  {
    question: 'Does the Bank of Somaliland accept individual account service requests through this website?',
    question_so: 'Baanka Somaliland ma ka aqbalaa codsiyada adeegga akoonka shakhsiga ah boggan?',
    question_ar: 'هل يقبل بنك أرض الصومال طلبات خدمة الحسابات الفردية عبر هذا الموقع؟',
    answer: 'No. This website provides regulatory and informational services only. The Bank of Somaliland does not offer retail banking services to the public — for personal or business banking, please contact a licensed commercial bank.',
    answer_so: 'Maya. Boggan wuxuu bixiyaa adeegyo sharci iyo macluumaad oo kaliya. Baanka Somaliland uma bixiyo adeegyada bangiga jaajaawe ee dadweynaha — banggiga shakhsiga ama ganacsiga, fadlan la xiriir bangi ganacsi oo shati leh.',
    answer_ar: 'لا. يقدم هذا الموقع خدمات تنظيمية ومعلوماتية فقط. لا يقدم بنك أرض الصومال خدمات مصرفية للأفراد — للخدمات المصرفية الشخصية أو التجارية، يرجى الاتصال ببنك تجاري مرخص.',
  },
  {
    question: 'How often are publications and circulars updated?',
    question_so: 'Immisa jeer ayaa daabacadaha iyo wareegtooyinka la cusboonaysiiyaa?',
    question_ar: 'كم مرة يتم تحديث المنشورات والتعاميم؟',
    answer: 'Annual reports are published yearly, financial stability reports periodically, and circulars are issued as regulatory decisions require. Check the Publications & Laws page for the latest documents.',
    answer_so: 'Warbixinnada sanadlaha ah waxaa la daabacaa sanad kasta, warbixinnada xasilloonida maaliyadeed xilli xilli ah, wareegtooyinkuna waxaa la soo saaraa marka go\'aannada sharciga ah ay u baahdaan. Eeg bogga Daabacadaha & Sharciyada si aad u hesho dukumentiyada ugu dambeeya.',
    answer_ar: 'تُنشر التقارير السنوية سنويًا، وتقارير الاستقرار المالي بشكل دوري، وتصدر التعاميم حسب الحاجة التنظيمية. راجع صفحة المنشورات والقوانين للحصول على أحدث الوثائق.',
  },
  {
    question: 'How do I report a suspected unlicensed financial operator?',
    question_so: 'Sideen u soo warbixin karaa hay\'ad maaliyadeed oo shati la\'aan shaki lagu qabo?',
    question_ar: 'كيف يمكنني الإبلاغ عن جهة مالية مشتبه في عملها دون ترخيص؟',
    answer: 'Please use the Contact page to submit a report with as much detail as possible. All submissions are reviewed by the Bank\'s supervision team.',
    answer_so: 'Fadlan isticmaal bogga Xiriirka si aad u gudbiso warbixin faahfaahin badan leh oo suurtagal ah. Dhammaan gudbinada waxaa dib u eegaya kooxda kormeerka ee Baanka.',
    answer_ar: 'يرجى استخدام صفحة الاتصال لتقديم بلاغ بأكبر قدر ممكن من التفاصيل. يراجع فريق الرقابة في البنك جميع البلاغات المقدمة.',
  },
];

async function main() {
  for (let i = 0; i < faqs.length; i++) {
    const f = faqs[i];
    await pool.query(
      `INSERT INTO faqs (question, question_so, question_ar, answer, answer_so, answer_ar, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
      [f.question, f.question_so, f.question_ar, f.answer, f.answer_so, f.answer_ar, i + 1]
    );
  }
  console.log(`Seeded ${faqs.length} FAQs.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
