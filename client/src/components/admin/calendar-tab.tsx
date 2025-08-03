import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiGet, apiPost } from "@/lib/api";
import { Plus, Calendar as CalendarIcon, AlertTriangle, CreditCard, Cake } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Appointment {
  id: string;
  title: string;
  description: string;
  appointmentDate: string;
  patientId: string;
}

interface Patient {
  id: string;
  name: string;
}

export default function CalendarTab() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    title: '',
    description: '',
    appointmentDate: '',
    patientId: '',
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: appointments = [] } = useQuery({
    queryKey: ['/api/appointments'],
    queryFn: () => apiGet<Appointment[]>('/api/appointments'),
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['/api/patients'],
    queryFn: () => apiGet<Patient[]>('/api/patients'),
  });

  const createAppointmentMutation = useMutation({
    mutationFn: (data: typeof newAppointment) => apiPost('/api/appointments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      setIsAddDialogOpen(false);
      setNewAppointment({ title: '', description: '', appointmentDate: '', patientId: '' });
      toast({
        title: "Success",
        description: "Appointment created and email notifications sent",
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

  // Mock stats - in real app these would come from API
  const stats = {
    todayAppointments: appointments.filter(apt => 
      new Date(apt.appointmentDate).toDateString() === new Date().toDateString()
    ).length,
    expiringCinico: 3, // This would come from patients data
    expiringPermits: 1, // This would come from employees data
    upcomingBirthdays: 2, // This would come from employees data
  };

  const handleCreateAppointment = () => {
    if (!newAppointment.title || !newAppointment.appointmentDate || !newAppointment.patientId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createAppointmentMutation.mutate(newAppointment);
  };

  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();
  const today = new Date().getDate();
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Calendar Overview</h2>
          <p className="text-slate-600">Manage appointments, expiration dates, and critical events</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="stat-card">
            <CardContent className="flex items-center p-6">
              <div className="stat-card-icon bg-blue-100">
                <CalendarIcon className="text-primary" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Today's Appointments</p>
                <p className="text-2xl font-semibold text-slate-900">{stats.todayAppointments}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="stat-card">
            <CardContent className="flex items-center p-6">
              <div className="stat-card-icon bg-yellow-100">
                <AlertTriangle className="text-warning-healthcare" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">CINICO Expiring</p>
                <p className="text-2xl font-semibold text-slate-900">{stats.expiringCinico}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="stat-card">
            <CardContent className="flex items-center p-6">
              <div className="stat-card-icon bg-red-100">
                <CreditCard className="text-error-healthcare" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Work Permits Expiring</p>
                <p className="text-2xl font-semibold text-slate-900">{stats.expiringPermits}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="stat-card">
            <CardContent className="flex items-center p-6">
              <div className="stat-card-icon bg-green-100">
                <Cake className="text-secondary-healthcare" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Upcoming Birthdays</p>
                <p className="text-2xl font-semibold text-slate-900">{stats.upcomingBirthdays}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Quick Actions</CardTitle>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="btn-primary">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Appointment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Appointment</DialogTitle>
                    <DialogDescription>
                      Schedule a new appointment for a patient with an employee.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="patient">Patient</Label>
                      <Select value={newAppointment.patientId || undefined} onValueChange={(value) => 
                        setNewAppointment(prev => ({ ...prev, patientId: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Patient" />
                        </SelectTrigger>
                        <SelectContent>
                          {patients.map((patient) => (
                            <SelectItem key={patient.id} value={patient.id}>
                              {patient.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={newAppointment.title}
                        onChange={(e) => setNewAppointment(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Appointment title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="datetime">Date & Time</Label>
                      <Input
                        id="datetime"
                        type="datetime-local"
                        value={newAppointment.appointmentDate}
                        onChange={(e) => setNewAppointment(prev => ({ ...prev, appointmentDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newAppointment.description}
                        onChange={(e) => setNewAppointment(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Appointment details..."
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end space-x-3">
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleCreateAppointment}
                        disabled={createAppointmentMutation.isPending}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Calendar Header */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-slate-600 py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  className={`
                    calendar-day
                    ${day === today && 
                      selectedDate.getMonth() === currentMonth && 
                      selectedDate.getFullYear() === currentYear ? 'selected' : ''
                    }
                    ${day === null ? 'text-slate-400 border-none hover:bg-transparent cursor-default' : ''}
                  `}
                >
                  {day}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events & Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointments.slice(0, 3).map((appointment) => (
                <div key={appointment.id} className="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="stat-card-icon bg-blue-100">
                    <CalendarIcon className="text-primary" size={20} />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="font-medium text-slate-900">{appointment.title}</p>
                    <p className="text-sm text-slate-600">{appointment.description}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(appointment.appointmentDate).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {appointments.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  No upcoming appointments
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
