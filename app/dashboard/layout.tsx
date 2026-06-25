import Sidebar from '@/components/layout/Sidebar';
import { UnitProvider } from '@/contexts/UnitContext';
import { FormasPagamentoProvider } from '@/contexts/FormasPagamentoContext';
import { PermissoesProvider } from '@/contexts/PermissoesContext';
import { MetasProvider } from '@/contexts/MetasContext';
import { DateRangeProvider } from '@/contexts/DateRangeContext';
import { SidebarProvider } from '@/contexts/SidebarContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <PermissoesProvider>
      <MetasProvider>
        <DateRangeProvider>
          <UnitProvider>
            <FormasPagamentoProvider>
              <SidebarProvider>
                <div className="flex h-full bg-gray-50">
                  <Sidebar />
                  <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {children}
                  </div>
                </div>
              </SidebarProvider>
            </FormasPagamentoProvider>
          </UnitProvider>
        </DateRangeProvider>
      </MetasProvider>
    </PermissoesProvider>
  );
}
