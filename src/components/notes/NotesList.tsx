import { Note } from "./NotesApp";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NotesListProps {
  notes: Note[];
  selectedNote: Note | null;
  onSelectNote: (note: Note) => void;
  viewMode?: "list" | "grid";
  favoriteNotes?: string[];
  archivedNotes?: string[];
  onToggleFavorite?: (noteId: string) => void;
  onToggleArchive?: (noteId: string) => void;
  darkMode?: boolean;
}

export function NotesList({
  notes,
  selectedNote,
  onSelectNote,
  viewMode = "list",
  favoriteNotes = [],
  archivedNotes = [],
  onToggleFavorite,
  onToggleArchive,
  darkMode = false,
}: NotesListProps) {
  if (notes.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <div className="text-4xl mb-2">📝</div>
        <p>No notes found</p>
        <p className="text-sm mt-1">Create your first note to get started</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {notes.map((note) => {
        const isSelected = selectedNote?.id === note.id;
        const preview = note.content.replace(/[#*`]/g, "").substring(0, 100);

        return (
          <div
            key={note.id}
            onClick={() => onSelectNote(note)}
            className={cn(
              "p-4 cursor-pointer hover:bg-gray-50 transition-colors",
              isSelected && "bg-blue-50 border-r-2 border-blue-500",
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <h3
                className={cn(
                  "font-medium text-sm truncate flex-1 mr-2",
                  isSelected ? "text-blue-900" : "text-gray-900",
                )}
              >
                {note.title || "Untitled"}
              </h3>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {formatDistanceToNow(new Date(note.updated_at), {
                  addSuffix: true,
                })}
              </span>
            </div>

            {preview && (
              <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                {preview}...
              </p>
            )}

            {note.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {note.tags.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs px-2 py-0 h-5"
                  >
                    {tag}
                  </Badge>
                ))}
                {note.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs px-2 py-0 h-5">
                    +{note.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
