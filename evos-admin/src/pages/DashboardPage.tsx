import { useState } from 'react';
import { LogOut, Users, CreditCard, Landmark } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { LeadsTab } from '@/components/tabs/LeadsTab';
import { PaymentsTab } from '@/components/tabs/PaymentsTab';
import { BankTransfersTab } from '@/components/tabs/BankTransfersTab';

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
      <header className="border-b border-border">
        <div className="container flex items-center justify-between py-4">
          <h1 className="font-display text-lg font-semibold">
            Booklynk EV <span className="text-evos-green">Admin</span>
          </h1>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </header>

      <main className="container py-6">
        <div className="mb-6 flex gap-2 border-b border-border">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                activeTab === id
                  ? 'border-evos-green text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
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
