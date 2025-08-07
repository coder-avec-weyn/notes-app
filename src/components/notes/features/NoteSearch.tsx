import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X, Calendar } from "lucide-react";
import { Note } from "../types/NoteInterface";

interface NoteSearchProps {
  notes: Note[];
  onSearchResults: (results: Note[]) => void;
  darkMode?: boolean;
}

interface SearchFilters {
  query: string;
  category: string;
  priority: string;
  dateRange: string;
  hasAttachments: boolean;
  isLocked: boolean;
  isPinned: boolean;
}

export function NoteSearch({
  notes,
  onSearchResults,
  darkMode = false,
}: NoteSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    category: "",
    priority: "",
    dateRange: "",
    hasAttachments: false,
    isLocked: false,
    isPinned: false,
  });

  const performSearch = () => {
    let results = [...notes];

    // Text search
    if (filters.query.trim()) {
      const query = filters.query.toLowerCase();
      results = results.filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query) ||
          note.tags.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    // Category filter
    if (filters.category) {
      results = results.filter((note) => note.category === filters.category);
    }

    // Priority filter
    if (filters.priority) {
      results = results.filter((note) => note.priority === filters.priority);
    }

    // Date range filter
    if (filters.dateRange) {
      const now = new Date();
      let startDate: Date;

      switch (filters.dateRange) {
        case "today":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
          );
          break;
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

      results = results.filter(
        (note) => new Date(note.updated_at) >= startDate,
      );
    }

    // Attachment filter
    if (filters.hasAttachments) {
      results = results.filter(
        (note) => note.attachments && note.attachments.length > 0,
      );
    }

    // Locked filter
    if (filters.isLocked) {
      results = results.filter((note) => note.is_locked);
    }

    // Pinned filter
    if (filters.isPinned) {
      results = results.filter((note) => note.is_pinned);
    }

    onSearchResults(results);
    setIsOpen(false);
  };

  const clearFilters = () => {
    setFilters({
      query: "",
      category: "",
      priority: "",
      dateRange: "",
      hasAttachments: false,
      isLocked: false,
      isPinned: false,
    });
    onSearchResults(notes);
  };

  const activeFiltersCount = Object.values(filters).filter(
    (value) => value !== "" && value !== false,
  ).length;

  return (
    <>
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search notes..."
          value={filters.query}
          onChange={(e) => {
            setFilters({ ...filters, query: e.target.value });
            if (e.target.value === "") {
              onSearchResults(notes);
            }
          }}
          onKeyPress={(e) => e.key === "Enter" && performSearch()}
          className={`pl-9 pr-12 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : ""}`}
        />
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-8 w-8 p-0"
            >
              <Filter className="h-4 w-4" />
              {activeFiltersCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Advanced Search</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Search Query</label>
                <Input
                  value={filters.query}
                  onChange={(e) =>
                    setFilters({ ...filters, query: e.target.value })
                  }
                  placeholder="Search in title, content, and tags..."
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={filters.category}
                  onValueChange={(value) =>
                    setFilters({ ...filters, category: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Any category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any category</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="ideas">Ideas</SelectItem>
                    <SelectItem value="projects">Projects</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={filters.priority}
                  onValueChange={(value) =>
                    setFilters({ ...filters, priority: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Any priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any priority</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Date Range</label>
                <Select
                  value={filters.dateRange}
                  onValueChange={(value) =>
                    setFilters({ ...filters, dateRange: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Any time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This week</SelectItem>
                    <SelectItem value="month">This month</SelectItem>
                    <SelectItem value="year">This year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Additional Filters
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={filters.hasAttachments ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setFilters({
                        ...filters,
                        hasAttachments: !filters.hasAttachments,
                      })
                    }
                  >
                    Has Attachments
                  </Button>
                  <Button
                    variant={filters.isLocked ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setFilters({ ...filters, isLocked: !filters.isLocked })
                    }
                  >
                    Locked
                  </Button>
                  <Button
                    variant={filters.isPinned ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setFilters({ ...filters, isPinned: !filters.isPinned })
                    }
                  >
                    Pinned
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={performSearch} className="flex-1">
                  Search
                </Button>
                <Button variant="outline" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
