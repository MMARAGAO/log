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
  console.log("🔍 Values recebido no updateTable:", values);
  console.log("🔍 Chaves do values:", Object.keys(values));

  // Adiciona usuario_id automaticamente, exceto na tabela usuarios
  const updateValues = {
    ...values,
    ...(table !== "usuarios" ? { usuario_id: usuarioId } : {}),
    ...(wantsPhotoColumn ? { fotourl: newFotos } : {}),
  };

  console.log("📦 Payload final para update:", {
    table,
    id,
    key,
    updateValues,
    keysCount: Object.keys(updateValues).length,
  });
  console.log("📦 Chaves do updateValues:", Object.keys(updateValues));
  console.log(
    "📦 updateValues completo (JSON):",
    JSON.stringify(updateValues, null, 2)
  );

  // Verifica se há algo para atualizar
  if (Object.keys(updateValues).length === 0) {
    console.warn("⚠️ Nenhum dado para atualizar. Retornando registro atual.");
    const { data: currentData } = await supabase
      .from(table)
      .select("*")
      .eq(key, id)
      .maybeSingle();
    return currentData;
  }

  console.log(`🔄 Executando UPDATE na tabela ${table} onde ${key}=${id}...`);

  const { data, error } = await supabase
    .from(table)
    .update(updateValues)
    .eq(key, id)
    .select()
    .maybeSingle();

  console.log("📊 Resultado do UPDATE:", { data, error });

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

  // Log será criado automaticamente pelo trigger do banco de dados
  // Não é necessário criar log manualmente aqui

  return data;
}
