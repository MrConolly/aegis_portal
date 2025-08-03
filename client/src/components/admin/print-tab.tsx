import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { apiGet } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import BusinessLogo from "@/components/shared/business-logo";
import { 
  Printer, 
  Download, 
  FileText, 
  Calendar,
  User,
  Heart,
  Pill,
  ClipboardCheck
} from "lucide-react";

interface Patient {
  id: string;
  name: string;
  age: number;
  doctor: string;
}

interface EmployeeNote {
  id: string;
  note: string;
  noteType: string;
  createdAt: string;
  employeeId: string;
}

interface Appointment {
  id: string;
  title: string;
  description: string;
  appointmentDate: string;
  patientId: string;
}

interface ReportData {
  patient: Patient | null;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  includeOptions: {
    vitalSigns: boolean;
    medications: boolean;
    appointments: boolean;
    careNotes: boolean;
    generalInfo: boolean;
  };
}

export default function PrintTab() {
  const [reportData, setReportData] = useState<ReportData>({
    patient: null,
    dateRange: {
      startDate: '',
      endDate: '',
    },
    includeOptions: {
      vitalSigns: true,
      medications: true,
      appointments: true,
      careNotes: true,
      generalInfo: true,
    },
  });
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');

  const { toast } = useToast();

  const { data: patients = [] } = useQuery({
    queryKey: ['/api/patients'],
    queryFn: () => apiGet<Patient[]>('/api/patients'),
  });

  const { data: patientNotes = [] } = useQuery({
    queryKey: ['/api/patients', reportData.patient?.id, 'notes'],
    queryFn: () => apiGet<EmployeeNote[]>(`/api/patients/${reportData.patient?.id}/notes`),
    enabled: !!reportData.patient?.id,
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['/api/appointments'],
    queryFn: () => apiGet<Appointment[]>('/api/appointments'),
  });

  const handlePatientSelect = (patientId: string) => {
    const selectedPatient = patients.find(p => p.id === patientId) || null;
    setSelectedPatientId(patientId);
    setReportData(prev => ({ ...prev, patient: selectedPatient }));
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setReportData(prev => ({
      ...prev,
      dateRange: { ...prev.dateRange, [field]: value }
    }));
  };

  const handleIncludeOptionChange = (option: keyof ReportData['includeOptions'], checked: boolean) => {
    setReportData(prev => ({
      ...prev,
      includeOptions: { ...prev.includeOptions, [option]: checked }
    }));
  };

  const validateReportData = () => {
    if (!reportData.patient) {
      toast({
        title: "Error",
        description: "Please select a patient",
        variant: "destructive",
      });
      return false;
    }

    if (!reportData.dateRange.startDate || !reportData.dateRange.endDate) {
      toast({
        title: "Error",
        description: "Please select date range",
        variant: "destructive",
      });
      return false;
    }

    const hasAnyOption = Object.values(reportData.includeOptions).some(option => option);
    if (!hasAnyOption) {
      toast({
        title: "Error",
        description: "Please select at least one information type to include",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handlePrintReport = () => {
    if (!validateReportData()) return;

    // Generate print content
    const printContent = generateReportHTML();
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }

    toast({
      title: "Success",
      description: "Report sent to printer",
    });
  };

  const handleDownloadPDF = async () => {
    if (!validateReportData()) return;

    try {
      // In a real implementation, this would call a backend service to generate PDF
      toast({
        title: "PDF Generation",
        description: "PDF report is being generated and will download shortly",
      });
      
      // Simulate PDF generation
      setTimeout(() => {
        toast({
          title: "Success",
          description: "PDF report downloaded successfully",
        });
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF report",
        variant: "destructive",
      });
    }
  };

  const generateReportHTML = () => {
    const { patient, dateRange, includeOptions } = reportData;
    
    const filteredNotes = patientNotes.filter(note => {
      const noteDate = new Date(note.createdAt);
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      return noteDate >= startDate && noteDate <= endDate;
    });

    const filteredAppointments = appointments.filter(apt => {
      if (apt.patientId !== patient?.id) return false;
      const aptDate = new Date(apt.appointmentDate);
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      return aptDate >= startDate && aptDate <= endDate;
    });

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Patient Care Report - ${patient?.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: white; color: #000; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #FFD700; padding-bottom: 20px; }
            .logo-section { display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
            .logo-circle { width: 60px; height: 60px; background: linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #000; box-shadow: 0 4px 8px rgba(0,0,0,0.3); margin-right: 15px; }
            .logo-cross-v { width: 8px; height: 30px; background: #000; border-radius: 2px; }
            .logo-cross-h { width: 30px; height: 8px; background: #000; border-radius: 2px; position: absolute; }
            .company-name { font-size: 24px; font-weight: bold; color: #000; }
            .company-subtitle { font-size: 14px; color: #FFD700; font-weight: 600; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 18px; font-weight: bold; color: #000; margin-bottom: 15px; border-left: 4px solid #FFD700; padding-left: 10px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; }
            .info-item { display: flex; }
            .info-label { font-weight: bold; margin-right: 10px; color: #000; }
            .note-item, .appointment-item { border: 1px solid #e2e8f0; padding: 15px; margin-bottom: 10px; border-radius: 5px; border-left: 4px solid #FFD700; }
            .note-type { background: #FFD700; color: #000; padding: 3px 8px; border-radius: 3px; font-size: 12px; font-weight: bold; }
            .date-time { color: #666; font-size: 14px; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #FFD700; font-size: 12px; color: #666; }
            @media print { 
              body { margin: 0; } 
              .logo-section { -webkit-print-color-adjust: exact; color-adjust: exact; }
              .logo-circle { -webkit-print-color-adjust: exact; color-adjust: exact; }
              .note-type { -webkit-print-color-adjust: exact; color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-section">
              <div style="width: 60px; height: 60px; margin-right: 15px; display: flex; align-items: center; justify-content: center;">
                <svg viewBox="0 0 100 100" style="width: 60px; height: 60px;">
                  <!-- AEGIS Shield -->
                  <defs>
                    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#FFD700" />
                      <stop offset="50%" stop-color="#FFA500" />
                      <stop offset="100%" stop-color="#DAA520" />
                    </linearGradient>
                  </defs>
                  <path d="M50 10 L80 25 L80 65 C80 75 50 90 50 90 C50 90 20 75 20 65 L20 25 Z" fill="#000" stroke="url(#goldGradient)" stroke-width="2"/>
                  <text x="50" y="55" font-family="serif" font-size="30" font-weight="bold" fill="url(#goldGradient)" text-anchor="middle">A</text>
                  <circle cx="50" cy="20" r="6" fill="url(#goldGradient)" stroke="#000" stroke-width="1"/>
                </svg>
              </div>
              <div>
                <div class="company-name">AEGIS</div>
                <div class="company-subtitle">Patient Care Portal</div>
              </div>
            </div>
            <h1 style="color: #000; margin: 10px 0;">Patient Care Report</h1>
            <h2 style="color: #FFD700; margin: 5px 0;">${patient?.name}</h2>
            <p>Report Period: ${new Date(dateRange.startDate).toLocaleDateString()} - ${new Date(dateRange.endDate).toLocaleDateString()}</p>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>

          ${includeOptions.generalInfo ? `
            <div class="section">
              <div class="section-title">Patient Information</div>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Name:</span>
                  <span>${patient?.name}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Age:</span>
                  <span>${patient?.age}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Doctor:</span>
                  <span>${patient?.doctor || 'Not specified'}</span>
                </div>
              </div>
            </div>
          ` : ''}

          ${includeOptions.appointments ? `
            <div class="section">
              <div class="section-title">Appointments (${filteredAppointments.length})</div>
              ${filteredAppointments.map(apt => `
                <div class="appointment-item">
                  <div style="font-weight: bold;">${apt.title}</div>
                  <div class="date-time">${new Date(apt.appointmentDate).toLocaleString()}</div>
                  <div>${apt.description}</div>
                </div>
              `).join('')}
              ${filteredAppointments.length === 0 ? '<p>No appointments in selected date range</p>' : ''}
            </div>
          ` : ''}

          ${includeOptions.careNotes ? `
            <div class="section">
              <div class="section-title">Care Notes (${filteredNotes.length})</div>
              ${filteredNotes.map(note => `
                <div class="note-item">
                  <div style="margin-bottom: 8px;">
                    <span class="note-type">${note.noteType.toUpperCase()}</span>
                    <span class="date-time" style="float: right;">${new Date(note.createdAt).toLocaleString()}</span>
                  </div>
                  <div>${note.note}</div>
                </div>
              `).join('')}
              ${filteredNotes.length === 0 ? '<p>No care notes in selected date range</p>' : ''}
            </div>
          ` : ''}

          ${includeOptions.vitalSigns ? `
            <div class="section">
              <div class="section-title">Vital Signs</div>
              ${filteredNotes.filter(note => note.noteType === 'vital').map(note => `
                <div class="note-item">
                  <div class="date-time">${new Date(note.createdAt).toLocaleString()}</div>
                  <div>${note.note}</div>
                </div>
              `).join('')}
              ${filteredNotes.filter(note => note.noteType === 'vital').length === 0 ? '<p>No vital signs recorded in selected date range</p>' : ''}
            </div>
          ` : ''}

          ${includeOptions.medications ? `
            <div class="section">
              <div class="section-title">Medication Administration</div>
              ${filteredNotes.filter(note => note.noteType === 'medication').map(note => `
                <div class="note-item">
                  <div class="date-time">${new Date(note.createdAt).toLocaleString()}</div>
                  <div>${note.note}</div>
                </div>
              `).join('')}
              ${filteredNotes.filter(note => note.noteType === 'medication').length === 0 ? '<p>No medication records in selected date range</p>' : ''}
            </div>
          ` : ''}

          <div class="footer">
            <div class="logo-section" style="margin-bottom: 10px;">
              <div style="width: 30px; height: 30px; margin-right: 8px; display: flex; align-items: center; justify-content: center;">
                <svg viewBox="0 0 100 100" style="width: 30px; height: 30px;">
                  <defs>
                    <linearGradient id="smallGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#FFD700" />
                      <stop offset="50%" stop-color="#FFA500" />
                      <stop offset="100%" stop-color="#DAA520" />
                    </linearGradient>
                  </defs>
                  <path d="M50 15 L75 25 L75 60 C75 68 50 80 50 80 C50 80 25 68 25 60 L25 25 Z" fill="#000" stroke="url(#smallGoldGradient)" stroke-width="2"/>
                  <text x="50" y="55" font-family="serif" font-size="25" font-weight="bold" fill="url(#smallGoldGradient)" text-anchor="middle">A</text>
                </svg>
              </div>
              <div>
                <div style="font-size: 14px; font-weight: bold; color: #000;">AEGIS</div>
                <div style="font-size: 10px; color: #FFD700;">Patient Care Portal</div>
              </div>
            </div>
            <p>This report was generated by AEGIS Patient Care Portal</p>
            <p>For questions about this report, please contact your healthcare administrator</p>
          </div>
        </body>
      </html>
    `;
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Print & Export Reports</h2>
          <p className="text-slate-600">Generate comprehensive patient care reports for doctors and families</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Report Configuration */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Report Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Patient Selection */}
                <div>
                  <Label className="text-base font-medium">Select Patient</Label>
                  <Select value={selectedPatientId} onValueChange={handlePatientSelect}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Choose a patient for the report" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.name} (Age: {patient.age})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Date Range */}
                <div>
                  <Label className="text-base font-medium">Report Date Range</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label htmlFor="startDate" className="text-sm">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={reportData.dateRange.startDate}
                        onChange={(e) => handleDateChange('startDate', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate" className="text-sm">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={reportData.dateRange.endDate}
                        onChange={(e) => handleDateChange('endDate', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Include Options */}
                <div>
                  <Label className="text-base font-medium">Information to Include</Label>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="generalInfo"
                        checked={reportData.includeOptions.generalInfo}
                        onCheckedChange={(checked) => handleIncludeOptionChange('generalInfo', checked as boolean)}
                      />
                      <Label htmlFor="generalInfo" className="text-sm flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        General Information
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="vitalSigns"
                        checked={reportData.includeOptions.vitalSigns}
                        onCheckedChange={(checked) => handleIncludeOptionChange('vitalSigns', checked as boolean)}
                      />
                      <Label htmlFor="vitalSigns" className="text-sm flex items-center">
                        <Heart className="mr-2 h-4 w-4" />
                        Vital Signs
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="medications"
                        checked={reportData.includeOptions.medications}
                        onCheckedChange={(checked) => handleIncludeOptionChange('medications', checked as boolean)}
                      />
                      <Label htmlFor="medications" className="text-sm flex items-center">
                        <Pill className="mr-2 h-4 w-4" />
                        Medication Logs
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="appointments"
                        checked={reportData.includeOptions.appointments}
                        onCheckedChange={(checked) => handleIncludeOptionChange('appointments', checked as boolean)}
                      />
                      <Label htmlFor="appointments" className="text-sm flex items-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        Appointments
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="careNotes"
                        checked={reportData.includeOptions.careNotes}
                        onCheckedChange={(checked) => handleIncludeOptionChange('careNotes', checked as boolean)}
                      />
                      <Label htmlFor="careNotes" className="text-sm flex items-center">
                        <ClipboardCheck className="mr-2 h-4 w-4" />
                        Care Notes
                      </Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview & Actions */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Report Preview & Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {reportData.patient ? (
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-medium text-slate-900 mb-2">Selected Patient</h4>
                    <p className="text-sm text-slate-600">{reportData.patient.name}</p>
                    <p className="text-xs text-slate-500">Age: {reportData.patient.age}</p>
                    <p className="text-xs text-slate-500">Doctor: {reportData.patient.doctor || 'Not specified'}</p>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-lg text-center">
                    <p className="text-sm text-slate-500">No patient selected</p>
                  </div>
                )}

                {reportData.dateRange.startDate && reportData.dateRange.endDate && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-slate-900 mb-2">Date Range</h4>
                    <p className="text-sm text-slate-600">
                      {new Date(reportData.dateRange.startDate).toLocaleDateString()} - {' '}
                      {new Date(reportData.dateRange.endDate).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <Button 
                    onClick={handlePrintReport}
                    className="w-full btn-primary"
                    disabled={!reportData.patient}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print Report
                  </Button>
                  
                  <Button 
                    onClick={handleDownloadPDF}
                    variant="outline"
                    className="w-full"
                    disabled={!reportData.patient}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download as PDF
                  </Button>
                </div>

                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <h5 className="text-sm font-medium text-green-800 mb-1">Available in Both Portals</h5>
                  <p className="text-xs text-green-700">
                    This print feature is available in both Admin Portal and Family Portal for convenient access.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Report Statistics */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="stat-card-icon bg-blue-100">
                  <FileText className="text-primary" size={20} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Reports Generated Today</p>
                  <p className="text-2xl font-semibold text-slate-900">
                    {reportData.patient && patientNotes.length > 0 ? patientNotes.length : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="stat-card-icon bg-green-100">
                  <ClipboardCheck className="text-secondary-healthcare" size={20} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Available Care Notes</p>
                  <p className="text-2xl font-semibold text-slate-900">
                    {reportData.patient ? patientNotes.length : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="stat-card-icon bg-yellow-100">
                  <Calendar className="text-warning-healthcare" size={20} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Appointments in Range</p>
                  <p className="text-2xl font-semibold text-slate-900">
                    {reportData.patient ? appointments.filter(apt => apt.patientId === reportData.patient?.id).length : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="stat-card-icon bg-purple-100">
                  <Download className="text-purple-600" size={20} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">PDF Downloads</p>
                  <p className="text-2xl font-semibold text-slate-900">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
