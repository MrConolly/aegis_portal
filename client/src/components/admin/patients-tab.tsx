import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { Plus, User, Upload, X, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Patient {
  id: string;
  name: string;
  dateOfBirth: string;
  doctor: string;
  medications: string;
  specializedTasks: string;
  paymentMethod: string;
  serviceCharge: string;
  cinicoExpiration: string;
  photoUrl?: string;
  adminNotes?: string;
  isActive: boolean;
}

interface Employee {
  id: string;
  name: string;
  position: string;
}

export default function PatientsTab() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [familyMembers, setFamilyMembers] = useState([
    { name: '', email: '', phone: '' }
  ]);
  const [manageFamilyMembers, setManageFamilyMembers] = useState<any[]>([]);
  const [newPatient, setNewPatient] = useState({
    name: '',
    dateOfBirth: '',
    doctor: '',
    medications: '',
    specializedTasks: '',
    paymentMethod: 'cash',
    serviceCharge: '',
    cinicoExpiration: '',
    adminNotes: '',
    assignedEmployees: [] as string[],
  });
  const [editPatient, setEditPatient] = useState<Patient | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: patients = [] } = useQuery({
    queryKey: ['/api/patients'],
    queryFn: () => apiGet<Patient[]>('/api/patients'),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
    queryFn: () => apiGet<Employee[]>('/api/employees'),
  });

  const createPatientMutation = useMutation({
    mutationFn: (data: any) => apiPost('/api/patients', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Patient created successfully",
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

  const updatePatientMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiPut(`/api/patients/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      toast({
        title: "Success",
        description: "Patient updated successfully",
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
    setNewPatient({
      name: '',
      dateOfBirth: '',
      doctor: '',
      medications: '',
      specializedTasks: '',
      paymentMethod: 'cash',
      serviceCharge: '',
      cinicoExpiration: '',
      adminNotes: '',
      assignedEmployees: [],
    });
    setFamilyMembers([{ name: '', email: '', phone: '' }]);
  };

  const handleEditPatient = (patient: Patient) => {
    setEditPatient({ ...patient });
    setIsEditDialogOpen(true);
  };

  const handleUpdatePatient = () => {
    if (!editPatient?.name || !editPatient?.dateOfBirth) {
      toast({
        title: "Error",
        description: "Name and date of birth are required",
        variant: "destructive",
      });
      return;
    }

    const updateData = {
      name: editPatient.name,
      dateOfBirth: editPatient.dateOfBirth,
      doctor: editPatient.doctor,
      medications: editPatient.medications,
      specializedTasks: editPatient.specializedTasks,
      paymentMethod: editPatient.paymentMethod,
      serviceCharge: editPatient.serviceCharge,
      cinicoExpiration: editPatient.cinicoExpiration,
      adminNotes: editPatient.adminNotes || '',
    };

    updatePatientMutation.mutate({ id: editPatient.id, data: updateData });
    setIsEditDialogOpen(false);
  };

  const handleCreatePatient = () => {
    if (!newPatient.name || !newPatient.dateOfBirth) {
      toast({
        title: "Error",
        description: "Name and date of birth are required",
        variant: "destructive",
      });
      return;
    }

    const patientData = {
      ...newPatient,
    };

    createPatientMutation.mutate(patientData);
  };



  const handleDeactivatePatient = () => {
    if (!selectedPatient) return;

    updatePatientMutation.mutate({
      id: selectedPatient.id,
      data: { isActive: false },
    });
  };

  const addFamilyMember = () => {
    if (familyMembers.length < 3) {
      setFamilyMembers([...familyMembers, { name: '', email: '', phone: '' }]);
    }
  };

  const removeFamilyMember = (index: number) => {
    if (familyMembers.length > 1) {
      setFamilyMembers(familyMembers.filter((_, i) => i !== index));
    }
  };

  const updateFamilyMember = (index: number, field: string, value: string) => {
    const updated = [...familyMembers];
    updated[index] = { ...updated[index], [field]: value };
    setFamilyMembers(updated);
  };

  const getPaymentBadgeColor = (paymentMethod: string) => {
    switch (paymentMethod) {
      case 'cinico':
        return 'bg-blue-100 text-blue-800';
      case 'cash':
        return 'bg-yellow-100 text-yellow-800';
      case '50/50':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 'Unknown';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Patient Management</h2>
          <p className="text-slate-600">Manage patient information, assignments, and care details</p>
        </div>

        <Tabs defaultValue="patient-list" className="space-y-6">
          <TabsList>
            <TabsTrigger value="patient-list">Patient List</TabsTrigger>
            <TabsTrigger value="patient-management">Patient Management</TabsTrigger>
          </TabsList>

          {/* Patient List Tab */}
          <TabsContent value="patient-list">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Patient List */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Active Patients</CardTitle>
                      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="btn-primary">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Patient
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Add New Patient</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="name">Patient Name *</Label>
                                <Input
                                  id="name"
                                  value={newPatient.name}
                                  onChange={(e) => setNewPatient(prev => ({ ...prev, name: e.target.value }))}
                                  placeholder="Patient name"
                                />
                              </div>
                              <div>
                                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                                <Input
                                  id="dateOfBirth"
                                  type="date"
                                  value={newPatient.dateOfBirth}
                                  onChange={(e) => setNewPatient(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                                />
                              </div>
                            </div>
                            
                            <div>
                              <Label htmlFor="doctor">Doctor</Label>
                              <Input
                                id="doctor"
                                value={newPatient.doctor}
                                onChange={(e) => setNewPatient(prev => ({ ...prev, doctor: e.target.value }))}
                                placeholder="Doctor name"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="medications">Medications</Label>
                              <Textarea
                                id="medications"
                                value={newPatient.medications}
                                onChange={(e) => setNewPatient(prev => ({ ...prev, medications: e.target.value }))}
                                placeholder="List medications and dosages..."
                                rows={3}
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="specializedTasks">Specialized Tasks</Label>
                              <Textarea
                                id="specializedTasks"
                                value={newPatient.specializedTasks}
                                onChange={(e) => setNewPatient(prev => ({ ...prev, specializedTasks: e.target.value }))}
                                placeholder="e.g., Physio at 3 PM, special meal prep..."
                                rows={3}
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="paymentMethod">Payment Method</Label>
                                <Select value={newPatient.paymentMethod} onValueChange={(value) => 
                                  setNewPatient(prev => ({ ...prev, paymentMethod: value }))
                                }>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="cinico">CINICO Insurance</SelectItem>
                                    <SelectItem value="50/50">50/50</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="serviceCharge">Service Charge ($)</Label>
                                <Input
                                  id="serviceCharge"
                                  type="number"
                                  step="0.01"
                                  value={newPatient.serviceCharge}
                                  onChange={(e) => setNewPatient(prev => ({ ...prev, serviceCharge: e.target.value }))}
                                  placeholder="0.00"
                                />
                              </div>
                            </div>
                            
                            {newPatient.paymentMethod === 'cinico' && (
                              <div>
                                <Label htmlFor="cinicoExpiration">CINICO Expiration</Label>
                                <Input
                                  id="cinicoExpiration"
                                  type="date"
                                  value={newPatient.cinicoExpiration}
                                  onChange={(e) => setNewPatient(prev => ({ ...prev, cinicoExpiration: e.target.value }))}
                                />
                              </div>
                            )}

                            {/* Admin Notes Section */}
                            <div>
                              <Label htmlFor="adminNotes">Admin Notes</Label>
                              <Textarea
                                id="adminNotes"
                                value={newPatient.adminNotes}
                                onChange={(e) => setNewPatient(prev => ({ ...prev, adminNotes: e.target.value }))}
                                placeholder="Private admin notes about this patient..."
                                rows={3}
                                className="bg-yellow-50 border-yellow-200"
                              />
                              <p className="text-xs text-yellow-700 mt-1">
                                These notes are only visible to admin users
                              </p>
                            </div>

                            {/* Employee Assignment Section */}
                            <div className="bg-blue-50 p-4 rounded-lg">
                              <Label className="text-sm font-medium text-slate-700 mb-3 block">
                                Assign Employees (Max 2)
                              </Label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="employee1">Primary Employee</Label>
                                  <Select
                                    value={newPatient.assignedEmployees[0] || ''}
                                    onValueChange={(value) => {
                                      const newAssigned = [...newPatient.assignedEmployees];
                                      newAssigned[0] = value;
                                      setNewPatient(prev => ({ ...prev, assignedEmployees: newAssigned.filter(id => id) }));
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select primary employee" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {employees.map((employee) => (
                                        <SelectItem key={employee.id} value={employee.id}>
                                          {employee.name} - {employee.position}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="employee2">Secondary Employee (Optional)</Label>
                                  <Select
                                    value={newPatient.assignedEmployees[1] || ''}
                                    onValueChange={(value) => {
                                      const newAssigned = [...newPatient.assignedEmployees];
                                      newAssigned[1] = value;
                                      setNewPatient(prev => ({ ...prev, assignedEmployees: newAssigned.filter(id => id) }));
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select secondary employee" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {employees
                                        .filter(emp => emp.id !== newPatient.assignedEmployees[0])
                                        .map((employee) => (
                                          <SelectItem key={employee.id} value={employee.id}>
                                            {employee.name} - {employee.position}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              {newPatient.assignedEmployees.length > 0 && (
                                <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                                  <p className="text-sm text-blue-800">
                                    <strong>Note:</strong> These employees will automatically see this patient in their Employee Portal.
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Family Members Section */}
                            <div>
                              <Label className="text-base font-medium">Family Members (Max 3)</Label>
                              <div className="space-y-3 mt-2">
                                {familyMembers.map((member, index) => (
                                  <div key={index} className="border border-slate-200 rounded-md p-3">
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="text-sm font-medium">Family Member {index + 1}</span>
                                      {familyMembers.length > 1 && (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeFamilyMember(index)}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                    <div className="space-y-2">
                                      <Input
                                        placeholder="Family member name"
                                        value={member.name}
                                        onChange={(e) => updateFamilyMember(index, 'name', e.target.value)}
                                      />
                                      <Input
                                        type="email"
                                        placeholder="Email"
                                        value={member.email}
                                        onChange={(e) => updateFamilyMember(index, 'email', e.target.value)}
                                      />
                                      <Input
                                        type="tel"
                                        placeholder="Phone"
                                        value={member.phone}
                                        onChange={(e) => updateFamilyMember(index, 'phone', e.target.value)}
                                      />
                                    </div>
                                  </div>
                                ))}
                                {familyMembers.length < 3 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={addFamilyMember}
                                    className="w-full"
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Family Member
                                  </Button>
                                )}
                              </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button 
                                onClick={handleCreatePatient}
                                disabled={createPatientMutation.isPending}
                              >
                                Save Patient
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-200">
                      {patients.map((patient) => (
                        <div 
                          key={patient.id} 
                          className="p-6 hover:bg-slate-50 cursor-pointer"
                          onClick={() => setSelectedPatient(patient)}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden">
                              {patient.photoUrl ? (
                                <img src={patient.photoUrl} alt={patient.name} className="w-full h-full object-cover" />
                              ) : (
                                <User className="text-slate-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-slate-900 truncate">{patient.name}</h4>
                                <div className="flex items-center space-x-2">
                                  <Badge className={`status-badge ${patient.isActive ? 'active' : 'inactive'}`}>
                                    {patient.isActive ? 'Active' : 'Inactive'}
                                  </Badge>
                                  <Badge className={`status-badge ${getPaymentBadgeColor(patient.paymentMethod)}`}>
                                    {patient.paymentMethod.toUpperCase()}
                                  </Badge>
                                </div>
                              </div>
                              <div className="mt-1">
                                <p className="text-sm text-slate-600">Age: {calculateAge(patient.dateOfBirth)} | {patient.doctor || 'No doctor assigned'}</p>
                                <p className="text-sm text-slate-600">Service Charge: ${patient.serviceCharge || '0.00'}</p>
                                <p className="text-xs text-slate-500">Click to view details</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Patient Details Panel */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Patient Details</CardTitle>
                  </CardHeader>
                  
                  <CardContent>
                    {selectedPatient ? (
                      <div className="space-y-6">
                        {/* Basic Info */}
                        <div>
                          <Label className="text-sm font-medium text-slate-700">Patient Name</Label>
                          <Input
                            value={selectedPatient.name}
                            onChange={(e) => setSelectedPatient(prev => prev ? { ...prev, name: e.target.value } : null)}
                            className="form-input mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium text-slate-700">Date of Birth</Label>
                          <Input
                            type="date"
                            value={selectedPatient.dateOfBirth}
                            onChange={(e) => setSelectedPatient(prev => prev ? { ...prev, dateOfBirth: e.target.value } : null)}
                            className="form-input mt-1"
                          />
                          <p className="text-xs text-slate-500 mt-1">Age: {calculateAge(selectedPatient.dateOfBirth)} years old</p>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium text-slate-700">Doctor</Label>
                          <Input
                            value={selectedPatient.doctor}
                            onChange={(e) => setSelectedPatient(prev => prev ? { ...prev, doctor: e.target.value } : null)}
                            className="form-input mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium text-slate-700">Medications</Label>
                          <Textarea
                            value={selectedPatient.medications}
                            onChange={(e) => setSelectedPatient(prev => prev ? { ...prev, medications: e.target.value } : null)}
                            className="form-textarea mt-1"
                            rows={3}
                          />
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium text-slate-700">Specialized Tasks</Label>
                          <Textarea
                            value={selectedPatient.specializedTasks}
                            onChange={(e) => setSelectedPatient(prev => prev ? { ...prev, specializedTasks: e.target.value } : null)}
                            className="form-textarea mt-1"
                            placeholder="e.g., Physio at 3 PM, special meal prep..."
                            rows={3}
                          />
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium text-slate-700">Payment Method</Label>
                          <Select 
                            value={selectedPatient.paymentMethod} 
                            onValueChange={(value) => setSelectedPatient(prev => prev ? { ...prev, paymentMethod: value } : null)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="cinico">CINICO Insurance</SelectItem>
                              <SelectItem value="50/50">50/50</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium text-slate-700">Service Charge ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={selectedPatient.serviceCharge}
                            onChange={(e) => setSelectedPatient(prev => prev ? { ...prev, serviceCharge: e.target.value } : null)}
                            className="form-input mt-1"
                            placeholder="0.00"
                          />
                        </div>
                        
                        {selectedPatient.paymentMethod === 'cinico' && (
                          <div>
                            <Label className="text-sm font-medium text-slate-700">CINICO Expiration</Label>
                            <Input
                              type="date"
                              value={selectedPatient.cinicoExpiration}
                              onChange={(e) => setSelectedPatient(prev => prev ? { ...prev, cinicoExpiration: e.target.value } : null)}
                              className="form-input mt-1"
                            />
                          </div>
                        )}

                        {/* Admin Notes Section */}
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                          <Label className="text-sm font-medium text-slate-700">Admin Notes</Label>
                          <Textarea
                            value={selectedPatient.adminNotes || ''}
                            onChange={(e) => setSelectedPatient(prev => prev ? { ...prev, adminNotes: e.target.value } : null)}
                            className="form-textarea mt-1 bg-white"
                            placeholder="Private admin notes about this patient..."
                            rows={3}
                          />
                          <p className="text-xs text-yellow-700 mt-1">
                            These notes are only visible to admin users
                          </p>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium text-slate-700">Photo Upload</Label>
                          <div className="file-upload-area mt-2">
                            <Upload className="mx-auto h-6 w-6 text-slate-400 mb-2" />
                            <p className="text-sm text-slate-500">Upload patient photo</p>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex space-x-3">
                          <Button 
                            onClick={() => {
                              if (!selectedPatient) return;
                              const updateData = {
                                name: selectedPatient.name,
                                dateOfBirth: selectedPatient.dateOfBirth,
                                doctor: selectedPatient.doctor,
                                medications: selectedPatient.medications,
                                specializedTasks: selectedPatient.specializedTasks,
                                paymentMethod: selectedPatient.paymentMethod,
                                serviceCharge: selectedPatient.serviceCharge,
                                cinicoExpiration: selectedPatient.cinicoExpiration,
                                adminNotes: selectedPatient.adminNotes || '',
                              };
                              updatePatientMutation.mutate({ id: selectedPatient.id, data: updateData });
                            }}
                            disabled={updatePatientMutation.isPending}
                            className="btn-primary flex-1"
                          >
                            Save Changes
                          </Button>
                          <Button 
                            onClick={handleDeactivatePatient}
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
                        <p className="text-slate-600">Select a patient to view details</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Patient Management Tab */}
          <TabsContent value="patient-management">
            <Card>
              <CardHeader>
                <CardTitle>Patient Status Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {patients.map((patient) => (
                    <div key={patient.id} className="border rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden">
                          {patient.photoUrl ? (
                            <img src={patient.photoUrl} alt={patient.name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="text-slate-400" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900">{patient.name}</h4>
                          <p className="text-sm text-slate-600">Age: {calculateAge(patient.dateOfBirth)}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">Status:</span>
                          <Badge className={`status-badge ${patient.isActive ? 'active' : 'inactive'}`}>
                            {patient.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">Payment:</span>
                          <Badge className={`status-badge ${getPaymentBadgeColor(patient.paymentMethod)}`}>
                            {patient.paymentMethod.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setSelectedPatient(patient);
                            setIsManageDialogOpen(true);
                          }}
                        >
                          Manage Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            updatePatientMutation.mutate({
                              id: patient.id,
                              data: { isActive: !patient.isActive }
                            });
                          }}
                        >
                          {patient.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Patient Management Dialog */}
        <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Manage Patient Details - {selectedPatient?.name}</DialogTitle>
              <DialogDescription>
                Edit patient information and manage family members (maximum 3 per patient)
              </DialogDescription>
            </DialogHeader>

            {selectedPatient && (
              <PatientManagementForm 
                patient={selectedPatient}
                onClose={() => setIsManageDialogOpen(false)}
                onUpdate={() => {
                  queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
                  queryClient.invalidateQueries({ queryKey: ['/api/family-members'] });
                  setIsManageDialogOpen(false);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Patient Management Form Component
function PatientManagementForm({ patient, onClose, onUpdate }: { 
  patient: Patient; 
  onClose: () => void; 
  onUpdate: () => void; 
}) {
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load family members for this patient
  useEffect(() => {
    async function loadFamilyMembers() {
      try {
        const members = await apiGet(`/api/patients/${patient.id}/family-members`);
        if (Array.isArray(members) && members.length === 0) {
          setFamilyMembers([{ name: '', email: '', phone: '' }]);
        } else {
          setFamilyMembers(Array.isArray(members) ? members : [{ name: '', email: '', phone: '' }]);
        }
      } catch (error) {
        setFamilyMembers([{ name: '', email: '', phone: '' }]);
      }
    }
    loadFamilyMembers();
  }, [patient.id]);

  const addFamilyMember = () => {
    if (familyMembers.length < 3) {
      setFamilyMembers(prev => [...prev, { name: '', email: '', phone: '' }]);
    }
  };

  const removeFamilyMember = (index: number) => {
    if (familyMembers.length > 1) {
      setFamilyMembers(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateFamilyMember = (index: number, field: string, value: string) => {
    setFamilyMembers(prev => prev.map((member, i) => 
      i === index ? { ...member, [field]: value } : member
    ));
  };

  const saveFamilyMembers = async () => {
    setIsLoading(true);
    try {
      const validMembers = familyMembers.filter(member => 
        member.name.trim() && member.email.trim()
      );

      for (const member of validMembers) {
        if (member.id) {
          await apiPut(`/api/family-members/${member.id}`, member);
        } else {
          await apiPost('/api/family-members', {
            ...member,
            patientId: patient.id
          });
        }
      }

      toast({
        title: "Success",
        description: "Family members updated successfully",
      });
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update family members",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Patient Information Section */}
      <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
        <h3 className="text-lg font-medium text-slate-900 mb-4">Patient Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-slate-700">Name</Label>
            <p className="text-slate-900">{patient.name}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-slate-700">Age</Label>
            <p className="text-slate-900">{calculateAge(patient.dateOfBirth)} years old</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-slate-700">Doctor</Label>
            <p className="text-slate-900">{patient.doctor}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-slate-700">Payment Method</Label>
            <p className="text-slate-900 capitalize">{patient.paymentMethod}</p>
          </div>
        </div>
      </div>

      {/* Family Members Management */}
      <div className="border border-slate-200 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-slate-900">Family Members</h3>
          {familyMembers.length < 3 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addFamilyMember}
              className="btn-outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Family Member
            </Button>
          )}
        </div>
        
        <p className="text-sm text-slate-600 mb-4">
          Manage up to 3 family members who can access this patient's information through the family portal.
        </p>

        <div className="space-y-4">
          {familyMembers.map((member, index) => (
            <div key={index} className="border border-slate-300 rounded-lg p-4 bg-white">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-slate-700">Family Member {index + 1}</span>
                  {member.id && (
                    <Badge className="status-badge active">Registered</Badge>
                  )}
                </div>
                {familyMembers.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFamilyMember(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-sm font-medium text-slate-700">Full Name *</Label>
                  <Input
                    placeholder="Family member name"
                    value={member.name || ''}
                    onChange={(e) => updateFamilyMember(index, 'name', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700">Email Address *</Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={member.email || ''}
                    onChange={(e) => updateFamilyMember(index, 'email', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700">Phone Number</Label>
                  <Input
                    type="tel"
                    placeholder="+1-345-xxx-xxxx"
                    value={member.phone || ''}
                    onChange={(e) => updateFamilyMember(index, 'phone', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              {member.id && (
                <div className="mt-3 text-xs text-slate-500">
                  Family member has portal access and can receive notifications
                </div>
              )}
            </div>
          ))}
          
          {familyMembers.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Users className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <p>No family members added yet</p>
              <p className="text-sm">Click "Add Family Member" to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={saveFamilyMembers} disabled={isLoading} className="btn-primary">
          {isLoading ? "Saving..." : "Save Family Members"}
        </Button>
      </div>
    </div>
  );

  function calculateAge(dateOfBirth: string) {
    if (!dateOfBirth) return 'Unknown';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
}
