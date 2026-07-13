import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the AI Venture Atlas", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>AI Venture Atlas/);
  assert.match(html, /Cartographier l’écosystème/);
  assert.match(html, /La cartographie des entreprises IA/);
  assert.match(html, /Les tendances qui déplacent la valeur/);
  assert.match(html, /Ce qui lève/);
  assert.match(html, /La banque d’idées à falsifier/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("research dataset has the required evidence fields", async () => {
  const companies = JSON.parse(await readFile(new URL("../app/data/companies.json", import.meta.url), "utf8"));
  const canonicalSectors = new Set([
    "Foundation models & research", "AI infrastructure & compute", "Data infrastructure", "Developer tools & agents",
    "Horizontal enterprise software", "Healthcare & life sciences", "Financial services & insurance", "Legal, compliance & tax",
    "Industrial AI, robotics & supply chain", "Defense, space & autonomy", "Climate, energy & geospatial",
    "Semiconductors, hardware & edge", "Scientific AI & materials", "Media, voice & commerce",
  ]);
  const statuses = new Set(["Privée indépendante", "Cotée", "Acquise", "Acquisition annoncée", "Transaction stratégique"]);
  assert.ok(companies.length >= 250, `expected at least 250 companies, received ${companies.length}`);
  for (const company of companies) {
    assert.ok(company.name);
    assert.match(company.website, /^https?:\/\//);
    assert.equal(typeof company.hq, "string", `${company.name}: hq must be display-safe`);
    assert.ok(canonicalSectors.has(company.sector), `${company.name}: canonical sector`);
    assert.ok(statuses.has(company.status), `${company.name}: normalized status`);
    assert.ok(Array.isArray(company.sources) && company.sources.length >= 2, `${company.name}: source coverage`);
    assert.ok(company.technicalDepth >= 1 && company.technicalDepth <= 5, `${company.name}: technicalDepth`);
    assert.ok(company.verticalIntegration >= 1 && company.verticalIntegration <= 5, `${company.name}: verticalIntegration`);
  }
});

test("market synthesis datasets retain evidence coverage", async () => {
  const trends = JSON.parse(await readFile(new URL("../research/incoming/15-trends-taxonomy.json", import.meta.url), "utf8"));
  const capital = JSON.parse(await readFile(new URL("../research/incoming/14-capital-ecosystem.json", import.meta.url), "utf8"));
  const ideasSource = await readFile(new URL("../app/data/ideas.ts", import.meta.url), "utf8");
  assert.equal(trends.length, 15);
  assert.ok(trends.every((trend) => trend.sources.length >= 2));
  assert.equal(capital.facts.length, 7);
  assert.equal(capital.nodes.length, 19);
  assert.equal((ideasSource.match(/^\s+id: "/gm) ?? []).length, 30);
});
