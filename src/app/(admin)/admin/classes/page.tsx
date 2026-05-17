"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, GripVertical, Loader2, ChevronDown, ChevronRight, Tag, X, Check,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ── Types ──────────────────────────────────────────────────────────────────────

interface ClassSection {
  id: number;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

interface SchoolClass {
  id: number;
  name: string;
  sortOrder: number;
  isActive: boolean;
  sections: ClassSection[];
}

interface ClassFormState {
  name: string;
  sortOrder: string;
  isActive: boolean;
}

// ── Inline section add row ────────────────────────────────────────────────────

function AddSectionRow({ classId, onDone }: { classId: number; onDone: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/v1/admin/classes/${classId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).message ?? "Failed");
        return r.json();
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["school-classes"] });
      setName("");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <Input
        autoFocus
        className="h-7 text-xs flex-1"
        placeholder="Section name (e.g. A, B, Science)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && name.trim()) createMutation.mutate();
          if (e.key === "Escape") onDone();
        }}
      />
      <Button
        size="icon" variant="ghost" className="size-7"
        disabled={!name.trim() || createMutation.isPending}
        onClick={() => createMutation.mutate()}
      >
        {createMutation.isPending ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
      </Button>
      <Button size="icon" variant="ghost" className="size-7" onClick={onDone}>
        <X className="size-3" />
      </Button>
    </div>
  );
}

// ── Editable section chip ─────────────────────────────────────────────────────

function SectionChip({ section, classId }: { section: ClassSection; classId: number }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(section.name);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<{ name: string; is_active: boolean }>) =>
      fetch(`/api/v1/admin/classes/${classId}/sections/${section.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).message ?? "Failed");
        return r.json();
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["school-classes"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/v1/admin/classes/${classId}/sections/${section.id}`, { method: "DELETE" })
        .then(async (r) => {
          if (!r.ok) throw new Error((await r.json()).message ?? "Failed");
          return r.json();
        }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["school-classes"] });
      setConfirmDelete(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1 border rounded px-1.5 py-0.5 bg-background">
        <Input
          autoFocus
          className="h-5 text-xs w-20 border-0 p-0 focus-visible:ring-0"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) {
              updateMutation.mutate({ name: name.trim() });
              setEditing(false);
            }
            if (e.key === "Escape") { setName(section.name); setEditing(false); }
          }}
        />
        <button
          className="text-muted-foreground hover:text-foreground"
          onClick={() => { if (name.trim()) { updateMutation.mutate({ name: name.trim() }); } setEditing(false); }}
        >
          <Check className="size-2.5" />
        </button>
        <button className="text-muted-foreground hover:text-foreground" onClick={() => { setName(section.name); setEditing(false); }}>
          <X className="size-2.5" />
        </button>
      </span>
    );
  }

  return (
    <>
      <span
        className={`group inline-flex items-center gap-1 text-xs rounded px-2 py-0.5 cursor-pointer border transition-colors ${
          section.isActive
            ? "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
            : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
        }`}
        title={section.isActive ? "Active — click to rename" : "Inactive"}
        onClick={() => setEditing(true)}
      >
        {section.name}
        <button
          className="opacity-60 group-hover:opacity-100 transition-opacity ml-0.5 hover:text-destructive"
          onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
        >
          <X className="size-2.5" />
        </button>
      </span>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete section "{section.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Existing student records with this section will keep the value but new enrollments
              won't see it as an option.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

const BLANK: ClassFormState = { name: "", sortOrder: "0", isActive: true };

export default function ClassesPage() {
  const qc = useQueryClient();
  const [classForm, setClassForm] = useState<ClassFormState | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [addingSectionFor, setAddingSectionFor] = useState<number | null>(null);

  const { data, isLoading } = useQuery<{ classes: SchoolClass[] }>({
    queryKey: ["school-classes"],
    queryFn: () => fetch("/api/v1/admin/classes").then((r) => r.json()),
  });
  const classes = data?.classes ?? [];

  const saveMutation = useMutation({
    mutationFn: async (body: ClassFormState) => {
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
      setClassForm(null);
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
    setClassForm({ ...BLANK, sortOrder: String(classes.length) });
  }

  function openEdit(cls: SchoolClass) {
    setEditingId(cls.id);
    setClassForm({ name: cls.name, sortOrder: String(cls.sortOrder), isActive: cls.isActive });
  }

  function toggleExpand(id: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const active = classes.filter((c) => c.isActive);
  const inactive = classes.filter((c) => !c.isActive);
  const deleteTarget = classes.find((c) => c.id === deleteId);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
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
            {classes.map((cls) => {
              const expanded = expandedIds.has(cls.id);
              return (
                <div key={cls.id}>
                  {/* Class row */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <GripVertical className="size-4 text-muted-foreground/40 shrink-0" />

                    {/* Expand toggle */}
                    <button
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={() => toggleExpand(cls.id)}
                      title={expanded ? "Collapse sections" : "Expand sections"}
                    >
                      {expanded
                        ? <ChevronDown className="size-4" />
                        : <ChevronRight className="size-4" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{cls.name}</span>
                        {cls.sections.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {cls.sections.length} section{cls.sections.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
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
                      title="View class detail & subjects"
                      asChild
                    >
                      <Link href={`/admin/classes/${cls.id}`}>
                        <ExternalLink className="size-3.5" />
                      </Link>
                    </Button>
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

                  {/* Sections panel */}
                  {expanded && (
                    <div className="border-t bg-muted/20 px-10 py-3 space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="size-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sections</span>
                      </div>

                      <div className="flex flex-wrap gap-2 items-center">
                        {cls.sections.length === 0 && addingSectionFor !== cls.id && (
                          <span className="text-xs text-muted-foreground">No sections yet.</span>
                        )}
                        {cls.sections.map((sec) => (
                          <SectionChip key={sec.id} section={sec} classId={cls.id} />
                        ))}
                        {addingSectionFor !== cls.id && (
                          <button
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground border border-dashed rounded px-2 py-0.5 hover:text-foreground hover:border-foreground transition-colors"
                            onClick={() => setAddingSectionFor(cls.id)}
                          >
                            <Plus className="size-3" /> Add section
                          </button>
                        )}
                      </div>

                      {addingSectionFor === cls.id && (
                        <AddSectionRow
                          classId={cls.id}
                          onDone={() => setAddingSectionFor(null)}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          These class names are used across the system — in admission applications, fee configuration, and student enrollment.
          Active classes appear in the admission apply form. Sections within a class are available when enrolling students.
        </p>
      </div>

      {/* Add / Edit Class Dialog */}
      <Dialog
        open={classForm !== null}
        onOpenChange={(o) => { if (!o) { setClassForm(null); setEditingId(null); } }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Class" : "Add Class"}</DialogTitle>
          </DialogHeader>

          {classForm && (
            <div className="space-y-4 py-1">
              <div className="space-y-1.5">
                <Label className="text-xs">Class Name</Label>
                <Input
                  placeholder="e.g. Class 6, Nursery, KG"
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && saveMutation.mutate(classForm!)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Sort Order</Label>
                <Input
                  type="number" min="0"
                  value={classForm.sortOrder}
                  onChange={(e) => setClassForm({ ...classForm, sortOrder: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Lower numbers appear first.</p>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={classForm.isActive}
                  onCheckedChange={(v) => setClassForm({ ...classForm, isActive: v })}
                />
                <Label>Active (visible in admission forms)</Label>
              </div>
              <Button
                className="w-full"
                disabled={saveMutation.isPending || !classForm.name.trim()}
                onClick={() => saveMutation.mutate(classForm!)}
              >
                {saveMutation.isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                {editingId ? "Save Changes" : "Add Class"}
              </Button>
              {editingId && (
                <p className="text-xs text-muted-foreground text-center">
                  Manage sections by expanding the class row in the list.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Class Confirm */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(o) => { if (!o) setDeleteId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the class and all its sections. Existing student records
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
