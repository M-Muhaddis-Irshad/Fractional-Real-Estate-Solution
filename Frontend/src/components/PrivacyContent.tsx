/**
 * Shared Privacy Policy content — single source of truth consumed by both the
 * registration-form modal (PrivacyModal) and the standalone /privacy page.
 *
 * ⚠️ PLACEHOLDER / STARTER CONTENT — this project is a DEMO platform and is
 * NOT yet legally live (regulatory registration is pending). This text reflects
 * the data practices actually implemented in the codebase today, but it MUST be
 * reviewed by a legal professional before go-live. It must also be updated once
 * real regulatory status is finalized and once the actual third-party
 * integrations used in production are confirmed (e.g. Coinbase Commerce is
 * currently demo/simulated unless COINBASE_COMMERCE_API_KEY is set — adjust
 * any references accordingly).
 */
export default function PrivacyContent({
  email,
  phone,
}: {
  email: string;
  phone?: string;
}) {
  return (
    <div className="termsBody">
      <section>
        <h4>1. Information we collect</h4>
        <p>We collect the following categories of information when you use the Service:</p>
        <ul>
          <li>
            <strong>Account information</strong> — your name and email address when you register.
            If you sign in with Google, we also receive your Google profile photo and Google
            account identifier.
          </li>
          <li>
            <strong>Investment activity</strong> — share purchase requests, approvals, holdings,
            transaction records and portfolio data you create on the platform.
          </li>
          <li>
            <strong>Usage data</strong> — basic technical information such as pages visited and
            interactions, used to operate and improve the Service.
          </li>
        </ul>
      </section>

      <section>
        <h4>2. How we use your information</h4>
        <ul>
          <li>Creating and managing your account.</li>
          <li>Processing and tracking your share purchase requests through the approval workflow.</li>
          <li>
            Sending you transactional emails and notifications (e.g. password resets, account
            updates) through our email provider.
          </li>
          <li>Improving the Service, its features and its security.</li>
        </ul>
      </section>

      <section>
        <h4>3. Third-party services</h4>
        <p>We use the following third-party services to operate the platform:</p>
        <ul>
          <li>
            <strong>Google (OAuth)</strong> — used when you choose to sign in or sign up with
            Google. We receive your name, email and profile photo from Google.
          </li>
          <li>
            <strong>Cloudinary</strong> — used to store and serve property and profile images.
          </li>
          <li>
            <strong>Resend</strong> — used to send transactional email (such as password reset
            links).
          </li>
          <li>
            <strong>Coinbase Commerce</strong> — used for optional crypto payments. On this demo
            platform payments are simulated unless a live Coinbase Commerce account is configured.
          </li>
        </ul>
      </section>

      <section>
        <h4>4. Data storage &amp; security</h4>
        <p>
          Your data is stored in a MongoDB database hosted by a third-party cloud provider.
          Passwords are hashed using bcrypt before storage and are never stored in plain text.
          One-time reset tokens are stored as SHA-256 hashes and are single-use. Authentication
          uses JSON Web Tokens (JWTs) issued by our server. While we apply reasonable security
          measures, no method of transmission or storage is completely secure.
        </p>
      </section>

      <section>
        <h4>5. Your rights</h4>
        <p>
          You may request access to, correction of, or deletion of the personal data we hold
          about you by contacting us (see Section 9). We will respond to reasonable requests in
          accordance with applicable law.
        </p>
      </section>

      <section>
        <h4>6. Cookies &amp; local storage</h4>
        <p>
          We store your authentication token in your browser&apos;s local storage so you stay signed
          in between visits, and we store a theme preference locally. We do not use third-party
          advertising cookies.
        </p>
      </section>

      <section>
        <h4>7. Children&apos;s privacy</h4>
        <p>
          The Service is not intended for users under 18 years of age, and we do not knowingly
          collect personal information from children. If you believe a child has provided us
          with personal information, please contact us so we can delete it.
        </p>
      </section>

      <section>
        <h4>8. Changes to this policy</h4>
        <p>
          We may update this Privacy Policy from time to time. Continued use of the Service
          after changes take effect constitutes acceptance of the updated policy.
        </p>
      </section>

      <section>
        <h4>9. Contact</h4>
        <p>
          Questions about this policy can be sent to <a href={`mailto:${email}`}>{email}</a>
          {phone && (
            <>
              {" "}
              or by phone at <a href={`tel:${phone.replace(/[^+\d]/g, "")}`}>{phone}</a>
            </>
          )}
          .
        </p>
      </section>
    </div>
  );
}
