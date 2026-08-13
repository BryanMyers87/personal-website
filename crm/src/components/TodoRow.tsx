"use client";

import { useTransition } from "react";
import { format, isPast } from "date-fns";
import { clsx } from "clsx";
import { Trash2 } from "lucide-react";
import { toggleTodo, deleteTodo } from "@/actions/todos";
import { Card } from "@/components/ui";

export type TodoItemData = {
  id: string;
  text: string;
  dueAt: Date | string | null;
};

export default function TodoRow({ todo }: { todo: TodoItemData }) {
  const [isPending, startTransition] = useTransition();
  const overdue = todo.dueAt ? isPast(new Date(todo.dueAt)) : false;

  function handleDelete() {
    if (!window.confirm("Delete this to-do?")) return;
    startTransition(() => deleteTodo(todo.id));
  }

  return (
    <Card className="flex items-center justify-between gap-3 p-3">
      <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          disabled={isPending}
          onChange={(e) => startTransition(() => toggleTodo(todo.id, e.target.checked))}
          className="mt-1"
        />
        <span className="min-w-0">
          <p className="text-sm">{todo.text}</p>
          {todo.dueAt && (
            <p className={clsx("text-xs", overdue ? "font-medium text-red-600 dark:text-red-400" : "text-zinc-400")}>
              {format(new Date(todo.dueAt), "PP")}
              {overdue ? " · Overdue" : ""}
            </p>
          )}
        </span>
      </label>
      <button
        type="button"
        disabled={isPending}
        onClick={handleDelete}
        aria-label="Delete to-do"
        className="shrink-0 text-zinc-400 transition-colors hover:text-red-600 disabled:opacity-50 dark:hover:text-red-400"
      >
        <Trash2 size={14} />
      </button>
    </Card>
  );
}
