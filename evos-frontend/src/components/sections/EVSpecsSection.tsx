import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Smartphone, Gauge } from 'lucide-react';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { scheduleScrollTriggerRefresh } from '@/lib/gsapRefresh';

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface SpecRow {
  label: string;
  value: string;
}

const STAR_SPECS: SpecRow[] = [
  { label: 'Dimensions', value: '1900 × 680 × 1115 mm' },
  { label: 'Seat Height', value: '780 mm' },
  { label: 'Climbing', value: '15° incline capability' },
  { label: 'Ground Clearance', value: '190 mm' },
  { label: 'Brake System', value: 'Front & Rear Disc/Drum' },
  { label: 'Suspension', value: 'Telescopic' },
  { label: 'Tyres', value: '3.0-10 Tubeless Alloy' },
  { label: 'Headlight', value: 'LED' },
  { label: 'Weight', value: '59 kg' },
  { label: 'Range', value: '70–80 km' },
  { label: 'Battery', value: '48V 40Ah' },
  { label: 'Loading Capacity', value: '150 kg' },
];

const STAR_PLUS_SPECS: SpecRow[] = [
  { label: 'Dimensions', value: '1900 × 680 × 1115 mm' },
  { label: 'Seat Height', value: '780 mm' },
  { label: 'Climbing', value: '15° incline capability' },
  { label: 'Ground Clearance', value: '190 mm' },
  { label: 'Brake System', value: 'Front & Rear Disc/Drum' },
  { label: 'Suspension', value: 'Telescopic' },
  { label: 'Tyres', value: '3.0-10 Tubeless Alloy' },
  { label: 'Headlight', value: 'LED' },
  { label: 'Weight', value: '~63 kg' },
  { label: 'Range', value: '80–90 km' },
  { label: 'Battery', value: '48V 40Ah' },
  { label: 'Loading Capacity', value: '150 kg' },
];

const STAR_PLUS_FEATURES = [
  { icon: Smartphone, title: 'Mobile Charging', description: 'USB charging port built in' },
  { icon: Gauge, title: 'Digital Speedometer', description: 'All ride stats at a glance' },
];

export const EVSpecsSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const cards = gsap.utils.toArray<HTMLElement>('[data-spec-card]', containerRef.current);
      cards.forEach((card, index) => {
        gsap.from(card, {
          opacity: 0,
          x: index % 2 === 0 ? -60 : 60,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 80%',
          },
        });
      });

      scheduleScrollTriggerRefresh();
    },
    { scope: containerRef }
  );

  return (
    <section
      id="ev-specs"
      className="border-y border-border bg-muted/30 py-24 sm:py-32"
      ref={containerRef}
    >
      <div className="container">
        <SectionHeading
          eyebrow="Specifications"
          title="EV Scooty Specifications"
          description="Advanced electric scooters engineered for safety, comfort, and everyday performance."
        />

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          <div
            data-spec-card
            className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl"
          >
            <div className="border-b border-border bg-gradient-to-br from-evos-black via-evos-surface to-evos-black px-8 py-6">
              <span className="text-xs font-semibold uppercase tracking-widest text-evos-green">
                Base Model
              </span>
              <h3 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">Star</h3>
            </div>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 p-8 sm:grid-cols-2">
              {STAR_SPECS.map((spec) => (
                <div key={spec.label} className="border-b border-border pb-3">
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    {spec.label}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div
            data-spec-card
            className="overflow-hidden rounded-3xl border border-primary/40 bg-card shadow-xl shadow-primary/10"
          >
            <div className="border-b border-border bg-gradient-to-br from-evos-black via-evos-surface to-evos-black px-8 py-6">
              <span className="text-xs font-semibold uppercase tracking-widest text-evos-green">
                Upgraded Model
              </span>
              <h3 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">
                Star Plus
              </h3>
            </div>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 p-8 sm:grid-cols-2">
              {STAR_PLUS_SPECS.map((spec) => (
                <div key={spec.label} className="border-b border-border pb-3">
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    {spec.label}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold">{spec.value}</dd>
                </div>
              ))}
            </dl>

            <div className="border-t border-primary/20 bg-primary/5 px-8 py-6">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                Star Plus — Key Features
              </span>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {STAR_PLUS_FEATURES.map((feature) => (
                  <div key={feature.title} className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <feature.icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{feature.title}</p>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
