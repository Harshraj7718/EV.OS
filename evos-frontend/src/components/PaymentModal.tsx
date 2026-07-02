import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { CheckCircle2, Loader2, ShieldCheck, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePaymentModal } from '@/context/PaymentModalContext';
import {
  paymentFormDefaultValues,
  paymentFormSchema,
  type PaymentFormValues,
} from '@/lib/validation/payment.schema';
import { formatINR } from '@/lib/plans';
import { apiClient, getApiErrorMessage } from '@/lib/api';
import type { RazorpayCheckoutResponse } from '@/types/razorpay';

interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  name: string;
  email: string;
  phone: string;
  plan: string;
  investmentAmount: number;
}

type PaymentStep = 'form' | 'success' | 'failure';

export const PaymentModal = () => {
  const { isOpen, selectedPlan, closePaymentModal } = usePaymentModal();
  const [step, setStep] = useState<PaymentStep>('form');
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: paymentFormDefaultValues,
  });

  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setIsProcessing(false);
      reset(paymentFormDefaultValues);
    }
  }, [isOpen, reset]);

  const handleClose = () => {
    closePaymentModal();
  };

  const handleRetry = () => {
    setStep('form');
  };

  const onSubmit = async (values: PaymentFormValues) => {
    if (!selectedPlan) return;

    if (typeof window.Razorpay === 'undefined') {
      toast.error('Payment gateway failed to load', {
        description: 'Please refresh the page and try again.',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { data } = await apiClient.post<{ data: CreateOrderResponse }>(
        '/payment/create-order',
        {
          name: values.name,
          email: values.email,
          phone: values.phone,
          plan: selectedPlan.id,
        }
      );
      const order = data.data;

      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'EV.OS',
        description: `${selectedPlan.name} — ${selectedPlan.scooters}`,
        order_id: order.orderId,
        prefill: {
          name: order.name,
          email: order.email,
          contact: order.phone,
        },
        theme: {
          color: '#00E676',
        },
        handler: (response: RazorpayCheckoutResponse) => {
          void verifyPayment(response);
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
      });

      razorpay.on('payment.failed', () => {
        setIsProcessing(false);
        setStep('failure');
      });

      razorpay.open();
    } catch (error) {
      setIsProcessing(false);
      toast.error('Could not start payment', {
        description: getApiErrorMessage(error),
      });
    }
  };

  const verifyPayment = async (response: RazorpayCheckoutResponse) => {
    try {
      await apiClient.post('/payment/verify', response);
      setStep('success');
      toast.success('Payment successful!', {
        description: 'Welcome to the EV.OS investor community.',
      });
    } catch (error) {
      setStep('failure');
      toast.error('Payment verification failed', {
        description: getApiErrorMessage(error),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!selectedPlan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        {step === 'form' && (
          <>
            <DialogHeader>
              <DialogTitle>Complete Your Investment</DialogTitle>
              <DialogDescription>
                You&apos;re investing in the {selectedPlan.name}. Fill in your details to proceed
                to secure checkout.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-muted/50 p-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Selected Plan
                </p>
                <p className="mt-1 font-display font-semibold">{selectedPlan.name}</p>
                <p className="text-xs text-muted-foreground">{selectedPlan.scooters}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Investment Amount
                </p>
                <p className="mt-1 font-display text-lg font-bold text-primary">
                  {formatINR(selectedPlan.investment)}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="payment-name">Customer Name</Label>
                <Input
                  id="payment-name"
                  placeholder="Aarav Sharma"
                  {...register('name')}
                  aria-invalid={!!errors.name}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="payment-email">Email</Label>
                <Input
                  id="payment-email"
                  type="email"
                  placeholder="you@example.com"
                  {...register('email')}
                  aria-invalid={!!errors.email}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="payment-phone">Phone Number</Label>
                <Input
                  id="payment-phone"
                  type="tel"
                  placeholder="9876543210"
                  {...register('phone')}
                  aria-invalid={!!errors.phone}
                />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    Proceed to Payment
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Secured by Razorpay · Test Mode
              </p>
            </form>
          </>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center py-4 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
            </span>
            <h2 className="mt-6 font-display text-2xl font-bold">🎉 Payment Successful!</h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Thank you for choosing EV.OS. Our team will contact you shortly regarding your
              investment.
            </p>
            <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() =>
                  toast.info('Receipt download coming soon', {
                    description: 'This feature will be available shortly.',
                  })
                }
              >
                Download Receipt
              </Button>
              <Button size="lg" className="w-full" onClick={handleClose}>
                Go to Home
              </Button>
            </div>
          </div>
        )}

        {step === 'failure' && (
          <div className="flex flex-col items-center py-4 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <XCircle className="h-9 w-9" aria-hidden="true" />
            </span>
            <h2 className="mt-6 font-display text-2xl font-bold">Payment Failed</h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Please try again.
            </p>
            <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
              <Button variant="outline" size="lg" className="w-full" onClick={handleClose}>
                Cancel
              </Button>
              <Button size="lg" className="w-full" onClick={handleRetry}>
                Retry Payment
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
