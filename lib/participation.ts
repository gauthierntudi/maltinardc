const namePattern = /^[\p{L}][\p{L}\s'’-]*$/u;

export type Majeur = "" | "oui" | "non";

export type Participation = {
  nom: string;
  telephone: string;
  majeur: true;
  at: string;
};

export function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

export function validateName(value: string) {
  const normalized = normalizeName(value);
  if (!normalized) return "Indiquez votre nom et vos prénoms.";
  if (normalized.length < 2 || !namePattern.test(normalized)) return "Indiquez un nom valide.";
  return "";
}

export function validatePhone(value: string) {
  const digits = normalizePhone(value);
  if (!digits) return "Indiquez votre numéro de téléphone.";
  if (digits.length < 8 || digits.length > 15) return "Indiquez un numéro de téléphone valide.";
  return "";
}

export function validateAge(value: Majeur) {
  if (!value) return "Indiquez si vous avez plus de 18 ans.";
  if (value === "non") return "La participation est réservée aux personnes de plus de 18 ans.";
  return "";
}

export type ParticipationPayload = {
  nom: string;
  telephone: string;
  majeur: "oui";
};
