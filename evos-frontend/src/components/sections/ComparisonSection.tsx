import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { SectionHeading } from '@/components/shared/SectionHeading';

const ROWS = [
  { traditional: 'Single Income', evos: 'Multiple Revenue Streams' },
  { traditional: 'Scooter Only', evos: 'AI Fleet Operating System' },
  { traditional: 'Manual Operations', evos: 'Automated Marketplace' },
  { traditional: 'Limited Scale', evos: 'Nationwide Infrastructure Platform' },
];

export const ComparisonSection = () => {
  return (
    <section className="py-24 sm:py-32">
      <div className="container">
        <SectionHeading
          eyebrow="The Difference"
          title="Why Choose Booklynk EV"
          description="Legacy EV rental models cap your upside. Booklynk EV is built as an infrastructure platform from day one."
        />

        <div className="mx-auto mt-16 max-w-3xl overflow-hidden rounded-2xl border border-border shadow-sm">
          <div className="grid grid-cols-2 divide-x divide-border">
            <div className="bg-muted/50 px-6 py-5">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Traditional
              </h3>
            </div>
            <div className="bg-primary/10 px-6 py-5">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-primary">
                Booklynk EV
              </h3>
            </div>
          </div>

          {ROWS.map((row, index) => (
            <motion.div
              key={row.traditional}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="grid grid-cols-2 divide-x divide-border border-t border-border"
            >
              <div className="flex items-center gap-3 px-6 py-5 text-sm text-muted-foreground">
                <X className="h-4 w-4 shrink-0 text-destructive/70" aria-hidden="true" />
                {row.traditional}
              </div>
              <div className="flex items-center gap-3 bg-primary/5 px-6 py-5 text-sm font-medium">
                <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                {row.evos}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
