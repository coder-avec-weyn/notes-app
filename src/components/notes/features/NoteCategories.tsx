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
import { Badge } from "@/components/ui/badge";
import { Folder, Plus, X } from "lucide-react";
import { Note } from "../types/NoteInterface";
import { supabase } from "../../../../supabase/supabase";
import { toast } from "react-hot-toast";

interface NoteCategoriesProps {
  note: Note;
  allCategories: string[];
  onNoteUpdated: (note: Note) => void;
  onCategoryAdded: (category: string) => void;
}

const defaultCategories = [
  "Personal",
  "Work",
  "Ideas",
  "Projects",
  "Learning",
  "Health",
  "Finance",
  "Travel",
  "Recipes",
  "Books",
];

export function NoteCategories({
  note,
  allCategories,
  onNoteUpdated,
  onCategoryAdded,
}: NoteCategoriesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(note.category || "");
  const [newCategory, setNewCategory] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const availableCategories = [
    ...new Set([...defaultCategories, ...allCategories]),
  ];

  const saveCategory = async () => {
    try {
      const updatedNote = {
        ...note,
        category: selectedCategory || null,
      };

      const { error } = await supabase
        .from("notes")
        .update({ category: updatedNote.category })
        .eq("id", note.id);

      if (error) throw error;

      onNoteUpdated(updatedNote);
      toast.success(
        selectedCategory ? "Category updated!" : "Category removed!",
      );
      setIsOpen(false);
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Failed to update category");
    }
  };

  const createNewCategory = async () => {
    if (!newCategory.trim()) return;

    const categoryName = newCategory.trim();
    if (availableCategories.includes(categoryName)) {
      toast.error("Category already exists");
      return;
    }

    onCategoryAdded(categoryName);
    setSelectedCategory(categoryName);
    setNewCategory("");
    setIsCreatingCategory(false);
    toast.success("New category created!");
  };

  const removeCategory = async () => {
    try {
      const updatedNote = {
        ...note,
        category: null,
      };

      const { error } = await supabase
        .from("notes")
        .update({ category: null })
        .eq("id", note.id);

      if (error) throw error;

      onNoteUpdated(updatedNote);
      setSelectedCategory("");
      toast.success("Category removed!");
      setIsOpen(false);
    } catch (error) {
      console.error("Error removing category:", error);
      toast.error("Failed to remove category");
    }
  };

  return (
    <>
      {note.category && (
        <Badge variant="secondary" className="mr-2">
          <Folder className="h-3 w-3 mr-1" />
          {note.category}
        </Badge>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Folder className="h-4 w-4 mr-2" />
            {note.category ? "Change Category" : "Add Category"}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Note Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!isCreatingCategory ? (
              <>
                <div>
                  <Label htmlFor="category-select">Select Category</Label>
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Choose a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Category</SelectItem>
                      {availableCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setIsCreatingCategory(true)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Category
                </Button>
              </>
            ) : (
              <div>
                <Label htmlFor="new-category">New Category Name</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="new-category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Enter category name"
                    onKeyPress={(e) => e.key === "Enter" && createNewCategory()}
                  />
                  <Button
                    onClick={createNewCategory}
                    disabled={!newCategory.trim()}
                  >
                    Add
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreatingCategory(false);
                      setNewCategory("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {note.category && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Current category: <strong>{note.category}</strong>
                </p>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              {note.category && (
                <Button variant="outline" onClick={removeCategory}>
                  Remove Category
                </Button>
              )}
              <Button onClick={saveCategory}>
                {note.category ? "Update Category" : "Set Category"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
