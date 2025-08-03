import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import BusinessLogo from "@/components/shared/business-logo";

export default function Header() {
  const { user, logout } = useAuth();

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin Portal';
      case 'employee':
        return 'Employee Portal';
      case 'family':
        return 'Family Portal';
      default:
        return 'Portal';
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-brand-gold/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BusinessLogo size="sm" variant="light" showText={true} />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-600">
                {user ? getRoleDisplayName(user.role) : 'Portal'}
              </span>
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User className="text-white text-sm" />
              </div>
              <span className="text-sm font-medium text-slate-900">
                {user?.username || 'User'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-slate-400 hover:text-slate-600"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
