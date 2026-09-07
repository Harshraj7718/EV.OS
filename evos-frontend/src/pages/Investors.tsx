import { InvestorSection } from '@/components/sections/InvestorSection';
import { EVInvestmentPlanSection } from '@/components/sections/EVInvestmentPlanSection';
import { InvestmentPlansSection } from '@/components/sections/InvestmentPlansSection';
import { EVSpecsSection } from '@/components/sections/EVSpecsSection';
import { CTASection } from '@/components/sections/CTASection';

export const Investors = () => (
  <div className="pt-20">
    <InvestorSection variant="page" />
    <EVInvestmentPlanSection />
    <InvestmentPlansSection />
    <EVSpecsSection />
    <CTASection />
  </div>
);

export default Investors;
