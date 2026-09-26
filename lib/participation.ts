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

const DRC_COUNTRY_CODE = "243";
const DRC_NATIONAL_LENGTH = 9;

export function normalizePhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  if (digits.startsWith(DRC_COUNTRY_CODE)) {
    const national = digits.slice(DRC_COUNTRY_CODE.length).replace(/^0+/, "");
    if (national.length === DRC_NATIONAL_LENGTH) {
      return `${DRC_COUNTRY_CODE}${national}`;
    }
    return digits;
  }

  const local = digits.replace(/^0+/, "");
  if (local.length === DRC_NATIONAL_LENGTH) {
    return `${DRC_COUNTRY_CODE}${local}`;
  }

  return digits;
}

export function formatPhoneDisplay(value: string) {
  const normalized = normalizePhone(value);
  if (/^243[0-9]{9}$/.test(normalized)) {
    const national = normalized.slice(3);
    return `+243 ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`;
  }

  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
  }
  return value.trim();
}

export function validateName(value: string) {
  const normalized = normalizeName(value);
  if (!normalized) return "Indiquez votre nom et vos prénoms.";
  if (normalized.length < 2 || !namePattern.test(normalized)) return "Indiquez un nom valide.";
  return "";
}

export function validatePhone(value: string) {
  const normalized = normalizePhone(value);
  if (!normalized) return "Indiquez votre numéro de téléphone.";
  if (!/^243[0-9]{9}$/.test(normalized)) {
    return "Indiquez un numéro valide (ex. 0824269291 ou +243824269291).";
  }
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
