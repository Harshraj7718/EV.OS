import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { LeadFormValues } from '@/lib/validation/lead.schema';

type LeadInterest = LeadFormValues['interest'];

interface LeadModalContextValue {
  isOpen: boolean;
  defaultInterest?: LeadInterest;
  openModal: (interest?: LeadInterest) => void;
  closeModal: () => void;
}

const LeadModalContext = createContext<LeadModalContextValue | undefined>(undefined);

export const LeadModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultInterest, setDefaultInterest] = useState<LeadInterest | undefined>(undefined);

  const openModal = useCallback((interest?: LeadInterest) => {
    setDefaultInterest(interest);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = useMemo(
    () => ({ isOpen, defaultInterest, openModal, closeModal }),
    [isOpen, defaultInterest, openModal, closeModal]
  );

  return <LeadModalContext.Provider value={value}>{children}</LeadModalContext.Provider>;
};

export const useLeadModal = (): LeadModalContextValue => {
  const context = useContext(LeadModalContext);
  if (!context) {
    throw new Error('useLeadModal must be used within a LeadModalProvider');
  }
  return context;
};
