import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Bike, Rocket, ShieldCheck } from 'lucide-react';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { scheduleScrollTriggerRefresh } from '@/lib/gsapRefresh';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const PLAN_STEPS = [
  {
    icon: Bike,
    title: 'Buy 2 EV Scooty',
    cost: '₹1,40,000',
    detail:
      'Cost ₹1,40,000 including GST. You get a monthly rental of ₹7,500 for the next 4 years.',
    total: 'Total income in 4 years: ₹3,60,000',
  },
  {
    icon: Bike,
    title: 'Buy 5 EV Scooty',
    cost: '₹3,50,000',
    detail:
      'Cost ₹3,50,000 including GST. You get a monthly rental of ₹21,000 for the next 4 years.',
    total: 'Total income in 4 years: ₹10,08,000',
  },
  {
    icon: Bike,
    title: 'Buy 10 EV Scooty',
    cost: '₹7,00,000',
    detail:
      'Cost ₹7,00,000 including GST. You get a monthly rental of ₹45,000 for the next 4 years.',
    total: 'Total income in 4 years: ₹21,60,000',
  },
  {
    icon: Rocket,
    title: 'Buy More Than 10 Scooty',
    cost: 'Custom Fleet',
    detail: 'Get ₹4,500 monthly rental per scooty for the next 4 years.',
    total: 'Scales with your fleet size',
  },
];

export const EVInvestmentPlanSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const stepperWrap = containerRef.current?.querySelector('[data-stepper-wrap]');
      const line = containerRef.current?.querySelector('[data-stepper-line]');
      if (line && stepperWrap) {
        gsap.fromTo(
          line,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: stepperWrap,
              start: 'top 80%',
              end: 'bottom 60%',
              scrub: 0.5,
              invalidateOnRefresh: true,
            },
            transformOrigin: 'left center',
          }
        );
      }

      const steps = gsap.utils.toArray<HTMLElement>('[data-stepper-item]', containerRef.current);
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

      const banner = containerRef.current?.querySelector('[data-buyback-banner]');
      if (banner) {
        gsap.from(banner, {
          opacity: 0,
          scale: 0.9,
          duration: 0.6,
          ease: 'back.out(1.7)',
          scrollTrigger: {
            trigger: banner,
            start: 'top 90%',
          },
        });
      }

      scheduleScrollTriggerRefresh();
    },
    { scope: containerRef }
  );

  return (
    <section className="py-24 sm:py-32" ref={containerRef}>
      <div className="container">
        <SectionHeading
          eyebrow="Investment Plans"
          title="The EV Investment Plan"
          description="A practical pathway to participate in India's growing electric-mobility ecosystem."
        />

        <div className="relative mt-20" data-stepper-wrap>
          <div
            data-stepper-line
            className="absolute left-6 top-6 hidden h-px w-[calc(100%-3rem)] bg-primary sm:left-1/2 sm:block sm:w-[calc(100%-6rem)] sm:-translate-x-1/2"
          />

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {PLAN_STEPS.map((step, index) => (
              <div
                key={step.title}
                data-stepper-item
                className="relative flex flex-col items-center text-center sm:items-start sm:text-left"
              >
                <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-card text-primary shadow-lg shadow-primary/10">
                  <step.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="mt-3 text-xs font-semibold uppercase tracking-widest text-primary">
                  Step {index + 1}
                </span>
                <h3 className="mt-2 font-display text-lg font-bold">{step.title}</h3>
                <p className="mt-1 text-sm font-semibold text-foreground">{step.cost}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.detail}</p>
                <p className="mt-2 text-sm font-semibold text-primary">{step.total}</p>
              </div>
            ))}
          </div>
        </div>

        <div
          data-buyback-banner
          className="mx-auto mt-16 flex max-w-3xl flex-col items-center gap-3 rounded-2xl border-2 border-primary bg-primary/10 px-8 py-6 text-center shadow-lg shadow-primary/20 backdrop-blur-xl sm:flex-row sm:justify-center sm:text-left"
        >
          <ShieldCheck className="h-8 w-8 shrink-0 text-primary" aria-hidden="true" />
          <p className="font-display text-lg font-bold uppercase tracking-wide text-primary sm:text-xl">
            Buyback Guarantee — 10% Buyback per Scooty After 48 Months
          </p>
        </div>
      </div>
    </section>
  );
};
