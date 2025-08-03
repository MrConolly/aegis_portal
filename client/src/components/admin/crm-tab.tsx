import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { apiGet, apiPost } from "@/lib/api";
import { Plus, Search, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CrmLead {
  id: string;
  name: string;
  age: number | null;
  condition: string | null;
  stage: string;
  lastContact: string | null;
  notes: string | null;
  contactMethod: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  priority: string;
  source: string | null;
  assignedTo: string | null;
  followUpDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function CrmTab() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newLead, setNewLead] = useState({
    name: '',
    age: '',
    condition: '',
    stage: 'initial_contact',
    lastContact: '',
    notes: '',
    contactMethod: 'phone',
    phone: '',
    email: '',
    address: '',
    priority: 'medium',
    source: 'referral',
    assignedTo: '',
    followUpDate: '',
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: leads = [] } = useQuery({
    queryKey: ['/api/crm-leads'],
    queryFn: () => apiGet<CrmLead[]>('/api/crm-leads'),
  });

  const createLeadMutation = useMutation({
    mutationFn: (data: any) => apiPost('/api/crm-leads', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm-leads'] });
      setIsAddDialogOpen(false);
      setNewLead({
        name: '',
        age: '',
        condition: '',
        stage: 'initial_contact',
        lastContact: '',
        notes: '',
        contactMethod: 'phone',
        phone: '',
        email: '',
        address: '',
        priority: 'medium',
        source: 'referral',
        assignedTo: '',
        followUpDate: '',
      });
      toast({
        title: "Success",
        description: "Lead created successfully",
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

  const convertToPatientMutation = useMutation({
    mutationFn: ({ leadId, patientData }: { leadId: string; patientData: any }) => 
      apiPost(`/api/crm-leads/${leadId}/convert`, patientData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm-leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      toast({
        title: "Success",
        description: "Lead converted to patient successfully",
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

  const filteredLeads = leads.filter(lead => {
    const matchesStage = selectedStage === 'all' || lead.stage === selectedStage;
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (lead.condition && lead.condition.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStage && matchesSearch;
  });

  const getLeadsByStage = (stage: string) => {
    return filteredLeads.filter(lead => lead.stage === stage);
  };

  const handleCreateLead = () => {
    if (!newLead.name) {
      toast({
        title: "Error",
        description: "Lead name is required",
        variant: "destructive",
      });
      return;
    }

    const leadData = {
      ...newLead,
      age: newLead.age ? parseInt(newLead.age) : null,
    };

    createLeadMutation.mutate(leadData);
  };

  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState<CrmLead | null>(null);
  const [conversionData, setConversionData] = useState({
    doctor: '',
    medications: '',
    paymentMethod: 'cash',
    serviceCharge: '',
    cinicoExpiration: '',
  });

  const handleConvertToPatient = (lead: CrmLead) => {
    setLeadToConvert(lead);
    setConvertDialogOpen(true);
  };

  const executeConversion = () => {
    if (!leadToConvert) return;

    const patientData = {
      name: leadToConvert.name,
      dateOfBirth: leadToConvert.age ? 
        new Date(new Date().getFullYear() - leadToConvert.age, 0, 1).toISOString().split('T')[0] : 
        new Date().toISOString().split('T')[0],
      doctor: conversionData.doctor,
      medications: conversionData.medications,
      specializedTasks: leadToConvert.notes || '',
      paymentMethod: conversionData.paymentMethod,
      serviceCharge: conversionData.serviceCharge ? parseFloat(conversionData.serviceCharge) : null,
      cinicoExpiration: conversionData.cinicoExpiration || null,
      isActive: true,
    };

    convertToPatientMutation.mutate({
      leadId: leadToConvert.id,
      patientData,
    });

    setConvertDialogOpen(false);
    setLeadToConvert(null);
    setConversionData({
      doctor: '',
      medications: '',
      paymentMethod: 'cash',
      serviceCharge: '',
      cinicoExpiration: '',
    });
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'initial_contact':
        return 'bg-blue-100 text-blue-800';
      case 'qualification':
        return 'bg-purple-100 text-purple-800';
      case 'needs_assessment':
        return 'bg-orange-100 text-orange-800';
      case 'proposal':
        return 'bg-yellow-100 text-yellow-800';
      case 'negotiation':
        return 'bg-indigo-100 text-indigo-800';
      case 'ready_to_convert':
        return 'bg-green-100 text-green-800';
      case 'converted':
        return 'bg-emerald-100 text-emerald-800';
      case 'lost':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageDisplayName = (stage: string) => {
    switch (stage) {
      case 'initial_contact':
        return 'Initial Contact';
      case 'qualification':
        return 'Qualification';
      case 'needs_assessment':
        return 'Needs Assessment';
      case 'proposal':
        return 'Proposal';
      case 'negotiation':
        return 'Negotiation';
      case 'ready_to_convert':
        return 'Ready to Convert';
      case 'converted':
        return 'Converted';
      case 'lost':
        return 'Lost';
      default:
        return stage;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">CRM - Lead Management</h2>
          <p className="text-slate-600">Track potential patients through the onboarding process</p>
        </div>

        {/* Actions Bar */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex space-x-4">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-primary">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Lead
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Lead</DialogTitle>
                  <DialogDescription>
                    Add a new potential client to the CRM system for tracking and follow-up.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={newLead.name}
                      onChange={(e) => setNewLead(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Lead name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={newLead.age}
                      onChange={(e) => setNewLead(prev => ({ ...prev, age: e.target.value }))}
                      placeholder="Age"
                    />
                  </div>
                  <div>
                    <Label htmlFor="condition">Condition</Label>
                    <Input
                      id="condition"
                      value={newLead.condition}
                      onChange={(e) => setNewLead(prev => ({ ...prev, condition: e.target.value }))}
                      placeholder="Medical condition"
                    />
                  </div>
                  <div>
                    <Label htmlFor="stage">Stage</Label>
                    <Select value={newLead.stage} onValueChange={(value) => 
                      setNewLead(prev => ({ ...prev, stage: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="initial_contact">Initial Contact</SelectItem>
                        <SelectItem value="qualification">Qualification</SelectItem>
                        <SelectItem value="needs_assessment">Needs Assessment</SelectItem>
                        <SelectItem value="proposal">Proposal</SelectItem>
                        <SelectItem value="negotiation">Negotiation</SelectItem>
                        <SelectItem value="ready_to_convert">Ready to Convert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="lastContact">Last Contact</Label>
                    <Input
                      id="lastContact"
                      value={newLead.lastContact}
                      onChange={(e) => setNewLead(prev => ({ ...prev, lastContact: e.target.value }))}
                      placeholder="Description of last contact"
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={newLead.notes}
                      onChange={(e) => setNewLead(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes..."
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateLead}
                      disabled={createLeadMutation.isPending}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={selectedStage} onValueChange={setSelectedStage}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              <SelectItem value="initial_contact">Initial Contact</SelectItem>
              <SelectItem value="qualification">Qualification</SelectItem>
              <SelectItem value="needs_assessment">Needs Assessment</SelectItem>
              <SelectItem value="proposal">Proposal</SelectItem>
              <SelectItem value="negotiation">Negotiation</SelectItem>
              <SelectItem value="ready_to_convert">Ready to Convert</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* CRM Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Initial Contact */}
          <Card>
            <CardHeader className="bg-slate-50">
              <CardTitle className="text-lg">Initial Contact</CardTitle>
              <p className="text-sm text-slate-600">
                {getLeadsByStage('initial_contact').length} leads
              </p>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {getLeadsByStage('initial_contact').map((lead) => (
                <div key={lead.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-slate-900">{lead.name}</h4>
                    <span className="text-xs text-slate-500">
                      {new Date(lead.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {(lead.age || lead.condition) && (
                    <p className="text-sm text-slate-600 mb-2">
                      {lead.age && `Age: ${lead.age}`}
                      {lead.age && lead.condition && ' | '}
                      {lead.condition}
                    </p>
                  )}
                  {lead.lastContact && (
                    <p className="text-xs text-slate-500 mb-3">
                      Last contact: {lead.lastContact}
                    </p>
                  )}
                  <div className="flex space-x-2">
                    <Badge className="text-xs bg-blue-100 text-blue-800">Call</Badge>
                    <Badge className="text-xs bg-green-100 text-green-800">Email</Badge>
                  </div>
                </div>
              ))}
              {getLeadsByStage('initial_contact').length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  No leads in this stage
                </div>
              )}
            </CardContent>
          </Card>

          {/* In Progress */}
          <Card>
            <CardHeader className="bg-slate-50">
              <CardTitle className="text-lg">In Progress</CardTitle>
              <p className="text-sm text-slate-600">
                {getLeadsByStage('in_progress').length} leads
              </p>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {getLeadsByStage('in_progress').map((lead) => (
                <div key={lead.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-slate-900">{lead.name}</h4>
                    <span className="text-xs text-slate-500">
                      {new Date(lead.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {(lead.age || lead.condition) && (
                    <p className="text-sm text-slate-600 mb-2">
                      {lead.age && `Age: ${lead.age}`}
                      {lead.age && lead.condition && ' | '}
                      {lead.condition}
                    </p>
                  )}
                  {lead.lastContact && (
                    <p className="text-xs text-slate-500 mb-3">
                      Last contact: {lead.lastContact}
                    </p>
                  )}
                  <div className="flex space-x-2">
                    <Badge className="text-xs bg-yellow-100 text-yellow-800">Follow Up</Badge>
                    <Badge className="text-xs bg-purple-100 text-purple-800">Schedule</Badge>
                  </div>
                </div>
              ))}
              {getLeadsByStage('in_progress').length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  No leads in this stage
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ready to Convert */}
          <Card>
            <CardHeader className="bg-slate-50">
              <CardTitle className="text-lg">Ready to Convert</CardTitle>
              <p className="text-sm text-slate-600">
                {getLeadsByStage('ready_to_convert').length} leads
              </p>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {getLeadsByStage('ready_to_convert').map((lead) => (
                <div key={lead.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-slate-900">{lead.name}</h4>
                    <span className="text-xs text-slate-500">
                      {new Date(lead.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {(lead.age || lead.condition) && (
                    <p className="text-sm text-slate-600 mb-2">
                      {lead.age && `Age: ${lead.age}`}
                      {lead.age && lead.condition && ' | '}
                      {lead.condition}
                    </p>
                  )}
                  {lead.lastContact && (
                    <p className="text-xs text-slate-500 mb-3">
                      Last contact: {lead.lastContact}
                    </p>
                  )}
                  <Button
                    className="w-full btn-secondary text-sm"
                    onClick={() => handleConvertToPatient(lead)}
                    disabled={convertToPatientMutation.isPending}
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Convert to Patient
                  </Button>
                </div>
              ))}
              {getLeadsByStage('ready_to_convert').length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  No leads in this stage
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
