import { DocumentsSection } from '@/components/sections/DocumentsSection';
import { CTASection } from '@/components/sections/CTASection';
import { SEO } from '@/components/shared/SEO';

export const Resources = () => (
  <div className="pt-20">
    <SEO
      title="Resources & Documents | Booklynk EV"
      description="Download the Booklynk EV brochure and access investment documentation, agreements and resources for investors, riders and business partners."
      path="/resources"
    />
    <DocumentsSection />
    <CTASection />
  </div>
);

export default Resources;
