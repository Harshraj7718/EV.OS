import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { SectionHeading } from '@/components/shared/SectionHeading';

const FAQS = [
  {
    question: 'What is the Booklynk EV business model?',
    answer:
      'Booklynk EV operates an EV fleet management and leasing model. The customer owns the EV, while Booklynk manages its commercial deployment and operations. The vehicle is deployed for commercial use, and the owner receives monthly rental income as per the agreed terms.',
  },
  {
    question: 'What is the minimum investment amount?',
    answer:
      'The current plan starts with 1 EV at ₹70,000. The total investment depends on the number of EVs selected.',
  },
  {
    question: 'What is the price of one EV?',
    answer: 'The current price is ₹70,000 per EV.',
  },
  {
    question: 'How much monthly rental will I receive per EV?',
    answer:
      'The current rental is ₹4,500 per EV per month. For example, 2 EVs would provide ₹9,000 per month, as per the agreed contract terms.',
  },
  {
    question: 'What is the contract period?',
    answer: 'The standard contract period is 4 years (48 months).',
  },
  {
    question: 'What is the total rental income over 4 years?',
    answer:
      'At ₹4,500 per EV per month, one EV would generate ₹2,16,000 in rental over 48 months. For 2 EVs, the total rental would be ₹4,32,000, excluding any applicable buyback/salvage value.',
  },
  {
    question: 'What is the expected ROI?',
    answer:
      'The return depends on the investment amount, rental income and applicable end-of-contract buyback/salvage terms. The rental income and buyback value should be considered according to the agreed plan and formal documentation.',
  },
  {
    question: 'Is the monthly rental guaranteed?',
    answer:
      'The rental terms and payment obligations are clearly mentioned in the formal agreement. Investors are advised to review the agreement and all applicable terms before proceeding.',
  },
  {
    question: 'How does Booklynk generate the rental income?',
    answer:
      "The EVs are commercially deployed through Booklynk's fleet operations and delivery/logistics ecosystem. The revenue generated through these commercial operations supports the rental structure paid to the EV owner.",
  },
  {
    question: 'Where will my EV be deployed?',
    answer: "Currently, Booklynk's EVs are primarily deployed in Noida and Gurgaon.",
  },
  {
    question: 'Can my EV be deployed in my own city?',
    answer:
      "Deployment depends on Booklynk's operational network and demand in that location. Currently, the primary deployment locations are Noida and Gurgaon, with scope for expansion to other cities based on operational feasibility and demand.",
  },
  {
    question: 'Who will manage the EV and its operations?',
    answer:
      'Booklynk manages the commercial deployment and operational aspects of the EV, including fleet coordination and related operations.',
  },
  {
    question: 'Is the EV RTO registered?',
    answer:
      'No. The EVs provided under this plan are low-speed electric scooters, which do not require RTO registration under the applicable regulations for this vehicle category.',
  },
  {
    question: 'What EV model and specifications will I get?',
    answer:
      'The specific EV model, battery capacity, range and other technical specifications will be shared with the investor before proceeding and will be mentioned in the relevant documentation.',
  },
  {
    question: "What is the EV's kilometre range?",
    answer:
      'The range depends on the specific EV model and battery configuration. The exact range and technical specifications will be shared before investment.',
  },
  {
    question: 'Can I physically inspect the EV before investing?',
    answer:
      'Yes. Physical inspection can be coordinated at an available deployment location, primarily in Noida/Gurgaon, subject to operational availability.',
  },
  {
    question: 'Is insurance included throughout the contract?',
    answer:
      "Insurance coverage is provided as applicable during the contract period, subject to the insurance policy's terms, validity and conditions.",
  },
  {
    question: 'What happens in case of theft or an accident?',
    answer:
      "In case of theft or an accident, the matter is handled according to the applicable insurance policy and claim process. Coverage and claim settlement are subject to the insurer's terms and approval.",
  },
  {
    question: 'What is the buyback/salvage value after 4 years?',
    answer:
      'The applicable buyback/salvage value will be as per the agreed terms mentioned in the formal agreement and will be communicated before proceeding.',
  },
  {
    question: 'What documents will I receive?',
    answer:
      'The investor will receive the relevant documentation, including the formal agreement, invoice, vehicle details, insurance details, rental terms and applicable buyback/salvage terms.',
  },
  {
    question: 'What documents are required from the investor?',
    answer:
      'The required KYC and other documentation will be communicated during the onboarding process, depending on the agreement and applicable requirements.',
  },
  {
    question: 'Is the investment/rental arrangement provided in a formal written agreement?',
    answer:
      'Yes. The investment amount, rental terms, contract period and other applicable conditions are documented in the formal agreement before proceeding.',
  },
  {
    question: 'What happens if the rental payment is delayed or not received?',
    answer:
      'The applicable payment terms, obligations and remedies are governed by the formal agreement. Any payment-related issue will be addressed according to the agreed terms.',
  },
  {
    question: 'How can I verify the company and conduct due diligence?',
    answer:
      'Investors are welcome to conduct independent due diligence. Booklynk can provide relevant company, vehicle, agreement, invoice, insurance and other supporting documents for verification before proceeding.',
  },
  {
    question:
      'What is different about Booklynk compared with companies like GBG EV, Ridoji, GIGS EV and Neev Mobility?',
    answer:
      'The overall EV fleet investment/leasing concept is similar to models offered by several companies in the market. The key differences should be evaluated based on investment amount, monthly rental, contract terms, vehicle ownership, insurance, operational support, deployment, documentation and buyback terms. Investors should compare the complete terms rather than only the advertised rental amount.',
  },
];

export const FAQSection = () => {
  return (
    <section id="faq" className="py-24 sm:py-32">
      <div className="container">
        <SectionHeading eyebrow="FAQ" title="Frequently Asked Questions" />

        <div className="mx-auto mt-14 max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq, index) => (
              <AccordionItem key={faq.question} value={`item-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
