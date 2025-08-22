import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/store/authZustand";

/**
 * Atualiza dados em qualquer tabela do Supabase.
 * - Suporta adicionar nova foto (file) em bucket com mesmo nome da tabela.
 * - Suporta atualizar/remover URLs de fotourl (array).
 * - Remove do storage arquivos que foram retirados do array.
 * @param table Nome da tabela
 * @param id Valor do campo identificador
 * @param values Objeto com os valores a serem atualizados
 * @param file Arquivo da foto (File) - opcional
 * @param fotourlArray Array de URLs de fotos - opcional
 * @param ip IP do usuário (opcional)
 * @param userAgent User agent do navegador (opcional)
 */
export async function updateTable(
  table: string,
  id: string | number,
  values: any,
  file?: File,
  fotourlArray?: string[],
  ip?: string,
  userAgent?: string
) {
  const key = table === "usuarios" ? "uuid" : "id";

  // Pega o usuário atual do store
  const currentUser = useAuthStore.getState().user;
  const usuarioId = currentUser?.id || null;

  console.log("🔍 Iniciando updateTable:", {
    table,
    id,
    key,
    usuarioId,
  });

  // Busca os dados anteriores completos para o log
  let dadosAnteriores: any = null;
  try {
    const { data: record, error: fetchError } = await supabase
      .from(table)
      .select("*")
      .eq(key, id)
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
    console.warn("Aviso: não foi possível ler dados antes de atualizar:", e);
  }

  // Verifica se a coluna fotourl existe no objeto values (p/ tabelas sem fotourl ignorar)
  let currentFotos: string[] = [];
  const wantsPhotoColumn =
    "fotourl" in values || file !== undefined || fotourlArray !== undefined;

  if (wantsPhotoColumn) {
    // Usa os dados já capturados ou tenta buscar apenas fotourl
    if (dadosAnteriores?.fotourl && Array.isArray(dadosAnteriores.fotourl)) {
      currentFotos = dadosAnteriores.fotourl;
    } else {
      // Fallback: tenta buscar apenas fotourl se não foi capturado antes
      try {
        const { data: currentRecord, error: fetchError } = await supabase
          .from(table)
          .select("fotourl")
          .eq(key, id)
          .maybeSingle();

        if (
          !fetchError &&
          currentRecord?.fotourl &&
          Array.isArray(currentRecord.fotourl)
        ) {
          currentFotos = currentRecord.fotourl;
        }
      } catch {
        // ignora
      }
    }
  }

  // Array desejado após remoções (antes de adicionar nova)
  let newFotos = fotourlArray ?? currentFotos;

  // Identifica removidas
  const removed = currentFotos.filter((f) => !newFotos.includes(f));

  // Remove do storage fotos removidas (melhor esforço)
  if (removed.length > 0) {
    try {
      const fileNames = removed
        .map((url) => {
          const parts = url.split("/");
          return parts[parts.length - 1].split("?")[0];
        })
        .filter(Boolean);
      if (fileNames.length > 0) {
        await supabase.storage.from(table).remove(fileNames);
      }
    } catch (e) {
      console.warn("Falha ao remover imagens antigas:", e);
    }
  }

  // Upload de nova foto (se houver)
  if (file) {
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${id}_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(table)
        .upload(fileName, file);
      if (upErr) throw upErr;
      const { data } = supabase.storage.from(table).getPublicUrl(fileName);
      if (data?.publicUrl) {
        newFotos = [...newFotos, data.publicUrl];
      }
    } catch (e: any) {
      return Promise.reject({
        message: "Erro ao fazer upload de imagem",
        detail: e?.message || e,
      });
    }
  }

  // Monta payload final
  const updateValues = {
    ...values,
    ...(wantsPhotoColumn ? { fotourl: newFotos } : {}),
  };

  const { data, error } = await supabase
    .from(table)
    .update(updateValues)
    .eq(key, id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("❌ Erro ao atualizar registro:", error);
    throw {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    };
  }

  console.log("✅ Registro atualizado com sucesso:", data);

  // Registra a ação na tabela de logs
  try {
    console.log("📝 Tentando registrar log de atualização...");

    // Pega informações do navegador se não foram fornecidas
    const finalIp = ip || null;
    const finalUserAgent =
      userAgent ||
      (typeof navigator !== "undefined" ? navigator.userAgent : null);

    // Identifica o ID do registro atualizado
    const registroId = data?.uuid || data?.id || String(id);

    const logData = {
      usuario_id: usuarioId,
      acao: `editar_${table}`,
      tabela: table,
      registro_id: String(registroId),
      dados_anteriores: dadosAnteriores,
      dados_novos: data,
      ip: finalIp,
      user_agent: finalUserAgent,
    };

    console.log("📋 Dados do log:", logData);

    const { data: logResult, error: logError } = await supabase
      .from("logs")
      .insert(logData)
      .select();

    if (logError) {
      console.error("❌ Erro ao inserir log - message:", logError.message);
      console.error("❌ Erro ao inserir log - details:", logError.details);
      console.error("❌ Erro ao inserir log - hint:", logError.hint);
      console.error("❌ Erro ao inserir log - code:", logError.code);
      console.error("❌ Erro completo:", JSON.stringify(logError, null, 2));
    } else {
      console.log("✅ Log registrado com sucesso:", logResult);
    }
  } catch (logError) {
    console.error("❌ Exceção ao registrar log:", logError);
    console.error(
      "❌ Exceção stringificada:",
      JSON.stringify(logError, null, 2)
    );
    // Não propaga o erro do log para não quebrar a operação principal
  }

  return data;
}
