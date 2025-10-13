import { supabase } from "./supabaseClient";
import { supabaseService } from "./supabaseClient";
import { useAuthStore } from "@/store/authZustand";

/**
 * Deleta um registro de qualquer tabela do Supabase.
 * Se tiver fotos (fotourl), também remove do storage.
 * @param table Nome da tabela
 * @param id Valor do campo identificador
 * @param key Campo usado como identificador ('id', 'uuid', etc.)
 * @param ip IP do usuário (opcional)
 * @param userAgent User agent do navegador (opcional)
 */
export async function deleteTable(
  table: string,
  id: string | number,
  key: string = "id",
  ip?: string,
  userAgent?: string
) {
  const identifier = table === "usuarios" ? "uuid" : key;

  // Pega o usuário atual do store
  const currentUser = useAuthStore.getState().user;
  const usuarioId = currentUser?.id || null;

  console.log("🔍 Iniciando deleteTable:", {
    table,
    id,
    identifier,
    usuarioId,
  });

  // Configura o usuario_id na sessão do banco para o trigger usar
  if (usuarioId) {
    try {
      await supabase.rpc("set_config", {
        setting: "app.current_user_id",
        value: usuarioId,
      });
      console.log("✅ Usuario ID configurado na sessão:", usuarioId);
    } catch (error) {
      console.warn("⚠️ Não foi possível configurar usuario_id:", error);
    }
  }

  // Busca os dados do registro antes de deletar para o log
  let dadosAnteriores: any = null;
  try {
    const { data: record, error: fetchError } = await supabase
      .from(table)
      .select("*")
      .eq(identifier, id)
      .maybeSingle();

    if (!fetchError && record) {
      dadosAnteriores = record;
      console.log("✅ Dados anteriores capturados:", dadosAnteriores);
    } else if (fetchError) {
      console.warn("⚠️ Erro ao buscar dados anteriores:", fetchError);
    } else {
      console.warn("⚠️ Registro não encontrado para logs");
    }
  } catch (e) {
    console.warn("Aviso: não foi possível ler dados antes de deletar:", e);
  }

  // Busca fotourl só se a coluna existir (tabelas que não possuem, ignorar)
  let fotos: string[] = [];
  if (dadosAnteriores?.fotourl && Array.isArray(dadosAnteriores.fotourl)) {
    fotos = dadosAnteriores.fotourl;
  }

  // Remove fotos (se houver) – ignore erros
  if (fotos.length > 0) {
    const fileNames = fotos.map((url: string) => {
      const parts = url.split("/");
      return parts[parts.length - 1].split("?")[0];
    });
    const { error: storageError } = await supabaseService.storage
      .from(table)
      .remove(fileNames);
    if (storageError) {
      console.warn("Falha ao remover arquivos do storage:", storageError);
    }
  }

  // Executa DELETE sem .select() para não exigir policy de SELECT
  const { error: delError } = await supabase
    .from(table)
    .delete()
    .eq(identifier, id);

  if (delError) {
    console.error("❌ Erro ao deletar registro:", delError);
    // Recria erro mais verboso
    throw {
      message: delError.message,
      details: delError.details,
      hint: delError.hint,
      code: delError.code,
    };
  }

  console.log("✅ Registro deletado com sucesso");

  // Log será criado automaticamente pelo trigger do banco de dados
  // Não é necessário criar log manualmente aqui

  return { success: true, id };
}
