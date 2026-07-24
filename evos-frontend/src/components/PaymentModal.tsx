import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Building2,
  CheckCircle2,
  Copy,
  Loader2,
  ShieldCheck,
  Upload,
  XCircle,
} from 'lucide-react';
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
import type { BankTransferDetails } from '@/types/bankTransfer';

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

type PaymentStep = 'form' | 'method-choice' | 'bank-transfer' | 'success' | 'failure';
type SuccessVariant = 'razorpay' | 'bank-transfer';

const MAX_INVOICE_BYTES = 5 * 1024 * 1024;
const ALLOWED_INVOICE_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

export const PaymentModal = () => {
  const { isOpen, selectedPlan, closePaymentModal } = usePaymentModal();
  const [step, setStep] = useState<PaymentStep>('form');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successVariant, setSuccessVariant] = useState<SuccessVariant>('razorpay');
  const [customerDetails, setCustomerDetails] = useState<PaymentFormValues | null>(null);
  const [bankDetails, setBankDetails] = useState<BankTransferDetails | null>(null);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

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
      setCustomerDetails(null);
      setBankDetails(null);
      setInvoiceFile(null);
      setInvoiceError(null);
      reset(paymentFormDefaultValues);
    }
  }, [isOpen, reset]);

  const handleClose = () => {
    closePaymentModal();
  };

  const handleRetry = () => {
    setStep(selectedPlan?.id === 'Enterprise' ? 'method-choice' : 'form');
  };

  const startRazorpayCheckout = async (values: PaymentFormValues) => {
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
        name: 'Booklynk EV',
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
        setSuccessVariant('razorpay');
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
      setSuccessVariant('razorpay');
      setStep('success');
      toast.success('Payment successful!', {
        description: 'Welcome to the Booklynk EV investor community.',
      });
    } catch (error) {
      setSuccessVariant('razorpay');
      setStep('failure');
      toast.error('Payment verification failed', {
        description: getApiErrorMessage(error),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const onSubmitDetails = async (values: PaymentFormValues) => {
    if (selectedPlan?.id === 'Enterprise') {
      setCustomerDetails(values);
      setStep('method-choice');
      return;
    }
    await startRazorpayCheckout(values);
  };

  const openBankTransferStep = async () => {
    setStep('bank-transfer');
    if (bankDetails) return;
    try {
      const { data } = await apiClient.get<{ data: BankTransferDetails }>('/bank-transfer/details');
      setBankDetails(data.data);
    } catch (error) {
      toast.error('Could not load bank details', {
        description: getApiErrorMessage(error),
      });
    }
  };

  const handleInvoiceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setInvoiceError(null);

    if (!file) {
      setInvoiceFile(null);
      return;
    }
    if (!ALLOWED_INVOICE_TYPES.includes(file.type)) {
      setInvoiceError('Invoice must be a PDF, JPG, or PNG file.');
      setInvoiceFile(null);
      return;
    }
    if (file.size > MAX_INVOICE_BYTES) {
      setInvoiceError('Invoice file must be 5MB or smaller.');
      setInvoiceFile(null);
      return;
    }
    setInvoiceFile(file);
  };

  const copyToClipboard = (value: string, label: string) => {
    navigator.clipboard
      .writeText(value)
      .then(() => toast.success(`${label} copied`))
      .catch(() => toast.error('Could not copy to clipboard'));
  };

  const submitBankTransfer = async () => {
    if (!selectedPlan || !customerDetails) return;
    if (!invoiceFile) {
      setInvoiceError('Please attach your payment invoice/receipt.');
      return;
    }

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('name', customerDetails.name);
      formData.append('email', customerDetails.email);
      formData.append('phone', customerDetails.phone);
      formData.append('plan', selectedPlan.id);
      formData.append('invoice', invoiceFile);

      await apiClient.post('/bank-transfer', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccessVariant('bank-transfer');
      setStep('success');
      toast.success('Invoice submitted!', {
        description: 'Our team will verify your payment shortly.',
      });
    } catch (error) {
      setSuccessVariant('bank-transfer');
      setStep('failure');
      toast.error('Could not submit invoice', {
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

            <form onSubmit={handleSubmit(onSubmitDetails)} className="space-y-4" noValidate>
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
                  placeholder="Your Phone Number"
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
                    {selectedPlan.id === 'Enterprise' ? 'Continue' : 'Proceed to Payment'}
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">Secured by Razorpay</p>
            </form>
          </>
        )}

        {step === 'method-choice' && customerDetails && (
          <>
            <DialogHeader>
              <DialogTitle>Choose Payment Method</DialogTitle>
              <DialogDescription>
                Investing {formatINR(selectedPlan.investment)} in the {selectedPlan.name}. How
                would you like to pay?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => void startRazorpayCheckout(customerDetails)}
                disabled={isProcessing}
                className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary disabled:opacity-50"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-display font-semibold">Pay via Razorpay</span>
                  <span className="block text-xs text-muted-foreground">
                    Cards, UPI, netbanking — instant confirmation
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => void openBankTransferStep()}
                disabled={isProcessing}
                className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary disabled:opacity-50"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-display font-semibold">Pay via Bank Transfer</span>
                  <span className="block text-xs text-muted-foreground">
                    NEFT/RTGS/UPI, then upload your payment invoice
                  </span>
                </span>
              </button>
            </div>
          </>
        )}

        {step === 'bank-transfer' && (
          <>
            <DialogHeader>
              <DialogTitle>Bank Transfer</DialogTitle>
              <DialogDescription>
                Transfer {formatINR(selectedPlan.investment)} to the account below, then upload
                your payment invoice or receipt.
              </DialogDescription>
            </DialogHeader>

            {!bankDetails ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3 rounded-xl border border-border bg-muted/50 p-4">
                  {[
                    { label: 'Account Holder', value: bankDetails.accountHolderName },
                    { label: 'Account Number', value: bankDetails.accountNumber },
                    { label: 'IFSC Code', value: bankDetails.ifscCode },
                    { label: 'Account Type', value: bankDetails.accountType },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          {row.label}
                        </p>
                        <p className="font-display text-sm font-semibold">{row.value}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Copy ${row.label}`}
                        onClick={() => copyToClipboard(row.value, row.label)}
                      >
                        <Copy className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="invoice-upload">Upload Payment Invoice / Receipt</Label>
                  <label
                    htmlFor="invoice-upload"
                    className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-6 text-center transition-colors hover:border-primary"
                  >
                    <Upload className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    <span className="text-sm text-muted-foreground">
                      {invoiceFile ? invoiceFile.name : 'PDF, JPG, or PNG — up to 5MB'}
                    </span>
                    <input
                      id="invoice-upload"
                      type="file"
                      accept="application/pdf,image/jpeg,image/jpg,image/png"
                      className="sr-only"
                      onChange={handleInvoiceChange}
                    />
                  </label>
                  {invoiceError && <p className="text-xs text-destructive">{invoiceError}</p>}
                </div>

                <Button
                  size="lg"
                  className="w-full"
                  disabled={isProcessing}
                  onClick={() => void submitBankTransfer()}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Invoice'
                  )}
                </Button>
              </div>
            )}
          </>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center py-4 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
            </span>
            {successVariant === 'razorpay' ? (
              <>
                <h2 className="mt-6 font-display text-2xl font-bold">🎉 Payment Successful!</h2>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  Thank you for choosing Booklynk EV. Our team will contact you shortly regarding
                  your investment.
                </p>
              </>
            ) : (
              <>
                <h2 className="mt-6 font-display text-2xl font-bold">Invoice Received</h2>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  Thank you for choosing Booklynk EV. Our team will verify your bank transfer and
                  confirm your investment shortly.
                </p>
              </>
            )}
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
            <h2 className="mt-6 font-display text-2xl font-bold">
              {successVariant === 'bank-transfer' ? 'Submission Failed' : 'Payment Failed'}
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Please try again.
            </p>
            <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
              <Button variant="outline" size="lg" className="w-full" onClick={handleClose}>
                Cancel
              </Button>
              <Button size="lg" className="w-full" onClick={handleRetry}>
                Retry
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
