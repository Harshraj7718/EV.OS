import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/context/ThemeContext';
import { LeadModalProvider } from '@/context/LeadModalContext';
import { PaymentModalProvider } from '@/context/PaymentModalContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ScrollToTop } from '@/components/ScrollToTop';
import { SectionFallback } from '@/components/shared/SectionFallback';
import { LeadCaptureModalLazy } from '@/components/LeadCaptureModalLazy';
import { PaymentModalLazy } from '@/components/PaymentModalLazy';
import { WhatsAppWidget } from '@/components/WhatsAppWidget';

const Home = lazy(() => import('@/pages/Home').then((m) => ({ default: m.Home })));
const About = lazy(() => import('@/pages/About').then((m) => ({ default: m.About })));
const Investors = lazy(() => import('@/pages/Investors').then((m) => ({ default: m.Investors })));
const Riders = lazy(() => import('@/pages/Riders').then((m) => ({ default: m.Riders })));
const Business = lazy(() => import('@/pages/Business').then((m) => ({ default: m.Business })));
const FAQ = lazy(() => import('@/pages/FAQ').then((m) => ({ default: m.FAQ })));
const Blogs = lazy(() => import('@/pages/Blogs').then((m) => ({ default: m.Blogs })));
const Resources = lazy(() => import('@/pages/Resources').then((m) => ({ default: m.Resources })));
const Testimonials = lazy(() =>
  import('@/pages/Testimonials').then((m) => ({ default: m.Testimonials }))
);
const Contact = lazy(() => import('@/pages/Contact').then((m) => ({ default: m.Contact })));
const PrivacyPolicy = lazy(() =>
  import('@/pages/PrivacyPolicy').then((m) => ({ default: m.PrivacyPolicy }))
);
const TermsOfService = lazy(() =>
  import('@/pages/TermsOfService').then((m) => ({ default: m.TermsOfService }))
);
const NotFound = lazy(() => import('@/pages/NotFound').then((m) => ({ default: m.NotFound })));
const Maintenance = lazy(() =>
  import('@/pages/Maintenance').then((m) => ({ default: m.Maintenance }))
);

const DotGridBackground = lazy(() =>
  import('@/components/ui/dot-grid-background').then((m) => ({ default: m.DotGridBackground }))
);

// Set VITE_MAINTENANCE_MODE=true (Vercel → Settings → Environment Variables) and redeploy to
// take the site down and show a maintenance message instead of the normal app.
const isMaintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE === 'true';

function App() {
  useEffect(() => {
    document.querySelectorAll('[data-rh-fallback]').forEach((el) => el.remove());
  }, []);

  if (isMaintenanceMode) {
    return (
      <ThemeProvider>
        <Suspense fallback={null}>
          <Maintenance />
        </Suspense>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <LeadModalProvider>
        <PaymentModalProvider>
          <ScrollToTop />
          <Suspense fallback={null}>
            <DotGridBackground className="pointer-events-none fixed inset-0 -z-10 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black_40%,transparent_100%)]" />
          </Suspense>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">
              <Suspense fallback={<SectionFallback />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/investors" element={<Investors />} />
                  <Route path="/riders" element={<Riders />} />
                  <Route path="/business" element={<Business />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/blogs" element={<Blogs />} />
                  <Route path="/resources" element={<Resources />} />
                  <Route path="/testimonials" element={<Testimonials />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>
            <Footer />
          </div>
          <LeadCaptureModalLazy />
          <PaymentModalLazy />
          <WhatsAppWidget />
          <Toaster richColors position="top-right" closeButton />
        </PaymentModalProvider>
      </LeadModalProvider>
    </ThemeProvider>
  );
}

export default App;
