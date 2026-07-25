import { pool } from '../src/db/pool';

const privacyBody = `
<p>The Bank of Somaliland ("the Bank") is committed to protecting the privacy of visitors to this website.</p>
<h3>Information We Collect</h3>
<p>When you use the contact form, subscribe to our newsletter, or interact with this site, we may collect your name, email address, and the content of your message. We do not collect financial account information through this website — the Bank does not accept account service requests here.</p>
<h3>How We Use Information</h3>
<p>Information submitted through this site is used solely to respond to inquiries, send requested updates (such as exchange-rate alerts), and improve our public services. We do not sell or share personal information with third parties for marketing purposes.</p>
<h3>Cookies</h3>
<p>This site may use minimal, essential cookies to remember your language preference and improve site performance. No third-party advertising cookies are used.</p>
<h3>Data Retention</h3>
<p>Contact messages and newsletter subscriptions are retained only as long as necessary to fulfil their purpose, or until you request removal.</p>
<h3>Your Rights</h3>
<p>You may request that we delete your contact submissions or unsubscribe from newsletter communications at any time by contacting us.</p>
<h3>Contact</h3>
<p>Questions about this policy may be directed to the Bank of Somaliland via the <a href="/contact">Contact</a> page.</p>
`.trim();

const termsBody = `
<p>By accessing and using this website, you agree to the following terms.</p>
<h3>Official Source</h3>
<p>Exchange rates, licensed-institution status, and regulatory publications on this site are published exclusively by the Bank of Somaliland. Any other source claiming to represent official rates or licensing status should be treated as unverified.</p>
<h3>Permitted Use</h3>
<p>Content on this site — publications, circulars, laws and regulations — may be viewed and downloaded for personal, educational, and research use. Reproduction for commercial purposes requires prior written permission from the Bank.</p>
<h3>No Financial Advice</h3>
<p>Information published on this site, including exchange rates and economic data, is provided for informational purposes only and does not constitute financial, investment, or legal advice.</p>
<h3>Accuracy</h3>
<p>While the Bank makes every effort to ensure the accuracy of published information, rates and figures are subject to change and should be verified directly with the Bank for time-sensitive decisions.</p>
<h3>Limitation of Liability</h3>
<p>The Bank of Somaliland is not liable for any loss or damage arising from reliance on information published on this website.</p>
<h3>Changes to These Terms</h3>
<p>These terms may be updated periodically. Continued use of the site after changes are published constitutes acceptance of the revised terms.</p>
`.trim();

async function upsertPage(slug: string, pageType: string, title: string, body: string) {
  const existing = await pool.query('SELECT id FROM content_pages WHERE slug = $1', [slug]);
  let id: string;
  if (existing.rows.length > 0) {
    id = existing.rows[0].id;
    await pool.query(`UPDATE content_pages SET status = 'published' WHERE id = $1`, [id]);
  } else {
    const inserted = await pool.query(
      `INSERT INTO content_pages (slug, page_type, status) VALUES ($1, $2, 'published') RETURNING id`,
      [slug, pageType]
    );
    id = inserted.rows[0].id;
  }

  await pool.query(
    `INSERT INTO content_translations (content_id, content_table, language_code, title, body)
     VALUES ($1, 'content_pages', 'en', $2, $3)
     ON CONFLICT (content_id, content_table, language_code)
     DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body, updated_at = now()`,
    [id, title, body]
  );
  console.log(`Seeded ${slug} (${id})`);
}

async function main() {
  await upsertPage('privacy-policy', 'legal', 'Privacy Policy', privacyBody);
  await upsertPage('terms-of-use', 'legal', 'Terms of Use', termsBody);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
