import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Download, FileText, File, Image } from "lucide-react";
import { Note } from "../types/NoteInterface";
import { toast } from "react-hot-toast";

interface NoteExportProps {
  notes: Note[];
  selectedNotes?: Note[];
}

type ExportFormat = "json" | "markdown" | "txt" | "csv" | "html";

interface ExportOptions {
  format: ExportFormat;
  includeMetadata: boolean;
  includeTags: boolean;
  includeAttachments: boolean;
  dateRange: string;
}

export function NoteExport({ notes, selectedNotes }: NoteExportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [options, setOptions] = useState<ExportOptions>({
    format: "json",
    includeMetadata: true,
    includeTags: true,
    includeAttachments: false,
    dateRange: "all",
  });

  const getNotesToExport = (): Note[] => {
    let notesToExport = selectedNotes && selectedNotes.length > 0 ? selectedNotes : notes;

    if (options.dateRange !== "all") {
      const now = new Date();
      let startDate: Date;

      switch (options.dateRange) {
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0);
      }

      notesToExport = notesToExport.filter(
        (note) => new Date(note.updated_at) >= startDate
      );
    }

    return notesToExport;
  };

  const exportAsJSON = (notesToExport: Note[]): string => {
    const exportData = notesToExport.map((note) => {
      const exportNote: any = {
        title: note.title,
        content: note.content,
      };

      if (options.includeTags) {
        exportNote.tags = note.tags;
      }

      if (options.includeMetadata) {
        exportNote.id = note.id;
        exportNote.created_at = note.created_at;
        exportNote.updated_at = note.updated_at;
        exportNote.priority = note.priority;
        exportNote.category = note.category;
        exportNote.is_pinned = note.is_pinned;
        exportNote.is_locked = note.is_locked;
        exportNote.word_count = note.word_count;
        exportNote.reading_time = note.reading_time;
      }

      if (options.includeAttachments && note.attachments) {
        exportNote.attachments = note.attachments;
      }

      return exportNote;
    });

    return JSON.stringify(exportData, null, 2);
  };

  const exportAsMarkdown = (notesToExport: Note[]): string => {
    return notesToExport
      .map((note) => {
        let markdown = `# ${note.title}\n\n`;
        
        if (options.includeMetadata) {
          markdown += `**Created:** ${new Date(note.created_at).toLocaleDateString()}\n`;
          markdown += `**Updated:** ${new Date(note.updated_at).toLocaleDateString()}\n`;
          if (note.priority) markdown += `**Priority:** ${note.priority}\n`;
          if (note.category) markdown += `**Category:** ${note.category}\n`;
          markdown += "\n";
        }

        if (options.includeTags && note.tags.length > 0) {
          markdown += `**Tags:** ${note.tags.join(", ")}\n\n`;
        }

        markdown += note.content + "\n\n---\n\n";
        return markdown;
      })
      .join("");
  };

  const exportAsText = (notesToExport: Note[]): string => {
    return notesToExport
      .map((note) => {
        let text = `${note.title}\n${"-".repeat(note.title.length)}\n\n`;
        
        if (options.includeMetadata) {
          text += `Created: ${new Date(note.created_at).toLocaleDateString()}\n`;
          text += `Updated: ${new Date(note.updated_at).toLocaleDateString()}\n`;
          if (note.priority) text += `Priority: ${note.priority}\n`;
          if (note.category) text += `Category: ${note.category}\n`;
          text += "\n";
        }

        if (options.includeTags && note.tags.length > 0) {
          text += `Tags: ${note.tags.join(", ")}\n\n`;
        }

        text += note.content + "\n\n" + "=".repeat(50) + "\n\n";
        return text;
      })
      .join("");
  };

  const exportAsCSV = (notesToExport: Note[]): string => {
    const headers = ["Title", "Content"];
    
    if (options.includeTags) headers.push("Tags");
    if (options.includeMetadata) {
      headers.push("Created", "Updated", "Priority", "Category", "Word Count");
    }

    const csvContent = [headers.join(",")];
    
    notesToExport.forEach((note) => {
      const row = [
        `"${note.title.replace(/"/g, '""')}",
        `"${note.content.replace(/"/g, '""').replace(/\n/g, ' ')}"`
      ];

      if (options.includeTags) {
        row.push(`"${note.tags.join("; ")}"`); 
      }

      if (options.includeMetadata) {
        row.push(
          `"${new Date(note.created_at).toLocaleDateString()}",
          `"${new Date(note.updated_at).toLocaleDateString()}",
          `"${note.priority || ''}",
          `"${note.category || ''}",
          `"${note.word_count || 0}"`
        );
      }

      csvContent.push(row.join(","));
    });

    return csvContent.join("\n");
  };

  const exportAsHTML = (notesToExport: Note[]): string => {
    let html = `
<!DOCTYPE html>
<html>
<head>
    <title>Exported Notes</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .note { margin-bottom: 40px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
        .note-title { color: #333; margin-bottom: 10px; }
        .note-meta { color: #666; font-size: 0.9em; margin-bottom: 15px; }
        .note-tags { margin-bottom: 15px; }
        .tag { background: #f0f0f0; padding: 2px 8px; border-radius: 12px; font-size: 0.8em; margin-right: 5px; }
        .note-content { line-height: 1.6; white-space: pre-wrap; }
    </style>
</head>
<body>
    <h1>Exported Notes</h1>
    <p>Exported on ${new Date().toLocaleDateString()}</p>
`;

    notesToExport.forEach((note) => {
      html += `    <div class="note">
`;
      html += `        <h2 class="note-title">${note.title}</h2>
`;
      
      if (options.includeMetadata) {
        html += `        <div class="note-meta">
`;
        html += `            Created: ${new Date(note.created_at).toLocaleDateString()} | `;
        html += `Updated: ${new Date(note.updated_at).toLocaleDateString()}`;
        if (note.priority) html += ` | Priority: ${note.priority}`;
        if (note.category) html += ` | Category: ${note.category}`;
        html += `\n        </div>\n`;
      }

      if (options.includeTags && note.tags.length > 0) {
        html += `        <div class="note-tags">
`;
        note.tags.forEach((tag) => {
          html += `            <span class="tag">${tag}</span>
`;
        });
        html += `        </div>\n`;
      }

      html += `        <div class="note-content">${note.content}</div>
`;
      html += `    </div>\n`;
    });

    html += `</body>
</html>`;
    return html;
  };

  const performExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      const notesToExport = getNotesToExport();
      
      if (notesToExport.length === 0) {
        toast.error("No notes to export");
        return;
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      let content: string;
      let filename: string;
      let mimeType: string;

      switch (options.format) {
        case "json":
          content = exportAsJSON(notesToExport);
          filename = `notes-export-${new Date().toISOString().split('T')[0]}.json`;
          mimeType = "application/json";
          break;
        case "markdown":
          content = exportAsMarkdown(notesToExport);
          filename = `notes-export-${new Date().toISOString().split('T')[0]}.md`;
          mimeType = "text/markdown";
          break;
        case "txt":
          content = exportAsText(notesToExport);
          filename = `notes-export-${new Date().toISOString().split('T')[0]}.txt`;
          mimeType = "text/plain";
          break;
        case "csv":
          content = exportAsCSV(notesToExport);
          filename = `notes-export-${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = "text/csv";
          break;
        case "html":
          content = exportAsHTML(notesToExport);
          filename = `notes-export-${new Date().toISOString().split('T')[0]}.html`;
          mimeType = "text/html";
          break;
        default:
          throw new Error("Unsupported export format");
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      clearInterval(progressInterval);
      setExportProgress(100);
      
      setTimeout(() => {
        toast.success(`Exported ${notesToExport.length} notes successfully!`);
        setIsOpen(false);
        setExportProgress(0);
      }, 500);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export notes");
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case "json":
        return <File className="h-4 w-4" />;
      case "markdown":
        return <FileText className="h-4 w-4" />;
      case "txt":
        return <FileText className="h-4 w-4" />;
      case "csv":
        return <File className="h-4 w-4" />;
      case "html":
        return <Image className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Notes</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Export Format</label>
            <Select
              value={options.format}
              onValueChange={(value: ExportFormat) =>
                setOptions({ ...options, format: value })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    {getFormatIcon("json")}
                    JSON
                  </div>
                </SelectItem>
                <SelectItem value="markdown">
                  <div className="flex items-center gap-2">
                    {getFormatIcon("markdown")}
                    Markdown
                  </div>
                </SelectItem>
                <SelectItem value="txt">
                  <div className="flex items-center gap-2">
                    {getFormatIcon("txt")}
                    Plain Text
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    {getFormatIcon("csv")}
                    CSV
                  </div>
                </SelectItem>
                <SelectItem value="html">
                  <div className="flex items-center gap-2">
                    {getFormatIcon("html")}
                    HTML
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Date Range</label>
            <Select
              value={options.dateRange}
              onValueChange={(value) => setOptions({ ...options, dateRange: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All notes</SelectItem>
                <SelectItem value="week">Last week</SelectItem>
                <SelectItem value="month">Last month</SelectItem>
                <SelectItem value="year">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Include Options</label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="metadata"
                checked={options.includeMetadata}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, includeMetadata: !!checked })
                }
              />
              <label htmlFor="metadata" className="text-sm">
                Metadata (dates, priority, category)
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="tags"
                checked={options.includeTags}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, includeTags: !!checked })
                }
              />
              <label htmlFor="tags" className="text-sm">
                Tags
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="attachments"
                checked={options.includeAttachments}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, includeAttachments: !!checked })
                }
              />
              <label htmlFor="attachments" className="text-sm">
                Attachment references
              </label>
            </div>
          </div>

          {isExporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Exporting...</span>
                <span>{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} className="w-full" />
            </div>
          )}

          <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
            {selectedNotes && selectedNotes.length > 0
              ? `Exporting ${selectedNotes.length} selected notes`
              : `Exporting ${getNotesToExport().length} notes`}
          </div>

          <Button
            onClick={performExport}
            disabled={isExporting}
            className="w-full"
          >
            {isExporting ? "Exporting..." : "Export Notes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
