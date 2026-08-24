"use client";

import { Pencil, Trash2, Check, X } from "lucide-react";
import type { Task } from "@/store/slices/tasksSlice";

const MAX_TITLE_LENGTH = 120;

interface MatrixTaskCardProps {
  task: Task;
  isEditing: boolean;
  editingTitle: string;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void;
  onDragEnd: () => void;
  onStartEdit: (id: string, title: string) => void;
  onEditingTitleChange: (title: string) => void;
  onEditKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onConfirmEdit: () => void;
  onCancelEdit: () => void;
  onToggleStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

export default function MatrixTaskCard({
  task,
  isEditing,
  editingTitle,
  onDragStart,
  onDragEnd,
  onStartEdit,
  onEditingTitleChange,
  onEditKeyDown,
  onConfirmEdit,
  onCancelEdit,
  onToggleStatus,
  onDelete,
}: MatrixTaskCardProps) {
  const remaining = MAX_TITLE_LENGTH - editingTitle.length;

  return (
    <div
      draggable={!isEditing}
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
      className="group/item rounded-lg px-2.5 py-1.5 bg-muted/70 hover:bg-accent border border-border transition-all flex items-center gap-2 cursor-grab active:cursor-grabbing"
    >
      {isEditing ? (
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <input
            autoFocus
            type="text"
            value={editingTitle}
            onChange={(e) => {
              if (e.target.value.length <= MAX_TITLE_LENGTH) {
                onEditingTitleChange(e.target.value);
              }
            }}
            onKeyDown={onEditKeyDown}
            maxLength={MAX_TITLE_LENGTH}
            className="flex-1 min-w-0 text-xs sm:text-sm bg-background px-2 py-1 rounded-md border border-blue-400 outline-none text-foreground pr-10"
          />
          <span className={`text-[10px] font-medium tabular-nums shrink-0 ${
            remaining <= 15 ? "text-red-500" : remaining <= 30 ? "text-amber-500" : "text-muted-foreground"
          }`}>
            {remaining}
          </span>
          <button onClick={onConfirmEdit} className="p-1 text-green-600 hover:bg-green-50 rounded cursor-pointer" title="Save">
            <Check size={14} strokeWidth={2.5} />
          </button>
          <button onClick={onCancelEdit} className="p-1 text-muted-foreground hover:bg-accent rounded cursor-pointer" title="Cancel">
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>
      ) : (
        <>
          <input
            type="checkbox"
            checked={task.status === "done"}
            onChange={() => onToggleStatus(task.id, task.status)}
            className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
          />
          <span className={`text-xs sm:text-sm flex-1 min-w-0 leading-snug break-all overflow-wrap-anywhere transition-all ${
            task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"
          }`}>
            {task.title}
          </span>
          <div className="flex items-center gap-0.5 opacity-100 shrink-0">
            <button onClick={() => onStartEdit(task.id, task.title)} className="p-1 text-muted-foreground hover:text-blue-600 hover:bg-accent rounded transition-colors cursor-pointer" title="Edit">
              <Pencil size={12} />
            </button>
            <button onClick={() => onDelete(task.id)} className="p-1 text-muted-foreground hover:text-red-500 hover:bg-accent rounded transition-colors cursor-pointer" title="Delete">
              <Trash2 size={12} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
