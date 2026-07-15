import { motion } from 'framer-motion';
import { Bike, Briefcase, TrendingUp } from 'lucide-react';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { useLeadModal } from '@/context/LeadModalContext';

const PILLARS = [
  {
    icon: TrendingUp,
    title: 'Investor',
    tagline: 'Passive Income',
    description: 'Own an EV asset, deploy it into our managed fleet, and earn predictable monthly returns.',
    interest: 'Investor' as const,
    href: '#investors',
    color: 'from-evos-green/20 to-transparent',
  },
  {
    icon: Bike,
    title: 'Rider',
    tagline: 'Affordable Mobility',
    description: 'Access maintenance-free EVs on flexible terms with insurance and a built-in job marketplace.',
    interest: 'Rider' as const,
    color: 'from-evos-blue/20 to-transparent',
  },
  {
    icon: Briefcase,
    title: 'Business',
    tagline: 'Fleet SaaS',
    description: 'Run your delivery or mobility fleet on an AI-powered operating system built for scale.',
    interest: 'Business' as const,
    color: 'from-evos-cyan/20 to-transparent',
  },
];

export const WhyEvOS = () => {
  const { openModal } = useLeadModal();

  return (
    <section id="why-evos" className="py-24 sm:py-32">
      <div className="container">
        <SectionHeading
          eyebrow="Why Booklynk EV"
          title={'One Platform.\nThree Stakeholders.\nInfinite Possibilities.'}
          description="Booklynk EV connects every layer of India's EV economy into a single intelligent operating system."
        />

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {PILLARS.map((pillar, index) => (
            <motion.button
              key={pillar.title}
              type="button"
              onClick={() =>
                pillar.href
                  ? document.querySelector(pillar.href)?.scrollIntoView({ behavior: 'smooth' })
                  : openModal(pillar.interest)
              }
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: index * 0.12, ease: 'easeOut' }}
              whileHover={{ y: -8 }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 text-left shadow-sm transition-shadow hover:shadow-xl hover:shadow-primary/10"
            >
              <div
                className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-b ${pillar.color} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
              />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                <pillar.icon className="h-7 w-7" aria-hidden="true" />
              </div>
              <h3 className="relative mt-6 font-display text-2xl font-bold">{pillar.title}</h3>
              <p className="relative mt-1 text-sm font-semibold text-primary">{pillar.tagline}</p>
              <p className="relative mt-4 text-sm leading-relaxed text-muted-foreground">
                {pillar.description}
              </p>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
};
