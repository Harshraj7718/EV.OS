import { motion } from 'framer-motion';
import evScooterImage from '@/assets/EV.webp';

export const HeroIllustration = () => {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-lg">
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-evos-green/20 via-evos-blue/10 to-transparent blur-3xl"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute inset-0 rounded-full bg-evos-cyan/10 blur-2xl"
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />

      {[...Array(6)].map((_, i) => (
        <motion.span
          key={i}
          className="absolute h-2 w-2 rounded-full"
          style={{
            left: `${12 + i * 14}%`,
            top: `${15 + (i % 3) * 22}%`,
            backgroundColor: i % 2 === 0 ? '#00E676' : '#00E5FF',
          }}
          animate={{ opacity: [0.2, 1, 0.2], y: [0, -12, 0] }}
          transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
        />
      ))}

      <motion.img
        src={evScooterImage}
        alt="EV.OS electric scooter"
        className="relative z-10 h-full w-full object-contain drop-shadow-2xl"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: [0, -14, 0] }}
        transition={{
          opacity: { duration: 0.8, ease: 'easeOut' },
          y: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.8 },
        }}
      />
    </div>
  );
};
