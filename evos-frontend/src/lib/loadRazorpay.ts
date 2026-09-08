const RAZORPAY_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

let razorpayPromise: Promise<void> | null = null;

export const loadRazorpayScript = (): Promise<void> => {
  if (typeof window !== 'undefined' && window.Razorpay) {
    return Promise.resolve();
  }
  if (razorpayPromise) return razorpayPromise;

  razorpayPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = RAZORPAY_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      razorpayPromise = null;
      reject(new Error('Failed to load the Razorpay checkout script'));
    };
    document.body.appendChild(script);
  });

  return razorpayPromise;
};
