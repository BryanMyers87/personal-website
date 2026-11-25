import { Card } from "@/components/ui";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card className="w-full max-w-sm p-6">
        <h1 className="mb-1 text-lg font-semibold">Inflate AI CRM</h1>
        <p className="mb-5 text-sm text-zinc-500 dark:text-zinc-400">Enter the password to continue.</p>
        <LoginForm />
      </Card>
    </div>
  );
}
