import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell, Clock, Calendar } from "lucide-react";
import { Note } from "../types/NoteInterface";
import { supabase } from "../../../../supabase/supabase";
import { toast } from "react-hot-toast";

interface NoteRemindersProps {
  note: Note;
  onNoteUpdated: (note: Note) => void;
}

export function NoteReminders({ note, onNoteUpdated }: NoteRemindersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reminderDate, setReminderDate] = useState(
    note.reminder_date
      ? new Date(note.reminder_date).toISOString().slice(0, 16)
      : "",
  );
  const [reminderType, setReminderType] = useState("custom");

  const setQuickReminder = (minutes: number) => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    setReminderDate(now.toISOString().slice(0, 16));
  };

  const saveReminder = async () => {
    try {
      const updatedNote = {
        ...note,
        reminder_date: reminderDate
          ? new Date(reminderDate).toISOString()
          : null,
      };

      const { error } = await supabase
        .from("notes")
        .update({ reminder_date: updatedNote.reminder_date })
        .eq("id", note.id);

      if (error) throw error;

      onNoteUpdated(updatedNote);
      toast.success(reminderDate ? "Reminder set!" : "Reminder removed!");
      setIsOpen(false);
    } catch (error) {
      console.error("Error setting reminder:", error);
      toast.error("Failed to set reminder");
    }
  };

  const removeReminder = async () => {
    try {
      const updatedNote = {
        ...note,
        reminder_date: null,
      };

      const { error } = await supabase
        .from("notes")
        .update({ reminder_date: null })
        .eq("id", note.id);

      if (error) throw error;

      onNoteUpdated(updatedNote);
      setReminderDate("");
      toast.success("Reminder removed!");
      setIsOpen(false);
    } catch (error) {
      console.error("Error removing reminder:", error);
      toast.error("Failed to remove reminder");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={note.reminder_date ? "default" : "outline"}
          size="sm"
          className={
            note.reminder_date ? "bg-orange-500 hover:bg-orange-600" : ""
          }
        >
          <Bell
            className={`h-4 w-4 mr-2 ${note.reminder_date ? "fill-current" : ""}`}
          />
          {note.reminder_date ? "Reminder Set" : "Set Reminder"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Reminder for Note</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="reminder-type">Quick Options</Label>
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickReminder(15)}
              >
                <Clock className="h-4 w-4 mr-1" />
                15 min
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickReminder(60)}
              >
                <Clock className="h-4 w-4 mr-1" />1 hour
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickReminder(1440)}
              >
                <Calendar className="h-4 w-4 mr-1" />
                Tomorrow
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="reminder-date">Custom Date & Time</Label>
            <Input
              id="reminder-date"
              type="datetime-local"
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="mt-2"
            />
          </div>

          {note.reminder_date && (
            <div className="p-3 bg-orange-50 rounded-lg">
              <p className="text-sm text-orange-800">
                Current reminder:{" "}
                {new Date(note.reminder_date).toLocaleString()}
              </p>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            {note.reminder_date && (
              <Button variant="outline" onClick={removeReminder}>
                Remove Reminder
              </Button>
            )}
            <Button onClick={saveReminder} disabled={!reminderDate}>
              {note.reminder_date ? "Update Reminder" : "Set Reminder"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
