import { lazy, Suspense } from 'react';
import { Hero } from '@/components/sections/Hero';
import { TrustSection } from '@/components/sections/TrustSection';
import { SectionFallback } from '@/components/shared/SectionFallback';
import { SEO } from '@/components/shared/SEO';

const DeliveryEcosystemSection = lazy(() =>
  import('@/components/sections/DeliveryEcosystemSection').then((m) => ({
    default: m.DeliveryEcosystemSection,
  }))
);
const WhyEvOS = lazy(() =>
  import('@/components/sections/WhyEvOS').then((m) => ({ default: m.WhyEvOS }))
);
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
const BatterySwappingSection = lazy(() =>
  import('@/components/sections/BatterySwappingSection').then((m) => ({
    default: m.BatterySwappingSection,
  }))
);
const FeaturesSection = lazy(() =>
  import('@/components/sections/FeaturesSection').then((m) => ({ default: m.FeaturesSection }))
);
const DocumentsSection = lazy(() =>
  import('@/components/sections/DocumentsSection').then((m) => ({ default: m.DocumentsSection }))
);
const FAQSection = lazy(() =>
  import('@/components/sections/FAQSection').then((m) => ({ default: m.FAQSection }))
);
const VideoTestimonialsSection = lazy(() =>
  import('@/components/sections/VideoTestimonialsSection').then((m) => ({
    default: m.VideoTestimonialsSection,
  }))
);
const CTASection = lazy(() =>
  import('@/components/sections/CTASection').then((m) => ({ default: m.CTASection }))
);

export const Home = () => {
  return (
    <>
      <SEO
        title="Booklynk EV — India's EV Investment + Fleet Operating System"
        description="Booklynk EV is the operating system for India's EV economy. Invest in electric vehicles, ride affordably, or power your fleet business — one intelligent platform for investors, riders and businesses."
        path="/"
      />
      <Hero />
      <TrustSection />
      <Suspense fallback={<SectionFallback />}>
        <DeliveryEcosystemSection />
        <WhyEvOS />
        <InvestorSection />
        <InvestmentPlansSection />
        <RiderSection />
        <BusinessSection />
        <PlatformFlow />
        <ComparisonSection />
        <RoadmapSection />
        <BatterySwappingSection />
        <FeaturesSection />
        <DocumentsSection />
        <FAQSection />
        <VideoTestimonialsSection />
        <CTASection />
      </Suspense>
    </>
  );
};

export default Home;
