import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { Note } from "../types/NoteInterface";
import { supabase } from "../../../../supabase/supabase";
import { toast } from "react-hot-toast";

interface NoteImportProps {
  userId: string;
  onNotesImported: (notes: Note[]) => void;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

interface ImportOptions {
  overwriteExisting: boolean;
  preserveIds: boolean;
  importTags: boolean;
  importMetadata: boolean;
}

export function NoteImport({ userId, onNotesImported }: NoteImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [options, setOptions] = useState<ImportOptions>({
    overwriteExisting: false,
    preserveIds: false,
    importTags: true,
    importMetadata: true,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      let data: any[];

      if (file.name.endsWith(".json")) {
        data = JSON.parse(text);
      } else if (file.name.endsWith(".csv")) {
        data = parseCSV(text);
      } else {
        toast.error("Unsupported file format. Please use JSON or CSV.");
        return;
      }

      if (!Array.isArray(data)) {
        toast.error("Invalid file format. Expected an array of notes.");
        return;
      }

      setPreviewData(data.slice(0, 5)); // Show first 5 for preview
      toast.success(`Found ${data.length} notes in file`);
    } catch (error) {
      console.error("Error reading file:", error);
      toast.error("Failed to read file. Please check the format.");
    }
  };

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.replace(/"/g, "").trim());
      const note: any = {};

      headers.forEach((header, index) => {
        if (values[index]) {
          switch (header.toLowerCase()) {
            case "title":
              note.title = values[index];
              break;
            case "content":
              note.content = values[index];
              break;
            case "tags":
              note.tags = values[index]
                .split(";")
                .map((t) => t.trim())
                .filter((t) => t);
              break;
            case "category":
              note.category = values[index];
              break;
            case "priority":
              note.priority = values[index];
              break;
            default:
              note[header] = values[index];
          }
        }
      });

      if (note.title || note.content) {
        data.push(note);
      }
    }

    return data;
  };

  const validateNoteData = (noteData: any): Partial<Note> | null => {
    if (!noteData.title && !noteData.content) {
      return null;
    }

    const note: Partial<Note> = {
      title: noteData.title || "Untitled",
      content: noteData.content || "",
      tags: [],
      user_id: userId,
    };

    if (options.importTags && noteData.tags) {
      if (Array.isArray(noteData.tags)) {
        note.tags = noteData.tags;
      } else if (typeof noteData.tags === "string") {
        note.tags = noteData.tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t);
      }
    }

    if (options.importMetadata) {
      if (noteData.category) note.category = noteData.category;
      if (noteData.priority) note.priority = noteData.priority;
      if (noteData.is_pinned !== undefined)
        note.is_pinned = !!noteData.is_pinned;
      if (noteData.is_locked !== undefined)
        note.is_locked = !!noteData.is_locked;
    }

    if (options.preserveIds && noteData.id) {
      note.id = noteData.id;
    }

    return note;
  };

  const performImport = async () => {
    if (previewData.length === 0) {
      toast.error("No data to import. Please select a file first.");
      return;
    }

    setIsImporting(true);
    setImportProgress(0);
    setImportResult(null);

    try {
      const result: ImportResult = {
        success: 0,
        failed: 0,
        errors: [],
      };

      // Get full data from file input
      const file = fileInputRef.current?.files?.[0];
      if (!file) {
        toast.error("Please select a file to import.");
        return;
      }

      const text = await file.text();
      let allData: any[];

      if (file.name.endsWith(".json")) {
        allData = JSON.parse(text);
      } else {
        allData = parseCSV(text);
      }

      const totalNotes = allData.length;
      const importedNotes: Note[] = [];

      for (let i = 0; i < totalNotes; i++) {
        try {
          const noteData = validateNoteData(allData[i]);
          if (!noteData) {
            result.failed++;
            result.errors.push(`Note ${i + 1}: Invalid data`);
            continue;
          }

          // Check if note exists (if preserving IDs)
          let existingNote = null;
          if (options.preserveIds && noteData.id) {
            const { data } = await supabase
              .from("notes")
              .select("id")
              .eq("id", noteData.id)
              .eq("user_id", userId)
              .single();
            existingNote = data;
          }

          if (existingNote && !options.overwriteExisting) {
            result.failed++;
            result.errors.push(
              `Note ${i + 1}: Already exists (ID: ${noteData.id})`,
            );
            continue;
          }

          let savedNote;
          if (existingNote && options.overwriteExisting) {
            // Update existing note
            const { data, error } = await supabase
              .from("notes")
              .update(noteData)
              .eq("id", noteData.id)
              .eq("user_id", userId)
              .select()
              .single();

            if (error) throw error;
            savedNote = data;
          } else {
            // Insert new note
            const { data, error } = await supabase
              .from("notes")
              .insert(noteData)
              .select()
              .single();

            if (error) throw error;
            savedNote = data;
          }

          importedNotes.push(savedNote);
          result.success++;
        } catch (error) {
          result.failed++;
          result.errors.push(
            `Note ${i + 1}: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }

        // Update progress
        setImportProgress(Math.round(((i + 1) / totalNotes) * 100));
      }

      setImportResult(result);

      if (result.success > 0) {
        onNotesImported(importedNotes);
        toast.success(`Successfully imported ${result.success} notes!`);
      }

      if (result.failed > 0) {
        toast.error(
          `Failed to import ${result.failed} notes. Check the results for details.`,
        );
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import notes");
    } finally {
      setIsImporting(false);
    }
  };

  const resetImport = () => {
    setPreviewData([]);
    setImportResult(null);
    setImportProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetImport();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Notes</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!importResult && (
            <>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full h-20 border-dashed"
                >
                  <div className="text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">Click to select file</p>
                    <p className="text-xs text-gray-500">
                      Supports JSON and CSV files
                    </p>
                  </div>
                </Button>
              </div>

              {previewData.length > 0 && (
                <>
                  <div className="space-y-3">
                    <h4 className="font-medium">Import Options</h4>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="overwrite"
                        checked={options.overwriteExisting}
                        onCheckedChange={(checked) =>
                          setOptions({
                            ...options,
                            overwriteExisting: !!checked,
                          })
                        }
                      />
                      <label htmlFor="overwrite" className="text-sm">
                        Overwrite existing notes (if IDs match)
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="preserve-ids"
                        checked={options.preserveIds}
                        onCheckedChange={(checked) =>
                          setOptions({ ...options, preserveIds: !!checked })
                        }
                      />
                      <label htmlFor="preserve-ids" className="text-sm">
                        Preserve original note IDs
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="import-tags"
                        checked={options.importTags}
                        onCheckedChange={(checked) =>
                          setOptions({ ...options, importTags: !!checked })
                        }
                      />
                      <label htmlFor="import-tags" className="text-sm">
                        Import tags
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="import-metadata"
                        checked={options.importMetadata}
                        onCheckedChange={(checked) =>
                          setOptions({ ...options, importMetadata: !!checked })
                        }
                      />
                      <label htmlFor="import-metadata" className="text-sm">
                        Import metadata (category, priority, etc.)
                      </label>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">
                      Preview (first 5 notes)
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {previewData.map((note, index) => (
                        <div
                          key={index}
                          className="p-2 bg-gray-50 rounded text-sm"
                        >
                          <div className="font-medium">
                            {note.title || "Untitled"}
                          </div>
                          <div className="text-gray-600 truncate">
                            {note.content
                              ? note.content.substring(0, 100) + "..."
                              : "No content"}
                          </div>
                          {note.tags && (
                            <div className="text-xs text-blue-600">
                              Tags:{" "}
                              {Array.isArray(note.tags)
                                ? note.tags.join(", ")
                                : note.tags}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {isImporting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Importing notes...</span>
                    <span>{importProgress}%</span>
                  </div>
                  <Progress value={importProgress} className="w-full" />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={performImport}
                  disabled={previewData.length === 0 || isImporting}
                  className="flex-1"
                >
                  {isImporting
                    ? "Importing..."
                    : `Import ${previewData.length > 0 ? previewData.length : ""} Notes`}
                </Button>
                <Button variant="outline" onClick={resetImport}>
                  Reset
                </Button>
              </div>
            </>
          )}

          {importResult && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <h4 className="font-medium">Import Complete</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-green-50 rounded">
                    <div className="font-medium text-green-800">Successful</div>
                    <div className="text-2xl font-bold text-green-600">
                      {importResult.success}
                    </div>
                  </div>
                  <div className="p-3 bg-red-50 rounded">
                    <div className="font-medium text-red-800">Failed</div>
                    <div className="text-2xl font-bold text-red-600">
                      {importResult.failed}
                    </div>
                  </div>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div>
                  <h5 className="font-medium mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    Errors
                  </h5>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {importResult.errors.map((error, index) => (
                      <div
                        key={index}
                        className="text-xs text-red-600 bg-red-50 p-2 rounded"
                      >
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={() => setIsOpen(false)} className="w-full">
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
