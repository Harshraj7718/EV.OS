import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
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
