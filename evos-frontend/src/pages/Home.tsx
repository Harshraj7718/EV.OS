import { lazy, Suspense } from 'react';
import { Hero } from '@/components/sections/Hero';
import { TrustSection } from '@/components/sections/TrustSection';
import { SectionFallback } from '@/components/shared/SectionFallback';

const WhyEvOS = lazy(() => import('@/components/sections/WhyEvOS').then((m) => ({ default: m.WhyEvOS })));
const InvestorSection = lazy(() =>
  import('@/components/sections/InvestorSection').then((m) => ({ default: m.InvestorSection }))
);
const InvestmentPlansSection = lazy(() =>
  import('@/components/sections/InvestmentPlansSection').then((m) => ({
    default: m.InvestmentPlansSection,
  }))
);
const RiderSection = lazy(() =>
  import('@/components/sections/RiderSection').then((m) => ({ default: m.RiderSection }))
);
const BusinessSection = lazy(() =>
  import('@/components/sections/BusinessSection').then((m) => ({ default: m.BusinessSection }))
);
const PlatformFlow = lazy(() =>
  import('@/components/sections/PlatformFlow').then((m) => ({ default: m.PlatformFlow }))
);
const ComparisonSection = lazy(() =>
  import('@/components/sections/ComparisonSection').then((m) => ({ default: m.ComparisonSection }))
);
const RoadmapSection = lazy(() =>
  import('@/components/sections/RoadmapSection').then((m) => ({ default: m.RoadmapSection }))
);
const FeaturesSection = lazy(() =>
  import('@/components/sections/FeaturesSection').then((m) => ({ default: m.FeaturesSection }))
);
const FAQSection = lazy(() =>
  import('@/components/sections/FAQSection').then((m) => ({ default: m.FAQSection }))
);
const CTASection = lazy(() =>
  import('@/components/sections/CTASection').then((m) => ({ default: m.CTASection }))
);

export const Home = () => {
  return (
    <>
      <Hero />
      <TrustSection />
      <Suspense fallback={<SectionFallback />}>
        <WhyEvOS />
        <InvestorSection />
        <InvestmentPlansSection />
        <RiderSection />
        <BusinessSection />
        <PlatformFlow />
        <ComparisonSection />
        <RoadmapSection />
        <FeaturesSection />
        <FAQSection />
        <CTASection />
      </Suspense>
    </>
  );
};

export default Home;
