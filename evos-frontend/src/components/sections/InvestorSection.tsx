import { Coins, RefreshCw, ShieldCheck, Wallet } from 'lucide-react';
import { StakeholderSection } from './StakeholderSection';
import investImage from '@/assets/invest.webp';

const FEATURES = [
  { icon: Wallet, label: 'Asset Ownership' },
  { icon: Coins, label: 'Passive Income' },
  { icon: ShieldCheck, label: 'Fleet Managed' },
  { icon: RefreshCw, label: 'Buyback Assurance' },
];

export const InvestorSection = () => {
  return (
    <StakeholderSection
      id="investors"
      eyebrow="For Investors"
      title="Invest in India's EV Future"
      description="Buy an EV, deploy it into our professionally managed fleet, and earn monthly passive income — with full transparency and buyback assurance."
      features={FEATURES}
      ctaLabel="Join as Investor"
      interest="Investor"
      image={investImage}
      imageAlt="Invest in India's EV future — EV.OS investor fleet illustration"
    />
  );
};
