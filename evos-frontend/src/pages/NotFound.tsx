import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/shared/SEO';
import { HeroWatermark } from '@/components/shared/HeroWatermark';

export const NotFound = () => {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden px-6 text-center">
      <SEO
        title="Page Not Found | Booklynk EV"
        description="The page you're looking for may have been moved or never existed."
        path="/404"
        noindex
      />
      <HeroWatermark text="404" />
      <span className="font-display text-sm font-semibold uppercase tracking-widest text-primary">
        404 Error
      </span>
      <h1 className="text-4xl font-bold sm:text-5xl">This route doesn&apos;t exist</h1>
      <p className="max-w-md text-muted-foreground">
        The page you&apos;re looking for may have been moved or never existed. Let&apos;s get you
        back on track.
      </p>
      <Button asChild size="lg">
        <Link to="/">Back to Home</Link>
      </Button>
    </div>
  );
};

export default NotFound;
