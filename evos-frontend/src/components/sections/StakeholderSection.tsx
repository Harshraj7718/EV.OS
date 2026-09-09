import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeroWatermark } from '@/components/shared/HeroWatermark';
import { useLeadModal } from '@/context/LeadModalContext';
import { cn } from '@/lib/utils';
import type { LeadFormValues } from '@/lib/validation/lead.schema';

interface StakeholderFeature {
  icon: LucideIcon;
  label: string;
}

type StakeholderCta =
  { type: 'link'; href: string } | { type: 'form'; interest: LeadFormValues['interest'] };

interface StakeholderSectionProps {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  features: StakeholderFeature[];
  ctaLabel: string;
  cta: StakeholderCta;
  reverse?: boolean;
  image: string;
  imageAlt: string;
  watermarkText?: string;
}

export const StakeholderSection = ({
  id,
  eyebrow,
  title,
  description,
  features,
  ctaLabel,
  cta,
  reverse = false,
  image,
  imageAlt,
  watermarkText,
}: StakeholderSectionProps) => {
  const { openModal } = useLeadModal();

  return (
    <section id={id} className="py-24 sm:py-32">
      <div className="container">
        <div
          className={cn(
            'grid items-center gap-16 lg:grid-cols-2',
            reverse && 'lg:[&>*:first-child]:order-2'
          )}
        >
          <motion.div
            initial={{ opacity: 0, x: reverse ? 40 : -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative overflow-hidden"
          >
            {watermarkText && <HeroWatermark text={watermarkText} className="pr-0" />}
            <span className="mb-4 inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
              {eyebrow}
            </span>
            <h2 className="whitespace-pre-line text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              {title}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{description}</p>

            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {features.map((feature) => (
                <li
                  key={feature.label}
                  className="glass flex items-center gap-3 rounded-xl px-4 py-3"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-medium">{feature.label}</span>
                </li>
              ))}
            </ul>

            {cta.type === 'link' ? (
              <Button size="lg" className="mt-10" asChild>
                <Link to={cta.href}>{ctaLabel}</Link>
              </Button>
            ) : (
              <Button size="lg" className="mt-10" onClick={() => openModal(cta.interest)}>
                {ctaLabel}
              </Button>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative"
          >
            <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-primary/20 via-secondary/10 to-transparent blur-2xl" />
            <div className="overflow-hidden rounded-3xl border border-border shadow-xl">
              <img
                src={image}
                alt={imageAlt}
                className="aspect-[3/2] w-full object-cover"
                loading="lazy"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
