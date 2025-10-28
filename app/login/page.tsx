"use client";
import { useState, useEffect, Suspense } from "react";
import { useAuthStore } from "@/store/authZustand";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input, Card } from "@heroui/react";
import { supabase } from "@/lib/supabaseClient";

function LoginPageContent() {
  const { login, loading, error, user, clearAuth } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();
  const params = useSearchParams();

  // Limpar tokens inválidos ao carregar a página
  useEffect(() => {
    const checkAndClearInvalidTokens = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          // Se houver erro ao verificar sessão, limpar tudo
          console.warn(
            "Erro ao verificar sessão, limpando tokens:",
            error.message
          );
          await clearAuth();

          // Limpar localStorage manualmente
          localStorage.removeItem("supabase.auth.token");

          // Limpar todos os itens do Supabase do localStorage
          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith("sb-")) {
              localStorage.removeItem(key);
            }
          });
        } else if (!data.session && user) {
          // Se não há sessão mas há usuário no store, limpar
          console.warn("Sessão inválida detectada, limpando...");
          await clearAuth();
        }
      } catch (e) {
        console.error("Erro ao verificar tokens:", e);
        await clearAuth();
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAndClearInvalidTokens();
  }, []);

  useEffect(() => {
    if (user && !isCheckingAuth) {
      const from = params.get("from");

      if (from) {
        // Se veio de uma página específica, vai para lá
        router.replace(from);
        return;
      }

      // Lista de rotas em ordem de prioridade
      const routeChecks = [
        {
          path: "/sistema/dashboard",
          permission: user?.permissoes?.acessos?.dashboard?.ver_dashboard,
        },
        {
          path: "/sistema/clientes",
          permission: user?.permissoes?.acessos?.clientes?.ver_clientes,
        },
        {
          path: "/sistema/ordens",
          permission: user?.permissoes?.acessos?.ordens?.ver_ordens,
        },
        {
          path: "/sistema/estoque",
          permission: user?.permissoes?.acessos?.estoque?.ver_estoque,
        },
        {
          path: "/sistema/vendas",
          permission: user?.permissoes?.acessos?.vendas?.ver_vendas,
        },
        { path: "/sistema/aparelhos", permission: true }, // Aparelhos sempre acessível
        {
          path: "/sistema/fornecedores",
          permission: user?.permissoes?.acessos?.fornecedores?.ver_fornecedores,
        },
        {
          path: "/sistema/usuarios",
          permission: user?.permissoes?.acessos?.usuarios?.ver_usuarios,
        },
        {
          path: "/sistema/logs",
          permission: user?.permissoes?.acessos?.logs?.ver_logs,
        },
        {
          path: "/sistema/lojas",
          permission: user?.permissoes?.acessos?.lojas?.ver_lojas,
        },
        {
          path: "/sistema/transferencia",
          permission:
            user?.permissoes?.acessos?.transferencias?.ver_transferencias,
        },
        {
          path: "/sistema/devolucoes",
          permission: user?.permissoes?.acessos?.devolucoes?.ver_devolucoes,
        },
        {
          path: "/sistema/rma",
          permission: user?.permissoes?.acessos?.rma?.ver_rma,
        },
        {
          path: "/sistema/caixa",
          permission: user?.permissoes?.acessos?.caixa?.ver_caixa,
        },
      ];

      // Encontra a primeira rota que o usuário tem permissão
      const firstAllowedRoute = routeChecks.find(
        (route) => route.permission === true
      );

      if (firstAllowedRoute) {
        router.replace(firstAllowedRoute.path);
      } else {
        // Se não tem permissão para nada, redireciona para página base do sistema
        router.replace("/sistema");
      }
    }
  }, [user, router, params, isCheckingAuth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email.trim(), password);
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-200 dark:from-black dark:to-gray-900">
        <Card className="max-w-md w-full p-8 border border-default-200">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-default-500">
              Verificando autenticação...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-200 dark:from-black dark:to-gray-900">
      <Card className="max-w-md w-full p-8 border border-default-200">
        <h1 className="text-2xl font-semibold mb-1 text-center">Entrar</h1>
        <p className="text-sm text-center mb-6 text-gray-500">
          Acesse o sistema ERP
        </p>
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <Input
            type="text"
            label="Email ou Nickname"
            variant="bordered"
            value={email}
            onValueChange={setEmail}
            autoComplete="username"
            isRequired
            description="Digite seu email ou nickname"
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
