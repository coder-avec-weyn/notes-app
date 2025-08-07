import { useState, useEffect } from "react";
import { supabase } from "../../../supabase/supabase";
import { useAuth } from "../../../supabase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Users,
  MessageCircle,
  Settings,
  Crown,
  Shield,
  User,
  Search,
  Hash,
  Lock,
  Globe,
  MoreVertical,
  UserPlus,
  Edit,
  Trash,
  Star,
  Archive,
  Bell,
  BellOff,
  Pin,
  Filter,
  SortAsc,
  Grid,
  List,
  Compass,
  Heart,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatRoom } from "./ChatRoom";
import FriendsManager from "../friends/FriendsManager";
import GroupDiscovery from "../groups/GroupDiscovery";

export interface ChatGroup {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_private: boolean;
  avatar_url?: string;
  member_count: number;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: "admin" | "moderator" | "member";
  joined_at: string;
  user_email?: string;
}

interface ChatGroupsProps {
  darkMode?: boolean;
}

export default function ChatGroups({ darkMode = false }: ChatGroupsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<
    "name" | "created" | "members" | "activity"
  >("activity");
  const [filterBy, setFilterBy] = useState<
    "all" | "owned" | "joined" | "private" | "public"
  >("all");
  const [favoriteGroups, setFavoriteGroups] = useState<string[]>([]);
  const [mutedGroups, setMutedGroups] = useState<string[]>([]);
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    is_private: false,
    category: "general",
    tags: [] as string[],
    discovery_enabled: true,
    join_requests_enabled: false,
  });
  const [activeTab, setActiveTab] = useState<"groups" | "friends" | "discover">(
    "groups",
  );
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    if (user) {
      loadGroups();
      setupRealtimeSubscription();
    }
  }, [user]);

  const loadGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("chat_group_members")
        .select(
          `
          group_id,
          chat_groups (
            id,
            name,
            description,
            created_by,
            created_at,
            updated_at,
            is_private,
            avatar_url,
            member_count
          )
        `,
        )
        .eq("user_id", user?.id);

      if (error) throw error;

      const groupsData =
        data?.map((item: any) => item.chat_groups).filter(Boolean) || [];

      setGroups(groupsData);
    } catch (error) {
      console.error("Error loading groups:", error);
      toast({
        title: "Error",
        description: "Failed to load chat groups",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel("chat_groups_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_groups",
        },
        () => {
          loadGroups();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_group_members",
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          loadGroups();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const createGroup = async () => {
    if (!newGroup.name.trim()) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: groupData, error: groupError } = await supabase
        .from("chat_groups")
        .insert({
          name: newGroup.name,
          description: newGroup.description,
          created_by: user?.id,
          is_private: newGroup.is_private,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from("chat_group_members")
        .insert({
          group_id: groupData.id,
          user_id: user?.id,
          role: "admin",
        });

      if (memberError) throw memberError;

      // Add group discovery settings
      const { error: discoveryError } = await supabase
        .from("group_discovery")
        .insert({
          group_id: groupData.id,
          category: newGroup.category,
          tags: newGroup.tags,
          discovery_enabled: newGroup.discovery_enabled,
          join_requests_enabled: newGroup.join_requests_enabled,
        });

      if (discoveryError) throw discoveryError;

      setNewGroup({
        name: "",
        description: "",
        is_private: false,
        category: "general",
        tags: [],
        discovery_enabled: true,
        join_requests_enabled: false,
      });
      setShowCreateDialog(false);
      toast({
        title: "Success",
        description: "Chat group created successfully! 🎉",
      });
    } catch (error) {
      console.error("Error creating group:", error);
      toast({
        title: "Error",
        description: "Failed to create chat group",
        variant: "destructive",
      });
    }
  };

  const addTag = () => {
    if (newTag.trim() && !newGroup.tags.includes(newTag.trim())) {
      setNewGroup({
        ...newGroup,
        tags: [...newGroup.tags, newTag.trim()],
      });
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewGroup({
      ...newGroup,
      tags: newGroup.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const toggleFavorite = (groupId: string) => {
    setFavoriteGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId],
    );
  };

  const toggleMute = (groupId: string) => {
    setMutedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId],
    );
  };

  const deleteGroup = async (groupId: string) => {
    try {
      const { error } = await supabase
        .from("chat_groups")
        .delete()
        .eq("id", groupId)
        .eq("created_by", user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Group deleted successfully",
      });
      loadGroups();
    } catch (error) {
      console.error("Error deleting group:", error);
      toast({
        title: "Error",
        description: "Failed to delete group",
        variant: "destructive",
      });
    }
  };

  const leaveGroup = async (groupId: string) => {
    try {
      const { error } = await supabase
        .from("chat_group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Left group successfully",
      });
      loadGroups();
    } catch (error) {
      console.error("Error leaving group:", error);
      toast({
        title: "Error",
        description: "Failed to leave group",
        variant: "destructive",
      });
    }
  };

  const filteredGroups = groups
    .filter((group) => {
      const matchesSearch =
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter = (() => {
        switch (filterBy) {
          case "owned":
            return group.created_by === user?.id;
          case "joined":
            return group.created_by !== user?.id;
          case "private":
            return group.is_private;
          case "public":
            return !group.is_private;
          default:
            return true;
        }
      })();

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      // Favorites first
      const aFav = favoriteGroups.includes(a.id);
      const bFav = favoriteGroups.includes(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;

      // Then sort by selected criteria
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "created":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "members":
          return b.member_count - a.member_count;
        case "activity":
          return (
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
        default:
          return 0;
      }
    });

  if (selectedGroup) {
    return (
      <ChatRoom
        group={selectedGroup}
        onBack={() => setSelectedGroup(null)}
        darkMode={darkMode}
      />
    );
  }

  return (
    <div
      className={`h-full flex flex-col ${darkMode ? "bg-gray-900 text-white" : "bg-white"}`}
    >
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`p-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Social Hub</h1>
              <p
                className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
              >
                Connect, collaborate, and discover communities
              </p>
            </div>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Group
                </Button>
              </motion.div>
            </DialogTrigger>
            <DialogContent className={darkMode ? "bg-gray-800 text-white" : ""}>
              <DialogHeader>
                <DialogTitle>Create New Chat Group</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Group Name *
                  </label>
                  <Input
                    value={newGroup.name}
                    onChange={(e) =>
                      setNewGroup({ ...newGroup, name: e.target.value })
                    }
                    placeholder="Enter group name..."
                    className={darkMode ? "bg-gray-700 border-gray-600" : ""}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Description
                  </label>
                  <Textarea
                    value={newGroup.description}
                    onChange={(e) =>
                      setNewGroup({ ...newGroup, description: e.target.value })
                    }
                    placeholder="Describe your group..."
                    className={darkMode ? "bg-gray-700 border-gray-600" : ""}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Category
                  </label>
                  <Input
                    value={newGroup.category}
                    onChange={(e) =>
                      setNewGroup({ ...newGroup, category: e.target.value })
                    }
                    placeholder="e.g., study, work, hobby"
                    className={darkMode ? "bg-gray-700 border-gray-600" : ""}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {newGroup.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer hover:bg-red-100"
                        onClick={() => removeTag(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addTag()}
                      placeholder="Add a tag..."
                      className={`flex-1 ${darkMode ? "bg-gray-700 border-gray-600" : ""}`}
                    />
                    <Button onClick={addTag} size="sm" type="button">
                      Add
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="private"
                      checked={newGroup.is_private}
                      onChange={(e) =>
                        setNewGroup({
                          ...newGroup,
                          is_private: e.target.checked,
                        })
                      }
                      className="rounded"
                    />
                    <label htmlFor="private" className="text-sm">
                      Private Group
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="discoverable"
                      checked={newGroup.discovery_enabled}
                      onChange={(e) =>
                        setNewGroup({
                          ...newGroup,
                          discovery_enabled: e.target.checked,
                        })
                      }
                      className="rounded"
                    />
                    <label htmlFor="discoverable" className="text-sm">
                      Allow others to discover this group
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="joinRequests"
                      checked={newGroup.join_requests_enabled}
                      onChange={(e) =>
                        setNewGroup({
                          ...newGroup,
                          join_requests_enabled: e.target.checked,
                        })
                      }
                      className="rounded"
                    />
                    <label htmlFor="joinRequests" className="text-sm">
                      Require approval for join requests
                    </label>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={createGroup} className="flex-1">
                    Create Group
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "groups" | "friends" | "discover")
          }
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="groups" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Groups
            </TabsTrigger>
            <TabsTrigger value="friends" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Friends
            </TabsTrigger>
            <TabsTrigger value="discover" className="flex items-center gap-2">
              <Compass className="h-4 w-4" />
              Discover
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "groups" | "friends" | "discover")
          }
          className="h-full flex flex-col"
        >
          <TabsContent value="groups" className="flex-1 overflow-auto p-6 m-0">
            {/* Search and Filters for Groups */}
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search groups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-9 ${darkMode ? "bg-gray-800 border-gray-600" : ""}`}
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterBy("all")}>
                    All Groups
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterBy("owned")}>
                    My Groups
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterBy("joined")}>
                    Joined Groups
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setFilterBy("private")}>
                    Private
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterBy("public")}>
                    Public
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <SortAsc className="h-4 w-4 mr-2" />
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSortBy("activity")}>
                    Recent Activity
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("name")}>
                    Name
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("created")}>
                    Date Created
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("members")}>
                    Member Count
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Groups List */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : filteredGroups.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold mb-2">
                  {searchQuery ? "No groups found" : "No chat groups yet"}
                </h3>
                <p
                  className={`${darkMode ? "text-gray-400" : "text-gray-600"} mb-6`}
                >
                  {searchQuery
                    ? "Try adjusting your search terms"
                    : "Create your first group to start collaborating"}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => setShowCreateDialog(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Group
                  </Button>
                )}
              </motion.div>
            ) : (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "space-y-4"
                }
              >
                <AnimatePresence>
                  {filteredGroups.map((group, index) => (
                    <motion.div
                      key={group.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: viewMode === "grid" ? 1.02 : 1.01 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        className={`cursor-pointer transition-all duration-200 hover:shadow-lg relative ${
                          darkMode
                            ? "bg-gray-800 border-gray-700 hover:bg-gray-750"
                            : "hover:shadow-xl"
                        } ${
                          favoriteGroups.includes(group.id)
                            ? "ring-2 ring-yellow-400"
                            : ""
                        } ${mutedGroups.includes(group.id) ? "opacity-60" : ""}`}
                        onClick={() => setSelectedGroup(group)}
                      >
                        {/* Favorite Star */}
                        {favoriteGroups.includes(group.id) && (
                          <Star className="absolute top-2 right-2 h-4 w-4 text-yellow-400 fill-current" />
                        )}

                        {/* Muted Indicator */}
                        {mutedGroups.includes(group.id) && (
                          <BellOff className="absolute top-2 right-8 h-4 w-4 text-gray-400" />
                        )}

                        <CardHeader
                          className={`pb-3 ${viewMode === "list" ? "py-3" : ""}`}
                        >
                          <div className="flex items-center justify-between">
                            <div
                              className={`flex items-center gap-3 ${viewMode === "list" ? "flex-1" : ""}`}
                            >
                              <Avatar
                                className={
                                  viewMode === "grid"
                                    ? "h-12 w-12"
                                    : "h-10 w-10"
                                }
                              >
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
                              <div className="flex-1">
                                <CardTitle
                                  className={`${viewMode === "grid" ? "text-lg" : "text-base"} flex items-center gap-2`}
                                >
                                  {group.name}
                                  {group.is_private ? (
                                    <Lock className="h-4 w-4 text-gray-500" />
                                  ) : (
                                    <Globe className="h-4 w-4 text-gray-500" />
                                  )}
                                </CardTitle>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    <Users className="h-3 w-3 mr-1" />
                                    {group.member_count}
                                  </Badge>
                                  {group.created_by === user?.id && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      <Crown className="h-3 w-3 mr-1" />
                                      Owner
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Group Actions */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(group.id);
                                  }}
                                >
                                  <Star
                                    className={`h-4 w-4 mr-2 ${favoriteGroups.includes(group.id) ? "text-yellow-400 fill-current" : ""}`}
                                  />
                                  {favoriteGroups.includes(group.id)
                                    ? "Remove from Favorites"
                                    : "Add to Favorites"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleMute(group.id);
                                  }}
                                >
                                  {mutedGroups.includes(group.id) ? (
                                    <>
                                      <Bell className="h-4 w-4 mr-2" />
                                      Unmute
                                    </>
                                  ) : (
                                    <>
                                      <BellOff className="h-4 w-4 mr-2" />
                                      Mute
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {group.created_by === user?.id ? (
                                  <>
                                    <DropdownMenuItem>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit Group
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteGroup(group.id);
                                      }}
                                      className="text-red-600"
                                    >
                                      <Trash className="h-4 w-4 mr-2" />
                                      Delete Group
                                    </DropdownMenuItem>
                                  </>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      leaveGroup(group.id);
                                    }}
                                    className="text-red-600"
                                  >
                                    <Trash className="h-4 w-4 mr-2" />
                                    Leave Group
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>

                        {viewMode === "grid" && (
                          <CardContent>
                            {group.description && (
                              <p
                                className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"} mb-3 line-clamp-2`}
                              >
                                {group.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}
                              >
                                Created{" "}
                                {new Date(
                                  group.created_at,
                                ).toLocaleDateString()}
                              </span>
                              <div className="flex items-center gap-1">
                                <MessageCircle className="h-4 w-4 text-purple-500" />
                                <span className="text-xs text-purple-500 font-medium">
                                  Join Chat
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        )}

                        {viewMode === "list" && (
                          <div className="px-6 pb-3">
                            <div className="flex items-center justify-between">
                              {group.description && (
                                <p
                                  className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"} flex-1 mr-4 truncate`}
                                >
                                  {group.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4">
                                <span
                                  className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}
                                >
                                  {new Date(
                                    group.updated_at,
                                  ).toLocaleDateString()}
                                </span>
                                <MessageCircle className="h-4 w-4 text-purple-500" />
                              </div>
                            </div>
                          </div>
                        )}
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          <TabsContent value="friends" className="flex-1 overflow-hidden m-0">
            <FriendsManager
              darkMode={darkMode}
              onStartChat={(friendId) => {
                // Handle starting a chat with a friend
                console.log("Start chat with friend:", friendId);
              }}
              onShareNote={(friendId) => {
                // Handle sharing a note with a friend
                console.log("Share note with friend:", friendId);
              }}
            />
          </TabsContent>

          <TabsContent value="discover" className="flex-1 overflow-hidden m-0">
            <GroupDiscovery
              darkMode={darkMode}
              onJoinGroup={(group) => {
                // Handle joining a group
                console.log("Joined group:", group);
                loadGroups(); // Refresh groups list
              }}
              onViewGroup={(group) => {
                // Handle viewing group details
                console.log("View group:", group);
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
