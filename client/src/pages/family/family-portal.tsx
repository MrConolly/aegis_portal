import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { Plus, User, Edit, Heart, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface Patient {
  id: string;
  name: string;
  dateOfBirth: string;
  doctor: string;
  medications: string;
  specializedTasks: string;
  paymentMethod: string;
  serviceCharge: number;
  cinicoExpiration: string;
  isActive: boolean;
}

interface FamilyMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  patientId: string;
  isActive: boolean;
}

export default function FamilyPortal() {
  const [isAddFamilyDialogOpen, setIsAddFamilyDialogOpen] = useState(false);
  const [editingFamilyMember, setEditingFamilyMember] = useState<FamilyMember | null>(null);
  const [newFamilyMember, setNewFamilyMember] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get accessible patients for this family member
  const { data: patients = [] } = useQuery({
    queryKey: ['/api/family/accessible-patients'],
    queryFn: () => apiGet<Patient[]>('/api/family/accessible-patients'),
  });

  // Get family members for the first patient (for editing)
  const patientId = patients[0]?.id;
  const { data: familyMembers = [] } = useQuery({
    queryKey: [`/api/patients/${patientId}/family-members`],
    queryFn: () => apiGet<FamilyMember[]>(`/api/patients/${patientId}/family-members`),
    enabled: !!patientId,
  });

  const createFamilyMemberMutation = useMutation({
    mutationFn: (data: any) => apiPost(`/api/patients/${patientId}/family-members`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/family-members`] });
      setIsAddFamilyDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Family member added successfully",
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

  const updateFamilyMemberMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiPut(`/api/family-members/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/family-members`] });
      setEditingFamilyMember(null);
      toast({
        title: "Success",
        description: "Family member updated successfully",
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
    setNewFamilyMember({
      name: '',
      email: '',
      phone: '',
    });
  };

  const handleCreateFamilyMember = () => {
    if (!newFamilyMember.name || !newFamilyMember.email || !newFamilyMember.phone) {
      toast({
        title: "Error",
        description: "Name, email, and phone are required",
        variant: "destructive",
      });
      return;
    }

    createFamilyMemberMutation.mutate(newFamilyMember);
  };

  const handleUpdateFamilyMember = () => {
    if (!editingFamilyMember) return;

    updateFamilyMemberMutation.mutate({
      id: editingFamilyMember.id,
      data: {
        name: editingFamilyMember.name,
        email: editingFamilyMember.email,
        phone: editingFamilyMember.phone,
      },
    });
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  if (!patients.length) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Family Portal</h2>
          <p className="text-slate-600">No patients are currently accessible to your account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Family Portal</h2>
          <p className="text-slate-600">Manage patient information and family member access</p>
        </div>

        <Tabs defaultValue="patient-info" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="patient-info">Patient Information</TabsTrigger>
            <TabsTrigger value="family-members">Family Members</TabsTrigger>
          </TabsList>

          <TabsContent value="patient-info" className="space-y-6">
            <div className="grid gap-6">
              {patients.map((patient) => (
                <Card key={patient.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Heart className="text-red-500" size={20} />
                      <span>{patient.name}</span>
                      <Badge variant="secondary">Age: {calculateAge(patient.dateOfBirth)}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-slate-600">Doctor</Label>
                        <p className="text-slate-900">{patient.doctor}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-600">Payment Method</Label>
                        <p className="text-slate-900 capitalize">{patient.paymentMethod}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-600">Service Charge</Label>
                        <p className="text-slate-900">${patient.serviceCharge}</p>
                      </div>
                      {patient.cinicoExpiration && (
                        <div>
                          <Label className="text-sm font-medium text-slate-600">CINICO Expiration</Label>
                          <p className="text-slate-900">{new Date(patient.cinicoExpiration).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-slate-600">Medications</Label>
                      <p className="text-slate-900">{patient.medications || 'None listed'}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-slate-600">Specialized Tasks</Label>
                      <p className="text-slate-900">{patient.specializedTasks || 'None listed'}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="family-members" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-slate-900">Family Member Access</h3>
              <Dialog open={isAddFamilyDialogOpen} onOpenChange={setIsAddFamilyDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus size={16} className="mr-2" />
                    Add Family Member
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Family Member</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={newFamilyMember.name}
                        onChange={(e) => setNewFamilyMember({ ...newFamilyMember, name: e.target.value })}
                        placeholder="Enter full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newFamilyMember.email}
                        onChange={(e) => setNewFamilyMember({ ...newFamilyMember, email: e.target.value })}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={newFamilyMember.phone}
                        onChange={(e) => setNewFamilyMember({ ...newFamilyMember, phone: e.target.value })}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsAddFamilyDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateFamilyMember} disabled={createFamilyMemberMutation.isPending}>
                        {createFamilyMemberMutation.isPending ? "Adding..." : "Add Family Member"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {familyMembers.map((member) => (
                <Card key={member.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <User className="text-slate-500" size={20} />
                        <div>
                          <p className="font-medium text-slate-900">{member.name}</p>
                          <p className="text-sm text-slate-500">{member.email}</p>
                          <p className="text-sm text-slate-500">{member.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={member.isActive ? "default" : "secondary"}>
                          {member.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingFamilyMember(member)}
                        >
                          <Edit size={14} className="mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Edit Family Member Dialog */}
            <Dialog open={!!editingFamilyMember} onOpenChange={() => setEditingFamilyMember(null)}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Family Member</DialogTitle>
                </DialogHeader>
                {editingFamilyMember && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-name">Name</Label>
                      <Input
                        id="edit-name"
                        value={editingFamilyMember.name}
                        onChange={(e) => setEditingFamilyMember({ ...editingFamilyMember, name: e.target.value })}
                        placeholder="Enter full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-email">Email</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editingFamilyMember.email}
                        onChange={(e) => setEditingFamilyMember({ ...editingFamilyMember, email: e.target.value })}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-phone">Phone</Label>
                      <Input
                        id="edit-phone"
                        value={editingFamilyMember.phone}
                        onChange={(e) => setEditingFamilyMember({ ...editingFamilyMember, phone: e.target.value })}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setEditingFamilyMember(null)}>
                        Cancel
                      </Button>
                      <Button onClick={handleUpdateFamilyMember} disabled={updateFamilyMemberMutation.isPending}>
                        {updateFamilyMemberMutation.isPending ? "Updating..." : "Update"}
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}