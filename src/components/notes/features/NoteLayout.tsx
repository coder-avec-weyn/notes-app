import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Layout,
  Columns,
  Rows,
  Maximize2,
  Minimize2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Palette,
  Grid,
  List,
  Eye,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface NoteLayoutProps {
  onLayoutChange: (layout: LayoutSettings) => void;
  currentLayout?: LayoutSettings;
}

export interface LayoutSettings {
  viewMode: "single" | "split" | "grid";
  columns: number;
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  textAlign: "left" | "center" | "right" | "justify";
  maxWidth: number;
  padding: number;
  showLineNumbers: boolean;
  showWordCount: boolean;
  showReadingTime: boolean;
  darkMode: boolean;
  compactMode: boolean;
  fullscreen: boolean;
  responsiveBreakpoint: "mobile" | "tablet" | "desktop";
  customCSS: string;
}

const defaultLayout: LayoutSettings = {
  viewMode: "single",
  columns: 1,
  fontSize: 14,
  lineHeight: 1.6,
  fontFamily: "Inter",
  textAlign: "left",
  maxWidth: 800,
  padding: 24,
  showLineNumbers: false,
  showWordCount: true,
  showReadingTime: true,
  darkMode: false,
  compactMode: false,
  fullscreen: false,
  responsiveBreakpoint: "desktop",
  customCSS: "",
};

export function NoteLayout({
  onLayoutChange,
  currentLayout = defaultLayout,
}: NoteLayoutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [layout, setLayout] = useState<LayoutSettings>(currentLayout);
  const [previewMode, setPreviewMode] = useState(false);

  const fontFamilies = [
    { value: "Inter", label: "Inter (Sans-serif)" },
    { value: "Georgia", label: "Georgia (Serif)" },
    { value: "Courier New", label: "Courier New (Monospace)" },
    { value: "Arial", label: "Arial (Sans-serif)" },
    { value: "Times New Roman", label: "Times New Roman (Serif)" },
    { value: "Helvetica", label: "Helvetica (Sans-serif)" },
    { value: "Roboto", label: "Roboto (Sans-serif)" },
    { value: "Open Sans", label: "Open Sans (Sans-serif)" },
  ];

  const layoutPresets = [
    {
      name: "Default",
      description: "Standard single-column layout",
      settings: { ...defaultLayout },
    },
    {
      name: "Reading Mode",
      description: "Optimized for reading long content",
      settings: {
        ...defaultLayout,
        fontSize: 16,
        lineHeight: 1.8,
        maxWidth: 700,
        fontFamily: "Georgia",
        padding: 32,
      },
    },
    {
      name: "Compact",
      description: "Space-efficient layout",
      settings: {
        ...defaultLayout,
        fontSize: 12,
        lineHeight: 1.4,
        padding: 16,
        compactMode: true,
      },
    },
    {
      name: "Split View",
      description: "Side-by-side editing and preview",
      settings: {
        ...defaultLayout,
        viewMode: "split" as const,
        columns: 2,
      },
    },
    {
      name: "Grid Layout",
      description: "Multi-column grid view",
      settings: {
        ...defaultLayout,
        viewMode: "grid" as const,
        columns: 3,
        fontSize: 12,
      },
    },
    {
      name: "Mobile Optimized",
      description: "Optimized for mobile devices",
      settings: {
        ...defaultLayout,
        fontSize: 16,
        padding: 16,
        maxWidth: 100,
        responsiveBreakpoint: "mobile" as const,
      },
    },
  ];

  const updateLayout = (updates: Partial<LayoutSettings>) => {
    const newLayout = { ...layout, ...updates };
    setLayout(newLayout);
  };

  const applyLayout = () => {
    onLayoutChange(layout);
    toast.success("Layout settings applied!");
    setIsOpen(false);
  };

  const applyPreset = (preset: (typeof layoutPresets)[0]) => {
    setLayout(preset.settings);
    toast.success(`Applied ${preset.name} preset!`);
  };

  const resetToDefault = () => {
    setLayout(defaultLayout);
    toast.success("Reset to default layout!");
  };

  const exportLayout = () => {
    const layoutData = {
      layout,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(layoutData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `note-layout-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Layout exported!");
  };

  const getViewModeIcon = (mode: LayoutSettings["viewMode"]) => {
    switch (mode) {
      case "single":
        return <List className="h-4 w-4" />;
      case "split":
        return <Columns className="h-4 w-4" />;
      case "grid":
        return <Grid className="h-4 w-4" />;
      default:
        return <Layout className="h-4 w-4" />;
    }
  };

  const getAlignmentIcon = (align: LayoutSettings["textAlign"]) => {
    switch (align) {
      case "left":
        return <AlignLeft className="h-4 w-4" />;
      case "center":
        return <AlignCenter className="h-4 w-4" />;
      case "right":
        return <AlignRight className="h-4 w-4" />;
      default:
        return <AlignLeft className="h-4 w-4" />;
    }
  };

  const getBreakpointIcon = (
    breakpoint: LayoutSettings["responsiveBreakpoint"],
  ) => {
    switch (breakpoint) {
      case "mobile":
        return <Smartphone className="h-4 w-4" />;
      case "tablet":
        return <Tablet className="h-4 w-4" />;
      case "desktop":
        return <Monitor className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <>
      {layout.viewMode !== "single" && (
        <Badge variant="secondary" className="mr-2">
          <Layout className="h-3 w-3 mr-1" />
          {layout.viewMode}
        </Badge>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Layout className="h-4 w-4 mr-2" />
            Layout
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layout className="h-5 w-5" />
              Layout Settings
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Quick Presets */}
            <div>
              <h3 className="font-semibold mb-3">Quick Presets</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {layoutPresets.map((preset) => (
                  <div
                    key={preset.name}
                    className="p-3 border rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => applyPreset(preset)}
                  >
                    <h4 className="font-medium text-sm">{preset.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {preset.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* View Mode */}
            <div>
              <h3 className="font-semibold mb-3">View Mode</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    value: "single",
                    label: "Single Column",
                    icon: <List className="h-4 w-4" />,
                  },
                  {
                    value: "split",
                    label: "Split View",
                    icon: <Columns className="h-4 w-4" />,
                  },
                  {
                    value: "grid",
                    label: "Grid Layout",
                    icon: <Grid className="h-4 w-4" />,
                  },
                ].map((mode) => (
                  <Button
                    key={mode.value}
                    variant={
                      layout.viewMode === mode.value ? "default" : "outline"
                    }
                    onClick={() =>
                      updateLayout({ viewMode: mode.value as any })
                    }
                    className="flex flex-col gap-2 h-auto py-3"
                  >
                    {mode.icon}
                    <span className="text-xs">{mode.label}</span>
                  </Button>
                ))}
              </div>

              {(layout.viewMode === "split" || layout.viewMode === "grid") && (
                <div className="mt-3">
                  <Label>Columns: {layout.columns}</Label>
                  <Slider
                    value={[layout.columns]}
                    onValueChange={([value]) =>
                      updateLayout({ columns: value })
                    }
                    min={1}
                    max={4}
                    step={1}
                    className="mt-2"
                  />
                </div>
              )}
            </div>

            {/* Typography */}
            <div>
              <h3 className="font-semibold mb-3">Typography</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Font Family</Label>
                  <Select
                    value={layout.fontFamily}
                    onValueChange={(value) =>
                      updateLayout({ fontFamily: value })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontFamilies.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Text Alignment</Label>
                  <div className="flex gap-1 mt-1">
                    {[
                      {
                        value: "left",
                        icon: <AlignLeft className="h-4 w-4" />,
                      },
                      {
                        value: "center",
                        icon: <AlignCenter className="h-4 w-4" />,
                      },
                      {
                        value: "right",
                        icon: <AlignRight className="h-4 w-4" />,
                      },
                    ].map((align) => (
                      <Button
                        key={align.value}
                        variant={
                          layout.textAlign === align.value
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          updateLayout({ textAlign: align.value as any })
                        }
                      >
                        {align.icon}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label>Font Size: {layout.fontSize}px</Label>
                  <Slider
                    value={[layout.fontSize]}
                    onValueChange={([value]) =>
                      updateLayout({ fontSize: value })
                    }
                    min={10}
                    max={24}
                    step={1}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Line Height: {layout.lineHeight}</Label>
                  <Slider
                    value={[layout.lineHeight]}
                    onValueChange={([value]) =>
                      updateLayout({ lineHeight: value })
                    }
                    min={1.0}
                    max={2.5}
                    step={0.1}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>

            {/* Layout & Spacing */}
            <div>
              <h3 className="font-semibold mb-3">Layout & Spacing</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Max Width: {layout.maxWidth}%</Label>
                  <Slider
                    value={[layout.maxWidth]}
                    onValueChange={([value]) =>
                      updateLayout({ maxWidth: value })
                    }
                    min={50}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Padding: {layout.padding}px</Label>
                  <Slider
                    value={[layout.padding]}
                    onValueChange={([value]) =>
                      updateLayout({ padding: value })
                    }
                    min={8}
                    max={48}
                    step={4}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>

            {/* Display Options */}
            <div>
              <h3 className="font-semibold mb-3">Display Options</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Line Numbers</Label>
                    <p className="text-sm text-gray-500">
                      Display line numbers in editor
                    </p>
                  </div>
                  <Switch
                    checked={layout.showLineNumbers}
                    onCheckedChange={(checked) =>
                      updateLayout({ showLineNumbers: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Word Count</Label>
                    <p className="text-sm text-gray-500">
                      Display word count in footer
                    </p>
                  </div>
                  <Switch
                    checked={layout.showWordCount}
                    onCheckedChange={(checked) =>
                      updateLayout({ showWordCount: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Reading Time</Label>
                    <p className="text-sm text-gray-500">
                      Display estimated reading time
                    </p>
                  </div>
                  <Switch
                    checked={layout.showReadingTime}
                    onCheckedChange={(checked) =>
                      updateLayout({ showReadingTime: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Compact Mode</Label>
                    <p className="text-sm text-gray-500">
                      Reduce spacing and padding
                    </p>
                  </div>
                  <Switch
                    checked={layout.compactMode}
                    onCheckedChange={(checked) =>
                      updateLayout({ compactMode: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Fullscreen Mode</Label>
                    <p className="text-sm text-gray-500">
                      Hide all UI elements except editor
                    </p>
                  </div>
                  <Switch
                    checked={layout.fullscreen}
                    onCheckedChange={(checked) =>
                      updateLayout({ fullscreen: checked })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Responsive Settings */}
            <div>
              <h3 className="font-semibold mb-3">Responsive Design</h3>
              <div>
                <Label>Optimize for Device</Label>
                <div className="flex gap-2 mt-2">
                  {[
                    {
                      value: "mobile",
                      label: "Mobile",
                      icon: <Smartphone className="h-4 w-4" />,
                    },
                    {
                      value: "tablet",
                      label: "Tablet",
                      icon: <Tablet className="h-4 w-4" />,
                    },
                    {
                      value: "desktop",
                      label: "Desktop",
                      icon: <Monitor className="h-4 w-4" />,
                    },
                  ].map((device) => (
                    <Button
                      key={device.value}
                      variant={
                        layout.responsiveBreakpoint === device.value
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        updateLayout({
                          responsiveBreakpoint: device.value as any,
                        })
                      }
                      className="flex items-center gap-2"
                    >
                      {device.icon}
                      {device.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Preview</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewMode(!previewMode)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {previewMode ? "Hide" : "Show"} Preview
                </Button>
              </div>

              {previewMode && (
                <div
                  className="p-4 border rounded-lg bg-gray-50"
                  style={{
                    fontSize: `${layout.fontSize}px`,
                    lineHeight: layout.lineHeight,
                    fontFamily: layout.fontFamily,
                    textAlign: layout.textAlign,
                    maxWidth: `${layout.maxWidth}%`,
                    padding: `${layout.padding}px`,
                  }}
                >
                  <h4 className="font-semibold mb-2">Sample Note Title</h4>
                  <p className="mb-2">
                    This is a preview of how your notes will look with the
                    current layout settings. You can see the font size, line
                    height, alignment, and spacing in action.
                  </p>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                    do eiusmod tempor incididunt ut labore et dolore magna
                    aliqua.
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={applyLayout} className="flex-1">
                Apply Layout
              </Button>
              <Button variant="outline" onClick={resetToDefault}>
                Reset
              </Button>
              <Button variant="outline" onClick={exportLayout}>
                Export
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
