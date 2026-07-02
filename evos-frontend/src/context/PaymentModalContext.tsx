import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { InvestmentPlan } from '@/lib/plans';

interface PaymentModalContextValue {
  isOpen: boolean;
  selectedPlan: InvestmentPlan | null;
  openPaymentModal: (plan: InvestmentPlan) => void;
  closePaymentModal: () => void;
}

const PaymentModalContext = createContext<PaymentModalContextValue | undefined>(undefined);

export const PaymentModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);

  const openPaymentModal = useCallback((plan: InvestmentPlan) => {
    setSelectedPlan(plan);
    setIsOpen(true);
  }, []);

  const closePaymentModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = useMemo(
    () => ({ isOpen, selectedPlan, openPaymentModal, closePaymentModal }),
    [isOpen, selectedPlan, openPaymentModal, closePaymentModal]
  );

  return <PaymentModalContext.Provider value={value}>{children}</PaymentModalContext.Provider>;
};

export const usePaymentModal = (): PaymentModalContextValue => {
  const context = useContext(PaymentModalContext);
  if (!context) {
    throw new Error('usePaymentModal must be used within a PaymentModalProvider');
  }
  return context;
};
