import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, X } from 'lucide-react';
import { PHONE_NUMBERS, toWhatsAppHref } from '@/lib/contactInfo';

const WHATSAPP_LINK = toWhatsAppHref(
  PHONE_NUMBERS[0],
  "Hi Booklynk EV, I'd like to know more."
);

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 32 32" fill="currentColor" className={className} aria-hidden="true">
    <path d="M16.004 3C9.377 3 4 8.373 4 15c0 2.34.663 4.523 1.81 6.377L4 29l7.828-1.775A11.94 11.94 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3Zm6.988 16.87c-.294.828-1.462 1.545-2.394 1.744-.638.135-1.472.243-4.278-.919-3.594-1.487-5.907-5.13-6.088-5.367-.174-.238-1.463-1.948-1.463-3.716s.907-2.638 1.226-3.001c.294-.335.638-.418.851-.418.213 0 .426.002.612.011.196.01.46-.075.72.549.294.706.997 2.474 1.084 2.653.087.18.146.39.03.626-.116.238-.174.386-.348.593-.174.207-.365.462-.522.62-.174.176-.355.366-.152.719.203.354.902 1.489 1.937 2.412 1.33 1.187 2.451 1.555 2.804 1.73.354.176.559.148.766-.09.207-.238.876-1.024 1.11-1.376.232-.353.465-.293.783-.176.319.117 2.024.955 2.37 1.128.348.176.58.264.667.412.087.148.087.855-.207 1.683Z" />
  </svg>
);

export const WhatsAppWidget = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-[300px] overflow-hidden rounded-2xl bg-white shadow-2xl sm:w-80"
          >
            <div className="flex items-center justify-between bg-[#25D366] px-4 py-3.5">
              <div className="flex items-center gap-2.5 text-white">
                <WhatsAppIcon className="h-7 w-7" />
                <span className="font-display text-base font-semibold">WhatsApp</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close WhatsApp chat"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-black/10 text-white transition-colors hover:bg-black/20"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-3 bg-[#e5f5ec] px-4 py-5">
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm">
                Hello 👋, welcome to <strong>Booklynk EV</strong>
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm">
                How can we help you?
              </div>

              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[#20bd5a]"
              >
                Open Chat
                <Send className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close WhatsApp chat' : 'Chat with us on WhatsApp'}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20"
      >
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.span
              key="close"
              initial={{ opacity: 0, rotate: -45 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 45 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </motion.span>
          ) : (
            <motion.span
              key="whatsapp"
              initial={{ opacity: 0, rotate: 45 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: -45 }}
              transition={{ duration: 0.15 }}
            >
              <WhatsAppIcon className="h-7 w-7" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};
