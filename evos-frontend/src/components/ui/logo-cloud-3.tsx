import { InfiniteSlider } from '@/components/ui/infinite-slider';
import { cn } from '@/lib/utils';

type Logo = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

type LogoCloudProps = React.ComponentProps<'div'> & {
  logos: Logo[];
};

export function LogoCloud({ className, logos, ...props }: LogoCloudProps) {
  return (
    <div
      {...props}
      className={cn(
        'overflow-hidden py-4 [mask-image:linear-gradient(to_right,transparent,black,transparent)]',
        className
      )}
    >
      <InfiniteSlider gap={42} reverse duration={80} durationOnHover={25}>
        {logos.map((logo) => (
          <div
            key={`logo-${logo.alt}`}
            className="flex h-12 w-28 shrink-0 items-center justify-center rounded-lg bg-white/95 px-3 py-2 shadow-sm md:h-14 md:w-32"
          >
            <img
              alt={logo.alt}
              className="pointer-events-none h-full w-full select-none object-contain"
              height={logo.height || 'auto'}
              loading="lazy"
              src={logo.src}
              width={logo.width || 'auto'}
            />
          </div>
        ))}
      </InfiniteSlider>
    </div>
  );
}
