import { useState } from "react";
import { useAuth } from "../../../supabase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Bell,
  Shield,
  Palette,
  Download,
  Upload,
  Trash2,
  Key,
  Moon,
  Sun,
  Monitor,
  Globe,
  Lock,
  Eye,
  Smartphone,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [settings, setSettings] = useState({
    // Appearance
    theme: "system",
    fontSize: "medium",
    compactMode: false,
    showLineNumbers: true,

    // Notifications
    emailNotifications: true,
    pushNotifications: false,
    reminderNotifications: true,

    // Privacy
    profileVisibility: "private",
    dataSharing: false,
    analyticsTracking: true,

    // Editor
    autoSave: true,
    spellCheck: true,
    wordWrap: true,
    syntaxHighlighting: true,

    // Backup
    autoBackup: true,
    backupFrequency: "daily",
    cloudSync: true,
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    toast.success("Setting updated!");
  };

  const exportData = () => {
    toast.success("Data export started! You'll receive an email when ready.");
  };

  const deleteAccount = () => {
    toast.error("Account deletion is not available in demo mode.");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Notes
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Settings
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <Tabs defaultValue="appearance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
            <TabsTrigger value="editor" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              <span className="hidden sm:inline">Editor</span>
            </TabsTrigger>
            <TabsTrigger value="backup" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Backup</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
          </TabsList>

          {/* Appearance Settings */}
          <TabsContent value="appearance">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Appearance Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Theme</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Choose your preferred theme
                      </p>
                    </div>
                    <Select
                      value={settings.theme}
                      onValueChange={(value) =>
                        handleSettingChange("theme", value)
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">
                          <div className="flex items-center gap-2">
                            <Sun className="h-4 w-4" />
                            Light
                          </div>
                        </SelectItem>
                        <SelectItem value="dark">
                          <div className="flex items-center gap-2">
                            <Moon className="h-4 w-4" />
                            Dark
                          </div>
                        </SelectItem>
                        <SelectItem value="system">
                          <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4" />
                            System
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Font Size</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Adjust text size for better readability
                      </p>
                    </div>
                    <Select
                      value={settings.fontSize}
                      onValueChange={(value) =>
                        handleSettingChange("fontSize", value)
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">
                        Compact Mode
                      </Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Reduce spacing for more content
                      </p>
                    </div>
                    <Switch
                      checked={settings.compactMode}
                      onCheckedChange={(checked) =>
                        handleSettingChange("compactMode", checked)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">
                        Email Notifications
                      </Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Receive updates via email
                      </p>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) =>
                        handleSettingChange("emailNotifications", checked)
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">
                        Push Notifications
                      </Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Browser push notifications
                      </p>
                    </div>
                    <Switch
                      checked={settings.pushNotifications}
                      onCheckedChange={(checked) =>
                        handleSettingChange("pushNotifications", checked)
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">
                        Reminder Notifications
                      </Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Get reminded about your notes
                      </p>
                    </div>
                    <Switch
                      checked={settings.reminderNotifications}
                      onCheckedChange={(checked) =>
                        handleSettingChange("reminderNotifications", checked)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Privacy Settings */}
          <TabsContent value="privacy">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Privacy Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">
                        Profile Visibility
                      </Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Control who can see your profile
                      </p>
                    </div>
                    <Select
                      value={settings.profileVisibility}
                      onValueChange={(value) =>
                        handleSettingChange("profileVisibility", value)
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Public
                          </div>
                        </SelectItem>
                        <SelectItem value="private">
                          <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            Private
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">
                        Data Sharing
                      </Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Share anonymized usage data
                      </p>
                    </div>
                    <Switch
                      checked={settings.dataSharing}
                      onCheckedChange={(checked) =>
                        handleSettingChange("dataSharing", checked)
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">
                        Analytics Tracking
                      </Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Help improve the app with usage analytics
                      </p>
                    </div>
                    <Switch
                      checked={settings.analyticsTracking}
                      onCheckedChange={(checked) =>
                        handleSettingChange("analyticsTracking", checked)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Editor Settings */}
          <TabsContent value="editor">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Editor Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Auto Save</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Automatically save changes
                      </p>
                    </div>
                    <Switch
                      checked={settings.autoSave}
                      onCheckedChange={(checked) =>
                        handleSettingChange("autoSave", checked)
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">
                        Spell Check
                      </Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Check spelling while typing
                      </p>
                    </div>
                    <Switch
                      checked={settings.spellCheck}
                      onCheckedChange={(checked) =>
                        handleSettingChange("spellCheck", checked)
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Word Wrap</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Wrap long lines automatically
                      </p>
                    </div>
                    <Switch
                      checked={settings.wordWrap}
                      onCheckedChange={(checked) =>
                        handleSettingChange("wordWrap", checked)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Backup Settings */}
          <TabsContent value="backup">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Backup & Export
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">
                        Auto Backup
                      </Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Automatically backup your data
                      </p>
                    </div>
                    <Switch
                      checked={settings.autoBackup}
                      onCheckedChange={(checked) =>
                        handleSettingChange("autoBackup", checked)
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">
                        Backup Frequency
                      </Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        How often to create backups
                      </p>
                    </div>
                    <Select
                      value={settings.backupFrequency}
                      onValueChange={(value) =>
                        handleSettingChange("backupFrequency", value)
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">
                        Export Data
                      </Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Download all your notes and data
                      </p>
                    </div>
                    <Button onClick={exportData} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Account Settings */}
          <TabsContent value="account">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Account Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Email Address</Label>
                    <Input
                      value={user?.email || ""}
                      disabled
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Account Type</Label>
                    <div className="mt-1">
                      <Badge variant="secondary">Premium Account</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-200 dark:border-red-800">
                <CardHeader>
                  <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                    <Trash2 className="h-5 w-5" />
                    Danger Zone
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium text-red-600 dark:text-red-400">
                        Delete Account
                      </Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Permanently delete your account and all data
                      </p>
                    </div>
                    <Button onClick={deleteAccount} variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
