import { useState } from 'react';
import { BarChart2, ShoppingCart, Layers, Settings, TrendingUp, AlertTriangle, Package, Activity, Calendar, DollarSign, Truck, ClipboardList } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
  { id: 'forecast', label: 'Forecast Engine', icon: TrendingUp },
  { id: 'purchasing', label: 'Purchasing', icon: ShoppingCart },
  { id: 'stock-input', label: 'Stock Input', icon: Package },
  { id: 'sales-global', label: 'Sales Global', icon: DollarSign },
  { id: 'deliveries', label: 'Deliveries', icon: Truck },
  { id: 'pending-pos', label: 'Pending POs', icon: ClipboardList },
  { id: 'new-deals', label: 'New Deals', icon: Activity },
  { id: 'lost-orders', label: 'Lost Orders', icon: AlertTriangle },
  { id: 'stock-health', label: 'Stock Health', icon: Layers },
  { id: 'seasonality', label: 'Seasonality', icon: Calendar },
  { id: 'product-setup', label: 'Product Setup', icon: Settings },
];

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
}

export function Layout({ children, activePage, onNavigate }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-14' : 'w-56'} bg-gray-900 text-white flex flex-col transition-all duration-200 flex-shrink-0`}>
        <div className="flex items-center justify-between p-3 border-b border-gray-700">
          {!collapsed && (
            <div>
              <div className="text-sm font-bold text-white">MKU/MKS</div>
              <div className="text-xs text-gray-400">Stock Forecast</div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={16} className="flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
