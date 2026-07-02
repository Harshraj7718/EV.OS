import { motion } from 'framer-motion';
import { ArrowRight, Bike, Briefcase, Cpu, TrendingUp, Zap } from 'lucide-react';
import { SectionHeading } from '@/components/shared/SectionHeading';

const FLOW_NODES = [
  { icon: TrendingUp, label: 'Investor' },
  { icon: Zap, label: 'EV.OS' },
  { icon: Cpu, label: 'Fleet OS' },
  { icon: Bike, label: 'Riders' },
  { icon: Briefcase, label: 'Businesses' },
  { icon: TrendingUp, label: 'Revenue Ecosystem' },
];

export const PlatformFlow = () => {
  return (
    <section className="border-y border-border bg-muted/30 py-24 sm:py-32">
      <div className="container">
        <SectionHeading
          eyebrow="How It Works"
          title="One Continuous Value Loop"
          description="Capital flows in, mobility flows out, and revenue circulates back through every stakeholder in the ecosystem."
        />

        <div className="mt-16 flex flex-col items-center gap-2 lg:flex-row lg:justify-between lg:gap-0">
          {FLOW_NODES.map((node, index) => (
            <div key={node.label} className="flex items-center gap-2 lg:flex-1 lg:last:flex-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.4, delay: index * 0.12, ease: 'easeOut' }}
                className="flex flex-col items-center gap-3"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-card text-primary shadow-lg shadow-primary/10">
                  <node.icon className="h-7 w-7" aria-hidden="true" />
                </div>
                <span className="whitespace-nowrap text-xs font-semibold">{node.label}</span>
              </motion.div>

              {index < FLOW_NODES.length - 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.4, delay: index * 0.12 + 0.1 }}
                  className="hidden flex-1 items-center px-2 lg:flex"
                >
                  <div className="relative h-px w-full overflow-hidden bg-border">
                    <motion.div
                      className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent"
                      animate={{ x: ['-100%', '300%'] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', delay: index * 0.3 }}
                    />
                  </div>
                  <ArrowRight className="ml-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
