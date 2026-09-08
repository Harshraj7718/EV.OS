import { lazy, Suspense, useEffect, useState } from 'react';
import { useLeadModal } from '@/context/LeadModalContext';

const LeadCaptureModal = lazy(() =>
  import('./LeadCaptureModal').then((m) => ({ default: m.LeadCaptureModal }))
);

export const LeadCaptureModalLazy = () => {
  const { isOpen } = useLeadModal();
  const [hasOpened, setHasOpened] = useState(false);

  useEffect(() => {
    if (isOpen) setHasOpened(true);
  }, [isOpen]);

  if (!hasOpened) return null;

  return (
    <Suspense fallback={null}>
      <LeadCaptureModal />
    </Suspense>
  );
};
