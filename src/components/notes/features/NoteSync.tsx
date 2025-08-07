import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  RefreshCw,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Note } from "../types/NoteInterface";
import { supabase } from "../../../../supabase/supabase";
import { toast } from "react-hot-toast";

interface NoteSyncProps {
  note: Note;
  onNoteUpdated: (note: Note) => void;
}

type SyncStatus = "synced" | "pending" | "error" | "syncing";

export function NoteSync({ note, onNoteUpdated }: NoteSyncProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(
    note.sync_status || "synced",
  );
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncProgress, setSyncProgress] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [conflictData, setConflictData] = useState<any>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (syncStatus === "pending") {
        syncNote();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncStatus]);

  const syncNote = async () => {
    if (!isOnline) {
      toast.error("Cannot sync while offline");
      return;
    }

    setSyncStatus("syncing");
    setSyncProgress(0);

    try {
      // Simulate sync progress
      const progressInterval = setInterval(() => {
        setSyncProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 200);

      // Check for conflicts (simulate server-side check)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulate potential conflict
      const hasConflict = Math.random() < 0.1; // 10% chance of conflict

      if (hasConflict) {
        setConflictData({
          serverVersion: {
            title: note.title + " (Server Version)",
            content: note.content + "\n\n[Server changes]",
            updated_at: new Date().toISOString(),
          },
          localVersion: {
            title: note.title,
            content: note.content,
            updated_at: note.updated_at,
          },
        });
        setSyncStatus("error");
        clearInterval(progressInterval);
        setSyncProgress(0);
        return;
      }

      // Perform actual sync
      const { error } = await supabase
        .from("notes")
        .update({
          sync_status: "synced",
          offline_changes: false,
        })
        .eq("id", note.id);

      if (error) throw error;

      clearInterval(progressInterval);
      setSyncProgress(100);
      setSyncStatus("synced");
      setLastSyncTime(new Date().toISOString());

      const updatedNote = {
        ...note,
        sync_status: "synced" as const,
        offline_changes: false,
      };

      onNoteUpdated(updatedNote);

      setTimeout(() => {
        toast.success("Note synced successfully!");
        setSyncProgress(0);
      }, 500);
    } catch (error) {
      console.error("Error syncing note:", error);
      setSyncStatus("error");
      setSyncProgress(0);
      toast.error("Failed to sync note");
    }
  };

  const resolveConflict = async (useServerVersion: boolean) => {
    if (!conflictData) return;

    try {
      const resolvedData = useServerVersion
        ? conflictData.serverVersion
        : conflictData.localVersion;

      const { error } = await supabase
        .from("notes")
        .update({
          title: resolvedData.title,
          content: resolvedData.content,
          sync_status: "synced",
          offline_changes: false,
        })
        .eq("id", note.id);

      if (error) throw error;

      const updatedNote = {
        ...note,
        title: resolvedData.title,
        content: resolvedData.content,
        sync_status: "synced" as const,
        offline_changes: false,
      };

      onNoteUpdated(updatedNote);
      setConflictData(null);
      setSyncStatus("synced");
      toast.success("Conflict resolved successfully!");
    } catch (error) {
      console.error("Error resolving conflict:", error);
      toast.error("Failed to resolve conflict");
    }
  };

  const forcePushChanges = async () => {
    if (
      !window.confirm(
        "This will overwrite server changes with your local version. Continue?",
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("notes")
        .update({
          title: note.title,
          content: note.content,
          sync_status: "synced",
          offline_changes: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", note.id);

      if (error) throw error;

      const updatedNote = {
        ...note,
        sync_status: "synced" as const,
        offline_changes: false,
      };

      onNoteUpdated(updatedNote);
      setConflictData(null);
      setSyncStatus("synced");
      toast.success("Changes pushed to server!");
    } catch (error) {
      console.error("Error force pushing:", error);
      toast.error("Failed to push changes");
    }
  };

  const getSyncStatusInfo = () => {
    switch (syncStatus) {
      case "synced":
        return {
          icon: <CheckCircle className="h-3 w-3" />,
          label: "Synced",
          color: "bg-green-500 text-white",
        };
      case "pending":
        return {
          icon: <Clock className="h-3 w-3" />,
          label: "Pending",
          color: "bg-yellow-500 text-white",
        };
      case "error":
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          label: "Error",
          color: "bg-red-500 text-white",
        };
      case "syncing":
        return {
          icon: <RefreshCw className="h-3 w-3 animate-spin" />,
          label: "Syncing",
          color: "bg-blue-500 text-white",
        };
    }
  };

  const statusInfo = getSyncStatusInfo();

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {isOnline ? (
            <Wifi className="h-3 w-3 text-green-500" />
          ) : (
            <WifiOff className="h-3 w-3 text-red-500" />
          )}
        </div>

        {syncStatus !== "synced" && (
          <Badge className={statusInfo.color}>
            {statusInfo.icon}
            <span className="ml-1">{statusInfo.label}</span>
          </Badge>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Note Synchronization</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded ${statusInfo.color}`}>
                  {statusInfo.icon}
                </div>
                <div>
                  <p className="font-medium">Status: {statusInfo.label}</p>
                  <p className="text-sm text-gray-500">
                    {isOnline ? "Online" : "Offline"}
                  </p>
                </div>
              </div>
              {syncStatus !== "syncing" && (
                <Button onClick={syncNote} disabled={!isOnline} size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Now
                </Button>
              )}
            </div>

            {syncStatus === "syncing" && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Synchronizing...</span>
                  <span>{syncProgress}%</span>
                </div>
                <Progress value={syncProgress} className="w-full" />
              </div>
            )}

            {lastSyncTime && (
              <div className="text-sm text-gray-500">
                Last synced: {new Date(lastSyncTime).toLocaleString()}
              </div>
            )}

            {conflictData && (
              <div className="border border-red-200 rounded p-4 bg-red-50">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <h4 className="font-medium text-red-800">
                    Sync Conflict Detected
                  </h4>
                </div>
                <p className="text-sm text-red-700 mb-4">
                  The note has been modified on another device. Choose which
                  version to keep:
                </p>
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded border">
                    <h5 className="font-medium mb-1">Server Version</h5>
                    <p className="text-sm text-gray-600">
                      Modified:{" "}
                      {new Date(
                        conflictData.serverVersion.updated_at,
                      ).toLocaleString()}
                    </p>
                    <Button
                      onClick={() => resolveConflict(true)}
                      variant="outline"
                      size="sm"
                      className="mt-2"
                    >
                      Use Server Version
                    </Button>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <h5 className="font-medium mb-1">Your Version</h5>
                    <p className="text-sm text-gray-600">
                      Modified:{" "}
                      {new Date(
                        conflictData.localVersion.updated_at,
                      ).toLocaleString()}
                    </p>
                    <Button
                      onClick={() => resolveConflict(false)}
                      variant="outline"
                      size="sm"
                      className="mt-2"
                    >
                      Use Your Version
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={forcePushChanges}
                  variant="destructive"
                  size="sm"
                  className="mt-3 w-full"
                >
                  Force Push Your Changes
                </Button>
              </div>
            )}

            {note.offline_changes && (
              <div className="p-3 bg-yellow-50 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This note has offline changes that need
                  to be synced.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
