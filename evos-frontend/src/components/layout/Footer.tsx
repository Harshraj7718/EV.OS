import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, X } from 'lucide-react';
import logo from '@/assets/logo-full.webp';
import { COMPANY_ADDRESS_LINES, COMPANY_EMAIL, PHONE_NUMBERS, toTelHref } from '@/lib/contactInfo';

const QUICK_LINKS = [
  { label: 'Investors', href: '/investors' },
  { label: 'Riders', href: '/riders' },
  { label: 'Business', href: '/business' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Blog', href: '/blogs' },
  { label: 'Resources', href: '/resources' },
  { label: 'Testimonials', href: '/testimonials' },
];

const SOCIALS = [
  {
    label: 'Facebook',
    icon: Facebook,
    href: 'https://www.facebook.com/profile.php?id=61588706544369',
  },
  { label: 'LinkedIn', icon: Linkedin, href: 'https://www.linkedin.com/company/booklynk-ev/' },
  { label: 'X', icon: X, href: 'https://x.com/booklynkev?s=11&t=xCTy74-n2pVjYtA6ZQMjJQ' },
  {
    label: 'Instagram',
    icon: Instagram,
    href: 'https://www.instagram.com/booklynkev?igsh=MWk5N212MGpmdTcxcg==',
  },
];

export const Footer = () => {
  const footerRef = useRef<HTMLElement>(null);

  // gsap/ScrollTrigger are loaded dynamically (rather than statically imported) so this
  // purely decorative, below-the-fold animation doesn't block the site's initial JS payload —
  // the Footer renders on every page, so a static import here would make gsap eager everywhere.
  useEffect(() => {
    let cancelled = false;
    let cleanupAnimations: (() => void) | undefined;

    Promise.all([import('gsap'), import('gsap/ScrollTrigger'), import('@/lib/gsapRefresh')]).then(
      ([{ gsap }, { ScrollTrigger }, { scheduleScrollTriggerRefresh }]) => {
        if (cancelled || !footerRef.current) return;
        gsap.registerPlugin(ScrollTrigger);

        const ctx = gsap.context(() => {
          const phoneIcon = footerRef.current?.querySelector('[data-phone-icon]');
          if (phoneIcon) {
            gsap.to(phoneIcon, {
              boxShadow: '0 0 0 6px rgba(0,230,118,0.18)',
              duration: 1,
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut',
            });
          }

          const pin = footerRef.current?.querySelector('[data-pin-icon]');
          if (pin) {
            gsap.from(pin, {
              y: -16,
              opacity: 0,
              duration: 0.6,
              ease: 'bounce.out',
              scrollTrigger: {
                trigger: pin,
                start: 'top 95%',
              },
            });
          }

          scheduleScrollTriggerRefresh();
        }, footerRef);

        cleanupAnimations = () => ctx.revert();
      }
    );

    return () => {
      cancelled = true;
      cleanupAnimations?.();
    };
  }, []);

  return (
    <footer id="footer" className="border-t border-border bg-card" ref={footerRef}>
      <div className="container py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <a
              href="/#home"
              className="inline-flex items-center rounded-lg bg-white/95 px-3 py-1.5 shadow-sm"
            >
              <img src={logo} alt="Booklynk EV" className="h-8 w-auto" />
            </a>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              The Operating System for India's EV Economy. Empowering investors, riders and
              businesses through one intelligent EV ecosystem.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {SOCIALS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <social.icon className="h-4 w-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-3">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">
              Legal
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  to="/privacy"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">
              Contact
            </h3>
            <ul className="mt-4 space-y-3">
              <li className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Mail className="h-3 w-3" aria-hidden="true" />
                </span>
                <a
                  href={`mailto:${COMPANY_EMAIL}`}
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  {COMPANY_EMAIL}
                </a>
              </li>
              {PHONE_NUMBERS.map((phone) => (
                <li key={phone} className="flex items-center gap-2.5">
                  <span
                    data-phone-icon
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                  >
                    <Phone className="h-3 w-3" aria-hidden="true" />
                  </span>
                  <a
                    href={toTelHref(phone)}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {phone}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-start gap-2.5">
              <span
                data-pin-icon
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
              >
                <MapPin className="h-3 w-3" aria-hidden="true" />
              </span>
              <address className="text-sm not-italic leading-relaxed text-muted-foreground">
                {COMPANY_ADDRESS_LINES.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-sm text-muted-foreground md:flex-row">
          <p>&copy; {new Date().getFullYear()} Booklynk EV. All rights reserved.</p>
          <p>Made in India, built for the world.</p>
        </div>
      </div>
    </footer>
  );
};
