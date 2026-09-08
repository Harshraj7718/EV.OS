import { lazy, Suspense } from 'react';
import { Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import logo from '@/assets/logo-full.webp';
import { COMPANY_EMAIL } from '@/lib/contactInfo';

const DotGridBackground = lazy(() =>
  import('@/components/ui/dot-grid-background').then((m) => ({ default: m.DotGridBackground }))
);

export const Maintenance = () => {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6">
      <Suspense fallback={null}>
        <DotGridBackground className="pointer-events-none fixed inset-0 -z-10 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black_40%,transparent_100%)]" />
      </Suspense>

      <a
        href="/"
        className="mb-8 inline-flex items-center rounded-lg bg-white/95 px-3 py-1.5 shadow-sm"
      >
        <img src={logo} alt="Booklynk EV" className="h-8 w-auto" />
      </a>

      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon" className="h-14 w-14 rounded-full bg-primary/10 text-primary">
            <Wrench className="h-6 w-6" aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>We&apos;ll be back shortly</EmptyTitle>
          <EmptyDescription>
            Booklynk EV is currently undergoing scheduled maintenance to make things better. We
            won&apos;t be long — please check back soon.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="flex-row justify-center gap-3">
          <Button size="sm" onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href={`mailto:${COMPANY_EMAIL}`}>Email Us</a>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
};

export default Maintenance;
