"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  downloadParticipationsCsv,
  downloadParticipationsExcel,
} from "@/lib/export-participations";

type ParticipationRow = {
  id: number;
  nom: string;
  telephone: string;
  majeur: number;
  created_at: string;
};

type ListResponse = {
  ok?: boolean;
  error?: string;
  rows?: ParticipationRow[];
  total?: number;
};

function formatDate(value: string) {
  const date = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
  }
  return value;
}

function parseRowDate(value: string) {
  return new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
}

function initialsFromName(nom: string) {
  const parts = nom.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + second).toUpperCase() || "?";
}

function countToday(rows: ParticipationRow[]) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = start.getTime() + 86400000;
  return rows.filter((row) => {
    const time = parseRowDate(row.created_at).getTime();
    return !Number.isNaN(time) && time >= start.getTime() && time < end;
  }).length;
}

export function AdminPanel() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ParticipationRow[]>([]);
  const [total, setTotal] = useState(0);
  const [listError, setListError] = useState("");
  const [search, setSearch] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadParticipations = useCallback(async () => {
    setLoading(true);
    setListError("");
    try {
      const response = await fetch("/api/admin/participations", { cache: "no-store" });
      const payload = (await response.json()) as ListResponse;
      if (!response.ok || !payload.ok) {
        if (response.status === 401) {
          setAuthenticated(false);
          return;
        }
        setListError(payload.error ?? "Impossible de charger les participations.");
        return;
      }
      setAuthenticated(true);
      setRows(payload.rows ?? []);
      setTotal(payload.total ?? 0);
      setLastUpdated(new Date());
    } catch {
      setListError("Connexion impossible.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadParticipations();
  }, [loadParticipations]);

  async function onLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    setLoading(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        setLoginError(payload.error ?? "Connexion refusée.");
        setLoading(false);
        return;
      }
      setPassword("");
      await loadParticipations();
    } catch {
      setLoginError("Connexion impossible.");
      setLoading(false);
    }
  }

  async function onLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
    setRows([]);
    setTotal(0);
    setSearch("");
    setLastUpdated(null);
  }

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const digits = search.replace(/\D/g, "");
    if (!query && !digits) return rows;
    return rows.filter((row) => {
      const nameMatch = row.nom.toLowerCase().includes(query);
      const phoneMatch = digits.length > 0 && row.telephone.includes(digits);
      return nameMatch || phoneMatch;
    });
  }, [rows, search]);

  const todayCount = useMemo(() => countToday(rows), [rows]);
  const searchActive = search.trim().length > 0;

  if (authenticated === null && loading) {
    return (
      <div className="admin-login" aria-busy="true">
        <div className="admin-login-card admin-login-card--center">
          <span className="admin-login-spinner" aria-hidden />
          <p className="admin-login-loading-text">Vérification de la session…</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="admin-login">
        <div className="admin-login-glow" aria-hidden />
        <Link className="admin-login-back" href="/">
          <i className="bi bi-arrow-left" aria-hidden />
          Retour au concours
        </Link>

        <form className="admin-login-card" onSubmit={onLogin}>
          <div className="admin-login-brand">
            <img
              className="admin-login-logo"
              src="/images/maltina-logo.png"
              alt="Maltina"
              width={168}
              height={48}
            />
            <span className="admin-login-badge">Espace admin</span>
          </div>

          <h1 className="admin-login-title">Participations</h1>
          <p className="admin-login-lead">
            Connectez-vous pour consulter la liste des inscrits au concours.
          </p>

          <label className="admin-login-field">
            <span className="admin-login-label">Mot de passe</span>
            <span className="admin-login-input-wrap">
              <i className="bi bi-shield-lock admin-login-input-icon" aria-hidden />
              <input
                className="admin-login-input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                autoFocus
                required
              />
              <button
                className="admin-login-toggle"
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`} aria-hidden />
              </button>
            </span>
          </label>

          {loginError ? (
            <div className="admin-login-alert" role="alert">
              <i className="bi bi-exclamation-circle" aria-hidden />
              <span>{loginError}</span>
            </div>
          ) : null}

          <button className="admin-login-submit" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="admin-login-spinner admin-login-spinner--inline" aria-hidden />
                Connexion…
              </>
            ) : (
              <>
                Se connecter
                <i className="bi bi-arrow-right-short" aria-hidden />
              </>
            )}
          </button>
        </form>

        <p className="admin-login-foot">Accès réservé à l&apos;équipe Maltina.</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-dash-header">
        <div className="admin-dash-brand">
          <img
            className="admin-dash-logo"
            src="/images/maltina-logo.png"
            alt="Maltina"
            width={120}
            height={34}
          />
          <div>
            <span className="admin-login-badge">Espace admin</span>
            <h1 className="admin-dash-title">Participations concours</h1>
          </div>
        </div>
        <div className="admin-dash-header-actions">
          <Link className="admin-dash-link" href="/">
            <i className="bi bi-box-arrow-up-right" aria-hidden />
            Voir le site
          </Link>
          <button className="admin-btn ghost admin-btn--inline" type="button" onClick={onLogout}>
            <i className="bi bi-box-arrow-right" aria-hidden />
            Déconnexion
          </button>
        </div>
      </header>

      <section className="admin-stats" aria-label="Statistiques">
        <article className="admin-stat">
          <span className="admin-stat-icon" aria-hidden>
            <i className="bi bi-people-fill" />
          </span>
          <div>
            <p className="admin-stat-value">{total.toLocaleString("fr-FR")}</p>
            <p className="admin-stat-label">Inscriptions totales</p>
          </div>
        </article>
        <article className="admin-stat">
          <span className="admin-stat-icon admin-stat-icon--sun" aria-hidden>
            <i className="bi bi-sun-fill" />
          </span>
          <div>
            <p className="admin-stat-value">{todayCount.toLocaleString("fr-FR")}</p>
            <p className="admin-stat-label">Aujourd&apos;hui (liste chargée)</p>
          </div>
        </article>
        <article className="admin-stat">
          <span className="admin-stat-icon admin-stat-icon--list" aria-hidden>
            <i className="bi bi-list-ul" />
          </span>
          <div>
            <p className="admin-stat-value">{filteredRows.length.toLocaleString("fr-FR")}</p>
            <p className="admin-stat-label">
              {searchActive ? "Résultats filtrés" : `${rows.length} affichée${rows.length > 1 ? "s" : ""}`}
            </p>
          </div>
        </article>
      </section>

      <section className="admin-panel-card" aria-labelledby="admin-list-heading">
        <div className="admin-toolbar">
          <div className="admin-search-wrap">
            <i className="bi bi-search admin-search-icon" aria-hidden />
            <input
              className="admin-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher par nom ou téléphone…"
              aria-label="Rechercher une participation"
            />
            {search ? (
              <button
                className="admin-search-clear"
                type="button"
                onClick={() => setSearch("")}
                aria-label="Effacer la recherche"
              >
                <i className="bi bi-x-lg" aria-hidden />
              </button>
            ) : null}
          </div>
          <div className="admin-toolbar-actions">
            <button
              className="admin-btn secondary admin-btn--inline"
              type="button"
              onClick={loadParticipations}
              disabled={loading}
            >
              <i className={`bi bi-arrow-clockwise${loading ? " admin-spin-icon" : ""}`} aria-hidden />
              Actualiser
            </button>
            <button
              className="admin-btn secondary admin-btn--inline"
              type="button"
              onClick={() => downloadParticipationsCsv(filteredRows)}
              disabled={filteredRows.length === 0}
            >
              <i className="bi bi-filetype-csv" aria-hidden />
              CSV
            </button>
            <button
              className="admin-btn admin-btn--inline"
              type="button"
              onClick={() => void downloadParticipationsExcel(filteredRows)}
              disabled={filteredRows.length === 0}
            >
              <i className="bi bi-file-earmark-spreadsheet" aria-hidden />
              Excel
            </button>
          </div>
        </div>

        <div className="admin-list-meta">
          <h2 id="admin-list-heading" className="sr-only">
            Liste des participations
          </h2>
          {lastUpdated ? (
            <p className="admin-muted">
              Dernière mise à jour :{" "}
              {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(lastUpdated)}
            </p>
          ) : null}
          {total > rows.length ? (
            <p className="admin-muted admin-list-hint">
              Les {rows.length} inscriptions les plus récentes sont affichées (sur {total} au total).
            </p>
          ) : null}
        </div>

        {listError ? (
          <div className="admin-login-alert admin-panel-alert" role="alert">
            <i className="bi bi-exclamation-circle" aria-hidden />
            <span>{listError}</span>
          </div>
        ) : null}

        <div className={`admin-data ${loading ? "admin-data--loading" : ""}`}>
          {loading ? <span className="admin-data-overlay" aria-hidden /> : null}

          <div className="admin-table-wrap admin-table-wrap--desktop">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Participant</th>
                  <th>Téléphone</th>
                  <th>18+</th>
                  <th>Inscription</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <div className="admin-empty-state">
                        <i className="bi bi-inbox" aria-hidden />
                        <p>
                          {searchActive
                            ? "Aucun résultat pour cette recherche."
                            : "Aucune participation pour le moment."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className="admin-participant">
                          <span className="admin-avatar" aria-hidden>
                            {initialsFromName(row.nom)}
                          </span>
                          <div>
                            <span className="admin-participant-name">{row.nom}</span>
                            <span className="admin-participant-id">#{row.id}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <a className="admin-phone" href={`tel:${row.telephone}`}>
                          {formatPhone(row.telephone)}
                        </a>
                      </td>
                      <td>
                        <span className={`admin-pill ${row.majeur ? "admin-pill--ok" : "admin-pill--no"}`}>
                          {row.majeur ? "Oui" : "Non"}
                        </span>
                      </td>
                      <td className="admin-date">{formatDate(row.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <ul className="admin-mobile-list">
            {filteredRows.length === 0 ? (
              <li className="admin-empty-state admin-empty-state--card">
                <i className="bi bi-inbox" aria-hidden />
                <p>
                  {searchActive ? "Aucun résultat pour cette recherche." : "Aucune participation pour le moment."}
                </p>
              </li>
            ) : (
              filteredRows.map((row) => (
                <li key={row.id} className="admin-mobile-card">
                  <div className="admin-mobile-card-top">
                    <span className="admin-avatar" aria-hidden>
                      {initialsFromName(row.nom)}
                    </span>
                    <div className="admin-mobile-card-head">
                      <span className="admin-participant-name">{row.nom}</span>
                      <span className="admin-participant-id">#{row.id}</span>
                    </div>
                    <span className={`admin-pill ${row.majeur ? "admin-pill--ok" : "admin-pill--no"}`}>
                      18+ {row.majeur ? "oui" : "non"}
                    </span>
                  </div>
                  <div className="admin-mobile-card-meta">
                    <a className="admin-phone" href={`tel:${row.telephone}`}>
                      <i className="bi bi-telephone" aria-hidden />
                      {formatPhone(row.telephone)}
                    </a>
                    <time className="admin-date" dateTime={row.created_at}>
                      {formatDate(row.created_at)}
                    </time>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
