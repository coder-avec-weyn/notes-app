import { Note } from "../types/NoteInterface";

export const calculateWordCount = (content: string): number => {
  return content
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
};

export const calculateReadingTime = (content: string): number => {
  const wordsPerMinute = 200;
  const wordCount = calculateWordCount(content);
  return Math.ceil(wordCount / wordsPerMinute);
};

export const generateNoteId = (): string => {
  return crypto.randomUUID();
};

export const formatNoteDate = (date: string): string => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const extractHashtags = (content: string): string[] => {
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
  const matches = content.match(hashtagRegex);
  return matches ? matches.map((tag) => tag.substring(1)) : [];
};

export const extractMentions = (content: string): string[] => {
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const matches = content.match(mentionRegex);
  return matches ? matches.map((mention) => mention.substring(1)) : [];
};

export const sanitizeNoteContent = (content: string): string => {
  return content
    .replace(/<script[^>]*>.*?<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .trim();
};

export const createNotePreview = (
  content: string,
  maxLength: number = 100,
): string => {
  const sanitized = sanitizeNoteContent(content);
  return sanitized.length > maxLength
    ? sanitized.substring(0, maxLength) + "..."
    : sanitized;
};

export const validateNote = (note: Partial<Note>): string[] => {
  const errors: string[] = [];

  if (!note.title || note.title.trim().length === 0) {
    errors.push("Title is required");
  }

  if (note.title && note.title.length > 200) {
    errors.push("Title must be less than 200 characters");
  }

  if (note.content && note.content.length > 50000) {
    errors.push("Content must be less than 50,000 characters");
  }

  return errors;
};

export const searchNotes = (notes: Note[], query: string): Note[] => {
  if (!query.trim()) return notes;

  const searchTerm = query.toLowerCase();
  return notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchTerm) ||
      note.content.toLowerCase().includes(searchTerm) ||
      note.tags.some((tag) => tag.toLowerCase().includes(searchTerm)),
  );
};

export const sortNotes = (
  notes: Note[],
  sortBy: string,
  sortOrder: "asc" | "desc",
): Note[] => {
  return [...notes].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "title":
        comparison = a.title.localeCompare(b.title);
        break;
      case "created":
        comparison =
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case "updated":
        comparison =
          new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        break;
      case "priority":
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority || "low"];
        const bPriority = priorityOrder[b.priority || "low"];
        comparison = aPriority - bPriority;
        break;
      default:
        comparison =
          new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });
};
