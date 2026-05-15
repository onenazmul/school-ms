"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, GripVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SchoolClass {
  id: number;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

interface FormState {
  name: string;
  sortOrder: string;
  isActive: boolean;
}

const BLANK: FormState = { name: "", sortOrder: "0", isActive: true };

export default function ClassesPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data, isLoading } = useQuery<{ classes: SchoolClass[] }>({
    queryKey: ["school-classes"],
    queryFn: () => fetch("/api/v1/admin/classes").then((r) => r.json()),
  });
  const classes = data?.classes ?? [];

  const saveMutation = useMutation({
    mutationFn: async (body: FormState) => {
      const url = editingId ? `/api/v1/admin/classes/${editingId}` : "/api/v1/admin/classes";
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: body.name.trim(),
          sort_order: Number(body.sortOrder) || 0,
          is_active: body.isActive,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["school-classes"] });
      setForm(null);
      setEditingId(null);
      toast.success(editingId ? "Class updated" : "Class added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      fetch(`/api/v1/admin/classes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: isActive }),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["school-classes"] }),
    onError: () => toast.error("Failed to update"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/v1/admin/classes/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["school-classes"] });
      setDeleteId(null);
      toast.success("Class deleted");
    },
    onError: () => toast.error("Failed to delete"),
  });

  function openNew() {
    setEditingId(null);
    setForm({ ...BLANK, sortOrder: String(classes.length) });
  }

  function openEdit(cls: SchoolClass) {
    setEditingId(cls.id);
    setForm({ name: cls.name, sortOrder: String(cls.sortOrder), isActive: cls.isActive });
  }

  const active = classes.filter((c) => c.isActive);
  const inactive = classes.filter((c) => !c.isActive);
  const deleteTarget = classes.find((c) => c.id === deleteId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">Classes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {active.length} active · {inactive.length} inactive
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={openNew}>
          <Plus className="size-4" /> Add Class
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
          <Loader2 className="size-4 animate-spin" /> Loading classes…
        </div>
      ) : classes.length === 0 ? (
        <div className="rounded-xl border bg-background p-10 text-center text-sm text-muted-foreground">
          No classes yet. Add your first class to get started.
        </div>
      ) : (
        <div className="rounded-xl border bg-background divide-y">
          {classes.map((cls) => (
            <div key={cls.id} className="flex items-center gap-3 px-4 py-3">
              <GripVertical className="size-4 text-muted-foreground/40 shrink-0" />

              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm">{cls.name}</span>
                {cls.sortOrder > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    order: {cls.sortOrder}
                  </span>
                )}
              </div>

              <Badge
                variant={cls.isActive ? "default" : "secondary"}
                className={cls.isActive ? "bg-green-600 text-white" : ""}
              >
                {cls.isActive ? "Active" : "Inactive"}
              </Badge>

              <Switch
                checked={cls.isActive}
                onCheckedChange={(v) => toggleMutation.mutate({ id: cls.id, isActive: v })}
                className="shrink-0"
              />

              <Button
                variant="ghost" size="icon" className="size-8 shrink-0"
                onClick={() => openEdit(cls)}
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                variant="ghost" size="icon"
                className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => setDeleteId(cls.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        These class names are used across the system — in admission applications, fee configuration, and student enrollment.
        Active classes appear in the admission apply form and can be selected in admission settings.
      </p>

      {/* Add / Edit Dialog */}
      <Dialog
        open={form !== null}
        onOpenChange={(o) => { if (!o) { setForm(null); setEditingId(null); } }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Class" : "Add Class"}</DialogTitle>
          </DialogHeader>

          {form && (
            <div className="space-y-4 py-1">
              <div className="space-y-1.5">
                <Label className="text-xs">Class Name</Label>
                <Input
                  placeholder="e.g. Class 6, Nursery, KG"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && saveMutation.mutate(form!)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Sort Order</Label>
                <Input
                  type="number" min="0"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Lower numbers appear first.</p>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                />
                <Label>Active (visible in admission forms)</Label>
              </div>
              <Button
                className="w-full"
                disabled={saveMutation.isPending || !form.name.trim()}
                onClick={() => saveMutation.mutate(form!)}
              >
                {saveMutation.isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                {editingId ? "Save Changes" : "Add Class"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(o) => { if (!o) setDeleteId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the class from the list. Existing applications and student records
              that reference this class name will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
