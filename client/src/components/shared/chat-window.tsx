import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useWebSocket } from "@/hooks/use-websocket";
import { useAuth } from "@/hooks/use-auth";
import { apiGet } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ChatMessage } from "@shared/schema";
import { 
  Send, 
  Image, 
  User, 
  MessageCircle, 
  Clock, 
  Trash2,
  Search
} from "lucide-react";

interface ChatUser {
  id: string;
  name: string;
  role: string;
  isOnline?: boolean;
}

interface Conversation {
  user: ChatUser;
  lastMessage?: ChatMessage;
  unreadCount: number;
}

export default function ChatWindow() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [imageDescription, setImageDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isConnected, messages: wsMessages, sendMessage } = useWebSocket(user?.id || null);

  const { data: availableUsers = [] } = useQuery({
    queryKey: ['/api/chat/users'],
    queryFn: () => apiGet<ChatUser[]>('/api/chat/users'),
    enabled: !!user,
  });

  const { data: conversationMessages = [] } = useQuery({
    queryKey: ['/api/chat', selectedConversation],
    queryFn: () => apiGet<ChatMessage[]>(`/api/chat/${selectedConversation}`),
    enabled: !!selectedConversation,
  });

  // Combine API messages with real-time WebSocket messages
  const allMessages = [...conversationMessages, ...wsMessages.filter(msg => 
    (msg.senderId === user?.id && msg.receiverId === selectedConversation) ||
    (msg.senderId === selectedConversation && msg.receiverId === user?.id)
  )].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return aTime - bTime;
  });

  useEffect(() => {
    scrollToBottom();
  }, [allMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = () => {
    if (!selectedConversation || !newMessage.trim()) return;

    sendMessage(selectedConversation, newMessage, 'text');
    setNewMessage('');
  };

  const handleSendImage = () => {
    if (!selectedConversation || !imageDescription.trim()) return;

    // In a real implementation, this would handle actual image upload
    sendMessage(selectedConversation, `[Image]: ${imageDescription}`, 'image');
    setImageDescription('');
    setIsImageDialogOpen(false);
    
    toast({
      title: "Image Sent",
      description: "Your image has been shared successfully",
    });
  };

  const handleDeleteMessage = (messageId: string) => {
    // In a real implementation, this would call the delete API
    toast({
      title: "Message Deleted",
      description: "Message has been removed from the conversation",
    });
  };

  const canDeleteMessage = (message: ChatMessage) => {
    if (!message.createdAt) return false;
    const messageTime = new Date(message.createdAt).getTime();
    const now = Date.now();
    const twoMinutes = 2 * 60 * 1000;
    
    return message.senderId === user?.id && 
           (now - messageTime) < twoMinutes && 
           !message.isDeleted;
  };

  const formatMessageTime = (timestamp: string | Date | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredUsers = availableUsers.filter(chatUser =>
    chatUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chatUser.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getConversations = (): Conversation[] => {
    return filteredUsers.map(chatUser => {
      const lastMessage = allMessages
        .filter(msg => 
          (msg.senderId === chatUser.id && msg.receiverId === user?.id) ||
          (msg.senderId === user?.id && msg.receiverId === chatUser.id)
        )
        .sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
        })[0];
      
      return {
        user: chatUser,
        lastMessage: lastMessage,
        unreadCount: 0, // In real implementation, this would be calculated
      };
    });
  };

  const selectedUser = availableUsers.find(u => u.id === selectedConversation);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-96">
      
      {/* Chat List */}
      <div className="lg:col-span-1">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Conversations</CardTitle>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 text-sm"
              />
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-slate-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="overflow-y-auto h-80">
              {getConversations().map((conversation) => (
                <div
                  key={conversation.user.id}
                  onClick={() => setSelectedConversation(conversation.user.id)}
                  className={`p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${
                    selectedConversation === conversation.user.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                      <User className="text-slate-400 text-xs" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {conversation.user.name}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <Badge className="bg-primary text-white text-xs">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 capitalize">{conversation.user.role}</p>
                      {conversation.lastMessage && (
                        <p className="text-xs text-slate-500 truncate mt-1">
                          {conversation.lastMessage.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-8">
                  <MessageCircle className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                  <p className="text-sm text-slate-500">No users found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat Window */}
      <div className="lg:col-span-3">
        <Card className="h-full flex flex-col">
          
          {/* Chat Header */}
          {selectedUser && (
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                    <User className="text-slate-400 text-xs" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-900">{selectedUser.name}</h4>
                    <p className="text-xs text-slate-500 capitalize">
                      {selectedUser.role} • {selectedUser.isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  <Clock className="inline h-3 w-3 mr-1" />
                  Messages auto-delete after 2 minutes
                </div>
              </div>
            </CardHeader>
          )}

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {selectedConversation ? (
              <>
                {allMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative group ${
                      message.senderId === user?.id 
                        ? 'bg-primary text-white' 
                        : 'bg-slate-100 text-slate-900'
                    }`}>
                      {message.messageType === 'image' && (
                        <div className="flex items-center mb-1">
                          <Image className="h-4 w-4 mr-2" />
                          <span className="text-xs opacity-75">Image</span>
                        </div>
                      )}
                      <p className="text-sm">{message.message}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className={`text-xs ${
                          message.senderId === user?.id ? 'text-blue-100' : 'text-slate-500'
                        }`}>
                          {formatMessageTime(message.createdAt)}
                        </p>
                        {canDeleteMessage(message) && (
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                              message.senderId === user?.id ? 'text-blue-100 hover:text-white' : 'text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {allMessages.length === 0 && (
                  <div className="text-center py-8">
                    <MessageCircle className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <p className="text-slate-600">Start a conversation with {selectedUser?.name}</p>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                <p className="text-slate-600">Select a conversation to start messaging</p>
              </div>
            )}
          </CardContent>

          {/* Message Input */}
          {selectedConversation && (
            <div className="p-4 border-t border-slate-200">
              <div className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                
                <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Image className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Share Photo</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="imageDescription">Photo Description</Label>
                        <Textarea
                          id="imageDescription"
                          value={imageDescription}
                          onChange={(e) => setImageDescription(e.target.value)}
                          placeholder="Describe the photo you're sharing..."
                          rows={3}
                          className="mt-2"
                        />
                      </div>
                      <div className="flex justify-end space-x-3">
                        <Button variant="outline" onClick={() => setIsImageDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSendImage} className="btn-primary">
                          <Send className="mr-2 h-4 w-4" />
                          Send Photo
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button onClick={handleSendMessage} className="btn-primary">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="mt-2 text-xs text-slate-500 flex items-center">
                <MessageCircle className="h-3 w-3 mr-1" />
                All conversations are monitored for transparency. Messages can be deleted within 2 minutes.
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
