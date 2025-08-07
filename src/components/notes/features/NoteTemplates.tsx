import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Calendar,
  CheckSquare,
  Lightbulb,
  BookOpen,
  Briefcase,
} from "lucide-react";
import { NoteTemplate } from "../types/NoteInterface";

interface NoteTemplatesProps {
  onTemplateSelect: (template: NoteTemplate) => void;
}

const defaultTemplates: NoteTemplate[] = [
  {
    id: "meeting-notes",
    name: "Meeting Notes",
    icon: "briefcase",
    content: `# Meeting Notes\n\n**Date:** ${new Date().toLocaleDateString()}\n**Attendees:** \n\n## Agenda\n- \n\n## Discussion Points\n- \n\n## Action Items\n- [ ] \n\n## Next Steps\n- `,
    tags: ["meeting", "work"],
    category: "work",
  },
  {
    id: "daily-journal",
    name: "Daily Journal",
    icon: "book-open",
    content: `# Daily Journal - ${new Date().toLocaleDateString()}\n\n## How I'm Feeling\n\n\n## What Happened Today\n\n\n## Grateful For\n1. \n2. \n3. \n\n## Tomorrow's Goals\n- `,
    tags: ["journal", "personal"],
    category: "personal",
  },
  {
    id: "project-planning",
    name: "Project Planning",
    icon: "calendar",
    content: `# Project: [Project Name]\n\n## Overview\n\n\n## Goals\n- \n\n## Timeline\n- **Phase 1:** \n- **Phase 2:** \n- **Phase 3:** \n\n## Resources Needed\n- \n\n## Risks & Mitigation\n- `,
    tags: ["project", "planning"],
    category: "work",
  },
  {
    id: "idea-capture",
    name: "Idea Capture",
    icon: "lightbulb",
    content: `# 💡 New Idea\n\n## The Idea\n\n\n## Why This Matters\n\n\n## Potential Applications\n- \n\n## Next Steps\n- [ ] Research similar ideas\n- [ ] Create prototype\n- [ ] Get feedback`,
    tags: ["idea", "brainstorm"],
    category: "creative",
  },
  {
    id: "task-list",
    name: "Task List",
    icon: "check-square",
    content: `# Tasks - ${new Date().toLocaleDateString()}\n\n## High Priority\n- [ ] \n\n## Medium Priority\n- [ ] \n\n## Low Priority\n- [ ] \n\n## Completed\n- [x] Created task list`,
    tags: ["tasks", "todo"],
    category: "productivity",
  },
  {
    id: "book-notes",
    name: "Book Notes",
    icon: "book-open",
    content: `# Book Notes: [Book Title]\n\n**Author:** \n**Genre:** \n**Rating:** ⭐⭐⭐⭐⭐\n\n## Key Takeaways\n- \n\n## Favorite Quotes\n> \n\n## My Thoughts\n\n\n## Action Items\n- [ ] `,
    tags: ["book", "notes", "learning"],
    category: "learning",
  },
];

const getIcon = (iconName: string) => {
  switch (iconName) {
    case "briefcase":
      return <Briefcase className="h-6 w-6" />;
    case "book-open":
      return <BookOpen className="h-6 w-6" />;
    case "calendar":
      return <Calendar className="h-6 w-6" />;
    case "lightbulb":
      return <Lightbulb className="h-6 w-6" />;
    case "check-square":
      return <CheckSquare className="h-6 w-6" />;
    default:
      return <FileText className="h-6 w-6" />;
  }
};

export function NoteTemplates({ onTemplateSelect }: NoteTemplatesProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleTemplateSelect = (template: NoteTemplate) => {
    onTemplateSelect(template);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose a Template</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {defaultTemplates.map((template) => (
            <Card
              key={template.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleTemplateSelect(template)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="text-blue-600">
                    {getIcon(template.icon || "file-text")}
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium">
                      {template.name}
                    </CardTitle>
                    <p className="text-xs text-gray-500 capitalize">
                      {template.category}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-2 text-xs text-gray-500 line-clamp-3">
                  {template.content
                    .split("\n")
                    .slice(0, 3)
                    .join(" ")
                    .substring(0, 100)}
                  ...
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
