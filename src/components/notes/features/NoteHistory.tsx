import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  History,
  Clock,
  RotateCcw,
  GitBranch,
  User,
  Calendar,
  FileText,
  Edit,
  Trash2,
  Plus,
  Eye,
} from "lucide-react";
import { Note } from "../types/NoteInterface";
import { supabase } from "../../../../supabase/supabase";
import { toast } from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";

interface NoteHistoryProps {
  note: Note;
  onNoteUpdated: (note: Note) => void;
}

interface HistoryEntry {
  id: string;
  noteId: string;
  version: number;
  title: string;
  content: string;
  tags: string[];
  changeType: "created" | "updated" | "restored" | "deleted";
  changedBy: string;
  changedAt: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  size: number;
  wordCount: number;
}

export function NoteHistory({ note, onNoteUpdated }: NoteHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<HistoryEntry | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [compareVersion, setCompareVersion] = useState<HistoryEntry | null>(
    null,
  );

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, note.id]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      // In a real app, you would fetch from a history table
      // For now, we'll simulate history data
      const mockHistory: HistoryEntry[] = [
        {
          id: "1",
          noteId: note.id,
          version: note.version || 1,
          title: note.title,
          content: note.content,
          tags: note.tags,
          changeType: "updated",
          changedBy: "current-user",
          changedAt: note.updated_at,
          changes: [
            {
              field: "content",
              oldValue: note.content.substring(0, -10),
              newValue: note.content,
            },
          ],
          size: new Blob([note.content]).size,
          wordCount: note.content.split(/\s+/).length,
        },
        {
          id: "2",
          noteId: note.id,
          version: (note.version || 1) - 1,
          title: note.title,
          content:
            note.content.substring(0, -50) + "\n\nPrevious version content...",
          tags: note.tags.slice(0, -1),
          changeType: "updated",
          changedBy: "current-user",
          changedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          changes: [
            {
              field: "tags",
              oldValue: note.tags.slice(0, -1),
              newValue: note.tags,
            },
          ],
          size: new Blob([note.content.substring(0, -50)]).size,
          wordCount: note.content.substring(0, -50).split(/\s+/).length,
        },
        {
          id: "3",
          noteId: note.id,
          version: (note.version || 1) - 2,
          title: "Initial version - " + note.title,
          content: "Initial note content when first created.",
          tags: [],
          changeType: "created",
          changedBy: "current-user",
          changedAt: note.created_at,
          changes: [],
          size: new Blob(["Initial note content when first created."]).size,
          wordCount: 6,
        },
      ];

      setHistory(mockHistory);
    } catch (error) {
      console.error("Error loading history:", error);
      toast.error("Failed to load note history");
    } finally {
      setIsLoading(false);
    }
  };

  const restoreVersion = async (version: HistoryEntry) => {
    try {
      const updatedNote = {
        ...note,
        title: version.title,
        content: version.content,
        tags: version.tags,
        version: (note.version || 1) + 1,
      };

      const { error } = await supabase
        .from("notes")
        .update({
          title: version.title,
          content: version.content,
          tags: version.tags,
          version: updatedNote.version,
        })
        .eq("id", note.id);

      if (error) throw error;

      onNoteUpdated(updatedNote);
      toast.success(`Restored to version ${version.version}`);
      setIsOpen(false);
    } catch (error) {
      console.error("Error restoring version:", error);
      toast.error("Failed to restore version");
    }
  };

  const createSnapshot = async () => {
    try {
      // In a real app, you would save the current state as a new history entry
      const newEntry: HistoryEntry = {
        id: Date.now().toString(),
        noteId: note.id,
        version: (note.version || 1) + 1,
        title: note.title,
        content: note.content,
        tags: note.tags,
        changeType: "updated",
        changedBy: "current-user",
        changedAt: new Date().toISOString(),
        changes: [],
        size: new Blob([note.content]).size,
        wordCount: note.content.split(/\s+/).length,
      };

      setHistory([newEntry, ...history]);
      toast.success("Snapshot created successfully!");
    } catch (error) {
      console.error("Error creating snapshot:", error);
      toast.error("Failed to create snapshot");
    }
  };

  const generateDiff = (oldContent: string, newContent: string): string => {
    const oldLines = oldContent.split("\n");
    const newLines = newContent.split("\n");
    const diff: string[] = [];

    const maxLines = Math.max(oldLines.length, newLines.length);
    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i] || "";
      const newLine = newLines[i] || "";

      if (oldLine !== newLine) {
        if (oldLine && !newLine) {
          diff.push(`- ${oldLine}`);
        } else if (!oldLine && newLine) {
          diff.push(`+ ${newLine}`);
        } else {
          diff.push(`- ${oldLine}`);
          diff.push(`+ ${newLine}`);
        }
      } else {
        diff.push(`  ${oldLine}`);
      }
    }

    return diff.join("\n");
  };

  const getChangeTypeIcon = (type: HistoryEntry["changeType"]) => {
    switch (type) {
      case "created":
        return <Plus className="h-4 w-4 text-green-600" />;
      case "updated":
        return <Edit className="h-4 w-4 text-blue-600" />;
      case "restored":
        return <RotateCcw className="h-4 w-4 text-purple-600" />;
      case "deleted":
        return <Trash2 className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getChangeTypeColor = (type: HistoryEntry["changeType"]) => {
    switch (type) {
      case "created":
        return "bg-green-50 text-green-700 border-green-200";
      case "updated":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "restored":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "deleted":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
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
      {(note.version || 1) > 1 && (
        <Badge variant="secondary" className="mr-2">
          <History className="h-3 w-3 mr-1" />v{note.version || 1}
        </Badge>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <History className="h-4 w-4 mr-2" />
            History
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Note History
            </DialogTitle>
          </DialogHeader>

          <div className="flex gap-4 h-[70vh]">
            {/* History Timeline */}
            <div className="w-1/3 border-r pr-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Version History</h3>
                <Button onClick={createSnapshot} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Snapshot
                </Button>
              </div>

              <ScrollArea className="h-full">
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500">
                    <History className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                    <p>Loading history...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((entry, index) => (
                      <div
                        key={entry.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedVersion?.id === entry.id
                            ? "bg-blue-50 border-blue-200"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedVersion(entry)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getChangeTypeIcon(entry.changeType)}
                            <Badge
                              variant="outline"
                              className={`text-xs ${getChangeTypeColor(entry.changeType)}`}
                            >
                              v{entry.version}
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(entry.changedAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>

                        <h4 className="font-medium text-sm truncate mb-1">
                          {entry.title}
                        </h4>

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {entry.wordCount} words
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {entry.changedBy}
                          </span>
                        </div>

                        {entry.changes.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-600">
                              {entry.changes.length} change
                              {entry.changes.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Version Details */}
            <div className="flex-1">
              {selectedVersion ? (
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        Version {selectedVersion.version}
                        <Badge
                          className={getChangeTypeColor(
                            selectedVersion.changeType,
                          )}
                        >
                          {selectedVersion.changeType}
                        </Badge>
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(selectedVersion.changedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDiff(!showDiff)}
                      >
                        <GitBranch className="h-4 w-4 mr-1" />
                        {showDiff ? "Hide" : "Show"} Diff
                      </Button>
                      {selectedVersion.version !== (note.version || 1) && (
                        <Button
                          onClick={() => restoreVersion(selectedVersion)}
                          size="sm"
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Restore
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Version Metadata */}
                  <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Size</p>
                      <p className="font-medium">
                        {formatFileSize(selectedVersion.size)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Words</p>
                      <p className="font-medium">{selectedVersion.wordCount}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Tags</p>
                      <p className="font-medium">
                        {selectedVersion.tags.length}
                      </p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    {showDiff && compareVersion ? (
                      <div>
                        <h4 className="font-medium mb-2">Changes</h4>
                        <Textarea
                          value={generateDiff(
                            compareVersion.content,
                            selectedVersion.content,
                          )}
                          readOnly
                          className="h-full font-mono text-sm bg-gray-50"
                        />
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-medium mb-2">Content</h4>
                        <Textarea
                          value={selectedVersion.content}
                          readOnly
                          className="h-full bg-gray-50"
                        />
                      </div>
                    )}
                  </div>

                  {/* Changes Summary */}
                  {selectedVersion.changes.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded">
                      <h4 className="font-medium text-blue-800 mb-2">
                        Changes Made
                      </h4>
                      <div className="space-y-1">
                        {selectedVersion.changes.map((change, index) => (
                          <div key={index} className="text-sm text-blue-700">
                            <span className="font-medium capitalize">
                              {change.field}
                            </span>{" "}
                            was modified
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Select a version to view details</p>
                    <p className="text-sm mt-1">
                      Click on any version in the timeline to see its content
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
