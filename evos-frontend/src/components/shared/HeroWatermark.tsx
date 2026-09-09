import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HeroWatermarkProps {
  text: string;
  className?: string;
}

export const HeroWatermark = ({ text, className }: HeroWatermarkProps) => (
  <motion.div
    aria-hidden="true"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 1, ease: 'easeOut' }}
    className={cn(
      'pointer-events-none absolute inset-y-0 right-0 -z-[1] flex select-none items-center justify-end overflow-hidden pr-1 sm:pr-4 lg:pr-8',
      className
    )}
  >
    <span
      className="whitespace-nowrap font-display text-6xl font-black uppercase leading-none tracking-tight text-primary/[0.16] sm:text-7xl lg:text-8xl"
      style={{ writingMode: 'vertical-rl' }}
    >
      {text}
    </span>
  </motion.div>
);
