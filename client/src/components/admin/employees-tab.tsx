import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { Plus, User, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  position: string;
  workPermitExpiry: string;
  employmentType: string;
  salary: number;
  healthInsuranceAmount: number;
  isActive: boolean;
}

export default function EmployeesTab() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    position: '',
    workPermitExpiry: '',
    employmentType: 'hourly',
    salary: '',
    healthInsuranceAmount: '',
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
    queryFn: () => apiGet<Employee[]>('/api/employees'),
  });

  const createEmployeeMutation = useMutation({
    mutationFn: (data: any) => apiPost('/api/employees', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Employee created successfully",
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

  const updateEmployeeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiPut(`/api/employees/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({
        title: "Success",
        description: "Employee updated successfully",
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

  const resetForm = () => {
    setNewEmployee({
      name: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      position: '',
      workPermitExpiry: '',
      employmentType: 'hourly',
      salary: '',
      healthInsuranceAmount: '',
    });
  };

  const handleCreateEmployee = () => {
    if (!newEmployee.name || !newEmployee.email || !newEmployee.phone) {
      toast({
        title: "Error",
        description: "Name, email, and phone are required",
        variant: "destructive",
      });
      return;
    }

    const employeeData = {
      ...newEmployee,
      salary: newEmployee.salary || '0',
      healthInsuranceAmount: newEmployee.healthInsuranceAmount || '0',
    };

    createEmployeeMutation.mutate(employeeData);
  };

  const handleUpdateEmployee = () => {
    if (!selectedEmployee) return;

    const employeeData = {
      name: selectedEmployee.name,
      email: selectedEmployee.email,
      phone: selectedEmployee.phone,
      dateOfBirth: selectedEmployee.dateOfBirth,
      position: selectedEmployee.position,
      workPermitExpiry: selectedEmployee.workPermitExpiry,
      employmentType: selectedEmployee.employmentType,
      salary: selectedEmployee.salary?.toString() || '0',
      healthInsuranceAmount: selectedEmployee.healthInsuranceAmount?.toString() || '0',
    };

    updateEmployeeMutation.mutate({
      id: selectedEmployee.id,
      data: employeeData,
    });
  };

  const handleDeactivateEmployee = () => {
    if (!selectedEmployee) return;

    updateEmployeeMutation.mutate({
      id: selectedEmployee.id,
      data: { isActive: false },
    });
  };

  const isWorkPermitExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
    return expiry <= twoWeeksFromNow;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Employee Management</h2>
          <p className="text-slate-600">Manage employee information, onboarding, and assignments</p>
        </div>

        <Tabs defaultValue="onboarding" className="space-y-6">
          <TabsList>
            <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
            <TabsTrigger value="employment-management">Employment Management</TabsTrigger>
          </TabsList>

          {/* Onboarding Tab */}
          <TabsContent value="onboarding">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Employee List */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Active Employees</CardTitle>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="btn-primary">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Employee
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Add New Employee</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="name">Full Name *</Label>
                              <Input
                                id="name"
                                value={newEmployee.name}
                                onChange={(e) => setNewEmployee(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Employee name"
                              />
                            </div>
                            <div>
                              <Label htmlFor="position">Position *</Label>
                              <Input
                                id="position"
                                value={newEmployee.position}
                                onChange={(e) => setNewEmployee(prev => ({ ...prev, position: e.target.value }))}
                                placeholder="Job position"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="email">Email *</Label>
                              <Input
                                id="email"
                                type="email"
                                value={newEmployee.email}
                                onChange={(e) => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="Email address"
                              />
                            </div>
                            <div>
                              <Label htmlFor="phone">Phone *</Label>
                              <Input
                                id="phone"
                                type="tel"
                                value={newEmployee.phone}
                                onChange={(e) => setNewEmployee(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="Phone number"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="dateOfBirth">Date of Birth</Label>
                              <Input
                                id="dateOfBirth"
                                type="date"
                                value={newEmployee.dateOfBirth}
                                onChange={(e) => setNewEmployee(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="workPermitExpiry">Work Permit Expiry</Label>
                              <Input
                                id="workPermitExpiry"
                                type="date"
                                value={newEmployee.workPermitExpiry}
                                onChange={(e) => setNewEmployee(prev => ({ ...prev, workPermitExpiry: e.target.value }))}
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="employmentType">Employment Type</Label>
                              <Select value={newEmployee.employmentType} onValueChange={(value) => 
                                setNewEmployee(prev => ({ ...prev, employmentType: value }))
                              }>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="hourly">Hourly</SelectItem>
                                  <SelectItem value="salary">Salary</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="salary">
                                {newEmployee.employmentType === 'hourly' ? 'Hourly Rate' : 'Annual Salary'}
                              </Label>
                              <Input
                                id="salary"
                                type="number"
                                step="0.01"
                                value={newEmployee.salary}
                                onChange={(e) => setNewEmployee(prev => ({ ...prev, salary: e.target.value }))}
                                placeholder="Amount"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="healthInsuranceAmount">Health Insurance Amount</Label>
                            <Input
                              id="healthInsuranceAmount"
                              type="number"
                              step="0.01"
                              value={newEmployee.healthInsuranceAmount}
                              onChange={(e) => setNewEmployee(prev => ({ ...prev, healthInsuranceAmount: e.target.value }))}
                              placeholder="Monthly health insurance amount"
                            />
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium text-slate-700">Documents</Label>
                            <div className="file-upload-area mt-2">
                              <Upload className="mx-auto h-6 w-6 text-slate-400 mb-2" />
                              <p className="text-sm text-slate-500">Upload certifications, notices, warnings</p>
                            </div>
                          </div>

                          <div className="flex justify-end space-x-3 pt-4">
                            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleCreateEmployee}
                              disabled={createEmployeeMutation.isPending}
                            >
                              Save Employee
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-200">
                    {employees.map((employee) => (
                      <div 
                        key={employee.id} 
                        className="p-6 hover:bg-slate-50 cursor-pointer"
                        onClick={() => setSelectedEmployee(employee)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                              <User className="text-slate-400" />
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-slate-900">{employee.name}</h4>
                              <p className="text-xs text-slate-500">{employee.position}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-slate-900">
                              {employee.employmentType === 'hourly' 
                                ? `${formatCurrency(employee.salary)}/hr` 
                                : formatCurrency(employee.salary)
                              }
                            </p>
                            <p className="text-xs text-slate-500">{employee.phone}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs">
                          <span className="text-slate-500">
                            Permit expires: {new Date(employee.workPermitExpiry).toLocaleDateString()}
                            {isWorkPermitExpiringSoon(employee.workPermitExpiry) && (
                              <Badge className="ml-2 status-badge bg-red-100 text-red-800">Expiring Soon</Badge>
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Employee Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Employee Details</CardTitle>
                </CardHeader>
                
                <CardContent>
                  {selectedEmployee ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-slate-700">Full Name</Label>
                          <Input
                            value={selectedEmployee.name}
                            onChange={(e) => setSelectedEmployee(prev => prev ? { ...prev, name: e.target.value } : null)}
                            className="form-input mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-slate-700">Position</Label>
                          <Input
                            value={selectedEmployee.position}
                            onChange={(e) => setSelectedEmployee(prev => prev ? { ...prev, position: e.target.value } : null)}
                            className="form-input mt-1"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-slate-700">Email</Label>
                          <Input
                            type="email"
                            value={selectedEmployee.email}
                            onChange={(e) => setSelectedEmployee(prev => prev ? { ...prev, email: e.target.value } : null)}
                            className="form-input mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-slate-700">Phone</Label>
                          <Input
                            type="tel"
                            value={selectedEmployee.phone}
                            onChange={(e) => setSelectedEmployee(prev => prev ? { ...prev, phone: e.target.value } : null)}
                            className="form-input mt-1"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-slate-700">Date of Birth</Label>
                          <Input
                            type="date"
                            value={selectedEmployee.dateOfBirth}
                            onChange={(e) => setSelectedEmployee(prev => prev ? { ...prev, dateOfBirth: e.target.value } : null)}
                            className="form-input mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-slate-700">Work Permit Expiry</Label>
                          <Input
                            type="date"
                            value={selectedEmployee.workPermitExpiry}
                            onChange={(e) => setSelectedEmployee(prev => prev ? { ...prev, workPermitExpiry: e.target.value } : null)}
                            className="form-input mt-1"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-slate-700">Employment Type</Label>
                          <Select 
                            value={selectedEmployee.employmentType} 
                            onValueChange={(value) => setSelectedEmployee(prev => prev ? { ...prev, employmentType: value } : null)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hourly">Hourly</SelectItem>
                              <SelectItem value="salary">Salary</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-slate-700">
                            {selectedEmployee.employmentType === 'hourly' ? 'Hourly Rate' : 'Annual Salary'}
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={selectedEmployee.salary}
                            onChange={(e) => setSelectedEmployee(prev => prev ? { ...prev, salary: parseFloat(e.target.value) || 0 } : null)}
                            className="form-input mt-1"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-slate-700">Health Insurance Amount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={selectedEmployee.healthInsuranceAmount}
                          onChange={(e) => setSelectedEmployee(prev => prev ? { ...prev, healthInsuranceAmount: parseFloat(e.target.value) || 0 } : null)}
                          className="form-input mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-slate-700">Documents</Label>
                        <div className="file-upload-area mt-2">
                          <Upload className="mx-auto h-6 w-6 text-slate-400 mb-2" />
                          <p className="text-sm text-slate-500">Upload certifications, notices, warnings</p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-3 pt-4">
                        <Button 
                          onClick={handleUpdateEmployee}
                          disabled={updateEmployeeMutation.isPending}
                          className="btn-primary flex-1"
                        >
                          Save Changes
                        </Button>
                        <Button 
                          onClick={handleDeactivateEmployee}
                          variant="outline"
                          className="btn-outline"
                        >
                          Deactivate
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <User className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                      <p className="text-slate-600">Select an employee to view details</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Employment Management Tab */}
          <TabsContent value="employment-management">
            <Card>
              <CardHeader>
                <CardTitle>Employment Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {employees.map((employee) => (
                    <div key={employee.id} className="border rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                          <User className="text-slate-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900">{employee.name}</h4>
                          <p className="text-sm text-slate-600">{employee.position}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Phone:</span>
                          <span className="text-slate-900">{employee.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Salary:</span>
                          <span className="text-slate-900">
                            {employee.employmentType === 'hourly' 
                              ? `${formatCurrency(employee.salary)}/hr` 
                              : formatCurrency(employee.salary)
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Permit Expires:</span>
                          <span className={`text-slate-900 ${isWorkPermitExpiringSoon(employee.workPermitExpiry) ? 'text-red-600 font-medium' : ''}`}>
                            {new Date(employee.workPermitExpiry).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Status:</span>
                          <Badge className={`status-badge ${employee.isActive ? 'active' : 'inactive'}`}>
                            {employee.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            updateEmployeeMutation.mutate({
                              id: employee.id,
                              data: { isActive: !employee.isActive }
                            });
                          }}
                        >
                          {employee.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
