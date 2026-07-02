import { motion } from 'framer-motion';
import {
  BatteryCharging,
  Boxes,
  Coins,
  LineChart,
  Plug,
  ShieldCheck,
  Store,
  Wallet,
} from 'lucide-react';
import { SectionHeading } from '@/components/shared/SectionHeading';

const FEATURES = [
  { icon: Boxes, title: 'Fleet SaaS', description: 'End-to-end fleet operations software for EV businesses of any size.' },
  { icon: LineChart, title: 'AI Analytics', description: 'Predictive insights on utilization, uptime, and revenue per vehicle.' },
  { icon: BatteryCharging, title: 'Battery Intelligence', description: 'Real-time battery health monitoring and degradation forecasting.' },
  { icon: ShieldCheck, title: 'Insurance', description: 'Integrated coverage for vehicles, riders, and fleet operators.' },
  { icon: Wallet, title: 'Financing', description: 'Flexible investment and leasing options backed by trusted partners.' },
  { icon: Plug, title: 'Charging Network', description: 'Growing network of partner charging stations across cities.' },
  { icon: Coins, title: 'Carbon Credits', description: 'Turn verified emissions savings into an additional revenue stream.' },
  { icon: Store, title: 'Marketplace', description: 'Connect riders, businesses and service providers in one place.' },
];

export const FeaturesSection = () => {
  return (
    <section className="border-y border-border bg-muted/30 py-24 sm:py-32">
      <div className="container">
        <SectionHeading
          eyebrow="Platform"
          title="Everything the EV Economy Needs"
          description="A modular set of enterprise-grade capabilities powering every layer of the ecosystem."
        />

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.4, delay: (index % 4) * 0.08, ease: 'easeOut' }}
              whileHover={{ y: -6 }}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-lg hover:shadow-primary/10"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <feature.icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
