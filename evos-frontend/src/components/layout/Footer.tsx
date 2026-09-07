import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, X } from 'lucide-react';
import logo from '@/assets/logo-full.webp';

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
  return (
    <footer id="footer" className="border-t border-border bg-card">
      <div className="container py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
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
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-sm text-muted-foreground md:flex-row">
          <p>&copy; {new Date().getFullYear()} Booklynk EV. All rights reserved.</p>
          <p>Made in India, built for the world.</p>
        </div>
      </div>
    </footer>
  );
};
