import { Resend } from "resend";

// Lazy read — dotenv.config() runs in src/index.js AFTER the import graph is
// evaluated, so a module-scope read of MAIL_FROM would capture undefined and
// fall back to the default even when the env var is set.
const getFrom = () => process.env.MAIL_FROM || "Flux <onboarding@resend.dev>";

// Lazy client — only created when a key is present, so the app still boots
// (and logs reset links to the console) in environments without mail setup.
let client = null;
export function getMailClient() {
  if (client) return client;
  if (!process.env.RESEND_API_KEY) return null;
  client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

/**
 * Send a transactional email.
 * Without RESEND_API_KEY this logs the message to the server console instead
 * of failing, so the forgot-password flow stays testable in development.
 */
export async function sendMail({ to, subject, text, html }) {
  const resend = getMailClient();
  if (!resend) {
    console.log(`[mail] RESEND_API_KEY not set — reset email NOT delivered.`);
    console.log(`[mail] to: ${to}`);
    console.log(`[mail] subject: ${subject}`);
    if (text) console.log(`[mail] body:\n${text}`);
    return { dev: true };
  }

  const { data, error } = await resend.emails.send({
    from: getFrom(),
    to,
    subject,
    text,
    html,
  });
  if (error) {
    throw new Error(error.message);
  }
  return data;
}
