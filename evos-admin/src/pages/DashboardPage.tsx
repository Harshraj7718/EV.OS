import { useState } from 'react';
import { LogOut, Users, CreditCard, Landmark } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { LeadsTab } from '@/components/tabs/LeadsTab';
import { PaymentsTab } from '@/components/tabs/PaymentsTab';
import { BankTransfersTab } from '@/components/tabs/BankTransfersTab';
import logo from '@/assets/logo-full.webp';

type TabId = 'leads' | 'payments' | 'bank-transfers';

const TABS: { id: TabId; label: string; icon: typeof Users }[] = [
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'bank-transfers', label: 'Bank Transfers', icon: Landmark },
];

export function DashboardPage() {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('leads');

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between py-3.5">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center rounded-md bg-white/95 px-2 py-1">
              <img src={logo} alt="Booklynk EV" className="h-5 w-auto" />
            </div>
            <span className="hidden h-5 w-px bg-border sm:block" aria-hidden="true" />
            <span className="hidden font-display text-sm font-medium text-muted-foreground sm:block">
              Admin Portal
            </span>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </header>

      <main className="container py-8">
        <div className="mb-6 inline-flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                activeTab === id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'leads' && <LeadsTab />}
        {activeTab === 'payments' && <PaymentsTab />}
        {activeTab === 'bank-transfers' && <BankTransfersTab />}
      </main>
    </div>
  );
}
