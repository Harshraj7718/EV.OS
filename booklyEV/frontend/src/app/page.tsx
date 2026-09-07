import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { StakeholderCard } from "@/components/ui/StakeholderCard";
import { ApiStatus } from "@/components/ui/ApiStatus";

const stakeholders = [
  {
    eyebrow: "Investor · Passive Income",
    title: "Own an EV asset",
    description:
      "Deploy your EV into a managed fleet and monitor returns from a single dashboard.",
  },
  {
    eyebrow: "Rider · Affordable Mobility",
    title: "Ride without the overhead",
    description:
      "Access maintenance-free EVs on flexible terms, plus mobility and delivery jobs.",
  },
  {
    eyebrow: "Business · Fleet SaaS",
    title: "Run your fleet on one platform",
    description:
      "Manage EV fleets, riders, vehicles, trips, and business analytics in one place.",
  },
];

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 py-20 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-500">
            Booklynk EV
          </p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight text-brand-950">
            One Platform. Three Stakeholders.
            <br className="hidden sm:block" /> Infinite Possibilities.
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-brand-900/70">
            The Operating System for India&apos;s EV Economy — connecting investors,
            riders, and fleet businesses.
          </p>
          <div className="mt-8 flex justify-center">
            <ApiStatus />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid gap-6 sm:grid-cols-3">
            {stakeholders.map((s) => (
              <StakeholderCard key={s.title} {...s} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
