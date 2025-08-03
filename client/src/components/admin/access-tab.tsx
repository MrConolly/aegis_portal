import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { User, Key, UserPlus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  userId?: string;
  isActive: boolean;
}

interface FamilyMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  patientId: string;
  userId?: string;
  isActive: boolean;
}

interface Patient {
  id: string;
  name: string;
}

interface UserAccess {
  userId: string;
  username: string;
  hasAccess: boolean;
  hasAdminAccess?: boolean;
}

export default function AccessTab() {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
    queryFn: () => apiGet<Employee[]>('/api/employees'),
  });

  const { data: familyMembers = [] } = useQuery({
    queryKey: ['/api/family-members'],
    queryFn: () => apiGet<FamilyMember[]>('/api/family-members'),
    refetchInterval: 5000, // Refresh every 5 seconds to catch new family members
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['/api/patients'],
    queryFn: () => apiGet<Patient[]>('/api/patients'),
  });

  const updateAccessMutation = useMutation({
    mutationFn: ({ userId, hasAccess, hasAdminAccess }: { userId: string; hasAccess: boolean; hasAdminAccess?: boolean }) =>
      apiPut(`/api/users/${userId}`, { hasAccess, hasAdminAccess }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      queryClient.invalidateQueries({ queryKey: ['/api/family-members'] });
      toast({
        title: "Success",
        description: "Access updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const provideCredentialsMutation = useMutation({
    mutationFn: ({ userId, email, username, password }: { userId: string; email: string; username: string; password: string }) =>
      apiPost(`/api/users/${userId}/send-access`, { email, username, password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      queryClient.invalidateQueries({ queryKey: ['/api/family-members'] });
      setIsCredentialsDialogOpen(false);
      setCredentials({ username: '', password: '' });
      toast({
        title: "Success",
        description: "Credentials provided and email sent successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient?.name || 'Unknown Patient';
  };

  const handleToggleEmployeeAccess = (employeeId: string, hasAccess: boolean) => {
    const employee = employees.find(e => e.id === employeeId);
    if (employee?.userId) {
      updateAccessMutation.mutate({
        userId: employee.userId,
        hasAccess,
      });
    }
  };

  const handleToggleAdminAccess = (employeeId: string, hasAdminAccess: boolean) => {
    const employee = employees.find(e => e.id === employeeId);
    if (employee?.userId) {
      updateAccessMutation.mutate({
        userId: employee.userId,
        hasAccess: true, // Keep employee access enabled
        hasAdminAccess,
      });
    }
  };

  const handleToggleFamilyAccess = (familyMemberId: string, hasAccess: boolean) => {
    const familyMember = familyMembers.find(fm => fm.id === familyMemberId);
    if (familyMember?.userId) {
      updateAccessMutation.mutate({
        userId: familyMember.userId,
        hasAccess,
      });
    }
  };

  const handleProvideCredentials = (userId: string, userType: 'employee' | 'family') => {
    setSelectedUser(userId);
    setIsCredentialsDialogOpen(true);
  };

  const submitCredentials = () => {
    if (!selectedUser || !credentials.username || !credentials.password) {
      toast({
        title: "Error",
        description: "Please provide both username and password",
        variant: "destructive",
      });
      return;
    }

    // Find the email for this user
    const employee = employees.find(e => e.userId === selectedUser);
    const familyMember = familyMembers.find(fm => fm.userId === selectedUser);
    const userEmail = employee?.email || familyMember?.email;

    if (!userEmail) {
      toast({
        title: "Error",
        description: "No email found for this user",
        variant: "destructive",
      });
      return;
    }

    provideCredentialsMutation.mutate({
      userId: selectedUser,
      email: userEmail,
      username: credentials.username,
      password: credentials.password,
    });
  };

  // Stats calculation
  const activeEmployees = employees.filter(e => e.isActive).length;
  const activeFamilyMembers = familyMembers.filter(fm => fm.isActive).length;
  const pendingAccess = employees.filter(e => e.isActive && !e.userId).length + 
                       familyMembers.filter(fm => fm.isActive && !fm.userId).length;

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Management</h2>
          <p className="text-slate-600">Manage portal access for employees and family members</p>
        </div>

        {/* Access Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="stat-card-icon bg-blue-100">
                <UserPlus className="text-primary" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Active Employees</p>
                <p className="text-2xl font-semibold text-slate-900">{activeEmployees}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="stat-card-icon bg-green-100">
                <Users className="text-secondary-healthcare" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Family Members</p>
                <p className="text-2xl font-semibold text-slate-900">{activeFamilyMembers}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="stat-card-icon bg-yellow-100">
                <Key className="text-warning-healthcare" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Pending Access</p>
                <p className="text-2xl font-semibold text-slate-900">{pendingAccess}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="employees" className="space-y-6">
          <TabsList>
            <TabsTrigger value="employees">Employee Access</TabsTrigger>
            <TabsTrigger value="family">Family Access</TabsTrigger>
          </TabsList>

          {/* Employee Access Tab */}
          <TabsContent value="employees">
            <Card>
              <CardHeader>
                <CardTitle>Employee Portal Access</CardTitle>
                <p className="text-sm text-slate-600">Manage employee access to their portal and admin privileges</p>
              </CardHeader>
              
              <CardContent className="p-0">
                <div className="divide-y divide-slate-200">
                  {employees.map((employee) => (
                    <div key={employee.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                            <User className="text-slate-400" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-slate-900">{employee.name}</h4>
                            <p className="text-xs text-slate-500">{employee.email} | {employee.phone}</p>
                            <p className="text-xs text-slate-500">Position: {employee.position}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-slate-600">Employee Portal</span>
                            <Switch
                              checked={employee.isActive && !!employee.userId}
                              onCheckedChange={(checked) => handleToggleEmployeeAccess(employee.id, checked)}
                              disabled={!employee.isActive}
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-slate-600">Admin Access</span>
                            <Switch
                              checked={false} // This would come from user data
                              onCheckedChange={(checked) => handleToggleAdminAccess(employee.id, checked)}
                              disabled={!employee.userId}
                            />
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleProvideCredentials(employee.userId || '', 'employee')}
                            disabled={!employee.userId}
                          >
                            Provide Credentials
                          </Button>
                        </div>
                      </div>
                      {employee.userId && (
                        <div className="mt-3 bg-slate-50 rounded-md p-3">
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="font-medium text-slate-600">Username:</span>
                              <span className="text-slate-900 ml-1">{employee.email}</span>
                            </div>
                            <div>
                              <span className="font-medium text-slate-600">Status:</span>
                              <Badge className="ml-1 status-badge active">Active</Badge>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Family Access Tab */}
          <TabsContent value="family">
            <Card>
              <CardHeader>
                <CardTitle>Family Portal Access</CardTitle>
                <p className="text-sm text-slate-600">Manage family member access to patient information</p>
              </CardHeader>
              
              <CardContent className="p-0">
                <div className="divide-y divide-slate-200">
                  {familyMembers.map((familyMember) => (
                    <div key={familyMember.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                            <User className="text-slate-400" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-slate-900">{familyMember.name}</h4>
                            <p className="text-xs text-slate-500">{familyMember.email} | {familyMember.phone}</p>
                            <p className="text-xs text-slate-500">Family of: {getPatientName(familyMember.patientId)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-slate-600">Family Portal</span>
                            <Switch
                              checked={familyMember.isActive && !!familyMember.userId}
                              onCheckedChange={(checked) => handleToggleFamilyAccess(familyMember.id, checked)}
                              disabled={!familyMember.isActive}
                            />
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleProvideCredentials(familyMember.userId || '', 'family')}
                            disabled={!familyMember.userId}
                          >
                            Provide Credentials
                          </Button>
                        </div>
                      </div>
                      {familyMember.userId && (
                        <div className="mt-3 bg-slate-50 rounded-md p-3">
                          <div className="grid grid-cols-3 gap-4 text-xs">
                            <div>
                              <span className="font-medium text-slate-600">Username:</span>
                              <span className="text-slate-900 ml-1">{familyMember.email}</span>
                            </div>
                            <div>
                              <span className="font-medium text-slate-600">Patient Access:</span>
                              <span className="text-slate-900 ml-1">{getPatientName(familyMember.patientId)}</span>
                            </div>
                            <div>
                              <span className="font-medium text-slate-600">Status:</span>
                              <Badge className="ml-1 status-badge active">Active</Badge>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Credentials Dialog */}
        <Dialog open={isCredentialsDialogOpen} onOpenChange={setIsCredentialsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Provide User Credentials</DialogTitle>
              <DialogDescription>
                Enter the username and password for the selected user account.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={credentials.username}
                  onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Enter username"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter password"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setIsCredentialsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={submitCredentials}
                  disabled={provideCredentialsMutation.isPending}
                >
                  Provide Credentials
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
