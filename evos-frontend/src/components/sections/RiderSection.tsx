import { Bike, LayoutDashboard, ShieldCheck, Wrench, Briefcase } from 'lucide-react';
import { StakeholderSection } from './StakeholderSection';
import rideImage from '@/assets/ride.webp';

const FEATURES = [
  { icon: Bike, label: 'Affordable Rentals' },
  { icon: LayoutDashboard, label: 'Daily Dashboard' },
  { icon: ShieldCheck, label: 'Insurance' },
  { icon: Wrench, label: 'Maintenance Free' },
  { icon: Briefcase, label: 'Job Marketplace' },
];

export const RiderSection = () => {
  return (
    <StakeholderSection
      id="riders"
      eyebrow="For Riders"
      title={'Ride Smarter.\nEarn More.'}
      description="Get on the road with a maintenance-free EV, transparent daily earnings, and an integrated marketplace connecting you to gig opportunities."
      features={FEATURES}
      ctaLabel="Join as Rider"
      interest="Rider"
      image={rideImage}
      imageAlt="Booklynk EV rider earning on the road with the rider earnings dashboard"
      reverse
    />
  );
};
