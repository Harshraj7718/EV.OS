export type PlanId = 'Starter' | 'Growth' | 'Enterprise';

export interface InvestmentPlan {
  id: PlanId;
  name: string;
  scooters: string;
  investment: number;
  monthlyRental: number;
  buttonLabel: string;
  highlighted?: boolean;
}

export const INVESTMENT_PLANS: InvestmentPlan[] = [
  {
    id: 'Starter',
    name: 'Starter Plan',
    scooters: '2 Scooters',
    investment: 140000,
    monthlyRental: 7000,
    buttonLabel: 'Get Started',
  },
  {
    id: 'Growth',
    name: 'Growth Plan',
    scooters: '5 Scooters',
    investment: 350000,
    monthlyRental: 18000,
    buttonLabel: 'Choose Plan',
    highlighted: true,
  },
  {
    id: 'Enterprise',
    name: 'Enterprise Plan',
    scooters: '10 Scooters',
    investment: 700000,
    monthlyRental: 40000,
    buttonLabel: 'Invest Now',
  },
];

export const formatINR = (amount: number): string =>
  `₹${amount.toLocaleString('en-IN')}`;
