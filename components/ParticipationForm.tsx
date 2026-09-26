"use client";

import { useRef, useState, type FormEvent } from "react";
import { BottomSheet } from "@/components/BottomSheet";
import {
  normalizeName,
  validateAge,
  validateName,
  validatePhone,
  type Majeur,
} from "@/lib/participation";

type Errors = {
  nom: string;
  telephone: string;
  age: string;
};

type SheetState =
  | { open: false }
  | {
      open: true;
      variant: "success" | "error";
      title: string;
      message: string;
      actionLabel?: string;
    };

const emptyErrors: Errors = { nom: "", telephone: "", age: "" };
const closedSheet: SheetState = { open: false };

export function ParticipationForm() {
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [majeur, setMajeur] = useState<Majeur>("");
  const [errors, setErrors] = useState<Errors>(emptyErrors);
  const [touched, setTouched] = useState({ nom: false, telephone: false, age: false });
  const [status, setStatus] = useState<"idle" | "sending">("idle");
  const [sheet, setSheet] = useState<SheetState>(closedSheet);
  const nomRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const ageRef = useRef<HTMLInputElement>(null);

  function resetForm() {
    setNom("");
    setTelephone("");
    setMajeur("");
    setErrors(emptyErrors);
    setTouched({ nom: false, telephone: false, age: false });
    nomRef.current?.focus();
  }

  function closeSheet() {
    const wasSuccess = sheet.open && sheet.variant === "success";
    setSheet(closedSheet);
    if (wasSuccess) resetForm();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = {
      nom: validateName(nom),
      telephone: validatePhone(telephone),
      age: validateAge(majeur),
    };
    setTouched({ nom: true, telephone: true, age: true });
    setErrors(next);
    if (next.nom || next.telephone || next.age) {
      if (next.nom) nomRef.current?.focus();
      else if (next.telephone) phoneRef.current?.focus();
      else ageRef.current?.focus();
      return;
    }

    const cleanName = normalizeName(nom);
    setStatus("sending");

    try {
      const response = await fetch("/api/participations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: cleanName,
          telephone: telephone.trim(),
          majeur: "oui",
        }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        field?: string;
        nom?: string;
      };

      if (!response.ok || !payload.ok) {
        const message = payload.error ?? "Impossible d'enregistrer la participation.";
        if (payload.field === "telephone") {
          setErrors((current) => ({ ...current, telephone: message }));
          phoneRef.current?.focus();
        } else if (payload.field === "nom") {
          setErrors((current) => ({ ...current, nom: message }));
          nomRef.current?.focus();
        } else if (payload.field === "age") {
          setErrors((current) => ({ ...current, age: message }));
          ageRef.current?.focus();
        }

        setSheet({
          open: true,
          variant: "error",
          title: "Participation refusée",
          message,
        });
        setStatus("idle");
        return;
      }

      const savedName = payload.nom ?? cleanName;
      setSheet({
        open: true,
        variant: "success",
        title: "Participation enregistrée",
        message: `Merci ${savedName} ! Voici la suite pour participer au jeu.`,
        actionLabel: "Fermer",
      });
      setStatus("idle");
    } catch {
      setSheet({
        open: true,
        variant: "error",
        title: "Échec de l'envoi",
        message: "Connexion impossible. Réessayez dans un instant.",
      });
      setStatus("idle");
    }
  }

  return (
    <>
      <form id="participation" className="card" noValidate onSubmit={onSubmit}>
        <div className="fields">
          <div className={errors.nom ? "field is-invalid" : "field"}>
            <label className="control">
              <span className="sr-only">Nom et prénoms</span>
              <svg className="icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <circle cx="12" cy="8" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
                <path
                  d="M5.5 19.2c1.4-3.2 3.6-4.7 6.5-4.7s5.1 1.5 6.5 4.7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
              <input
                ref={nomRef}
                id="nom"
                name="nom"
                type="text"
                autoComplete="name"
                autoCapitalize="words"
                placeholder="Nom et prénoms"
                maxLength={80}
                value={nom}
                aria-invalid={errors.nom ? true : undefined}
                aria-describedby="nom-error"
                onBlur={() => {
                  setTouched((current) => ({ ...current, nom: true }));
                  setErrors((current) => ({ ...current, nom: validateName(nom) }));
                }}
                onChange={(event) => {
                  const value = event.target.value;
                  setNom(value);
                  if (touched.nom) setErrors((current) => ({ ...current, nom: validateName(value) }));
                }}
              />
            </label>
            <p className="error" id="nom-error" aria-live="polite">
              {errors.nom}
            </p>
          </div>

          <div className={errors.telephone ? "field is-invalid" : "field"}>
            <label className="control">
              <span className="sr-only">Numéro de téléphone</span>
              <svg className="icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path
                  d="M8 5.2h2.1l1.2 2.7-1.5 1.1a11.4 11.4 0 0 0 5.2 5.2l1.1-1.5 2.7 1.2V16c0 .8-.6 1.5-1.4 1.6A13.6 13.6 0 0 1 6.4 6.6C6.5 5.8 7.2 5.2 8 5.2z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
              <input
                ref={phoneRef}
                id="telephone"
                name="telephone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                spellCheck={false}
                placeholder="Numéro de téléphone"
                maxLength={20}
                value={telephone}
                aria-invalid={errors.telephone ? true : undefined}
                aria-describedby="telephone-error"
                onBlur={() => {
                  setTouched((current) => ({ ...current, telephone: true }));
                  setErrors((current) => ({ ...current, telephone: validatePhone(telephone) }));
                }}
                onChange={(event) => {
                  const value = event.target.value;
                  setTelephone(value);
                  if (touched.telephone) {
                    setErrors((current) => ({ ...current, telephone: validatePhone(value) }));
                  }
                }}
              />
            </label>
            <p className="error" id="telephone-error" aria-live="polite">
              {errors.telephone}
            </p>
          </div>

          <div className={errors.age ? "field is-invalid" : "field"}>
            <div
              className="age"
              id="age"
              role="radiogroup"
              aria-labelledby="age-label"
              aria-invalid={errors.age ? true : undefined}
              aria-describedby="age-error"
            >
              <span className="badge" aria-hidden="true">
                18+
              </span>
              <span className="age-q" id="age-label">
                Avez-vous plus de 18 ans&nbsp;?
              </span>
              <div className="choices">
                <label className="choice">
                  <input
                    ref={ageRef}
                    type="radio"
                    name="majeur"
                    value="oui"
                    checked={majeur === "oui"}
                    onChange={() => {
                      setMajeur("oui");
                      setTouched((current) => ({ ...current, age: true }));
                      setErrors((current) => ({ ...current, age: validateAge("oui") }));
                    }}
                  />
                  Oui
                </label>
                <label className="choice">
                  <input
                    type="radio"
                    name="majeur"
                    value="non"
                    checked={majeur === "non"}
                    onChange={() => {
                      setMajeur("non");
                      setTouched((current) => ({ ...current, age: true }));
                      setErrors((current) => ({ ...current, age: validateAge("non") }));
                    }}
                  />
                  Non
                </label>
              </div>
            </div>
            <p className="error" id="age-error" aria-live="polite">
              {errors.age}
            </p>
          </div>

          <button className="submit" type="submit" disabled={status === "sending"}>
            <span>{status === "sending" ? "Envoi…" : "Valider ma participation"}</span>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path
                d="M9 6l6 6-6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </form>

      <BottomSheet
        open={sheet.open}
        variant={sheet.open ? sheet.variant : "success"}
        title={sheet.open ? sheet.title : ""}
        message={sheet.open ? sheet.message : ""}
        actionLabel={sheet.open ? sheet.actionLabel : undefined}
        onClose={closeSheet}
      />
    </>
  );
}
