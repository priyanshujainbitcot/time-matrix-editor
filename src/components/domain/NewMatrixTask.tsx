"use client";

import { X } from "lucide-react";

interface NewMatrixTaskProps {
  quadrantNumber: 1 | 2 | 3 | 4;
  title: string;
  onTitleChange: (title: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function NewMatrixTask({
  quadrantNumber,
  title,
  onTitleChange,
  onKeyDown,
  onSave,
  onCancel,
}: NewMatrixTaskProps) {
  const remaining = 120 - title.length;

  return (
    <div className="flex flex-col gap-1.5 p-1 bg-background rounded-lg border border-blue-400 shadow-xs">
      <div className="flex items-center gap-1.5 min-w-0">
        <input
          autoFocus
          type="text"
          value={title}
          onChange={(e) => {
            if (e.target.value.length <= 120) onTitleChange(e.target.value);
          }}
          onKeyDown={onKeyDown}
          placeholder="Type task title..."
          maxLength={120}
          aria-label={`New task for quadrant ${quadrantNumber}`}
          className="flex-1 min-w-0 text-xs sm:text-sm bg-transparent px-2 py-1 outline-none text-foreground pr-10"
        />
        <span className={`text-[10px] font-medium tabular-nums shrink-0 ${
          remaining <= 15 ? "text-red-500" : remaining <= 30 ? "text-amber-500" : "text-muted-foreground"
        }`}>
          {remaining}
        </span>
        <button
          onClick={onSave}
          disabled={!title.trim()}
          className="px-2.5 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-white rounded-md transition-colors cursor-pointer"
        >
          Add
        </button>
        <button
          onClick={onCancel}
          className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors cursor-pointer"
          title="Cancel"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
