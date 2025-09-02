"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabaseClient";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface PermissoesAcessos {
  dashboard: {
    ver_dashboard: boolean;
    ver_relatorios: boolean;
    exportar_dados: boolean;
  };
  clientes: {
    criar_clientes: boolean;
    ver_clientes: boolean;
    editar_clientes: boolean;
    deletar_clientes: boolean;
  };
  ordens: {
    criar_ordens: boolean;
    ver_ordens: boolean;
    pdf_ordens: boolean;
    editar_ordens: boolean;
    deletar_ordens: boolean;
  };
  estoque: {
    criar_estoque: boolean;
    ver_estoque: boolean;
    editar_estoque: boolean;
    deletar_estoque: boolean;
  };
  fornecedores: {
    criar_fornecedores: boolean;
    ver_fornecedores: boolean;
    editar_fornecedores: boolean;
    deletar_fornecedores: boolean;
  };
  usuarios: {
    criar_usuarios: boolean;
    ver_usuarios: boolean;
    editar_usuarios: boolean;
    deletar_usuarios: boolean;
  };
  vendas: {
    criar_vendas: boolean;
    ver_vendas: boolean;
    editar_vendas: boolean;
    deletar_vendas: boolean;
    processar_pagamentos: boolean;
  };
  logs: {
    ver_logs: boolean;
    exportar_logs: boolean;
    filtrar_logs: boolean;
    ver_detalhes_logs: boolean;
  };
  lojas: {
    criar_lojas: boolean;
    ver_lojas: boolean;
    editar_lojas: boolean;
    deletar_lojas: boolean;
  };
  transferencias: {
    criar_transferencias: boolean;
    ver_transferencias: boolean;
    editar_transferencias: boolean;
    deletar_transferencias: boolean;
    confirmar_transferencias: boolean;
  };
  devolucoes: {
    criar_devolucoes: boolean;
    ver_devolucoes: boolean;
    editar_devolucoes: boolean;
    deletar_devolucoes: boolean;
    processar_creditos: boolean;
  };
}

export interface AppUser {
  id: string;
  email?: string | null;
  nome?: string | null;
  cargo?: string | null;
  fotourl?: string | null;
  permissoes?: { acessos: PermissoesAcessos } | null; // <- adiciona
}

function defaultPermissoes(): { acessos: PermissoesAcessos } {
  return {
    acessos: {
      dashboard: {
        ver_dashboard: false,
        ver_relatorios: false,
        exportar_dados: false,
      },
      clientes: {
        criar_clientes: false,
        ver_clientes: false,
        editar_clientes: false,
        deletar_clientes: false,
      },
      ordens: {
        criar_ordens: false,
        ver_ordens: false,
        pdf_ordens: false,
        editar_ordens: false,
        deletar_ordens: false,
      },
      estoque: {
        criar_estoque: false,
        ver_estoque: false,
        editar_estoque: false,
        deletar_estoque: false,
      },
      fornecedores: {
        criar_fornecedores: false,
        ver_fornecedores: false,
        editar_fornecedores: false,
        deletar_fornecedores: false,
      },
      usuarios: {
        criar_usuarios: false,
        ver_usuarios: false,
        editar_usuarios: false,
        deletar_usuarios: false,
      },
      vendas: {
        criar_vendas: false,
        ver_vendas: false,
        editar_vendas: false,
        deletar_vendas: false,
        processar_pagamentos: false,
      },
      logs: {
        ver_logs: false,
        exportar_logs: false,
        filtrar_logs: false,
        ver_detalhes_logs: false,
      },
      lojas: {
        criar_lojas: false,
        ver_lojas: false,
        editar_lojas: false,
        deletar_lojas: false,
      },
      transferencias: {
        criar_transferencias: false,
        ver_transferencias: false,
        editar_transferencias: false,
        deletar_transferencias: false,
        confirmar_transferencias: false,
      },
      devolucoes: {
        criar_devolucoes: false,
        ver_devolucoes: false,
        editar_devolucoes: false,
        deletar_devolucoes: false,
        processar_creditos: false,
      },
    },
  };
}

interface AuthState {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
  realtimeChannel: RealtimeChannel | null;
  login: (email: string, password: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  setUser: (u: AppUser | null) => void;
  refreshPermissoes: () => Promise<void>;
  setPermissoes: (p: { acessos: PermissoesAcessos } | null) => void;
  startRealtimeListener: () => void;
  stopRealtimeListener: () => void;
}

async function fetchOrInitPermissoes(userId: string) {
  // Tenta buscar
  const { data, error } = await supabase
    .from("permissoes")
    .select("acessos")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.warn("Erro buscando permissões:", error.message);
  }

  const def = defaultPermissoes();

  if (data?.acessos) {
    // Merge das permissões existentes com a nova estrutura
    const permissoesExistentes = data.acessos;
    const permissoesMerged = { ...def.acessos };

    // Para cada seção nas permissões default
    (Object.keys(def.acessos) as Array<keyof PermissoesAcessos>).forEach(
      (secao) => {
        if (permissoesExistentes[secao]) {
          // Se a seção já existe, merge as permissões
          permissoesMerged[secao] = {
            ...def.acessos[secao],
            ...permissoesExistentes[secao],
          };
        }
        // Se não existe, mantém os valores default (false)
      }
    );

    return { acessos: permissoesMerged };
  }

  // Cria default se não existir
  const { error: upErr } = await supabase
    .from("permissoes")
    .upsert({ id: userId, acessos: def.acessos }, { onConflict: "id" });
  if (upErr) {
    console.warn("Falha ao criar permissões default:", upErr.message);
    return def;
  }
  return def;
}

function writePermsCookie(perms: { acessos: PermissoesAcessos } | null) {
  if (!perms) {
    document.cookie = "perms=; path=/; max-age=0";
    return;
  }
  const raw = encodeURIComponent(JSON.stringify(perms.acessos));
  // 7 dias
  document.cookie = `perms=${raw}; path=/; max-age=${60 * 60 * 24 * 7}`;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      loading: false,
      error: null,
      realtimeChannel: null,
      setUser: (u) => set({ user: u }),
      setPermissoes: (p) => {
        const cur = get().user;
        if (cur) {
          const updated = { ...cur, permissoes: p };
          writePermsCookie(p);
          set({ user: updated });
        }
      },
      refreshPermissoes: async () => {
        const cur = get().user;
        if (!cur) return;
        try {
          const perms = await fetchOrInitPermissoes(cur.id);
          get().setPermissoes(perms);
        } catch (e) {
          console.warn("refreshPermissoes falhou:", e);
        }
      },
      startRealtimeListener: () => {
        const cur = get().user;
        if (!cur?.id) return;

        // Para o listener anterior se existir
        get().stopRealtimeListener();

        const channel = supabase
          .channel("permissoes_changes")
          .on(
            "postgres_changes",
            {
              event: "*", // INSERT, UPDATE, DELETE
              schema: "public",
              table: "permissoes",
              filter: `id=eq.${cur.id}`, // Só mudanças do usuário atual
            },
            (payload) => {
              console.log("Permissões alteradas em tempo real:", payload);

              if (payload.eventType === "DELETE") {
                // Se permissões foram deletadas, usar defaults
                const def = defaultPermissoes();
                get().setPermissoes(def);
              } else if (payload.new?.acessos) {
                // UPDATE ou INSERT
                get().setPermissoes({ acessos: payload.new.acessos });
              }
            }
          )
          .subscribe((status) => {
            console.log("Status do realtime permissões:", status);
          });

        set({ realtimeChannel: channel });
      },
      stopRealtimeListener: () => {
        const channel = get().realtimeChannel;
        if (channel) {
          supabase.removeChannel(channel);
          set({ realtimeChannel: null });
        }
      },
      login: async (email, password) => {
        set({ loading: true, error: null });
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          set({ loading: false, error: error.message });
          return;
        }
        const supaUser = data.user;
        if (!supaUser) {
          set({ loading: false, error: "Usuário inválido" });
          return;
        }
        const meta = supaUser.user_metadata || {};
        // Busca/gera permissões
        let perms: { acessos: PermissoesAcessos } | null = null;
        try {
          perms = await fetchOrInitPermissoes(supaUser.id);
        } catch (e) {
          console.warn("Erro carregando permissões no login:", e);
        }
        const user: AppUser = {
          id: supaUser.id,
          email: supaUser.email,
          nome: meta.nome || meta.full_name || supaUser.email?.split("@")[0],
          cargo: meta.cargo || "Usuário",
          fotourl: meta.fotourl || meta.avatar_url || null,
          permissoes: perms,
        };
        document.cookie = `auth=1; path=/; max-age=${60 * 60 * 24 * 7}`;
        writePermsCookie(perms);
        set({ user, loading: false });

        // Inicia listener de tempo real após login
        get().startRealtimeListener();
      },
      clearAuth: async () => {
        // Para listener antes de limpar
        get().stopRealtimeListener();

        try {
          await supabase.auth.signOut();
        } catch {}
        document.cookie = "auth=; path=/; max-age=0";
        document.cookie = "perms=; path=/; max-age=0";
        set({ user: null, error: null, loading: false });
      },
    }),
    {
      name: "auth-storage",
      partialize: (s) => ({ user: s.user }),
    }
  )
);
