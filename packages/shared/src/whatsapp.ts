/** Textos prellenados para WhatsApp. Sin dependencias (se importa desde el cliente como `@batalla/shared/whatsapp`). */

export interface WaCar {
  /** "Chevrolet Onix Premier 1.0 Turbo AT" */
  title: string;
  year: number;
  /** Link público a la ficha del auto. */
  url: string;
}

export const waUrl = (number: string, text: string) => `https://wa.me/${number}?text=${encodeURIComponent(text)}`;

const carLine = (car: WaCar) => `Me interesa el ${car.title} ${car.year}: ${car.url}`;

/** Mensaje que arma el formulario de consulta antes de abrir WhatsApp. */
export function buildInquiryText(input: { name: string; phone: string; email?: string; message: string; car?: WaCar }) {
  return [
    `Hola! Soy ${input.name.trim()}.`,
    input.car ? carLine(input.car) : null,
    "",
    input.message.trim(),
    "",
    `Mi teléfono: ${input.phone.trim()}`,
    input.email?.trim() ? `Mi email: ${input.email.trim()}` : null,
  ]
    .filter((l): l is string => l !== null)
    .join("\n");
}

/** Mensaje que arma el simulador de cuotas de la ficha. Los montos llegan ya formateados. */
export function buildSimulationText(input: {
  car: WaCar;
  downPayment: string;
  downPct: number;
  months: number;
  installment: string;
}) {
  return [
    `Hola! ${carLine(input.car)}`,
    "",
    `Simulé la financiación: anticipo de ${input.downPayment} (${input.downPct}%) y ${input.months} cuotas de ${input.installment} (estimado).`,
    "¿Me pasan las condiciones reales?",
  ].join("\n");
}
