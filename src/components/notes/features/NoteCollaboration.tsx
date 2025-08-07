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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Plus, X, Mail, Share2 } from "lucide-react";
import { Note } from "../types/NoteInterface";
import { supabase } from "../../../../supabase/supabase";
import { toast } from "react-hot-toast";

interface NoteCollaborationProps {
  note: Note;
  onNoteUpdated: (note: Note) => void;
}

export function NoteCollaboration({
  note,
  onNoteUpdated,
}: NoteCollaborationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState("");
  const [collaborators, setCollaborators] = useState<string[]>(
    note.collaborators || [],
  );
  const [isInviting, setIsInviting] = useState(false);

  const addCollaborator = async () => {
    if (!newCollaboratorEmail.trim()) return;

    const email = newCollaboratorEmail.trim().toLowerCase();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (collaborators.includes(email)) {
      toast.error("This person is already a collaborator");
      return;
    }

    setIsInviting(true);
    try {
      const updatedCollaborators = [...collaborators, email];

      const { error } = await supabase
        .from("notes")
        .update({ collaborators: updatedCollaborators })
        .eq("id", note.id);

      if (error) throw error;

      const updatedNote = {
        ...note,
        collaborators: updatedCollaborators,
      };

      setCollaborators(updatedCollaborators);
      onNoteUpdated(updatedNote);
      setNewCollaboratorEmail("");
      toast.success(`Invited ${email} to collaborate!`);
    } catch (error) {
      console.error("Error adding collaborator:", error);
      toast.error("Failed to add collaborator");
    } finally {
      setIsInviting(false);
    }
  };

  const removeCollaborator = async (email: string) => {
    try {
      const updatedCollaborators = collaborators.filter((c) => c !== email);

      const { error } = await supabase
        .from("notes")
        .update({ collaborators: updatedCollaborators })
        .eq("id", note.id);

      if (error) throw error;

      const updatedNote = {
        ...note,
        collaborators: updatedCollaborators,
      };

      setCollaborators(updatedCollaborators);
      onNoteUpdated(updatedNote);
      toast.success(`Removed ${email} from collaborators`);
    } catch (error) {
      console.error("Error removing collaborator:", error);
      toast.error("Failed to remove collaborator");
    }
  };

  const shareNote = async () => {
    try {
      const shareUrl = `${window.location.origin}/note/${note.id}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied to clipboard!");
    } catch (error) {
      console.error("Error copying share link:", error);
      toast.error("Failed to copy share link");
    }
  };

  return (
    <>
      {collaborators.length > 0 && (
        <div className="flex items-center gap-1 mr-2">
          <Users className="h-3 w-3 text-gray-500" />
          <span className="text-xs text-gray-500">{collaborators.length}</span>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Users className="h-4 w-4 mr-2" />
            Collaborate
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Collaborate on Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="collaborator-email">Invite by Email</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="collaborator-email"
                  type="email"
                  value={newCollaboratorEmail}
                  onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                  placeholder="Enter email address"
                  onKeyPress={(e) => e.key === "Enter" && addCollaborator()}
                />
                <Button
                  onClick={addCollaborator}
                  disabled={!newCollaboratorEmail.trim() || isInviting}
                  size="sm"
                >
                  {isInviting ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {collaborators.length > 0 && (
              <div>
                <Label>Current Collaborators</Label>
                <div className="space-y-2 mt-2">
                  {collaborators.map((email) => (
                    <div
                      key={email}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`}
                          />
                          <AvatarFallback className="text-xs">
                            {email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{email}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCollaborator(email)}
                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <Button variant="outline" onClick={shareNote} className="w-full">
                <Share2 className="h-4 w-4 mr-2" />
                Copy Share Link
              </Button>
            </div>

            <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
              <strong>Note:</strong> Collaborators will receive an email
              invitation and can view and edit this note.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
