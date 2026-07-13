import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const incoming = path.join(root, "research", "incoming");
const output = path.join(root, "app", "data", "companies.json");

const files = (await readdir(incoming))
  .filter((file) => file.endsWith(".json") && /^\d{2}[a-z]?-/.test(file))
  .sort();

const normalize = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, "");
const isCompanyArray = (value) => Array.isArray(value) && value.every((item) => item && typeof item.name === "string" && typeof item.website === "string");
const uniqueStrings = (values) => [...new Set(values.filter(Boolean))];
const uniqueSources = (values) => [...new Map(values.filter((source) => source?.url).map((source) => [source.url, source])).values()];
const missing = (value) => value === null || value === undefined || value === "" || value === "Unknown" || (Array.isArray(value) && value.length === 0);
const differentiatorMap = new Map([
  ["Research/IP", ["Research"]],
  ["Infrastructure/scale", ["Infrastructure"]],
  ["Brand/community", ["Distribution"]],
  ["Hardware/manufacturing", ["Hardware"]],
  ["Open-source ecosystem", ["Distribution", "Network effects"]],
  ["Regulatory/data moat", ["Regulatory", "Proprietary data"]],
  ["Switching costs", ["Workflow integration"]],
  ["Vertical integration", ["Workflow integration"]],
]);
const allowedDifferentiators = new Set(["Research", "Technical", "Infrastructure", "Hardware", "Proprietary data", "Workflow integration", "Distribution", "Regulatory", "Network effects"]);
const allowedStages = new Set(["Seed", "Series A", "Series B", "Growth", "Public", "Bootstrapped", "Unknown"]);
const allowedLayers = new Set(["Foundation model", "Infrastructure", "Developer tool", "Horizontal application", "Vertical application", "Hardware", "AI-native service"]);
const allowedConfidence = new Set(["High", "Medium", "Low"]);
const canonicalSectors = new Set([
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
]);
const statusOverrides = new Map([
  ["Celestial AI", "Acquise"],
  ["Galileo", "Acquise"],
  ["Gretel", "Acquise"],
  ["Lakera", "Acquise"],
  ["xAI", "Acquise"],
  ["Cursor", "Acquisition annoncée"],
  ["Daedalean", "Acquisition annoncée"],
  ["Gladia", "Acquisition annoncée"],
  ["MaintainX", "Acquisition annoncée"],
  ["Modular", "Acquisition annoncée"],
  ["PathAI", "Acquisition annoncée"],
  ["Enfabrica", "Transaction stratégique"],
  ["Scale AI", "Transaction stratégique"],
]);
const sectorMap = new Map([
  ["AI research", "Foundation models & research"],
  ["Horizontal AI", "Foundation models & research"],
  ["Foundation Models & Research", "Foundation models & research"],
  ["Generative media", "Foundation models & research"],
  ["Spatial AI", "Foundation models & research"],
  ["Edge AI", "Foundation models & research"],
  ["Enterprise AI", "Foundation models & research"],
  ["AI infrastructure", "AI infrastructure & compute"],
  ["AI security", "AI infrastructure & compute"],
  ["Data infrastructure for AI", "Data infrastructure"],
  ["Data & AI Infrastructure", "Data infrastructure"],
  ["AI developer tools", "Developer tools & agents"],
  ["Developer Tools", "Developer tools & agents"],
  ["Agent infrastructure", "Developer tools & agents"],
  ["Horizontal enterprise AI", "Horizontal enterprise software"],
  ["Horizontal Enterprise", "Horizontal enterprise software"],
  ["Enterprise Software", "Horizontal enterprise software"],
  ["Healthcare", "Healthcare & life sciences"],
  ["Healthcare & Life Sciences", "Healthcare & life sciences"],
  ["Industrial & Life Sciences", "Healthcare & life sciences"],
  ["Finance", "Financial services & insurance"],
  ["Finance & Risk", "Financial services & insurance"],
  ["Financial Services", "Financial services & insurance"],
  ["Insurance", "Financial services & insurance"],
  ["Legal", "Legal, compliance & tax"],
  ["Compliance", "Legal, compliance & tax"],
  ["Tax", "Legal, compliance & tax"],
  ["Industrial AI and robotics", "Industrial AI, robotics & supply chain"],
  ["Industrial & Robotics", "Industrial AI, robotics & supply chain"],
  ["Industrial Robotics", "Industrial AI, robotics & supply chain"],
  ["Industrial & Supply Chain", "Industrial AI, robotics & supply chain"],
  ["Defense & Space", "Defense, space & autonomy"],
  ["Aerospace & Autonomy", "Defense, space & autonomy"],
  ["Climate, Energy & Geospatial", "Climate, energy & geospatial"],
  ["AI chips and hardware", "Semiconductors, hardware & edge"],
  ["Semiconductors & Compute", "Semiconductors, hardware & edge"],
  ["Semiconductors & Sensors", "Semiconductors, hardware & edge"],
  ["Industrial & Materials", "Scientific AI & materials"],
  ["Climate & Industrial Chemistry", "Scientific AI & materials"],
  ["Creative & Commerce", "Media, voice & commerce"],
  ["Creative & Enterprise Software", "Media, voice & commerce"],
  ["Voice AI", "Media, voice & commerce"],
  ["Retail", "Media, voice & commerce"],
]);
const requiredFields = ["name", "website", "status", "hq", "founded", "stage", "sector", "subsector", "layer", "product", "targetCustomer", "buyer", "gtm", "aiTech", "deployment", "differentiators", "moatStrength", "technicalDepth", "verticalIntegration", "fundingUsdM", "fundingDisplay", "fundingAsOf", "latestRound", "headcount", "headcountAsOf", "investors", "traction", "confidence", "notes", "sources"];
const requiredDisplayStrings = ["name", "website", "status", "hq", "stage", "sector", "subsector", "layer", "product", "targetCustomer", "buyer", "gtm", "deployment", "fundingDisplay", "fundingAsOf", "latestRound", "traction", "confidence", "notes"];
const normalizeDifferentiators = (values) => uniqueStrings(values.flatMap((value) => differentiatorMap.get(value) ?? [value]));

function canonicalSector(company) {
  if (company.sector === "AI Infrastructure") {
    if (company.layer === "Foundation model") return "Foundation models & research";
    if (company.layer === "Developer tool") return "Developer tools & agents";
    if (/training.data|label|synthetic data/i.test(company.subsector ?? "")) return "Data infrastructure";
    return "AI infrastructure & compute";
  }
  return sectorMap.get(company.sector) ?? company.sector;
}

function currentStatus(company) {
  return statusOverrides.get(company.name) ?? (company.stage === "Public" ? "Cotée" : "Privée indépendante");
}

function mergeCompany(current, candidate) {
  const currentSourceCount = current.sources?.length ?? 0;
  const candidateSourceCount = candidate.sources?.length ?? 0;
  const primary = candidateSourceCount > currentSourceCount ? candidate : current;
  const secondary = primary === current ? candidate : current;
  const merged = { ...primary };
  for (const [key, value] of Object.entries(secondary)) {
    if (missing(merged[key]) && !missing(value)) merged[key] = value;
  }
  merged.aiTech = uniqueStrings([...(current.aiTech ?? []), ...(candidate.aiTech ?? [])]);
  merged.differentiators = normalizeDifferentiators([...(current.differentiators ?? []), ...(candidate.differentiators ?? [])]);
  merged.investors = uniqueStrings([...(current.investors ?? []), ...(candidate.investors ?? [])]);
  merged.sources = uniqueSources([...(current.sources ?? []), ...(candidate.sources ?? [])]);
  return merged;
}

const byName = new Map();
const usedFiles = [];
const ignoredFiles = [];
let recordsBeforeDeduplication = 0;
const duplicateNames = [];

for (const file of files) {
  const parsed = JSON.parse(await readFile(path.join(incoming, file), "utf8"));
  if (!isCompanyArray(parsed)) {
    ignoredFiles.push(file);
    continue;
  }
  usedFiles.push(file);
  recordsBeforeDeduplication += parsed.length;
  for (const company of parsed) {
    const key = normalize(company.name);
    if (byName.has(key)) duplicateNames.push(company.name);
    byName.set(key, byName.has(key) ? mergeCompany(byName.get(key), company) : company);
  }
}

const companies = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
const errors = [];
for (const company of companies) {
  company.differentiators = normalizeDifferentiators(company.differentiators ?? []);
  company.sector = canonicalSector(company);
  company.status = currentStatus(company);
  company.hq = company.hq
    ?.replace(/\bUSA\b/g, "United States")
    .replace(/\bUK\b/g, "United Kingdom")
    .replace(/\bCzech Republic\b/g, "Czechia");
  if (missing(company.hq)) company.hq = "Non publié";
  if (missing(company.fundingDisplay)) company.fundingDisplay = "Non publié";
  if (missing(company.fundingAsOf)) company.fundingAsOf = "Non publié";
  if (!company.name || !company.website) errors.push(`${company.name || "<unnamed>"}: missing name/website`);
  for (const field of requiredFields) if (!(field in company)) errors.push(`${company.name}: missing required field ${field}`);
  for (const field of requiredDisplayStrings) if (typeof company[field] !== "string" || !company[field].trim()) errors.push(`${company.name}: invalid display string ${field}`);
  if (!allowedStages.has(company.stage)) errors.push(`${company.name}: invalid stage enum`);
  if (!allowedLayers.has(company.layer)) errors.push(`${company.name}: invalid layer enum`);
  if (!allowedConfidence.has(company.confidence)) errors.push(`${company.name}: invalid confidence enum`);
  if (!canonicalSectors.has(company.sector)) errors.push(`${company.name}: non-canonical sector ${company.sector}`);
  for (const score of ["moatStrength", "technicalDepth", "verticalIntegration"]) {
    if (!Number.isInteger(company[score]) || company[score] < 1 || company[score] > 5) errors.push(`${company.name}: invalid ${score}`);
  }
  if (!Array.isArray(company.sources) || company.sources.length < 2) errors.push(`${company.name}: fewer than two sources`);
  if (company.sources?.some((source) => !/^https?:\/\//.test(source.url))) errors.push(`${company.name}: invalid source URL`);
  if (company.differentiators.some((value) => !allowedDifferentiators.has(value))) errors.push(`${company.name}: invalid differentiator enum`);
}

await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(companies, null, 2)}\n`);
const report = {
  generatedAt: new Date().toISOString(),
  usedFiles,
  ignoredFiles,
  recordsBeforeDeduplication,
  uniqueCompanies: companies.length,
  duplicateNames: uniqueStrings(duplicateNames).sort(),
  errors,
};
await writeFile(path.join(root, "research", "merge-report.json"), `${JSON.stringify(report, null, 2)}\n`);

console.log(`Merged ${companies.length} companies from ${usedFiles.length} files.`);
if (ignoredFiles.length) console.log(`Ignored non-company datasets: ${ignoredFiles.join(", ")}`);
if (errors.length) {
  console.error(`${errors.length} validation issue(s):`);
  for (const error of errors.slice(0, 50)) console.error(`- ${error}`);
  process.exitCode = 1;
}
