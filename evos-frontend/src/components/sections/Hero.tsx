import { motion } from 'framer-motion';
import { ArrowRight, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeroIllustration } from './HeroIllustration';

export const Hero = () => {
  return (
    <section
      id="home"
      className="relative flex min-h-screen items-center overflow-hidden pt-28 pb-20"
    >
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black_40%,transparent_100%)]" />
      <motion.div
        className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-evos-green/20 blur-[120px]"
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-evos-blue/20 blur-[120px]"
        animate={{ opacity: [0.6, 0.3, 0.6] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />

      <div className="container relative z-10 grid items-center gap-16 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
            Now raising our seed round
          </span>

          <h1 className="text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            India&apos;s First{' '}
            <span className="text-gradient">EV Investment + Fleet</span> Operating System
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Empowering investors, riders and businesses through one intelligent EV ecosystem.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button size="lg" className="glow-primary" asChild>
              <a href="#investors">
                Book a Demo
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#why-evos">
                <PlayCircle className="h-4 w-4" aria-hidden="true" />
                Explore Platform
              </a>
            </Button>
          </div>

          <dl className="mt-14 grid max-w-md grid-cols-3 gap-6 border-t border-border pt-8">
            <div>
              <dt className="sr-only">Investors</dt>
              <dd className="font-display text-2xl font-bold">1000+</dd>
              <dd className="text-xs text-muted-foreground">Investors</dd>
            </div>
            <div>
              <dt className="sr-only">Riders</dt>
              <dd className="font-display text-2xl font-bold">5000+</dd>
              <dd className="text-xs text-muted-foreground">Riders</dd>
            </div>
            <div>
              <dt className="sr-only">Partners</dt>
              <dd className="font-display text-2xl font-bold">100+</dd>
              <dd className="text-xs text-muted-foreground">Partners</dd>
            </div>
          </dl>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          className="relative"
        >
          <HeroIllustration />
        </motion.div>
      </div>
    </section>
  );
};
