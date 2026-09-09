import { Helmet } from 'react-helmet-async';
import { FAQSection, FAQS } from '@/components/sections/FAQSection';
import { CTASection } from '@/components/sections/CTASection';
import { SEO } from '@/components/shared/SEO';

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
};

export const FAQ = () => (
  <div className="pt-20">
    <SEO
      title="Frequently Asked Questions | Booklynk EV"
      description="Answers to common questions about Booklynk EV's investment plans, monthly rental income, contract terms, fleet deployment and buyback terms."
      path="/faq"
    />
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
    </Helmet>
    <FAQSection showWatermark />
    <CTASection />
  </div>
);

export default FAQ;
