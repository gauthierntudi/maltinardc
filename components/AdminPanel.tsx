"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminBusy } from "@/components/AdminBusy";
import { AdminConfirmModal } from "@/components/AdminConfirmModal";
import {
  downloadParticipationsCsv,
  downloadParticipationsExcel,
} from "@/lib/export-participations";
import { formatPhoneDisplay } from "@/lib/participation";

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
  totalAll?: number;
  limit?: number;
  offset?: number;
};

const PAGE_SIZE = 20;

function formatDate(value: string) {
  const date = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
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

const AVATAR_GRADIENTS = [
  "linear-gradient(145deg, #ffb347 0%, #ff6f00 100%)",
  "linear-gradient(145deg, #86efac 0%, #16a34a 100%)",
  "linear-gradient(145deg, #93c5fd 0%, #2563eb 100%)",
  "linear-gradient(145deg, #f9a8d4 0%, #db2777 100%)",
  "linear-gradient(145deg, #fcd34d 0%, #d97706 100%)",
  "linear-gradient(145deg, #c4b5fd 0%, #7c3aed 100%)",
  "linear-gradient(145deg, #67e8f9 0%, #0891b2 100%)",
  "linear-gradient(145deg, #fca5a5 0%, #dc2626 100%)",
  "linear-gradient(145deg, #bef264 0%, #65a30d 100%)",
  "linear-gradient(145deg, #fdba74 0%, #ea580c 100%)",
  "linear-gradient(145deg, #a5b4fc 0%, #4f46e5 100%)",
  "linear-gradient(145deg, #fde68a 0%, #ca8a04 100%)",
];

function avatarBackground(id: number, nom: string) {
  let hash = id * 2654435761;
  for (let index = 0; index < nom.length; index += 1) {
    hash = (hash + nom.charCodeAt(index) * (index + 1)) | 0;
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
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
  const [listLoading, setListLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState<"csv" | "excel" | null>(null);
  const [rows, setRows] = useState<ParticipationRow[]>([]);
  const [totalAll, setTotalAll] = useState(0);
  const [listTotal, setListTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [listError, setListError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ParticipationRow | null>(null);

  const loadParticipations = useCallback(
    async (pageToLoad = page) => {
      setListLoading(true);
      setListError("");
      try {
        const offset = (pageToLoad - 1) * PAGE_SIZE;
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          offset: String(offset),
        });
        if (searchQuery) {
          params.set("q", searchQuery);
        }

        const response = await fetch(`/api/admin/participations?${params.toString()}`, {
          cache: "no-store",
          credentials: "same-origin",
        });
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
        setListTotal(payload.total ?? 0);
        setTotalAll(payload.totalAll ?? payload.total ?? 0);
        setLastUpdated(new Date());
      } catch {
        setListError("Connexion impossible.");
      } finally {
        setListLoading(false);
      }
    },
    [page, searchQuery],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    void loadParticipations(page);
  }, [page, searchQuery, loadParticipations]);

  async function onLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    setListError("");
    setLoginLoading(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ password }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        setLoginError(payload.error ?? "Connexion refusée.");
        setLoginLoading(false);
        return;
      }
      setPassword("");
      setAuthenticated(true);
      setPage(1);
      await loadParticipations(1);
    } catch {
      setLoginError("Connexion impossible.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function onLogout() {
    setLogoutLoading(true);
    try {
      await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" });
      setAuthenticated(false);
      setRows([]);
      setTotalAll(0);
      setListTotal(0);
      setPage(1);
      setSearchInput("");
      setSearchQuery("");
      setLastUpdated(null);
      setDeleteTarget(null);
    } finally {
      setLogoutLoading(false);
    }
  }

  const fetchExportRows = useCallback(async () => {
    const exportLimit = Math.min(500, Math.max(listTotal, 1));
    const params = new URLSearchParams({
      limit: String(exportLimit),
      offset: "0",
    });
    if (searchQuery) {
      params.set("q", searchQuery);
    }
    const response = await fetch(`/api/admin/participations?${params.toString()}`, {
      cache: "no-store",
      credentials: "same-origin",
    });
    const payload = (await response.json()) as ListResponse;
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error ?? "Export impossible.");
    }
    return payload.rows ?? [];
  }, [listTotal, searchQuery]);

  async function handleExportCsv() {
    if (listTotal === 0 || exportLoading) return;
    setExportLoading("csv");
    setListError("");
    try {
      const exportRows = await fetchExportRows();
      downloadParticipationsCsv(exportRows);
    } catch (error) {
      setListError(error instanceof Error ? error.message : "Export impossible.");
    } finally {
      setExportLoading(null);
    }
  }

  async function handleExportExcel() {
    if (listTotal === 0 || exportLoading) return;
    setExportLoading("excel");
    setListError("");
    try {
      const exportRows = await fetchExportRows();
      await downloadParticipationsExcel(exportRows);
    } catch (error) {
      setListError(error instanceof Error ? error.message : "Export impossible.");
    } finally {
      setExportLoading(null);
    }
  }

  const actionsLocked =
    listLoading || loginLoading || logoutLoading || exportLoading !== null || deletingId !== null;

  const todayCount = useMemo(() => countToday(rows), [rows]);
  const searchActive = searchQuery.length > 0;
  const totalPages = Math.max(1, Math.ceil(listTotal / PAGE_SIZE));
  const rangeStart = listTotal === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, listTotal);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  async function confirmDelete() {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);
    setListError("");
    try {
      const response = await fetch(`/api/admin/participations/${deleteTarget.id}`, { method: "DELETE" });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        if (response.status === 401) {
          setAuthenticated(false);
          setDeleteTarget(null);
          return;
        }
        setListError(payload.error ?? "Suppression impossible.");
        return;
      }
      setDeleteTarget(null);
      const nextPage = rows.length === 1 && page > 1 ? page - 1 : page;
      if (nextPage !== page) {
        setPage(nextPage);
      } else {
        await loadParticipations(page);
      }
    } catch {
      setListError("Suppression impossible.");
    } finally {
      setDeletingId(null);
    }
  }

  function renderDeleteButton(row: ParticipationRow) {
    const busy = deletingId === row.id;
    return (
      <button
        type="button"
        className="admin-icon-btn admin-icon-btn--danger"
        onClick={() => setDeleteTarget(row)}
        disabled={actionsLocked || deleteTarget !== null}
        aria-label={`Supprimer ${row.nom}`}
        title="Supprimer"
      >
        {busy ? (
          <span className="admin-login-spinner admin-login-spinner--inline" aria-hidden />
        ) : (
          <i className="bi bi-trash" aria-hidden />
        )}
      </button>
    );
  }

  if (authenticated === null && listLoading) {
    return (
      <div className="admin-login" aria-busy="true">
        <div className="admin-login-card admin-login-card--center">
          <AdminBusy label="Vérification de la session…" />
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

          <button className="admin-login-submit" type="submit" disabled={loginLoading}>
            {loginLoading ? (
              <AdminBusy label="Connexion…" inline />
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
          <button
            className="admin-btn ghost admin-btn--inline"
            type="button"
            onClick={() => void onLogout()}
            disabled={logoutLoading || actionsLocked}
          >
            {logoutLoading ? (
              <AdminBusy label="Déconnexion…" inline />
            ) : (
              <>
                <i className="bi bi-box-arrow-right" aria-hidden />
                Déconnexion
              </>
            )}
          </button>
        </div>
      </header>

      <section className="admin-stats" aria-label="Statistiques">
        <article className="admin-stat">
          <span className="admin-stat-icon" aria-hidden>
            <i className="bi bi-people-fill" />
          </span>
          <div>
            <p className="admin-stat-value">{totalAll.toLocaleString("fr-FR")}</p>
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
            <p className="admin-stat-value">{listTotal.toLocaleString("fr-FR")}</p>
            <p className="admin-stat-label">
              {searchActive ? "Résultats de recherche" : "Correspondant à la liste"}
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
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Rechercher par nom ou téléphone…"
              aria-label="Rechercher une participation"
              disabled={listLoading && rows.length === 0}
            />
            {searchInput ? (
              <button
                className="admin-search-clear"
                type="button"
                onClick={() => setSearchInput("")}
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
              onClick={() => void loadParticipations(page)}
              disabled={listLoading || exportLoading !== null}
            >
              {listLoading ? (
                <AdminBusy label="Actualisation…" inline />
              ) : (
                <>
                  <i className="bi bi-arrow-clockwise" aria-hidden />
                  Actualiser
                </>
              )}
            </button>
            <button
              className="admin-btn secondary admin-btn--inline"
              type="button"
              onClick={() => void handleExportCsv()}
              disabled={listTotal === 0 || actionsLocked}
            >
              {exportLoading === "csv" ? (
                <AdminBusy label="Export…" inline />
              ) : (
                <>
                  <i className="bi bi-filetype-csv" aria-hidden />
                  CSV
                </>
              )}
            </button>
            <button
              className="admin-btn admin-btn--inline"
              type="button"
              onClick={() => void handleExportExcel()}
              disabled={listTotal === 0 || actionsLocked}
            >
              {exportLoading === "excel" ? (
                <AdminBusy label="Export…" inline />
              ) : (
                <>
                  <i className="bi bi-file-earmark-spreadsheet" aria-hidden />
                  Excel
                </>
              )}
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
          {listTotal > 0 ? (
            <p className="admin-muted admin-list-hint">
              Affichage {rangeStart}–{rangeEnd} sur {listTotal.toLocaleString("fr-FR")}
              {searchActive ? " résultat(s) de recherche" : " participation(s)"}
              {listTotal > PAGE_SIZE ? ` · page ${page} sur ${totalPages}` : ""}
            </p>
          ) : null}
        </div>

        {listError ? (
          <div className="admin-login-alert admin-panel-alert" role="alert">
            <i className="bi bi-exclamation-circle" aria-hidden />
            <span>{listError}</span>
          </div>
        ) : null}

        <div className={`admin-data ${listLoading ? "admin-data--loading" : ""}`} aria-busy={listLoading}>
          {listLoading ? (
            <div className="admin-data-overlay">
              <AdminBusy label="Chargement des participations…" />
            </div>
          ) : null}

          <div className="admin-table-wrap admin-table-wrap--desktop">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Participant</th>
                  <th>Téléphone</th>
                  <th>18+</th>
                  <th>Inscription</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
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
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className="admin-participant">
                          <span
                            className="admin-avatar"
                            style={{ background: avatarBackground(row.id, row.nom) }}
                            aria-hidden
                          >
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
                          {formatPhoneDisplay(row.telephone)}
                        </a>
                      </td>
                      <td>
                        <span className={`admin-pill ${row.majeur ? "admin-pill--ok" : "admin-pill--no"}`}>
                          {row.majeur ? "Oui" : "Non"}
                        </span>
                      </td>
                      <td className="admin-date">{formatDate(row.created_at)}</td>
                      <td className="admin-row-actions">{renderDeleteButton(row)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <ul className="admin-mobile-list">
            {rows.length === 0 ? (
              <li className="admin-empty-state admin-empty-state--card">
                <i className="bi bi-inbox" aria-hidden />
                <p>
                  {searchActive ? "Aucun résultat pour cette recherche." : "Aucune participation pour le moment."}
                </p>
              </li>
            ) : (
              rows.map((row) => (
                <li key={row.id} className="admin-mobile-card">
                  <div className="admin-mobile-card-top">
                    <span
                      className="admin-avatar"
                      style={{ background: avatarBackground(row.id, row.nom) }}
                      aria-hidden
                    >
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
                      {formatPhoneDisplay(row.telephone)}
                    </a>
                    <time className="admin-date" dateTime={row.created_at}>
                      {formatDate(row.created_at)}
                    </time>
                    {renderDeleteButton(row)}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        {listTotal > PAGE_SIZE ? (
          <nav className="admin-pagination" aria-label="Pagination des participations">
            <button
              type="button"
              className="admin-btn ghost admin-btn--inline admin-pagination-btn"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1 || listLoading || actionsLocked}
            >
              <i className="bi bi-chevron-left" aria-hidden />
              Précédent
            </button>
            <span className="admin-pagination-status">
              Page {page} / {totalPages}
            </span>
            <button
              type="button"
              className="admin-btn ghost admin-btn--inline admin-pagination-btn"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages || listLoading || actionsLocked}
            >
              Suivant
              <i className="bi bi-chevron-right" aria-hidden />
            </button>
          </nav>
        ) : null}
      </section>

      <AdminConfirmModal
        open={deleteTarget !== null}
        title="Supprimer ce participant ?"
        message={
          deleteTarget ? (
            <>
              <p>Cette action est définitive. Le participant pourra s&apos;inscrire à nouveau avec le même numéro.</p>
              <p className="admin-modal-highlight">
                <strong>{deleteTarget.nom}</strong>
              </p>
              <p className="admin-modal-meta">
                {formatPhoneDisplay(deleteTarget.telephone)} · #{deleteTarget.id}
              </p>
            </>
          ) : null
        }
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        loading={deleteTarget !== null && deletingId === deleteTarget.id}
        onConfirm={() => void confirmDelete()}
        onCancel={() => {
          if (deletingId === null) setDeleteTarget(null);
        }}
      />
    </div>
  );
}
