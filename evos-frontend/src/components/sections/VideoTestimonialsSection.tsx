import { motion } from 'framer-motion';
import { SectionHeading } from '@/components/shared/SectionHeading';

interface VideoTestimonial {
  title: string;
  src: string;
}

const VIDEO_TESTIMONIALS: VideoTestimonial[] = [
  { title: 'Investor Review 1', src: '/videos/T1.mp4' },
  { title: 'Investor Review 2', src: '/videos/T2.mp4' },
];

interface VideoTestimonialsSectionProps {
  showHeading?: boolean;
}

export const VideoTestimonialsSection = ({ showHeading = true }: VideoTestimonialsSectionProps) => {
  return (
    <section className="py-24 sm:py-32">
      <div className="container">
        {showHeading && (
          <SectionHeading
            eyebrow="Investor Reviews"
            title="Hear From Our Investors"
            description="Real investors sharing their experience with Booklynk EV, in their own words."
          />
        )}

        <div className="mx-auto mt-14 grid max-w-4xl gap-8 sm:grid-cols-2">
          {VIDEO_TESTIMONIALS.map((video, index) => (
            <motion.div
              key={video.src}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: index * 0.12, ease: 'easeOut' }}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
            >
              {/* eslint-disable-next-line jsx-a11y/media-has-caption -- no caption track available for these testimonial clips yet */}
              <video
                controls
                preload="metadata"
                playsInline
                className="aspect-[9/16] w-full bg-black object-contain"
              >
                <source src={video.src} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <p className="px-4 py-3 text-sm font-semibold">{video.title}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
