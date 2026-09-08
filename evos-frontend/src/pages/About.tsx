import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bike,
  Briefcase,
  CheckCircle2,
  Cpu,
  Network,
  TrendingUp,
  Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { TrustSection } from '@/components/sections/TrustSection';
import { SEO } from '@/components/shared/SEO';
import { useLeadModal } from '@/context/LeadModalContext';
import evImage from '@/assets/EV.webp';

const WHAT_WE_DO = [
  {
    icon: TrendingUp,
    title: 'EV Investment Solutions',
    description:
      'Access structured opportunities designed around the growing electric-mobility ecosystem.',
  },
  {
    icon: Truck,
    title: 'Fleet Operations',
    description: 'Operate EV fleets with improved control, visibility, and efficiency.',
  },
  {
    icon: Cpu,
    title: 'Technology-Led Management',
    description:
      'Use a unified operating system to support smarter fleet decisions and day-to-day execution.',
  },
  {
    icon: Network,
    title: 'Scalable Mobility Infrastructure',
    description: 'Support EV adoption across commercial fleets and evolving transportation needs.',
  },
];

const WHY_POINTS = [
  'Combines investment and fleet operations in one platform',
  'Enables efficient, scalable EV fleet management',
  'Designed to help businesses transition towards cleaner mobility',
  'Supports a data-driven approach to operations and growth',
];

const STAKEHOLDERS = [
  {
    icon: TrendingUp,
    title: 'Investor',
    tagline: 'Passive Income',
    description:
      'Own an EV asset, deploy it into our managed fleet, and earn predictable monthly returns.',
    href: '/investors',
  },
  {
    icon: Bike,
    title: 'Rider',
    tagline: 'Affordable Mobility',
    description:
      'Access maintenance-free EVs on flexible terms with insurance and a built-in job marketplace.',
    href: '/riders',
  },
  {
    icon: Briefcase,
    title: 'Business',
    tagline: 'Fleet SaaS',
    description:
      'Run your delivery or mobility fleet on an AI-powered operating system built for scale.',
    href: '/business',
  },
];

const MotionLink = motion(Link);

export const About = () => {
  const { openModal } = useLeadModal();

  return (
    <div>
      <SEO
        title="About Us | Booklynk EV"
        description="Booklynk EV connects investors, riders and businesses into a single intelligent platform — turning electric vehicles into a shared source of passive income, affordable mobility, and fleet-scale operations."
        path="/about"
      />
      <section className="pb-20 pt-32 sm:pt-40">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="mx-auto max-w-3xl text-center"
          >
            <span className="mb-4 inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
              About Us
            </span>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Building the Operating System for India&apos;s EV Economy
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Booklynk EV connects investors, riders and businesses into a single intelligent
              platform — turning electric vehicles into a shared source of passive income,
              affordable mobility, and fleet-scale operations.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" onClick={() => openModal('Investor')}>
                Book a Demo
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/faq">Read the FAQ</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="container">
          <SectionHeading
            eyebrow="Overview"
            title="What We Do"
            description="Booklynk EV helps businesses participate in India's electric-vehicle transition with an integrated platform for EV investment and fleet operations."
          />

          <div className="relative mt-16">
            <div className="absolute left-6 top-6 hidden h-px w-[calc(100%-3rem)] bg-border sm:left-1/2 sm:block sm:w-[calc(100%-6rem)] sm:-translate-x-1/2 lg:top-6" />

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {WHAT_WE_DO.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.5, delay: index * 0.12, ease: 'easeOut' }}
                  className="relative flex flex-col items-center text-center sm:items-start sm:text-left"
                >
                  <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-card text-primary shadow-lg shadow-primary/10">
                    <step.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <span className="mt-3 text-xs font-semibold uppercase tracking-widest text-primary">
                    Step {index + 1}
                  </span>
                  <h3 className="mt-2 font-display text-lg font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="container">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <span className="mb-4 inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
                Our Mission
              </span>
              <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                One Platform. Three Stakeholders. Infinite Possibilities.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                Legacy EV rental models cap your upside — a single income stream, manual operations,
                and limited scale. Booklynk EV is built as infrastructure from day one: every EV we
                deploy generates rental income for its owner, affordable mobility for its rider, and
                operational data for the businesses running their fleets on our platform.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                We're starting with EV scooters across Noida and Gurgaon, with a roadmap that scales
                into bikes, cargo vehicles, and nationwide infrastructure as the ecosystem grows.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="relative"
            >
              <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-primary/20 via-secondary/10 to-transparent blur-2xl" />
              <div className="overflow-hidden rounded-3xl border border-border shadow-xl">
                <img
                  src={evImage}
                  alt="A Booklynk EV electric scooter deployed in the managed fleet"
                  className="aspect-[3/2] w-full object-cover"
                  loading="lazy"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <TrustSection />

      <section className="border-y border-border bg-muted/30 py-24 sm:py-32">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <span className="mb-4 inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
              Why Booklynk EV?
            </span>
            <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Built for India&apos;s Fast-Growing EV Ecosystem
            </h2>
          </div>

          <div className="mx-auto mt-14 grid max-w-3xl gap-4 sm:grid-cols-2">
            {WHY_POINTS.map((point, index) => (
              <motion.div
                key={point}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.4, delay: index * 0.08, ease: 'easeOut' }}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-5"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <span className="text-sm font-medium leading-relaxed sm:text-base">{point}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 sm:py-32">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="mx-auto max-w-2xl text-center"
          >
            <span className="mb-4 inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
              Who We Serve
            </span>
            <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Every Layer of India&apos;s EV Economy
            </h2>
          </motion.div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {STAKEHOLDERS.map((item, index) => (
              <MotionLink
                key={item.title}
                to={item.href}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: index * 0.12, ease: 'easeOut' }}
                whileHover={{ y: -8 }}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 text-left shadow-sm transition-shadow hover:shadow-xl hover:shadow-primary/10"
              >
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                  <item.icon className="h-7 w-7" aria-hidden="true" />
                </div>
                <h3 className="relative mt-6 font-display text-2xl font-bold">{item.title}</h3>
                <p className="relative mt-1 text-sm font-semibold text-primary">{item.tagline}</p>
                <p className="relative mt-4 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </MotionLink>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 sm:py-32">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="mx-auto max-w-3xl text-center"
          >
            <span className="mb-4 inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
              Our Vision
            </span>
            <p className="text-2xl font-semibold leading-snug tracking-tight sm:text-3xl lg:text-4xl">
              To enable a more sustainable, accessible, and commercially viable electric-mobility
              future for India.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-evos-black via-evos-surface to-evos-black px-8 py-20 text-center sm:px-16"
          >
            <div
              className="absolute inset-0 -z-10 bg-[length:200%_200%] opacity-40 animate-gradient-move"
              style={{
                backgroundImage:
                  'linear-gradient(120deg, rgba(0,230,118,0.35), rgba(0,229,255,0.25), rgba(24,255,255,0.3))',
              }}
            />
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              Build the Future of Mobility with Booklynk EV.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-white/70">
              Explore EV investment and fleet operating solutions for your business.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="glow-primary" onClick={() => openModal('Investor')}>
                Book a Demo
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                asChild
              >
                <Link to="/investors">Explore Solutions</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;
