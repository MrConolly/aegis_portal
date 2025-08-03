import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiPatch } from "@/lib/api";
import { 
  Pill, 
  Clock, 
  Check, 
  AlertTriangle, 
  Utensils,
  Bath,
  BedDouble,
  Car,
  Plus,
  Calendar
} from "lucide-react";

interface PatientMedication {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  customTimes?: string[];
  instructions?: string;
  isActive: boolean;
}

interface MedicationAdministration {
  id: string;
  patientId: string;
  medicationId: string;
  scheduledTime: string;
  administeredAt?: string;
  status: 'pending' | 'administered' | 'missed' | 'refused';
  notes?: string;
}

interface DailyCareTask {
  id: string;
  patientId: string;
  taskDate: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  bowelMovement: boolean;
  customTasks?: string[];
  completedCustomTasks?: string[];
  notes?: string;
}

interface ScheduledTask {
  id: string;
  patientId: string;
  taskName: string;
  description?: string;
  frequency: string;
  scheduledDays?: string[];
  nextDue: string;
  isActive: boolean;
}

interface CareManagementProps {
  patientId: string;
  patientName: string;
}

export default function CareManagement({ patientId, patientName }: CareManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch patient medications
  const { data: medications = [] } = useQuery<PatientMedication[]>({
    queryKey: [`/api/patients/${patientId}/medications`],
    enabled: !!patientId,
  });

  // Fetch medication administration for selected date
  const { data: medicationAdministration = [] } = useQuery<MedicationAdministration[]>({
    queryKey: [`/api/patients/${patientId}/medication-administration`, selectedDate],
    queryFn: () => apiGet(`/api/patients/${patientId}/medication-administration?date=${selectedDate}`),
    enabled: !!patientId,
  });

  // Fetch daily care tasks for selected date
  const { data: dailyCareTask } = useQuery<DailyCareTask>({
    queryKey: [`/api/patients/${patientId}/daily-care/${selectedDate}`],
    enabled: !!patientId,
  });

  // Fetch scheduled tasks for patient
  const { data: scheduledTasks = [] } = useQuery<ScheduledTask[]>({
    queryKey: [`/api/scheduled-tasks`, patientId],
    queryFn: () => apiGet(`/api/scheduled-tasks?patientId=${patientId}`),
    enabled: !!patientId,
  });

  // Medication administration mutation
  const medicationMutation = useMutation({
    mutationFn: (data: any) => apiPost('/api/medication-administration', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/medication-administration`] });
      toast({
        title: "Success",
        description: "Medication administration recorded",
      });
    },
  });

  // Daily care task mutation
  const dailyCareMutation = useMutation({
    mutationFn: (data: any) => 
      dailyCareTask 
        ? apiPatch(`/api/daily-care-tasks/${dailyCareTask.id}`, data)
        : apiPost('/api/daily-care-tasks', { ...data, patientId, taskDate: selectedDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/daily-care/${selectedDate}`] });
      toast({
        title: "Success",
        description: "Daily care tasks updated",
      });
    },
  });

  // Task completion mutation
  const taskCompletionMutation = useMutation({
    mutationFn: (data: any) => apiPost('/api/task-completions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/scheduled-tasks`] });
      toast({
        title: "Success",
        description: "Task marked as completed",
      });
    },
  });

  const handleMedicationAdministration = (medicationId: string, status: 'administered' | 'refused', notes?: string) => {
    const now = new Date();
    medicationMutation.mutate({
      patientId,
      medicationId,
      scheduledTime: now.toISOString(),
      administeredAt: status === 'administered' ? now.toISOString() : null,
      status,
      notes
    });
  };

  const handleDailyCareUpdate = (field: string, value: boolean | string[] | string) => {
    const updates = { [field]: value };
    dailyCareMutation.mutate(updates);
  };

  const handleTaskCompletion = (scheduledTaskId: string, notes?: string) => {
    taskCompletionMutation.mutate({
      scheduledTaskId,
      patientId,
      notes
    });
  };

  const getMedicationTimeSlots = () => {
    const timeSlots = [
      { label: 'Morning', time: '09:00', medications: [] as PatientMedication[] },
      { label: 'Afternoon', time: '13:00', medications: [] as PatientMedication[] },
      { label: 'Evening', time: '18:00', medications: [] as PatientMedication[] }
    ];

    medications.forEach((med: PatientMedication) => {
      if (med.frequency === 'morning' || med.frequency.includes('morning')) {
        timeSlots[0].medications.push(med);
      }
      if (med.frequency === 'afternoon' || med.frequency.includes('afternoon')) {
        timeSlots[1].medications.push(med);
      }
      if (med.frequency === 'evening' || med.frequency.includes('evening')) {
        timeSlots[2].medications.push(med);
      }
    });

    return timeSlots;
  };

  const getMedicationStatus = (medicationId: string, timeSlot: string) => {
    return medicationAdministration.find((admin: MedicationAdministration) => 
      admin.medicationId === medicationId && 
      admin.scheduledTime.includes(timeSlot)
    );
  };

  const getOverdueTasks = () => {
    const now = new Date();
    return scheduledTasks.filter((task: ScheduledTask) => 
      new Date(task.nextDue) <= now && task.isActive
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black">Care Management</h2>
          <p className="text-gray-600">Managing care for {patientName}</p>
        </div>
        <div className="flex items-center space-x-4">
          <Label htmlFor="care-date" className="text-sm font-medium">Date:</Label>
          <Input
            id="care-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      <Tabs defaultValue="medications" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="medications" className="flex items-center space-x-2">
            <Pill className="w-4 h-4" />
            <span>Medications</span>
          </TabsTrigger>
          <TabsTrigger value="daily-care" className="flex items-center space-x-2">
            <Utensils className="w-4 h-4" />
            <span>Daily Care</span>
          </TabsTrigger>
          <TabsTrigger value="scheduled-tasks" className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Scheduled Tasks</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="medications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Pill className="w-5 h-5 text-brand-gold" />
                <span>Medication Administration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {getMedicationTimeSlots().map((timeSlot) => (
                <div key={timeSlot.label} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{timeSlot.label}</h3>
                    <Badge variant="outline" className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{timeSlot.time}</span>
                    </Badge>
                  </div>
                  
                  {timeSlot.medications.length === 0 ? (
                    <p className="text-gray-500 text-sm">No medications scheduled for this time</p>
                  ) : (
                    <div className="space-y-3">
                      {timeSlot.medications.map((medication) => {
                        const status = getMedicationStatus(medication.id, timeSlot.time);
                        return (
                          <div key={medication.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium">{medication.medicationName}</div>
                              <div className="text-sm text-gray-600">
                                Dosage: {medication.dosage}
                              </div>
                              {medication.instructions && (
                                <div className="text-sm text-gray-500 mt-1">
                                  {medication.instructions}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {status ? (
                                <Badge 
                                  variant={status.status === 'administered' ? 'default' : 
                                          status.status === 'missed' ? 'destructive' : 'secondary'}
                                  className="capitalize"
                                >
                                  {status.status}
                                </Badge>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleMedicationAdministration(medication.id, 'administered')}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <Check className="w-4 h-4 mr-1" />
                                    Give
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleMedicationAdministration(medication.id, 'refused', 'Patient refused medication')}
                                  >
                                    Refused
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily-care" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Utensils className="w-5 h-5 text-brand-gold" />
                <span>Daily Care Tasks</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Meals Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Meals</h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { key: 'breakfast', label: 'Breakfast', icon: '🌅' },
                    { key: 'lunch', label: 'Lunch', icon: '☀️' },
                    { key: 'dinner', label: 'Dinner', icon: '🌙' }
                  ].map((meal) => (
                    <div key={meal.key} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <span className="text-2xl">{meal.icon}</span>
                      <div className="flex-1">
                        <Label htmlFor={meal.key} className="text-sm font-medium">
                          {meal.label}
                        </Label>
                      </div>
                      <Checkbox
                        id={meal.key}
                        checked={dailyCareTask?.[meal.key as keyof DailyCareTask] as boolean || false}
                        onCheckedChange={(checked) => handleDailyCareUpdate(meal.key, checked as boolean)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Other Care Tasks */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Other Care</h3>
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <span className="text-2xl">🚽</span>
                  <div className="flex-1">
                    <Label htmlFor="bowel-movement" className="text-sm font-medium">
                      Bowel Movement
                    </Label>
                  </div>
                  <Checkbox
                    id="bowel-movement"
                    checked={dailyCareTask?.bowelMovement || false}
                    onCheckedChange={(checked) => handleDailyCareUpdate('bowelMovement', checked as boolean)}
                  />
                </div>
              </div>

              {/* Custom Tasks */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Custom Tasks</h3>
                {dailyCareTask?.customTasks && dailyCareTask.customTasks.length > 0 ? (
                  <div className="space-y-2">
                    {dailyCareTask.customTasks.map((task, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <span className="text-2xl">✨</span>
                        <div className="flex-1">
                          <Label className="text-sm font-medium">{task}</Label>
                        </div>
                        <Checkbox
                          checked={dailyCareTask.completedCustomTasks?.includes(task) || false}
                          onCheckedChange={(checked) => {
                            const completed = dailyCareTask.completedCustomTasks || [];
                            const updated = checked 
                              ? [...completed, task]
                              : completed.filter(t => t !== task);
                            handleDailyCareUpdate('completedCustomTasks', updated);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No custom tasks assigned</p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="care-notes">Care Notes</Label>
                <Textarea
                  id="care-notes"
                  placeholder="Add any additional notes about today's care..."
                  value={dailyCareTask?.notes ?? ''}
                  onChange={(e) => handleDailyCareUpdate('notes', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled-tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-brand-gold" />
                <span>Scheduled Tasks</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Overdue Tasks Alert */}
              {getOverdueTasks().length > 0 && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {getOverdueTasks().length} task(s) are overdue and need attention.
                  </AlertDescription>
                </Alert>
              )}

              {/* Scheduled Tasks List */}
              <div className="space-y-3">
                {scheduledTasks.length === 0 ? (
                  <p className="text-gray-500 text-sm">No scheduled tasks for this patient</p>
                ) : (
                  scheduledTasks.map((task: ScheduledTask) => {
                    const isOverdue = new Date(task.nextDue) <= new Date();
                    const dueDate = new Date(task.nextDue);
                    
                    return (
                      <div key={task.id} className={`p-4 border rounded-lg ${isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 rounded-full bg-brand-gold/10 flex items-center justify-center">
                                {task.taskName.toLowerCase().includes('bed') ? <BedDouble className="w-4 h-4 text-brand-gold" /> :
                                 task.taskName.toLowerCase().includes('wheelchair') ? <Car className="w-4 h-4 text-brand-gold" /> :
                                 task.taskName.toLowerCase().includes('bath') ? <Bath className="w-4 h-4 text-brand-gold" /> :
                                 <Calendar className="w-4 h-4 text-brand-gold" />}
                              </div>
                              <div>
                                <h4 className="font-medium">{task.taskName}</h4>
                                {task.description && (
                                  <p className="text-sm text-gray-600">{task.description}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                Due: {dueDate.toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-500 capitalize">
                                {task.frequency}
                              </div>
                            </div>
                            
                            <Button
                              size="sm"
                              onClick={() => handleTaskCompletion(task.id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Complete
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}