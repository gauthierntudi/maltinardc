import { normalizePhone } from "@/lib/participation";

const PARTICIPATION_SUCCESS_SMS =
  "Abonne-toi à nos pages Facebook & Instagram. Prends une photo avec ta MALTINA, tague @maltinardc + #maltinardc et tente de gagner des cadeaux !";

const UNIKRON_SEND_URL = "https://unikron.tech/api/v2/sms/send";

type UnikronSendResult = {
  status?: string;
  message?: string;
  results?: Array<{
    number?: string;
    status?: string;
    error?: string | null;
    sms_id?: string;
  }>;
};

function getUnikronConfig() {
  const appKey = process.env.UNIKRON_APP_KEY?.trim();
  const sender = process.env.UNIKRON_SENDER?.trim() || "MALTINA";
  if (!appKey) {
    return null;
  }
  if (sender.length > 11) {
    throw new Error("UNIKRON_SENDER doit contenir au maximum 11 caractères.");
  }
  return { appKey, sender };
}

export function formatPhoneForUnikron(normalizedPhone: string) {
  const digits = normalizePhone(normalizedPhone);
  if (!/^243[0-9]{9}$/.test(digits)) {
    throw new Error("Numéro incompatible avec l'envoi SMS Unikron.");
  }
  return `+${digits}`;
}

export async function sendUnikronSms(number: string, text: string) {
  const config = getUnikronConfig();
  if (!config) {
    return { skipped: true as const, reason: "UNIKRON_APP_KEY manquant" };
  }

  const response = await fetch(UNIKRON_SEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.appKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      number,
      text,
      sender: config.sender,
    }),
    cache: "no-store",
  });

  let payload: UnikronSendResult | null = null;
  try {
    payload = (await response.json()) as UnikronSendResult;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const detail = payload?.message ?? `Erreur Unikron (${response.status}).`;
    throw new Error(detail);
  }

  const firstResult = payload?.results?.[0];
  if (firstResult?.error) {
    throw new Error(firstResult.error);
  }

  return {
    skipped: false as const,
    status: payload?.status ?? "processed",
    smsId: firstResult?.sms_id,
  };
}

export async function sendParticipationSuccessSms(input: { nom: string; telephone: string }) {
  const number = formatPhoneForUnikron(input.telephone);
  return sendUnikronSms(number, PARTICIPATION_SUCCESS_SMS);
}
