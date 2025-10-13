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
    currentUser,
  });

  // Configura o usuario_id na sessão do banco para o trigger usar
  if (usuarioId) {
    try {
      console.log("🔧 Tentando configurar usuario_id na sessão...", usuarioId);
      const { data, error } = await supabase.rpc("set_config", {
        setting: "app.current_user_id",
        value: usuarioId,
      });

      if (error) {
        console.error("❌ ERRO ao configurar usuario_id:", error);
        console.error("❌ Detalhes do erro:", JSON.stringify(error, null, 2));
      } else {
        console.log(
          "✅ Usuario ID configurado na sessão com sucesso:",
          usuarioId
        );
        console.log("✅ Resposta do RPC:", data);
      }
    } catch (error) {
      console.error("⚠️ EXCEÇÃO ao configurar usuario_id:", error);
      console.error("⚠️ Detalhes:", JSON.stringify(error, null, 2));
    }
  } else {
    console.warn("⚠️ ATENÇÃO: usuarioId é NULL! Usuário não está logado?");
    console.warn("⚠️ currentUser:", currentUser);
  }

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
  } else {
    // Para todas as outras tabelas, adiciona usuario_id automaticamente
    insertValues = { ...values, usuario_id: usuarioId };
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

  // 4. Log será criado automaticamente pelo trigger do banco de dados
  // Não é necessário criar log manualmente aqui

  return data;
}
