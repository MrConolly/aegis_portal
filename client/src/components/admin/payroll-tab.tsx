import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiGet, apiPost } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { 
  DollarSign, 
  Plus, 
  Calculator, 
  Download, 
  Archive,
  TrendingUp,
  Clock,
  Shield,
  Printer
} from "lucide-react";

interface Employee {
  id: string;
  name: string;
  email: string;
  position: string;
  employmentType: string;
  salary: number;
  healthInsuranceAmount: number;
  isActive: boolean;
}

interface PayrollRecord {
  id: string;
  employeeId: string;
  month: string;
  year: number;
  salaryAmount: number;
  hoursWorked: number;
  healthInsuranceEmployee: number;
  healthInsuranceEmployer: number;
  pensionEmployee: number;
  pensionEmployer: number;
  loans: number;
  deductions: number;
  totalAmount: number;
  createdAt: string;
}

interface NewPayrollRecord {
  employeeId: string;
  month: string;
  year: string;
  hoursWorked: string;
  loans: string;
  deductions: string;
}

export default function PayrollTab() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [newPayroll, setNewPayroll] = useState<NewPayrollRecord>({
    employeeId: '',
    month: '',
    year: new Date().getFullYear().toString(),
    hoursWorked: '',
    loans: '0',
    deductions: '0',
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
    queryFn: () => apiGet<Employee[]>('/api/employees'),
  });

  const { data: payrollRecords = [] } = useQuery({
    queryKey: ['/api/payroll'],
    queryFn: () => apiGet<PayrollRecord[]>('/api/payroll'),
  });

  const createPayrollMutation = useMutation({
    mutationFn: (data: any) => apiPost('/api/payroll', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payroll'] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Payroll record created successfully",
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
    setNewPayroll({
      employeeId: '',
      month: '',
      year: new Date().getFullYear().toString(),
      hoursWorked: '',
      loans: '0',
      deductions: '0',
    });
  };

  const calculatePayroll = (employee: Employee, hoursWorked: number, loans: number, deductions: number) => {
    let salaryAmount = 0;
    
    if (employee.employmentType === 'hourly') {
      salaryAmount = employee.salary * hoursWorked;
    } else {
      salaryAmount = employee.salary / 12; // Monthly salary
    }

    const healthInsuranceEmployee = employee.healthInsuranceAmount * 0.3; // 30% employee contribution
    const healthInsuranceEmployer = employee.healthInsuranceAmount * 0.7; // 70% employer contribution
    const pensionEmployee = salaryAmount * 0.06; // 6% employee contribution
    const pensionEmployer = salaryAmount * 0.12; // 12% employer contribution

    return {
      salaryAmount,
      hoursWorked,
      healthInsuranceEmployee,
      healthInsuranceEmployer,
      pensionEmployee,
      pensionEmployer,
      loans,
      deductions,
      totalAmount: salaryAmount - healthInsuranceEmployee - pensionEmployee - loans - deductions
    };
  };

  const printPayrollSlip = (record: PayrollRecord) => {
    const employee = employees.find(emp => emp.id === record.employeeId);
    if (!employee) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>AEGIS Professional Care - Payroll Slip</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            color: #1e293b;
            background: white;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 3px solid #d4af37;
            padding-bottom: 20px;
          }
          .company-name { 
            font-size: 28px; 
            font-weight: bold; 
            color: #000; 
            margin-bottom: 5px;
          }
          .company-subtitle { 
            font-size: 16px; 
            color: #d4af37; 
            margin-bottom: 20px;
          }
          .payslip-title { 
            font-size: 22px; 
            font-weight: bold; 
            color: #1e293b;
          }
          .employee-info { 
            background: #f8fafc; 
            padding: 20px; 
            border-radius: 8px; 
            margin-bottom: 20px;
            border-left: 4px solid #d4af37;
          }
          .info-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 10px;
          }
          .label { 
            font-weight: bold; 
            color: #475569;
          }
          .value { 
            color: #1e293b;
          }
          .earnings-table, .deductions-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px;
            background: white;
            border: 1px solid #e2e8f0;
          }
          .table-header { 
            background: #1e293b; 
            color: white;
          }
          .earnings-header { 
            background: #059669 !important;
          }
          .deductions-header { 
            background: #dc2626 !important;
          }
          th, td { 
            padding: 12px; 
            text-align: left; 
            border-bottom: 1px solid #e2e8f0;
          }
          th { 
            font-weight: bold;
          }
          .amount { 
            text-align: right; 
            font-family: monospace;
          }
          .total-row { 
            background: #f1f5f9; 
            font-weight: bold;
            border-top: 2px solid #d4af37;
          }
          .net-pay { 
            background: #d4af37; 
            color: #000; 
            font-size: 18px; 
            font-weight: bold;
          }
          .footer { 
            text-align: center; 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 2px solid #e2e8f0; 
            color: #64748b;
            font-size: 14px;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">AEGIS PROFESSIONAL CARE</div>
          <div class="company-subtitle">Home Health Care Services</div>
          <div class="payslip-title">PAYROLL SLIP</div>
        </div>

        <div class="employee-info">
          <div class="info-row">
            <span class="label">Employee Name:</span>
            <span class="value">${employee.name}</span>
          </div>
          <div class="info-row">
            <span class="label">Employee ID:</span>
            <span class="value">${employee.id}</span>
          </div>
          <div class="info-row">
            <span class="label">Position:</span>
            <span class="value">${employee.position}</span>
          </div>
          <div class="info-row">
            <span class="label">Employment Type:</span>
            <span class="value">${employee.employmentType.charAt(0).toUpperCase() + employee.employmentType.slice(1)}</span>
          </div>
          <div class="info-row">
            <span class="label">Pay Period:</span>
            <span class="value">${record.month} ${record.year}</span>
          </div>
          <div class="info-row">
            <span class="label">Date Generated:</span>
            <span class="value">${new Date().toLocaleDateString()}</span>
          </div>
        </div>

        <table class="earnings-table">
          <thead>
            <tr class="table-header earnings-header">
              <th>EARNINGS</th>
              <th class="amount">AMOUNT (CI$)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${employee.employmentType === 'hourly' ? `Base Rate (${record.hoursWorked} hours)` : 'Monthly Salary'}</td>
              <td class="amount">${record.salaryAmount.toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td><strong>GROSS PAY</strong></td>
              <td class="amount"><strong>${record.salaryAmount.toFixed(2)}</strong></td>
            </tr>
          </tbody>
        </table>

        <table class="deductions-table">
          <thead>
            <tr class="table-header deductions-header">
              <th>DEDUCTIONS</th>
              <th class="amount">AMOUNT (CI$)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Health Insurance (Employee 30%)</td>
              <td class="amount">${record.healthInsuranceEmployee.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Pension Contribution (Employee 6%)</td>
              <td class="amount">${record.pensionEmployee.toFixed(2)}</td>
            </tr>
            ${record.loans > 0 ? `
            <tr>
              <td>Loans</td>
              <td class="amount">${record.loans.toFixed(2)}</td>
            </tr>
            ` : ''}
            ${record.deductions > 0 ? `
            <tr>
              <td>Other Deductions</td>
              <td class="amount">${record.deductions.toFixed(2)}</td>
            </tr>
            ` : ''}
            <tr class="total-row">
              <td><strong>TOTAL DEDUCTIONS</strong></td>
              <td class="amount"><strong>${(record.healthInsuranceEmployee + record.pensionEmployee + record.loans + record.deductions).toFixed(2)}</strong></td>
            </tr>
          </tbody>
        </table>

        <table class="earnings-table">
          <tbody>
            <tr class="net-pay">
              <td><strong>NET PAY</strong></td>
              <td class="amount"><strong>CI$ ${record.totalAmount.toFixed(2)}</strong></td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <p><strong>AEGIS Professional Care</strong> | Home Health Care Services</p>
          <p>This is a computer-generated payslip and does not require a signature.</p>
          <p>For questions regarding this payslip, please contact Human Resources.</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handleCreatePayroll = () => {
    if (!newPayroll.employeeId || !newPayroll.month || !newPayroll.year) {
      toast({
        title: "Error",
        description: "Employee, month, and year are required",
        variant: "destructive",
      });
      return;
    }

    const employee = employees.find(e => e.id === newPayroll.employeeId);
    if (!employee) {
      toast({
        title: "Error",
        description: "Selected employee not found",
        variant: "destructive",
      });
      return;
    }

    const hoursWorked = parseFloat(newPayroll.hoursWorked) || 0;
    const loans = parseFloat(newPayroll.loans) || 0;
    const deductions = parseFloat(newPayroll.deductions) || 0;

    if (employee.employmentType === 'hourly' && hoursWorked <= 0) {
      toast({
        title: "Error",
        description: "Hours worked is required for hourly employees",
        variant: "destructive",
      });
      return;
    }

    const calculations = calculatePayroll(employee, hoursWorked, loans, deductions);

    const payrollData = {
      employeeId: newPayroll.employeeId,
      month: newPayroll.month,
      year: parseInt(newPayroll.year),
      salaryAmount: calculations.salaryAmount,
      hoursWorked: employee.employmentType === 'hourly' ? hoursWorked : 0,
      healthInsuranceEmployee: calculations.healthInsuranceEmployee,
      healthInsuranceEmployer: calculations.healthInsuranceEmployer,
      pensionEmployee: calculations.pensionEmployee,
      pensionEmployer: calculations.pensionEmployer,
      loans,
      deductions,
      totalAmount: calculations.totalAmount,
    };

    createPayrollMutation.mutate(payrollData);
  };

  const handleArchiveYear = (year: number) => {
    toast({
      title: "Archive Initiated",
      description: `Archiving payroll records for ${year}`,
    });
  };

  const handleDownloadRecords = () => {
    toast({
      title: "Download Started",
      description: "Payroll records are being prepared for download",
    });
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee?.name || 'Unknown Employee';
  };

  const filteredRecords = payrollRecords.filter(record => {
    const yearMatch = selectedYear && selectedYear !== 'all' ? record.year.toString() === selectedYear : true;
    const monthMatch = selectedMonth && selectedMonth !== 'all' ? record.month === selectedMonth : true;
    return yearMatch && monthMatch;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KYD', // Cayman Islands Dollar
    }).format(amount);
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Calculate summary statistics
  const totalPayrollAmount = filteredRecords.reduce((sum, record) => sum + record.totalAmount, 0);
  const totalEmployerContributions = filteredRecords.reduce((sum, record) => 
    sum + record.healthInsuranceEmployer + record.pensionEmployer, 0
  );

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Payroll Management</h2>
          <p className="text-slate-600">Manage employee compensation with Cayman Islands compliance</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="stat-card-icon bg-green-100">
                <DollarSign className="text-secondary-healthcare" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Total Payroll</p>
                <p className="text-2xl font-semibold text-slate-900">{formatCurrency(totalPayrollAmount)}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="stat-card-icon bg-blue-100">
                <TrendingUp className="text-primary" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Employer Contributions</p>
                <p className="text-2xl font-semibold text-slate-900">{formatCurrency(totalEmployerContributions)}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="stat-card-icon bg-yellow-100">
                <Clock className="text-warning-healthcare" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Records This Period</p>
                <p className="text-2xl font-semibold text-slate-900">{filteredRecords.length}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="stat-card-icon bg-purple-100">
                <Shield className="text-purple-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Active Employees</p>
                <p className="text-2xl font-semibold text-slate-900">{employees.filter(e => e.isActive).length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Payroll Records</CardTitle>
              <div className="flex space-x-2">
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="btn-primary">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Payroll
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add Payroll Record</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="employee">Employee *</Label>
                          <Select value={newPayroll.employeeId || undefined} onValueChange={(value) => 
                            setNewPayroll(prev => ({ ...prev, employeeId: value }))
                          }>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Employee" />
                            </SelectTrigger>
                            <SelectContent>
                              {employees.filter(e => e.isActive).map((employee) => (
                                <SelectItem key={employee.id} value={employee.id}>
                                  {employee.name} - {employee.position}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="year">Year *</Label>
                          <Select value={newPayroll.year} onValueChange={(value) => 
                            setNewPayroll(prev => ({ ...prev, year: value }))
                          }>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {years.map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="month">Month *</Label>
                          <Select value={newPayroll.month || undefined} onValueChange={(value) => 
                            setNewPayroll(prev => ({ ...prev, month: value }))
                          }>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Month" />
                            </SelectTrigger>
                            <SelectContent>
                              {months.map((month) => (
                                <SelectItem key={month} value={month}>
                                  {month}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="hoursWorked">Hours Worked</Label>
                          <Input
                            id="hoursWorked"
                            type="number"
                            step="0.5"
                            value={newPayroll.hoursWorked}
                            onChange={(e) => setNewPayroll(prev => ({ ...prev, hoursWorked: e.target.value }))}
                            placeholder="For hourly employees"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="loans">Loans</Label>
                          <Input
                            id="loans"
                            type="number"
                            step="0.01"
                            value={newPayroll.loans}
                            onChange={(e) => setNewPayroll(prev => ({ ...prev, loans: e.target.value }))}
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label htmlFor="deductions">Other Deductions</Label>
                          <Input
                            id="deductions"
                            type="number"
                            step="0.01"
                            value={newPayroll.deductions}
                            onChange={(e) => setNewPayroll(prev => ({ ...prev, deductions: e.target.value }))}
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      {/* Calculation Preview */}
                      {newPayroll.employeeId && (
                        <div className="p-4 bg-slate-50 rounded-lg">
                          <h4 className="font-medium text-slate-900 mb-2">Calculation Preview</h4>
                          <div className="text-sm text-slate-600 space-y-1">
                            <p>• Health Insurance: 50% employee, 50% employer contribution</p>
                            <p>• Pension: 5% employee, 5% employer (Cayman Islands compliance)</p>
                            <p>• Loans and deductions will be subtracted from final amount</p>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end space-x-3">
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleCreatePayroll}
                          disabled={createPayrollMutation.isPending}
                        >
                          <Calculator className="mr-2 h-4 w-4" />
                          Calculate & Save
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button variant="outline" onClick={handleDownloadRecords}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Filters */}
            <div className="flex space-x-4 mb-6">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedYear && (
                <Button
                  variant="outline"
                  onClick={() => handleArchiveYear(parseInt(selectedYear))}
                  className="ml-auto"
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Archive {selectedYear}
                </Button>
              )}
            </div>

            {/* Payroll Records Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left p-3 font-medium text-slate-900">Employee</th>
                    <th className="text-left p-3 font-medium text-slate-900">Period</th>
                    <th className="text-right p-3 font-medium text-slate-900">Base Salary</th>
                    <th className="text-right p-3 font-medium text-slate-900">Hours</th>
                    <th className="text-right p-3 font-medium text-slate-900">Health Ins.</th>
                    <th className="text-right p-3 font-medium text-slate-900">Pension</th>
                    <th className="text-right p-3 font-medium text-slate-900">Deductions</th>
                    <th className="text-right p-3 font-medium text-slate-900">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3">
                        <div>
                          <p className="font-medium text-slate-900">{getEmployeeName(record.employeeId)}</p>
                          <p className="text-xs text-slate-500">ID: {record.employeeId.slice(0, 8)}...</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="text-sm text-slate-900">{record.month} {record.year}</p>
                      </td>
                      <td className="p-3 text-right">
                        <p className="text-sm text-slate-900">{formatCurrency(record.salaryAmount)}</p>
                      </td>
                      <td className="p-3 text-right">
                        <p className="text-sm text-slate-900">
                          {record.hoursWorked > 0 ? `${record.hoursWorked}h` : 'Salary'}
                        </p>
                      </td>
                      <td className="p-3 text-right">
                        <div className="text-xs">
                          <p className="text-slate-900">{formatCurrency(record.healthInsuranceEmployee)}</p>
                          <p className="text-slate-500">+{formatCurrency(record.healthInsuranceEmployer)} emp</p>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="text-xs">
                          <p className="text-slate-900">{formatCurrency(record.pensionEmployee)}</p>
                          <p className="text-slate-500">+{formatCurrency(record.pensionEmployer)} emp</p>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <p className="text-sm text-slate-900">
                          {formatCurrency(record.loans + record.deductions)}
                        </p>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <p className="font-medium text-slate-900">{formatCurrency(record.totalAmount)}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => printPayrollSlip(record)}
                            className="text-slate-500 hover:text-slate-700"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredRecords.length === 0 && (
                <div className="text-center py-12">
                  <DollarSign className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                  <p className="text-slate-600">No payroll records found for the selected period</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Compliance Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              Cayman Islands Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-slate-900 mb-3">Pension Contributions</h4>
                <ul className="text-sm text-slate-600 space-y-2">
                  <li>• Total contribution: 10% of salary</li>
                  <li>• Employee contribution: 5%</li>
                  <li>• Employer contribution: 5%</li>
                  <li>• Automatically calculated and deducted</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-slate-900 mb-3">Health Insurance</h4>
                <ul className="text-sm text-slate-600 space-y-2">
                  <li>• Cost sharing: 50/50 between employee and employer</li>
                  <li>• Amount set per employee in their profile</li>
                  <li>• Automatically calculated in payroll</li>
                  <li>• Employer portion tracked separately</li>
                </ul>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Annual Archiving</h4>
              <p className="text-sm text-blue-800">
                Payroll records are automatically saved annually until the annual return is filed. 
                Use the archive function to organize completed tax years and maintain compliance records.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
