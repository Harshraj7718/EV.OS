import { BusinessSection } from '@/components/sections/BusinessSection';
import { CTASection } from '@/components/sections/CTASection';
import { SEO } from '@/components/shared/SEO';

export const Business = () => (
  <div className="pt-20">
    <SEO
      title="Fleet Operating System for Businesses | Booklynk EV"
      description="Run your delivery or mobility fleet on an AI-powered operating system built for scale — fleet coordination, tracking and operations for growing EV businesses."
      path="/business"
    />
    <BusinessSection variant="page" />
    <CTASection />
  </div>
);

export default Business;
