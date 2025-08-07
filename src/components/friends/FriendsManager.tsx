import { useState, useEffect } from "react";
import { supabase } from "../../../supabase/supabase";
import { useAuth } from "../../../supabase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  UserPlus,
  Users,
  MessageCircle,
  MoreVertical,
  Check,
  X,
  Search,
  Mail,
  Clock,
  UserCheck,
  UserX,
  Share,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Tables } from "@/types/supabase";

type UserProfile = Tables<"user_profiles">;
type UserFriend = Tables<"user_friends">;

export interface Friend extends UserFriend {
  friend_profile?: UserProfile;
  requester_profile?: UserProfile;
}

interface SearchResult {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  email: string;
  friendship_status: string;
}

interface FriendsManagerProps {
  darkMode?: boolean;
  onStartChat?: (friendId: string) => void;
  onShareNote?: (friendId: string) => void;
}

export default function FriendsManager({
  darkMode = false,
  onStartChat,
  onShareNote,
}: FriendsManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [sentRequests, setSentRequests] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendEmail, setFriendEmail] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [activeTab, setActiveTab] = useState("friends");

  useEffect(() => {
    if (user) {
      loadAllData();
      setupRealtimeSubscription();
    }
  }, [user]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadFriends(),
        loadPendingRequests(),
        loadSentRequests(),
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load friends data. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFriends = async () => {
    if (!user?.id) return;

    try {
      // Get friends where current user is the requester
      const { data: sentFriends, error: sentError } = await supabase
        .from("user_friends")
        .select(
          `
          *,
          friend_profile:user_profiles!user_friends_friend_id_fkey(*)
        `,
        )
        .eq("user_id", user.id)
        .eq("status", "accepted");

      if (sentError) throw sentError;

      // Get friends where current user is the friend
      const { data: receivedFriends, error: receivedError } = await supabase
        .from("user_friends")
        .select(
          `
          *,
          requester_profile:user_profiles!user_friends_user_id_fkey(*)
        `,
        )
        .eq("friend_id", user.id)
        .eq("status", "accepted");

      if (receivedError) throw receivedError;

      // Combine and normalize the data
      const allFriends: Friend[] = [
        ...(sentFriends || []).map((item) => ({
          ...item,
          friend_profile: item.friend_profile,
        })),
        ...(receivedFriends || []).map((item) => ({
          ...item,
          friend_id: item.user_id, // Swap for consistency
          friend_profile: item.requester_profile,
        })),
      ];

      setFriends(allFriends);
    } catch (error) {
      console.error("Error loading friends:", error);
      throw error;
    }
  };

  const loadPendingRequests = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("user_friends")
        .select(
          `
          *,
          requester_profile:user_profiles!user_friends_user_id_fkey(*)
        `,
        )
        .eq("friend_id", user.id)
        .eq("status", "pending");

      if (error) throw error;

      const requestsData: Friend[] = (data || []).map((item) => ({
        ...item,
        friend_profile: item.requester_profile,
      }));

      setPendingRequests(requestsData);
    } catch (error) {
      console.error("Error loading pending requests:", error);
      throw error;
    }
  };

  const loadSentRequests = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("user_friends")
        .select(
          `
          *,
          friend_profile:user_profiles!user_friends_friend_id_fkey(*)
        `,
        )
        .eq("user_id", user.id)
        .eq("status", "pending");

      if (error) throw error;

      const sentData: Friend[] = (data || []).map((item) => ({
        ...item,
        friend_profile: item.friend_profile,
      }));

      setSentRequests(sentData);
    } catch (error) {
      console.error("Error loading sent requests:", error);
      throw error;
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user?.id) return;

    const subscription = supabase
      .channel("friends_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_friends",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadFriends();
          loadSentRequests();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_friends",
          filter: `friend_id=eq.${user.id}`,
        },
        () => {
          loadPendingRequests();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const searchUsers = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    if (!user?.id) {
      toast({
        title: "Error",
        description: "Please log in to search users",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.rpc("search_users", {
        search_term: searchTerm,
        requesting_user_id: user.id,
      });

      if (error) {
        console.error("Search error:", error);
        throw error;
      }

      setSearchResults(data || []);
    } catch (error) {
      console.error("Error searching users:", error);
      toast({
        title: "Search Error",
        description: "Failed to search users. Please try again.",
        variant: "destructive",
      });
      setSearchResults([]);
    }
  };

  const sendFriendRequest = async (
    friendUserId: string,
    friendIdentifier: string,
  ) => {
    try {
      if (!user?.id) {
        toast({
          title: "Error",
          description: "Please log in to send friend requests",
          variant: "destructive",
        });
        return;
      }

      // Check if friendship already exists
      const { data: existingFriend } = await supabase
        .from("user_friends")
        .select("id, status")
        .or(
          `and(user_id.eq.${user.id},friend_id.eq.${friendUserId}),and(user_id.eq.${friendUserId},friend_id.eq.${user.id})`,
        )
        .maybeSingle();

      if (existingFriend) {
        toast({
          title: "Already Connected",
          description: "You are already friends or have a pending request",
          variant: "destructive",
        });
        return;
      }

      // Send friend request
      const { error } = await supabase.from("user_friends").insert({
        user_id: user.id,
        friend_id: friendUserId,
        status: "pending",
      });

      if (error) {
        console.error("Insert error:", error);
        throw error;
      }

      setFriendEmail("");
      setShowAddFriend(false);
      setSearchResults([]);
      toast({
        title: "Friend Request Sent",
        description: `Friend request sent to ${friendIdentifier}! 🎉`,
      });
      loadSentRequests();
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast({
        title: "Error",
        description: "Failed to send friend request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("user_friends")
        .update({ status: "accepted" })
        .eq("id", requestId);

      if (error) throw error;

      toast({
        title: "Friend Request Accepted",
        description: "You are now friends! 🎉",
      });
      loadAllData();
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast({
        title: "Error",
        description: "Failed to accept friend request",
        variant: "destructive",
      });
    }
  };

  const declineFriendRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("user_friends")
        .delete()
        .eq("id", requestId);

      if (error) throw error;

      toast({
        title: "Friend Request Declined",
        description: "Friend request declined",
      });
      loadPendingRequests();
    } catch (error) {
      console.error("Error declining friend request:", error);
      toast({
        title: "Error",
        description: "Failed to decline friend request",
        variant: "destructive",
      });
    }
  };

  const removeFriend = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from("user_friends")
        .delete()
        .eq("id", friendshipId);

      if (error) throw error;

      toast({
        title: "Friend Removed",
        description: "Friend has been removed from your list",
      });
      loadFriends();
    } catch (error) {
      console.error("Error removing friend:", error);
      toast({
        title: "Error",
        description: "Failed to remove friend",
        variant: "destructive",
      });
    }
  };

  const filteredFriends = friends.filter((friend) => {
    const profile = friend.friend_profile;
    if (!profile) return false;

    const searchLower = searchQuery.toLowerCase();
    return (
      profile.username?.toLowerCase().includes(searchLower) ||
      profile.display_name?.toLowerCase().includes(searchLower)
    );
  });

  const getUserDisplayName = (friend: Friend) => {
    const profile = friend.friend_profile;
    return profile?.display_name || profile?.username || "Unknown User";
  };

  const getUserUsername = (friend: Friend) => {
    return friend.friend_profile?.username || "unknown";
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "busy":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div
      className={`h-full flex flex-col ${darkMode ? "bg-gray-900 text-white" : "bg-white"} min-h-screen`}
    >
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`p-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Friends</h1>
              <p
                className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
              >
                Connect and collaborate with friends
              </p>
            </div>
          </div>
          <Dialog open={showAddFriend} onOpenChange={setShowAddFriend}>
            <DialogTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Friend
                </Button>
              </motion.div>
            </DialogTrigger>
            <DialogContent className={darkMode ? "bg-gray-800 text-white" : ""}>
              <DialogHeader>
                <DialogTitle>Add New Friend</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Search by Username or Email
                  </label>
                  <Input
                    value={friendEmail}
                    onChange={(e) => {
                      setFriendEmail(e.target.value);
                      searchUsers(e.target.value);
                    }}
                    placeholder="@username or email@example.com"
                    className={darkMode ? "bg-gray-700 border-gray-600" : ""}
                  />
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="max-h-60 overflow-y-auto border rounded-md">
                    {searchResults.map((result) => (
                      <div
                        key={result.user_id}
                        className={`p-3 border-b last:border-b-0 hover:bg-gray-50 ${darkMode ? "hover:bg-gray-700" : ""}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={
                                  result.avatar_url ||
                                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.username}`
                                }
                                alt={result.username || result.display_name}
                              />
                              <AvatarFallback>
                                {(result.username ||
                                  result.display_name ||
                                  result.email)?.[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">
                                {result.display_name || result.username}
                              </p>
                              <p className="text-xs text-gray-500">
                                @{result.username}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() =>
                              sendFriendRequest(
                                result.user_id,
                                result.username || result.display_name,
                              )
                            }
                            disabled={result.friendship_status !== "none"}
                            className="text-xs"
                          >
                            {result.friendship_status === "friends" &&
                              "Friends"}
                            {result.friendship_status === "request_sent" &&
                              "Sent"}
                            {result.friendship_status === "request_received" &&
                              "Pending"}
                            {result.friendship_status === "none" &&
                              "Add Friend"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddFriend(false);
                      setFriendEmail("");
                      setSearchResults([]);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`pl-9 ${darkMode ? "bg-gray-800 border-gray-600" : ""}`}
          />
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <div
          className={`border-b ${darkMode ? "border-gray-700" : "border-gray-200"} px-6`}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Friends ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Requests ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Sent ({sentRequests.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto">
          <TabsContent value="friends" className="m-0 p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredFriends.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-xl font-semibold mb-2">
                  {searchQuery ? "No friends found" : "No friends yet"}
                </h3>
                <p
                  className={`${darkMode ? "text-gray-400" : "text-gray-600"} mb-6`}
                >
                  {searchQuery
                    ? "Try adjusting your search terms"
                    : "Add friends to start collaborating"}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => setShowAddFriend(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Your First Friend
                  </Button>
                )}
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence>
                  {filteredFriends.map((friend, index) => {
                    const profile = friend.friend_profile;
                    if (!profile) return null;

                    return (
                      <motion.div
                        key={friend.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <Card
                          className={`transition-all duration-200 hover:shadow-lg ${
                            darkMode
                              ? "bg-gray-800 border-gray-700 hover:bg-gray-750"
                              : "hover:shadow-xl"
                          }`}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <Avatar className="h-12 w-12">
                                    <AvatarImage
                                      src={
                                        profile.avatar_url ||
                                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`
                                      }
                                      alt={getUserDisplayName(friend)}
                                    />
                                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                                      {getUserDisplayName(
                                        friend,
                                      )[0].toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div
                                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(
                                      profile.status,
                                    )}`}
                                  ></div>
                                </div>
                                <div className="flex-1">
                                  <CardTitle className="text-base">
                                    {getUserDisplayName(friend)}
                                  </CardTitle>
                                  <p
                                    className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                                  >
                                    @{getUserUsername(friend)}
                                  </p>
                                  {profile.bio && (
                                    <p
                                      className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-500"} mt-1 line-clamp-2`}
                                    >
                                      {profile.bio}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      onStartChat?.(friend.friend_id)
                                    }
                                  >
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    Start Chat
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      onShareNote?.(friend.friend_id)
                                    }
                                  >
                                    <FileText className="h-4 w-4 mr-2" />
                                    Share Note
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => removeFriend(friend.id)}
                                    className="text-red-600"
                                  >
                                    <UserX className="h-4 w-4 mr-2" />
                                    Remove Friend
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => onStartChat?.(friend.friend_id)}
                              >
                                <MessageCircle className="h-4 w-4 mr-1" />
                                Chat
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => onShareNote?.(friend.friend_id)}
                              >
                                <Share className="h-4 w-4 mr-1" />
                                Share
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="m-0 p-6">
            {pendingRequests.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="text-6xl mb-4">📬</div>
                <h3 className="text-xl font-semibold mb-2">
                  No pending requests
                </h3>
                <p
                  className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}
                >
                  Friend requests will appear here
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {pendingRequests.map((request, index) => {
                    const profile = request.friend_profile;
                    if (!profile) return null;

                    return (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card
                          className={`${
                            darkMode
                              ? "bg-gray-800 border-gray-700"
                              : "bg-white border-gray-200"
                          }`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage
                                    src={
                                      profile.avatar_url ||
                                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`
                                    }
                                    alt={profile.username || ""}
                                  />
                                  <AvatarFallback>
                                    {(profile.username ||
                                      profile.display_name)?.[0]?.toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">
                                    {profile.display_name ||
                                      profile.username ||
                                      "Unknown"}
                                  </p>
                                  <p
                                    className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                                  >
                                    @{profile.username || "unknown"}
                                  </p>
                                  <p
                                    className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-500"}`}
                                  >
                                    {new Date(
                                      request.created_at,
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    acceptFriendRequest(request.id)
                                  }
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    declineFriendRequest(request.id)
                                  }
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Decline
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          <TabsContent value="sent" className="m-0 p-6">
            {sentRequests.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="text-6xl mb-4">📤</div>
                <h3 className="text-xl font-semibold mb-2">No sent requests</h3>
                <p
                  className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}
                >
                  Friend requests you send will appear here
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {sentRequests.map((request, index) => {
                    const profile = request.friend_profile;
                    if (!profile) return null;

                    return (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card
                          className={`${
                            darkMode
                              ? "bg-gray-800 border-gray-700"
                              : "bg-white border-gray-200"
                          }`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage
                                    src={
                                      profile.avatar_url ||
                                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`
                                    }
                                    alt={profile.username || ""}
                                  />
                                  <AvatarFallback>
                                    {(profile.username ||
                                      profile.display_name)?.[0]?.toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">
                                    {profile.display_name ||
                                      profile.username ||
                                      "Unknown"}
                                  </p>
                                  <p
                                    className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                                  >
                                    @{profile.username || "unknown"}
                                  </p>
                                  <p
                                    className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-500"}`}
                                  >
                                    Sent{" "}
                                    {new Date(
                                      request.created_at,
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
