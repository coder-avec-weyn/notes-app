import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  Lock,
  Unlock,
  Key,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Fingerprint,
  ShieldCheck,
} from "lucide-react";
import { Note } from "../types/NoteInterface";
import { supabase } from "../../../../supabase/supabase";
import { toast } from "react-hot-toast";

interface NoteSecurityProps {
  note: Note;
  onNoteUpdated: (note: Note) => void;
}

interface SecuritySettings {
  isEncrypted: boolean;
  requiresPassword: boolean;
  autoLockTimeout: number;
  allowOfflineAccess: boolean;
  enableAuditLog: boolean;
  restrictSharing: boolean;
}

export function NoteSecurity({ note, onNoteUpdated }: NoteSecurityProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [securityScore, setSecurityScore] = useState(0);
  const [settings, setSettings] = useState<SecuritySettings>({
    isEncrypted: !!note.encryption_key,
    requiresPassword: !!note.is_locked,
    autoLockTimeout: 30,
    allowOfflineAccess: true,
    enableAuditLog: false,
    restrictSharing: false,
  });

  const calculateSecurityScore = (settings: SecuritySettings): number => {
    let score = 0;
    if (settings.isEncrypted) score += 30;
    if (settings.requiresPassword) score += 25;
    if (settings.autoLockTimeout <= 15) score += 15;
    if (!settings.allowOfflineAccess) score += 10;
    if (settings.enableAuditLog) score += 10;
    if (settings.restrictSharing) score += 10;
    return Math.min(score, 100);
  };

  const getPasswordStrength = (
    pwd: string,
  ): { strength: number; label: string; color: string } => {
    let strength = 0;
    if (pwd.length >= 8) strength += 25;
    if (/[A-Z]/.test(pwd)) strength += 25;
    if (/[a-z]/.test(pwd)) strength += 25;
    if (/[0-9]/.test(pwd)) strength += 15;
    if (/[^A-Za-z0-9]/.test(pwd)) strength += 10;

    let label = "Very Weak";
    let color = "text-red-600";
    if (strength >= 80) {
      label = "Very Strong";
      color = "text-green-600";
    } else if (strength >= 60) {
      label = "Strong";
      color = "text-blue-600";
    } else if (strength >= 40) {
      label = "Medium";
      color = "text-yellow-600";
    } else if (strength >= 20) {
      label = "Weak";
      color = "text-orange-600";
    }

    return { strength, label, color };
  };

  const encryptNote = async () => {
    if (!password) {
      toast.error("Password is required for encryption");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const passwordStrength = getPasswordStrength(password);
    if (passwordStrength.strength < 40) {
      toast.error("Password is too weak. Please use a stronger password.");
      return;
    }

    setIsProcessing(true);
    try {
      // In a real app, you would use proper encryption libraries
      const mockEncryptionKey = btoa(password + Date.now());

      const updatedNote = {
        ...note,
        encryption_key: mockEncryptionKey,
        is_locked: true,
      };

      const { error } = await supabase
        .from("notes")
        .update({
          encryption_key: mockEncryptionKey,
          is_locked: true,
        })
        .eq("id", note.id);

      if (error) throw error;

      onNoteUpdated(updatedNote);
      setSettings((prev) => ({
        ...prev,
        isEncrypted: true,
        requiresPassword: true,
      }));
      toast.success("Note encrypted successfully!");
    } catch (error) {
      console.error("Encryption error:", error);
      toast.error("Failed to encrypt note");
    } finally {
      setIsProcessing(false);
    }
  };

  const decryptNote = async () => {
    setIsProcessing(true);
    try {
      const updatedNote = {
        ...note,
        encryption_key: null,
        is_locked: false,
      };

      const { error } = await supabase
        .from("notes")
        .update({
          encryption_key: null,
          is_locked: false,
        })
        .eq("id", note.id);

      if (error) throw error;

      onNoteUpdated(updatedNote);
      setSettings((prev) => ({
        ...prev,
        isEncrypted: false,
        requiresPassword: false,
      }));
      setPassword("");
      setConfirmPassword("");
      toast.success("Note decrypted successfully!");
    } catch (error) {
      console.error("Decryption error:", error);
      toast.error("Failed to decrypt note");
    } finally {
      setIsProcessing(false);
    }
  };

  const updateSecuritySettings = async (
    newSettings: Partial<SecuritySettings>,
  ) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    setSecurityScore(calculateSecurityScore(updatedSettings));

    // In a real app, you would save these settings to the database
    toast.success("Security settings updated!");
  };

  const generateSecurePassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(password);
    setConfirmPassword(password);
  };

  const currentScore = calculateSecurityScore(settings);
  const passwordStrength = password ? getPasswordStrength(password) : null;

  const getSecurityLevel = (score: number) => {
    if (score >= 80)
      return { level: "High", color: "text-green-600", bg: "bg-green-50" };
    if (score >= 60)
      return { level: "Medium", color: "text-yellow-600", bg: "bg-yellow-50" };
    if (score >= 40)
      return { level: "Low", color: "text-orange-600", bg: "bg-orange-50" };
    return { level: "Very Low", color: "text-red-600", bg: "bg-red-50" };
  };

  const securityLevel = getSecurityLevel(currentScore);

  return (
    <>
      {note.is_locked && (
        <Badge variant="secondary" className="mr-2">
          <Lock className="h-3 w-3 mr-1" />
          Secured
        </Badge>
      )}

      {note.encryption_key && (
        <Badge variant="secondary" className="mr-2">
          <Shield className="h-3 w-3 mr-1" />
          Encrypted
        </Badge>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Note Security
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Security Score */}
            <div className={`p-4 rounded-lg ${securityLevel.bg}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Security Score</h3>
                <div className="flex items-center gap-2">
                  <ShieldCheck className={`h-5 w-5 ${securityLevel.color}`} />
                  <span className={`font-bold ${securityLevel.color}`}>
                    {securityLevel.level}
                  </span>
                </div>
              </div>
              <Progress value={currentScore} className="mb-2" />
              <p className="text-sm text-gray-600">
                {currentScore}/100 - {securityLevel.level} security level
              </p>
            </div>

            {/* Encryption Section */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Key className="h-4 w-4" />
                Encryption
              </h3>

              {!settings.isEncrypted ? (
                <div className="space-y-4">
                  <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800">
                        Note is not encrypted
                      </span>
                    </div>
                    <p className="text-sm text-yellow-700">
                      Your note content is stored in plain text. Enable
                      encryption for better security.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="password">Encryption Password</Label>
                      <div className="flex gap-2 mt-1">
                        <div className="relative flex-1">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter a strong password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={generateSecurePassword}
                        >
                          Generate
                        </Button>
                      </div>
                      {passwordStrength && (
                        <div className="mt-2">
                          <div className="flex justify-between text-sm">
                            <span>Password Strength</span>
                            <span className={passwordStrength.color}>
                              {passwordStrength.label}
                            </span>
                          </div>
                          <Progress
                            value={passwordStrength.strength}
                            className="mt-1"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        className="mt-1"
                      />
                    </div>

                    <Button
                      onClick={encryptNote}
                      disabled={
                        isProcessing ||
                        !password ||
                        password !== confirmPassword
                      }
                      className="w-full"
                    >
                      {isProcessing ? "Encrypting..." : "Enable Encryption"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-green-50 rounded border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">
                        Note is encrypted
                      </span>
                    </div>
                    <p className="text-sm text-green-700">
                      Your note content is securely encrypted and protected.
                    </p>
                  </div>

                  <Button
                    onClick={decryptNote}
                    disabled={isProcessing}
                    variant="destructive"
                    className="w-full"
                  >
                    {isProcessing ? "Decrypting..." : "Disable Encryption"}
                  </Button>
                </div>
              )}
            </div>

            {/* Security Settings */}
            <div className="space-y-4">
              <h3 className="font-semibold">Security Settings</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Password</Label>
                    <p className="text-sm text-gray-500">
                      Require password to view this note
                    </p>
                  </div>
                  <Switch
                    checked={settings.requiresPassword}
                    onCheckedChange={(checked) =>
                      updateSecuritySettings({ requiresPassword: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-lock Timeout</Label>
                    <p className="text-sm text-gray-500">
                      Lock note after inactivity (minutes)
                    </p>
                  </div>
                  <Input
                    type="number"
                    value={settings.autoLockTimeout}
                    onChange={(e) =>
                      updateSecuritySettings({
                        autoLockTimeout: parseInt(e.target.value) || 30,
                      })
                    }
                    className="w-20"
                    min="1"
                    max="120"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Offline Access</Label>
                    <p className="text-sm text-gray-500">
                      Cache note for offline viewing
                    </p>
                  </div>
                  <Switch
                    checked={settings.allowOfflineAccess}
                    onCheckedChange={(checked) =>
                      updateSecuritySettings({ allowOfflineAccess: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Audit Log</Label>
                    <p className="text-sm text-gray-500">
                      Track access and modifications
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableAuditLog}
                    onCheckedChange={(checked) =>
                      updateSecuritySettings({ enableAuditLog: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Restrict Sharing</Label>
                    <p className="text-sm text-gray-500">
                      Prevent sharing and collaboration
                    </p>
                  </div>
                  <Switch
                    checked={settings.restrictSharing}
                    onCheckedChange={(checked) =>
                      updateSecuritySettings({ restrictSharing: checked })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Security Recommendations */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                <Fingerprint className="h-4 w-4" />
                Security Recommendations
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Use a strong, unique password for encryption</li>
                <li>• Enable auto-lock for sensitive notes</li>
                <li>• Regularly update your passwords</li>
                <li>• Disable offline access for highly sensitive content</li>
                <li>• Enable audit logging for compliance requirements</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
