import { useState } from "react";
import Header from "@/components/shared/header";
import Sidebar from "@/components/admin/sidebar";
import CalendarTab from "@/components/admin/calendar-tab";
import CrmTab from "@/components/admin/crm-tab";
import PatientsTab from "@/components/admin/patients-tab";
import EmployeesTab from "@/components/admin/employees-tab";
import AccessTab from "@/components/admin/access-tab";
import ChatTab from "@/components/admin/chat-tab";
import PrintTab from "@/components/admin/print-tab";
import PayrollTab from "@/components/admin/payroll-tab";
import ReviewTab from "@/components/admin/review-tab";
import TestingDashboard from "@/components/testing/testing-dashboard";

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState('calendar');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'calendar':
        return <CalendarTab />;
      case 'crm':
        return <CrmTab />;
      case 'patients':
        return <PatientsTab />;
      case 'employees':
        return <EmployeesTab />;
      case 'access':
        return <AccessTab />;
      case 'chat':
        return <ChatTab />;
      case 'print':
        return <PrintTab />;
      case 'payroll':
        return <PayrollTab />;
      case 'review':
        return <ReviewTab />;
      case 'testing':
        return <TestingDashboard />;
      default:
        return <CalendarTab />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="flex h-screen bg-slate-50">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 overflow-auto">
          {renderActiveTab()}
        </div>
      </div>
    </div>
  );
}
