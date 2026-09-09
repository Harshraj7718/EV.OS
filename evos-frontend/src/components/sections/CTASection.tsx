import { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLeadModal } from '@/context/LeadModalContext';

const DotGridBackground = lazy(() =>
  import('@/components/ui/dot-grid-background').then((m) => ({ default: m.DotGridBackground }))
);

interface CTASectionProps {
  primaryCtaLabel?: string;
}

export const CTASection = ({ primaryCtaLabel = 'Book a Demo' }: CTASectionProps) => {
  const { openModal } = useLeadModal();

  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-evos-black via-evos-surface to-evos-black px-8 py-20 text-center sm:px-16"
        >
          <Suspense fallback={null}>
            <DotGridBackground className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,black_40%,transparent_100%)]" />
          </Suspense>
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            Ready to Shape India&apos;s EV Economy?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/70">
            Join the founding cohort of investors, riders and business partners building the future
            of Indian mobility.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="glow-primary" asChild>
              <Link to="/investors">
                {primaryCtaLabel}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 bg-white/5 text-white hover:bg-white/10"
              onClick={() => openModal('Other')}
            >
              Become an Early Adopter
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
