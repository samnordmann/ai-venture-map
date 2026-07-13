"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import companiesJson from "./data/companies.json";
import { capitalFacts, capitalNodes, fundingArchetypes } from "./data/capital";
import { averageIdeaScore, ideas } from "./data/ideas";
import { trends } from "./data/trends";
import type { Company, Idea, IdeaVerdict } from "./data/types";
import {
  CompanyEditorSection,
  PersonalNotesEditor,
  useCompanyWorkspace,
  type CompanyRecord,
} from "./components/company-workspace";

const baseCompanies = companiesJson as Company[];
const AS_OF = "13 juillet 2026";

const sectorPalette = ["#2f6fed", "#e65c3d", "#07866f", "#7857d6", "#c58a00", "#187aa2", "#b94273", "#5d6a72"];

function hashIndex(value: string, modulo: number) {
  return [...value].reduce((acc, char) => acc + char.charCodeAt(0), 0) % modulo;
}

function sectorColor(sector: string) {
  return sectorPalette[hashIndex(sector || "Autre", sectorPalette.length)];
}

function getRegion(hq: string | null | undefined) {
  const value = (hq ?? "").toLowerCase();
  if (!value || value === "non publié" || value === "unknown") return "Inconnu";
  if (["france", "paris", "grenoble", "lyon", "toulouse", "saclay"].some((term) => value.includes(term))) return "France";
  if (["united states", "usa", "u.s.", "san francisco", "new york", "boston", "seattle", "austin", "palo alto", "mountain view"].some((term) => value.includes(term))) return "États-Unis";
  if (["united kingdom", "london", "cambridge, uk", "uk"].some((term) => value.includes(term))) return "Royaume-Uni";
  if (["canada", "toronto", "montreal", "vancouver"].some((term) => value.includes(term))) return "Canada";
  if (["china", "beijing", "shanghai", "shenzhen", "hong kong"].some((term) => value.includes(term))) return "Chine";
  if (["israel", "tel aviv"].some((term) => value.includes(term))) return "Israël";
  if (["germany", "berlin", "munich", "spain", "madrid", "barcelona", "sweden", "stockholm", "finland", "helsinki", "netherlands", "amsterdam", "switzerland", "zurich", "italy", "rome", "belgium", "denmark", "norway", "portugal", "ireland", "estonia", "poland", "czechia", "czech republic", "austria", "luxembourg", "romania", "europe"].some((term) => value.includes(term))) return "Europe hors France/UK";
  if (["south korea", "korea", "japan", "singapore", "india", "australia", "taiwan", "indonesia", "united arab emirates", "uae"].some((term) => value.includes(term))) return "Asie-Pacifique";
  return "Autres";
}

function formatFunding(value: number | null, display?: string) {
  if (display) return display;
  if (value === null || Number.isNaN(value)) return "Non public";
  if (value >= 1000) return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}B`;
  return `$${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}M`;
}

function csvEscape(value: unknown) {
  const text = Array.isArray(value)
    ? value.map((item) => typeof item === "object" && item !== null && "url" in item ? `${"label" in item ? String(item.label) : "Source"}: ${String(item.url)}` : String(item)).join(" | ")
    : String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadCompaniesCsv(rows: Company[]) {
  const columns: (keyof Company)[] = [
    "name", "website", "status", "hq", "founded", "stage", "sector", "subsector", "layer", "product", "targetCustomer", "buyer", "gtm", "aiTech", "deployment", "differentiators", "moatStrength", "technicalDepth", "verticalIntegration", "fundingUsdM", "fundingDisplay", "fundingAsOf", "latestRound", "headcount", "headcountAsOf", "investors", "traction", "confidence", "notes", "sources",
  ];
  const body = [columns.join(","), ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(","))].join("\n");
  const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "ai-venture-atlas-companies.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function scoreTone(score: number) {
  if (score >= 80) return "strong";
  if (score >= 60) return "medium";
  return "weak";
}

function trendMacroCategory(category: string) {
  const value = category.toLowerCase();
  if (value.includes("agent")) return "Agents";
  if (value.includes("model layer")) return "Modèles";
  if (value.includes("energy") || value.includes("hardware")) return "Hardware & énergie";
  if (value.includes("scientific") || value.includes("physical")) return "Scientific & physical AI";
  if (value.includes("vertical")) return "Vertical AI";
  if (value === "data") return "Data";
  if (value.includes("governance")) return "Gouvernance";
  if (value.includes("sovereign")) return "Souveraineté";
  return "Infrastructure & systèmes";
}

function ScorePill({ value, label }: { value: number; label: string }) {
  return <span className={`score-pill ${scoreTone(value)}`} title={`${label}: ${value}/100`}>{value}<small>{label}</small></span>;
}

function SourceLinks({ sources, compact = false }: { sources: Company["sources"] | Idea["sources"]; compact?: boolean }) {
  if (!sources?.length) return <span className="muted">Aucune source attachée</span>;
  return (
    <div className={`source-links ${compact ? "compact" : ""}`}>
      {sources.map((source, index) => (
        <a href={source.url} target="_blank" rel="noreferrer" key={`${source.url}-${index}`} title={source.type}>
          {source.label}<span aria-hidden="true"> ↗</span>
        </a>
      ))}
    </div>
  );
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const navigation = [
    ["#cartographie", "Cartographie"],
    ["#editeur", "Éditeur"],
    ["#tendances", "Tendances"],
    ["#capital", "Capital"],
    ["#idees", "Idées"],
    ["#methode", "Méthode"],
  ];

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.body.classList.add("mobile-menu-open");
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.classList.remove("mobile-menu-open");
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="AI Venture Atlas — accueil" onClick={closeMenu}>
        <span className="brand-mark">A</span>
        <span><strong>AI Venture Atlas</strong><small>research workspace</small></span>
      </a>
      <button
        ref={menuButtonRef}
        className={`menu-button ${menuOpen ? "open" : ""}`}
        type="button"
        aria-expanded={menuOpen}
        aria-controls="main-navigation"
        aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
        <b>Menu</b>
      </button>
      <nav id="main-navigation" className={menuOpen ? "open" : ""} aria-label="Navigation principale">
        {navigation.map(([href, label]) => <a href={href} key={href} onClick={closeMenu}>{label}</a>)}
      </nav>
      {menuOpen && <button className="menu-backdrop" type="button" aria-label="Fermer le menu" onClick={closeMenu} />}
      <span className="as-of">Données au {AS_OF}</span>
    </header>
  );
}

function Hero({ companies }: { companies: CompanyRecord[] }) {
  const knownFunding = companies.filter((company) => company.fundingUsdM !== null);
  const sectors = new Set(companies.map((company) => company.sector)).size;
  const countries = new Set(companies.map((company) => getRegion(company.hq))).size;
  return (
    <section className="hero" id="top">
      <div className="hero-copy">
        <span className="eyebrow">Atlas de décision · v0.1</span>
        <h1>Cartographier l’écosystème.<br /><em>Choisir où creuser.</em></h1>
        <p>
          Un workspace partagé pour comparer les startups IA par marché, go-to-market, financement,
          profondeur technique et intégration métier — puis confronter nos propres thèses à la réalité.
        </p>
        <div className="hero-actions">
          <a className="button primary" href="#cartographie">Explorer les entreprises</a>
          <a className="button secondary" href="#idees">Comparer les idées</a>
        </div>
        <p className="hero-note"><span>Important</span> Ce n’est ni un classement d’investissement ni une base exhaustive. Les chiffres publics sont datés, parfois incomplets et non comparables.</p>
      </div>
      <div className="hero-dashboard" aria-label="Résumé de la base">
        <div className="hero-dashboard-head"><span>Research coverage</span><span className="live-dot">revue active</span></div>
        <div className="kpi-grid">
          <div><strong>{companies.length}</strong><span>entreprises</span></div>
          <div><strong>{sectors}</strong><span>secteurs</span></div>
          <div><strong>{countries}</strong><span>zones</span></div>
          <div><strong>{ideas.length}</strong><span>thèses</span></div>
        </div>
        <div className="funding-total">
          <span>Financement public documenté</span>
          <strong>{knownFunding.length}/{companies.length}</strong>
          <small>Sociétés avec un montant public exploitable. Aucun total agrégé : equity, dette, secondaire et engagements ne sont pas comparables.</small>
        </div>
        <div className="coverage-bars">
          <div><span>Sources attachées</span><b style={{ width: `${companies.length ? Math.round((companies.filter((c) => c.sources?.length >= 2).length / companies.length) * 100) : 0}%` }} /></div>
          <div><span>Funding renseigné</span><b style={{ width: `${companies.length ? Math.round((knownFunding.length / companies.length) * 100) : 0}%` }} /></div>
          <div><span>Headcount renseigné</span><b style={{ width: `${companies.length ? Math.round((companies.filter((c) => c.headcount && c.headcount !== "Unknown").length / companies.length) * 100) : 0}%` }} /></div>
        </div>
      </div>
    </section>
  );
}

type CompanySort = "name" | "sector" | "status" | "stage" | "hq" | "fundingUsdM" | "technicalDepth" | "verticalIntegration" | "moatStrength";

function CompanyExplorer({
  companies,
  personalNotes,
  onNoteChange,
  onEdit,
}: {
  companies: CompanyRecord[];
  personalNotes: Record<string, string>;
  onNoteChange: (recordId: string, value: string) => void;
  onEdit: (recordId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("Tous");
  const [layer, setLayer] = useState("Toutes");
  const [region, setRegion] = useState("Toutes");
  const [status, setStatus] = useState("Tous");
  const [stage, setStage] = useState("Tous");
  const [moat, setMoat] = useState("Tous");
  const [minFunding, setMinFunding] = useState("0");
  const [sort, setSort] = useState<CompanySort>("fundingUsdM");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<string | null>(null);
  const selectedTrigger = useRef<HTMLElement | null>(null);

  const options = useMemo(() => ({
    sectors: [...new Set(companies.map((company) => company.sector))].sort(),
    layers: [...new Set(companies.map((company) => company.layer))].sort(),
    regions: [...new Set(companies.map((company) => getRegion(company.hq)))].sort(),
    statuses: [...new Set(companies.map((company) => company.status))].sort(),
    stages: [...new Set(companies.map((company) => company.stage))].sort(),
    moats: [...new Set(companies.flatMap((company) => company.differentiators))].sort(),
  }), [companies]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const fundingThreshold = Number(minFunding) || 0;
    return companies
      .filter((company) => {
        const haystack = [company.name, company.product, company.sector, company.subsector, company.buyer, company.gtm, company.hq, ...company.aiTech, ...company.differentiators].join(" ").toLowerCase();
        return (!needle || haystack.includes(needle))
          && (sector === "Tous" || company.sector === sector)
          && (layer === "Toutes" || company.layer === layer)
          && (region === "Toutes" || getRegion(company.hq) === region)
          && (status === "Tous" || company.status === status)
          && (stage === "Tous" || company.stage === stage)
          && (moat === "Tous" || company.differentiators.includes(moat))
          && ((company.fundingUsdM ?? 0) >= fundingThreshold);
      })
      .sort((a, b) => {
        const aValue = sort === "name" ? a.name.toLowerCase() : (a[sort] ?? -1);
        const bValue = sort === "name" ? b.name.toLowerCase() : (b[sort] ?? -1);
        const comparison = typeof aValue === "string" ? aValue.localeCompare(String(bValue)) : Number(aValue) - Number(bValue);
        return direction === "asc" ? comparison : -comparison;
      });
  }, [companies, query, sector, layer, region, status, stage, moat, minFunding, sort, direction]);

  const selectedCompany = companies.find((company) => company.recordId === selected) ?? null;

  useEffect(() => {
    if (!selectedCompany) return;
    const media = window.matchMedia("(max-width: 980px)");
    const syncScrollLock = () => document.body.classList.toggle("company-detail-open", media.matches);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelected(null);
        window.requestAnimationFrame(() => selectedTrigger.current?.focus());
      }
    };
    syncScrollLock();
    media.addEventListener("change", syncScrollLock);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.classList.remove("company-detail-open");
      media.removeEventListener("change", syncScrollLock);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedCompany]);

  const reset = () => {
    setQuery(""); setSector("Tous"); setLayer("Toutes"); setRegion("Toutes"); setStatus("Tous"); setStage("Tous"); setMoat("Tous"); setMinFunding("0");
  };
  const openCompany = (recordId: string) => {
    selectedTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSelected(recordId);
  };
  const closeCompany = () => {
    setSelected(null);
    window.requestAnimationFrame(() => selectedTrigger.current?.focus());
  };
  const selectFromMap = (recordId: string) => {
    openCompany(recordId);
    if (!window.matchMedia("(max-width: 980px)").matches) {
      window.requestAnimationFrame(() => document.getElementById("company-table-start")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };

  return (
    <section className="section" id="cartographie">
      <div className="section-heading">
        <div><span className="section-number">01</span><span className="eyebrow">Company landscape</span><h2>La cartographie des entreprises IA</h2></div>
        <p>Une base curatée de sociétés financées et stratégiquement instructives. Les notes de moat sont des jugements analytiques; funding, produit et siège sont des faits sourcés quand disponibles.</p>
      </div>

      <div className="filter-panel">
        <label className="search-field"><span>Rechercher</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Entreprise, produit, buyer, technologie…" /></label>
        <label><span>Secteur</span><select value={sector} onChange={(event) => setSector(event.target.value)}><option>Tous</option>{options.sectors.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>Couche</span><select value={layer} onChange={(event) => setLayer(event.target.value)}><option>Toutes</option>{options.layers.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>Géographie</span><select value={region} onChange={(event) => setRegion(event.target.value)}><option>Toutes</option>{options.regions.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>Statut</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option>Tous</option>{options.statuses.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>Stade</span><select value={stage} onChange={(event) => setStage(event.target.value)}><option>Tous</option>{options.stages.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>Différenciateur</span><select value={moat} onChange={(event) => setMoat(event.target.value)}><option>Tous</option>{options.moats.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>Montant public indicatif min.</span><select value={minFunding} onChange={(event) => setMinFunding(event.target.value)}><option value="0">Aucun</option><option value="1">$1M+</option><option value="10">$10M+</option><option value="50">$50M+</option><option value="100">$100M+</option><option value="1000">$1B+</option></select></label>
        <button className="text-button" onClick={reset}>Réinitialiser</button>
      </div>

      <Landscape companies={filtered} selected={selected} onSelect={selectFromMap} />

      <div className="table-toolbar" id="company-table-start">
        <div><strong>{filtered.length}</strong> entreprises affichées sur {companies.length}</div>
        <div className="toolbar-controls">
          <label>Trier par <select value={sort} onChange={(event) => setSort(event.target.value as CompanySort)}><option value="fundingUsdM">Montant public indicatif</option><option value="name">Nom</option><option value="sector">Secteur</option><option value="status">Statut</option><option value="stage">Stade</option><option value="hq">Siège</option><option value="technicalDepth">Profondeur technique</option><option value="verticalIntegration">Intégration métier</option><option value="moatStrength">Force du moat</option></select></label>
          <button className="icon-button" onClick={() => setDirection(direction === "asc" ? "desc" : "asc")} aria-label="Inverser le tri">{direction === "asc" ? "↑" : "↓"}</button>
          <button className="button mini secondary" onClick={() => downloadCompaniesCsv(filtered)}>Exporter CSV</button>
        </div>
      </div>

      <div className="company-layout">
        <div className="table-wrap">
          <table className="company-table">
            <thead><tr><th>Entreprise</th><th>Secteur / couche</th><th>Géo / statut</th><th>Financement / équipe</th><th>GTM et buyer</th><th>Différenciation</th><th>Tech ↔ métier</th></tr></thead>
            <tbody>
              {filtered.map((company) => (
                <tr key={company.recordId} className={selected === company.recordId ? "selected" : ""}>
                  <td><button className="company-name" onClick={() => openCompany(company.recordId)}>{company.name}</button><span className="table-sub">{company.product}</span></td>
                  <td><span className="sector-dot" style={{ background: sectorColor(company.sector) }} />{company.sector}<span className="table-sub">{company.layer} · {company.subsector}</span></td>
                  <td>{company.hq || "Inconnu"}<span className="table-sub">{company.status} · {company.stage || "stade non public"}</span></td>
                  <td><strong>{formatFunding(company.fundingUsdM, company.fundingDisplay)}</strong><span className="table-sub">{company.headcount || "Taille inconnue"}</span></td>
                  <td>{company.gtm || "Non documenté"}<span className="table-sub">{company.buyer || company.targetCustomer}</span></td>
                  <td><div className="tag-list">{company.differentiators.slice(0, 3).map((item) => <span key={item}>{item}</span>)}</div></td>
                  <td><div className="mini-score"><span style={{ width: `${company.technicalDepth * 20}%` }} /><small>tech {company.technicalDepth}/5</small></div><div className="mini-score vertical"><span style={{ width: `${company.verticalIntegration * 20}%` }} /><small>métier {company.verticalIntegration}/5</small></div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && <div className="empty-state"><strong>Aucun résultat</strong><p>Élargis les filtres ou réinitialise la recherche.</p></div>}
        </div>
        <div className="company-card-list" aria-label="Entreprises">
          {filtered.map((company) => (
            <button
              className={selected === company.recordId ? "company-card selected" : "company-card"}
              type="button"
              key={company.recordId}
              onClick={() => openCompany(company.recordId)}
              aria-label={`Ouvrir la fiche de ${company.name}`}
            >
              <span className="company-card-head">
                <span><i style={{ background: sectorColor(company.sector) }} />{company.sector}</span>
                <strong>{formatFunding(company.fundingUsdM)}</strong>
              </span>
              <span className="company-card-name">{company.name}</span>
              <span className="company-card-product">{company.product}</span>
              <span className="company-card-meta">{company.hq || "Siège inconnu"} · {company.stage || company.status}</span>
              <span className="company-card-tags">{company.differentiators.slice(0, 2).map((item) => <i key={item}>{item}</i>)}</span>
              <span className="company-card-foot">
                <span>tech {company.technicalDepth}/5 · métier {company.verticalIntegration}/5</span>
                <strong>Ouvrir la fiche <span aria-hidden="true">→</span></strong>
              </span>
            </button>
          ))}
          {!filtered.length && <div className="empty-state"><strong>Aucun résultat</strong><p>Élargis les filtres ou réinitialise la recherche.</p></div>}
        </div>
        {selectedCompany && (
          <>
            <button className="company-detail-backdrop" type="button" onClick={closeCompany} aria-label="Fermer la fiche entreprise" />
            <CompanyDetail
              company={selectedCompany}
              note={personalNotes[selectedCompany.recordId] ?? ""}
              onNoteChange={(value) => onNoteChange(selectedCompany.recordId, value)}
              onEdit={() => {
                closeCompany();
                onEdit(selectedCompany.recordId);
              }}
              onClose={closeCompany}
            />
          </>
        )}
      </div>
    </section>
  );
}

function Landscape({ companies: rows, selected, onSelect }: { companies: CompanyRecord[]; selected: string | null; onSelect: (recordId: string) => void }) {
  const visible = [...rows].sort((a, b) => (b.fundingUsdM ?? 0) - (a.fundingUsdM ?? 0)).slice(0, 80);
  const sectorCounts = [...rows.reduce((map, company) => map.set(company.sector, (map.get(company.sector) ?? 0) + 1), new Map<string, number>())]
    .sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxCount = Math.max(1, ...sectorCounts.map(([, count]) => count));
  return (
    <div className="landscape-card">
      <div className="landscape-head"><div><span className="eyebrow">Moat map</span><h3>Profondeur technique × intégration métier</h3></div><p>Jusqu’à 80 points du filtre, prioritaires par montant documenté. La taille est indicative — equity, dette et secondaire ne sont pas toujours comparables.</p></div>
      <div className="landscape-grid">
        <div className="scatter-wrap">
          <span className="axis-label y">Intégration métier forte →</span>
          <div className="scatter" role="img" aria-label="Nuage de points des entreprises par profondeur technique et intégration métier">
            <span className="quadrant q1">Deep tech vertical</span><span className="quadrant q2">Distribution / workflow</span><span className="quadrant q3">Faible moat perçu</span><span className="quadrant q4">Infrastructure / research</span>
            {visible.map((company) => {
              const jitter = (hashIndex(company.name, 13) - 6) * 0.38;
              const size = Math.max(9, Math.min(34, 9 + Math.log10((company.fundingUsdM ?? 0) + 1) * 6));
              const left = Math.max(3, Math.min(97, ((company.technicalDepth - 1) / 4) * 88 + 6 + jitter));
              const bottom = Math.max(3, Math.min(97, ((company.verticalIntegration - 1) / 4) * 82 + 8 - jitter));
              return <button key={company.recordId} className={`bubble ${selected === company.recordId ? "active" : ""}`} style={{ width: size, height: size, left: `${left}%`, bottom: `${bottom}%`, background: sectorColor(company.sector) }} title={`${company.name} · ${company.sector} · tech ${company.technicalDepth}/5 · métier ${company.verticalIntegration}/5`} onClick={() => onSelect(company.recordId)} aria-label={`Ouvrir ${company.name}`} />;
            })}
          </div>
          <span className="axis-label x">Profondeur technique forte →</span>
        </div>
        <div className="sector-bars">
          <span className="eyebrow">Top secteurs du filtre</span>
          {sectorCounts.map(([sector, count]) => <div key={sector}><p><span><i style={{ background: sectorColor(sector) }} />{sector}</span><strong>{count}</strong></p><b><i style={{ width: `${(count / maxCount) * 100}%`, background: sectorColor(sector) }} /></b></div>)}
        </div>
      </div>
    </div>
  );
}

function CompanyDetail({
  company,
  note,
  onNoteChange,
  onEdit,
  onClose,
}: {
  company: CompanyRecord;
  note: string;
  onNoteChange: (value: string) => void;
  onEdit: () => void;
  onClose: () => void;
}) {
  return (
    <aside className="company-detail" aria-labelledby="company-detail-title">
      <button className="close-button" onClick={onClose} aria-label="Fermer la fiche" autoFocus>×</button>
      <span className="eyebrow">Fiche entreprise</span>
      <h3 id="company-detail-title">{company.name}</h3>
      <a className="website-link" href={company.website} target="_blank" rel="noreferrer">Site officiel ↗</a>
      <button className="detail-edit-button" onClick={onEdit}>Modifier cette fiche</button>
      <p className="detail-product">{company.product}</p>
      <div className="detail-scores"><ScorePill value={company.technicalDepth * 20} label="tech" /><ScorePill value={company.verticalIntegration * 20} label="métier" /><ScorePill value={company.moatStrength * 20} label="moat" /></div>
      <dl>
        <div><dt>Statut</dt><dd>{company.status} · {company.stage}</dd></div>
        <div><dt>Marché / buyer</dt><dd>{company.targetCustomer}<br />{company.buyer}</dd></div>
        <div><dt>Go-to-market</dt><dd>{company.gtm || "Non documenté"}</dd></div>
        <div><dt>Technologie IA</dt><dd>{company.aiTech?.join(" · ") || "Non documentée"}</dd></div>
        <div><dt>Déploiement</dt><dd>{company.deployment || "Non documenté"}</dd></div>
        <div><dt>Moats observés</dt><dd><div className="tag-list">{company.differentiators.map((item) => <span key={item}>{item}</span>)}</div></dd></div>
        <div><dt>Financement</dt><dd>{formatFunding(company.fundingUsdM, company.fundingDisplay)} · {company.latestRound || "round inconnu"}<small>Daté {company.fundingAsOf || "non précisé"}</small></dd></div>
        <div><dt>Équipe</dt><dd>{company.headcount || "Inconnue"}<small>Daté {company.headcountAsOf || "non précisé"}</small></dd></div>
        <div><dt>Investisseurs</dt><dd>{company.investors?.join(" · ") || "Non documentés"}</dd></div>
        <div><dt>Traction publique</dt><dd>{company.traction || "Non documentée"}</dd></div>
        <div><dt>Lecture critique</dt><dd>{company.notes || "Aucune note"}</dd></div>
      </dl>
      <div className="confidence-row"><span>Confiance de la fiche</span><strong className={`confidence ${company.confidence.toLowerCase()}`}>{company.confidence}</strong></div>
      <SourceLinks sources={company.sources} />
      <PersonalNotesEditor value={note} onChange={onNoteChange} />
    </aside>
  );
}

function TrendSection() {
  const [category, setCategory] = useState("Toutes");
  const categories = ["Toutes", ...new Set(trends.map((trend) => trendMacroCategory(trend.category)))];
  const visible = category === "Toutes" ? trends : trends.filter((trend) => trendMacroCategory(trend.category) === category);
  return (
    <section className="section alternate" id="tendances">
      <div className="section-heading">
        <div><span className="section-number">03</span><span className="eyebrow">Market signals</span><h2>Les tendances qui déplacent la valeur</h2></div>
        <p>Une tendance n’est pas une idée. Nous cherchons le mécanisme économique, le risque de commoditisation et l’endroit où un moat peut réellement se former.</p>
      </div>
      <div className="chip-row" aria-label="Filtrer les tendances">{categories.map((item) => <button className={category === item ? "active" : ""} key={item} onClick={() => setCategory(item)}>{item}</button>)}</div>
      <div className="trend-grid">
        {visible.map((trend, index) => (
          <article className="trend-card" key={trend.id}>
            <div className="trend-card-top"><span>{String(index + 1).padStart(2, "0")}</span><span className={`fit fit-${trend.founderFit}`}>fit {trend.founderFit}</span></div>
            <span className="eyebrow">{trend.category} · {trend.horizon}</span>
            <h3>{trend.title}</h3>
            <p className="trend-signal">{trend.signal}</p>
            <dl><div><dt>Pourquoi maintenant</dt><dd>{trend.whyNow}</dd></div><div><dt>Où capter la valeur</dt><dd>{trend.valueCapture}</dd></div><div><dt>Risque principal</dt><dd>{trend.risk}</dd></div></dl>
            <SourceLinks sources={trend.sources} compact />
          </article>
        ))}
      </div>
    </section>
  );
}

function IdeaSection() {
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState("Tous");
  const [verdict, setVerdict] = useState<"Tous" | IdeaVerdict>("Tous");
  const [sort, setSort] = useState<"score" | "tech" | "business" | "distribution">("score");
  const [open, setOpen] = useState<string | null>(ideas[0]?.id ?? null);
  const [dualMoatOnly, setDualMoatOnly] = useState(false);
  const themes = ["Tous", ...new Set(ideas.map((idea) => idea.theme))];
  const verdicts: ("Tous" | IdeaVerdict)[] = ["Tous", "EXPLORE", "WEDGE", "RESEARCH", "PARK", "KILL"];
  const visible = useMemo(() => ideas.filter((idea) => {
    const needle = query.toLowerCase().trim();
    const haystack = [idea.name, idea.pitch, idea.buyer, idea.theme, idea.technicalMoat, idea.businessIntegration].join(" ").toLowerCase();
    return (!needle || haystack.includes(needle)) && (theme === "Tous" || idea.theme === theme) && (verdict === "Tous" || idea.verdict === verdict) && (!dualMoatOnly || (idea.technicalDifferentiation >= 70 && idea.businessIntegrationScore >= 80));
  }).sort((a, b) => {
    const value = (idea: Idea) => sort === "score" ? averageIdeaScore(idea) : sort === "tech" ? idea.technicalDifferentiation : sort === "business" ? idea.businessIntegrationScore : idea.distribution;
    return value(b) - value(a);
  }), [query, theme, verdict, sort, dualMoatOnly]);

  return (
    <section className="section" id="idees">
      <div className="section-heading">
        <div><span className="section-number">05</span><span className="eyebrow">Thesis backlog</span><h2>La banque d’idées à falsifier</h2></div>
        <p>Reprise des explorations existantes, y compris les pistes faibles. Les scores sont des heuristiques de comparaison, jamais une preuve de marché.</p>
      </div>
      <div className="idea-matrix-note"><strong>Le quadrant recherché</strong><span>différenciation technique forte</span><b>×</b><span>intégration métier forte</span><b>×</b><span>distribution plausible</span><button className={dualMoatOnly ? "active" : ""} onClick={() => setDualMoatOnly(!dualMoatOnly)}>{dualMoatOnly ? "Voir toutes" : "Filtrer tech ≥70 & métier ≥80"}</button></div>
      <div className="idea-controls">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une idée, un buyer, un moat…" />
        <select value={theme} onChange={(event) => setTheme(event.target.value)}>{themes.map((item) => <option key={item}>{item}</option>)}</select>
        <div className="chip-row compact">{verdicts.map((item) => <button className={verdict === item ? "active" : ""} key={item} onClick={() => setVerdict(item)}>{item}</button>)}</div>
        <label>Trier <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}><option value="score">Score composite</option><option value="tech">Différenciation technique</option><option value="business">Intégration métier</option><option value="distribution">Distribution</option></select></label>
      </div>
      <div className="idea-list">
        {visible.map((idea, index) => {
          const score = averageIdeaScore(idea);
          const isOpen = open === idea.id;
          return (
            <article className={`idea-row ${isOpen ? "open" : ""}`} key={idea.id}>
              <button className="idea-summary" onClick={() => setOpen(isOpen ? null : idea.id)} aria-expanded={isOpen}>
                <span className="idea-rank">{String(index + 1).padStart(2, "0")}</span>
                <span className="idea-main"><small>{idea.theme} · {idea.origin}</small><strong>{idea.name}</strong><span>{idea.pitch}</span></span>
                <span className="idea-score"><strong>{score}</strong><small>/100</small></span>
                <span className={`verdict verdict-${idea.verdict.toLowerCase()}`}>{idea.verdict}</span>
                <span className="expand-icon">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && (
                <div className="idea-detail">
                  <div className="idea-scoreboard"><ScorePill value={idea.founderFit} label="fit" /><ScorePill value={idea.technicalDifferentiation} label="tech" /><ScorePill value={idea.businessIntegrationScore} label="métier" /><ScorePill value={idea.scalePotential} label="scale" /><ScorePill value={idea.distribution} label="distribution" /></div>
                  <div className="idea-detail-grid">
                    <div><h4>Buyer</h4><p>{idea.buyer}</p></div><div><h4>Wedge</h4><p>{idea.wedge}</p></div>
                    <div><h4>Mécanisme AI-native</h4><p>{idea.aiNative}</p></div><div><h4>Moat technique</h4><p>{idea.technicalMoat}</p></div>
                    <div><h4>Intégration métier</h4><p>{idea.businessIntegration}</p></div><div><h4>Compétence manquante</h4><p>{idea.missingCapability}</p></div>
                    <div className="risk-block"><h4>Risque dominant</h4><p>{idea.keyRisk}</p></div><div className="kill-block"><h4>Kill criterion</h4><p>{idea.killCriterion}</p></div>
                  </div>
                  <div className="idea-foot"><span>Confiance : <strong>{idea.confidence}</strong></span><SourceLinks sources={idea.sources} compact /></div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function MethodSection() {
  return (
    <section className="section methodology" id="methode">
      <div className="section-heading">
        <div><span className="section-number">06</span><span className="eyebrow">Evidence discipline</span><h2>Comment lire et faire évoluer l’atlas</h2></div>
        <p>Le but n’est pas d’accumuler des logos. Le but est de distinguer faits, jugements et inconnues, puis de mettre à jour les thèses quand le marché change.</p>
      </div>
      <div className="method-grid">
        <article><span>F</span><h3>Faits</h3><p>Chaque fiche associe des sources datées; elles ne corroborent pas nécessairement chaque champ ni les claims auto-déclarés. Une valeur absente reste inconnue.</p></article>
        <article><span>I</span><h3>Inférences</h3><p>Moat, profondeur technique, intégration métier et GTM sont des lectures analytiques comparables, pas des déclarations de l’entreprise.</p></article>
        <article><span>K</span><h3>Kill criteria</h3><p>Une idée reste une hypothèse jusqu’à un signal de buyer, un accès aux données et une différenciation mesurée face aux alternatives.</p></article>
        <article><span>Δ</span><h3>Mises à jour</h3><p>Funding et headcount vieillissent vite. Chaque révision passe par les JSON sourcés puis le merge contrôlé; le CSV sert à annoter et partager une sélection.</p></article>
      </div>
      <div className="method-bottom">
        <div><h3>Barème des moats</h3><ol><li>Feature copiable ou wrapper</li><li>Intégration utile mais faible lock-in</li><li>Data/workflow ou techno différenciée</li><li>Flywheel, infra complexe ou distribution forte</li><li>Avantage cumulatif rare et prouvé</li></ol></div>
        <div><h3>Règles de prudence</h3><ul><li>Sources primaires privilégiées; presse/investment databases en corroboration.</li><li>Aucun TAM inventé; aucun montant additionné sans préciser le périmètre.</li><li>Aucune donnée, benchmark, roadmap ou relation confidentielle NVIDIA.</li><li>Toute idée adjacente à l’emploi exige une revue conflit d’intérêts/IP indépendante.</li></ul></div>
        <div className="known-gaps"><span className="eyebrow">Known gaps</span><h3>Ce que cette version ne sait pas encore</h3><p>Certaines fiches reposent uniquement sur des domaines de l’entreprise : une annonce est sourcée, pas auditée. ARR, churn, qualité produit et economics des pilotes exigent désormais des entretiens buyers et anciens clients.</p></div>
      </div>
    </section>
  );
}

function CapitalSection() {
  return (
    <section className="section capital-section" id="capital">
      <div className="section-heading">
        <div><span className="section-number">04</span><span className="eyebrow">Funding ecosystem</span><h2>Ce qui lève — et ce que les chiffres cachent</h2></div>
        <p>Le capital IA est abondant en agrégé et extrêmement concentré. La bonne lecture n’est pas « quel secteur lève ? », mais « quelle preuve réduit un risque que les investisseurs ne peuvent pas underwriting seuls ? »</p>
      </div>
      <div className="capital-warning"><strong>Lecture critique</strong><p>En 2025, le deal médian IA était de $5M alors que 73 % de la valeur allait aux tours supérieurs à $100M. Une poignée de model labs et d’acteurs compute déforme donc fortement la perception de facilité.</p><a href="https://www.oecd.org/en/publications/venture-capital-investments-in-artificial-intelligence-through-2025_a13752f5-en/full-report.html" target="_blank" rel="noreferrer">Voir la méthodologie OCDE ↗</a></div>
      <div className="capital-facts">
        {capitalFacts.map((fact) => <article key={fact.metric + fact.label}><strong>{fact.metric}</strong><h3>{fact.label}</h3><p>{fact.context}</p><a href={fact.source.url} target="_blank" rel="noreferrer">{fact.source.label} ↗</a></article>)}
      </div>
      <div className="capital-subhead"><div><span className="eyebrow">Funding archetypes</span><h3>La preuve attendue change selon la catégorie</h3></div><p>Cette grille est une inférence de travail issue de la cartographie — à valider par entretiens investisseurs et fondateurs.</p></div>
      <div className="archetype-table-wrap">
        <table className="archetype-table"><thead><tr><th>Archétype</th><th>Ce qui obtient du capital</th><th>Preuve avant le round</th><th>Moat durable plausible</th><th>Failure mode fréquent</th></tr></thead><tbody>{fundingArchetypes.map((item) => <tr key={item.name}><td><strong>{item.name}</strong><span>{item.examples}</span></td><td>{item.whatGetsFunded}</td><td>{item.evidenceBeforeRound}</td><td>{item.durableMoat}</td><td>{item.commonFailure}</td></tr>)}</tbody></table>
      </div>
      {capitalNodes.length > 0 && <div className="capital-nodes"><div className="capital-subhead"><div><span className="eyebrow">Capital map</span><h3>Investisseurs et accélérateurs à comprendre</h3></div></div><div className="node-grid">{capitalNodes.map((node) => <article key={node.name}><span>{node.kind} · {node.geography}</span><h4>{node.name}</h4><p><strong>{node.focus}</strong><br />{node.relevance}</p><small>{node.stage}</small><a href={node.source.url} target="_blank" rel="noreferrer">{node.source.label} ↗</a></article>)}</div></div>}
    </section>
  );
}

export default function Home() {
  const workspace = useCompanyWorkspace(baseCompanies);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const editingRecord = workspace.records.find((record) => record.recordId === editingRecordId) ?? null;

  const startEditing = (recordId: string) => {
    setEditingRecordId(recordId);
    window.requestAnimationFrame(() => document.getElementById("editeur")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <main>
      <Header />
      <Hero companies={workspace.records} />
      <CompanyExplorer
        companies={workspace.records}
        personalNotes={workspace.personalNotes}
        onNoteChange={workspace.setPersonalNote}
        onEdit={startEditing}
      />
      <CompanyEditorSection
        key={editingRecord?.recordId ?? "new-company"}
        records={workspace.records}
        editingRecord={editingRecord}
        overrideIds={workspace.overrideIds}
        addedCount={workspace.addedCount}
        notesCount={workspace.notesCount}
        hydrated={workspace.hydrated}
        onAdd={workspace.addCompany}
        onSave={workspace.saveCompany}
        onCancelEdit={() => setEditingRecordId(null)}
        onEdit={startEditing}
        onRevert={workspace.revertCompany}
        onRemove={(recordId) => {
          workspace.removeAddedCompany(recordId);
          if (editingRecordId === recordId) setEditingRecordId(null);
        }}
        onExport={workspace.exportWorkspace}
        onImport={workspace.importWorkspace}
        onReset={() => {
          workspace.resetWorkspace();
          setEditingRecordId(null);
        }}
      />
      <TrendSection />
      <CapitalSection />
      <IdeaSection />
      <MethodSection />
      <footer><div className="brand"><span className="brand-mark">A</span><span><strong>AI Venture Atlas</strong><small>Samuel & collaborators</small></span></div><p>Workspace de recherche partagé · sources publiques uniquement · {AS_OF}</p><a href="#top">Retour en haut ↑</a></footer>
    </main>
  );
}
