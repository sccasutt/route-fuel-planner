
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function NotesTab() {
  const [note, setNote] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would save the note
    console.log("Saving note:", note);
    // Clear the form
    setNote("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes & Analysis</CardTitle>
        <CardDescription>
          Add notes and performance analysis for this route
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg p-4 mb-4">
          <p className="text-muted-foreground italic">
            No notes have been added for this route yet. Use the form below to add notes.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Add Note</label>
            <textarea
              className="w-full min-h-[100px] p-3 border rounded-md"
              placeholder="Add your notes, observations, or performance analysis about this ride..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            ></textarea>
          </div>
          <Button type="submit">Save Note</Button>
        </form>
      </CardContent>
    </Card>
  );
}
