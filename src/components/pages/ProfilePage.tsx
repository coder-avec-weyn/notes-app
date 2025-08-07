import { useState, useEffect } from "react";
import { useAuth } from "../../../supabase/auth";
import { supabase } from "../../../supabase/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Camera,
  Mail,
  User,
  Calendar,
  MapPin,
  Link as LinkIcon,
  AtSign,
  Save,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    username: "",
    displayName: "",
    bio: "",
    location: "",
    website: "",
    avatarUrl: "",
    joinedDate: new Date().toLocaleDateString(),
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setProfile({
          username: data.username || "",
          displayName: data.display_name || "",
          bio: data.bio || "",
          location: "", // Add location field to database if needed
          website: "", // Add website field to database if needed
          avatarUrl: data.avatar_url || "",
          joinedDate: new Date(data.created_at).toLocaleDateString(),
        });
      } else {
        // Create profile if it doesn't exist
        const { error: createError } = await supabase
          .from("user_profiles")
          .insert({
            user_id: user?.id,
            display_name: user?.email?.split("@")[0] || "",
            username: user?.email?.split("@")[0] || "",
          });

        if (createError) {
          console.error("Error creating profile:", createError);
        } else {
          loadProfile(); // Reload after creation
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          username: profile.username,
          display_name: profile.displayName,
          bio: profile.bio,
          avatar_url: profile.avatarUrl,
        })
        .eq("user_id", user?.id);

      if (error) throw error;

      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      if (
        error.code === "23505" &&
        error.constraint === "user_profiles_username_key"
      ) {
        toast.error("Username already taken. Please choose a different one.");
      } else {
        toast.error("Failed to update profile");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    loadProfile(); // Reload original data
  };

  const stats = [
    { label: "Notes Created", value: "127" },
    { label: "Tags Used", value: "45" },
    { label: "Days Active", value: "89" },
    { label: "Words Written", value: "12.5K" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Notes
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Profile
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-white dark:bg-gray-800">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4">
                      <Avatar className="h-24 w-24">
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
                          alt={user?.email || ""}
                        />
                        <AvatarFallback className="text-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                          {user?.email?.[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        size="sm"
                        className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0"
                        onClick={() => toast.info("Avatar upload coming soon!")}
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                      {profile.displayName ||
                        profile.username ||
                        "Unknown User"}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                      @{profile.username || "unknown"}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">
                      {user?.email}
                    </p>
                    <Badge variant="secondary" className="mb-4">
                      Premium User
                    </Badge>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {profile.bio}
                    </p>
                  </div>

                  <Separator className="my-6" />

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <AtSign className="h-4 w-4" />
                      <span>@{profile.username || "unknown"}</span>
                    </div>
                    {profile.location && (
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                        <MapPin className="h-4 w-4" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    {profile.website && (
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                        <LinkIcon className="h-4 w-4" />
                        <a
                          href={profile.website}
                          className="text-blue-600 hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {profile.website}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {profile.joinedDate}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg">Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.map((stat, index) => (
                      <div key={index} className="text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {stat.value}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Edit Profile */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card className="bg-white dark:bg-gray-800">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Profile Information</CardTitle>
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancel}
                          disabled={saving}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSave}
                          disabled={saving}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          {saving ? "Saving..." : "Save"}
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                      >
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <div className="relative">
                        <AtSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                          id="username"
                          value={profile.username}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              username: e.target.value
                                .toLowerCase()
                                .replace(/[^a-z0-9_]/g, ""),
                            })
                          }
                          disabled={!isEditing}
                          className="mt-1 pl-9"
                          placeholder="username"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Only lowercase letters, numbers, and underscores
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        value={profile.displayName}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            displayName: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                        className="mt-1"
                        placeholder="Your display name"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={profile.location}
                        onChange={(e) =>
                          setProfile({ ...profile, location: e.target.value })
                        }
                        disabled={!isEditing}
                        className="mt-1"
                        placeholder="City, Country"
                      />
                    </div>
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={profile.website}
                        onChange={(e) =>
                          setProfile({ ...profile, website: e.target.value })
                        }
                        disabled={!isEditing}
                        className="mt-1"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profile.bio}
                      onChange={(e) =>
                        setProfile({ ...profile, bio: e.target.value })
                      }
                      disabled={!isEditing}
                      className="mt-1"
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
