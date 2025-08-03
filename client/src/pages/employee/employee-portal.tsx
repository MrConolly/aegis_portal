import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/shared/header";
import BusinessLogo from "@/components/shared/business-logo";
import CareManagement from "@/components/employee/care-management";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ChatWindow from "@/components/shared/chat-window";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  User, 
  Clock, 
  Pill, 
  FileText, 
  MessageCircle, 
  AlertTriangle,
  Heart,
  Plus,
  Activity
} from "lucide-react";

interface Patient {
  id: string;
  name: string;
  age: number;
  doctor: string;
  medications: string;
  specializedTasks: string;
  photoUrl?: string;
}

interface EmployeeNote {
  id: string;
  note: string;
  noteType: string;
  createdAt: string;
}

interface Appointment {
  id: string;
  title: string;
  description: string;
  appointmentDate: string;
  patientId: string;
}

export default function EmployeePortal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState('general');

  const { data: assignedPatients = [] } = useQuery({
    queryKey: ['/api/employees', user?.id, 'patients'],
    queryFn: () => apiGet<Patient[]>(`/api/employees/${user?.id}/patients`),
    enabled: !!user?.id && user?.role === 'employee',
  });

  const { data: patientNotes = [] } = useQuery({
    queryKey: ['/api/patients', selectedPatient, 'notes'],
    queryFn: () => apiGet<EmployeeNote[]>(`/api/patients/${selectedPatient}/notes`),
    enabled: !!selectedPatient,
  });

  const { data: todayAppointments = [] } = useQuery({
    queryKey: ['/api/appointments', new Date().toISOString().split('T')[0]],
    queryFn: () => apiGet<Appointment[]>(`/api/appointments?date=${new Date().toISOString().split('T')[0]}`),
  });

  const selectedPatientData = assignedPatients.find(p => p.id === selectedPatient);

  const handleAddNote = async () => {
    if (!selectedPatient || !newNote.trim()) {
      toast({
        title: "Error",
        description: "Please enter a note",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiPost(`/api/patients/${selectedPatient}/notes`, {
        note: newNote,
        noteType,
      });
      
      setNewNote('');
      toast({
        title: "Success",
        description: "Note added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add note",
        variant: "destructive",
      });
    }
  };

  const handleEmergencyAlert = async () => {
    if (!selectedPatient) return;

    try {
      await apiPost('/api/emergency-alert', {
        patientId: selectedPatient,
        message: 'Emergency situation reported by employee',
      });
      
      toast({
        title: "Emergency Alert Sent",
        description: "Admin and family members have been notified",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send emergency alert",
        variant: "destructive",
      });
    }
  };

  const getDailyTasks = (patient: Patient) => {
    const tasks = [];
    
    if (patient.medications) {
      tasks.push({
        type: 'medication',
        description: 'Administer medications',
        details: patient.medications,
      });
    }

    if (patient.specializedTasks) {
      const taskLines = patient.specializedTasks.split('\n');
      taskLines.forEach(task => {
        if (task.trim()) {
          tasks.push({
            type: 'specialized',
            description: task.trim(),
            details: '',
          });
        }
      });
    }

    // Add standard care tasks
    tasks.push(
      { type: 'vital', description: 'Check vital signs', details: '' },
      { type: 'general', description: 'General wellness check', details: '' }
    );

    return tasks;
  };

  if (assignedPatients.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="text-center p-6">
              <User className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Patients Assigned</h3>
              <p className="text-slate-600">You haven't been assigned to any patients yet. Please contact your administrator.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Patient Tabs */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">My Assigned Patients</h2>
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {assignedPatients.map((patient) => (
              <button
                key={patient.id}
                onClick={() => setSelectedPatient(patient.id)}
                className={`
                  flex-shrink-0 flex items-center space-x-3 px-4 py-3 rounded-lg border
                  ${selectedPatient === patient.id 
                    ? 'bg-primary text-white border-primary' 
                    : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50'
                  }
                `}
              >
                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden">
                  {patient.photoUrl ? (
                    <img src={patient.photoUrl} alt={patient.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="text-slate-400" size={16} />
                  )}
                </div>
                <div className="text-left">
                  <p className="font-medium">{patient.name}</p>
                  <p className={`text-xs ${selectedPatient === patient.id ? 'text-blue-100' : 'text-slate-500'}`}>
                    Age: {patient.age}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedPatient && selectedPatientData ? (
          <Tabs defaultValue="daily-tasks" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="daily-tasks">Daily Tasks</TabsTrigger>
              <TabsTrigger value="care-management">Care Management</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="notes">Patient Notes</TabsTrigger>
              <TabsTrigger value="chat">Communication</TabsTrigger>
              <TabsTrigger value="emergency">Emergency</TabsTrigger>
            </TabsList>

            {/* Daily Tasks */}
            <TabsContent value="daily-tasks">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="mr-2 h-5 w-5" />
                      Today's Tasks for {selectedPatientData.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {getDailyTasks(selectedPatientData).map((task, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                          <div className="flex-shrink-0 mt-1">
                            {task.type === 'medication' && <Pill className="h-4 w-4 text-blue-500" />}
                            {task.type === 'vital' && <Heart className="h-4 w-4 text-red-500" />}
                            {task.type === 'specialized' && <FileText className="h-4 w-4 text-green-500" />}
                            {task.type === 'general' && <User className="h-4 w-4 text-slate-500" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{task.description}</p>
                            {task.details && (
                              <p className="text-sm text-slate-600 mt-1">{task.details}</p>
                            )}
                          </div>
                          <Badge variant="outline" className="ml-2">
                            Pending
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Patient Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-slate-600">Doctor</label>
                        <p className="text-slate-900">{selectedPatientData.doctor || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600">Current Medications</label>
                        <p className="text-slate-900 whitespace-pre-line">
                          {selectedPatientData.medications || 'No medications listed'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600">Special Instructions</label>
                        <p className="text-slate-900 whitespace-pre-line">
                          {selectedPatientData.specializedTasks || 'No special instructions'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Care Management */}
            <TabsContent value="care-management">
              <CareManagement 
                patientId={selectedPatient}
                patientName={selectedPatientData.name}
              />
            </TabsContent>

            {/* Calendar */}
            <TabsContent value="calendar">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="mr-2 h-5 w-5" />
                    Today's Appointments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {todayAppointments
                      .filter(apt => apt.patientId === selectedPatient)
                      .map((appointment) => (
                        <div key={appointment.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-slate-900">{appointment.title}</h4>
                              <p className="text-sm text-slate-600">{appointment.description}</p>
                            </div>
                            <Badge variant="outline">
                              {new Date(appointment.appointmentDate).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    
                    {todayAppointments.filter(apt => apt.patientId === selectedPatient).length === 0 && (
                      <div className="text-center py-8 text-slate-500">
                        No appointments scheduled for today
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Patient Notes */}
            <TabsContent value="notes">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Add New Note</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Note Type</label>
                        <select 
                          value={noteType} 
                          onChange={(e) => setNoteType(e.target.value)}
                          className="form-select"
                        >
                          <option value="general">General</option>
                          <option value="vital">Vital Signs</option>
                          <option value="medication">Medication</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Note</label>
                        <Textarea
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          placeholder="Enter patient care notes..."
                          rows={4}
                          className="form-textarea"
                        />
                      </div>
                      <Button onClick={handleAddNote} className="btn-primary">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Note
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {patientNotes.map((note) => (
                        <div key={note.id} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant="outline" className="text-xs">
                              {note.noteType}
                            </Badge>
                            <span className="text-xs text-slate-500">
                              {new Date(note.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-slate-900 whitespace-pre-line">{note.note}</p>
                        </div>
                      ))}
                      
                      {patientNotes.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                          No notes recorded yet
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Communication */}
            <TabsContent value="chat">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Communication
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChatWindow />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Emergency */}
            <TabsContent value="emergency">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-red-600">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    Emergency Alert
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      Use this button only in case of emergency situations that require immediate attention 
                      from administrators and family members.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="mt-6 text-center">
                    <Button 
                      onClick={handleEmergencyAlert}
                      className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg"
                    >
                      <AlertTriangle className="mr-2 h-5 w-5" />
                      SEND EMERGENCY ALERT
                    </Button>
                  </div>
                  
                  <div className="mt-4 text-sm text-slate-600 text-center">
                    This will immediately notify:
                    <ul className="mt-2 text-left max-w-md mx-auto">
                      <li>• All administrators</li>
                      <li>• All family members of {selectedPatientData.name}</li>
                      <li>• Emergency contact protocols will be initiated</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardContent className="text-center p-12">
              <User className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Select a Patient</h3>
              <p className="text-slate-600">Choose a patient from the tabs above to view their information and tasks.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
