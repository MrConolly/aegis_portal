import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { apiGet, apiPut } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { 
  Star, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User,
  Users,
  TrendingUp
} from "lucide-react";

interface Review {
  id: string;
  reviewerId: string;
  targetId: string;
  targetType: string;
  rating: number;
  comment: string;
  isAddressed: boolean;
  adminNotes: string;
  createdAt: string;
}

interface Employee {
  id: string;
  name: string;
  position: string;
}

interface Patient {
  id: string;
  name: string;
}

interface User {
  id: string;
  username: string;
  role: string;
}

export default function ReviewTab() {
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: reviews = [] } = useQuery({
    queryKey: ['/api/reviews'],
    queryFn: () => apiGet<Review[]>('/api/reviews'),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
    queryFn: () => apiGet<Employee[]>('/api/employees'),
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['/api/patients'],
    queryFn: () => apiGet<Patient[]>('/api/patients'),
  });

  const updateReviewMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Review> }) => 
      apiPut(`/api/reviews/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
      setIsNotesDialogOpen(false);
      setAdminNotes('');
      setSelectedReview(null);
      toast({
        title: "Success",
        description: "Review updated successfully",
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

  const getTargetName = (targetId: string, targetType: string) => {
    if (targetType === 'employee') {
      const employee = employees.find(e => e.id === targetId);
      return employee?.name || 'Unknown Employee';
    } else if (targetType === 'patient') {
      const patient = patients.find(p => p.id === targetId);
      return patient?.name || 'Unknown Patient';
    }
    return 'Unknown';
  };

  const getTargetDetails = (targetId: string, targetType: string) => {
    if (targetType === 'employee') {
      const employee = employees.find(e => e.id === targetId);
      return employee?.position || '';
    }
    return '';
  };

  const handleMarkAsAddressed = (review: Review) => {
    updateReviewMutation.mutate({
      id: review.id,
      updates: { isAddressed: true }
    });
  };

  const handleAddAdminNotes = (review: Review) => {
    setSelectedReview(review);
    setAdminNotes(review.adminNotes || '');
    setIsNotesDialogOpen(true);
  };

  const submitAdminNotes = () => {
    if (!selectedReview) return;

    updateReviewMutation.mutate({
      id: selectedReview.id,
      updates: { 
        adminNotes,
        isAddressed: true 
      }
    });
  };

  const filteredReviews = reviews.filter(review => {
    const typeMatch = filterType === 'all' || review.targetType === filterType;
    const statusMatch = filterStatus === 'all' || 
      (filterStatus === 'addressed' && review.isAddressed) ||
      (filterStatus === 'pending' && !review.isAddressed);
    return typeMatch && statusMatch;
  });

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'fill-current text-yellow-400' : 'text-slate-300'}`}
      />
    ));
  };

  // Calculate statistics
  const employeeReviews = reviews.filter(r => r.targetType === 'employee');
  const patientReviews = reviews.filter(r => r.targetType === 'patient');
  const pendingReviews = reviews.filter(r => !r.isAddressed);
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Review Management</h2>
          <p className="text-slate-600">Monitor and respond to feedback from family members and internal assessments</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="stat-card-icon bg-blue-100">
                <Star className="text-primary" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Average Rating</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {averageRating.toFixed(1)}/5
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="stat-card-icon bg-green-100">
                <Users className="text-secondary-healthcare" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Employee Reviews</p>
                <p className="text-2xl font-semibold text-slate-900">{employeeReviews.length}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="stat-card-icon bg-purple-100">
                <User className="text-purple-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Patient Reviews</p>
                <p className="text-2xl font-semibold text-slate-900">{patientReviews.length}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="stat-card-icon bg-red-100">
                <AlertTriangle className="text-error-healthcare" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Pending Reviews</p>
                <p className="text-2xl font-semibold text-slate-900">{pendingReviews.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="employee-reviews" className="space-y-6">
          <TabsList>
            <TabsTrigger value="employee-reviews">Employee Reviews</TabsTrigger>
            <TabsTrigger value="patient-reviews">Patient Reviews</TabsTrigger>
            <TabsTrigger value="all-reviews">All Reviews</TabsTrigger>
          </TabsList>

          {/* Employee Reviews Tab */}
          <TabsContent value="employee-reviews">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Reviews About Employees</CardTitle>
                  <div className="flex space-x-2">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="addressed">Addressed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredReviews
                    .filter(review => review.targetType === 'employee')
                    .map((review) => (
                      <div key={review.id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-slate-900">
                              Review for: {getTargetName(review.targetId, review.targetType)}
                            </h4>
                            <p className="text-sm text-slate-600">
                              {getTargetDetails(review.targetId, review.targetType)}
                            </p>
                            <div className="flex items-center mt-1">
                              {getRatingStars(review.rating)}
                              <span className="ml-2 text-sm text-slate-600">
                                {review.rating}/5 stars
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={`status-badge ${review.isAddressed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {review.isAddressed ? (
                                <>
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Addressed
                                </>
                              ) : (
                                <>
                                  <Clock className="mr-1 h-3 w-3" />
                                  Pending
                                </>
                              )}
                            </Badge>
                            <span className="text-xs text-slate-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        <div className="bg-slate-50 rounded-md p-3 mb-3">
                          <p className="text-sm text-slate-900">{review.comment}</p>
                        </div>
                        
                        {review.adminNotes && (
                          <div className="bg-blue-50 rounded-md p-3 mb-3 border border-blue-200">
                            <h5 className="text-sm font-medium text-blue-900 mb-1">Admin Notes:</h5>
                            <p className="text-sm text-blue-800">{review.adminNotes}</p>
                          </div>
                        )}
                        
                        <div className="flex space-x-2">
                          {!review.isAddressed && (
                            <Button
                              size="sm"
                              onClick={() => handleMarkAsAddressed(review)}
                              className="btn-secondary"
                            >
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Mark as Addressed
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddAdminNotes(review)}
                          >
                            <MessageSquare className="mr-1 h-4 w-4" />
                            {review.adminNotes ? 'Edit Notes' : 'Add Notes'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  
                  {filteredReviews.filter(review => review.targetType === 'employee').length === 0 && (
                    <div className="text-center py-12">
                      <Star className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                      <p className="text-slate-600">No employee reviews found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Patient Reviews Tab */}
          <TabsContent value="patient-reviews">
            <Card>
              <CardHeader>
                <CardTitle>Reviews About Patients & Personalities</CardTitle>
                <p className="text-sm text-slate-600">Internal assessments for care improvement</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredReviews
                    .filter(review => review.targetType === 'patient')
                    .map((review) => (
                      <div key={review.id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-slate-900">
                              Assessment for: {getTargetName(review.targetId, review.targetType)}
                            </h4>
                            <div className="flex items-center mt-1">
                              {getRatingStars(review.rating)}
                              <span className="ml-2 text-sm text-slate-600">
                                {review.rating}/5 rating
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={`status-badge ${review.isAddressed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {review.isAddressed ? 'Reviewed' : 'Pending'}
                            </Badge>
                            <span className="text-xs text-slate-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        <div className="bg-slate-50 rounded-md p-3 mb-3">
                          <p className="text-sm text-slate-900">{review.comment}</p>
                        </div>
                        
                        {review.adminNotes && (
                          <div className="bg-blue-50 rounded-md p-3 mb-3 border border-blue-200">
                            <h5 className="text-sm font-medium text-blue-900 mb-1">Admin Notes:</h5>
                            <p className="text-sm text-blue-800">{review.adminNotes}</p>
                          </div>
                        )}
                        
                        <div className="flex space-x-2">
                          {!review.isAddressed && (
                            <Button
                              size="sm"
                              onClick={() => handleMarkAsAddressed(review)}
                              className="btn-secondary"
                            >
                              Mark as Reviewed
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddAdminNotes(review)}
                          >
                            {review.adminNotes ? 'Edit Notes' : 'Add Notes'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  
                  {filteredReviews.filter(review => review.targetType === 'patient').length === 0 && (
                    <div className="text-center py-12">
                      <User className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                      <p className="text-slate-600">No patient assessments found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Reviews Tab */}
          <TabsContent value="all-reviews">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>All Reviews & Assessments</CardTitle>
                  <div className="flex space-x-2">
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="employee">Employee Reviews</SelectItem>
                        <SelectItem value="patient">Patient Assessments</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="addressed">Addressed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredReviews.map((review) => (
                    <div key={review.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {review.targetType === 'employee' ? 'Employee Review' : 'Patient Assessment'}
                            </Badge>
                          </div>
                          <h4 className="font-medium text-slate-900">
                            {getTargetName(review.targetId, review.targetType)}
                          </h4>
                          <p className="text-sm text-slate-600">
                            {getTargetDetails(review.targetId, review.targetType)}
                          </p>
                          <div className="flex items-center mt-1">
                            {getRatingStars(review.rating)}
                            <span className="ml-2 text-sm text-slate-600">
                              {review.rating}/5
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={`status-badge ${review.isAddressed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {review.isAddressed ? 'Addressed' : 'Pending'}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 rounded-md p-3 mb-3">
                        <p className="text-sm text-slate-900">{review.comment}</p>
                      </div>
                      
                      {review.adminNotes && (
                        <div className="bg-blue-50 rounded-md p-3 mb-3 border border-blue-200">
                          <h5 className="text-sm font-medium text-blue-900 mb-1">Admin Notes:</h5>
                          <p className="text-sm text-blue-800">{review.adminNotes}</p>
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
                        {!review.isAddressed && (
                          <Button
                            size="sm"
                            onClick={() => handleMarkAsAddressed(review)}
                            className="btn-secondary"
                          >
                            Mark as Addressed
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddAdminNotes(review)}
                        >
                          {review.adminNotes ? 'Edit Notes' : 'Add Notes'}
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {filteredReviews.length === 0 && (
                    <div className="text-center py-12">
                      <MessageSquare className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                      <p className="text-slate-600">No reviews found for the selected filters</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Admin Notes Dialog */}
        <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Admin Notes & Response</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedReview && (
                <div className="p-3 bg-slate-50 rounded-md">
                  <h4 className="font-medium text-slate-900 mb-1">
                    Review for: {getTargetName(selectedReview.targetId, selectedReview.targetType)}
                  </h4>
                  <p className="text-sm text-slate-600">{selectedReview.comment}</p>
                </div>
              )}
              
              <div>
                <Label htmlFor="adminNotes">Admin Notes & Action Plan</Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Enter your notes about this review, action taken, or follow-up required..."
                  rows={6}
                  className="mt-2"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setIsNotesDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={submitAdminNotes}
                  disabled={updateReviewMutation.isPending}
                  className="btn-primary"
                >
                  Save Notes & Mark Addressed
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
