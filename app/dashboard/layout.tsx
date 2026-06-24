import Sidebar from '@/components/layout/Sidebar';
import { UnitProvider } from '@/contexts/UnitContext';
import { FormasPagamentoProvider } from '@/contexts/FormasPagamentoContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <UnitProvider>
      <FormasPagamentoProvider>
        <div className="flex h-full bg-gray-50">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {children}
          </div>
        </div>
      </FormasPagamentoProvider>
    </UnitProvider>
  );
}
