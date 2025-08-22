import { supabase } from "@/lib/supabaseClient";

/**
 * Busca dados de qualquer tabela do Supabase.
 * Automaticamente busca todos os registros em lotes para contornar o limite de 1000.
 * @param table Nome da tabela
 * @returns Array de registros ou erro
 */
export async function fetchTable(table: string) {
  const batchSize = 1000;
  let allData: any[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .range(offset, offset + batchSize - 1);

    if (error) throw error;

    if (data && data.length > 0) {
      allData = [...allData, ...data];
      offset += batchSize;
      hasMore = data.length === batchSize;
    } else {
      hasMore = false;
    }
  }

  return allData;
}
