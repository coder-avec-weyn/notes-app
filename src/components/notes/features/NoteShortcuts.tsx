import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Keyboard, Zap, Search, Plus, Save, Edit, Trash2 } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "react-hot-toast";

interface NoteShortcutsProps {
  onNewNote: () => void;
  onSearch: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  onTogglePreview?: () => void;
  onToggleSidebar?: () => void;
  darkMode?: boolean;
}

interface Shortcut {
  id: string;
  name: string;
  description: string;
  keys: string[];
  category: string;
  action: () => void;
  icon: React.ReactNode;
}

export function NoteShortcuts({
  onNewNote,
  onSearch,
  onSave,
  onDelete,
  onTogglePreview,
  onToggleSidebar,
  darkMode = false,
}: NoteShortcutsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [customShortcuts, setCustomShortcuts] = useState<
    Record<string, string>
  >({});

  // Load custom shortcuts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("noteShortcuts");
    if (saved) {
      try {
        setCustomShortcuts(JSON.parse(saved));
      } catch (error) {
        console.error("Failed to load custom shortcuts:", error);
      }
    }
  }, []);

  // Save custom shortcuts to localStorage
  const saveCustomShortcuts = (shortcuts: Record<string, string>) => {
    setCustomShortcuts(shortcuts);
    localStorage.setItem("noteShortcuts", JSON.stringify(shortcuts));
  };

  const shortcuts: Shortcut[] = [
    {
      id: "new-note",
      name: "New Note",
      description: "Create a new note",
      keys: ["Ctrl", "N"],
      category: "General",
      action: onNewNote,
      icon: <Plus className="h-4 w-4" />,
    },
    {
      id: "search",
      name: "Search",
      description: "Focus search input",
      keys: ["Ctrl", "F"],
      category: "General",
      action: onSearch,
      icon: <Search className="h-4 w-4" />,
    },
    {
      id: "save",
      name: "Save Note",
      description: "Save current note",
      keys: ["Ctrl", "S"],
      category: "Editor",
      action: onSave || (() => toast.success("Note saved!")),
      icon: <Save className="h-4 w-4" />,
    },
    {
      id: "delete",
      name: "Delete Note",
      description: "Delete current note",
      keys: ["Ctrl", "D"],
      category: "Editor",
      action: onDelete || (() => {}),
      icon: <Trash2 className="h-4 w-4" />,
    },
    {
      id: "preview",
      name: "Toggle Preview",
      description: "Switch between edit and preview mode",
      keys: ["Ctrl", "P"],
      category: "Editor",
      action: onTogglePreview || (() => {}),
      icon: <Edit className="h-4 w-4" />,
    },
    {
      id: "sidebar",
      name: "Toggle Sidebar",
      description: "Show/hide the sidebar",
      keys: ["Ctrl", "B"],
      category: "Navigation",
      action: onToggleSidebar || (() => {}),
      icon: <Keyboard className="h-4 w-4" />,
    },
    {
      id: "shortcuts",
      name: "Show Shortcuts",
      description: "Open this shortcuts dialog",
      keys: ["Ctrl", "?"],
      category: "Help",
      action: () => setIsOpen(true),
      icon: <Zap className="h-4 w-4" />,
    },
  ];

  // Register all shortcuts
  shortcuts.forEach((shortcut) => {
    const customKey = customShortcuts[shortcut.id];
    const keyCombo =
      customKey ||
      shortcut.keys.join("+").toLowerCase().replace("ctrl", "ctrl");

    useHotkeys(
      keyCombo,
      (e) => {
        e.preventDefault();
        shortcut.action();
      },
      {
        enableOnFormTags: ["INPUT", "TEXTAREA"],
      },
    );
  });

  // Additional helpful shortcuts
  useHotkeys("escape", () => {
    if (isOpen) {
      setIsOpen(false);
    }
  });

  useHotkeys("ctrl+shift+n", (e) => {
    e.preventDefault();
    // Quick note creation with template
    onNewNote();
    toast.success("Quick note created!");
  });

  useHotkeys("ctrl+shift+f", (e) => {
    e.preventDefault();
    // Advanced search
    onSearch();
    toast.info("Advanced search activated");
  });

  const filteredShortcuts = shortcuts.filter(
    (shortcut) =>
      shortcut.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shortcut.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shortcut.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const groupedShortcuts = filteredShortcuts.reduce(
    (groups, shortcut) => {
      const category = shortcut.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(shortcut);
      return groups;
    },
    {} as Record<string, Shortcut[]>,
  );

  const formatKeys = (keys: string[]) => {
    return keys.map((key, index) => (
      <span key={index}>
        <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono">
          {key}
        </kbd>
        {index < keys.length - 1 && <span className="mx-1">+</span>}
      </span>
    ));
  };

  const updateCustomShortcut = (shortcutId: string, newKeys: string) => {
    const updated = { ...customShortcuts, [shortcutId]: newKeys };
    saveCustomShortcuts(updated);
    toast.success("Shortcut updated!");
  };

  const resetShortcut = (shortcutId: string) => {
    const updated = { ...customShortcuts };
    delete updated[shortcutId];
    saveCustomShortcuts(updated);
    toast.success("Shortcut reset to default!");
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Keyboard className="h-4 w-4 mr-2" />
            Shortcuts
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Keyboard Shortcuts
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search shortcuts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>

            <div className="space-y-6">
              {Object.entries(groupedShortcuts).map(
                ([category, categoryShortcuts]) => (
                  <div key={category}>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Badge variant="secondary">{category}</Badge>
                    </h3>
                    <div className="space-y-2">
                      {categoryShortcuts.map((shortcut) => {
                        const customKey = customShortcuts[shortcut.id];
                        const displayKeys = customKey
                          ? customKey.split("+")
                          : shortcut.keys;

                        return (
                          <div
                            key={shortcut.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              darkMode
                                ? "bg-gray-800 border-gray-700"
                                : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-gray-500">
                                {shortcut.icon}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {shortcut.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {shortcut.description}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                {formatKeys(displayKeys)}
                              </div>
                              {customKey && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => resetShortcut(shortcut.id)}
                                  className="text-xs"
                                >
                                  Reset
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ),
              )}
            </div>

            {filteredShortcuts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Keyboard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No shortcuts found</p>
                <p className="text-sm">Try adjusting your search query</p>
              </div>
            )}

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Tips</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>
                  • Press{" "}
                  <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                    Esc
                  </kbd>{" "}
                  to close dialogs
                </li>
                <li>
                  • Use{" "}
                  <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                    Ctrl+Shift+N
                  </kbd>{" "}
                  for quick note creation
                </li>
                <li>
                  • Press{" "}
                  <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                    Ctrl+Shift+F
                  </kbd>{" "}
                  for advanced search
                </li>
                <li>• Most shortcuts work even when typing in text fields</li>
              </ul>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Pro Tip:</strong> You can customize shortcuts by
                clicking on them and entering new key combinations.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
