'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, CreditCard, PackagePlus, PieChart, Info, Menu } from 'lucide-react';
import { useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const links = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Register Firm', href: '/register-company', icon: Users },
    { name: 'Add Purchase', href: '/add-purchase', icon: PackagePlus },
    { name: 'Add Transaction', href: '/add-transaction', icon: CreditCard },
    { name: 'Analytics', href: '/analytics', icon: PieChart },
  ];

  return (
    <div className={`bg-white border-r border-gray-200 h-screen sticky top-0 transition-all duration-300 flex flex-col ${collapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        {!collapsed && <span className="font-bold text-lg text-gray-800 tracking-tight">Expense Tracker</span>}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors mx-auto">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
                isActive 
                  ? 'bg-blue-50 text-blue-700 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              title={collapsed ? link.name : ''}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
              {!collapsed && <span>{link.name}</span>}
            </Link>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-gray-100">
        <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
          <Info className="w-5 h-5" />
          {!collapsed && <span className="text-sm">Help & Support</span>}
        </Link>
      </div>
    </div>
  );
}
