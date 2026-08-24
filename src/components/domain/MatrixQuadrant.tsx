"use client";

import { useState, useMemo, useCallback } from "react";
import { Plus } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addTask,
  editTask,
  moveTask,
  deleteTask,
  updateTaskStatus,
  addToUndoStack,
} from "@/store/slices/tasksSlice";
import { createTask, db } from "@/services/databaseService";
import Toast, { ToastType } from "@/components/ui/Toast";
import MatrixTaskCard from "@/components/domain/MatrixTaskCard";
import NewMatrixTask from "@/components/domain/NewMatrixTask";

interface MatrixQuadrantProps {
  quadrantNumber: 1 | 2 | 3 | 4;
  title: string;
  actionSubtitle: string;
  
  
  isAdding?: boolean;
  onStartAdding?: () => void;
  onCancelAdding?: () => void;
}

export default function MatrixQuadrant({
  quadrantNumber,
  title,
  actionSubtitle,
  
  isAdding = false,
  onStartAdding,
  onCancelAdding,
}: MatrixQuadrantProps) {
  const dispatch = useAppDispatch();
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{
    type: ToastType;
    message: string;
    visible: boolean;
  }>({
    type: "saved",
    message: "",
    visible: false,
  });

  const showToast = useCallback((type: ToastType, message: string) => {
    setToast({ type, message, visible: true });
  }, []);

  const handleToastDone = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const allTasks = useAppSelector((state) => state.tasks.items);
  const tasks = useMemo(
    () => allTasks.filter((task) => task.quadrant === quadrantNumber),
    [allTasks, quadrantNumber],
  );

  const handleSaveTask = async () => {
    if (newTaskTitle.trim()) {
      try {
        const newTask = await createTask(newTaskTitle.trim(), quadrantNumber);
        dispatch(addTask(newTask));
        setNewTaskTitle("");
        onCancelAdding?.();
      } catch (error) {
        console.error("Failed to create task:", error);
        showToast("error", "Could not create task");
      }
    } else {
      onCancelAdding?.();
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveTask();
    } else if (e.key === "Escape") {
      setNewTaskTitle("");
      onCancelAdding?.();
    }
  };

  const handleStartEdit = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditingTitle(currentTitle);
  };

  const handleConfirmEdit = async () => {
    if (editingId && editingTitle.trim()) {
      try {
        await db.tasks.update(editingId, { title: editingTitle.trim() });
        dispatch(editTask({ id: editingId, title: editingTitle.trim() }));
        showToast("saved", "Task updated");
      } catch (error) {
        console.error("Failed to update task:", error);
        showToast("error", "Could not update task");
      }
    }
    setEditingId(null);
    setEditingTitle("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleConfirmEdit();
    if (e.key === "Escape") handleCancelEdit();
  };

  const handleDeleteClick = async (id: string) => {
    const taskToDelete = allTasks.find((t) => t.id === id);
    if (!taskToDelete) return;

    const deletedAt = Date.now();
    try {
      await db.transaction("rw", db.tasks, db.deletedTasks, async () => {
        await db.deletedTasks.add({
          taskId: taskToDelete.id,
          task: taskToDelete,
          deletedAt,
        });
        await db.tasks.delete(id);
      });
      dispatch(addToUndoStack({ task: taskToDelete, deletedAt }));
      dispatch(deleteTask(id));
    } catch (error) {
      console.error("Failed to delete task:", error);
      showToast("error", "Could not delete task");
      return;
    }

    showToast("deleted", "Task deleted");
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "done" ? "pending" : "done";
    try {
      await db.tasks.update(id, { status: newStatus });
      dispatch(updateTaskStatus({ id, status: newStatus as "pending" | "done" }));
    } catch (error) {
      console.error("Failed to update task status:", error);
      showToast("error", "Could not update task");
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const taskId = e.dataTransfer.getData("text/task-id");
    const task = allTasks.find((item) => item.id === taskId);
    if (!task || task.quadrant === quadrantNumber) return;

    try {
      await db.tasks.update(taskId, { quadrant: quadrantNumber });
      dispatch(moveTask({ id: taskId, quadrant: quadrantNumber }));
      showToast("saved", `Task moved to P${quadrantNumber}`);
    } catch (error) {
      console.error("Failed to move task:", error);
      showToast("error", "Could not move task");
    }
  };

  const quadrantThemes = {
    1: {
      bg: "bg-card",
      border: "border-rose-200/80 hover:border-rose-300",
      qColor: "text-rose-600",
      badge: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-200",
      dot: "bg-rose-500",
      btnHover: "hover:bg-rose-50 hover:text-rose-700",
    },
    2: {
      bg: "bg-card",
      border: "border-rose-200/80 hover:border-rose-300",
      qColor: "text-blue-600",
      badge: "bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/50 dark:text-blue-200",
      dot: "bg-blue-600",
      btnHover: "hover:bg-blue-50 hover:text-blue-700",
    },
    3: {
      bg: "bg-card",
      border: "border-rose-200/80 hover:border-rose-300",
      qColor: "text-amber-600",
      badge: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200",
      dot: "bg-amber-500",
      btnHover: "hover:bg-amber-50 hover:text-amber-700",
    },
    4: {
      bg: "bg-card",
      border: "border-rose-200/80 hover:border-rose-300",
      qColor: "text-slate-500",
      badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200",
      dot: "bg-slate-400",
      btnHover: "hover:bg-slate-100 hover:text-slate-700",
    },
  };

  const theme = quadrantThemes[quadrantNumber];

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`flex flex-col h-full min-h-75 rounded-2xl border ${theme.bg} ${theme.border} p-4 sm:p-5 transition-all shadow-xs relative group ${isDragOver ? "ring-2 ring-blue-500 ring-offset-2" : ""}`}
    >
      <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-border">
        <div className="flex items-baseline gap-2.5">
          <span
            className={`text-3xl sm:text-4xl font-black tracking-tight leading-none ${theme.qColor}`}
          >
            P{quadrantNumber}
          </span>
          <div className="flex flex-col">
            <h3 className="text-xs sm:text-sm font-black text-foreground tracking-wider uppercase leading-tight">
              {title}
            </h3>
            <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium leading-tight mt-0.5">
              {actionSubtitle}
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            if (isAdding) {
              onCancelAdding?.();
            } else {
              setNewTaskTitle("");
              onStartAdding?.();
            }
          }}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-gray-200/80 transition-all cursor-pointer ${
            isAdding
              ? "bg-blue-600 text-white border-blue-600"
              : `bg-muted text-foreground ${theme.btnHover}`
          }`}
          title="Add task"
        >
          <Plus
            size={13}
            strokeWidth={2.5}
            className={
              isAdding
                ? "rotate-45 transition-transform"
                : "transition-transform"
            }
          />
          <span>{isAdding ? "Close" : "Add"}</span>
        </button>
      </div>

      <div className="matrix-scroll flex flex-col grow min-h-0 overflow-y-auto space-y-1.5 pr-1">
        {tasks.map((task) => (
          <MatrixTaskCard
            key={task.id}
            task={task}
            isEditing={editingId === task.id}
            editingTitle={editingTitle}
            onDragStart={(e, taskId) => {
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/task-id", taskId);
            }}
            onDragEnd={() => setIsDragOver(false)}
            onStartEdit={handleStartEdit}
            onEditingTitleChange={setEditingTitle}
            onEditKeyDown={handleEditKeyDown}
            onConfirmEdit={handleConfirmEdit}
            onCancelEdit={handleCancelEdit}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDeleteClick}
          />
        ))}

        {isAdding && (
          <NewMatrixTask
            quadrantNumber={quadrantNumber}
            title={newTaskTitle}
            onTitleChange={setNewTaskTitle}
            onKeyDown={handleInputKeyDown}
            onSave={handleSaveTask}
            onCancel={() => {
              setNewTaskTitle("");
              onCancelAdding?.();
            }}
          />
        )}
        <div
          className={`mt-auto pt-3 ${tasks.length > 0 ? "border-t border-border" : ""}`}
        >

        </div>
      </div>

      <Toast
        type={toast.type}
        message={toast.message}
        visible={toast.visible}
        onDone={handleToastDone}
      />
    </div>
  );
}
