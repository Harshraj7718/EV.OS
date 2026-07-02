import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SectionHeading } from '@/components/shared/SectionHeading';

const FAQS = [
  {
    question: 'How does EV investment work?',
    answer:
      'You purchase an EV asset through EV.OS, and we deploy it into our professionally managed fleet. The vehicle generates revenue through rider subscriptions and business partnerships, and you receive a share as monthly passive income — with full visibility through your investor dashboard.',
  },
  {
    question: 'How do riders join?',
    answer:
      'Riders can apply directly through the platform. After a quick verification process, you get access to a maintenance-free EV, insurance coverage, and a personal dashboard to track your daily earnings and performance.',
  },
  {
    question: 'How much can investors earn?',
    answer:
      'Returns vary by vehicle type, city, and utilization, but our fleet model is designed to deliver consistent monthly passive income with a buyback assurance option. Our team will walk you through detailed projections during your demo.',
  },
  {
    question: 'Can businesses onboard fleets?',
    answer:
      'Yes. Businesses can onboard existing fleets or lease new EVs through EV.OS, and manage everything — GPS tracking, battery analytics, attendance, and maintenance — from a single dashboard.',
  },
  {
    question: 'When are we launching?',
    answer:
      'EV.OS is currently in its seed-stage rollout across key Indian cities, starting with EV scooters. Early adopters get priority onboarding as we expand into bikes, cargo vehicles, and beyond.',
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
