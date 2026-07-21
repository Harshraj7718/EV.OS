import { Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/context/ThemeContext';
import { LeadModalProvider } from '@/context/LeadModalContext';
import { PaymentModalProvider } from '@/context/PaymentModalContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { LeadCaptureModal } from '@/components/LeadCaptureModal';
import { PaymentModal } from '@/components/PaymentModal';
import { ScrollToTop } from '@/components/ScrollToTop';
import { Home } from '@/pages/Home';
import { PrivacyPolicy } from '@/pages/PrivacyPolicy';
import { TermsOfService } from '@/pages/TermsOfService';
import { NotFound } from '@/pages/NotFound';

function App() {
  return (
    <ThemeProvider>
      <LeadModalProvider>
        <PaymentModalProvider>
          <ScrollToTop />
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
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
