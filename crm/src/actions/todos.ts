"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createTodo(text: string, dueAt?: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;
  const due = dueAt ? new Date(dueAt) : null;

  await prisma.todoItem.create({ data: { text: trimmed, dueAt: due && !Number.isNaN(due.getTime()) ? due : null } });
  revalidatePath("/this-week");
}

export async function toggleTodo(id: string, completed: boolean): Promise<void> {
  await prisma.todoItem.update({
    where: { id },
    data: { completedAt: completed ? new Date() : null },
  });
  revalidatePath("/this-week");
}

export async function deleteTodo(id: string): Promise<void> {
  await prisma.todoItem.delete({ where: { id } });
  revalidatePath("/this-week");
}
