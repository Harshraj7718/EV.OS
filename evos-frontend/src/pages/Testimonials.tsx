import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import { PageHero } from '@/components/shared/PageHero';
import { CTASection } from '@/components/sections/CTASection';

interface Testimonial {
  quote: string;
  attribution: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'Booklynk EV made it simple to turn an EV purchase into a hands-off monthly income stream.',
    attribution: 'Sample Investor testimonial (replace with a real quote)',
  },
  {
    quote:
      'Having the rental terms and payment schedule spelled out in the formal agreement made the decision straightforward.',
    attribution: 'Sample Investor testimonial (replace with a real quote)',
  },
  {
    quote:
      'The vehicle was maintenance-free and the dashboard made it easy to track daily earnings.',
    attribution: 'Sample Rider testimonial (replace with a real quote)',
  },
  {
    quote: 'Onboarding was quick, and the job marketplace kept the rides steady week to week.',
    attribution: 'Sample Rider testimonial (replace with a real quote)',
  },
  {
    quote:
      'Running fleet monitoring, battery analytics and maintenance alerts from one dashboard cut a lot of manual coordination.',
    attribution: 'Sample Business testimonial (replace with a real quote)',
  },
  {
    quote: 'GPS tracking and attendance in one place made scaling our delivery fleet far easier.',
    attribution: 'Sample Business testimonial (replace with a real quote)',
  },
];

export const Testimonials = () => {
  return (
    <div>
      <PageHero
        eyebrow="Testimonials"
        title="What Our Community Says"
        description="A preview of the kind of feedback we hear from investors, riders and business partners."
      />

      <section className="pb-24 sm:pb-32">
        <div className="container">
          <div className="mx-auto max-w-3xl rounded-xl border border-dashed border-primary/40 bg-primary/5 px-5 py-3 text-center text-sm text-muted-foreground">
            The quotes below are placeholder sample content, not real customer reviews — they'll be
            replaced with real testimonials as they come in.
          </div>

          <div className="mx-auto mt-10 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((testimonial, index) => (
              <motion.div
                key={testimonial.attribution + index}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: (index % 3) * 0.08, ease: 'easeOut' }}
                className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <Quote className="h-6 w-6 text-primary/40" aria-hidden="true" />
                <p className="mt-4 flex-1 text-sm leading-relaxed text-foreground">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <p className="mt-5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {testimonial.attribution}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <CTASection />
    </div>
  );
};

export default Testimonials;
