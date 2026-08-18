"use client";

import Modal from "@/components/Modal";
import { useApp } from "@/context/AppContext";

/**
 * Terms & Conditions — shown in an in-page modal from the registration form.
 *
 * ⚠️ PLACEHOLDER / STARTER CONTENT — this project is a DEMO platform and is
 * NOT yet legally live (regulatory registration is pending). This text is
 * written to describe the platform as it actually exists today (fractional
 * share requests, team-approval workflow, simulated transactions, "no real
 * transactions occur"), but it MUST be reviewed by a legal professional and
 * updated with the finalized regulatory status before the platform handles any
 * real transactions. Do not treat it as final legal language.
 */
export default function TermsModal({ onClose }: { onClose: () => void }) {
  const { platform } = useApp();
  const email = platform.supportEmail || "support@flux.app";
  const phone = platform.supportPhone;

  return (
    <Modal title="Terms & Conditions" onClose={onClose} wide>
      <div className="termsBody">
        <section>
          <h4>1. Acceptance of terms</h4>
          <p>
            By creating an account and using the Flux platform (“the Service”), you agree to
            these Terms &amp; Conditions and our Privacy Policy. If you do not agree, please do
            not create an account or use the Service.
          </p>
        </section>

        <section>
          <h4>2. Description of the Service</h4>
          <p>
            Flux is a fractional real-estate investment platform that lets users request shares
            in professionally vetted income-producing properties. The Service includes browsing
            properties, submitting share purchase requests, tracking funding progress, and
            viewing projected returns.
          </p>
          <p>
            <strong>Demo environment.</strong> Flux is currently a demonstration platform. All
            purchases, funding and distributions are <strong>simulated</strong> — no real money
            is collected, no real securities are issued, and no real transactions occur. Share
            requests are reviewed and approved by our team through the workflow shown in the app.
          </p>
        </section>

        <section>
          <h4>3. User responsibilities</h4>
          <ul>
            <li>Provide accurate, current information when creating and using your account.</li>
            <li>Keep your login credentials secure and notify us of any suspected unauthorized use.</li>
            <li>Use the Service only for lawful purposes and in accordance with these terms.</li>
            <li>Not attempt to disrupt, reverse-engineer, or misuse the platform or its data.</li>
          </ul>
        </section>

        <section>
          <h4>4. No warranty &amp; no real financial transactions</h4>
          <p>
            The Service is provided “as is” and “as available,” without warranties of any kind,
            express or implied. Nothing on Flux constitutes financial, investment, legal or tax
            advice. Projected yields, funding percentages and other figures are illustrative
            only.
          </p>
          <p>
            <strong>No real transactions occur.</strong> The platform does not currently handle
            real payments, issue real securities, or execute real real-estate transactions.
            Regulatory registration is pending; until it is finalized, no investment made
            through the Service is real or legally binding.
          </p>
        </section>

        <section>
          <h4>5. Account termination</h4>
          <p>
            We may suspend or terminate your account if you violate these terms or misuse the
            Service. You may close your account at any time by contacting support. Upon
            termination, your access to the Service ends, subject to applicable law.
          </p>
        </section>

        <section>
          <h4>6. Changes to these terms</h4>
          <p>
            We may update these Terms &amp; Conditions from time to time. Continued use of the
            Service after changes take effect constitutes acceptance of the updated terms.
          </p>
        </section>

        <section>
          <h4>7. Contact</h4>
          <p>
            Questions about these terms can be sent to <a href={`mailto:${email}`}>{email}</a>
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
    </Modal>
  );
}
