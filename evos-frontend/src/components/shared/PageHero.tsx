import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface PageHeroProps {
  eyebrow: string;
  title: string;
  description?: string;
  children?: ReactNode;
}

export const PageHero = ({ eyebrow, title, description, children }: PageHeroProps) => (
  <section className="pb-16 pt-32 sm:pt-40">
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="mx-auto max-w-3xl text-center"
      >
        <span className="mb-4 inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
          {eyebrow}
        </span>
        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        {description && (
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{description}</p>
        )}
        {children && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">{children}</div>
        )}
      </motion.div>
    </div>
  </section>
);
