/**
 * Máscara para CPF (000.000.000-00)
 */
export function cpfMask(value: string): string {
  return value
    .replace(/\D/g, "") // Remove tudo que não é dígito
    .replace(/(\d{3})(\d)/, "$1.$2") // Adiciona primeiro ponto
    .replace(/(\d{3})(\d)/, "$1.$2") // Adiciona segundo ponto
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2") // Adiciona hífen
    .substring(0, 14); // Limita o tamanho
}

/**
 * Máscara para CNPJ (00.000.000/0000-00)
 */
export function cnpjMask(value: string): string {
  return value
    .replace(/\D/g, "") // Remove tudo que não é dígito
    .replace(/(\d{2})(\d)/, "$1.$2") // Adiciona primeiro ponto
    .replace(/(\d{3})(\d)/, "$1.$2") // Adiciona segundo ponto
    .replace(/(\d{3})(\d)/, "$1/$2") // Adiciona barra
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2") // Adiciona hífen
    .substring(0, 18); // Limita o tamanho
}

/**
 * Máscara automática para CPF/CNPJ
 * Se tiver mais de 11 dígitos, aplica máscara de CNPJ
 */
export function cpfCnpjMask(value: string): string {
  const cleanValue = value.replace(/\D/g, "");

  if (cleanValue.length <= 11) {
    return cpfMask(value);
  }
  return cnpjMask(value);
}

/**
 * Máscara para telefone/celular (00) 00000-0000 ou (00) 0000-0000
 */
export function phoneMask(value: string): string {
  const cleanValue = value.replace(/\D/g, "");

  if (cleanValue.length <= 10) {
    // Telefone fixo: (00) 0000-0000
    return cleanValue
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d{1,4})$/, "$1-$2")
      .substring(0, 14);
  }

  // Celular: (00) 00000-0000
  return cleanValue
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2")
    .substring(0, 15);
}

/**
 * Máscara para CEP (00000-000)
 */
export function cepMask(value: string): string {
  return value
    .replace(/\D/g, "") // Remove tudo que não é dígito
    .replace(/(\d{5})(\d{1,3})$/, "$1-$2") // Adiciona hífen
    .substring(0, 9); // Limita o tamanho
}

/**
 * Máscara para moeda brasileira (R$ 0.000,00)
 * Sempre trabalha com centavos - divide por 100
 */
export function currencyMask(value: string): string {
  // Remove tudo que não é número
  let numericValue = value.replace(/\D/g, "");

  // Se não há valor, retorna vazio
  if (!numericValue) return "";

  // Sempre divide por 100 para ter centavos
  const number = parseInt(numericValue) / 100;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(number);
}

/**
 * Converte um valor numérico (do banco) para o formato de input
 * Ex: 1951.5 → "195150" → "R$ 1.951,50"
 */
export function numberToCurrencyInput(value: number): string {
  if (!value) return "";

  // Converte para centavos (multiplica por 100) e depois aplica a máscara
  const centavos = Math.round(value * 100).toString();
  return currencyMask(centavos);
}

/**
 * Converte valor monetário para número
 */
export function currencyToNumber(value: string): number {
  if (!value) return 0;

  // Remove R$, espaços e pontos (separadores de milhares)
  // Mantém apenas números e vírgula
  const cleanValue = value
    .replace(/R\$\s?/g, "") // Remove R$ e espaços após
    .replace(/\./g, "") // Remove pontos (separadores de milhares)
    .replace(",", "."); // Substitui vírgula por ponto decimal

  return parseFloat(cleanValue) || 0;
}

/**
 * Máscara para porcentagem (00,00%)
 */
export function percentMask(value: string): string {
  const cleanValue = value.replace(/\D/g, "");

  if (!cleanValue) return "";

  const number = parseInt(cleanValue) / 100;

  return (
    number.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + "%"
  );
}

/**
 * Máscara para apenas números
 */
export function numberMask(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Máscara para RG (00.000.000-0)
 */
export function rgMask(value: string): string {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1})$/, "$1-$2")
    .substring(0, 12);
}

/**
 * Máscara para data (DD/MM/AAAA)
 */
export function dateMask(value: string): string {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "$1/$2")
    .replace(/(\d{2})(\d)/, "$1/$2")
    .substring(0, 10);
}

/**
 * Máscara para horário (HH:MM)
 */
export function timeMask(value: string): string {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "$1:$2")
    .substring(0, 5);
}

/**
 * Remove todas as máscaras (mantém apenas números)
 */
export function removeMask(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Valida CPF
 */
export function isValidCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, "");

  if (cleanCPF.length !== 11) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  // Validação do algoritmo do CPF
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }

  let remainder = 11 - (sum % 11);
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }

  remainder = 11 - (sum % 11);
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;

  return true;
}

/**
 * Valida CNPJ
 */
export function isValidCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cnpj.replace(/\D/g, "");

  if (cleanCNPJ.length !== 14) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;

  // Validação do algoritmo do CNPJ
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i];
  }

  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;

  if (digit1 !== parseInt(cleanCNPJ.charAt(12))) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i];
  }

  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;

  if (digit2 !== parseInt(cleanCNPJ.charAt(13))) return false;

  return true;
}
