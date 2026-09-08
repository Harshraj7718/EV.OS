import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/context/ThemeContext';
import { LeadModalProvider } from '@/context/LeadModalContext';
import { PaymentModalProvider } from '@/context/PaymentModalContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { DotGridBackground } from '@/components/ui/dot-grid-background';
import { LeadCaptureModal } from '@/components/LeadCaptureModal';
import { PaymentModal } from '@/components/PaymentModal';
import { ScrollToTop } from '@/components/ScrollToTop';
import { Home } from '@/pages/Home';
import { About } from '@/pages/About';
import { Investors } from '@/pages/Investors';
import { Riders } from '@/pages/Riders';
import { Business } from '@/pages/Business';
import { FAQ } from '@/pages/FAQ';
import { Blogs } from '@/pages/Blogs';
import { Resources } from '@/pages/Resources';
import { Testimonials } from '@/pages/Testimonials';
import { Contact } from '@/pages/Contact';
import { PrivacyPolicy } from '@/pages/PrivacyPolicy';
import { TermsOfService } from '@/pages/TermsOfService';
import { NotFound } from '@/pages/NotFound';

function App() {
  useEffect(() => {
    document.querySelectorAll('[data-rh-fallback]').forEach((el) => el.remove());
  }, []);

  return (
    <ThemeProvider>
      <LeadModalProvider>
        <PaymentModalProvider>
          <ScrollToTop />
          <DotGridBackground className="pointer-events-none fixed inset-0 -z-10 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black_40%,transparent_100%)]" />
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">
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
            </main>
            <Footer />
          </div>
          <LeadCaptureModal />
          <PaymentModal />
          <Toaster richColors position="top-right" closeButton />
        </PaymentModalProvider>
      </LeadModalProvider>
    </ThemeProvider>
  );
}

export default App;
