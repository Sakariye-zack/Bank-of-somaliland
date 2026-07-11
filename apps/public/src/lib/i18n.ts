import { useLanguage } from './LanguageContext';

const dict = {
  en: {
    // Header / utility
    contactTheBank: 'Contact the Bank',
    langEnTitle: 'English (only fully supported language for now)',
    langSoTitle: 'Somali',
    langArTitle: 'Arabic — coming soon, will show fallback notice',
    toggleNav: 'Toggle navigation',
    langSwitcher: 'Language switcher',
    bankEmblem: 'Bank of Somaliland emblem',
    bankName: 'Bank of Somaliland',
    centralMonetaryAuthority: 'Central Monetary Authority',

    // Home
    heroEyebrow: 'Central Bank of the Republic of Somaliland',
    heroTitle: 'The official monetary authority of Somaliland',
    heroLede:
      'Daily exchange rates, the register of licensed financial institutions, and official publications — published directly by the Bank of Somaliland.',
    verifyInstitution: 'Verify a licensed institution',
    viewPublications: 'View publications',
    officialExchangeRates: 'Official Exchange Rates',
    asOf: 'as of',
    loadingRates: 'Loading rates…',
    noRatesYet: 'No rates published yet.',
    officialRateNote:
      '"Official Rate" — set by the Bank of Somaliland. No free-floating market rate exists for the Somaliland Shilling.',
    recentAnnouncements: 'Recent Announcements',
    latestFromBank: 'The latest from the Bank of Somaliland',
    viewAllPress: 'View all press releases →',
    loadingAnnouncements: 'Loading announcements…',
    noAnnouncementsYet: 'No announcements published yet.',
    usDollar: 'US Dollar',
    saudiRiyal: 'Saudi Riyal',
    ethiopianBirr: 'Ethiopian Birr',
    uaeDirham: 'UAE Dirham',

    // Institutions
    institutionsTitle: 'Licensed Institutions Register',
    institutionsSub: 'Confirm whether a financial institution currently holds a Bank of Somaliland license.',
    searchByName: 'Search by institution name…',
    allTypes: 'All types',
    allStatuses: 'All statuses',
    typeBank: 'Bank',
    typeRemit: 'Remittance',
    typeMm: 'Mobile Money',
    typeMfi: 'Microfinance',
    typePay: 'Payment System',
    typeTakaful: 'Takaful / Insurance',
    typeFx: 'Forex Dealer',
    statusActive: 'Active',
    statusRevoked: 'Revoked',
    loadingInstitutions: 'Loading institutions…',
    noInstitutionsMatch: 'No institutions match your search.',
    colName: 'Name',
    colType: 'Type',
    colHeadquarters: 'Headquarters',
    colLicenseNo: 'License No.',
    colStatus: 'Status',

    // Publications
    publicationsTitle: 'Publications & Laws',
    publicationsSub: 'Annual reports, circulars, and financial stability reports.',
    allCategories: 'All categories',
    catAnnualReport: 'Annual Report',
    catCircular: 'Circular',
    catStabilityReport: 'Stability Report',
    loadingPublications: 'Loading publications…',
    noPublicationsYet: 'No publications in this category yet.',
    downloadPdf: 'Download PDF →',

    // Laws
    lawsTitle: 'Laws & Regulations',
    lawsSub: 'The legal and regulatory framework governing the Bank of Somaliland.',
    loading: 'Loading…',
    noLawsYet: 'No laws or regulations published yet.',
    law: 'Law',

    // Press
    pressTitle: 'Press Releases',
    pressSub: 'Official announcements from the Bank of Somaliland.',
    loadingPress: 'Loading press releases…',
    noPressYet: 'No press releases published yet.',
    featured: '· Featured',
    previous: 'Previous',
    next: 'Next',
    pageOf: (page: number, total: number) => `Page ${page} of ${total}`,

    // Careers
    careersTitle: 'Careers',
    careersSub: 'Open positions at the Bank of Somaliland.',
    noJobsYet: 'No open positions right now.',
    closes: 'Closes',
    tendersTitle: 'Tenders',
    tendersSub: 'Procurement opportunities open for bidding.',
    noTendersYet: 'No open tenders right now.',
    ref: 'Ref.',
    downloadTender: 'Download tender document →',

    // Contact
    contactTitle: 'Contact the Bank',
    contactSub: 'General inquiries — the Bank does not accept account service requests here.',
    contactThanks: 'Thank you — your message has been received.',
    fullName: 'Full name',
    emailAddress: 'Email address',
    subject: 'Subject',
    message: 'Message',
    sending: 'Sending…',
    sendMessage: 'Send message',
    somethingWrong: 'Something went wrong.',

    // Content pages / fallback
    fallbackNotice: "This page is not yet translated into the language you requested — showing the English version instead.",

    // News slider
    sliderEyebrow: 'Latest from the Bank',
    sliderCta: 'Read the full announcement →',

    // Footer
    footerBlurb:
      'The official monetary authority of the Republic of Somaliland — responsible for currency issuance, financial sector supervision, and monetary policy. Hargeisa, Somaliland.',
    footerAbout: 'About',
    footerResources: 'Resources',
    footerStayInformed: 'Stay Informed',
    footerNote:
      'Official exchange rates and licensed institution status are published exclusively on this site — treat any other source as unverified.',
    footerReadAnnouncements: 'Read the latest announcements →',
    footerContact: 'Contact the Bank →',
    footerRights: (year: number) => `© ${year} Bank of Somaliland. All rights reserved.`,
    footerBottomNote: 'The Bank of Somaliland is the sole regulator of licensed financial institutions in Somaliland.',

    navAboutTheBank: 'About the Bank',
    navGovernance: 'Governance',
    navCoreFunctions: 'Core Functions',
    navLicensedInstitutions: 'Licensed Institutions',
    navPublications: 'Publications',
    navLawsRegulations: 'Laws & Regulations',
    navPressReleases: 'Press Releases',
    navCareersTenders: 'Careers & Tenders',
  },
  so: {
    contactTheBank: 'La Xiriir Baanka',
    langEnTitle: 'Ingiriisi',
    langSoTitle: 'Soomaali',
    langArTitle: 'Carabi — dhawaan, waxay tusi doontaa ogeysiiska fallback-ka',
    toggleNav: 'Furan/Xidhan liiska',
    langSwitcher: 'Beddelka luqadda',
    bankEmblem: 'Astaanta Baanka Somaliland',
    bankName: 'Baanka Somaliland',
    centralMonetaryAuthority: 'Maamulaha Dhexe ee Lacagta',

    heroEyebrow: 'Baanka Dhexe ee Jamhuuriyadda Somaliland',
    heroTitle: 'Maamulaha rasmiga ah ee lacagta Somaliland',
    heroLede:
      'Qiimaha sarraafka ee maalinlaha ah, diiwaanka hay\'adaha maaliyadeed ee shatiga leh, iyo daabacaadaha rasmiga ah — waxa lagu daabacaa si toos ah Baanka Somaliland.',
    verifyInstitution: 'Hubi hay\'ad shati leh',
    viewPublications: 'Eeg daabacaadaha',
    officialExchangeRates: 'Qiimaha Sarraafka Rasmiga ah',
    asOf: 'ilaa',
    loadingRates: 'Qiimaha ayaa soo dhacaya…',
    noRatesYet: 'Wali qiimo lama daabicin.',
    officialRateNote:
      '"Qiimaha Rasmiga ah" — waxaa dejiya Baanka Somaliland. Ma jiro qiimo suuq oo xor ah oo u dhexeeya Shilingka Somaliland.',
    recentAnnouncements: 'Ogeysiisyada Dhawaan',
    latestFromBank: 'Kuwa ugu dambeeyay ee Baanka Somaliland',
    viewAllPress: 'Eeg dhammaan war-saxaafadeedka →',
    loadingAnnouncements: 'Ogeysiisyada ayaa soo dhacaya…',
    noAnnouncementsYet: 'Wali ogeysiis lama daabicin.',
    usDollar: 'Doolar Mareykan',
    saudiRiyal: 'Riyal Sacuudi',
    ethiopianBirr: 'Birta Itoobiya',
    uaeDirham: 'Dirham Imaaraat',

    institutionsTitle: 'Diiwaanka Hay\'adaha Shatiga Leh',
    institutionsSub: 'Hubi in hay\'ad maaliyadeed ay hadda haysato shati Baanka Somaliland.',
    searchByName: 'Ku raadi magaca hay\'adda…',
    allTypes: 'Dhammaan noocyada',
    allStatuses: 'Dhammaan xaaladaha',
    typeBank: 'Bangi',
    typeRemit: 'Xawaale',
    typeMm: 'Lacagta Mobilka',
    typeMfi: 'Maalgelin Yar',
    typePay: 'Nidaamka Bixinta',
    typeTakaful: 'Takaaful / Caymis',
    typeFx: 'Ganacsatada Sarraafka',
    statusActive: 'Firfircoon',
    statusRevoked: 'La Joojiyay',
    loadingInstitutions: 'Hay\'adaha ayaa soo dhacaya…',
    noInstitutionsMatch: 'Wax hay\'ado ah oo la mid ah raadintaada lama helin.',
    colName: 'Magaca',
    colType: 'Nooca',
    colHeadquarters: 'Xarunta',
    colLicenseNo: 'Lambarka Shatiga',
    colStatus: 'Xaaladda',

    publicationsTitle: 'Daabacaadaha & Sharciyada',
    publicationsSub: 'Warbixinnada sannadlaha ah, wareegyada, iyo warbixinnada xasilloonida maaliyadeed.',
    allCategories: 'Dhammaan qaybaha',
    catAnnualReport: 'Warbixin Sannadlaha ah',
    catCircular: 'Wareegto',
    catStabilityReport: 'Warbixin Xasillooni',
    loadingPublications: 'Daabacaadaha ayaa soo dhacaya…',
    noPublicationsYet: 'Qaybtan wali daabacaad lama gelin.',
    downloadPdf: 'Soo Deji PDF →',

    lawsTitle: 'Sharciyada & Xeerarka',
    lawsSub: 'Qaabka sharciyeed iyo xeerarka maamula Baanka Somaliland.',
    loading: 'Soo dhacaya…',
    noLawsYet: 'Wali sharci ama xeer lama daabicin.',
    law: 'Sharci',

    pressTitle: 'War-saxaafadeedyo',
    pressSub: 'Ogeysiisyada rasmiga ah ee Baanka Somaliland.',
    loadingPress: 'War-saxaafadeedyada ayaa soo dhacaya…',
    noPressYet: 'Wali war-saxaafadeed lama daabicin.',
    featured: '· Muuqda',
    previous: 'Hore',
    next: 'Xiga',
    pageOf: (page: number, total: number) => `Bogga ${page} ee ${total}`,

    careersTitle: 'Shaqooyin',
    careersSub: 'Boosaska furan ee Baanka Somaliland.',
    noJobsYet: 'Hadda boos shaqo oo furan ma jiro.',
    closes: 'Xirmaysa',
    tendersTitle: 'Dalabyo Ganacsi',
    tendersSub: 'Fursadaha iibsiga ee furan ee dalabka la qaadan karo.',
    noTendersYet: 'Hadda dalab ganacsi oo furan ma jiro.',
    ref: 'Lamb.',
    downloadTender: 'Soo deji dukumeenka dalabka →',

    contactTitle: 'La Xiriir Baanka',
    contactSub: 'Su\'aalaha guud — Baanku halkan kama aqbalo codsiyada adeegga akoonka.',
    contactThanks: 'Mahadsanid — fariintaada waa la helay.',
    fullName: 'Magaca oo dhan',
    emailAddress: 'Ciwaanka Email-ka',
    subject: 'Mowduuca',
    message: 'Fariinta',
    sending: 'Waa la dirayaa…',
    sendMessage: 'Dir Fariinta',
    somethingWrong: 'Wax baa qaldamay.',

    fallbackNotice: 'Boggan wali lagama turjumin luqadda aad codsatay — waxaa lagu tusayaa nuqulka Ingiriisiga ah.',

    sliderEyebrow: 'Kuwa ugu dambeeyay ee Baanka',
    sliderCta: 'Akhri ogeysiiska oo dhan →',

    footerBlurb:
      'Maamulaha rasmiga ah ee lacagta Jamhuuriyadda Somaliland — mas\'uul ka ah soo saarista lacagta, kormeerka qaybta maaliyadeed, iyo siyaasadda lacagta. Hargeisa, Somaliland.',
    footerAbout: 'Ku Saabsan',
    footerResources: 'Ilaha',
    footerStayInformed: 'Warbixin La Soco',
    footerNote:
      'Qiimaha sarraafka rasmiga ah iyo xaaladda hay\'adaha shatiga leh waxaa keliya lagu daabacaa boggan — meel kasta oo kale ha u haysan mid aan la xaqiijin.',
    footerReadAnnouncements: 'Akhri ogeysiisyada ugu dambeeyay →',
    footerContact: 'La Xiriir Baanka →',
    footerRights: (year: number) => `© ${year} Baanka Somaliland. Dhammaan xuquuqda way dhowran yihiin.`,
    footerBottomNote: 'Baanka Somaliland waa hay\'adda kaliya ee kormeerta hay\'adaha maaliyadeed ee shatiga leh ee Somaliland.',

    navAboutTheBank: 'Ku Saabsan Baanka',
    navGovernance: 'Maamulka',
    navCoreFunctions: 'Shaqooyinka Aasaasiga ah',
    navLicensedInstitutions: 'Hay\'adaha Shatiga leh',
    navPublications: 'Daabacaadaha',
    navLawsRegulations: 'Sharciyada & Xeerarka',
    navPressReleases: 'War-saxaafadeedyo',
    navCareersTenders: 'Shaqooyin & Dalabyo',
  },
} as const;

export type TranslationKey = keyof typeof dict.en;

export function useT() {
  const { lang } = useLanguage();
  const table = lang === 'so' ? dict.so : dict.en;
  return function t(key: TranslationKey, ...args: unknown[]): string {
    const value = (table as Record<string, unknown>)[key] ?? (dict.en as Record<string, unknown>)[key];
    if (typeof value === 'function') return (value as (...a: unknown[]) => string)(...args);
    return typeof value === 'string' ? value : String(value);
  };
}
