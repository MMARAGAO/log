import { supabase } from "./supabaseClient";
import { useAuthStore } from "@/store/authZustand";

/**
 * Insere dados em qualquer tabela do Supabase.
 * Se for para a tabela 'usuarios', também cria o usuário no Auth.
 * @param table Nome da tabela
 * @param values Objeto ou array de objetos a serem inseridos (deve conter email e senha para usuarios)
 * @param file Arquivo da foto (File) - opcional
 * @param ip IP do usuário (opcional)
 * @param userAgent User agent do navegador (opcional)
 * @returns Dados inseridos ou erro
 */
export async function insertTable(
  table: string,
  values: any,
  file?: File,
  ip?: string,
  userAgent?: string
) {
  // Pega o usuário atual do store
  const currentUser = useAuthStore.getState().user;
  const usuarioId = currentUser?.id || null;

  console.log("🔍 Iniciando insertTable:", {
    table,
    values,
    usuarioId,
  });

  let photoUrl = null;

  // 1. Upload da foto, se existir
  if (file) {
    const id = values.id ?? values.uuid ?? Date.now();
    const ext = file.name.split(".").pop();
    const fileName = `${id}_${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(table)
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(table).getPublicUrl(fileName);
    photoUrl = data.publicUrl;
  }

  // 2. Se for tabela usuarios, cria no Auth
  let insertValues = values;
  if (table === "usuarios") {
    if (!values.email || !values.senha) {
      throw new Error("Para criar usuário, informe email e senha.");
    }
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: values.email,
      password: values.senha,
      options: {
        data: {
          nome: values.nome,
          nickname: values.nickname,
          telefone: values.telefone,
          cpf: values.cpf,
          cargo: values.cargo,
          fotourl: photoUrl ? [photoUrl] : undefined,
        },
      },
    });
    if (authError) throw authError;

    // Pega o id do usuário criado no Auth
    const uid = authData?.user?.id;
    if (!uid) throw new Error("Não foi possível obter o UID do Auth.");

    // Remove a senha e adiciona o uid no objeto antes de inserir na tabela
    const { senha, ...rest } = values;
    insertValues = { ...rest, uuid: uid }; // <-- altere para uuid
  }

  // 3. Inserir registro na tabela (com fotourl se existir)
  const finalInsertValues = photoUrl
    ? { ...insertValues, fotourl: [photoUrl] }
    : insertValues;

  const { data, error: insertError } = await supabase
    .from(table)
    .insert(finalInsertValues)
    .select();

  if (insertError) {
    console.error("❌ Erro ao inserir registro:", insertError);
    throw insertError;
  }

  console.log("✅ Registro inserido com sucesso:", data);

  // 4. Registra a ação na tabela de logs
  try {
    console.log("📝 Tentando registrar log de inserção...");

    // Pega informações do navegador se não foram fornecidas
    const finalIp = ip || null;
    const finalUserAgent =
      userAgent ||
      (typeof navigator !== "undefined" ? navigator.userAgent : null);

    // Para cada registro inserido (pode ser array)
    const registrosInseridos = Array.isArray(data) ? data : [data];

    for (const registro of registrosInseridos) {
      // Identifica o ID do registro inserido
      const registroId = registro.uuid || registro.id || null;

      const logData = {
        usuario_id: usuarioId,
        acao: `criar_${table}`,
        tabela: table,
        registro_id: registroId ? String(registroId) : null,
        dados_anteriores: null, // null porque é uma inserção
        dados_novos: registro,
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
