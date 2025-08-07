import { useState, useEffect } from "react";
import { supabase } from "../../../supabase/supabase";
import { useAuth } from "../../../supabase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  LogOut,
  User,
  Moon,
  Sun,
  Settings,
  Download,
  Upload,
  Archive,
  Star,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Zap,
  Bell,
  Share2,
  Lock,
  Unlock,
  Calendar,
  Clock,
  Bookmark,
  Heart,
  MessageSquare,
  FileText,
  Folder,
  Tag as TagIcon,
  Palette,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { NotesList } from "./NotesList";
import { NoteEditor } from "./NoteEditor";
import { TagFilter } from "./TagFilter";
import { LoadingScreen } from "@/components/ui/loading-spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "react-hot-toast";
import confetti from "react-confetti";

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  user_id: string;
  created_at: string;
  updated_at: string;
}

export default function NotesApp() {
  const { user, signOut } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortBy, setSortBy] = useState<"updated" | "created" | "title">(
    "updated",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [favoriteNotes, setFavoriteNotes] = useState<string[]>([]);
  const [archivedNotes, setArchivedNotes] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // Keyboard shortcuts
  useHotkeys("ctrl+n, cmd+n", (e) => {
    e.preventDefault();
    createNewNote();
  });

  useHotkeys("ctrl+f, cmd+f", (e) => {
    e.preventDefault();
    document.getElementById("search-input")?.focus();
  });

  useHotkeys("ctrl+b, cmd+b", (e) => {
    e.preventDefault();
    setSidebarCollapsed(!sidebarCollapsed);
  });

  useHotkeys("f11", (e) => {
    e.preventDefault();
    setIsFullscreen(!isFullscreen);
  });

  // Load notes on component mount
  useEffect(() => {
    if (user) {
      loadNotes();
      setupRealtimeSubscription();
      loadUserPreferences();
    }
  }, [user]);

  // Update all tags when notes change
  useEffect(() => {
    const tags = new Set<string>();
    notes.forEach((note) => {
      note.tags.forEach((tag) => tags.add(tag));
    });
    setAllTags(Array.from(tags).sort());
  }, [notes]);

  const loadNotes = async () => {
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user?.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error("Error loading notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel("notes_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notes",
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setNotes((prev) => [payload.new as Note, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setNotes((prev) =>
              prev.map((note) =>
                note.id === payload.new.id ? (payload.new as Note) : note,
              ),
            );
            if (selectedNote?.id === payload.new.id) {
              setSelectedNote(payload.new as Note);
            }
          } else if (payload.eventType === "DELETE") {
            setNotes((prev) =>
              prev.filter((note) => note.id !== payload.old.id),
            );
            if (selectedNote?.id === payload.old.id) {
              setSelectedNote(null);
            }
          }
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const loadUserPreferences = () => {
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    const savedSidebarCollapsed =
      localStorage.getItem("sidebarCollapsed") === "true";
    const savedViewMode =
      (localStorage.getItem("viewMode") as "list" | "grid") || "list";
    const savedFavorites = JSON.parse(
      localStorage.getItem("favoriteNotes") || "[]",
    );
    const savedArchived = JSON.parse(
      localStorage.getItem("archivedNotes") || "[]",
    );

    setDarkMode(savedDarkMode);
    setSidebarCollapsed(savedSidebarCollapsed);
    setViewMode(savedViewMode);
    setFavoriteNotes(savedFavorites);
    setArchivedNotes(savedArchived);
  };

  const createNewNote = async () => {
    try {
      const { data, error } = await supabase
        .from("notes")
        .insert({
          title: "Untitled Note",
          content: "",
          tags: [],
          user_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      setSelectedNote(data);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      toast.success("New note created! 🎉");
    } catch (error) {
      console.error("Error creating note:", error);
      toast.error("Failed to create note");
    }
  };

  const toggleFavorite = (noteId: string) => {
    const newFavorites = favoriteNotes.includes(noteId)
      ? favoriteNotes.filter((id) => id !== noteId)
      : [...favoriteNotes, noteId];
    setFavoriteNotes(newFavorites);
    localStorage.setItem("favoriteNotes", JSON.stringify(newFavorites));
    toast.success(
      favoriteNotes.includes(noteId)
        ? "Removed from favorites"
        : "Added to favorites",
    );
  };

  const toggleArchive = (noteId: string) => {
    const newArchived = archivedNotes.includes(noteId)
      ? archivedNotes.filter((id) => id !== noteId)
      : [...archivedNotes, noteId];
    setArchivedNotes(newArchived);
    localStorage.setItem("archivedNotes", JSON.stringify(newArchived));
    toast.success(
      archivedNotes.includes(noteId) ? "Unarchived note" : "Archived note",
    );
  };

  const exportNotes = () => {
    const dataStr = JSON.stringify(notes, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = "notes-export.json";
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
    toast.success("Notes exported successfully!");
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("darkMode", newDarkMode.toString());
    document.documentElement.classList.toggle("dark", newDarkMode);
  };

  const toggleSidebar = () => {
    const newCollapsed = !sidebarCollapsed;
    setSidebarCollapsed(newCollapsed);
    localStorage.setItem("sidebarCollapsed", newCollapsed.toString());
  };

  const toggleViewMode = () => {
    const newViewMode = viewMode === "list" ? "grid" : "list";
    setViewMode(newViewMode);
    localStorage.setItem("viewMode", newViewMode);
  };

  const updateNote = async (noteId: string, updates: Partial<Note>) => {
    try {
      const { error } = await supabase
        .from("notes")
        .update(updates)
        .eq("id", noteId);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating note:", error);
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase.from("notes").delete().eq("id", noteId);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const filteredNotes = notes
    .filter((note) => {
      const matchesSearch =
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.some((tag) => note.tags.includes(tag));
      const matchesArchived = showArchived
        ? archivedNotes.includes(note.id)
        : !archivedNotes.includes(note.id);
      const matchesFavorites = showFavorites
        ? favoriteNotes.includes(note.id)
        : true;
      return (
        matchesSearch && matchesTags && matchesArchived && matchesFavorites
      );
    })
    .sort((a, b) => {
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
        default:
          comparison =
            new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  if (loading) {
    return <LoadingScreen text="Loading your notes..." />;
  }

  return (
    <div
      className={`h-screen ${darkMode ? "dark bg-gray-900" : "bg-gray-50"} flex flex-col transition-colors duration-300 ${isFullscreen ? "fixed inset-0 z-50" : ""}`}
    >
      {showConfetti && (
        <confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
        />
      )}

      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border-b px-6 py-4 flex items-center justify-between transition-colors duration-300`}
      >
        <div className="flex items-center gap-4">
          <motion.h1
            className={`text-2xl font-semibold ${darkMode ? "text-white" : "text-gray-900"} transition-colors duration-300`}
            whileHover={{ scale: 1.05 }}
          >
            Personal Notes
          </motion.h1>
          <Badge variant="secondary" className="text-xs">
            {filteredNotes.length} notes
          </Badge>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={createNewNote}
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
          </motion.div>
          <Button
            onClick={toggleSidebar}
            variant="ghost"
            size="sm"
            className={darkMode ? "text-gray-300 hover:text-white" : ""}
          >
            {sidebarCollapsed ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minimize2 className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowFavorites(!showFavorites)}
              variant={showFavorites ? "default" : "ghost"}
              size="sm"
              className={darkMode ? "text-gray-300" : ""}
            >
              <Star
                className={`h-4 w-4 ${showFavorites ? "fill-current" : ""}`}
              />
            </Button>
            <Button
              onClick={() => setShowArchived(!showArchived)}
              variant={showArchived ? "default" : "ghost"}
              size="sm"
              className={darkMode ? "text-gray-300" : ""}
            >
              <Archive className="h-4 w-4" />
            </Button>
            <Button
              onClick={toggleViewMode}
              variant="ghost"
              size="sm"
              className={darkMode ? "text-gray-300" : ""}
            >
              {viewMode === "list" ? (
                <Grid className="h-4 w-4" />
              ) : (
                <List className="h-4 w-4" />
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={darkMode ? "text-gray-300" : ""}
                >
                  {sortOrder === "asc" ? (
                    <SortAsc className="h-4 w-4" />
                  ) : (
                    <SortDesc className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSortBy("updated")}>
                  <Clock className="mr-2 h-4 w-4" />
                  Last Updated
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("created")}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Date Created
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("title")}>
                  <FileText className="mr-2 h-4 w-4" />
                  Title
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                >
                  {sortOrder === "asc" ? (
                    <SortDesc className="mr-2 h-4 w-4" />
                  ) : (
                    <SortAsc className="mr-2 h-4 w-4" />
                  )}
                  {sortOrder === "asc" ? "Descending" : "Ascending"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              id="search-input"
              placeholder="Search notes... (Ctrl+F)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-9 w-64 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : ""}`}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={toggleDarkMode}
              variant="ghost"
              size="sm"
              className={darkMode ? "text-gray-300" : ""}
            >
              {darkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={darkMode ? "text-gray-300" : ""}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={exportNotes}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Notes
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? (
                    <Minimize2 className="mr-2 h-4 w-4" />
                  ) : (
                    <Maximize2 className="mr-2 h-4 w-4" />
                  )}
                  {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                  {notificationCount > 0 && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      {notificationCount}
                    </Badge>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div whileHover={{ scale: 1.1 }}>
                  <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-blue-500 ring-offset-2">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
                      alt={user?.email || ""}
                    />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                      {user?.email?.[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="font-medium">
                  {user?.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`w-80 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border-r flex flex-col transition-colors duration-300`}
            >
              <div
                className={`p-4 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}
              >
                <TagFilter
                  allTags={allTags}
                  selectedTags={selectedTags}
                  onTagsChange={setSelectedTags}
                  darkMode={darkMode}
                />
              </div>
              <div className="flex-1 overflow-auto">
                <NotesList
                  notes={filteredNotes}
                  selectedNote={selectedNote}
                  onSelectNote={setSelectedNote}
                  viewMode={viewMode}
                  favoriteNotes={favoriteNotes}
                  archivedNotes={archivedNotes}
                  onToggleFavorite={toggleFavorite}
                  onToggleArchive={toggleArchive}
                  darkMode={darkMode}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <motion.div
          className="flex-1 flex flex-col"
          animate={{ marginLeft: sidebarCollapsed ? 0 : 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
        >
          <AnimatePresence mode="wait">
            {selectedNote ? (
              <motion.div
                key={selectedNote.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col"
              >
                <NoteEditor
                  note={selectedNote}
                  onUpdateNote={updateNote}
                  onDeleteNote={deleteNote}
                  isFavorite={favoriteNotes.includes(selectedNote.id)}
                  isArchived={archivedNotes.includes(selectedNote.id)}
                  onToggleFavorite={() => toggleFavorite(selectedNote.id)}
                  onToggleArchive={() => toggleArchive(selectedNote.id)}
                  darkMode={darkMode}
                />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`flex-1 flex items-center justify-center ${darkMode ? "bg-gray-900" : "bg-gray-50"} transition-colors duration-300`}
              >
                <div className="text-center max-w-md">
                  <motion.div
                    className="text-6xl mb-4"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3,
                    }}
                  >
                    📝
                  </motion.div>
                  <h2
                    className={`text-xl font-medium ${darkMode ? "text-white" : "text-gray-900"} mb-2`}
                  >
                    {notes.length === 0
                      ? "Welcome to Personal Notes!"
                      : "Select a note to start editing"}
                  </h2>
                  <p
                    className={`${darkMode ? "text-gray-400" : "text-gray-500"} mb-6`}
                  >
                    {notes.length === 0
                      ? "Create your first note to get started with organizing your thoughts"
                      : "Choose a note from the sidebar or create a new one"}
                  </p>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={createNewNote}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                      size="lg"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      {notes.length === 0
                        ? "Create your first note"
                        : "Create new note"}
                    </Button>
                  </motion.div>
                  <div className="mt-8 text-sm text-gray-400">
                    <p>
                      💡 Tip: Use{" "}
                      <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                        Ctrl+N
                      </kbd>{" "}
                      to create a new note
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
