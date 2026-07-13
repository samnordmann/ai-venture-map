import { readFile, writeFile } from "node:fs/promises";

const companies = JSON.parse(await readFile(new URL("../app/data/companies.json", import.meta.url), "utf8"));
const asOf = "2026-07-13";

const group = (field) => [...companies.reduce((map, company) => {
  const key = company[field] || "Unknown";
  map.set(key, (map.get(key) ?? 0) + 1);
  return map;
}, new Map())].sort((a, b) => b[1] - a[1]);

const table = (rows, firstLabel) => [
  `| ${firstLabel} | Entreprises | Part |`,
  "|---|---:|---:|",
  ...rows.map(([label, count]) => `| ${label} | ${count} | ${Math.round((count / companies.length) * 100)} % |`),
].join("\n");

const sourceCount = companies.reduce((sum, company) => sum + company.sources.length, 0);
const fundingKnown = companies.filter((company) => company.fundingUsdM !== null).length;
const headcountKnown = companies.filter((company) => company.headcount && company.headcount !== "Unknown").length;
const highConfidence = companies.filter((company) => company.confidence === "High").length;
const differentiators = [...companies.reduce((map, company) => {
  for (const item of company.differentiators) map.set(item, (map.get(item) ?? 0) + 1);
  return map;
}, new Map())].sort((a, b) => b[1] - a[1]);

const groupedCompanies = [...companies.reduce((map, company) => {
  if (!map.has(company.sector)) map.set(company.sector, []);
  map.get(company.sector).push(company);
  return map;
}, new Map())].sort((a, b) => a[0].localeCompare(b[0]));

const lines = [
  "# AI Venture Atlas — rapport de couverture et source pack",
  "",
  `Généré le ${asOf}. Sources publiques uniquement.`,
  "",
  "## Résumé",
  "",
  `- **${companies.length}** entreprises après déduplication ;`,
  `- **${sourceCount}** liens attachés aux fiches ;`,
  `- financement public exploitable pour **${fundingKnown}/${companies.length}** entreprises ;`,
  `- taille d’équipe publiquement renseignée pour **${headcountKnown}/${companies.length}** entreprises ;`,
  `- **${highConfidence}** fiches à confiance haute ;`,
  "- les scores de moat, profondeur technique et intégration métier sont des jugements analytiques, pas des faits déclarés.",
  "",
  "## Couverture par secteur",
  "",
  table(group("sector"), "Secteur"),
  "",
  "## Couverture par couche",
  "",
  table(group("layer"), "Couche"),
  "",
  "## Couverture par stade",
  "",
  table(group("stage"), "Stade"),
  "",
  "## Statut courant",
  "",
  table(group("status"), "Statut"),
  "",
  "## Différenciateurs observés",
  "",
  table(differentiators, "Différenciateur"),
  "",
  "## Limites",
  "",
  "- Les montants equity, dette, secondaire, valorisation et engagements cloud ne sont pas additionnés entre entreprises.",
  "- Les headcounts sont des plages publiques et vieillissent rapidement.",
  "- Les métriques de traction sont souvent déclaratives; les notes le signalent.",
  "- 79 fiches reposent uniquement sur le domaine de l’entreprise; l’annonce est traçable mais non corroborée indépendamment.",
  "- ARR, churn, gross margin, profondeur contractuelle et qualité produit sont rarement publics.",
  "- Ce corpus est une sélection de sociétés financées/high-signal, pas la totalité mathématique des entreprises IA mondiales.",
  "",
  "## Répertoire sourcé",
  "",
];

for (const [sector, rows] of groupedCompanies) {
  lines.push(`### ${sector}`, "");
  for (const company of rows.sort((a, b) => a.name.localeCompare(b.name))) {
    const sources = company.sources.map((source) => `[${source.label}](${source.url})`).join(" · ");
    lines.push(`- **[${company.name}](${company.website})** — ${company.product}  `);
    lines.push(`  ${company.hq || "HQ inconnu"} · ${company.status} · ${company.stage} · ${company.fundingDisplay || "financement non public"} · confiance ${company.confidence}.  `);
    lines.push(`  Sources : ${sources}`);
  }
  lines.push("");
}

await writeFile(new URL("../research/REPORT.md", import.meta.url), `${lines.join("\n")}\n`);
console.log(`Wrote research/REPORT.md for ${companies.length} companies and ${sourceCount} sources.`);
