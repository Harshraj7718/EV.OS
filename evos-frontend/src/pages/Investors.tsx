import { InvestorSection } from '@/components/sections/InvestorSection';
import { EVInvestmentPlanSection } from '@/components/sections/EVInvestmentPlanSection';
import { InvestmentPlansSection } from '@/components/sections/InvestmentPlansSection';
import { EVSpecsSection } from '@/components/sections/EVSpecsSection';
import { CTASection } from '@/components/sections/CTASection';
import { SEO } from '@/components/shared/SEO';

export const Investors = () => (
  <div className="pt-20">
    <SEO
      title="EV Investment Plans for Investors | Booklynk EV"
      description="Own an EV, deploy it into Booklynk's managed fleet, and earn predictable monthly rental income. Explore EV investment plans, returns and specs."
      path="/investors"
    />
    <InvestorSection variant="page" />
    <EVInvestmentPlanSection />
    <InvestmentPlansSection />
    <EVSpecsSection />
    <CTASection />
  </div>
);

export default Investors;
