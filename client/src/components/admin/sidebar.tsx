import { useState } from "react";
import { 
  Calendar, 
  Users, 
  UserX, 
  UserPlus, 
  Key, 
  MessageCircle, 
  Printer, 
  DollarSign, 
  Star,
  TestTube2
} from "lucide-react";
import BusinessLogo from "@/components/shared/business-logo";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navigation = [
  { name: 'Calendar', href: 'calendar', icon: Calendar },
  { name: 'CRM', href: 'crm', icon: Users },
  { name: 'Patients', href: 'patients', icon: UserX },
  { name: 'Employees', href: 'employees', icon: UserPlus },
  { name: 'Access', href: 'access', icon: Key },
  { name: 'Chat', href: 'chat', icon: MessageCircle },
  { name: 'Print', href: 'print', icon: Printer },
  { name: 'Payroll', href: 'payroll', icon: DollarSign },
  { name: 'Review', href: 'review', icon: Star },
  { name: 'Testing', href: 'testing', icon: TestTube2 },
];

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <div className="w-64 bg-white shadow-lg border-r border-brand-gold/20 relative">
      {/* Logo at the top */}
      <div className="p-4 border-b border-brand-gold/10">
        <BusinessLogo size="sm" variant="light" showText={true} />
      </div>
      <nav className="mt-5 px-3">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = activeTab === item.href;
            return (
              <button
                key={item.name}
                onClick={() => onTabChange(item.href)}
                className={`
                  w-full sidebar-nav-item
                  ${isActive ? 'active' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                `}
              >
                <item.icon className={`sidebar-nav-icon ${isActive ? 'text-white' : ''}`} size={20} />
                {item.name}
              </button>
            );
          })}
        </div>
      </nav>
      
      {/* Portal Switcher */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
        <div className="space-y-2">
          <button className="w-full bg-slate-100 text-slate-700 px-3 py-2 text-sm rounded-md hover:bg-slate-200 transition-colors">
            <i className="fas fa-exchange-alt mr-2"></i>
            Switch to Employee Portal
          </button>
          <button className="w-full bg-slate-100 text-slate-700 px-3 py-2 text-sm rounded-md hover:bg-slate-200 transition-colors">
            <i className="fas fa-exchange-alt mr-2"></i>
            Switch to Family Portal
          </button>
        </div>
      </div>
    </div>
  );
}
