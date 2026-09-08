import { lazy, Suspense, useEffect, useState } from 'react';
import { usePaymentModal } from '@/context/PaymentModalContext';

const PaymentModal = lazy(() =>
  import('./PaymentModal').then((m) => ({ default: m.PaymentModal }))
);

export const PaymentModalLazy = () => {
  const { isOpen } = usePaymentModal();
  const [hasOpened, setHasOpened] = useState(false);

  useEffect(() => {
    if (isOpen) setHasOpened(true);
  }, [isOpen]);

  if (!hasOpened) return null;

  return (
    <Suspense fallback={null}>
      <PaymentModal />
    </Suspense>
  );
};
