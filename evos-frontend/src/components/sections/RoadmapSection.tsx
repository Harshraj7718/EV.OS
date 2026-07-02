import { motion } from 'framer-motion';
import { Bike, PackageSearch, Rocket, Truck } from 'lucide-react';
import { SectionHeading } from '@/components/shared/SectionHeading';

const MILESTONES = [
  { phase: 'Today', title: 'EV Scooters', icon: Bike },
  { phase: 'Next', title: 'EV Bikes', icon: Bike },
  { phase: 'Then', title: 'Cargo Vehicles', icon: Truck },
  { phase: 'Future', title: 'Auto Rickshaws & Mini Delivery Vans', icon: PackageSearch },
  { phase: 'Vision', title: 'Nationwide Expansion', icon: Rocket },
];

export const RoadmapSection = () => {
  return (
    <section className="py-24 sm:py-32">
      <div className="container">
        <SectionHeading
          eyebrow="Roadmap"
          title="Built for What's Next"
          description="EV.OS starts with scooters and scales into every category of India's electric mobility economy."
        />

        <div className="relative mt-20">
          <div className="absolute left-6 top-0 h-full w-px bg-border lg:left-1/2 lg:-translate-x-1/2" />

          <div className="space-y-12 lg:space-y-16">
            {MILESTONES.map((milestone, index) => (
              <motion.div
                key={milestone.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative flex items-start gap-6 pl-16 lg:w-1/2 lg:pl-0 lg:pr-16 ${
                  index % 2 === 1
                    ? 'lg:ml-auto lg:flex-row lg:pl-16 lg:pr-0 lg:text-left'
                    : 'lg:text-right lg:flex-row-reverse'
                }`}
              >
                <div className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/40 bg-card text-primary shadow-lg shadow-primary/10 lg:static lg:shrink-0">
                  <milestone.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                    {milestone.phase}
                  </span>
                  <h3 className="mt-1 font-display text-xl font-bold sm:text-2xl">
                    {milestone.title}
                  </h3>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
