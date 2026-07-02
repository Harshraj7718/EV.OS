import { Activity, BatteryCharging, ClipboardCheck, MapPin, Wrench } from 'lucide-react';
import { StakeholderSection } from './StakeholderSection';
import businessImage from '@/assets/bussiness.webp';

const FEATURES = [
  { icon: Activity, label: 'Fleet Monitoring' },
  { icon: MapPin, label: 'GPS Tracking' },
  { icon: BatteryCharging, label: 'Battery Analytics' },
  { icon: ClipboardCheck, label: 'Attendance' },
  { icon: Wrench, label: 'Maintenance Alerts' },
];

export const BusinessSection = () => {
  return (
    <StakeholderSection
      id="business"
      eyebrow="For Businesses"
      title="Power Your Fleet with EV.OS"
      description="Run your delivery or mobility fleet on an AI-powered dashboard with real-time GPS, battery intelligence, trip analytics and maintenance alerts."
      features={FEATURES}
      ctaLabel="Partner as Business"
      interest="Business"
      image={businessImage}
      imageAlt="EV.OS fleet management dashboard powering a business's electric scooter fleet"
    />
  );
};
