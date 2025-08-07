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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Users,
  Globe,
  Lock,
  Star,
  Filter,
  SortAsc,
  UserPlus,
  MessageCircle,
  Crown,
  Shield,
  User,
  Hash,
  Calendar,
  TrendingUp,
  Eye,
  Heart,
  Bookmark,
  Share2,
  MoreVertical,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatGroup } from "../chat/ChatGroups";

export interface DiscoverableGroup extends ChatGroup {
  category?: string;
  tags?: string[];
  is_featured?: boolean;
  discovery_enabled?: boolean;
  join_requests_enabled?: boolean;
  member_preview?: any[];
  join_request_status?: "none" | "pending" | "approved" | "rejected";
}

interface GroupDiscoveryProps {
  darkMode?: boolean;
  onJoinGroup?: (group: DiscoverableGroup) => void;
  onViewGroup?: (group: DiscoverableGroup) => void;
}

export default function GroupDiscovery({
  darkMode = false,
  onJoinGroup,
  onViewGroup,
}: GroupDiscoveryProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<DiscoverableGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"popular" | "recent" | "name">(
    "popular",
  );
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<DiscoverableGroup | null>(
    null,
  );
  const [joinMessage, setJoinMessage] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [favoriteGroups, setFavoriteGroups] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      loadDiscoverableGroups();
      loadCategories();
      loadFavorites();
    }
  }, [user, selectedCategory, sortBy]);

  const loadDiscoverableGroups = async () => {
    try {
      let query = supabase
        .from("chat_groups")
        .select(
          `
          *,
          group_discovery (
            category,
            tags,
            is_featured,
            discovery_enabled,
            join_requests_enabled
          ),
          chat_group_members (
            user_id,
            role
          )
        `,
        )
        .eq("group_discovery.discovery_enabled", true)
        .neq("created_by", user?.id); // Don't show user's own groups

      if (selectedCategory !== "all") {
        query = query.eq("group_discovery.category", selectedCategory);
      }

      const { data, error } = await query.order(
        sortBy === "popular"
          ? "member_count"
          : sortBy === "recent"
            ? "created_at"
            : "name",
        { ascending: sortBy === "name" },
      );

      if (error) throw error;

      // Check join request status for each group
      const groupsWithStatus = await Promise.all(
        (data || []).map(async (group: any) => {
          // Check if user is already a member
          const isMember = group.chat_group_members?.some(
            (member: any) => member.user_id === user?.id,
          );

          if (isMember) {
            return null; // Don't show groups user is already in
          }

          // Check join request status
          const { data: joinRequest } = await supabase
            .from("group_join_requests")
            .select("status")
            .eq("group_id", group.id)
            .eq("user_id", user?.id)
            .single();

          return {
            ...group,
            category: group.group_discovery?.category,
            tags: group.group_discovery?.tags || [],
            is_featured: group.group_discovery?.is_featured,
            discovery_enabled: group.group_discovery?.discovery_enabled,
            join_requests_enabled: group.group_discovery?.join_requests_enabled,
            member_preview: group.chat_group_members?.slice(0, 3) || [],
            join_request_status: joinRequest?.status || "none",
          };
        }),
      );

      const filteredGroups = groupsWithStatus.filter(
        Boolean,
      ) as DiscoverableGroup[];
      setGroups(filteredGroups);

      // Extract all tags
      const tags = new Set<string>();
      filteredGroups.forEach((group) => {
        group.tags?.forEach((tag) => tags.add(tag));
      });
      setAllTags(Array.from(tags).sort());
    } catch (error) {
      console.error("Error loading discoverable groups:", error);
      toast({
        title: "Error",
        description: "Failed to load groups",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("group_discovery")
        .select("category")
        .not("category", "is", null);

      if (error) throw error;

      const uniqueCategories = [
        ...new Set(data?.map((item) => item.category).filter(Boolean)),
      ] as string[];
      setCategories(uniqueCategories.sort());
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadFavorites = () => {
    const saved = JSON.parse(localStorage.getItem("favoriteGroups") || "[]");
    setFavoriteGroups(saved);
  };

  const requestToJoinGroup = async (group: DiscoverableGroup) => {
    try {
      if (group.join_requests_enabled) {
        // Send join request
        const { error } = await supabase.from("group_join_requests").insert({
          group_id: group.id,
          user_id: user?.id,
          message: joinMessage,
        });

        if (error) throw error;

        toast({
          title: "Join Request Sent",
          description: `Your request to join "${group.name}" has been sent! 🎉`,
        });
      } else {
        // Join directly
        const { error } = await supabase.from("chat_group_members").insert({
          group_id: group.id,
          user_id: user?.id,
          role: "member",
        });

        if (error) throw error;

        toast({
          title: "Joined Group",
          description: `Welcome to "${group.name}"! 🎉`,
        });
        onJoinGroup?.(group);
      }

      setJoinMessage("");
      setShowJoinDialog(false);
      setSelectedGroup(null);
      loadDiscoverableGroups();
    } catch (error) {
      console.error("Error joining group:", error);
      toast({
        title: "Error",
        description: "Failed to join group",
        variant: "destructive",
      });
    }
  };

  const toggleFavorite = (groupId: string) => {
    const newFavorites = favoriteGroups.includes(groupId)
      ? favoriteGroups.filter((id) => id !== groupId)
      : [...favoriteGroups, groupId];
    setFavoriteGroups(newFavorites);
    localStorage.setItem("favoriteGroups", JSON.stringify(newFavorites));
  };

  const filteredGroups = groups
    .filter((group) => {
      const matchesSearch =
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.tags?.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase()),
        );

      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.some((tag) => group.tags?.includes(tag));

      return matchesSearch && matchesTags;
    })
    .sort((a, b) => {
      // Featured groups first
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;

      // Then favorites
      const aFav = favoriteGroups.includes(a.id);
      const bFav = favoriteGroups.includes(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;

      return 0;
    });

  const getJoinButtonText = (group: DiscoverableGroup) => {
    switch (group.join_request_status) {
      case "pending":
        return "Request Pending";
      case "approved":
        return "Join Now";
      case "rejected":
        return "Request Rejected";
      default:
        return group.join_requests_enabled ? "Request to Join" : "Join Group";
    }
  };

  const getJoinButtonDisabled = (group: DiscoverableGroup) => {
    return (
      group.join_request_status === "pending" ||
      group.join_request_status === "rejected"
    );
  };

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
            <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg">
              <Search className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Discover Groups</h1>
              <p
                className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
              >
                Find and join communities that match your interests
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search groups by name, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-9 ${darkMode ? "bg-gray-800 border-gray-600" : ""}`}
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <SortAsc className="h-4 w-4 mr-2" />
                  Sort by {sortBy}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSortBy("popular")}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Most Popular
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("recent")}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Recently Created
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("name")}>
                  <Hash className="h-4 w-4 mr-2" />
                  Name (A-Z)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {allTags.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Tags ({selectedTags.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  {allTags.map((tag) => (
                    <DropdownMenuItem
                      key={tag}
                      onClick={() => {
                        setSelectedTags((prev) =>
                          prev.includes(tag)
                            ? prev.filter((t) => t !== tag)
                            : [...prev, tag],
                        );
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag)}
                          readOnly
                          className="rounded"
                        />
                        <span>{tag}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  {selectedTags.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setSelectedTags([])}
                        className="text-red-600"
                      >
                        Clear All
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </motion.div>

      {/* Groups Grid */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : filteredGroups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery || selectedTags.length > 0
                ? "No groups found"
                : "No discoverable groups"}
            </h3>
            <p
              className={`${darkMode ? "text-gray-400" : "text-gray-600"} mb-6`}
            >
              {searchQuery || selectedTags.length > 0
                ? "Try adjusting your search criteria"
                : "Check back later for new groups to discover"}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredGroups.map((group, index) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg relative ${
                      darkMode
                        ? "bg-gray-800 border-gray-700 hover:bg-gray-750"
                        : "hover:shadow-xl"
                    } ${group.is_featured ? "ring-2 ring-yellow-400" : ""} ${
                      favoriteGroups.includes(group.id)
                        ? "ring-2 ring-pink-400"
                        : ""
                    }`}
                  >
                    {/* Featured Badge */}
                    {group.is_featured && (
                      <div className="absolute top-2 left-2 z-10">
                        <Badge className="bg-yellow-500 text-yellow-900">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Featured
                        </Badge>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="absolute top-2 right-2 z-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewGroup?.(group);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(group.id);
                            }}
                          >
                            <Heart
                              className={`h-4 w-4 mr-2 ${
                                favoriteGroups.includes(group.id)
                                  ? "text-pink-500 fill-current"
                                  : ""
                              }`}
                            />
                            {favoriteGroups.includes(group.id)
                              ? "Remove from Favorites"
                              : "Add to Favorites"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              // Share functionality
                            }}
                          >
                            <Share2 className="h-4 w-4 mr-2" />
                            Share Group
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={
                              group.avatar_url ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${group.name}`
                            }
                            alt={group.name}
                          />
                          <AvatarFallback className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
                            {group.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {group.name}
                            {group.is_private ? (
                              <Lock className="h-4 w-4 text-gray-500" />
                            ) : (
                              <Globe className="h-4 w-4 text-gray-500" />
                            )}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              {group.member_count}
                            </Badge>
                            {group.category && (
                              <Badge variant="outline" className="text-xs">
                                {group.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      {group.description && (
                        <p
                          className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"} mb-3 line-clamp-2`}
                        >
                          {group.description}
                        </p>
                      )}

                      {/* Tags */}
                      {group.tags && group.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {group.tags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs"
                            >
                              #{tag}
                            </Badge>
                          ))}
                          {group.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{group.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Member Preview */}
                      {group.member_preview &&
                        group.member_preview.length > 0 && (
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex -space-x-2">
                              {group.member_preview
                                .slice(0, 3)
                                .map((member, idx) => (
                                  <Avatar
                                    key={idx}
                                    className="h-6 w-6 border-2 border-white"
                                  >
                                    <AvatarImage
                                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user_id}`}
                                    />
                                    <AvatarFallback className="text-xs">
                                      {member.user_id?.[0]?.toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                            </div>
                            <span
                              className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                            >
                              and {group.member_count - 3} others
                            </span>
                          </div>
                        )}

                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}
                        >
                          Created{" "}
                          {new Date(group.created_at).toLocaleDateString()}
                        </span>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (group.join_requests_enabled) {
                              setSelectedGroup(group);
                              setShowJoinDialog(true);
                            } else {
                              requestToJoinGroup(group);
                            }
                          }}
                          disabled={getJoinButtonDisabled(group)}
                          className={
                            group.join_request_status === "pending"
                              ? "bg-yellow-600 hover:bg-yellow-700"
                              : group.join_request_status === "rejected"
                                ? "bg-red-600 hover:bg-red-700"
                                : "bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                          }
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          {getJoinButtonText(group)}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Join Request Dialog */}
      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent className={darkMode ? "bg-gray-800 text-white" : ""}>
          <DialogHeader>
            <DialogTitle>Request to Join "{selectedGroup?.name}"</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Message to Group Admins (Optional)
              </label>
              <Input
                value={joinMessage}
                onChange={(e) => setJoinMessage(e.target.value)}
                placeholder="Tell them why you'd like to join..."
                className={darkMode ? "bg-gray-700 border-gray-600" : ""}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                onClick={() =>
                  selectedGroup && requestToJoinGroup(selectedGroup)
                }
                className="flex-1"
              >
                Send Request
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowJoinDialog(false);
                  setSelectedGroup(null);
                  setJoinMessage("");
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
  );
}
