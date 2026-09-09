import type { ReactNode } from 'react';
import { HeroWatermark } from '@/components/shared/HeroWatermark';

interface LegalPageLayoutProps {
  eyebrow: string;
  title: string;
  lastUpdated: string;
  watermark?: string;
  children: ReactNode;
}

export const LegalPageLayout = ({
  eyebrow,
  title,
  lastUpdated,
  watermark,
  children,
}: LegalPageLayoutProps) => (
  <div className="pb-24 pt-32 sm:pt-36">
    <div className="container max-w-3xl">
      <div className="relative min-h-[280px] overflow-hidden sm:min-h-[380px]">
        {watermark && <HeroWatermark text={watermark} />}
        <span className="relative text-xs font-semibold uppercase tracking-widest text-primary">
          {eyebrow}
        </span>
        <h1 className="relative mt-3 font-display text-4xl font-bold leading-tight sm:text-5xl">
          {title}
        </h1>
        <p className="relative mt-4 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
      </div>

      <div className="mt-12 space-y-10">{children}</div>
    </div>
  </div>
);

interface LegalSectionProps {
  title: string;
  children: ReactNode;
}

export const LegalSection = ({ title, children }: LegalSectionProps) => (
  <section>
    <h2 className="font-display text-xl font-bold sm:text-2xl">{title}</h2>
    <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
      {children}
    </div>
  </section>
);
