export function validarIMEI(imei: string): boolean {
  const limpo = imei.replace(/\D/g, "");

  if (limpo.length !== 15) return false;

  // Algoritmo de Luhn para validar IMEI
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(limpo[i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(limpo[14]);
}

export function formatarIMEI(imei: string): string {
  const limpo = imei.replace(/\D/g, "");
  if (limpo.length <= 2) return limpo;
  if (limpo.length <= 8) return `${limpo.slice(0, 2)} ${limpo.slice(2)}`;
  if (limpo.length <= 14)
    return `${limpo.slice(0, 2)} ${limpo.slice(2, 8)} ${limpo.slice(8)}`;
  return `${limpo.slice(0, 2)} ${limpo.slice(2, 8)} ${limpo.slice(8, 14)} ${limpo.slice(14, 15)}`;
}

export function validarValores(
  valor_aparelho: number,
  desconto: number,
  valor_final: number
): boolean {
  if (valor_aparelho < 0 || desconto < 0 || valor_final < 0) return false;
  if (desconto > valor_aparelho) return false;
  return Math.abs(valor_aparelho - desconto - valor_final) < 0.01;
}

export function calcularValorFinal(
  valor_aparelho: number,
  desconto: number
): number {
  return Math.max(0, valor_aparelho - desconto);
}

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

export function formatarData(data: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(data));
}

export function formatarDataHora(data: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(data));
}
