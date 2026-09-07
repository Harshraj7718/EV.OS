import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BatteryCharging,
  Coins,
  Gauge,
  PackageCheck,
  RefreshCw,
  Scale,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { StakeholderSection } from './StakeholderSection';
import { Button } from '@/components/ui/button';
import investImage from '@/assets/invest.webp';

const FEATURES = [
  { icon: Wallet, label: 'Asset Ownership' },
  { icon: Coins, label: 'Passive Income' },
  { icon: ShieldCheck, label: 'Fleet Managed' },
  { icon: RefreshCw, label: 'Buyback Assurance' },
];

const SPEC_HIGHLIGHTS = [
  { icon: Gauge, label: 'Range', value: '70–90 km' },
  { icon: BatteryCharging, label: 'Battery', value: '48V 40Ah' },
  { icon: Scale, label: 'Weight', value: '59–63 kg' },
  { icon: PackageCheck, label: 'Loading Capacity', value: '150 kg' },
];

interface InvestorSectionProps {
  variant?: 'home' | 'page';
}

export const InvestorSection = ({ variant = 'home' }: InvestorSectionProps) => {
  return (
    <>
      <StakeholderSection
        id="investors"
        eyebrow="For Investors"
        title="Invest in India's EV Future"
        description="Buy an EV, deploy it into our professionally managed fleet, and earn monthly passive income — with full transparency and buyback assurance."
        features={FEATURES}
        ctaLabel="Join as Investor"
        cta={
          variant === 'home'
            ? { type: 'link', href: '/investors' }
            : { type: 'form', interest: 'Investor' }
        }
        image={investImage}
        imageAlt="Invest in India's EV future — Booklynk EV investor fleet illustration"
      />

      <div className="pb-24 sm:pb-32">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="rounded-3xl border border-border bg-card p-8 shadow-sm sm:p-10"
          >
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <span className="mb-2 inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
                  What You're Investing In
                </span>
                <h3 className="font-display text-2xl font-bold sm:text-3xl">
                  EV Scooty Specifications
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  A quick look at the electric scooters deployed across the Booklynk EV fleet.
                </p>
              </div>
              <Button variant="outline" asChild className="shrink-0">
                <Link to="/investors#ev-specs">
                  View Full Specifications
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {SPEC_HIGHLIGHTS.map((spec) => (
                <div
                  key={spec.label}
                  className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <spec.icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground">{spec.label}</p>
                    <p className="text-sm font-semibold">{spec.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};
