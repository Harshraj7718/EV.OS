import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLeadModal } from '@/context/LeadModalContext';

export const CTASection = () => {
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
          <div
            className="absolute inset-0 -z-10 bg-[length:200%_200%] opacity-40 animate-gradient-move"
            style={{
              backgroundImage:
                'linear-gradient(120deg, rgba(0,230,118,0.35), rgba(0,229,255,0.25), rgba(24,255,255,0.3))',
            }}
          />
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            Ready to Shape India&apos;s EV Economy?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/70">
            Join the founding cohort of investors, riders and business partners building the
            future of Indian mobility.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="glow-primary" onClick={() => openModal()}>
              Book a Demo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
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
