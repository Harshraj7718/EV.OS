import { lazy, Suspense } from 'react';
import { Wrench } from 'lucide-react';
import logo from '@/assets/logo-full.webp';
import { COMPANY_EMAIL } from '@/lib/contactInfo';

const DotGridBackground = lazy(() =>
  import('@/components/ui/dot-grid-background').then((m) => ({ default: m.DotGridBackground }))
);

export const Maintenance = () => {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 text-center">
      <Suspense fallback={null}>
        <DotGridBackground className="pointer-events-none fixed inset-0 -z-10 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black_40%,transparent_100%)]" />
      </Suspense>

      <a
        href="/"
        className="mb-8 inline-flex items-center rounded-lg bg-white/95 px-3 py-1.5 shadow-sm"
      >
        <img src={logo} alt="Booklynk EV" className="h-8 w-auto" />
      </a>

      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Wrench className="h-6 w-6" aria-hidden="true" />
      </div>

      <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
        We&apos;ll be back shortly
      </h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
        Booklynk EV is currently undergoing scheduled maintenance to make things better. We
        won&apos;t be long — please check back soon.
      </p>
      <p className="mt-6 text-sm text-muted-foreground">
        Urgent query?{' '}
        <a href={`mailto:${COMPANY_EMAIL}`} className="text-primary hover:underline">
          {COMPANY_EMAIL}
        </a>
      </p>
    </div>
  );
};

export default Maintenance;
