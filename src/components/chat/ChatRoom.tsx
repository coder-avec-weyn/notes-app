import { useState, useEffect, useRef } from "react";
import { supabase } from "../../../supabase/supabase";
import { useAuth } from "../../../supabase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowLeft,
  Send,
  Users,
  Settings,
  Paperclip,
  Smile,
  MoreVertical,
  Reply,
  Edit,
  Trash,
  Pin,
  Hash,
  Lock,
  Globe,
  UserPlus,
  Phone,
  Video,
  Search,
  Image,
  File,
  Mic,
  MicOff,
  Heart,
  ThumbsUp,
  Laugh,
  Angry,
  Sad,
  Copy,
  Forward,
  Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatGroup } from "./ChatGroups";
import { formatDistanceToNow } from "date-fns";

export interface ChatMessage {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  message_type: "text" | "image" | "file" | "note";
  reply_to?: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  attachments: any[];
  reactions: Record<string, string[]>;
  user_email?: string;
}

interface ChatRoomProps {
  group: ChatGroup;
  onBack: () => void;
  darkMode?: boolean;
}

export function ChatRoom({ group, onBack, darkMode = false }: ChatRoomProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [isTyping, setIsTyping] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(
    null,
  );
  const [isRecording, setIsRecording] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadMessages();
    loadMembers();
    setupRealtimeSubscription();
  }, [group.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select(
          `
          *,
          user:user_id (
            email
          )
        `,
        )
        .eq("group_id", group.id)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;

      const messagesWithUser =
        data?.map((msg: any) => ({
          ...msg,
          user_email: msg.user?.email,
        })) || [];

      setMessages(messagesWithUser);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("chat_group_members")
        .select(
          `
          *,
          user:user_id (
            email
          )
        `,
        )
        .eq("group_id", group.id);

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error("Error loading members:", error);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel(`chat_room_${group.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `group_id=eq.${group.id}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => [...prev, newMessage]);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
          filter: `group_id=eq.${group.id}`,
        },
        (payload) => {
          const updatedMessage = payload.new as ChatMessage;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === updatedMessage.id ? updatedMessage : msg,
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "chat_messages",
          filter: `group_id=eq.${group.id}`,
        },
        (payload) => {
          const deletedMessage = payload.old as ChatMessage;
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== deletedMessage.id),
          );
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const { error } = await supabase.from("chat_messages").insert({
        group_id: group.id,
        user_id: user?.id,
        content: newMessage,
        message_type: "text",
        reply_to: replyTo?.id,
      });

      if (error) throw error;

      setNewMessage("");
      setReplyTo(null);
      inputRef.current?.focus();
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
      handleStopTyping();
    }
  };

  const handleTyping = () => {
    // Socket.IO typing functionality will be added later
  };

  const handleStopTyping = () => {
    // Socket.IO stop typing functionality will be added later
  };

  const inviteFriend = async () => {
    if (!inviteEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if user exists
      const { data: userData, error: userError } =
        await supabase.auth.admin.getUserByEmail(inviteEmail);

      if (userError || !userData.user) {
        toast({
          title: "User Not Found",
          description: "No user found with this email address",
          variant: "destructive",
        });
        return;
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from("chat_group_members")
        .select("id")
        .eq("group_id", group.id)
        .eq("user_id", userData.user.id)
        .single();

      if (existingMember) {
        toast({
          title: "Already a Member",
          description: "This user is already a member of the group",
          variant: "destructive",
        });
        return;
      }

      // Add user to group
      const { error: memberError } = await supabase
        .from("chat_group_members")
        .insert({
          group_id: group.id,
          user_id: userData.user.id,
          role: "member",
        });

      if (memberError) throw memberError;

      setInviteEmail("");
      setShowInviteDialog(false);
      toast({
        title: "Success",
        description: `${inviteEmail} has been invited to the group! 🎉`,
      });
      loadMembers();
    } catch (error) {
      console.error("Error inviting friend:", error);
      toast({
        title: "Error",
        description: "Failed to invite friend",
        variant: "destructive",
      });
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    try {
      const message = messages.find((m) => m.id === messageId);
      if (!message || !user) return;

      const reactions = { ...message.reactions };
      if (!reactions[emoji]) {
        reactions[emoji] = [];
      }

      const userIndex = reactions[emoji].indexOf(user.id);
      if (userIndex > -1) {
        reactions[emoji].splice(userIndex, 1);
        if (reactions[emoji].length === 0) {
          delete reactions[emoji];
        }
      } else {
        reactions[emoji].push(user.id);
      }

      // Update in database
      const { error } = await supabase
        .from("chat_messages")
        .update({ reactions })
        .eq("id", messageId);

      if (error) throw error;
    } catch (error) {
      console.error("Error adding reaction:", error);
      toast({
        title: "Error",
        description: "Failed to add reaction",
        variant: "destructive",
      });
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("chat_messages")
        .delete()
        .eq("id", messageId)
        .eq("user_id", user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Message deleted",
      });
    } catch (error) {
      console.error("Error deleting message:", error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied",
      description: "Message copied to clipboard",
    });
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const getUserDisplayName = (email: string) => {
    return email.split("@")[0];
  };

  return (
    <div
      className={`h-full flex flex-col ${darkMode ? "bg-gray-900 text-white" : "bg-white"}`}
    >
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`p-4 border-b ${darkMode ? "border-gray-700" : "border-gray-200"} flex items-center justify-between`}
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className={darkMode ? "text-gray-300 hover:text-white" : ""}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={
                group.avatar_url ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${group.name}`
              }
              alt={group.name}
            />
            <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              {group.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              {group.name}
              {group.is_private ? (
                <Lock className="h-4 w-4 text-gray-500" />
              ) : (
                <Globe className="h-4 w-4 text-gray-500" />
              )}
            </h2>
            <p
              className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
            >
              {group.member_count} members
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Search className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Search messages</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Phone className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Voice call</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Video className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Video call</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Invite friends</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </DialogTrigger>
            <DialogContent className={darkMode ? "bg-gray-800 text-white" : ""}>
              <DialogHeader>
                <DialogTitle>Invite Friend to {group.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Email Address
                  </label>
                  <Input
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="friend@example.com"
                    className={darkMode ? "bg-gray-700 border-gray-600" : ""}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={inviteFriend} className="flex-1">
                    Send Invitation
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowInviteDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Users className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View members ({members.length})</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Group settings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold mb-2">
              Start the conversation
            </h3>
            <p className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Be the first to send a message in this group
            </p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {messages.map((message, index) => {
              const isOwn = message.user_id === user?.id;
              const showAvatar =
                index === 0 || messages[index - 1].user_id !== message.user_id;

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
                >
                  <div className="flex-shrink-0">
                    {showAvatar ? (
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${message.user_email}`}
                          alt={message.user_email || ""}
                        />
                        <AvatarFallback>
                          {message.user_email?.[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-8" />
                    )}
                  </div>
                  <div
                    className={`flex-1 max-w-xs ${isOwn ? "text-right" : ""}`}
                  >
                    {showAvatar && (
                      <div
                        className={`flex items-center gap-2 mb-1 ${isOwn ? "justify-end" : ""}`}
                      >
                        <span
                          className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                        >
                          {isOwn
                            ? "You"
                            : getUserDisplayName(message.user_email || "")}
                        </span>
                        {onlineUsers.includes(message.user_id) && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                        <span
                          className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}
                        >
                          {formatMessageTime(message.created_at)}
                        </span>
                      </div>
                    )}
                    <div className="relative group">
                      <div
                        className={`p-3 rounded-lg ${
                          isOwn
                            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                            : darkMode
                              ? "bg-gray-800 text-white"
                              : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        {message.reply_to && (
                          <div
                            className={`text-xs opacity-75 mb-2 p-2 rounded border-l-2 ${
                              isOwn
                                ? "border-white/30 bg-white/10"
                                : "border-purple-500/30 bg-purple-500/10"
                            }`}
                          >
                            <Reply className="h-3 w-3 inline mr-1" />
                            Replying to message
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>
                        {message.is_edited && (
                          <span
                            className={`text-xs opacity-60 ${isOwn ? "text-white/70" : "text-gray-500"}`}
                          >
                            (edited)
                          </span>
                        )}
                      </div>

                      {/* Message Actions */}
                      <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() => setReplyTo(message)}
                            >
                              <Reply className="h-4 w-4 mr-2" />
                              Reply
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => copyMessage(message.content)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Forward className="h-4 w-4 mr-2" />
                              Forward
                            </DropdownMenuItem>
                            {isOwn && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => deleteMessage(message.id)}
                                  className="text-red-600"
                                >
                                  <Trash className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Reactions */}
                      {Object.keys(message.reactions || {}).length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {Object.entries(message.reactions || {}).map(
                            ([emoji, users]) => (
                              <button
                                key={emoji}
                                onClick={() => addReaction(message.id, emoji)}
                                className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                                  users.includes(user?.id || "")
                                    ? "bg-purple-100 border-purple-300 text-purple-700"
                                    : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
                                }`}
                              >
                                {emoji} {users.length}
                              </button>
                            ),
                          )}
                        </div>
                      )}

                      {/* Quick Reactions */}
                      <div className="absolute bottom-0 left-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-1 bg-white rounded-full shadow-lg p-1 border">
                          {["❤️", "👍", "😂", "😮", "😢", "😡"].map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => addReaction(message.id, emoji)}
                              className="hover:bg-gray-100 rounded-full p-1 text-sm"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />

        {/* Typing Indicator */}
        {isTyping.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-4 py-2"
          >
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
            <span
              className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
            >
              {isTyping.length === 1
                ? "Someone is"
                : `${isTyping.length} people are`}{" "}
              typing...
            </span>
          </motion.div>
        )}
      </div>

      {/* Reply Preview */}
      {replyTo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 border-t ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Reply className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">
                Replying to {getUserDisplayName(replyTo.user_email || "")}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyTo(null)}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
          <p
            className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"} truncate`}
          >
            {replyTo.content}
          </p>
        </motion.div>
      )}

      {/* Message Input */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`p-4 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}
      >
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Paperclip className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <Image className="h-4 w-4 mr-2" />
                Photo
              </DropdownMenuItem>
              <DropdownMenuItem>
                <File className="h-4 w-4 mr-2" />
                Document
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Mic className="h-4 w-4 mr-2" />
                Voice Note
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className={`pr-20 ${darkMode ? "bg-gray-800 border-gray-600" : ""}`}
            />
            <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Smile className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setIsRecording(!isRecording)}
              >
                {isRecording ? (
                  <MicOff className="h-4 w-4 text-red-500" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`absolute bottom-16 right-4 p-4 rounded-lg shadow-lg border ${
              darkMode
                ? "bg-gray-800 border-gray-600"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="grid grid-cols-8 gap-2">
              {[
                "😀",
                "😃",
                "😄",
                "😁",
                "😆",
                "😅",
                "😂",
                "🤣",
                "😊",
                "😇",
                "🙂",
                "🙃",
                "😉",
                "😌",
                "😍",
                "🥰",
                "😘",
                "😗",
                "😙",
                "😚",
                "😋",
                "😛",
                "😝",
                "😜",
                "🤪",
                "🤨",
                "🧐",
                "🤓",
                "😎",
                "🤩",
                "🥳",
                "😏",
              ].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    setNewMessage((prev) => prev + emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="hover:bg-gray-100 rounded p-1 text-lg"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recording Indicator */}
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute bottom-16 left-4 flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full"
          >
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Recording...</span>
          </motion.div>
        )}

        {/* Online Users Indicator */}
        {onlineUsers.length > 0 && (
          <div className="absolute top-4 right-4 flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span
              className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}
            >
              {onlineUsers.length} online
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
