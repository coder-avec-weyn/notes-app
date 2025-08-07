import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Palette,
  Check,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface NoteThemesProps {
  onThemeChange: (theme: Theme) => void;
  currentTheme?: string;
}

interface Theme {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    accent: string;
  };
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
  spacing: {
    compact: boolean;
    borderRadius: string;
  };
  category: string;
}

const defaultThemes: Theme[] = [
  {
    id: "default",
    name: "Default",
    description: "Clean and modern default theme",
    colors: {
      primary: "#3b82f6",
      secondary: "#64748b",
      background: "#ffffff",
      surface: "#f8fafc",
      text: "#1e293b",
      textSecondary: "#64748b",
      border: "#e2e8f0",
      accent: "#8b5cf6",
    },
    fonts: {
      heading: "Inter, sans-serif",
      body: "Inter, sans-serif",
      mono: "JetBrains Mono, monospace",
    },
    spacing: {
      compact: false,
      borderRadius: "0.5rem",
    },
    category: "Light",
  },
  {
    id: "dark",
    name: "Dark",
    description: "Easy on the eyes dark theme",
    colors: {
      primary: "#60a5fa",
      secondary: "#94a3b8",
      background: "#0f172a",
      surface: "#1e293b",
      text: "#f1f5f9",
      textSecondary: "#94a3b8",
      border: "#334155",
      accent: "#a78bfa",
    },
    fonts: {
      heading: "Inter, sans-serif",
      body: "Inter, sans-serif",
      mono: "JetBrains Mono, monospace",
    },
    spacing: {
      compact: false,
      borderRadius: "0.5rem",
    },
    category: "Dark",
  },
  {
    id: "sepia",
    name: "Sepia",
    description: "Warm, paper-like reading experience",
    colors: {
      primary: "#92400e",
      secondary: "#78716c",
      background: "#fef7ed",
      surface: "#fef3e2",
      text: "#451a03",
      textSecondary: "#78716c",
      border: "#fed7aa",
      accent: "#ea580c",
    },
    fonts: {
      heading: "Crimson Text, serif",
      body: "Crimson Text, serif",
      mono: "Source Code Pro, monospace",
    },
    spacing: {
      compact: false,
      borderRadius: "0.25rem",
    },
    category: "Warm",
  },
  {
    id: "forest",
    name: "Forest",
    description: "Nature-inspired green theme",
    colors: {
      primary: "#059669",
      secondary: "#6b7280",
      background: "#f0fdf4",
      surface: "#ecfdf5",
      text: "#064e3b",
      textSecondary: "#6b7280",
      border: "#bbf7d0",
      accent: "#10b981",
    },
    fonts: {
      heading: "Merriweather, serif",
      body: "Source Sans Pro, sans-serif",
      mono: "Fira Code, monospace",
    },
    spacing: {
      compact: false,
      borderRadius: "0.75rem",
    },
    category: "Nature",
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Calming blue ocean theme",
    colors: {
      primary: "#0891b2",
      secondary: "#64748b",
      background: "#f0f9ff",
      surface: "#e0f2fe",
      text: "#0c4a6e",
      textSecondary: "#64748b",
      border: "#7dd3fc",
      accent: "#06b6d4",
    },
    fonts: {
      heading: "Playfair Display, serif",
      body: "Open Sans, sans-serif",
      mono: "Roboto Mono, monospace",
    },
    spacing: {
      compact: false,
      borderRadius: "1rem",
    },
    category: "Cool",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Ultra-clean minimal design",
    colors: {
      primary: "#000000",
      secondary: "#6b7280",
      background: "#ffffff",
      surface: "#ffffff",
      text: "#000000",
      textSecondary: "#6b7280",
      border: "#e5e7eb",
      accent: "#374151",
    },
    fonts: {
      heading: "Helvetica Neue, sans-serif",
      body: "Helvetica Neue, sans-serif",
      mono: "Monaco, monospace",
    },
    spacing: {
      compact: true,
      borderRadius: "0rem",
    },
    category: "Minimal",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    description: "Futuristic neon-inspired theme",
    colors: {
      primary: "#ff00ff",
      secondary: "#00ffff",
      background: "#0a0a0a",
      surface: "#1a1a1a",
      text: "#00ff00",
      textSecondary: "#00ffff",
      border: "#ff00ff",
      accent: "#ffff00",
    },
    fonts: {
      heading: "Orbitron, monospace",
      body: "Share Tech Mono, monospace",
      mono: "Share Tech Mono, monospace",
    },
    spacing: {
      compact: false,
      borderRadius: "0rem",
    },
    category: "Futuristic",
  },
];

export function NoteThemes({
  onThemeChange,
  currentTheme = "default",
}: NoteThemesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customThemes, setCustomThemes] = useState<Theme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);
  const [isCreatingTheme, setIsCreatingTheme] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [newTheme, setNewTheme] = useState<Partial<Theme>>({
    name: "",
    description: "",
    category: "Custom",
    colors: {
      primary: "#3b82f6",
      secondary: "#64748b",
      background: "#ffffff",
      surface: "#f8fafc",
      text: "#1e293b",
      textSecondary: "#64748b",
      border: "#e2e8f0",
      accent: "#8b5cf6",
    },
    fonts: {
      heading: "Inter, sans-serif",
      body: "Inter, sans-serif",
      mono: "JetBrains Mono, monospace",
    },
    spacing: {
      compact: false,
      borderRadius: "0.5rem",
    },
  });

  useEffect(() => {
    // Load custom themes from localStorage
    const saved = localStorage.getItem("customNoteThemes");
    if (saved) {
      try {
        setCustomThemes(JSON.parse(saved));
      } catch (error) {
        console.error("Failed to load custom themes:", error);
      }
    }
  }, []);

  const saveCustomThemes = (themes: Theme[]) => {
    setCustomThemes(themes);
    localStorage.setItem("customNoteThemes", JSON.stringify(themes));
  };

  const allThemes = [...defaultThemes, ...customThemes];

  const applyTheme = (theme: Theme) => {
    setSelectedTheme(theme.id);
    onThemeChange(theme);

    // Apply CSS custom properties
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value);
    });

    root.style.setProperty("--theme-font-heading", theme.fonts.heading);
    root.style.setProperty("--theme-font-body", theme.fonts.body);
    root.style.setProperty("--theme-font-mono", theme.fonts.mono);
    root.style.setProperty("--theme-border-radius", theme.spacing.borderRadius);

    toast.success(`Applied ${theme.name} theme`);
  };

  const createCustomTheme = () => {
    if (!newTheme.name || !newTheme.description) {
      toast.error("Please provide a name and description for the theme");
      return;
    }

    const theme: Theme = {
      id: `custom-${Date.now()}`,
      name: newTheme.name,
      description: newTheme.description,
      colors: newTheme.colors!,
      fonts: newTheme.fonts!,
      spacing: newTheme.spacing!,
      category: newTheme.category || "Custom",
    };

    const updatedThemes = [...customThemes, theme];
    saveCustomThemes(updatedThemes);
    setIsCreatingTheme(false);
    setNewTheme({
      name: "",
      description: "",
      category: "Custom",
      colors: {
        primary: "#3b82f6",
        secondary: "#64748b",
        background: "#ffffff",
        surface: "#f8fafc",
        text: "#1e293b",
        textSecondary: "#64748b",
        border: "#e2e8f0",
        accent: "#8b5cf6",
      },
      fonts: {
        heading: "Inter, sans-serif",
        body: "Inter, sans-serif",
        mono: "JetBrains Mono, monospace",
      },
      spacing: {
        compact: false,
        borderRadius: "0.5rem",
      },
    });
    toast.success("Custom theme created!");
  };

  const deleteCustomTheme = (themeId: string) => {
    const updatedThemes = customThemes.filter((theme) => theme.id !== themeId);
    saveCustomThemes(updatedThemes);
    if (selectedTheme === themeId) {
      applyTheme(defaultThemes[0]);
    }
    toast.success("Theme deleted");
  };

  const exportThemes = () => {
    const exportData = {
      themes: customThemes,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `note-themes-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Themes exported!");
  };

  const importThemes = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.themes && Array.isArray(data.themes)) {
          const importedThemes = data.themes.map((theme: any) => ({
            ...theme,
            id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          }));
          const updatedThemes = [...customThemes, ...importedThemes];
          saveCustomThemes(updatedThemes);
          toast.success(`Imported ${importedThemes.length} themes!`);
        } else {
          toast.error("Invalid theme file format");
        }
      } catch (error) {
        toast.error("Failed to import themes");
      }
    };
    reader.readAsText(file);
  };

  const groupedThemes = allThemes.reduce(
    (groups, theme) => {
      const category = theme.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(theme);
      return groups;
    },
    {} as Record<string, Theme[]>,
  );

  const ThemePreview = ({ theme }: { theme: Theme }) => (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        selectedTheme === theme.id ? "ring-2 ring-blue-500" : ""
      }`}
      onClick={() => applyTheme(theme)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-medium">{theme.name}</h4>
            <p className="text-sm text-gray-500">{theme.description}</p>
          </div>
          {selectedTheme === theme.id && (
            <Check className="h-5 w-5 text-green-600" />
          )}
        </div>

        {/* Color palette preview */}
        <div className="flex gap-1 mb-3">
          {Object.entries(theme.colors)
            .slice(0, 6)
            .map(([key, color]) => (
              <div
                key={key}
                className="w-6 h-6 rounded border"
                style={{ backgroundColor: color }}
                title={`${key}: ${color}`}
              />
            ))}
        </div>

        {/* Font preview */}
        <div className="text-xs text-gray-600 mb-2">
          <div style={{ fontFamily: theme.fonts.heading }}>Heading Font</div>
          <div style={{ fontFamily: theme.fonts.body }}>Body Font</div>
        </div>

        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {theme.category}
          </Badge>
          {theme.id.startsWith("custom-") && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingTheme(theme);
                  setNewTheme(theme);
                  setIsCreatingTheme(true);
                }}
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteCustomTheme(theme.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="bg-white">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Palette className="h-4 w-4 mr-2" />
            Themes
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Note Themes
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => setIsCreatingTheme(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Theme
              </Button>
              <Button
                onClick={exportThemes}
                variant="outline"
                size="sm"
                disabled={customThemes.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <label>
                <Button variant="outline" size="sm" as="span">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
                <input
                  type="file"
                  accept=".json"
                  onChange={importThemes}
                  className="hidden"
                />
              </label>
            </div>

            {/* Theme Groups */}
            {Object.entries(groupedThemes).map(([category, themes]) => (
              <div key={category}>
                <h3 className="font-semibold text-lg mb-3">{category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {themes.map((theme) => (
                    <ThemePreview key={theme.id} theme={theme} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Theme Dialog */}
      <Dialog open={isCreatingTheme} onOpenChange={setIsCreatingTheme}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTheme ? "Edit Theme" : "Create Custom Theme"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="theme-name">Theme Name</Label>
                <Input
                  id="theme-name"
                  value={newTheme.name || ""}
                  onChange={(e) =>
                    setNewTheme({ ...newTheme, name: e.target.value })
                  }
                  placeholder="My Custom Theme"
                />
              </div>
              <div>
                <Label htmlFor="theme-category">Category</Label>
                <Input
                  id="theme-category"
                  value={newTheme.category || ""}
                  onChange={(e) =>
                    setNewTheme({ ...newTheme, category: e.target.value })
                  }
                  placeholder="Custom"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="theme-description">Description</Label>
              <Textarea
                id="theme-description"
                value={newTheme.description || ""}
                onChange={(e) =>
                  setNewTheme({ ...newTheme, description: e.target.value })
                }
                placeholder="A beautiful custom theme..."
              />
            </div>

            {/* Color Settings */}
            <div>
              <Label>Colors</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {Object.entries(newTheme.colors || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <Label className="text-sm capitalize w-20">{key}</Label>
                    <input
                      type="color"
                      value={value}
                      onChange={(e) =>
                        setNewTheme({
                          ...newTheme,
                          colors: {
                            ...newTheme.colors!,
                            [key]: e.target.value,
                          },
                        })
                      }
                      className="w-12 h-8 rounded border"
                    />
                    <Input
                      value={value}
                      onChange={(e) =>
                        setNewTheme({
                          ...newTheme,
                          colors: {
                            ...newTheme.colors!,
                            [key]: e.target.value,
                          },
                        })
                      }
                      className="flex-1 text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Font Settings */}
            <div>
              <Label>Fonts</Label>
              <div className="space-y-2 mt-2">
                {Object.entries(newTheme.fonts || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <Label className="text-sm capitalize w-20">{key}</Label>
                    <Input
                      value={value}
                      onChange={(e) =>
                        setNewTheme({
                          ...newTheme,
                          fonts: { ...newTheme.fonts!, [key]: e.target.value },
                        })
                      }
                      placeholder="Font family"
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Spacing Settings */}
            <div>
              <Label>Spacing</Label>
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-2">
                  <Label className="text-sm w-20">Border Radius</Label>
                  <Input
                    value={newTheme.spacing?.borderRadius || ""}
                    onChange={(e) =>
                      setNewTheme({
                        ...newTheme,
                        spacing: {
                          ...newTheme.spacing!,
                          borderRadius: e.target.value,
                        },
                      })
                    }
                    placeholder="0.5rem"
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="compact"
                    checked={newTheme.spacing?.compact || false}
                    onChange={(e) =>
                      setNewTheme({
                        ...newTheme,
                        spacing: {
                          ...newTheme.spacing!,
                          compact: e.target.checked,
                        },
                      })
                    }
                  />
                  <Label htmlFor="compact" className="text-sm">
                    Compact spacing
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={createCustomTheme} className="flex-1">
                {editingTheme ? "Update Theme" : "Create Theme"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreatingTheme(false);
                  setEditingTheme(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
