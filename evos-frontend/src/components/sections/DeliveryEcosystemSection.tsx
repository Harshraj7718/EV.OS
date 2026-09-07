import { LogoCloud } from '@/components/ui/logo-cloud-3';
import { cn } from '@/lib/utils';

const PARTNER_LOGOS = [
  { src: '/partners/zomato.png', alt: 'Zomato' },
  { src: '/partners/swiggy.png', alt: 'Swiggy' },
  { src: '/partners/swiggy-instamart.png', alt: 'Swiggy Instamart' },
  { src: '/partners/blinkit.png', alt: 'Blinkit' },
  { src: '/partners/zepto.png', alt: 'Zepto' },
  { src: '/partners/bigbasket.png', alt: 'BigBasket' },
  { src: '/partners/bbnow.png', alt: 'bbnow' },
  { src: '/partners/porter.png', alt: 'Porter' },
  { src: '/partners/shadowfax.png', alt: 'Shadowfax' },
  { src: '/partners/delhivery.png', alt: 'Delhivery' },
  { src: '/partners/ecom-express.png', alt: 'Ecom Express' },
  { src: '/partners/xpressbees.png', alt: 'XpressBees' },
  { src: '/partners/amazon-fresh.png', alt: 'Amazon Fresh' },
  { src: '/partners/flipkart-minutes.png', alt: 'Flipkart Minutes' },
  { src: '/partners/jiomart.png', alt: 'JioMart' },
  { src: '/partners/country-delight.png', alt: 'Country Delight' },
  { src: '/partners/licious.png', alt: 'Licious' },
  { src: '/partners/fresh-to-home.png', alt: 'Fresh to Home' },
  { src: '/partners/pharmeasy.png', alt: 'PharmEasy' },
  { src: '/partners/tata-1mg.png', alt: 'Tata 1mg' },
  { src: '/partners/apollo-247.png', alt: 'Apollo 24|7' },
];

export const DeliveryEcosystemSection = () => {
  return (
    <section className="relative w-full py-16 sm:py-20">
      <div
        aria-hidden="true"
        className={cn(
          '-z-10 -top-1/2 -translate-x-1/2 pointer-events-none absolute left-1/2 h-[120vmin] w-[120vmin] rounded-b-full',
          'bg-[radial-gradient(ellipse_at_center,hsl(var(--foreground)/0.06),transparent_50%)]',
          'blur-[30px]'
        )}
      />

      <div className="container relative mx-auto max-w-3xl">
        <h2 className="mb-5 text-center font-display text-xl font-medium tracking-tight text-foreground md:text-3xl">
          <span className="font-semibold">Delivery Tie-Up Partners</span>
          <br />
          <span className="text-muted-foreground">Powering last-mile delivery with EV Fleets</span>
        </h2>
        <div className="mx-auto my-5 h-px max-w-sm bg-border [mask-image:linear-gradient(to_right,transparent,black,transparent)]" />

        <LogoCloud logos={PARTNER_LOGOS} />

        <div className="mt-5 h-px bg-border [mask-image:linear-gradient(to_right,transparent,black,transparent)]" />
      </div>
    </section>
  );
};
