"use client";
import { useState, useEffect, Suspense } from "react";
import { useAuthStore } from "@/store/authZustand";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input, Card } from "@heroui/react";

function LoginPageContent() {
  const { login, loading, error, user } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    if (user) {
      const from = params.get("from") || "/sistema/dashboard";
      router.replace(from);
    }
  }, [user, router, params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email.trim(), password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-200 dark:from-black dark:to-gray-900">
      <Card className="max-w-md w-full p-8 border border-default-200">
        <h1 className="text-2xl font-semibold mb-1 text-center">Entrar</h1>
        <p className="text-sm text-center mb-6 text-gray-500">
          Acesse o sistema ERP
        </p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            type="email"
            label="Email"
            variant="bordered"
            value={email}
            onValueChange={setEmail}
            autoComplete="email"
            isRequired
          />
          <Input
            type="password"
            label="Senha"
            variant="bordered"
            value={password}
            onValueChange={setPassword}
            autoComplete="current-password"
            isRequired
          />
          {error && <p className="text-danger text-sm -mt-2">{error}</p>}
          <Button
            type="submit"
            color="primary"
            className="w-full"
            isLoading={loading}
            isDisabled={!email || !password || loading}
          >
            Entrar
          </Button>
        </form>
        <div className="mt-6 text-xs text-center text-gray-500">
          © {new Date().getFullYear()} Autorizada SYS
        </div>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
