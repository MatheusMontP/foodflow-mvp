import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatarQuantidade(valor: number | string, unidade?: string) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) {
    return unidade ? `${valor} ${unidade}` : String(valor);
  }

  const quantidade = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(numero);

  return unidade ? `${quantidade} ${unidade}` : quantidade;
}
