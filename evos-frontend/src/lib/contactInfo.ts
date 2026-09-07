export const COMPANY_EMAIL = 'Booklynkev@gmail.com';

export const PHONE_NUMBERS = ['+91 99342 72425', '+91 86375 03871'];

export const toTelHref = (phone: string): string => `tel:${phone.replace(/[^\d+]/g, '')}`;

export const COMPANY_ADDRESS_LINES = [
  'Plot No. A4, Logix Technova,',
  'B-320, Sector-132,',
  'Noida, Gautam Buddha Nagar,',
  'Uttar Pradesh - 201304',
];
