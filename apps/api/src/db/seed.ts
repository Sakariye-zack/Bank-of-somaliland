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
  body: string
) {
  await pool.query(
    `INSERT INTO content_translations (content_id, content_table, language_code, title, body)
     VALUES ($1, $2, 'en', $3, $4)
     ON CONFLICT (content_id, content_table, language_code) DO NOTHING`,
    [contentId, contentTable, title, body]
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
  const pressReleases: [string, string, boolean][] = [
    ['Governor meets licensed remittance operators', 'The Governor of the Bank of Somaliland met with representatives of licensed remittance operators to discuss compliance with anti-money-laundering guidance.', true],
    ['Bank of Somaliland publishes Q2 stability report', 'The Bank has released its quarterly financial stability report, covering the licensed banking and remittance sectors.', true],
    ['Notice: revised licensing fee schedule', 'Effective the next fiscal quarter, the Bank is updating its licensing fee schedule for supervised institutions.', false],
  ];
  for (const [title, body, featured] of pressReleases) {
    if (await titleAlreadySeeded('press_releases', title)) continue;
    const { rows } = await pool.query(
      `INSERT INTO press_releases (publish_date, content_id, status, featured)
       VALUES (CURRENT_DATE, uuid_generate_v4(), 'published', $1)
       RETURNING content_id`,
      [featured]
    );
    await insertContent('press_releases', rows[0].content_id, title, body);
  }

  console.log('Seeding publications...');
  const publications: [string, string, string][] = [
    ['Annual Report 2025', 'annual_report', 'https://example-spaces.local/annual-report-2025.pdf'],
    ['Circular 2026-03: Remittance AML Guidance', 'circular', 'https://example-spaces.local/circular-2026-03.pdf'],
    ['Q2 2026 Financial Stability Report', 'stability_report', 'https://example-spaces.local/stability-report-q2-2026.pdf'],
  ];
  for (const [title, category, file_url] of publications) {
    if (await titleAlreadySeeded('publications', title)) continue;
    const { rows } = await pool.query(
      `INSERT INTO publications (title_content_id, file_url, category, publish_date)
       VALUES (uuid_generate_v4(), $1, $2, CURRENT_DATE)
       RETURNING title_content_id`,
      [file_url, category]
    );
    await insertContent('publications', rows[0].title_content_id, title, '');
  }

  console.log('Seeding content pages...');
  const pages: [string, string, string, string][] = [
    ['about-the-bank', 'about', 'About the Bank', '<p>The Bank of Somaliland is the central monetary authority of Somaliland, responsible for currency issuance, financial supervision, and monetary policy.</p>'],
    ['governance', 'governance', 'Governance', '<p>The Bank is governed by a Board chaired by the Governor, with oversight of monetary policy and financial sector supervision.</p>'],
    ['core-functions', 'core_function', 'Core Functions', '<p>The Bank regulates licensed financial institutions, manages the national currency, and publishes official exchange rates.</p>'],
  ];
  for (const [slug, page_type, title, body] of pages) {
    const { rows } = await pool.query(
      `INSERT INTO content_pages (slug, page_type, status, updated_by)
       VALUES ($1, $2, 'published', $3)
       ON CONFLICT (slug) DO UPDATE SET status = EXCLUDED.status
       RETURNING id`,
      [slug, page_type, superAdminId]
    );
    await insertContent('content_pages', rows[0].id, title, body);
  }

  console.log('Seeding laws & regulations...');
  const laws: [string, string, string, string][] = [
    ['Central Bank of Somaliland Act', 'https://example-spaces.local/central-bank-act.pdf', '54/2012', '2012-06-01'],
    ['Anti-Money Laundering Regulation', 'https://example-spaces.local/aml-regulation.pdf', '12/2019', '2019-03-15'],
    ['Licensed Institutions Supervision Directive', 'https://example-spaces.local/supervision-directive.pdf', '07/2023', '2023-01-10'],
  ];
  for (const [title, file_url, law_number, effective_date] of laws) {
    if (await titleAlreadySeeded('laws_regulations', title)) continue;
    const { rows } = await pool.query(
      `INSERT INTO laws_regulations (title_content_id, file_url, law_number, effective_date)
       VALUES (uuid_generate_v4(), $1, $2, $3) RETURNING title_content_id`,
      [file_url, law_number, effective_date]
    );
    await insertContent('laws_regulations', rows[0].title_content_id, title, '');
  }

  console.log('Seeding job postings...');
  const jobs: [string, string, string][] = [
    ['Senior Bank Examiner', 'Bank Supervision Department', '2026-08-15'],
    ['Currency Operations Officer', 'Currency Department', '2026-08-01'],
  ];
  for (const [title, department, closing_date] of jobs) {
    if (await titleAlreadySeeded('job_postings', title)) continue;
    const { rows } = await pool.query(
      `INSERT INTO job_postings (title_content_id, department, closing_date)
       VALUES (uuid_generate_v4(), $1, $2) RETURNING title_content_id`,
      [department, closing_date]
    );
    await insertContent('job_postings', rows[0].title_content_id, title, '');
  }

  console.log('Seeding tenders...');
  const tenders: [string, string, string, string][] = [
    ['Supply of IT Infrastructure Equipment', 'BOS-TND-2026-014', '2026-08-20', 'https://example-spaces.local/tender-2026-014.pdf'],
  ];
  for (const [title, reference_number, closing_date, file_url] of tenders) {
    const { rows } = await pool.query(
      `INSERT INTO tenders (title_content_id, reference_number, closing_date, file_url)
       VALUES (uuid_generate_v4(), $1, $2, $3)
       ON CONFLICT (reference_number) DO NOTHING RETURNING title_content_id`,
      [reference_number, closing_date, file_url]
    );
    if (rows[0]) await insertContent('tenders', rows[0].title_content_id, title, '');
  }

  console.log('Seed complete.');
  await pool.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
