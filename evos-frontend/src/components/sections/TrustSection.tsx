import { motion } from 'framer-motion';
import { Building2, TrendingUp, Users, Zap } from 'lucide-react';
import { AnimatedCounter } from '@/components/shared/AnimatedCounter';

const STATS = [
  { icon: TrendingUp, value: 1000, suffix: '+', label: 'Interested Investors' },
  { icon: Users, value: 5000, suffix: '+', label: 'Future Riders' },
  { icon: Building2, value: 100, suffix: '+', label: 'Business Partners' },
  { icon: Zap, value: 12, suffix: '+', label: 'Revenue Streams' },
];

export const TrustSection = () => {
  return (
    <section className="relative border-y border-border bg-muted/30 py-16">
      <div className="container">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
              className="glass rounded-2xl p-6 text-center shadow-sm dark:shadow-none"
            >
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <stat.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="font-display text-3xl font-bold sm:text-4xl">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
