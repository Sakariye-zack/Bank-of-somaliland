// No SMTP provider is configured in this environment, so this logs the
// email to the server console instead of a black hole — the link/code is
// still fully functional for testing, and swapping in a real provider
// (e.g. nodemailer + SMTP env vars) later only requires changing this file.
export async function sendMail(to: string, subject: string, body: string): Promise<void> {
  console.log(`\n--- EMAIL (dev mode, not actually sent) ---\nTo: ${to}\nSubject: ${subject}\n\n${body}\n--- END EMAIL ---\n`);
}
