"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { Company, Source } from "../data/types";

export type CompanyRecord = Company & {
  recordId: string;
  userAdded?: boolean;
};

type WorkspaceData = {
  version: 1;
  overrides: Record<string, Company>;
  added: CompanyRecord[];
  personalNotes: Record<string, string>;
  updatedAt: string;
};

type CompanyDraft = {
  name: string;
  website: string;
  status: Company["status"];
  hq: string;
  founded: string;
  stage: string;
  sector: string;
  subsector: string;
  layer: string;
  product: string;
  targetCustomer: string;
  buyer: string;
  gtm: string;
  aiTech: string;
  deployment: string;
  differentiators: string;
  moatStrength: string;
  technicalDepth: string;
  verticalIntegration: string;
  fundingUsdM: string;
  fundingDisplay: string;
  fundingAsOf: string;
  latestRound: string;
  headcount: string;
  headcountAsOf: string;
  investors: string;
  traction: string;
  confidence: Company["confidence"];
  notes: string;
  sources: string;
};

const STORAGE_KEY = "ai-venture-atlas-workspace-v1";
const today = new Date().toISOString().slice(0, 10);

const statuses: Company["status"][] = [
  "Privée indépendante",
  "Cotée",
  "Acquise",
  "Acquisition annoncée",
  "Transaction stratégique",
];

const sectors = [
  "Foundation models & research",
  "AI infrastructure & compute",
  "Data infrastructure",
  "Developer tools & agents",
  "Horizontal enterprise software",
  "Healthcare & life sciences",
  "Financial services & insurance",
  "Legal, compliance & tax",
  "Industrial AI, robotics & supply chain",
  "Defense, space & autonomy",
  "Climate, energy & geospatial",
  "Semiconductors, hardware & edge",
  "Scientific AI & materials",
  "Media, voice & commerce",
];

const stages = ["Seed", "Series A", "Series B", "Growth", "Public", "Bootstrapped", "Unknown"];
const layers = ["Foundation model", "Infrastructure", "Developer tool", "Horizontal application", "Vertical application", "Hardware", "AI-native service"];

const emptyWorkspace = (): WorkspaceData => ({
  version: 1,
  overrides: {},
  added: [],
  personalNotes: {},
  updatedAt: new Date().toISOString(),
});

const emptyDraft = (): CompanyDraft => ({
  name: "",
  website: "",
  status: "Privée indépendante",
  hq: "",
  founded: "",
  stage: "Unknown",
  sector: "Horizontal enterprise software",
  subsector: "",
  layer: "Vertical application",
  product: "",
  targetCustomer: "",
  buyer: "",
  gtm: "",
  aiTech: "",
  deployment: "",
  differentiators: "Workflow integration",
  moatStrength: "2",
  technicalDepth: "2",
  verticalIntegration: "2",
  fundingUsdM: "",
  fundingDisplay: "Non publié",
  fundingAsOf: today,
  latestRound: "Non publié",
  headcount: "",
  headcountAsOf: "",
  investors: "",
  traction: "",
  confidence: "Low",
  notes: "Ajout utilisateur — à corroborer avant intégration au référentiel partagé.",
  sources: "",
});

function recordIdFor(company: Company) {
  return `base:${company.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function withoutRuntimeFields(record: CompanyRecord): Company {
  const { recordId: _recordId, userAdded: _userAdded, ...company } = record;
  void _recordId;
  void _userAdded;
  return company;
}

function splitList(value: string) {
  return [...new Set(value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean))];
}

function parseSources(value: string, website: string): Source[] {
  const parsed = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const [label, url, type] = line.split("|").map((item) => item.trim());
      if (!url || !/^https?:\/\//i.test(url)) return [];
      return [{ label: label || "Source utilisateur", url, type: type || "user-provided" }];
    });

  if (!parsed.length && /^https?:\/\//i.test(website)) {
    return [{ label: "Site officiel — ajout utilisateur", url: website, type: "user-provided" }];
  }
  return parsed;
}

function sourcesToText(sources: Source[]) {
  return sources.map((source) => `${source.label} | ${source.url} | ${source.type}`).join("\n");
}

function recordToDraft(record: CompanyRecord): CompanyDraft {
  return {
    name: record.name,
    website: record.website,
    status: record.status,
    hq: record.hq,
    founded: record.founded?.toString() ?? "",
    stage: record.stage,
    sector: record.sector,
    subsector: record.subsector,
    layer: record.layer,
    product: record.product,
    targetCustomer: record.targetCustomer,
    buyer: record.buyer,
    gtm: record.gtm,
    aiTech: record.aiTech.join(", "),
    deployment: record.deployment,
    differentiators: record.differentiators.join(", "),
    moatStrength: record.moatStrength.toString(),
    technicalDepth: record.technicalDepth.toString(),
    verticalIntegration: record.verticalIntegration.toString(),
    fundingUsdM: record.fundingUsdM?.toString() ?? "",
    fundingDisplay: record.fundingDisplay,
    fundingAsOf: record.fundingAsOf,
    latestRound: record.latestRound,
    headcount: record.headcount ?? "",
    headcountAsOf: record.headcountAsOf ?? "",
    investors: record.investors.join(", "),
    traction: record.traction,
    confidence: record.confidence,
    notes: record.notes,
    sources: sourcesToText(record.sources),
  };
}

function clampScore(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(1, Math.min(5, parsed)) : 1;
}

function draftToCompany(draft: CompanyDraft): Company {
  const founded = draft.founded.trim() ? Number.parseInt(draft.founded, 10) : null;
  const funding = draft.fundingUsdM.trim() ? Number.parseFloat(draft.fundingUsdM) : null;
  return {
    name: draft.name.trim(),
    website: draft.website.trim(),
    status: draft.status,
    hq: draft.hq.trim() || "Non publié",
    founded: Number.isFinite(founded) ? founded : null,
    stage: draft.stage,
    sector: draft.sector,
    subsector: draft.subsector.trim() || "Non classé",
    layer: draft.layer,
    product: draft.product.trim(),
    targetCustomer: draft.targetCustomer.trim() || "Non documenté",
    buyer: draft.buyer.trim() || "Non documenté",
    gtm: draft.gtm.trim() || "Non documenté",
    aiTech: splitList(draft.aiTech),
    deployment: draft.deployment.trim() || "Non documenté",
    differentiators: splitList(draft.differentiators),
    moatStrength: clampScore(draft.moatStrength),
    technicalDepth: clampScore(draft.technicalDepth),
    verticalIntegration: clampScore(draft.verticalIntegration),
    fundingUsdM: Number.isFinite(funding) ? funding : null,
    fundingDisplay: draft.fundingDisplay.trim() || "Non publié",
    fundingAsOf: draft.fundingAsOf.trim() || "Non publié",
    latestRound: draft.latestRound.trim() || "Non publié",
    headcount: draft.headcount.trim() || null,
    headcountAsOf: draft.headcountAsOf.trim() || null,
    investors: splitList(draft.investors),
    traction: draft.traction.trim() || "Non documentée",
    confidence: draft.confidence,
    notes: draft.notes.trim() || "Ajout utilisateur — non audité.",
    sources: parseSources(draft.sources, draft.website.trim()),
  };
}

function isSafeHttpUrl(value: unknown): value is string {
  return typeof value === "string" && /^https?:\/\/[^\s]+$/i.test(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isCompanyData(value: unknown): value is Company {
  if (!value || typeof value !== "object") return false;
  const company = value as Partial<Company>;
  const requiredStrings: (keyof Company)[] = [
    "name", "hq", "stage", "sector", "subsector", "layer", "product", "targetCustomer", "buyer", "gtm",
    "deployment", "fundingDisplay", "fundingAsOf", "latestRound", "traction", "notes",
  ];
  const validSources = Array.isArray(company.sources) && company.sources.every((source) => (
    source
    && typeof source.label === "string"
    && isSafeHttpUrl(source.url)
    && typeof source.type === "string"
  ));
  const validScores = [company.moatStrength, company.technicalDepth, company.verticalIntegration]
    .every((score) => typeof score === "number" && Number.isInteger(score) && score >= 1 && score <= 5);

  return requiredStrings.every((key) => typeof company[key] === "string")
    && isSafeHttpUrl(company.website)
    && statuses.includes(company.status as Company["status"])
    && (company.founded === null || typeof company.founded === "number")
    && (company.fundingUsdM === null || typeof company.fundingUsdM === "number")
    && (company.headcount === null || typeof company.headcount === "string")
    && (company.headcountAsOf === null || typeof company.headcountAsOf === "string")
    && isStringArray(company.aiTech)
    && isStringArray(company.differentiators)
    && isStringArray(company.investors)
    && validScores
    && ["High", "Medium", "Low"].includes(company.confidence ?? "")
    && validSources;
}

function parseWorkspaceData(value: unknown): WorkspaceData | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<WorkspaceData>;
  if (candidate.version !== 1 || !candidate.overrides || typeof candidate.overrides !== "object" || !Array.isArray(candidate.added) || !candidate.personalNotes || typeof candidate.personalNotes !== "object") return null;

  const overrideEntries = Object.entries(candidate.overrides);
  const overridesAreValid = overrideEntries.every(([recordId, company]) => recordId.startsWith("base:") && isCompanyData(company));
  const addedAreValid = candidate.added.every((record) => isCompanyData(record)
    && typeof record.recordId === "string"
    && record.recordId.startsWith("user:")
    && record.userAdded === true);
  const noteEntries = Object.entries(candidate.personalNotes);
  const notesAreValid = noteEntries.every(([recordId, note]) => /^(base|user):/.test(recordId) && typeof note === "string");
  if (!overridesAreValid || !addedAreValid || !notesAreValid) return null;

  return {
    version: 1,
    overrides: Object.fromEntries(overrideEntries) as Record<string, Company>,
    added: candidate.added.map((record) => ({ ...record, userAdded: true })),
    personalNotes: Object.fromEntries(noteEntries.map(([recordId, note]) => [recordId, String(note).slice(0, 20_000)])),
    updatedAt: typeof candidate.updatedAt === "string" ? candidate.updatedAt : new Date().toISOString(),
  };
}

export function useCompanyWorkspace(baseCompanies: Company[]) {
  const [workspace, setWorkspace] = useState<WorkspaceData>(emptyWorkspace);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          const safeWorkspace = parseWorkspaceData(parsed);
          if (safeWorkspace) setWorkspace(safeWorkspace);
        }
      } catch {
        // A corrupt local draft must never block the public atlas.
      } finally {
        setHydrated(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...workspace, updatedAt: new Date().toISOString() }));
    } catch {
      // Private mode and storage quotas can disable persistence; export remains available.
    }
  }, [workspace, hydrated]);

  const records = useMemo<CompanyRecord[]>(() => {
    const base = baseCompanies.map((company) => {
      const recordId = recordIdFor(company);
      return { ...company, ...(workspace.overrides[recordId] ?? {}), recordId };
    });
    return [...base, ...workspace.added];
  }, [baseCompanies, workspace.added, workspace.overrides]);

  const saveCompany = (record: CompanyRecord) => {
    setWorkspace((current) => {
      if (record.userAdded || record.recordId.startsWith("user:")) {
        const added = current.added.some((item) => item.recordId === record.recordId)
          ? current.added.map((item) => item.recordId === record.recordId ? { ...record, userAdded: true } : item)
          : [...current.added, { ...record, userAdded: true }];
        return { ...current, added };
      }
      return { ...current, overrides: { ...current.overrides, [record.recordId]: withoutRuntimeFields(record) } };
    });
  };

  const addCompany = (company: Company) => {
    const random = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const record: CompanyRecord = { ...company, recordId: `user:${random}`, userAdded: true };
    saveCompany(record);
    return record.recordId;
  };

  const setPersonalNote = (recordId: string, value: string) => {
    setWorkspace((current) => ({
      ...current,
      personalNotes: { ...current.personalNotes, [recordId]: value.slice(0, 20_000) },
    }));
  };

  const revertCompany = (recordId: string) => {
    setWorkspace((current) => {
      const overrides = { ...current.overrides };
      delete overrides[recordId];
      return { ...current, overrides };
    });
  };

  const removeAddedCompany = (recordId: string) => {
    setWorkspace((current) => {
      const personalNotes = { ...current.personalNotes };
      delete personalNotes[recordId];
      return { ...current, added: current.added.filter((item) => item.recordId !== recordId), personalNotes };
    });
  };

  const exportWorkspace = () => {
    const blob = new Blob([JSON.stringify({ ...workspace, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ai-venture-atlas-workspace-${today}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importWorkspace = async (file: File) => {
    if (file.size > 5_000_000) throw new Error("Fichier trop volumineux (5 Mo maximum).");
    const parsed: unknown = JSON.parse(await file.text());
    const safeWorkspace = parseWorkspaceData(parsed);
    if (!safeWorkspace) throw new Error("Format de workspace incompatible ou URL non sûre.");
    setWorkspace({ ...safeWorkspace, updatedAt: new Date().toISOString() });
  };

  const resetWorkspace = () => setWorkspace(emptyWorkspace());

  return {
    records,
    hydrated,
    personalNotes: workspace.personalNotes,
    overrideIds: new Set(Object.keys(workspace.overrides)),
    addedCount: workspace.added.length,
    notesCount: Object.values(workspace.personalNotes).filter((value) => value.trim()).length,
    saveCompany,
    addCompany,
    setPersonalNote,
    revertCompany,
    removeAddedCompany,
    exportWorkspace,
    importWorkspace,
    resetWorkspace,
  };
}

export function PersonalNotesEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="personal-notes">
      <div><h4>Notes personnelles</h4><span>Sauvegarde automatique · privées à ce navigateur</span></div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Questions à poser, signaux à vérifier, intuition, contact potentiel…"
        maxLength={20_000}
      />
      <small>{value.length.toLocaleString("fr-FR")} / 20 000 caractères · jamais incluses dans l’export CSV public</small>
    </div>
  );
}

type EditorSectionProps = {
  records: CompanyRecord[];
  editingRecord: CompanyRecord | null;
  overrideIds: Set<string>;
  addedCount: number;
  notesCount: number;
  hydrated: boolean;
  onAdd: (company: Company) => string;
  onSave: (record: CompanyRecord) => void;
  onCancelEdit: () => void;
  onEdit: (recordId: string) => void;
  onRevert: (recordId: string) => void;
  onRemove: (recordId: string) => void;
  onExport: () => void;
  onImport: (file: File) => Promise<void>;
  onReset: () => void;
};

export function CompanyEditorSection(props: EditorSectionProps) {
  const [draft, setDraft] = useState<CompanyDraft>(() => props.editingRecord ? recordToDraft(props.editingRecord) : emptyDraft());
  const [message, setMessage] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const set = <K extends keyof CompanyDraft>(field: K, value: CompanyDraft[K]) => setDraft((current) => ({ ...current, [field]: value }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.name.trim() || !/^https?:\/\//i.test(draft.website.trim()) || !draft.product.trim()) {
      setMessage("Nom, site HTTP(S) et description produit sont obligatoires.");
      return;
    }
    const company = draftToCompany(draft);
    if (props.editingRecord) {
      props.onSave({ ...company, recordId: props.editingRecord.recordId, userAdded: props.editingRecord.userAdded });
      setMessage("Fiche modifiée dans ce navigateur.");
    } else {
      props.onAdd(company);
      setDraft(emptyDraft());
      setMessage("Nouvelle fiche ajoutée dans ce navigateur.");
    }
  };

  const localChanges = props.records.filter((record) => record.userAdded || props.overrideIds.has(record.recordId));

  return (
    <section className="section editor-section" id="editeur">
      <div className="section-heading">
        <div><span className="section-number">02</span><span className="eyebrow">Local workspace</span><h2>Ajouter et modifier la cartographie</h2></div>
        <p>Un espace de travail privé pour enrichir les fiches sans altérer silencieusement le référentiel public. Les changements peuvent être exportés puis relus avant intégration.</p>
      </div>

      <div className="editor-local-warning">
        <strong>Mode local explicite</strong>
        <p>Les modifications et notes vivent dans le stockage de ce navigateur. Elles ne sont ni partagées entre collaborateurs ni sauvegardées sur un serveur tant qu’aucun backend authentifié n’est connecté.</p>
        <span>{props.hydrated ? "Stockage local prêt" : "Chargement du workspace…"}</span>
      </div>

      <div className="editor-kpis">
        <div><strong>{props.addedCount}</strong><span>fiches ajoutées</span></div>
        <div><strong>{props.overrideIds.size}</strong><span>fiches modifiées</span></div>
        <div><strong>{props.notesCount}</strong><span>notes personnelles</span></div>
        <div><strong>{localChanges.length}</strong><span>changements exportables</span></div>
      </div>

      <div className="editor-actions">
        <button className="button mini secondary" onClick={props.onExport}>Exporter mon workspace</button>
        <button className="button mini secondary" onClick={() => fileInput.current?.click()}>Importer un workspace</button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            try {
              await props.onImport(file);
              setMessage("Workspace importé.");
            } catch (error) {
              setMessage(error instanceof Error ? error.message : "Import impossible.");
            } finally {
              event.target.value = "";
            }
          }}
        />
        <button className="text-button danger" onClick={() => {
          if (window.confirm("Effacer toutes les fiches locales, modifications et notes personnelles de ce navigateur ?")) props.onReset();
        }}>Réinitialiser les données locales</button>
        <span className="editor-privacy-note">Confidentialité : l’export JSON inclut les notes personnelles ; le CSV public ne les inclut jamais.</span>
      </div>

      <div className="editor-layout">
        <form className="company-editor-form" onSubmit={submit}>
          <div className="editor-form-head">
            <div><span className="eyebrow">{props.editingRecord ? "Modification locale" : "Nouvelle entrée"}</span><h3>{props.editingRecord ? props.editingRecord.name : "Créer une fiche"}</h3></div>
            {props.editingRecord && <button type="button" className="text-button" onClick={props.onCancelEdit}>Annuler</button>}
          </div>

          <fieldset>
            <legend>Identité et marché</legend>
            <label><span>Nom *</span><input value={draft.name} onChange={(event) => set("name", event.target.value)} /></label>
            <label><span>Site officiel *</span><input value={draft.website} onChange={(event) => set("website", event.target.value)} placeholder="https://…" /></label>
            <label><span>Statut</span><select value={draft.status} onChange={(event) => set("status", event.target.value as Company["status"])}>{statuses.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label><span>Siège</span><input value={draft.hq} onChange={(event) => set("hq", event.target.value)} /></label>
            <label><span>Fondation</span><input inputMode="numeric" value={draft.founded} onChange={(event) => set("founded", event.target.value)} /></label>
            <label><span>Stade</span><select value={draft.stage} onChange={(event) => set("stage", event.target.value)}>{stages.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label><span>Secteur</span><select value={draft.sector} onChange={(event) => set("sector", event.target.value)}>{sectors.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label><span>Sous-secteur</span><input value={draft.subsector} onChange={(event) => set("subsector", event.target.value)} /></label>
            <label><span>Couche</span><select value={draft.layer} onChange={(event) => set("layer", event.target.value)}>{layers.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label className="wide"><span>Produit *</span><textarea value={draft.product} onChange={(event) => set("product", event.target.value)} /></label>
            <label><span>Marché cible</span><input value={draft.targetCustomer} onChange={(event) => set("targetCustomer", event.target.value)} /></label>
            <label><span>Buyer</span><input value={draft.buyer} onChange={(event) => set("buyer", event.target.value)} /></label>
            <label className="wide"><span>Go-to-market</span><input value={draft.gtm} onChange={(event) => set("gtm", event.target.value)} /></label>
          </fieldset>

          <details open={Boolean(props.editingRecord)}>
            <summary>Technologie, moat et scores</summary>
            <div className="editor-detail-grid">
              <label><span>Technologies IA — séparées par virgules</span><input value={draft.aiTech} onChange={(event) => set("aiTech", event.target.value)} /></label>
              <label><span>Déploiement</span><input value={draft.deployment} onChange={(event) => set("deployment", event.target.value)} /></label>
              <label className="wide"><span>Différenciateurs — séparés par virgules</span><input value={draft.differentiators} onChange={(event) => set("differentiators", event.target.value)} /></label>
              <label><span>Force du moat /5</span><input type="number" min="1" max="5" value={draft.moatStrength} onChange={(event) => set("moatStrength", event.target.value)} /></label>
              <label><span>Profondeur technique /5</span><input type="number" min="1" max="5" value={draft.technicalDepth} onChange={(event) => set("technicalDepth", event.target.value)} /></label>
              <label><span>Intégration métier /5</span><input type="number" min="1" max="5" value={draft.verticalIntegration} onChange={(event) => set("verticalIntegration", event.target.value)} /></label>
            </div>
          </details>

          <details>
            <summary>Capital, traction et preuves</summary>
            <div className="editor-detail-grid">
              <label><span>Montant numérique indicatif, $M</span><input inputMode="decimal" value={draft.fundingUsdM} onChange={(event) => set("fundingUsdM", event.target.value)} /></label>
              <label><span>Affichage financement</span><input value={draft.fundingDisplay} onChange={(event) => set("fundingDisplay", event.target.value)} /></label>
              <label><span>Financement daté</span><input value={draft.fundingAsOf} onChange={(event) => set("fundingAsOf", event.target.value)} /></label>
              <label><span>Dernier round</span><input value={draft.latestRound} onChange={(event) => set("latestRound", event.target.value)} /></label>
              <label><span>Taille d’équipe</span><input value={draft.headcount} onChange={(event) => set("headcount", event.target.value)} /></label>
              <label><span>Headcount daté</span><input value={draft.headcountAsOf} onChange={(event) => set("headcountAsOf", event.target.value)} /></label>
              <label className="wide"><span>Investisseurs — séparés par virgules</span><input value={draft.investors} onChange={(event) => set("investors", event.target.value)} /></label>
              <label className="wide"><span>Traction publique</span><textarea value={draft.traction} onChange={(event) => set("traction", event.target.value)} /></label>
              <label><span>Confiance</span><select value={draft.confidence} onChange={(event) => set("confidence", event.target.value as Company["confidence"])}><option>High</option><option>Medium</option><option>Low</option></select></label>
              <label className="wide"><span>Lecture critique</span><textarea value={draft.notes} onChange={(event) => set("notes", event.target.value)} /></label>
              <label className="wide"><span>Sources — une par ligne : Label | URL | type</span><textarea className="source-textarea" value={draft.sources} onChange={(event) => set("sources", event.target.value)} /></label>
            </div>
          </details>

          <div className="editor-submit-row">
            <button className="button primary" type="submit">{props.editingRecord ? "Enregistrer la modification" : "Ajouter à ma cartographie"}</button>
            {message && <span role="status">{message}</span>}
          </div>
        </form>

        <aside className="local-change-list">
          <span className="eyebrow">Changements locaux</span>
          <h3>À relire ou partager</h3>
          {!localChanges.length && <p>Aucune modification locale. Ouvre une fiche puis clique sur « Modifier », ou crée une entrée.</p>}
          {localChanges.map((record) => (
            <article key={record.recordId}>
              <div><strong>{record.name}</strong><span>{record.userAdded ? "Ajout local" : "Fiche modifiée"}</span></div>
              <button onClick={() => props.onEdit(record.recordId)}>Éditer</button>
              {record.userAdded
                ? <button className="danger" onClick={() => props.onRemove(record.recordId)}>Supprimer</button>
                : <button onClick={() => props.onRevert(record.recordId)}>Restaurer</button>}
            </article>
          ))}
        </aside>
      </div>
    </section>
  );
}
