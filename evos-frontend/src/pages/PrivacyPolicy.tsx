import { LegalPageLayout, LegalSection } from '@/components/shared/LegalPageLayout';

export const PrivacyPolicy = () => {
  return (
    <LegalPageLayout eyebrow="Legal" title="Privacy Policy" lastUpdated="21 July 2026">
      <LegalSection title="1. Introduction">
        <p>
          Booklynk EV ("Booklynk EV", "we", "us", or "our") operates booklynkev.com and the
          associated services described on this website (together, the "Service"). This Privacy
          Policy explains what personal information we collect, how we use it, and the choices you
          have.
        </p>
        <p>
          By using the Service — including submitting the lead capture form, booking a demo, or
          making an investment payment — you agree to the collection and use of information in
          accordance with this policy.
        </p>
      </LegalSection>

      <LegalSection title="2. Information We Collect">
        <p>We collect information you provide directly to us, including:</p>
        <ul className="ml-5 list-disc space-y-2">
          <li>
            <span className="font-medium text-foreground">Contact and lead information</span> —
            name, email address, phone number, city, your interest (Investor, Rider, Business, or
            Other), budget, and any message you submit through our lead capture form.
          </li>
          <li>
            <span className="font-medium text-foreground">Investment and payment information</span>{' '}
            — name, email, phone number, the investment plan selected, and the investment amount,
            collected when you initiate a payment. We do <strong>not</strong> collect or store your
            card, UPI, or bank account details — these are entered directly into Razorpay's secure
            checkout and never pass through our servers.
          </li>
          <li>
            <span className="font-medium text-foreground">Usage preferences</span> — your
            light/dark theme preference, stored locally in your browser (see Section 7, Cookies and
            Local Storage).
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. How We Use Your Information">
        <p>We use the information we collect to:</p>
        <ul className="ml-5 list-disc space-y-2">
          <li>Respond to your inquiries and follow up on demo requests;</li>
          <li>Process and verify investment payments, and create your investor record;</li>
          <li>Communicate with you about your investment, rider, or business partnership;</li>
          <li>Improve and maintain the Service; and</li>
          <li>Comply with applicable legal and regulatory obligations.</li>
        </ul>
        <p>
          We do not sell your personal information to third parties, and we do not use your data
          for purposes unrelated to operating and improving the Service.
        </p>
      </LegalSection>

      <LegalSection title="4. Third-Party Service Providers">
        <p>We share limited information with the following service providers, solely to operate the Service:</p>
        <ul className="ml-5 list-disc space-y-2">
          <li>
            <span className="font-medium text-foreground">Razorpay</span> — processes all payments
            on our behalf. Razorpay receives the information necessary to complete your
            transaction and is subject to its own privacy policy.
          </li>
          <li>
            <span className="font-medium text-foreground">MongoDB Atlas</span> — hosts our
            database, where your lead and payment records are stored securely.
          </li>
          <li>
            <span className="font-medium text-foreground">Hosting providers</span> (Vercel and
            Render) — host our frontend and backend infrastructure.
          </li>
        </ul>
        <p>
          These providers are contractually and technically restricted from using your information
          for any purpose other than providing services to us.
        </p>
      </LegalSection>

      <LegalSection title="5. Data Storage and Security">
        <p>
          Your information is stored on secured, access-controlled infrastructure. All data in
          transit between your browser and our servers is encrypted (HTTPS/TLS). While we take
          reasonable technical and organizational measures to protect your information, no method
          of transmission or storage is 100% secure, and we cannot guarantee absolute security.
        </p>
      </LegalSection>

      <LegalSection title="6. Data Retention">
        <p>
          We retain your personal information for as long as necessary to fulfil the purposes
          described in this policy, comply with legal obligations, resolve disputes, and enforce
          our agreements. You may request deletion of your data at any time (see Section 8).
        </p>
      </LegalSection>

      <LegalSection title="7. Cookies and Local Storage">
        <p>
          We use your browser's local storage to remember your light/dark theme preference. This
          is not a tracking cookie and is not shared with any third party. We do not currently use
          third-party advertising or analytics cookies.
        </p>
      </LegalSection>

      <LegalSection title="8. Your Rights">
        <p>You may contact us at any time to:</p>
        <ul className="ml-5 list-disc space-y-2">
          <li>Request access to the personal information we hold about you;</li>
          <li>Request correction of inaccurate information;</li>
          <li>Request deletion of your information, subject to legal or regulatory retention requirements; and</li>
          <li>Withdraw consent for future communications.</li>
        </ul>
        <p>To exercise any of these rights, contact us using the details in Section 11.</p>
      </LegalSection>

      <LegalSection title="9. Children's Privacy">
        <p>
          The Service is not directed to individuals under the age of 18. We do not knowingly
          collect personal information from children. If you believe a child has provided us with
          personal information, please contact us and we will take steps to delete it.
        </p>
      </LegalSection>

      <LegalSection title="10. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. We will post any changes on this
          page and update the "Last updated" date above. Continued use of the Service after changes
          become effective constitutes acceptance of the revised policy.
        </p>
      </LegalSection>

      <LegalSection title="11. Contact Us">
        <p>
          If you have questions about this Privacy Policy or how your information is handled,
          contact us at{' '}
          <a href="mailto:privacy@booklynkev.com" className="text-primary hover:underline">
            privacy@booklynkev.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
};

export default PrivacyPolicy;
