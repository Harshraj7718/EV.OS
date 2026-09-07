import { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Clock } from 'lucide-react';
import { PageHero } from '@/components/shared/PageHero';
import { CTASection } from '@/components/sections/CTASection';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface BlogPost {
  slug: string;
  title: string;
  date: string;
  readTime: string;
  excerpt: string;
  content: string[];
}

const POSTS: BlogPost[] = [
  {
    slug: 'ev-fleet-leasing-asset-class',
    title: "Why EV Fleet Leasing Is India's Next Big Asset Class",
    date: '15 August 2026',
    readTime: '4 min read',
    excerpt:
      'Electric vehicles are shifting from a green-tech story to a yield-generating asset class. Here is why fleet leasing sits at the center of that shift.',
    content: [
      "India's EV adoption curve is steep, but the biggest bottleneck isn't demand — it's who owns and operates the vehicles. Fleet leasing solves that by separating vehicle ownership from vehicle operations: an investor owns the asset, an operator like Booklynk EV deploys and manages it commercially, and the investor earns a predictable monthly rental in return.",
      'This model already works at scale in aviation, shipping, and commercial trucking. EV fleet leasing applies the same logic to electric scooters and, eventually, bikes and delivery vehicles — turning a depreciating physical asset into a structured income stream, backed by real commercial deployment rather than speculation.',
      "For investors, that means exposure to India's EV growth story without having to operate a single vehicle themselves.",
    ],
  },
  {
    slug: 'how-booklynk-manages-fleet',
    title: 'How Booklynk EV Vets and Manages Its Fleet',
    date: '2 August 2026',
    readTime: '5 min read',
    excerpt:
      'From procurement to daily deployment, here is what actually happens to an EV after an investor buys it.',
    content: [
      'Every EV that enters the Booklynk fleet goes through the same lifecycle: procurement and quality checks, insurance registration, commercial deployment into our rider and logistics network, and ongoing maintenance tracking.',
      'Our operations team monitors utilization and battery health across the fleet, schedules preventive maintenance before it becomes a breakdown, and handles the insurance claims process directly if an accident or theft occurs — so investors never have to deal with day-to-day vehicle operations themselves.',
      'This operational layer is what turns a single EV purchase into a hands-off investment: the owner holds the asset, Booklynk runs it.',
    ],
  },
  {
    slug: 'understanding-roi-rental-buyback',
    title: 'Understanding ROI, Rental Income and Buyback in EV Investments',
    date: '20 July 2026',
    readTime: '6 min read',
    excerpt:
      'A plain-language walkthrough of how monthly rental, contract length, and end-of-term buyback combine to determine your total return.',
    content: [
      'Three numbers determine the return on an EV investment: the upfront investment amount, the monthly rental paid over the contract term, and the buyback or salvage value at the end of the term.',
      'Monthly rental is the recurring income paid for as long as the vehicle is commercially deployed, governed by the terms in the formal agreement. Multiply that by the contract length (typically 4 years, or 48 months) to get total rental income. Add the applicable end-of-contract buyback value, and you arrive at total returns against the original investment.',
      "Every plan on our Investment Plans page shows this breakdown explicitly — investment amount, monthly rental, and projected ROI — so there's no guesswork before you commit. Always read the formal agreement for the exact terms that apply to your plan.",
    ],
  },
  {
    slug: 'roadmap-scooters-to-nationwide',
    title: 'The Road Ahead: From Scooters to Nationwide EV Infrastructure',
    date: '5 July 2026',
    readTime: '3 min read',
    excerpt:
      "We're starting with EV scooters in Noida and Gurgaon. Here is how that scales into the rest of the roadmap.",
    content: [
      "Booklynk EV's rollout today is EV scooters deployed across Noida and Gurgaon — deliberately narrow, so we can prove out fleet operations, rental economics, and investor experience in a contained market before expanding.",
      'The roadmap from here scales in stages: EV bikes next, followed by cargo vehicles for last-mile logistics, then auto rickshaws and mini delivery vans, and eventually a nationwide EV infrastructure footprint spanning every major Indian city.',
      'Each stage reuses the same core model — investor-owned assets, professionally managed fleet operations, and transparent rental income — just applied to a wider range of vehicle types and cities.',
    ],
  },
];

export const Blogs = () => {
  const [activePost, setActivePost] = useState<BlogPost | null>(null);

  return (
    <div>
      <PageHero
        eyebrow="Blog"
        title="Insights on EV Investing & Fleet Operations"
        description="Notes from the Booklynk EV team on the EV investment model, fleet operations, and where the industry is headed."
      />

      <section className="pb-24 sm:pb-32">
        <div className="container">
          <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2">
            {POSTS.map((post, index) => (
              <motion.button
                key={post.slug}
                type="button"
                onClick={() => setActivePost(post)}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: index * 0.08, ease: 'easeOut' }}
                whileHover={{ y: -6 }}
                className="flex flex-col rounded-2xl border border-border bg-card p-6 text-left shadow-sm transition-shadow hover:shadow-lg hover:shadow-primary/10"
              >
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                    {post.date}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {post.readTime}
                  </span>
                </div>
                <h2 className="mt-4 font-display text-lg font-semibold leading-snug">
                  {post.title}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {post.excerpt}
                </p>
                <span className="mt-4 text-sm font-semibold text-primary">Read article →</span>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      <Dialog open={activePost !== null} onOpenChange={(open) => !open && setActivePost(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{activePost?.title}</DialogTitle>
            {activePost && (
              <div className="flex items-center gap-4 pt-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                  {activePost.date}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {activePost.readTime}
                </span>
              </div>
            )}
          </DialogHeader>
          <div className="space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {activePost?.content.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <CTASection />
    </div>
  );
};

export default Blogs;
