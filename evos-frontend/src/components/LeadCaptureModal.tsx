import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useLeadModal } from '@/context/LeadModalContext';
import { leadFormDefaultValues, leadFormSchema, type LeadFormValues } from '@/lib/validation/lead.schema';
import { apiClient, getApiErrorMessage } from '@/lib/api';

const INTEREST_OPTIONS: LeadFormValues['interest'][] = ['Investor', 'Rider', 'Business', 'Other'];

export const LeadCaptureModal = () => {
  const { isOpen, defaultInterest, closeModal } = useLeadModal();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: leadFormDefaultValues,
  });

  useEffect(() => {
    if (isOpen) {
      reset({ ...leadFormDefaultValues, interest: defaultInterest });
    }
  }, [isOpen, defaultInterest, reset]);

  const selectedInterest = watch('interest');

  const onSubmit = async (values: LeadFormValues) => {
    try {
      await apiClient.post('/leads', values);
      toast.success("You're on the list!", {
        description: "Our team will reach out to you shortly. Welcome to Booklynk EV.",
      });
      reset(leadFormDefaultValues);
      closeModal();
    } catch (error) {
      toast.error('Submission failed', {
        description: getApiErrorMessage(error),
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join the Booklynk EV Ecosystem</DialogTitle>
          <DialogDescription>
            Tell us a little about yourself and we&apos;ll get you started on the EV Operating
            System.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="Aarav Sharma" {...register('name')} aria-invalid={!!errors.name} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="9876543210"
                {...register('phone')}
                aria-invalid={!!errors.phone}
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
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
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input id="city" placeholder="Bengaluru" {...register('city')} aria-invalid={!!errors.city} />
              {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="interest">Interested As</Label>
              <Select
                value={selectedInterest}
                onValueChange={(value) => setValue('interest', value as LeadFormValues['interest'], { shouldValidate: true })}
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
              {errors.interest && <p className="text-xs text-destructive">{errors.interest.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="budget">Budget (Optional)</Label>
            <Input id="budget" placeholder="e.g. ₹2L - ₹5L" {...register('budget')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea id="message" placeholder="Tell us more about your goals..." {...register('message')} />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
