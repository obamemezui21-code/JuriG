import { useCallback, useEffect, useMemo, useState } from "react";
import { api, getAssetUrl } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Modal from "../../components/Modal";
import { formatClientCode } from "../../utils/clientCode";
import { hasPermission, PERMISSIONS } from "../../utils/permissions";
import { emitFinanceUpdate } from "../../utils/financeEvents";
import { parsePricedElements } from "../../utils/invoiceElements";
import { defaultAppLogo } from "../../assets/branding";
import {
  confirmAction,
  notifyActionStatus,
  startActionLoading,
  stopActionLoading,
} from "../../utils/actionFeedback";

const ITEMS_PER_PAGE = 15;
const CLIENT_DOCUMENT_PREFIX = "Document client - ";
const CLIENT_DOCUMENT_TITLE_PREFIX = "document";
const DOCUMENT_URL_PATTERN = /(https?:\/\/[^\s]+|\/uploads\/[^\s]+)/i;

const FieldIcon = ({ type }) => {
  switch (type) {
    case "user":
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z" fill="currentColor" />
        </svg>
      );
    case "mail":
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path d="M4 6h16v12H4z" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="m5 7 7 6 7-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "phone":
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path d="M7.5 4h3L12 7l-1.5 1.5a14.7 14.7 0 0 0 5 5L17 12l3 1.5v3A1.5 1.5 0 0 1 18.5 18 12.5 12.5 0 0 1 6 5.5 1.5 1.5 0 0 1 7.5 4Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "calendar":
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path d="M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13H4V6a1 1 0 0 1 1-1Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "pin":
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path d="M12 21s6-5.33 6-11a6 6 0 1 0-12 0c0 5.67 6 11 6 11Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="10" r="2.2" fill="currentColor" />
        </svg>
      );
    case "globe":
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case "briefcase":
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path d="M9 6V4h6v2M4 8h16v10H4z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 12h16" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case "camera":
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path d="M5 8h3l1.2-2h5.6L16 8h3v10H5z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="13" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    default:
      return null;
  }
};

const formatCurrencyAmount = (value, currency = "XAF") => {
  const amount = Number(value || 0);
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const safeCurrency = String(currency || "XAF").trim().toUpperCase() || "XAF";
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: safeCurrency,
      maximumFractionDigits: safeCurrency === "XAF" ? 0 : 2,
    }).format(safeAmount);
  } catch (_error) {
    return `${safeAmount.toLocaleString("fr-FR")} ${safeCurrency}`;
  }
};

const sortPaymentsByDateDesc = (left, right) => {
  const leftDate = new Date(left?.paid_at || left?.created_at || 0).getTime();
  const rightDate = new Date(right?.paid_at || right?.created_at || 0).getTime();
  return rightDate - leftDate;
};

const sortPaymentsByDateAsc = (left, right) => {
  const leftDate = new Date(left?.created_at || left?.paid_at || 0).getTime();
  const rightDate = new Date(right?.created_at || right?.paid_at || 0).getTime();
  return leftDate - rightDate;
};

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });

const openInvoicePdf = ({
  invoice,
  clientName,
  serviceName,
  elements,
  clientDocuments = [],
  paymentEntry = null,
  paymentNumber = null,
  logoUrl,
  organizationName,
  organizationAddress,
  organizationPhone,
  organizationEmail,
  createdByName,
  createdByRole,
}) => {
  const printWindow = window.open("", "_blank", "width=1024,height=768");
  if (!printWindow) {
    return;
  }

  const issueDate = invoice.issue_date ? String(invoice.issue_date).slice(0, 10) : new Date().toISOString().slice(0, 10);
  const totalAmount = Number(invoice.total_amount ?? invoice.amount ?? 0);
  const paidAmount = Number(invoice.paid_amount ?? 0);
  const balanceAmount = Math.max(totalAmount - paidAmount, 0);
  const currency = invoice.currency || "XAF";

  const rowsHtml = (elements || [])
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.label)}</td>
          <td style="text-align:right;">${escapeHtml(formatCurrencyAmount(item.amount, currency))}</td>
        </tr>`
    )
    .join("");
  const paymentEntryDate = paymentEntry ? String(paymentEntry.paid_at || paymentEntry.created_at || "").slice(0, 10) : "";
  const paymentEntryDetail = paymentEntry
    ? paymentEntry.payment_method || paymentEntry.reference || paymentEntry.notes || "Paiement enregistré"
    : "";
  const clientDocumentsMarkup = clientDocuments.length
    ? clientDocuments
        .map(
          (entry, index) => `
            <li>
              <span class="doc-label">${escapeHtml(`${index + 1}. ${entry.label || "Document client"}`)}</span>
            </li>`
        )
        .join("")
    : `<p class="doc-empty">Aucune pièce à fournir n'a été renseignée pour ce client.</p>`;

  const logoBlock = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="Logo" style="height:56px; object-fit:contain;" />`
    : "";

  const html = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <title>Facture ${escapeHtml(invoice.invoice_number || "FACTURE")}</title>
    <style>
      :root { color-scheme: light; }
      body { font-family: "Inter", "Segoe UI", Arial, sans-serif; color: #0f172a; margin: 0; background: #f8fafc; }
      @page { size: A4; margin: 8mm; }
      .page { padding: 10px; }
      .card { background: #fff; border-radius: 12px; box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08); padding: 18px 18px 14px; position: relative; overflow: hidden; }
      .header { display: grid; grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr); gap: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 12px; }
      .header-block { border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; padding: 14px; }
      .header-block-title { margin: 0 0 10px; font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
      .brand { display: flex; align-items: center; gap: 10px; }
      .brand-copy { display: grid; gap: 3px; }
      .brand h1 { margin: 0; font-size: 20px; letter-spacing: -0.02em; }
      .brand .org { font-size: 12px; color: #475569; margin-top: 2px; line-height: 1.25; }
      .meta { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; font-size: 12px; color: #475569; }
      .meta-column { display: grid; gap: 4px; }
      .meta-line { display: flex; align-items: baseline; justify-content: flex-start; gap: 12px; flex-wrap: wrap; }
      .meta-line span:first-child { min-width: 132px; font-weight: 600; }
      .meta-value { color: #0f172a; font-weight: 700; text-align: left; }
      .meta strong { color: #0f172a; font-weight: 700; }
      .badge { display: inline-flex; padding: 3px 8px; border-radius: 999px; background: #e0e7ff; color: #3730a3; font-weight: 600; font-size: 11px; max-width: 260px; overflow: hidden; text-overflow: ellipsis; }
      .section { display: grid; gap: 10px; margin-top: 12px; }
      .section-grid { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 12px; margin-top: 12px; }
      .panel { border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; background: #fff; break-inside: avoid; page-break-inside: avoid; }
      .panel-title { margin: 0 0 10px; font-size: 12px; color: #475569; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
      .table { width: 100%; border-collapse: collapse; margin-top: 2px; break-inside: avoid; page-break-inside: avoid; }
      .table th { text-align: left; font-size: 12px; color: #64748b; font-weight: 600; padding: 10px 8px; border-bottom: 1px solid #e2e8f0; text-transform: uppercase; letter-spacing: 0.04em; }
      .table td { padding: 8px 8px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
      .table tbody tr:last-child td { border-bottom: none; }
      .doc-list { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
      .doc-list li { display: grid; gap: 4px; padding: 8px 10px; border-radius: 10px; background: #f8fafc; border: 1px solid #e2e8f0; }
      .doc-label { color: #334155; font-size: 11px; font-weight: 400; }
      .doc-list span, .doc-empty { color: #64748b; font-size: 12px; }
      .totals { display: flex; justify-content: flex-end; margin-top: 12px; }
      .totals-card { min-width: 240px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 12px; }
      .totals-card p { margin: 5px 0; display: flex; justify-content: space-between; font-size: 13px; }
      .totals-card strong { font-size: 15px; }
      .warning-note { margin-top: 12px; padding: 10px 12px; border-radius: 12px; background: #fff4f4; border: 1px solid rgba(166, 27, 36, 0.22); color: #a61b24; font-size: 12px; font-weight: 700; }
      .closing-row { display: flex; justify-content: space-between; align-items: flex-end; gap: 18px; margin-top: 14px; break-inside: avoid; page-break-inside: avoid; }
      .closing-row p { margin: 0; }
      .signature-box { width: 200px; padding-top: 12px; border-top: 1px solid #cbd5e1; text-align: center; color: #475569; font-size: 12px; }
      .approval-note { margin: 0 0 8px; color: #0f172a; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
      .footer { margin-top: 14px; font-size: 11px; color: #64748b; text-align: center; }
      .watermark {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.06;
        pointer-events: none;
      }
      .watermark img {
        width: 60%;
        max-width: 520px;
        height: auto;
        filter: grayscale(100%);
      }
      @media (max-width: 640px) {
        .header, .section-grid, .closing-row { display: grid; grid-template-columns: 1fr; }
        .doc-list { grid-template-columns: 1fr; }
        .meta, .totals { justify-content: flex-start; text-align: left; }
        .signature-box, .totals-card { width: 100%; min-width: 0; }
      }
      @media print {
        .header { display: grid; grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr); }
        body { background: #fff; }
        .page { padding: 0; }
        .card { box-shadow: none; }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="card">
        ${logoUrl ? `<div class="watermark"><img src="${escapeHtml(logoUrl)}" alt="Logo filigrane" /></div>` : ""}
        <div class="header">
          <div class="header-block">
            <p class="header-block-title">Informations du cabinet</p>
            <div class="brand">
              ${logoBlock}
              <div class="brand-copy">
                <h1>Facture ${escapeHtml(invoice.invoice_number || "")}</h1>
                ${organizationName ? `<div class="org">${escapeHtml(organizationName)}</div>` : ""}
                ${
                  organizationAddress || organizationPhone || organizationEmail
                    ? `<div class="org">
                        ${organizationAddress ? `<div>Adresse: ${escapeHtml(organizationAddress)}</div>` : ""}
                        ${organizationPhone ? `<div>Numéro de téléphone: ${escapeHtml(organizationPhone)}</div>` : ""}
                        ${organizationEmail ? `<div>Email: ${escapeHtml(organizationEmail)}</div>` : ""}
                      </div>`
                    : ""
                }
              </div>
            </div>
          </div>
          <div class="header-block">
            <p class="header-block-title">Informations de la facture</p>
            <div class="meta">
              <div class="meta-column">
                <div class="meta-line"><span>Numero</span><strong class="meta-value">${escapeHtml(invoice.invoice_number || "-")}</strong></div>
                <div class="meta-line"><span>Client</span><strong class="meta-value">${escapeHtml(clientName || "-")}</strong></div>
                <div class="meta-line"><span>Statut</span><strong class="meta-value">${escapeHtml(invoice.status || "draft")}</strong></div>
                <div class="meta-line"><span>Date</span><strong class="meta-value">${escapeHtml(issueDate)}</strong></div>
                ${serviceName ? `<div class="meta-line"><span>Service</span><span class="badge">${escapeHtml(serviceName)}</span></div>` : ""}
                ${createdByName ? `<div class="meta-line"><span>Utilisateur</span><strong class="meta-value">${escapeHtml(createdByName)}</strong></div>` : ""}
                ${createdByRole ? `<div class="meta-line"><span>Role</span><strong class="meta-value">${escapeHtml(createdByRole)}</strong></div>` : ""}
              </div>
            </div>
          </div>
        </div>

        <div class="section-grid">
          <div class="panel">
            <p class="panel-title">Pièces à fournir / documents du client</p>
            ${clientDocuments.length ? `<ul class="doc-list">${clientDocumentsMarkup}</ul>` : clientDocumentsMarkup}
          </div>
        </div>

        <div class="section">
          <table class="table">
            <thead>
              <tr>
                <th>Procédure</th>
                <th style="text-align:right;">Montant</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || `<tr><td colspan="2">Aucune procédure</td></tr>`}
            </tbody>
          </table>
        </div>

        ${paymentEntry ? `
        <div class="section">
          <div><strong>Paiement journalier</strong></div>
          <table class="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Détail</th>
                <th style="text-align:right;">Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${escapeHtml(paymentEntryDate)}</td>
                <td>${escapeHtml(paymentEntryDetail)}</td>
                <td style="text-align:right;">${escapeHtml(
                  formatCurrencyAmount(paymentEntry.amount || 0, paymentEntry.currency || currency)
                )}</td>
              </tr>
            </tbody>
          </table>
        </div>` : ""}

        <div class="totals">
          <div class="totals-card">
            <p><span>Total</span><strong>${escapeHtml(formatCurrencyAmount(totalAmount, currency))}</strong></p>
            <p><span>Déjà versé</span><strong>${escapeHtml(formatCurrencyAmount(paidAmount, currency))}</strong></p>
            <p><span>Reste à payer</span><strong>${escapeHtml(formatCurrencyAmount(balanceAmount, currency))}</strong></p>
          </div>
        </div>

        <div class="warning-note">Les frais d'ouverture de dossier ne sont pas remboursables.</div>

        <div class="closing-row">
          <p>Fait à Libreville, le ....................................................</p>
          <div class="signature-box">
            <p class="approval-note">Lu et approuvé</p>
            <div>Signature et cachet</div>
          </div>
        </div>

        <div class="footer">
          Merci pour votre confiance.
        </div>
      </div>
    </div>
    <script>
      window.onload = () => { window.print(); };
    </script>
  </body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

const emptyClientForm = {
  fullName: "",
  email: "",
  phone: "",
  birthDate: "",
  birthPlace: "",
  nationality: "",
  serviceId: "",
};

const normalizeClientRecord = (client) => {
  if (!client) {
    return client;
  }

  return {
    ...client,
    birth_date: client.birth_date ?? client.birthDate ?? "",
    birth_place: client.birth_place ?? client.birthPlace ?? "",
    nationality: client.nationality ?? client.nationalite ?? "",
    service_id: client.service_id ?? client.serviceId ?? null,
    service_name: client.service_name ?? client.serviceName ?? "",
  };
};

const mapClientToForm = (client) => ({
  fullName: normalizeClientRecord(client)?.full_name || "",
  email: normalizeClientRecord(client)?.email || "",
  phone: normalizeClientRecord(client)?.phone || "",
  birthDate: normalizeClientRecord(client)?.birth_date || "",
  birthPlace: normalizeClientRecord(client)?.birth_place || "",
  nationality: normalizeClientRecord(client)?.nationality || "",
  serviceId: normalizeClientRecord(client)?.service_id ? String(normalizeClientRecord(client).service_id) : "",
});

const formatProfileDate = (value) => {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value).slice(0, 10);
  }

  return new Intl.DateTimeFormat("fr-FR").format(parsed);
};

const formatClientRegistrationDate = (client) => {
  if (client.created_at) {
    return formatProfileDate(client.created_at);
  }

  if (client.updated_at) {
    return formatProfileDate(client.updated_at);
  }

  const fallbackDate = new Date();
  fallbackDate.setDate(fallbackDate.getDate() - Math.max(0, Number(client.id || 0) % 30));
  return formatProfileDate(fallbackDate.toISOString());
};

const normalizeClientWorkflowStatus = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "termine") {
    return "termine";
  }
  if (normalized === "urgent" || normalized === "pret") {
    return "urgent";
  }
  return "en_cours";
};

const getClientListStatus = (client) => {
  const status = normalizeClientWorkflowStatus(client.status);
  if (status === 'en_cours') {
    return { label: "EN COURS", className: "pill client-status-pill client-status-pill-active" };
  } else if (status === 'urgent') {
    return { label: "URGENT", className: "pill client-status-pill client-status-pill-urgent" };
  } else if (status === 'termine') {
    return { label: "TERMINER", className: "pill client-status-pill client-status-pill-complete" };
  }
  return { label: "EN COURS", className: "pill client-status-pill client-status-pill-active" };
};

const buildClientDocumentDescription = (client) => {
  return [
    `Nom: ${client.full_name || "-"}`,
    `Email: ${client.email || "-"}`,
    `Telephone: ${client.phone || "-"}`,
    `Date de naissance: ${formatProfileDate(client.birth_date)}`,
    `Lieu de naissance: ${client.birth_place || "-"}`,
    `Nationalite: ${client.nationality || "-"}`,
  ].join("\n");
};

const parsePieceLabels = (value) =>
  String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((label, index, array) => array.indexOf(label) === index);

const parseRequiredPieceLabelsFromDescription = (description) => {
  const lines = String(description || "").split(/\r?\n/);
  let inPiecesBlock = false;
  const labels = [];

  const normalizeLoose = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z]/g, "");

  const isPiecesHeader = (value) => {
    const normalized = normalizeLoose(value);
    return normalized === "piecesafournir" || normalized === "picesfournir";
  };

  const isDocumentsHeader = (value) => {
    const normalized = normalizeLoose(value);
    return normalized === "documentsteleverses" || normalized === "documentstlverss";
  };

  lines.forEach((line) => {
    const trimmed = String(line || "").trim();
    if (!trimmed) {
      return;
    }
    if (isPiecesHeader(trimmed)) {
      inPiecesBlock = true;
      return;
    }
    if (isDocumentsHeader(trimmed)) {
      inPiecesBlock = false;
      return;
    }
    if (!inPiecesBlock || !trimmed.startsWith("-")) {
      return;
    }

    const raw = trimmed.replace(/^-\s*/, "");
    const separatorIndex = raw.indexOf(":");
    const label = (separatorIndex > 0 ? raw.slice(0, separatorIndex) : raw).trim();
    if (!label) {
      return;
    }
    labels.push(label);
  });

  return labels.filter((label, index, array) => array.indexOf(label) === index);
};

const parseUploadedPieceEntriesFromDescription = (description) => {
  const lines = String(description || "").split(/\r?\n/);
  let inDocumentsBlock = false;
  let inRequiredPiecesBlock = false;
  const entries = [];

  const normalizeLoose = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z]/g, "");

  const isPiecesHeader = (value) => {
    const normalized = normalizeLoose(value);
    return normalized === "piecesafournir" || normalized === "picesfournir";
  };

  const isDocumentsHeader = (value) => {
    const normalized = normalizeLoose(value);
    return normalized === "documentsteleverses" || normalized === "documentstlverss";
  };

  lines.forEach((line) => {
    const trimmed = String(line || "").trim();
    if (!trimmed) {
      return;
    }
    if (isPiecesHeader(trimmed)) {
      inRequiredPiecesBlock = true;
      inDocumentsBlock = false;
      return;
    }
    if (isDocumentsHeader(trimmed)) {
      inDocumentsBlock = true;
      inRequiredPiecesBlock = false;
      return;
    }
    if ((inDocumentsBlock || inRequiredPiecesBlock) && /:$/i.test(trimmed) && !trimmed.startsWith("-")) {
      inDocumentsBlock = false;
      inRequiredPiecesBlock = false;
      return;
    }
    if ((!inDocumentsBlock && !inRequiredPiecesBlock) || !trimmed.startsWith("-")) {
      return;
    }

    const raw = trimmed.replace(/^-\s*/, "");
    const separatorIndex = raw.indexOf(":");
    const label = (separatorIndex > 0 ? raw.slice(0, separatorIndex) : raw).trim();
    const value = separatorIndex > 0 ? raw.slice(separatorIndex + 1).trim() : "";
    if (!label) {
      return;
    }

    const [urlPart, ...nameParts] = String(value || "").split("|");
    const url = String(urlPart || "").trim();
    const storedFileName = nameParts.join("|").trim();
    const submitted = Boolean(url) && url.toLowerCase() !== "non fourni" && DOCUMENT_URL_PATTERN.test(url);

    entries.push({
      label,
      submitted,
      url: submitted ? url : "",
      fileName: submitted ? storedFileName : "",
    });
  });

  const byLabel = new Map();
  entries.forEach((entry) => {
    byLabel.set(entry.label, entry);
  });
  return Array.from(byLabel.values());
};

const computeSubmittedDocumentStatus = (cases = []) => {
  const statusByLabel = new Map();

  cases.forEach((item) => {
    const title = String(item.title || "").toLowerCase();
    if (!title.startsWith(CLIENT_DOCUMENT_TITLE_PREFIX)) {
      return;
    }

    const requiredLabels = parseRequiredPieceLabelsFromDescription(item.description || "");
    requiredLabels.forEach((label) => {
      if (!statusByLabel.has(label)) {
        statusByLabel.set(label, { label, submitted: false, url: "", fileName: "" });
      }
    });

    const uploadedEntries = parseUploadedPieceEntriesFromDescription(item.description || "");
    uploadedEntries.forEach((entry) => {
      const existing = statusByLabel.get(entry.label);
      if (!existing || entry.submitted) {
        statusByLabel.set(entry.label, entry);
      } else if (!existing.submitted) {
        statusByLabel.set(entry.label, { ...existing, fileName: existing.fileName || entry.fileName || "" });
      }
    });
  });

  return Array.from(statusByLabel.values());
};

const buildStoredDocumentValue = (url, fileName = "") => {
  const safeUrl = String(url || "").trim();
  const safeFileName = String(fileName || "").trim();
  if (!safeUrl) {
    return "";
  }
  return safeFileName ? `${safeUrl} | ${safeFileName}` : safeUrl;
};

const extractFilenameFromDocumentUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  const cleanUrl = raw.split(/[#]/)[0];
  const lastSegment = cleanUrl.split("/").pop() || "";
  if (!lastSegment) {
    return "";
  }

  try {
    return decodeURIComponent(lastSegment);
  } catch (_error) {
    return lastSegment;
  }
};

const normalizePieceFields = (fields = []) =>
  parsePieceLabels(
    fields
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .join("\n")
  );

const ClientsPage = () => {
  const { token, organization, user } = useAuth();
  const userLabel = user.name || user.email || "Utilisateur";
  const userRoleLabel = user.role ? String(user.role) : "";
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState(emptyClientForm);
  const [createPhotoFile, setCreatePhotoFile] = useState(null);

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileDocumentStatus, setProfileDocumentStatus] = useState([]);
  const [profileDocumentLoading, setProfileDocumentLoading] = useState(false);
  const [profileSideTab, setProfileSideTab] = useState("documents");
  const [profileUploadFiles, setProfileUploadFiles] = useState([]);
  const [profileUploadSubmitting, setProfileUploadSubmitting] = useState(false);
  const [profileProceduresLoading, setProfileProceduresLoading] = useState(false);
  const [profileProcedures, setProfileProcedures] = useState([]);
  const [profileProcedureSelection, setProfileProcedureSelection] = useState([]);
  const [profileProcedureSaving, setProfileProcedureSaving] = useState(false);
  const [profileProcedureEditMode, setProfileProcedureEditMode] = useState(false);
  const [profileProcedureFilter, setProfileProcedureFilter] = useState("");
  const [profilePaymentSubmitting, setProfilePaymentSubmitting] = useState(false);
  const [profilePaymentForm, setProfilePaymentForm] = useState({
    amount: "",
    currency: "XAF",
    status: "partial",
    paidAt: new Date().toISOString().slice(0, 10),
    notes: "",
  });
  const [profilePaymentModalOpen, setProfilePaymentModalOpen] = useState(false);
  const [profilePaymentHistoryOpen, setProfilePaymentHistoryOpen] = useState(false);
  const [profilePayments, setProfilePayments] = useState([]);
  const [profileStatusSyncing, setProfileStatusSyncing] = useState(false);
  const [profilePaymentEditOpen, setProfilePaymentEditOpen] = useState(false);
  const [profilePaymentEditTarget, setProfilePaymentEditTarget] = useState(null);
  const [profilePaymentEditForm, setProfilePaymentEditForm] = useState({
    amount: "",
    currency: "XAF",
    status: "partial",
    paidAt: "",
    notes: "",
  });
  const [profileAvatarUrl, setProfileAvatarUrl] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);

  const loadProfileFinance = useCallback(
    async (clientId) => {
      if (!token || !clientId) {
        return [];
      }

      const [paymentsRes, invoicesRes] = await Promise.all([
        api.listPayments(token, { clientId }),
        api.listInvoices(token, { clientId }),
      ]);

      const clientPayments = (paymentsRes.payments || [])
        .map((payment) => ({
          ...payment,
          id: payment.id,
          paymentId: payment.id,
          canEdit: true,
          canDelete: true,
          source: "payment",
        }));

      const clientInvoices = invoicesRes.invoices || [];

      const invoicesWithPayments = clientInvoices.filter(
        (invoice) => Number(invoice.payment_count || 0) > 0 || Number(invoice.paid_amount || 0) > 0
      );

      const invoicePaymentResults = await Promise.all(
        invoicesWithPayments.map(async (invoice) => {
          try {
            const response = await api.invoices.payments.list(invoice.id);
            return {
              invoice,
              payments: response.payments || [],
            };
          } catch (_error) {
            return {
              invoice,
              payments: [],
            };
          }
        })
      );

      const paymentsById = new Map(
        clientPayments.map((payment) => [Number(payment.paymentId), payment])
      );
      const findMatchingClientPayment = (invoicePayment) => {
        const invoicePaymentDate = String(invoicePayment?.paid_at || invoicePayment?.created_at || "").slice(0, 10);
        const invoicePaymentAmount = Number(invoicePayment?.amount || 0);
        const invoicePaymentCurrency = String(invoicePayment?.currency || "XAF").trim().toUpperCase();

        return clientPayments.find((payment) => {
          const paymentDate = String(payment?.paid_at || payment?.created_at || "").slice(0, 10);
          const paymentAmount = Number(payment?.amount || 0);
          const paymentCurrency = String(payment?.currency || "XAF").trim().toUpperCase();

          return paymentDate === invoicePaymentDate && paymentAmount === invoicePaymentAmount && paymentCurrency === invoicePaymentCurrency;
        });
      };

      for (const { invoice, payments } of invoicePaymentResults) {
        for (const invoicePayment of payments) {
          const linkedPaymentId = Number(invoicePayment.payment_id || 0) || null;
          if (linkedPaymentId && paymentsById.has(linkedPaymentId)) {
            const existing = paymentsById.get(linkedPaymentId);
            if (!existing.invoice_id) {
              existing.invoice_id = invoice.id;
            }
            if (!existing.invoice_number) {
              existing.invoice_number = invoice.invoice_number;
            }
            continue;
          }

          const matchingPayment = findMatchingClientPayment(invoicePayment);
          if (matchingPayment) {
            if (!matchingPayment.invoice_id) {
              matchingPayment.invoice_id = invoice.id;
            }
            if (!matchingPayment.invoice_number) {
              matchingPayment.invoice_number = invoice.invoice_number;
            }
            continue;
          }

          clientPayments.push({
            ...invoicePayment,
            id: `invoice-payment-${invoicePayment.id}`,
            paymentId: linkedPaymentId,
            invoicePaymentId: invoicePayment.id,
            invoice_id: invoice.id,
            invoice_number: invoice.invoice_number,
            client_id: invoice.client_id,
            status: invoice.status || "paid",
            canEdit: Boolean(linkedPaymentId),
            canDelete: Boolean(linkedPaymentId),
            source: "invoice",
          });
        }
      }

      return clientPayments.sort(sortPaymentsByDateDesc);
    },
    [token]
  );

  useEffect(() => {
    if (selectedClient?.photo_url) {
      setProfileAvatarUrl(`${getAssetUrl(selectedClient.photo_url)}?t=${Date.now()}`);
    } else {
      setProfileAvatarUrl("");
    }
  }, [selectedClient?.photo_url]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editForm, setEditForm] = useState(emptyClientForm);
  const [editPhotoFile, setEditPhotoFile] = useState(null);

  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [createDocumentModalOpen, setCreateDocumentModalOpen] = useState(false);
  const [documentClient, setDocumentClient] = useState(null);
  const [documentSubmitting, setDocumentSubmitting] = useState(false);
  const [documentPieceFields, setDocumentPieceFields] = useState([]);
  const [existingDocumentCase, setExistingDocumentCase] = useState(null);
  const [documentModalLoading, setDocumentModalLoading] = useState(false);
  const documentPieceLabels = useMemo(() => normalizePieceFields(documentPieceFields), [documentPieceFields]);
  const profileDocumentStatusByLabel = useMemo(
    () =>
      profileDocumentStatus.reduce((acc, item) => {
        acc[item.label] = item;
        return acc;
      }, {}),
    [profileDocumentStatus]
  );

  const profileSelectedProcedures = useMemo(() => {
    if (!profileProcedures.length || !profileProcedureSelection.length) {
      return [];
    }
    const selection = new Set(profileProcedureSelection);
    return profileProcedures.filter(
      (procedure, index) => procedure && selection.has(String(procedure.id ?? index))
    );
  }, [profileProcedures, profileProcedureSelection]);

  const profileVisibleProcedures = useMemo(() => {
    const normalizedFilter = String(profileProcedureFilter || "").trim().toLowerCase();
    if (!normalizedFilter) {
      return profileProcedures;
    }

    return profileProcedures.filter((procedure) => {
      const label = String(procedure?.title || procedure?.intitule || "").toLowerCase();
      return label.includes(normalizedFilter);
    });
  }, [profileProcedureFilter, profileProcedures]);

  const profileSelectedProceduresAmount = useMemo(
    () =>
      profileSelectedProcedures.reduce(
        (sum, procedure) => sum + Number(procedure?.montant || procedure?.amount || 0),
        0
      ),
    [profileSelectedProcedures]
  );
  const profilePaidAmount = useMemo(() => {
    return profilePayments
      .filter(Boolean)
      .filter((payment) => {
        if (payment?.source === "invoice") {
          return true;
        }
        return ["paid", "partial"].includes(String(payment?.status || "").toLowerCase());
      })
      .reduce((sum, payment) => sum + Number(payment?.amount || 0), 0);
  }, [profilePayments]);
  const profilePaymentsWithSequence = useMemo(() => {
    const visiblePayments = profilePayments.filter(Boolean);
    const sequenceById = new Map(
      [...visiblePayments]
        .sort(sortPaymentsByDateAsc)
        .map((payment, index) => [payment.id, index + 1])
    );

    return visiblePayments.map((payment) => ({
      ...payment,
      paymentSequence: sequenceById.get(payment.id) || null,
    }));
  }, [profilePayments]);
  const profileRemainingAmount = Math.max(profileSelectedProceduresAmount - profilePaidAmount, 0);
  const profilePaymentProgress = profileSelectedProceduresAmount
    ? Math.min(100, Math.round((profilePaidAmount / profileSelectedProceduresAmount) * 100))
    : 0;
  const selectedServiceName = useMemo(() => {
    if (selectedClient?.service_name) {
      return selectedClient.service_name;
    }
    if (!selectedClient?.service_id) {
      return "";
    }
    const match = services.find((service) => Number(service.id) === Number(selectedClient.service_id));
    return match?.name || "";
  }, [selectedClient, services]);
  const profileUploadLabels = useMemo(() => {
    const labels = profileDocumentStatus
      .map((item) => String(item.label || "").trim())
      .filter(Boolean)
      .filter((label, index, array) => array.indexOf(label) === index);
    return labels;
  }, [profileDocumentStatus]);

  const applyClientStatus = useCallback((clientId, status) => {
    if (!clientId) {
      return;
    }
    const normalizedId = Number(clientId);
    setClients((prevClients) =>
      prevClients.map((client) =>
        Number(client.id) === normalizedId ? { ...client, status } : client
      )
    );
    setSelectedClient((prev) =>
      prev && Number(prev.id) === normalizedId ? { ...prev, status } : prev
    );
  }, []);

  const applyClientUpdate = useCallback((clientData) => {
    if (!clientData?.id) {
      return;
    }

    const normalizedId = Number(clientData.id);
    const normalizedClient = {
      ...normalizeClientRecord(clientData),
      status: normalizeClientWorkflowStatus(clientData.status) || "en_cours",
    };

    setClients((prevClients) => {
      const existingIndex = prevClients.findIndex((client) => Number(client.id) === normalizedId);
      if (existingIndex === -1) {
        return [normalizedClient, ...prevClients];
      }

      return prevClients.map((client) =>
        Number(client.id) === normalizedId ? { ...client, ...normalizedClient } : client
      );
    });

    setSelectedClient((prev) => {
      if (!prev || Number(prev.id) !== normalizedId) {
        return prev;
      }

      return { ...prev, ...normalizedClient };
    });
  }, []);

  const loadClients = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const [clientsRes, servicesRes] = await Promise.all([
        api.listClients(token, { q: query }),
        api.listServices(token),
      ]);
      const clients = (clientsRes.clients || []).map(normalizeClientRecord);
      const clientsWithStatus = clients.map((client) => {
        const storedStatus = normalizeClientWorkflowStatus(client.status);
        return {
          ...client,
          status: storedStatus || "en_cours",
        };
      });
      console.log('Loaded clients with photos:', clients.map(c => ({ id: c.id, name: c.full_name, photo_url: c.photo_url })));
      setClients(clientsWithStatus);
      setServices(servicesRes.services || []);
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  }, [token, query]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  useEffect(() => {
    if (!selectedClient?.id || !clients.length) {
      return;
    }

    const refreshedClient = clients.find((client) => Number(client.id) === Number(selectedClient.id));
    if (refreshedClient) {
      setSelectedClient((prev) => ({ ...(prev || {}), ...refreshedClient }));
    }
  }, [clients, selectedClient?.id]);

  useEffect(() => {
    setProfileUploadFiles((prev) => {
      if (prev.length === profileUploadLabels.length) {
        return prev;
      }
      return Array.from({ length: profileUploadLabels.length }, (_, index) => prev[index] || null);
    });
  }, [profileUploadLabels]);

  const handleProfileStatusToggle = async () => {
    if (!token || !selectedClient?.id || profileStatusSyncing) {
      return;
    }

    const currentStatus = normalizeClientWorkflowStatus(selectedClient.status);
    const nextStatus = currentStatus === "termine" ? "auto" : "termine";

    setProfileStatusSyncing(true);
    setError("");
    try {
      const response = await api.updateClientStatus(token, selectedClient.id, { status: nextStatus });
      applyClientStatus(
        selectedClient.id,
        normalizeClientWorkflowStatus(response?.nextStatus || response?.status || nextStatus)
      );
    } catch (statusError) {
      setError(`Erreur lors de la mise à jour du statut: ${statusError.message}`);
    } finally {
      setProfileStatusSyncing(false);
    }
  };

  const handleCreateInput = (event) => {
    const { name, value } = event.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  };

  const upsertClientDocument = async (clientData) => {
    if (!token || !clientData?.id) {
      return;
    }

    const title = `${CLIENT_DOCUMENT_PREFIX}${clientData.full_name || "Sans nom"}`;
    const description = buildClientDocumentDescription(clientData);
    const existingCasesRes = await api.listCases(token, { clientId: clientData.id });
    const clientCases = existingCasesRes.cases || [];
    const existingDocument = clientCases.find((item) =>
      String(item.title || "").toLowerCase().startsWith(CLIENT_DOCUMENT_PREFIX.toLowerCase())
    );

    if (existingDocument?.id) {
      await api.updateCase(token, existingDocument.id, { title, description });
      return;
    }

    await api.createCase(token, {
      title,
      description,
      status: "open",
      clientId: Number(clientData.id),
    });
  };

  const handleEditInput = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const openProfile = async (client) => {
    setSelectedClient(client);
    setProfileModalOpen(true);
    setProfileDocumentLoading(true);
    setProfileSideTab("documents");
    setProfileUploadFiles([]);
    setProfileProceduresLoading(true);
    setProfileProcedureSelection([]);
    setProfileProcedureSaving(false);
    setProfileProcedureEditMode(false);
    setProfilePayments([]);

    try {
      const [casesResult, profileFinanceResult, proceduresResult, proceduresSelectionResult] = await Promise.allSettled([
        api.listCases(token, { clientId: client.id }),
        loadProfileFinance(client.id),
        api.listProcedures(token),
        api.listClientProcedures(token, client.id),
      ]);

      const casesRes = casesResult.status === "fulfilled" ? casesResult.value : { cases: [] };
      const profileFinance = profileFinanceResult.status === "fulfilled" ? profileFinanceResult.value : [];
      const proceduresRes = proceduresResult.status === "fulfilled" ? proceduresResult.value : { procedures: [] };
      const proceduresSelectionRes =
        proceduresSelectionResult.status === "fulfilled" ? proceduresSelectionResult.value : {};

      const failed = [casesResult, profileFinanceResult, proceduresResult, proceduresSelectionResult].find(
        (item) => item.status === "rejected"
      );
      if (failed) {
        setError(failed.reason.message || "Impossible de charger certaines données du profil client.");
      }

      setProfileDocumentStatus(computeSubmittedDocumentStatus(casesRes.cases || []));
      setProfilePayments(profileFinance);
      const normalizeProcedure = (item) => {
        const base = item.procedure ? { ...item.procedure } : { ...item };
        const amount =
          Number(item.montant || item.amount || item.price || item.tarif || base.montant || 0) || 0;
        if (!base.montant && amount) {
          base.montant = amount;
        }
        return base;
      };
      const clientProcedures =
        proceduresSelectionRes.procedures ||
        proceduresSelectionRes.items ||
        proceduresSelectionRes.data ||
        [];
      const procedureIds =
        proceduresSelectionRes.procedureIds ||
        proceduresSelectionRes.procedure_ids ||
        (Array.isArray(clientProcedures) ? clientProcedures.map((item) => item.id) : []);
      const allProcedures = (proceduresRes.procedures || []).map(normalizeProcedure);
      const normalizedClientProcedures = Array.isArray(clientProcedures)
        ? clientProcedures.map(normalizeProcedure)
        : [];
      const selectedIds = (procedureIds || [])
        .map((id) => String(id))
        .filter(Boolean);
      const procedureMap = new Map(
        allProcedures.map((procedure, index) => [String(procedure.id ?? index), procedure])
      );

      normalizedClientProcedures.forEach((procedure, index) => {
        procedureMap.set(String(procedure.id ?? `selected-${index}`), procedure);
      });

      const availableProcedures = Array.from(procedureMap.values());
      setProfileProcedures(availableProcedures);
      setProfileProcedureSelection(selectedIds);
    } catch (_error) {
      setProfileDocumentStatus([]);
      setProfileProcedures([]);
      setProfileProcedureSelection([]);
      setProfilePayments([]);
    } finally {
      setProfileDocumentLoading(false);
      setProfileProceduresLoading(false);
    }
  };

  const saveProfileProcedureSelection = useCallback(
    async (selectionOverride) => {
      if (!selectedClient?.id) {
        return;
      }

      setProfileProcedureSaving(true);
      try {
        const selection = selectionOverride ?? profileProcedureSelection;
        const procedureIds = selection.map((value) => Number(value)).filter(Number.isInteger);
        await api.updateClientProcedures(token, selectedClient.id, procedureIds);
      } catch (apiError) {
        setError(apiError.message);
      } finally {
        setProfileProcedureSaving(false);
      }
    },
    [profileProcedureSelection, selectedClient?.id, token]
  );

  const toggleProfileProcedure = (procedureKey) => {
    if (!profileProcedureEditMode) {
      return;
    }
    setProfileProcedureSelection((prev) => {
      const next = prev.includes(procedureKey)
        ? prev.filter((item) => item !== procedureKey)
        : [...prev, procedureKey];
      return next;
    });
  };

  const handleProfilePaymentInput = (event) => {
    const { name, value } = event.target;
    setProfilePaymentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfilePaymentSubmit = async (event) => {
    event.preventDefault();
    if (!selectedClient?.id) {
      return;
    }

    const amount = Number(profilePaymentForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Veuillez saisir un montant valide.");
      return;
    }
    if (profileRemainingAmount > 0 && amount > profileRemainingAmount) {
      setError("Le montant ne peut pas dépasser le reste à payer.");
      return;
    }

    setProfilePaymentSubmitting(true);
    try {
      await api.createPayment(token, {
        amount,
        currency: "XAF",
        status: profilePaymentForm.status,
        paidAt: profilePaymentForm.paidAt || new Date().toISOString().slice(0, 10),
        notes: profilePaymentForm.notes || "",
        clientId: selectedClient.id,
      });
      const refreshedFinance = await loadProfileFinance(selectedClient.id);
      setProfilePayments(refreshedFinance);
      setProfilePaymentForm((prev) => ({
        ...prev,
        amount: "",
        paidAt: new Date().toISOString().slice(0, 10),
        notes: "",
      }));
      setProfilePaymentModalOpen(false);
      emitFinanceUpdate({ type: "payment", action: "create" });
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setProfilePaymentSubmitting(false);
    }
  };

  const openEditPayment = (payment) => {
    if (!payment?.paymentId) {
      return;
    }
    setProfilePaymentEditTarget({ ...payment, id: payment.paymentId });
    setProfilePaymentEditForm({
      amount: payment.amount ? String(payment.amount) : "",
      currency: payment.currency || "XAF",
      status: payment.status || "pending",
      paidAt: payment.paid_at ? String(payment.paid_at).slice(0, 10) : "",
      notes: payment.notes || "",
    });
    setProfilePaymentEditOpen(true);
  };

  const handleProfilePaymentEditInput = (event) => {
    const { name, value } = event.target;
    setProfilePaymentEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfilePaymentEditSubmit = async (event) => {
    event.preventDefault();
    if (!profilePaymentEditTarget?.id) {
      return;
    }

    const amount = Number(profilePaymentEditForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Veuillez saisir un montant valide.");
      return;
    }
    const currentAmount = Number(profilePaymentEditTarget?.amount || 0);
    const maxAllowed = Math.max(profileRemainingAmount + currentAmount, 0);
    if (maxAllowed > 0 && amount > maxAllowed) {
      setError("Le montant ne peut pas dépasser le reste à payer.");
      return;
    }

    setProfilePaymentSubmitting(true);
    try {
      await api.updatePayment(token, profilePaymentEditTarget.id, {
        amount,
        currency: profilePaymentEditForm.currency,
        status: profilePaymentEditForm.status,
        paidAt: profilePaymentEditForm.paidAt || null,
        notes: profilePaymentEditForm.notes || "",
      });
      const refreshedFinance = await loadProfileFinance(selectedClient.id);
      setProfilePayments(refreshedFinance);
      setProfilePaymentEditOpen(false);
      setProfilePaymentEditTarget(null);
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setProfilePaymentSubmitting(false);
    }
  };

  const handleProfilePaymentDelete = async (paymentId) => {
    if (!paymentId || !selectedClient?.id) {
      return;
    }
    const confirmed = await confirmAction({
      title: "Supprimer le paiement",
      message: "Voulez-vous vraiment supprimer ce paiement ?",
      confirmLabel: "Supprimer",
      cancelLabel: "Annuler",
      tone: "danger",
    });
    if (!confirmed) {
      return;
    }

    setProfilePaymentSubmitting(true);
    const loadingId = startActionLoading("Suppression du paiement...");
    try {
      await api.deletePayment(token, paymentId);
      const refreshedFinance = await loadProfileFinance(selectedClient.id);
      setProfilePayments(refreshedFinance);
      notifyActionStatus("success", "Paiement supprimé.");
    } catch (apiError) {
      setError(apiError.message);
      notifyActionStatus("error", apiError.message);
    } finally {
      stopActionLoading(loadingId);
      setProfilePaymentSubmitting(false);
    }
  };

  const handlePrintPayment = async (payment) => {
    if (!selectedClient?.id || !payment.id) {
      return;
    }

    let invoiceData = null;
    if (payment.invoice_id) {
      try {
        const response = await api.invoices.get(payment.invoice_id);
        invoiceData = response.invoice || null;
      } catch (_error) {
        invoiceData = null;
      }
    }

    const currencyFallback = payment.currency || "XAF";
    const proceduresForInvoice = profileSelectedProcedures.length
      ? profileSelectedProcedures
      : profileProcedures;
    let totalAmount = proceduresForInvoice.reduce(
      (sum, procedure) =>
        sum + Number(procedure.montant || procedure.amount || procedure.price || procedure.tarif || 0),
      0
    );
    let paidAmount = profilePaidAmount;
    let currency = currencyFallback;
    let issueDate = payment.paid_at || payment.created_at || new Date().toISOString();
    let invoiceNumber = payment.invoice_number || `PAY-${payment.id}`;
    let elements = proceduresForInvoice.map((procedure) => ({
      label: procedure.title || procedure.intitule || "Procedure",
      amount: Number(procedure.montant || procedure.amount || procedure.price || procedure.tarif || 0),
    }));

    if (invoiceData) {
      totalAmount = Number(invoiceData.total_amount || 0);
      paidAmount = Number(invoiceData.paid_amount || 0);
      currency = invoiceData.currency || currency;
      issueDate = invoiceData.issue_date || issueDate;
      invoiceNumber = invoiceData.invoice_number || invoiceNumber;

      if (invoiceData.selected_elements) {
        const parsedElements = parsePricedElements(invoiceData.selected_elements).map((item) => ({
          label: item.label,
          amount: Number(item.amount || 0),
        }));
        if (parsedElements.length) {
          elements = parsedElements;
        }
      }
    }

    const invoice = {
      invoice_number: invoiceNumber,
      issue_date: issueDate,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      currency,
      status: invoiceData?.status || "paid",
    };

    const logoPath = organization?.logoUrl || organization?.logo_url || "";
    const clientDocuments = profileUploadLabels.map((label) => {
      const documentStatus = profileDocumentStatusByLabel[label] || { url: "", fileName: "" };
      return {
        label,
        fileName: documentStatus.fileName || extractFilenameFromDocumentUrl(documentStatus.url) || "A fournir",
      };
    });

    openInvoicePdf({
      invoice,
      clientName: selectedClient?.full_name || "Client",
      serviceName: selectedServiceName,
      elements,
      clientDocuments,
      paymentEntry: payment,
      paymentNumber: payment.id != null ? String(payment.id) : null,
      logoUrl: (logoPath ? getAssetUrl(logoPath) : "") || defaultAppLogo,
      organizationName: organization?.name || "",
      organizationAddress: organization?.address || "",
      organizationPhone: organization?.phone || "",
      organizationEmail: organization?.email || "",
      createdByName: userLabel,
      createdByRole: userRoleLabel,
    });
  };

  const handleProfileProceduresSave = async () => {
    await saveProfileProcedureSelection();
    setProfileProcedureEditMode(false);
  };

  const openEdit = (client) => {
    setSelectedClient(client);
    setEditForm(mapClientToForm(client));
    setEditPhotoFile(null);
    setProfileModalOpen(false);
    setEditModalOpen(true);
  };

  const openDelete = (client) => {
    setSelectedClient(client);
    setDeleteModalOpen(true);
  };

  const handleProfileUploadFileChange = (index, file) => {
    setProfileUploadFiles((prev) => prev.map((item, idx) => (idx === index ? file || null : item)));
  };

  const handleProfileDownload = (index, label, uploadedUrl, uploadedName) => {
    const selectedFile = profileUploadFiles[index];

    if (selectedFile) {
      const objectUrl = URL.createObjectURL(selectedFile);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = selectedFile.name || `${label}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
      return;
    }

    if (uploadedUrl) {
      const link = document.createElement("a");
      link.href = getAssetUrl(uploadedUrl);
      if (uploadedName) {
        link.setAttribute("download", uploadedName);
      }
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noreferrer");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleProfileDocumentsUpload = async (event) => {
    event.preventDefault();
    if (!selectedClient?.id) {
      return;
    }
    const hasFile = profileUploadFiles.some(Boolean);
    if (!hasFile) {
      setError("Ajoutez au moins un document à téléverser.");
      return;
    }

    setProfileUploadSubmitting(true);
    setError("");
    try {
      const casesRes = await api.listCases(token, { clientId: selectedClient.id });
      const clientCases = casesRes.cases || [];
      let documentCase = clientCases.find((item) =>
        String(item.title || "").toLowerCase().startsWith(CLIENT_DOCUMENT_TITLE_PREFIX)
      );

      if (!documentCase?.id) {
        const createdCaseRes = await api.createCase(token, {
          title: `Document - ${selectedClient?.full_name || "Client"}`,
          description: `Document du client ${selectedClient?.full_name || "-"}`,
          status: "open",
          clientId: Number(selectedClient.id),
        });
        documentCase = createdCaseRes.case || null;
      }

      if (!documentCase?.id) {
        throw new Error("Impossible de préparer le document client.");
      }

      const labeledFiles = profileUploadLabels
        .map((label, index) => ({ label, file: profileUploadFiles[index] || null }))
        .filter((item) => item.file);
      const uploadRes = await api.uploadCaseDocuments(token, documentCase.id, labeledFiles);
      const uploadedDocuments = uploadRes.documents || [];

      const existingEntries = {};
      parseUploadedPieceEntriesFromDescription(documentCase.description || "").forEach((entry) => {
        if (!entry.label || !entry.url) {
          return;
        }
        existingEntries[entry.label] = {
          url: entry.url,
          fileName: entry.fileName || extractFilenameFromDocumentUrl(entry.url),
        };
      });

      uploadedDocuments.forEach((item) => {
        if (item.label && item.url) {
          existingEntries[item.label] = {
            url: getAssetUrl(item.url),
            fileName: item.fileName || "",
          };
        }
      });

      const descriptionLines = [
        `Nom: ${selectedClient?.full_name || "-"}`,
        `Email: ${selectedClient.email || "-"}`,
        `Telephone: ${selectedClient.phone || "-"}`,
        `Date de naissance: ${formatProfileDate(selectedClient.birth_date)}`,
        `Lieu de naissance: ${selectedClient.birth_place || "-"}`,
        `Nationalite: ${selectedClient.nationality || "-"}`,
        "",
        "Documents televerses:",
      ];
      const labels = profileUploadLabels;
      labels.forEach((label) => {
        const entry = existingEntries[label];
        descriptionLines.push(`- ${label}: ${entry?.url ? buildStoredDocumentValue(entry.url, entry.fileName) : "Non fourni"}`);
      });

      await api.updateCase(token, documentCase.id, {
        title: `Document - ${selectedClient?.full_name || "Client"}`,
        description: descriptionLines.join("\n"),
      });

      setProfileUploadFiles(Array(profileUploadLabels.length).fill(null));
      const refreshedCasesRes = await api.listCases(token, { clientId: selectedClient.id });
      setProfileDocumentStatus(computeSubmittedDocumentStatus(refreshedCasesRes.cases || []));
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setProfileUploadSubmitting(false);
    }
  };

  const parseExistingDocumentData = (caseItem) => {
    const labels = parseRequiredPieceLabelsFromDescription(caseItem.description || "");
    return {
      pieceLabels: labels,
    };
  };

  const openCreateDocumentModal = async (client) => {
    setDocumentClient(client || null);
    setDocumentPieceFields([]);
    setExistingDocumentCase(null);
    setCreateDocumentModalOpen(true);

    if (!client?.id) {
      return;
    }

    setDocumentModalLoading(true);
    try {
      const existingCasesRes = await api.listCases(token, { clientId: client.id });
      const clientCases = existingCasesRes.cases || [];
      const existingDocument = clientCases.find((item) =>
        String(item.title || "").toLowerCase().startsWith(CLIENT_DOCUMENT_TITLE_PREFIX)
      );
      setExistingDocumentCase(existingDocument || null);

      if (existingDocument) {
        const parsed = parseExistingDocumentData(existingDocument);
        const loadedFields = parsed.pieceLabels.length ? parsed.pieceLabels : [];
        setDocumentPieceFields(loadedFields);
      }
    } catch (_error) {
      setExistingDocumentCase(null);
    } finally {
      setDocumentModalLoading(false);
    }
  };

  const handleDocumentPieceChange = (index, value) => {
    setDocumentPieceFields((prev) => prev.map((item, idx) => (idx === index ? value : item)));
  };

  const addDocumentPieceField = () => {
    setDocumentPieceFields((prev) => [...prev, ""]);
  };

  const removeDocumentPieceField = (index) => {
    setDocumentPieceFields((prev) => prev.filter((_, idx) => idx !== index));
  };

  const clearAllDocumentPieceFields = () => {
    setDocumentPieceFields([]);
  };

  const handleCreateDocumentFromClient = async (event) => {
    event.preventDefault();
    if (!documentClient?.id) {
      return;
    }

    setDocumentSubmitting(true);
    setError("");

    try {
      let caseId = existingDocumentCase?.id || null;
      if (!caseId) {
        const createdCaseRes = await api.createCase(token, {
          title: `Document - ${documentClient?.full_name || "Client"}`,
          description: `Document du client ${documentClient?.full_name || "-"}`,
          status: "open",
          clientId: Number(documentClient.id),
        });

        const createdCase = createdCaseRes.case;
        if (!createdCase?.id) {
          throw new Error("Impossible de créer le document client.");
        }
        caseId = createdCase.id;
      }

      const descriptionLines = [
        `Nom: ${documentClient?.full_name || "-"}`,
        `Email: ${documentClient.email || "-"}`,
        `Telephone: ${documentClient.phone || "-"}`,
        `Date de naissance: ${formatProfileDate(documentClient.birth_date)}`,
        `Lieu de naissance: ${documentClient.birth_place || "-"}`,
        `Nationalite: ${documentClient.nationality || "-"}`,
      ];

      descriptionLines.push(
        "",
        "Pieces a fournir:",
      );

      if (documentPieceLabels.length) {
        documentPieceLabels.forEach((label) => {
          descriptionLines.push(`- ${label}`);
        });
      }

      const allowedLabels = new Set(documentPieceLabels.map((label) => String(label || "").trim()).filter(Boolean));
      const existingUploadedEntries = parseUploadedPieceEntriesFromDescription(existingDocumentCase?.description || "");
      const keptUploadedEntries = existingUploadedEntries.filter((entry) => allowedLabels.has(String(entry.label || "").trim()));
      if (keptUploadedEntries.length) {
        descriptionLines.push("", "Documents televerses:");
        keptUploadedEntries.forEach((entry) => {
          descriptionLines.push(`- ${entry.label}: ${buildStoredDocumentValue(entry.url, entry.fileName)}`);
        });
      }

      await api.updateCase(token, caseId, {
        title: `Document - ${documentClient?.full_name || "Client"}`,
        description: descriptionLines.join("\n"),
      });

      if (selectedClient?.id && Number(selectedClient.id) === Number(documentClient.id)) {
        const refreshedCasesRes = await api.listCases(token, { clientId: documentClient.id });
        setProfileDocumentStatus(computeSubmittedDocumentStatus(refreshedCasesRes.cases || []));
        setProfileUploadFiles([]);
      }

      setCreateDocumentModalOpen(false);
      setDocumentClient(null);
      setDocumentPieceFields([]);
      setExistingDocumentCase(null);
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setDocumentSubmitting(false);
    }
  };

  const closeCreate = () => {
    setCreateForm(emptyClientForm);
    setCreatePhotoFile(null);
    setCreateModalOpen(false);
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setCreateSubmitting(true);
    setError("");
    try {
      if (!createForm.serviceId) {
        throw new Error("Le service est obligatoire pour créer un client.");
      }
      const payload = {
        ...createForm,
        serviceId: Number(createForm.serviceId),
      };
      const response = await api.createClient(token, payload);
      const createdClientId = response?.client?.id;
      let createdClient = normalizeClientRecord(response?.client || null);

      if (createPhotoFile && createdClientId) {
        await api.uploadClientPhoto(token, createdClientId, createPhotoFile);
      }

      if (createdClientId) {
        const refreshedClientRes = await api.getClient(token, createdClientId);
        createdClient = normalizeClientRecord(refreshedClientRes?.client || createdClient);
      }

      await upsertClientDocument(createdClient);

      closeCreate();
      await loadClients();
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!selectedClient?.id) {
      return;
    }
    setEditSubmitting(true);
    setError("");
    try {
      if (!editForm.serviceId) {
        throw new Error("Le service est obligatoire pour mettre à jour un client.");
      }

      const updateRes = await api.updateClient(token, selectedClient.id, {
        ...editForm,
        serviceId: Number(editForm.serviceId),
      });
      let updatedClient = normalizeClientRecord(updateRes.client || null);
      
      if (editPhotoFile) {
        console.log('Uploading photo for client:', selectedClient.id, editPhotoFile);
        const photoRes = await api.uploadClientPhoto(token, selectedClient.id, editPhotoFile);
        console.log('Photo upload response:', photoRes);
        // Merge the photo_url from the upload response
        if (photoRes.client?.photo_url) {
          updatedClient = { ...updatedClient, photo_url: photoRes.client.photo_url };
        }
        console.log('Updated client after photo upload:', updatedClient);
      }

      const refreshedClientRes = await api.getClient(token, selectedClient.id);
      updatedClient = normalizeClientRecord(refreshedClientRes?.client || updatedClient);
      
      if (updatedClient) {
        await upsertClientDocument(updatedClient);
        applyClientUpdate(updatedClient);
      }
      
      setEditModalOpen(false);
      loadClients();
    } catch (apiError) {
      console.error('Update error:', apiError);
      setError(apiError.message);
  } finally {
    setEditSubmitting(false);
  }
};

  const handleDelete = async () => {
    if (!selectedClient?.id) {
      return;
    }
    setDeleteSubmitting(true);
    setError("");
    try {
      await api.deleteClient(token, selectedClient.id);
      setDeleteModalOpen(false);
      setSelectedClient(null);
      await loadClients();
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(clients.length / ITEMS_PER_PAGE));
  const paginatedClients = clients.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const totalRequiredDocuments = profileUploadLabels.length;
  const submittedLabelSet = new Set(
    profileDocumentStatus.filter((item) => item.submitted).map((item) => String(item.label || "").trim())
  );
  const selectedPendingCount = profileUploadLabels.reduce((count, label, index) => {
    const hasSelectedFile = Boolean(profileUploadFiles[index]);
    if (hasSelectedFile && !submittedLabelSet.has(label)) {
      return count + 1;
    }
    return count;
  }, 0);
  const submittedPiecesCount = submittedLabelSet.size + selectedPendingCount;
  const submittedPiecesProgress = totalRequiredDocuments
    ? Math.round((submittedPiecesCount / totalRequiredDocuments) * 100)
    : 0;
  const urgentClientsCount = useMemo(
    () => clients.filter((client) => normalizeClientWorkflowStatus(client.status) === "urgent").length,
    [clients]
  );
  const completedClientsCount = useMemo(
    () => clients.filter((client) => normalizeClientWorkflowStatus(client.status) === "termine").length,
    [clients]
  );
  const activeClientsCount = useMemo(
    () => clients.filter((client) => normalizeClientWorkflowStatus(client.status) === "en_cours").length,
    [clients]
  );
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <>
      <section className="card surface-shell">
        <div className="surface-head">
          <div className="surface-head-copy">
            <p className="surface-kicker">Portefeuille clients</p>
            <h3 className="surface-title">Registre et suivi quotidien</h3>
            <p className="muted">Une lecture plus claire des fiches, des statuts et des actions de consultation.</p>
          </div>
          <div className="surface-head-actions">
            {hasPermission(user.permissions, PERMISSIONS.MANAGE_CLIENTS) ? (
              <button type="button" className="btn" onClick={() => setCreateModalOpen(true)}>
                Nouveau client
              </button>
            ) : null}
            <button type="button" className="btn secondary" onClick={() => setQuery("")} disabled={!query.trim()}>
              Reinitialiser la recherche
            </button>
          </div>
        </div>

        <div className="surface-toolbar">
          <div className="surface-toolbar-meta">
            <span className="surface-meta-chip">Actifs <strong>{activeClientsCount}</strong></span>
            <span className="surface-meta-chip">Urgents <strong>{urgentClientsCount}</strong></span>
            <span className="surface-meta-chip">Terminés <strong>{completedClientsCount}</strong></span>
          </div>
          <div className="clients-search-bar">
            <div className="search-field">
              <span className="search-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path
                    d="M11 2a9 9 0 1 0 5.645 16.018l4.168 4.168a1 1 0 0 0 1.414-1.414l-4.168-4.168A9 9 0 0 0 11 2Zm0 2a7 7 0 1 1 0 14 7 7 0 0 1 0-14Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <input
                className="clients-search-input"
                type="search"
                placeholder="Rechercher un client, un contact ou une origine..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? <p>Chargement...</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {!loading && !clients.length ? <p className="muted">Aucun client trouvé.</p> : null}

        <div className="clients-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Actions</th>
                <th>Photo</th>
                <th>Nom</th>
                <th>Contact</th>
                <th>Lieu de naissance</th>
                <th>Nationalité</th>
                <th>Créé le</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {paginatedClients.map((client) => (
                <tr key={client.id}>
                  <td>
                    <div className="inline">
                      <button
                        type="button"
                        className="icon-action-btn"
                        onClick={() => openProfile(client)}
                        title="Voir profil"
                        aria-label="Voir profil"
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                          <path
                            d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                            fill="currentColor"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td>
                    {(() => {
                      const photoUrl = client.photo_url;
                      const assetUrl = getAssetUrl(photoUrl);
                      console.log('Client photo debug:', { clientId: client.id, photo_url: photoUrl, assetUrl });
                      return photoUrl ? (
                        <img 
                          src={assetUrl} 
                          alt={client.full_name} 
                          className="client-avatar client-avatar-sm"
                          onError={(e) => {
                            console.error('Image failed to load:', assetUrl, e);
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="client-avatar client-avatar-fallback client-avatar-sm">
                          {String(client.full_name || "C").slice(0, 1).toUpperCase()}
                        </span>
                      );
                    })()}
                  </td>
                  <td>
                    <strong className="client-name-under">{client.full_name}</strong>
                  </td>
                  <td className="muted">{client.phone || client.email || "Aucun contact"}</td>
                  <td className="muted">{client.birth_place || "-"}</td>
                  <td className="muted">{client.nationality || "-"}</td>
                  <td className="muted">{formatClientRegistrationDate(client)}</td>
                  <td>
                    <span className={getClientListStatus(client).className}>{getClientListStatus(client).label}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {clients.length > ITEMS_PER_PAGE ? (
          <div className="pagination-bar">
            <button
              type="button"
              className="btn secondary"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Précédent
            </button>
            <span className="muted">
              Page {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              className="btn secondary"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Suivant
            </button>
          </div>
        ) : null}
      </section>

      <Modal
        open={createModalOpen}
        title="Ajouter un client"
        eyebrow="Creation de fiche"
        subtitle="Préparez une fiche client propre avec les coordonnées essentielles, le rattachement métier et les éléments d'identification utiles au suivi du cabinet."
        onClose={closeCreate}
        width="880px"
        headerCenter={<span className="modal-head-badge">Fiche client</span>}
      >
        <form className="form-grid modal-form-layout" onSubmit={handleCreate}>
          <div className="modal-intro-card">
            <h4 className="modal-intro-title">Nouveau dossier relationnel</h4>
            <p className="modal-intro-text">Une saisie plus structurée améliore la qualité des recherches, des impressions et du suivi administratif.</p>
          </div>

          <section className="modal-form-section">
            <div className="modal-section-head">
              <h4 className="modal-section-title">Identité du client</h4>
              <p className="modal-section-note">Informations de base affichées dans le registre et les profils détaillés.</p>
            </div>
            <div className="modal-section-grid modal-section-grid-two">
              <label className="modal-field-card modal-field-card-wide">
                <span className="modal-field-label modal-field-label-content"><FieldIcon type="user" /><span>Nom complet</span></span>
                <input name="fullName" placeholder="Nom complet" value={createForm.fullName} onChange={handleCreateInput} required />
              </label>
              <label className="modal-field-card">
                <span className="modal-field-label modal-field-label-content"><FieldIcon type="mail" /><span>E-mail</span></span>
                <input name="email" placeholder="E-mail" value={createForm.email} onChange={handleCreateInput} />
              </label>
              <label className="modal-field-card">
                <span className="modal-field-label modal-field-label-content"><FieldIcon type="phone" /><span>Téléphone</span></span>
                <input name="phone" placeholder="Téléphone" value={createForm.phone} onChange={handleCreateInput} />
              </label>
              <label className="modal-field-card">
                <span className="modal-field-label modal-field-label-content"><FieldIcon type="calendar" /><span>Date de naissance</span></span>
                <input type="date" name="birthDate" value={createForm.birthDate} onChange={handleCreateInput} />
              </label>
              <label className="modal-field-card">
                <span className="modal-field-label modal-field-label-content"><FieldIcon type="pin" /><span>Lieu de naissance</span></span>
                <input name="birthPlace" placeholder="Lieu de naissance" value={createForm.birthPlace} onChange={handleCreateInput} />
              </label>
              <label className="modal-field-card">
                <span className="modal-field-label modal-field-label-content"><FieldIcon type="globe" /><span>Nationalité</span></span>
                <input name="nationality" placeholder="Nationalité" value={createForm.nationality} onChange={handleCreateInput} />
              </label>
              <label className="modal-field-card">
                <span className="modal-field-label modal-field-label-content"><FieldIcon type="briefcase" /><span>Service de rattachement</span></span>
                <select name="serviceId" value={createForm.serviceId} onChange={handleCreateInput} required>
                  <option value="">Sélectionner un service</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="modal-form-section">
            <div className="modal-section-head">
              <h4 className="modal-section-title">Pièce visuelle</h4>
              <p className="modal-section-note">Ajoutez une photo pour une identification plus rapide dans les listes et le profil.</p>
            </div>
            <label className="modal-field-card" htmlFor="create-client-photo">
              <span className="modal-field-label modal-field-label-content"><FieldIcon type="camera" /><span>Photo du client</span></span>
              <input
                id="create-client-photo"
                type="file"
                accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                onChange={(event) => setCreatePhotoFile(event.target.files?.[0] || null)}
              />
            </label>
          </section>

          <div className="modal-action-row">
            <button type="button" className="btn secondary" onClick={closeCreate} disabled={createSubmitting}>
              Annuler
            </button>
            <button type="submit" className="btn" disabled={createSubmitting}>
              {createSubmitting ? "Enregistrement..." : "Ajouter le client"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={createDocumentModalOpen}
        title={
          documentClient
            ? `${existingDocumentCase ? "Mettre à jour" : "Ajouter"} document - ${documentClient?.full_name || "Client"}`
            : "Ajouter document"
        }
        onClose={() => setCreateDocumentModalOpen(false)}
        zIndex={110}
      >
        <form className="form-grid" onSubmit={handleCreateDocumentFromClient}>
          {documentModalLoading ? <p className="muted">Chargement du document existant...</p> : null}

          <div className="inline row-between">
            <h4 style={{ margin: "0 0 4px" }}>Pièces à fournir</h4>
          </div>
          {documentPieceFields.map((value, index) => (
            <div key={`piece-field-${index}`} className="piece-input-shell">
              <input
                type="text"
                className="piece-input-field"
                placeholder={`Pièce ${index + 1}`}
                value={value}
                onChange={(event) => handleDocumentPieceChange(index, event.target.value)}
              />
              <button
                type="button"
                className="icon-action-btn danger piece-remove-btn"
                onClick={() => removeDocumentPieceField(index)}
                title={`Supprimer ${value || `Pièce ${index + 1}`}`}
                aria-label={`Supprimer ${value || `Pièce ${index + 1}`}`}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path d="M6 6l12 12M18 6l-12 12" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="icon-action-btn"
              onClick={addDocumentPieceField}
              title="Ajouter une pièce"
              aria-label="Ajouter une pièce"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {documentPieceFields.length ? (
            <div className="inline">
              <button type="button" className="btn secondary" onClick={clearAllDocumentPieceFields}>
                Supprimer toutes les pièces
              </button>
            </div>
          ) : null}

          {!documentPieceLabels.length ? (
            <p className="muted">Cliquez sur + pour ajouter les pièces une par une.</p>
          ) : (
            <div className="form-grid">
              <span className="muted">Pièces enregistrées:</span>
              {documentPieceLabels.map((label) => (
                <span key={label} className="pill pill-soft">
                  {label}
                </span>
              ))}
            </div>
          )}

          <div className="inline">
            <button type="submit" className="btn" disabled={documentSubmitting || !documentClient}>
              {documentSubmitting
                ? "Enregistrement..."
                : existingDocumentCase
                  ? "Mettre à jour le document"
                  : "Créer le document client"}
            </button>
            <button type="button" className="btn secondary" onClick={() => setCreateDocumentModalOpen(false)} disabled={documentSubmitting}>
              Annuler
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={profileModalOpen}
        title="Profil client"
        onClose={() => setProfileModalOpen(false)}
        width="1280px"
        maxHeight="96vh"
        zIndex={100}
        headerCenter={
          selectedClient ? (
            <span className="modal-head-badge">{selectedServiceName || "Non defini"}</span>
          ) : null
        }
        headerActions={
          selectedClient ? (
            <>
              <button
                type="button"
                className="btn secondary"
                onClick={() => setProfileSideTab("documents")}
                aria-pressed={profileSideTab === "documents"}
              >
                Documents
              </button>
              <button
                type="button"
                className="btn secondary"
                onClick={() => setProfileSideTab("finance")}
                aria-pressed={profileSideTab === "finance"}
              >
                Finance
              </button>
              <button
                type="button"
                className="btn secondary"
                onClick={() => setProfileSideTab("procedures")}
                aria-pressed={profileSideTab === "procedures"}
              >
                Procédures
              </button>
            </>
          ) : null
        }
      >
        {selectedClient ? (
          <div className="form-grid profile-client-modal">
            <div className={`profile-main-layout${profileSideTab === "finance" ? " profile-main-layout-finance" : ""}`}>
              <div className="profile-left-side">
                <div className="profile-identity-card">
                  <div className="profile-identity-top">
                    {selectedClient.photo_url ? (
                      <img
                        src={profileAvatarUrl || getAssetUrl(selectedClient.photo_url)}
                        alt={selectedClient.full_name}
                        className="client-avatar"
                        onError={(e) => {
                          console.error("Avatar load failed", e.target.src);
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="client-avatar client-avatar-fallback">
                        {String(selectedClient.full_name || "C").slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <div className="profile-identity-meta">
                      <span className="pill pill-soft profile-client-code">{formatClientCode(selectedClient.id)}</span>
                      <strong className="client-name-under profile-client-name">{selectedClient.full_name}</strong>
                      <div className="client-status-row profile-status-row">
                        <button
                          type="button"
                          className="status-toggle-btn"
                          onClick={handleProfileStatusToggle}
                          disabled={profileStatusSyncing}
                          aria-pressed={normalizeClientWorkflowStatus(selectedClient.status) === "termine"}
                          title={normalizeClientWorkflowStatus(selectedClient.status) === "termine" ? "Revenir au statut automatique" : "Marquer comme terminé"}
                        >
                          <div className={`status-toggle ${normalizeClientWorkflowStatus(selectedClient.status) === "termine" ? "active" : ""}`} />
                        </button>
                        <span className="status-toggle-label">
                          {profileStatusSyncing
                            ? "MISE À JOUR..."
                            : normalizeClientWorkflowStatus(selectedClient.status) === "termine"
                              ? "TERMINER"
                              : normalizeClientWorkflowStatus(selectedClient.status) === "urgent"
                                ? "URGENT"
                                : "EN COURS"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="profile-action-row">
                    <button
                      type="button"
                      className="icon-action-btn"
                      onClick={() => openCreateDocumentModal(selectedClient)}
                      title="Ajouter document"
                      aria-label="Ajouter document"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                        <path
                          d="M3 7a2 2 0 0 1 2-2h4.5a2 2 0 0 1 1.6.8l1 1.2H19a2 2 0 0 1 2 2v1H3V7Z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M3 10h18v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7Z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle cx="16.5" cy="15.5" r="4.2" fill="currentColor" />
                        <path
                          d="M16.5 13.6v3.8M14.6 15.5h3.8"
                          stroke="#ffffff"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="icon-action-btn"
                      onClick={() => openEdit(selectedClient)}
                      title="Modifier"
                      aria-label="Modifier"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                        <path
                          d="m15.6 3.2 5.2 5.2-11 11H4.6v-5.2l11-11Zm1.4-1.4 2.4-2.4a1.5 1.5 0 0 1 2.1 0l1.5 1.5a1.5 1.5 0 0 1 0 2.1l-2.4 2.4-3.6-3.6Z"
                          fill="currentColor"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="icon-action-btn danger"
                      onClick={() => openDelete(selectedClient)}
                      title="Supprimer"
                      aria-label="Supprimer"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                        <path
                          d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h2v10H7V9Zm4 0h2v10h-2V9Zm4 0h2v10h-2V9Z"
                          fill="currentColor"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="profile-client-grid profile-client-grid-identity">
                  <div className="profile-field-card">
                    <span className="profile-field-label profile-field-label-content"><FieldIcon type="briefcase" /><span>Service</span></span>
                    <strong className="profile-field-value">{selectedServiceName || "-"}</strong>
                  </div>
                  <div className="profile-field-card">
                    <span className="profile-field-label profile-field-label-content"><FieldIcon type="mail" /><span>Email</span></span>
                    <strong className="profile-field-value">{selectedClient.email || "-"}</strong>
                  </div>
                  <div className="profile-field-card">
                    <span className="profile-field-label profile-field-label-content"><FieldIcon type="phone" /><span>Téléphone</span></span>
                    <strong className="profile-field-value">{selectedClient.phone || "-"}</strong>
                  </div>
                  <div className="profile-field-card">
                    <span className="profile-field-label profile-field-label-content"><FieldIcon type="calendar" /><span>Date de naissance</span></span>
                    <strong className="profile-field-value">{formatProfileDate(selectedClient.birth_date)}</strong>
                  </div>
                  <div className="profile-field-card">
                    <span className="profile-field-label profile-field-label-content"><FieldIcon type="pin" /><span>Lieu de naissance</span></span>
                    <strong className="profile-field-value">{selectedClient.birth_place || "-"}</strong>
                  </div>
                  <div className="profile-field-card">
                    <span className="profile-field-label profile-field-label-content"><FieldIcon type="globe" /><span>Nationalité</span></span>
                    <strong className="profile-field-value">{selectedClient.nationality || "-"}</strong>
                  </div>
                </div>
              </div>

              <div className="profile-doc-side">
                <div key={profileSideTab} className="profile-side-panel-swipe" data-tab={profileSideTab}>
                {profileSideTab === "documents" ? (
                  <form className="form-grid" onSubmit={handleProfileDocumentsUpload}>
                    <strong>Documents du client</strong>
                    <strong>État des documents</strong>
                    {profileDocumentLoading ? <p className="muted">Vérification des pièces...</p> : null}
                    {!profileDocumentLoading && profileUploadLabels.length ? (
                      <div className="doc-progress-list">
                        <div className="doc-progress-summary">
                          <div className="doc-progress-summary-line">
                            <span className="muted">
                              {submittedPiecesCount}/{totalRequiredDocuments} documents renseignés
                            </span>
                            <strong className={submittedPiecesProgress === 100 ? "doc-status-ok" : "doc-status-missing"}>
                              {submittedPiecesProgress}%
                            </strong>
                          </div>
                          <div className="doc-progress-track" aria-hidden="true">
                            <span className="doc-progress-fill" style={{ width: `${submittedPiecesProgress}%` }} />
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {profileUploadLabels.length ? <p className="muted">Téléversez les pièces ci-dessous.</p> : null}
                    {profileUploadLabels.length ? (
                      <div className="profile-doc-upload-grid">
                      {profileUploadLabels.map((label, index) => (
                        <div key={`profile-doc-upload-${index}`} className="profile-doc-upload-item">
                          {(() => {
                            const documentStatus = profileDocumentStatusByLabel[label] || { url: "", fileName: "" };
                            const uploadedUrl = documentStatus.url || "";
                            const uploadedName = documentStatus.fileName || extractFilenameFromDocumentUrl(uploadedUrl);
                            const canDownload = Boolean(profileUploadFiles[index] || uploadedUrl);
                            return (
                              <>
                          <label className="profile-doc-piece-label" htmlFor={`profile-doc-upload-${index}`}>
                            {label}
                          </label>
                          <div className="inline profile-doc-row">
                            <input
                              id={`profile-doc-upload-${index}`}
                              type="file"
                              style={{ display: "none" }}
                              accept=".png,.jpg,.jpeg,.pdf,.doc,.docx,image/png,image/jpeg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                              onChange={(event) => handleProfileUploadFileChange(index, event.target.files?.[0] || null)}
                            />
                            <label
                              htmlFor={`profile-doc-upload-${index}`}
                              className="icon-action-btn profile-doc-upload-btn"
                              title={`Téléverser ${label}`}
                              aria-label={`Téléverser ${label}`}
                            >
                              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                                <path
                                  d="M12 16V5m0 0-4 4m4-4 4 4M5 19h14"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </label>
                            <button
                                type="button"
                                className="icon-action-btn profile-doc-download-btn"
                                onClick={() => handleProfileDownload(index, label, uploadedUrl, uploadedName)}
                                disabled={!canDownload}
                              title={`Télécharger ${label}`}
                              aria-label={`Télécharger ${label}`}
                              >
                                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                                  <path
                                    d="M12 4v10m0 0-4-4m4 4 4-4M5 18h14"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                            {uploadedUrl || profileUploadFiles[index] ? (
                              <span className="profile-doc-piece-title" title="Fichier soumis">
                                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                                  <path
                                    d="M5 13l4 4L19 7"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </span>
                            ) : null}
                          </div>
                              </>
                            );
                          })()}
                        </div>
                      ))}
                      </div>
                    ) : null}
                    {profileUploadLabels.length ? (
                      <button type="submit" className="btn" disabled={profileUploadSubmitting}>
                      {profileUploadSubmitting ? "Téléversement..." : "Enregistrer les documents"}
                      </button>
                    ) : null}
                  </form>
                ) : null}

                {profileSideTab === "finance" ? (
                  <div className="form-grid panel-accent profile-finance-panel">
                    <div className="finance-summary-row">
                      <div className="finance-summary-item finance-summary-item-total">
                        <span className="muted">Somme totale</span>
                        <span className="amount-badge">
                          {formatCurrencyAmount(profileSelectedProceduresAmount, "XAF")}
                        </span>
                      </div>
                      <div className="finance-summary-item finance-summary-item-paid">
                        <span className="muted">Déjà versé</span>
                        <span className="amount-badge">{formatCurrencyAmount(profilePaidAmount, "XAF")}</span>
                      </div>
                      <div className="finance-summary-item finance-summary-item-due">
                        <span className="muted">Reste à payer</span>
                        <span className="amount-badge">{formatCurrencyAmount(profileRemainingAmount, "XAF")}</span>
                      </div>
                      <div className="finance-summary-spacer" />
                      <div className="finance-summary-cta-wrap">
                        <button type="button" className="btn" onClick={() => setProfilePaymentModalOpen(true)}>
                          Nouveau paiement
                        </button>
                      </div>
                    </div>
                    <div className="form-grid">
                      <div className="doc-progress-item">
                        <div className="doc-progress-summary-line">
                          <span className="muted">Progression</span>
                          <strong>{profilePaymentProgress}%</strong>
                        </div>
                        <div className="doc-progress-track" aria-hidden="true">
                          <span className="doc-progress-fill" style={{ width: `${profilePaymentProgress}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="doc-progress-list finance-blocks finance-blocks-two-col">
                      <div className="form-grid finance-block">
                        <strong className="profile-section-title">Liste des procédures</strong>
                        {profileSelectedProcedures.length ? (
                          <ul className="simple-list">
                            {profileSelectedProcedures.filter(Boolean).map((procedure, index) => {
                              const label = procedure?.title || procedure?.intitule || "Procédure";
                              const amount = formatCurrencyAmount(procedure?.montant || procedure?.amount || 0, procedure?.currency || "XAF");
                              return (
                                <li key={label + index} className="simple-list-item">
                                  <span className="simple-list-left">{label}</span>
                                  <strong>{amount}</strong>
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="muted">Aucune procédure disponible.</p>
                        )}
                      </div>

                      <div className="form-grid finance-block">
                        <strong className="profile-section-title">Historique des paiements</strong>
                        {profilePaymentsWithSequence.length ? (
                          <ul className="simple-list">
                            {profilePaymentsWithSequence.map((payment) => (
                              <li key={payment.id} className="simple-list-item">
                                <div className="simple-list-left">
                                  <div>
                                    <strong>Paiement {payment.paymentSequence}</strong>
                                  </div>
                                  <div className="muted">
                                    {formatProfileDate(payment.paid_at || payment.created_at)}
                                  </div>
                                  {payment.invoice_number ? (
                                    <div className="muted">Facture: {payment.invoice_number}</div>
                                  ) : null}
                                </div>
                                <div className="simple-list-right">
                                    <strong>{formatCurrencyAmount(payment?.amount || 0, payment?.currency || "XAF")}</strong>
                                  <div className="simple-list-actions">
                                    <button
                                      type="button"
                                      className="icon-action-btn"
                                      onClick={() => handlePrintPayment(payment)}
                                      title="Imprimer paiement"
                                      aria-label="Imprimer paiement"
                                    >
                                      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                                        <path
                                          d="M6 3h9l3 3v15H6V3Z"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="1.8"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                        <path
                                          d="M9 11h6M9 15h6"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="1.8"
                                          strokeLinecap="round"
                                        />
                                      </svg>
                                    </button>
                                    {payment.canEdit ? (
                                      <button
                                        type="button"
                                        className="icon-action-btn"
                                        onClick={() => openEditPayment(payment)}
                                        title="Modifier"
                                        aria-label="Modifier"
                                      >
                                        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                                          <path
                                            d="m15.6 3.2 5.2 5.2-11 11H4.6v-5.2l11-11Zm1.4-1.4 2.4-2.4a1.5 1.5 0 0 1 2.1 0l1.5 1.5a1.5 1.5 0 0 1 0 2.1l-2.4 2.4-3.6-3.6Z"
                                            fill="currentColor"
                                          />
                                        </svg>
                                      </button>
                                    ) : null}
                                    {payment.canDelete ? (
                                      <button
                                        type="button"
                                        className="icon-action-btn danger"
                                        onClick={() => handleProfilePaymentDelete(payment.paymentId)}
                                        title="Supprimer"
                                        aria-label="Supprimer"
                                      >
                                        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                                          <path
                                            d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h2v10H7V9Zm4 0h2v10h-2V9Zm4 0h2v10h-2V9Z"
                                            fill="currentColor"
                                          />
                                        </svg>
                                      </button>
                                    ) : null}
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="muted">Aucun paiement enregistré pour ce client.</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}

                {profileSideTab === "procedures" ? (
                  <div className="form-grid panel-accent">
                    <strong>Procédures disponibles</strong>
                    {profileProceduresLoading ? <p className="muted">Chargement des procédures...</p> : null}
                    {!profileProceduresLoading ? (
                      <>
                        <input
                          type="text"
                          placeholder="Filtre rapide (nom de procédure)"
                          value={profileProcedureFilter}
                          onChange={(event) => setProfileProcedureFilter(event.target.value)}
                        />
                        <div className="doc-progress-item">
                          <span className="muted">Sélection</span>
                          <strong>{profileSelectedProcedures.length}</strong>
                        </div>
                        <div className="inline">
                          <button
                            type="button"
                            className="btn secondary"
                            onClick={() => setProfileProcedureEditMode(true)}
                            disabled={profileProcedureSaving || profileProcedureEditMode}
                          >
                            Modifier les procédures
                          </button>
                          <button
                            type="button"
                            className="btn"
                            onClick={handleProfileProceduresSave}
                            disabled={profileProcedureSaving || !profileProcedureEditMode}
                          >
                            {profileProcedureSaving ? "Enregistrement..." : "Enregistrer la sélection"}
                          </button>
                        </div>
                        {!profileProcedureEditMode ? (
                          <p className="muted">Cliquez sur "Modifier les procédures" pour activer l'édition.</p>
                        ) : null}
                        {profileVisibleProcedures.length ? (
                          <ul className="simple-list">
                            {profileVisibleProcedures.filter(Boolean).map((procedure, index) => {
                              const procedureKey = String(procedure.id ?? index);
                              const isChecked = profileProcedureSelection.includes(procedureKey);
                              const label = procedure?.title || procedure?.intitule || "Procédure";
                              const amount = formatCurrencyAmount(procedure?.montant || procedure?.amount || 0, procedure?.currency || "XAF");
                              return (
                                <li key={procedureKey} className="simple-list-item">
                                  <span className="inline">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      disabled={!profileProcedureEditMode}
                                      onChange={() => toggleProfileProcedure(procedureKey)}
                                    />
                                    <span>{label}</span>
                                  </span>
                                  <strong>{amount}</strong>
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="muted">Aucune procédure disponible.</p>
                        )}
                      </>
                    ) : null}
                  </div>
                ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={profilePaymentHistoryOpen}
        title="Historique des paiements"
        onClose={() => setProfilePaymentHistoryOpen(false)}
        zIndex={104}
      >
        {profilePaymentsWithSequence.length ? (
          <ul className="simple-list">
            {profilePaymentsWithSequence.map((payment) => (
              <li key={payment.id} className="simple-list-item simple-list-item-column">
                <div className="inline row-between">
                  <strong>Paiement {payment.paymentSequence}</strong>
                  <strong>{formatCurrencyAmount(payment?.amount || 0, payment?.currency || "XAF")}</strong>
                </div>
                <div className="muted">{formatProfileDate(payment.paid_at || payment.created_at)}</div>
                {payment.invoice_number ? (
                  <div className="muted">Facture: {payment.invoice_number}</div>
                ) : null}
                <div className="inline row-between">
                  <div className="inline">
                    <button
                      type="button"
                      className="icon-action-btn"
                      onClick={() => handlePrintPayment(payment)}
                      title="Imprimer paiement"
                      aria-label="Imprimer paiement"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                        <path
                          d="M6 3h9l3 3v15H6V3Z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M9 11h6M9 15h6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="icon-action-btn icon-action-btn-sm"
                      onClick={() => {
                        setProfilePaymentHistoryOpen(false);
                        openEditPayment(payment);
                      }}
                      title="Modifier"
                      aria-label="Modifier"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                        <path
                          d="m15.6 3.2 5.2 5.2-11 11H4.6v-5.2l11-11Zm1.4-1.4 2.4-2.4a1.5 1.5 0 0 1 2.1 0l1.5 1.5a1.5 1.5 0 0 1 0 2.1l-2.4 2.4-3.6-3.6Z"
                          fill="currentColor"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="icon-action-btn icon-action-btn-sm danger"
                      onClick={() => handleProfilePaymentDelete(payment.id)}
                      title="Supprimer"
                      aria-label="Supprimer"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                        <path
                          d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h2v10H7V9Zm4 0h2v10h-2V9Zm4 0h2v10h-2V9Z"
                          fill="currentColor"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Aucun paiement enregistré pour ce client.</p>
        )}
      </Modal>

      <Modal
        open={profilePaymentModalOpen}
        title="Nouveau paiement"
        eyebrow="Encaissement"
        subtitle="Enregistrez une avance ou un règlement client directement depuis le profil pour garder la facturation et le solde à jour."
        onClose={() => setProfilePaymentModalOpen(false)}
        zIndex={105}
        width="760px"
        headerCenter={<span className="modal-head-badge">Paiement client</span>}
      >
        <form className="form-grid modal-form-layout" onSubmit={handleProfilePaymentSubmit}>
          <div className="modal-stat-row">
            <article className="modal-stat-chip">
              <span className="modal-stat-label">Reste à payer</span>
              <strong className="modal-stat-value">{formatCurrencyAmount(profileRemainingAmount, "XAF")}</strong>
            </article>
            <article className="modal-stat-chip">
              <span className="modal-stat-label">Déjà versé</span>
              <strong className="modal-stat-value">{formatCurrencyAmount(profilePaidAmount, "XAF")}</strong>
            </article>
          </div>

          <section className="modal-form-section">
            <div className="modal-section-head">
              <h4 className="modal-section-title">Détail du paiement</h4>
              <p className="modal-section-note">Le montant est plafonné automatiquement selon le solde restant du client.</p>
            </div>
            <div className="modal-section-grid modal-section-grid-two">
              <label className="modal-field-card">
                <span className="modal-field-label">Montant</span>
                <input
                  name="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Montant"
                  max={Math.max(profileRemainingAmount + Number(profilePaymentEditTarget?.amount || 0), 0) || undefined}
                  value={profilePaymentForm.amount}
                  onChange={handleProfilePaymentInput}
                  required
                />
              </label>
              <label className="modal-field-card">
                <span className="modal-field-label">Devise / statut</span>
                <input type="text" value="XAF - Avance" readOnly />
              </label>
              <label className="modal-field-card modal-field-card-wide">
                <span className="modal-field-label">Notes</span>
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="Notes (optionnel)"
                  value={profilePaymentForm.notes}
                  onChange={handleProfilePaymentInput}
                />
              </label>
            </div>
          </section>
          <input type="hidden" name="currency" value="XAF" />
          <input type="hidden" name="status" value="partial" />
          <input type="hidden" name="paidAt" value={profilePaymentForm.paidAt} />

          <div className="modal-action-row">
            <button type="button" className="btn secondary" onClick={() => setProfilePaymentModalOpen(false)}>
              Annuler
            </button>
            <button type="submit" className="btn" disabled={profilePaymentSubmitting}>
              {profilePaymentSubmitting ? "Paiement..." : "Enregistrer le paiement"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={profilePaymentEditOpen}
        title="Modifier paiement"
        onClose={() => setProfilePaymentEditOpen(false)}
        zIndex={106}
      >
        <form className="form-grid" onSubmit={handleProfilePaymentEditSubmit}>
          <input
            name="amount"
            type="number"
            min="0"
            step="0.01"
            placeholder="Montant"
            max={Math.max(profileRemainingAmount + Number(profilePaymentEditTarget?.amount || 0), 0) || undefined}
            value={profilePaymentEditForm.amount}
            onChange={handleProfilePaymentEditInput}
            required
          />
          <div className="inline">
            <select name="currency" value={profilePaymentEditForm.currency} onChange={handleProfilePaymentEditInput}>
              <option value="XAF">XAF</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
            <select name="status" value={profilePaymentEditForm.status} onChange={handleProfilePaymentEditInput}>
              <option value="partial">Avance</option>
              <option value="paid">Payé</option>
              <option value="pending">En attente</option>
            </select>
          </div>
          <input
            name="paidAt"
            type="date"
            value={profilePaymentEditForm.paidAt}
            onChange={handleProfilePaymentEditInput}
          />
          <textarea
            name="notes"
            rows={3}
            placeholder="Notes (optionnel)"
            value={profilePaymentEditForm.notes}
            onChange={handleProfilePaymentEditInput}
          />
          <div className="inline">
            <button type="submit" className="btn" disabled={profilePaymentSubmitting}>
              {profilePaymentSubmitting ? "Enregistrement..." : "Enregistrer"}
            </button>
            <button type="button" className="btn secondary" onClick={() => setProfilePaymentEditOpen(false)}>
              Annuler
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={editModalOpen} title="Modifier le client" onClose={() => setEditModalOpen(false)} zIndex={120}>
        <form className="form-grid" onSubmit={handleUpdate}>
          <div className="client-input-icon-wrap">
            <span className="client-input-leading-icon" aria-hidden="true"><FieldIcon type="user" /></span>
            <input name="fullName" aria-label="Nom complet" placeholder="Nom complet" value={editForm.fullName} onChange={handleEditInput} required />
          </div>
          <div className="inline">
            <div className="client-input-icon-wrap">
              <span className="client-input-leading-icon" aria-hidden="true"><FieldIcon type="mail" /></span>
              <input name="email" aria-label="E-mail" placeholder="E-mail" value={editForm.email} onChange={handleEditInput} />
            </div>
            <div className="client-input-icon-wrap">
              <span className="client-input-leading-icon" aria-hidden="true"><FieldIcon type="phone" /></span>
              <input name="phone" aria-label="Téléphone" placeholder="Téléphone" value={editForm.phone} onChange={handleEditInput} />
            </div>
          </div>
          <div className="inline">
            <div className="client-input-icon-wrap">
              <span className="client-input-leading-icon" aria-hidden="true"><FieldIcon type="calendar" /></span>
              <input type="date" name="birthDate" aria-label="Date de naissance" value={editForm.birthDate} onChange={handleEditInput} />
            </div>
            <div className="client-input-icon-wrap">
              <span className="client-input-leading-icon" aria-hidden="true"><FieldIcon type="pin" /></span>
              <input name="birthPlace" aria-label="Lieu de naissance" placeholder="Lieu de naissance" value={editForm.birthPlace} onChange={handleEditInput} />
            </div>
          </div>
          <div className="client-input-icon-wrap">
            <span className="client-input-leading-icon" aria-hidden="true"><FieldIcon type="globe" /></span>
            <input name="nationality" aria-label="Nationalité" placeholder="Nationalité" value={editForm.nationality} onChange={handleEditInput} />
          </div>
          <div className="client-input-icon-wrap">
            <span className="client-input-leading-icon" aria-hidden="true"><FieldIcon type="briefcase" /></span>
            <select name="serviceId" aria-label="Service de rattachement" value={editForm.serviceId} onChange={handleEditInput} required>
              <option value="">Sélectionner un service</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-grid">
            <label className="muted" htmlFor="edit-client-photo">
              Nouvelle photo (optionnel)
            </label>
            <input
              id="edit-client-photo"
              type="file"
              accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
              onChange={(event) => setEditPhotoFile(event.target.files?.[0] || null)}
            />
          </div>
          <button type="submit" className="btn" disabled={editSubmitting}>
            {editSubmitting ? "Mise à jour..." : "Enregistrer"}
          </button>
        </form>
      </Modal>

      <Modal open={deleteModalOpen} title="Supprimer le client" onClose={() => setDeleteModalOpen(false)} zIndex={110}>
        <div className="form-grid">
          <p className="muted">
            Confirmez la suppression de <strong>{selectedClient?.full_name || "ce client"}</strong>.
          </p>
          <div className="inline">
            <button type="button" className="btn secondary" onClick={() => setDeleteModalOpen(false)}>
              Annuler
            </button>
            <button type="button" className="btn" onClick={handleDelete} disabled={deleteSubmitting}>
              {deleteSubmitting ? "Suppression..." : "Supprimer"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ClientsPage;

