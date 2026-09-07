import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Facebook, Instagram, Linkedin, Mail, X } from 'lucide-react';
import { PageHero } from '@/components/shared/PageHero';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  leadFormDefaultValues,
  leadFormSchema,
  type LeadFormValues,
} from '@/lib/validation/lead.schema';
import { apiClient, getApiErrorMessage } from '@/lib/api';

const INTEREST_OPTIONS: LeadFormValues['interest'][] = ['Investor', 'Rider', 'Business', 'Other'];

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

export const Contact = () => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: { ...leadFormDefaultValues, interest: 'Other' },
  });

  const selectedInterest = watch('interest');

  const onSubmit = async (values: LeadFormValues) => {
    try {
      await apiClient.post('/leads', values);
      toast.success('Message sent!', {
        description: 'Our team will get back to you shortly.',
      });
      reset({ ...leadFormDefaultValues, interest: 'Other' });
    } catch (error) {
      toast.error('Submission failed', {
        description: getApiErrorMessage(error),
      });
    }
  };

  return (
    <div>
      <PageHero
        eyebrow="Contact"
        title="Get in Touch"
        description="Questions about investing, riding, or partnering your fleet with Booklynk EV? Send us a message."
      />

      <section className="pb-24 sm:pb-32">
        <div className="container">
          <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-5">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="lg:col-span-3 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
            >
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Your Name"
                      {...register('name')}
                      aria-invalid={!!errors.name}
                    />
                    {errors.name && (
                      <p className="text-xs text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Your Phone Number"
                      {...register('phone')}
                      aria-invalid={!!errors.phone}
                    />
                    {errors.phone && (
                      <p className="text-xs text-destructive">{errors.phone.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    {...register('email')}
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="Bengaluru"
                      {...register('city')}
                      aria-invalid={!!errors.city}
                    />
                    {errors.city && (
                      <p className="text-xs text-destructive">{errors.city.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="interest">I'm Interested As</Label>
                    <Select
                      value={selectedInterest}
                      onValueChange={(value) =>
                        setValue('interest', value as LeadFormValues['interest'], {
                          shouldValidate: true,
                        })
                      }
                    >
                      <SelectTrigger id="interest" aria-invalid={!!errors.interest}>
                        <SelectValue placeholder="Select one" />
                      </SelectTrigger>
                      <SelectContent>
                        {INTEREST_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.interest && (
                      <p className="text-xs text-destructive">{errors.interest.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="How can we help?"
                    rows={5}
                    {...register('message')}
                  />
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
              className="lg:col-span-2 space-y-6"
            >
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Mail className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">Email Us</h3>
                <a
                  href="mailto:support@booklynkev.com"
                  className="mt-1 inline-block text-sm text-primary hover:underline"
                >
                  support@booklynkev.com
                </a>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  We typically respond within one business day.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h3 className="font-display text-lg font-semibold">Follow Us</h3>
                <div className="mt-4 flex items-center gap-3">
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
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
