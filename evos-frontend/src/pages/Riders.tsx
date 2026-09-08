import { RiderSection } from '@/components/sections/RiderSection';
import { CTASection } from '@/components/sections/CTASection';
import { SEO } from '@/components/shared/SEO';

export const Riders = () => (
  <div className="pt-20">
    <SEO
      title="Affordable EV Rentals for Riders | Booklynk EV"
      description="Ride maintenance-free electric scooters on flexible terms, with insurance included and access to a built-in job marketplace. Affordable mobility for riders across Noida and Gurgaon."
      path="/riders"
    />
    <RiderSection variant="page" />
    <CTASection />
  </div>
);

export default Riders;
