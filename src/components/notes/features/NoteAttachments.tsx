import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Paperclip, Upload, X, File, Image, Download, Eye } from "lucide-react";
import { Note } from "../types/NoteInterface";
import { supabase } from "../../../../supabase/supabase";
import { toast } from "react-hot-toast";

interface NoteAttachmentsProps {
  note: Note;
  onNoteUpdated: (note: Note) => void;
}

interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}

export function NoteAttachments({ note, onNoteUpdated }: NoteAttachmentsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>(
    (note.attachments || []).map((url) => ({
      id: url.split("/").pop() || "",
      name: url.split("/").pop() || "Unknown",
      url,
      type: getFileType(url),
      size: 0,
      uploadedAt: new Date().toISOString(),
    })),
  );
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function getFileType(filename: string): string {
    const extension = filename.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || ""))
      return "image";
    if (["pdf"].includes(extension || "")) return "pdf";
    if (["doc", "docx"].includes(extension || "")) return "document";
    if (["txt", "md"].includes(extension || "")) return "text";
    return "file";
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newAttachments: Attachment[] = [];

    try {
      for (const file of Array.from(files)) {
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`File ${file.name} is too large. Max size is 10MB.`);
          continue;
        }

        // Create a mock attachment (in a real app, you'd upload to Supabase Storage)
        const mockAttachment: Attachment = {
          id: crypto.randomUUID(),
          name: file.name,
          url: URL.createObjectURL(file), // This would be the actual uploaded URL
          type: getFileType(file.name),
          size: file.size,
          uploadedAt: new Date().toISOString(),
        };

        newAttachments.push(mockAttachment);
      }

      const updatedAttachments = [...attachments, ...newAttachments];
      const attachmentUrls = updatedAttachments.map((att) => att.url);

      const { error } = await supabase
        .from("notes")
        .update({ attachments: attachmentUrls })
        .eq("id", note.id);

      if (error) throw error;

      const updatedNote = {
        ...note,
        attachments: attachmentUrls,
      };

      setAttachments(updatedAttachments);
      onNoteUpdated(updatedNote);
      toast.success(`${newAttachments.length} file(s) attached successfully!`);
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Failed to attach files");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeAttachment = async (attachmentId: string) => {
    try {
      const updatedAttachments = attachments.filter(
        (att) => att.id !== attachmentId,
      );
      const attachmentUrls = updatedAttachments.map((att) => att.url);

      const { error } = await supabase
        .from("notes")
        .update({ attachments: attachmentUrls })
        .eq("id", note.id);

      if (error) throw error;

      const updatedNote = {
        ...note,
        attachments: attachmentUrls,
      };

      setAttachments(updatedAttachments);
      onNoteUpdated(updatedNote);
      toast.success("Attachment removed");
    } catch (error) {
      console.error("Error removing attachment:", error);
      toast.error("Failed to remove attachment");
    }
  };

  const downloadAttachment = (attachment: Attachment) => {
    const link = document.createElement("a");
    link.href = attachment.url;
    link.download = attachment.name;
    link.click();
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <Image className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  return (
    <>
      {attachments.length > 0 && (
        <Badge variant="secondary" className="mr-2">
          <Paperclip className="h-3 w-3 mr-1" />
          {attachments.length}
        </Badge>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Paperclip className="h-4 w-4 mr-2" />
            Attachments
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Note Attachments</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.txt,.md"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {isUploading ? "Uploading..." : "Upload Files"}
              </Button>
              <p className="text-xs text-gray-500 mt-1">
                Supported: Images, PDFs, Documents, Text files (Max 10MB each)
              </p>
            </div>

            {attachments.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">
                  Attached Files ({attachments.length})
                </h4>
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="text-gray-500">
                          {getFileIcon(attachment.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {attachment.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(attachment.size)} •{" "}
                            {new Date(
                              attachment.uploadedAt,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {attachment.type === "image" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              window.open(attachment.url, "_blank")
                            }
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadAttachment(attachment)}
                          className="h-8 w-8 p-0"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(attachment.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {attachments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Paperclip className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No attachments yet</p>
                <p className="text-sm">
                  Upload files to attach them to this note
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
