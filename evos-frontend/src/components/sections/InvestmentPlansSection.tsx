import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, TrendingUp } from 'lucide-react';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { INVESTMENT_PLANS, formatINR } from '@/lib/plans';
import { usePaymentModal } from '@/context/PaymentModalContext';
import { useLeadModal } from '@/context/LeadModalContext';
import { cn } from '@/lib/utils';

const CONTRACT_YEAR_OPTIONS = [1, 2, 3, 5];

const formatSignedINR = (amount: number): string => {
  const rounded = Math.round(amount);
  return rounded < 0 ? `-${formatINR(Math.abs(rounded))}` : formatINR(rounded);
};

export const InvestmentPlansSection = () => {
  const { openPaymentModal } = usePaymentModal();
  const { openModal } = useLeadModal();
  const [contractYears, setContractYears] = useState(3);

  return (
    <section id="pricing" className="border-y border-border bg-muted/30 py-24 sm:py-32">
      <div className="container">
        <SectionHeading
          eyebrow="Investment Plans"
          title="Choose Your EV Investment Plan"
          description="Select the fleet size that matches your investment goals."
        />

        <div className="mx-auto mt-10 flex max-w-xs flex-col items-center gap-2">
          <label
            htmlFor="contract-years"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Return on Investment — Contract Duration
          </label>
          <Select
            value={String(contractYears)}
            onValueChange={(value) => setContractYears(Number(value))}
          >
            <SelectTrigger id="contract-years" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONTRACT_YEAR_OPTIONS.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year} {year === 1 ? 'Year' : 'Years'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {INVESTMENT_PLANS.map((plan, index) => {
            const totalReturns = plan.monthlyRental * 12 * contractYears;
            const roiPercent = (totalReturns / plan.investment) * 100;
            const netProfit = totalReturns - plan.investment;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: index * 0.12, ease: 'easeOut' }}
                whileHover={{ y: -8 }}
                className={cn(
                  'relative flex flex-col overflow-hidden rounded-2xl border bg-card p-8 shadow-sm transition-shadow hover:shadow-xl',
                  plan.highlighted
                    ? 'border-primary/50 shadow-lg shadow-primary/10 hover:shadow-primary/20'
                    : 'border-border hover:shadow-primary/10'
                )}
              >
                {plan.highlighted && (
                  <span className="absolute right-6 top-6 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Most Popular
                  </span>
                )}

                <h3 className="font-display text-2xl font-bold">{plan.name}</h3>
                <p className="mt-1 text-sm font-semibold text-primary">{plan.scooters}</p>

                <div className="mt-6">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Investment
                  </p>
                  <p className="font-display text-3xl font-bold sm:text-4xl">
                    {formatINR(plan.investment)}
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-4 py-3">
                  <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span className="text-sm">
                    Monthly Rental:{' '}
                    <span className="font-semibold">{formatINR(plan.monthlyRental)}</span>
                  </span>
                </div>

                <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                    <TrendingUp className="h-4 w-4" aria-hidden="true" />
                    ROI over {contractYears} {contractYears === 1 ? 'Year' : 'Years'}
                  </div>
                  <p className="mt-1 font-display text-2xl font-bold text-primary">
                    {roiPercent.toFixed(0)}%
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Total Returns: {formatINR(Math.round(totalReturns))} · Net{' '}
                    {netProfit >= 0 ? 'Profit' : 'Shortfall'}: {formatSignedINR(netProfit)}
                  </p>
                </div>

                <Button
                  size="lg"
                  className="mt-8 w-full"
                  variant={plan.highlighted ? 'default' : 'outline'}
                  onClick={() => openPaymentModal(plan)}
                >
                  {plan.buttonLabel}
                </Button>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
          className="mx-auto mt-8 max-w-3xl rounded-2xl border border-dashed border-primary/40 bg-card p-8 text-center"
        >
          <h3 className="font-display text-2xl font-bold">Need a Custom Fleet?</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Looking for a customized fleet size? We provide flexible investment plans tailored to
            your business needs.
          </p>
          <p className="mt-4 text-sm font-semibold text-primary">Upto Rs.4500 per Scooty</p>
          <Button size="lg" variant="outline" className="mt-6" onClick={() => openModal('Investor')}>
            Contact Sales
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
