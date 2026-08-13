"use client";

import { useState, useTransition } from "react";
import { createTodo } from "@/actions/todos";
import { Button } from "@/components/ui";
import TodoRow, { type TodoItemData } from "@/components/TodoRow";

export default function TodoList({ todos }: { todos: TodoItemData[] }) {
  const [text, setText] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText("");
    setDueAt("");
    startTransition(() => {
      createTodo(trimmed, dueAt || undefined);
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          placeholder="New project or check-in…"
          className="w-full flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
          type="date"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <Button type="button" disabled={isPending || !text.trim()} onClick={handleAdd}>
          Add
        </Button>
      </div>

      {todos.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Nothing on the to-do list.</p>
      ) : (
        <div className="space-y-2">
          {todos.map((todo) => (
            <TodoRow key={todo.id} todo={todo} />
          ))}
        </div>
      )}
    </div>
  );
}
