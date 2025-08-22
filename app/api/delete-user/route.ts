import { supabaseService } from "@/lib/supabaseClient"; // service_role
import { supabase } from "@/lib/supabaseClient";

export async function DELETE(request: Request) {
  const { uuid } = await request.json();

  // Captura informações do request para o log
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = request.headers.get("user-agent") || null;

  console.log("🔍 Iniciando DELETE user:", { uuid, ip });

  // 1. Busca o usuário na tabela para pegar todos os dados para o log
  const { data: usuario, error: fetchError } = await supabase
    .from("usuarios")
    .select("*") // Busca todos os dados para o log
    .eq("uuid", uuid)
    .single();

  if (fetchError || !usuario) {
    return Response.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  console.log("✅ Dados do usuário capturados:", usuario);

  // 2. Busca o usuário no Auth pelo uuid
  const { data: userList, error: listError } =
    await supabaseService.auth.admin.listUsers();
  if (listError) {
    return Response.json(
      { error: "Erro ao buscar usuários do Auth." },
      { status: 500 }
    );
  }
  const user = userList.users.find((u) => u.id === uuid);
  if (!user) {
    return Response.json(
      { error: "Usuário do Auth não encontrado." },
      { status: 404 }
    );
  }

  // 3. Remove do Auth
  const { error: authError } =
    await supabaseService.auth.admin.deleteUser(uuid);
  if (authError) {
    return Response.json(
      { error: "Erro ao excluir do Auth." },
      { status: 500 }
    );
  }

  // 4. Remove foto do Storage (se existir)
  if (usuario.fotourl && usuario.fotourl.length > 0) {
    try {
      const url = usuario.fotourl[0];
      const match = url.match(/usuarios\/(.+)$/);
      if (match && match[1]) {
        const fileName = match[1];
        console.log("Arquivo a ser removido do Storage:", fileName);
        const { error: removeError } = await supabaseService.storage
          .from("usuarios")
          .remove([fileName]);
        if (removeError) {
          console.log("Erro ao remover do Storage:", removeError.message);
        } else {
          console.log("Arquivo removido com sucesso do Storage!");
        }
      }
    } catch (e) {
      console.log("Erro inesperado ao remover do Storage:", e);
    }
  }

  // 5. Remove da tabela
  const { error: tableError } = await supabase
    .from("usuarios")
    .delete()
    .eq("uuid", uuid);

  if (tableError) {
    return Response.json(
      { error: "Erro ao excluir da tabela." },
      { status: 500 }
    );
  }

  console.log("✅ Usuário deletado com sucesso");

  // 6. Registra a ação na tabela de logs
  try {
    console.log("📝 Tentando registrar log de exclusão de usuário...");

    // Para deletar usuário, normalmente é um admin fazendo, mas como estamos
    // na API route, podemos tentar pegar do token se houver, ou deixar null
    const authHeader = request.headers.get("authorization");
    let usuarioQueExcluiu = null;

    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.substring(7);
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser(token);
        if (!userError && user) {
          usuarioQueExcluiu = user.id;
        }
      } catch (e) {
        console.warn(
          "Não foi possível identificar usuário que fez a exclusão:",
          e
        );
      }
    }

    const logData = {
      usuario_id: usuarioQueExcluiu,
      acao: "deletar_usuarios",
      tabela: "usuarios",
      registro_id: uuid,
      dados_anteriores: usuario, // Dados completos do usuário excluído
      dados_novos: null, // null porque foi deletado
      ip: ip,
      user_agent: userAgent,
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

  return Response.json({ success: true });
}
