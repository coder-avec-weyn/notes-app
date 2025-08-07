export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  user_id: string;
  created_at: string;
  updated_at: string;
  color?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  category?: string;
  reminder_date?: string;
  is_pinned?: boolean;
  is_locked?: boolean;
  word_count?: number;
  reading_time?: number;
  template_id?: string;
  collaborators?: string[];
  version?: number;
  parent_id?: string;
  attachments?: string[];
  location?: { lat: number; lng: number; name: string };
  mood?: string;
  weather?: string;
  music?: string;
  voice_note?: string;
  drawing?: string;
  checklist?: { id: string; text: string; completed: boolean }[];
  links?: { url: string; title: string; description: string }[];
  mentions?: string[];
  hashtags?: string[];
  encryption_key?: string;
  backup_count?: number;
  sync_status?: "synced" | "pending" | "error";
  offline_changes?: boolean;
  ai_summary?: string;
  sentiment_score?: number;
  readability_score?: number;
  language?: string;
  translation?: { [key: string]: string };
  custom_fields?: { [key: string]: any };
}

export interface NoteTemplate {
  id: string;
  name: string;
  content: string;
  tags: string[];
  category?: string;
  icon?: string;
}

export interface NoteFilter {
  searchQuery: string;
  selectedTags: string[];
  category?: string;
  priority?: string;
  dateRange?: { start: Date; end: Date };
  showArchived: boolean;
  showFavorites: boolean;
}

export interface NoteSortOptions {
  sortBy: "updated" | "created" | "title" | "priority";
  sortOrder: "asc" | "desc";
}
