// Presentación de cifras. null siempre se muestra como no disponible: nunca como 0.
export const NOT_AVAILABLE = "No disponible";

export function percent(value: number | null): string {
  return value === null ? NOT_AVAILABLE : `${(value * 100).toFixed(0)} %`;
}

export function decimal(value: number | null, digits = 3): string {
  return value === null ? NOT_AVAILABLE : value.toFixed(digits);
}

export function signedDecimal(value: number | null, digits = 4): string {
  if (value === null) return NOT_AVAILABLE;
  const text = Math.abs(value).toFixed(digits);
  return `${value < 0 ? "−" : value > 0 ? "+" : ""}${text}`;
}

export function minutes(value: number): string {
  return `${Number(value.toFixed(2))} min`;
}
