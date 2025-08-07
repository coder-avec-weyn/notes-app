import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { AlertTriangle, Flag, Circle } from "lucide-react";
import { Note } from "../types/NoteInterface";
import { supabase } from "../../../../supabase/supabase";
import { toast } from "react-hot-toast";

interface NotePriorityProps {
  note: Note;
  onNoteUpdated: (note: Note) => void;
}

const priorityConfig = {
  urgent: {
    label: "Urgent",
    color: "bg-red-500 text-white",
    icon: <AlertTriangle className="h-3 w-3" />,
    description: "Needs immediate attention",
  },
  high: {
    label: "High",
    color: "bg-orange-500 text-white",
    icon: <Flag className="h-3 w-3" />,
    description: "Important and time-sensitive",
  },
  medium: {
    label: "Medium",
    color: "bg-yellow-500 text-white",
    icon: <Circle className="h-3 w-3" />,
    description: "Moderate importance",
  },
  low: {
    label: "Low",
    color: "bg-green-500 text-white",
    icon: <Circle className="h-3 w-3" />,
    description: "Can be done when time permits",
  },
};

export function NotePriority({ note, onNoteUpdated }: NotePriorityProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState(
    note.priority || "low",
  );

  const savePriority = async () => {
    try {
      const updatedNote = {
        ...note,
        priority: selectedPriority as Note["priority"],
      };

      const { error } = await supabase
        .from("notes")
        .update({ priority: updatedNote.priority })
        .eq("id", note.id);

      if (error) throw error;

      onNoteUpdated(updatedNote);
      toast.success("Priority updated!");
      setIsOpen(false);
    } catch (error) {
      console.error("Error updating priority:", error);
      toast.error("Failed to update priority");
    }
  };

  const removePriority = async () => {
    try {
      const updatedNote = {
        ...note,
        priority: "low" as Note["priority"],
      };

      const { error } = await supabase
        .from("notes")
        .update({ priority: "low" })
        .eq("id", note.id);

      if (error) throw error;

      onNoteUpdated(updatedNote);
      setSelectedPriority("low");
      toast.success("Priority reset to low!");
      setIsOpen(false);
    } catch (error) {
      console.error("Error removing priority:", error);
      toast.error("Failed to update priority");
    }
  };

  const currentPriority = note.priority || "low";
  const priorityInfo = priorityConfig[currentPriority];

  return (
    <>
      {note.priority && note.priority !== "low" && (
        <Badge className={`mr-2 ${priorityInfo.color}`}>
          {priorityInfo.icon}
          <span className="ml-1">{priorityInfo.label}</span>
        </Badge>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Flag className="h-4 w-4 mr-2" />
            Priority
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Note Priority</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Select
                value={selectedPriority}
                onValueChange={setSelectedPriority}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority level" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(priorityConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        {config.icon}
                        <div>
                          <div className="font-medium">{config.label}</div>
                          <div className="text-xs text-gray-500">
                            {config.description}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {
                  priorityConfig[
                    selectedPriority as keyof typeof priorityConfig
                  ].icon
                }
                <span className="font-medium">
                  {
                    priorityConfig[
                      selectedPriority as keyof typeof priorityConfig
                    ].label
                  }{" "}
                  Priority
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {
                  priorityConfig[
                    selectedPriority as keyof typeof priorityConfig
                  ].description
                }
              </p>
            </div>

            {note.priority && note.priority !== "low" && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Current priority: <strong>{priorityInfo.label}</strong>
                </p>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              {note.priority && note.priority !== "low" && (
                <Button variant="outline" onClick={removePriority}>
                  Reset to Low
                </Button>
              )}
              <Button onClick={savePriority}>Set Priority</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
