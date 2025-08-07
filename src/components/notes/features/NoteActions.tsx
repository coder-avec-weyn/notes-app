import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Copy, Archive, Star, Trash2, Pin, Lock } from "lucide-react";
import { Note } from "../types/NoteInterface";
import { supabase } from "../../../../supabase/supabase";
import { toast } from "react-hot-toast";
import { validateNote } from "../utils/NoteUtils";

interface NoteActionsProps {
  userId: string;
  selectedNote?: Note | null;
  onNoteCreated: (note: Note) => void;
  onNoteDeleted: (noteId: string) => void;
  onNoteUpdated: (note: Note) => void;
}

export function NoteActions({
  userId,
  selectedNote,
  onNoteCreated,
  onNoteDeleted,
  onNoteUpdated,
}: NoteActionsProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const createNewNote = async () => {
    if (isCreating) return; // Prevent duplicate creation

    setIsCreating(true);
    try {
      const newNote = {
        title: "Untitled Note",
        content: "",
        tags: [],
        user_id: userId,
      };

      const errors = validateNote(newNote);
      if (errors.length > 0) {
        toast.error(errors.join(", "));
        return;
      }

      const { data, error } = await supabase
        .from("notes")
        .insert(newNote)
        .select()
        .single();

      if (error) throw error;

      onNoteCreated(data);
      toast.success("New note created! 🎉");
    } catch (error) {
      console.error("Error creating note:", error);
      toast.error("Failed to create note");
    } finally {
      setIsCreating(false);
    }
  };

  const duplicateNote = async () => {
    if (!selectedNote) return;

    try {
      const duplicatedNote = {
        title: `${selectedNote.title} (Copy)`,
        content: selectedNote.content,
        tags: [...selectedNote.tags],
        user_id: userId,
      };

      const { data, error } = await supabase
        .from("notes")
        .insert(duplicatedNote)
        .select()
        .single();

      if (error) throw error;

      onNoteCreated(data);
      toast.success("Note duplicated successfully!");
    } catch (error) {
      console.error("Error duplicating note:", error);
      toast.error("Failed to duplicate note");
    }
  };

  const deleteNote = async () => {
    if (!selectedNote || isDeleting) return;

    if (!window.confirm("Are you sure you want to delete this note?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", selectedNote.id);

      if (error) throw error;

      onNoteDeleted(selectedNote.id);
      toast.success("Note deleted successfully");
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
    } finally {
      setIsDeleting(false);
    }
  };

  const togglePin = async () => {
    if (!selectedNote) return;

    try {
      const updatedNote = {
        ...selectedNote,
        is_pinned: !selectedNote.is_pinned,
      };

      const { error } = await supabase
        .from("notes")
        .update({ is_pinned: updatedNote.is_pinned })
        .eq("id", selectedNote.id);

      if (error) throw error;

      onNoteUpdated(updatedNote);
      toast.success(updatedNote.is_pinned ? "Note pinned" : "Note unpinned");
    } catch (error) {
      console.error("Error toggling pin:", error);
      toast.error("Failed to update note");
    }
  };

  const toggleLock = async () => {
    if (!selectedNote) return;

    try {
      const updatedNote = {
        ...selectedNote,
        is_locked: !selectedNote.is_locked,
      };

      const { error } = await supabase
        .from("notes")
        .update({ is_locked: updatedNote.is_locked })
        .eq("id", selectedNote.id);

      if (error) throw error;

      onNoteUpdated(updatedNote);
      toast.success(updatedNote.is_locked ? "Note locked" : "Note unlocked");
    } catch (error) {
      console.error("Error toggling lock:", error);
      toast.error("Failed to update note");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={createNewNote}
        disabled={isCreating}
        size="sm"
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
      >
        <Plus className="h-4 w-4 mr-2" />
        {isCreating ? "Creating..." : "New Note"}
      </Button>

      {selectedNote && (
        <>
          <Button onClick={duplicateNote} variant="outline" size="sm">
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </Button>

          <Button
            onClick={togglePin}
            variant={selectedNote.is_pinned ? "default" : "outline"}
            size="sm"
          >
            <Pin
              className={`h-4 w-4 mr-2 ${selectedNote.is_pinned ? "fill-current" : ""}`}
            />
            {selectedNote.is_pinned ? "Unpin" : "Pin"}
          </Button>

          <Button
            onClick={toggleLock}
            variant={selectedNote.is_locked ? "default" : "outline"}
            size="sm"
          >
            <Lock className="h-4 w-4 mr-2" />
            {selectedNote.is_locked ? "Unlock" : "Lock"}
          </Button>

          <Button
            onClick={deleteNote}
            disabled={isDeleting}
            variant="destructive"
            size="sm"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </>
      )}
    </div>
  );
}
