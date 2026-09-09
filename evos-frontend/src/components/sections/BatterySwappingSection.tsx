import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Clock, Settings, TrendingUp, Wallet, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLeadModal } from '@/context/LeadModalContext';
import { scheduleScrollTriggerRefresh } from '@/lib/gsapRefresh';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const FRANCHISE_STEPS = [
  {
    icon: Wallet,
    title: 'Invest',
    description: 'Starting investment of ₹10 Lakh to set up a battery swapping franchise.',
  },
  {
    icon: Settings,
    title: 'Operate',
    description: 'Support battery swapping services for local EV users and fleets.',
  },
  {
    icon: TrendingUp,
    title: 'Grow',
    description: 'Build a scalable presence as electric mobility expands.',
  },
];

export const BatterySwappingSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { openModal } = useLeadModal();

  useGSAP(
    () => {
      const badge = containerRef.current?.querySelector('[data-coming-soon-badge]');
      if (badge) {
        gsap.to(badge, {
          boxShadow: '0 0 0 8px rgba(0,230,118,0.15)',
          duration: 1.2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }

      const station = containerRef.current?.querySelector('[data-swap-station]');
      if (station) {
        gsap.from(station, {
          opacity: 0,
          scale: 0.85,
          duration: 0.7,
          ease: 'back.out(1.6)',
          scrollTrigger: {
            trigger: station,
            start: 'top 80%',
          },
        });

        const bolt = station.querySelector('[data-swap-bolt]');
        if (bolt) {
          gsap.to(bolt, {
            opacity: 0.3,
            duration: 0.6,
            repeat: -1,
            yoyo: true,
            ease: 'power1.inOut',
          });
        }
      }

      const stepperWrap = containerRef.current?.querySelector('[data-franchise-wrap]');
      const line = containerRef.current?.querySelector('[data-franchise-line]');
      if (line && stepperWrap) {
        gsap.fromTo(
          line,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: 'none',
            transformOrigin: 'left center',
            scrollTrigger: {
              trigger: stepperWrap,
              start: 'top 80%',
              end: 'bottom 60%',
              scrub: 0.5,
              invalidateOnRefresh: true,
            },
          }
        );
      }

      const steps = gsap.utils.toArray<HTMLElement>('[data-franchise-step]', containerRef.current);
      gsap.from(steps, {
        opacity: 0,
        y: 40,
        duration: 0.6,
        ease: 'power2.out',
        stagger: 0.15,
        scrollTrigger: {
          trigger: stepperWrap,
          start: 'top 85%',
        },
      });

      scheduleScrollTriggerRefresh();
    },
    { scope: containerRef }
  );

  return (
    <section className="border-y border-border bg-muted/30 py-24 sm:py-32" ref={containerRef}>
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <span
            data-coming-soon-badge
            className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary"
          >
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            Coming Soon
          </span>
          <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Battery Swapping Franchise Model
          </h2>
          <p className="mt-4 text-lg font-medium text-primary">
            A new opportunity for entrepreneurs in the growing EV ecosystem
          </p>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Booklynk EV is developing a franchise model focused on battery swapping operations to
            support convenient, reliable energy access for electric scooter users.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2">
          <div className="glass flex flex-col items-center justify-center rounded-2xl p-8 text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Starting Investment
            </span>
            <span className="mt-2 font-display text-4xl font-bold text-primary">₹10 Lakh</span>
          </div>

          <div
            data-swap-station
            className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-evos-black via-evos-surface to-evos-black p-8 text-center shadow-lg shadow-primary/10"
          >
            <div
              data-swap-bolt
              className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary"
            >
              <Zap className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-white/60">
              Booklynk Battery Swapping Station
            </p>
            <p className="mt-1 font-display text-xl font-bold text-white">Swap. Go. Power On.</p>
          </div>
        </div>

        <div className="relative mt-16" data-franchise-wrap>
          <div
            data-franchise-line
            className="absolute left-6 top-6 hidden h-px w-[calc(100%-3rem)] bg-primary sm:left-1/2 sm:block sm:w-[calc(100%-6rem)] sm:-translate-x-1/2"
          />

          <div className="grid gap-8 sm:grid-cols-3">
            {FRANCHISE_STEPS.map((step, index) => (
              <div
                key={step.title}
                data-franchise-step
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-card text-primary shadow-lg shadow-primary/10">
                  <step.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="mt-3 text-xs font-semibold uppercase tracking-widest text-primary">
                  {index + 1}. {step.title}
                </span>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass mx-auto mt-14 max-w-2xl rounded-xl border-dashed px-6 py-4 text-center text-xs leading-relaxed text-muted-foreground">
          Coming soon. Final franchise structure, inclusions, eligibility, and commercial terms will
          be announced separately. Investment involves risk; review all applicable information
          before participating.
        </div>

        <div className="mt-10 flex justify-center">
          <Button size="lg" onClick={() => openModal('Investor')}>
            Register Your Interest with Booklynk EV
          </Button>
        </div>
      </div>
    </section>
  );
};
