import { motion } from 'framer-motion';
import { FileSignature, Settings2, ShoppingCart, Wallet } from 'lucide-react';
import { SectionHeading } from '@/components/shared/SectionHeading';

const STEPS = [
  {
    icon: ShoppingCart,
    title: 'Choose Your EV & Invest',
    description:
      'Pick an electric two-wheeler from our vetted OEM partners. Our team walks you through the purchase and paperwork, so getting started takes minutes, not weeks.',
  },
  {
    icon: FileSignature,
    title: 'Enroll in the Rental Fleet',
    description:
      'Sign a one-time agreement to enroll your EV in our managed fleet. We handle the legal contracts and deploy your vehicle with our trusted delivery and mobility partners.',
  },
  {
    icon: Settings2,
    title: 'We Manage Everything',
    description:
      "Your EV goes into active service with our delivery partners. We handle maintenance and servicing, real-time vehicle tracking, and all partner contracts and payments — so you don't have to.",
  },
  {
    icon: Wallet,
    title: 'Earn Monthly Rental Income',
    description:
      'Based on your rental agreement, you receive a monthly rental payout directly to your bank account. Your EV becomes a working asset that earns for you, month after month.',
  },
];

export const InvestmentStepperSection = () => {
  return (
    <section className="py-24 sm:py-32">
      <div className="container">
        <SectionHeading
          eyebrow="How It Works"
          title="How Booklynk EV Rental Investment Works"
          description="From picking your EV to receiving your first payout — here's exactly what happens at every stage."
        />

        <div className="relative mx-auto mt-16 max-w-3xl">
          <div className="absolute left-6 top-0 h-full w-px bg-border sm:left-7" />

          <div className="space-y-12">
            {STEPS.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, delay: index * 0.12, ease: 'easeOut' }}
                className="relative flex gap-6"
              >
                <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/40 bg-card text-primary shadow-lg shadow-primary/10 sm:h-14 sm:w-14">
                  <step.icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                </div>
                <div className="flex-1 pb-2 pt-1">
                  <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                    Step {index + 1}
                  </span>
                  <h3 className="mt-1 font-display text-xl font-bold sm:text-2xl">{step.title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
