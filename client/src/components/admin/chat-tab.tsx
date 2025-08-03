import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ChatWindow from "@/components/shared/chat-window";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Megaphone, Users, Info } from "lucide-react";

export default function ChatTab() {
  const [broadcastDialogOpen, setBroadcastDialogOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState('employees');
  
  const { toast } = useToast();

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message to broadcast",
        variant: "destructive",
      });
      return;
    }

    try {
      // In a real implementation, this would send the broadcast message
      toast({
        title: "Broadcast Sent",
        description: `Message sent to all ${broadcastTarget}`,
      });
      
      setBroadcastMessage('');
      setBroadcastDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send broadcast message",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Communication Center</h2>
          <p className="text-slate-600">Secure messaging between admin, employees, and family members</p>
        </div>

        {/* Communication Rules */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="mr-2 h-5 w-5" />
              Communication Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-slate-900 mb-3">Employee Chat Rules</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Employees can chat with other employees</li>
                  <li>• Employees can chat with Admin</li>
                  <li>• Employees can only chat with family members assigned to the same patients</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-slate-900 mb-3">Family Member Chat Rules</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Family members can chat with Admin</li>
                  <li>• Family members can chat with other family members assigned to the same patient</li>
                  <li>• Family members can chat with employees assigned to the same patient</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">General Chat Rules</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Messages can be deleted within 2 minutes of being sent</li>
                <li>• All conversations are monitored by Admin for transparency</li>
                <li>• Admin can chat privately with all employees and family members</li>
                <li>• Admin has broadcast messaging capabilities</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Main Chat Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Chat Controls */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Chat Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Dialog open={broadcastDialogOpen} onOpenChange={setBroadcastDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full btn-primary">
                      <Megaphone className="mr-2 h-4 w-4" />
                      Broadcast Message
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Broadcast Message</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Send to:</label>
                        <Select value={broadcastTarget} onValueChange={setBroadcastTarget}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="employees">All Employees</SelectItem>
                            <SelectItem value="family">All Family Members</SelectItem>
                            <SelectItem value="all">Everyone</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Message:</label>
                        <Textarea
                          value={broadcastMessage}
                          onChange={(e) => setBroadcastMessage(e.target.value)}
                          placeholder="Enter your broadcast message..."
                          rows={4}
                          className="form-textarea"
                        />
                      </div>
                      <div className="flex justify-end space-x-3">
                        <Button variant="outline" onClick={() => setBroadcastDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleBroadcast} className="btn-primary">
                          Send Broadcast
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-900">Quick Actions</h4>
                  <Button variant="outline" size="sm" className="w-full">
                    <Users className="mr-2 h-4 w-4" />
                    View All Conversations
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    Archive Conversations
                  </Button>
                </div>

                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h5 className="text-sm font-medium text-yellow-800 mb-1">Admin Privileges</h5>
                  <p className="text-xs text-yellow-700">
                    As an admin, you can monitor all conversations and have access to all chat features.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Window */}
          <div className="lg:col-span-3">
            <Card className="h-96">
              <CardHeader>
                <CardTitle>Chat Messages</CardTitle>
              </CardHeader>
              <CardContent className="h-full">
                <ChatWindow />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Chat Statistics */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="stat-card-icon bg-blue-100">
                  <MessageCircle className="text-primary" size={20} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Active Conversations</p>
                  <p className="text-2xl font-semibold text-slate-900">12</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="stat-card-icon bg-green-100">
                  <Users className="text-secondary-healthcare" size={20} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Online Users</p>
                  <p className="text-2xl font-semibold text-slate-900">8</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="stat-card-icon bg-yellow-100">
                  <Megaphone className="text-warning-healthcare" size={20} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Broadcasts Sent Today</p>
                  <p className="text-2xl font-semibold text-slate-900">3</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
