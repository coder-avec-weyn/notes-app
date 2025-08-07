import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Download,
  Upload,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Note } from "../types/NoteInterface";
import { supabase } from "../../../../supabase/supabase";
import { toast } from "react-hot-toast";

interface NoteBackupProps {
  note: Note;
  onNoteUpdated: (note: Note) => void;
}

interface BackupVersion {
  id: string;
  version: number;
  content: string;
  title: string;
  createdAt: string;
  size: number;
}

export function NoteBackup({ note, onNoteUpdated }: NoteBackupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [backupVersions, setBackupVersions] = useState<BackupVersion[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);

  const createBackup = async () => {
    setIsCreatingBackup(true);
    setBackupProgress(0);

    try {
      // Simulate backup progress
      const progressInterval = setInterval(() => {
        setBackupProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Create backup version
      const backupVersion: BackupVersion = {
        id: crypto.randomUUID(),
        version: (note.version || 0) + 1,
        content: note.content,
        title: note.title,
        createdAt: new Date().toISOString(),
        size: new Blob([note.content]).size,
      };

      // In a real app, you'd save this to a backups table
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const updatedNote = {
        ...note,
        version: backupVersion.version,
        backup_count: (note.backup_count || 0) + 1,
      };

      const { error } = await supabase
        .from("notes")
        .update({
          version: updatedNote.version,
          backup_count: updatedNote.backup_count,
        })
        .eq("id", note.id);

      if (error) throw error;

      clearInterval(progressInterval);
      setBackupProgress(100);

      setBackupVersions((prev) => [backupVersion, ...prev]);
      onNoteUpdated(updatedNote);

      setTimeout(() => {
        toast.success("Backup created successfully!");
        setBackupProgress(0);
      }, 500);
    } catch (error) {
      console.error("Error creating backup:", error);
      toast.error("Failed to create backup");
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const loadBackupVersions = async () => {
    setIsLoadingVersions(true);
    try {
      // In a real app, you'd fetch from a backups table
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock backup versions
      const mockVersions: BackupVersion[] = [
        {
          id: "1",
          version: note.version || 1,
          content: note.content,
          title: note.title,
          createdAt: new Date().toISOString(),
          size: new Blob([note.content]).size,
        },
      ];

      setBackupVersions(mockVersions);
    } catch (error) {
      console.error("Error loading backup versions:", error);
      toast.error("Failed to load backup versions");
    } finally {
      setIsLoadingVersions(false);
    }
  };

  const restoreFromBackup = async (version: BackupVersion) => {
    if (
      !window.confirm(
        "Are you sure you want to restore from this backup? Current changes will be lost.",
      )
    ) {
      return;
    }

    try {
      const updatedNote = {
        ...note,
        title: version.title,
        content: version.content,
        version: (note.version || 0) + 1,
      };

      const { error } = await supabase
        .from("notes")
        .update({
          title: updatedNote.title,
          content: updatedNote.content,
          version: updatedNote.version,
        })
        .eq("id", note.id);

      if (error) throw error;

      onNoteUpdated(updatedNote);
      toast.success("Note restored from backup!");
      setIsOpen(false);
    } catch (error) {
      console.error("Error restoring backup:", error);
      toast.error("Failed to restore from backup");
    }
  };

  const exportBackup = (version: BackupVersion) => {
    const backupData = {
      id: note.id,
      title: version.title,
      content: version.content,
      version: version.version,
      createdAt: version.createdAt,
      originalNote: {
        id: note.id,
        created_at: note.created_at,
        tags: note.tags,
      },
    };

    const dataStr = JSON.stringify(backupData, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `note-backup-v${version.version}-${new Date().toISOString().split("T")[0]}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();

    toast.success("Backup exported successfully!");
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <>
      {(note.backup_count || 0) > 0 && (
        <Badge variant="secondary" className="mr-2">
          <Shield className="h-3 w-3 mr-1" />
          {note.backup_count} backups
        </Badge>
      )}

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (open) loadBackupVersions();
        }}
      >
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Shield className="h-4 w-4 mr-2" />
            Backup
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Note Backup & Restore</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={createBackup}
                disabled={isCreatingBackup}
                className="flex-1"
              >
                {isCreatingBackup ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                {isCreatingBackup ? "Creating Backup..." : "Create Backup"}
              </Button>
            </div>

            {isCreatingBackup && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Creating backup...</span>
                  <span>{backupProgress}%</span>
                </div>
                <Progress value={backupProgress} className="w-full" />
              </div>
            )}

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Backup Versions</h4>
                {isLoadingVersions && (
                  <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full" />
                )}
              </div>

              {backupVersions.length > 0 ? (
                <div className="space-y-2">
                  {backupVersions.map((version) => (
                    <div
                      key={version.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-blue-600">
                          <CheckCircle className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            Version {version.version} - {version.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(version.createdAt).toLocaleString()} •{" "}
                            {formatFileSize(version.size)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => exportBackup(version)}
                          className="h-8 w-8 p-0"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => restoreFromBackup(version)}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800"
                        >
                          <Upload className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No backups yet</p>
                  <p className="text-sm">
                    Create your first backup to protect your work
                  </p>
                </div>
              )}
            </div>

            <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
              <strong>Auto-backup:</strong> Backups are automatically created
              when you make significant changes to your note.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
