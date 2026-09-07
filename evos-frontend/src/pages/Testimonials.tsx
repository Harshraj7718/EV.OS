import { motion } from 'framer-motion';
import { PageHero } from '@/components/shared/PageHero';
import { VideoTestimonialsSection } from '@/components/sections/VideoTestimonialsSection';
import { CTASection } from '@/components/sections/CTASection';

export const Testimonials = () => {
  return (
    <div>
      <PageHero
        eyebrow="Investor Reviews"
        title="Hear From Our Investors"
        description="Real investors sharing their experience with Booklynk EV, in their own words."
      >
        <motion.div
          animate={{ rotate: [-2, 2, -2] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="inline-block rounded-2xl border border-primary/20 bg-card/60 px-8 py-4 shadow-sm backdrop-blur-sm"
        >
          <span className="animate-gradient-move bg-[length:200%_200%] bg-gradient-to-r from-evos-green via-evos-blue to-evos-cyan bg-clip-text font-display text-2xl font-bold text-transparent sm:text-3xl">
            Booklynk EV Love
          </span>
        </motion.div>
      </PageHero>

      <VideoTestimonialsSection showHeading={false} />

      <CTASection />
    </div>
  );
};

export default Testimonials;
