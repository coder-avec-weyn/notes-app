import { useState, useEffect, useRef } from "react";
import { Note } from "./NotesApp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, Tag, Eye, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

interface NoteEditorProps {
  note: Note;
  onUpdateNote: (noteId: string, updates: Partial<Note>) => void;
  onDeleteNote: (noteId: string) => void;
  isFavorite?: boolean;
  isArchived?: boolean;
  onToggleFavorite?: () => void;
  onToggleArchive?: () => void;
  darkMode?: boolean;
}

export function NoteEditor({
  note,
  onUpdateNote,
  onDeleteNote,
  isFavorite = false,
  isArchived = false,
  onToggleFavorite,
  onToggleArchive,
  darkMode = false,
}: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [tags, setTags] = useState<string[]>(note.tags);
  const [newTag, setNewTag] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const { toast } = useToast();
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Update local state when note changes
  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setTags(note.tags);
  }, [note]);

  // Auto-save functionality
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (
        title !== note.title ||
        content !== note.content ||
        JSON.stringify(tags) !== JSON.stringify(note.tags)
      ) {
        onUpdateNote(note.id, { title, content, tags });
      }
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, content, tags, note, onUpdateNote]);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      onDeleteNote(note.id);
      toast({
        title: "Note deleted",
        description: "The note has been permanently deleted.",
      });
    }
  };

  const renderMarkdown = (text: string) => {
    return text
      .replace(
        /^### (.*$)/gim,
        '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>',
      )
      .replace(
        /^## (.*$)/gim,
        '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>',
      )
      .replace(
        /^# (.*$)/gim,
        '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>',
      )
      .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>')
      .replace(
        /`(.*?)`/gim,
        '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>',
      )
      .replace(/\n/gim, "<br>");
  };

  return (
    <div
      className={`flex-1 flex flex-col ${darkMode ? "bg-gray-900" : "bg-white"}`}
    >
      {/* Editor Header */}
      <div className="border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={isPreview ? "outline" : "default"}
            size="sm"
            onClick={() => setIsPreview(false)}
          >
            <Edit3 className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant={isPreview ? "default" : "outline"}
            size="sm"
            onClick={() => setIsPreview(true)}
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
        </div>

        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </div>

      {/* Title */}
      <div className="p-4 border-b border-gray-100">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title..."
          className="text-xl font-semibold border-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>

      {/* Tags */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <Tag className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Tags</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer hover:bg-red-100"
              onClick={() => handleRemoveTag(tag)}
            >
              {tag} ×
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
            placeholder="Add a tag..."
            className="flex-1"
          />
          <Button onClick={handleAddTag} size="sm">
            Add
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        {isPreview ? (
          <div
            className="prose max-w-none h-full overflow-auto"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        ) : (
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing your note... (Supports Markdown)"
            className="h-full resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-sm"
          />
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 p-2 text-xs text-gray-500 text-center">
        Last updated: {new Date(note.updated_at).toLocaleString()}
      </div>
    </div>
  );
}
