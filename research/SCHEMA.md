# AI company research schema

Each research mission writes a JSON array to `research/incoming/XX-topic.json`.

Required object shape:

```json
{
  "name": "Company name",
  "website": "https://...",
  "hq": "City, Country",
  "founded": 2023,
  "stage": "Seed | Series A | Series B | Growth | Public | Bootstrapped | Unknown",
  "sector": "Healthcare",
  "subsector": "Radiology workflow",
  "layer": "Foundation model | Infrastructure | Developer tool | Horizontal application | Vertical application | Hardware | AI-native service",
  "product": "One-sentence factual description",
  "targetCustomer": "Primary customer segment",
  "buyer": "Economic buyer when known",
  "gtm": "Enterprise sales | PLG/open source | API usage | Channel/OEM | Consumer | Marketplace | Hybrid | Unknown",
  "aiTech": ["LLM", "Computer vision"],
  "deployment": "Cloud | On-premise | Edge | Hybrid | Hardware",
  "differentiators": ["Research", "Technical", "Infrastructure", "Hardware", "Proprietary data", "Workflow integration", "Distribution", "Regulatory", "Network effects"],
  "moatStrength": 3,
  "technicalDepth": 4,
  "verticalIntegration": 5,
  "fundingUsdM": 42,
  "fundingDisplay": "$42M",
  "fundingAsOf": "2026-07-13",
  "latestRound": "Series B, 2025",
  "headcount": "51-200",
  "headcountAsOf": "2026-07-13",
  "investors": ["Investor"],
  "traction": "A short, sourced public signal; omit hype",
  "confidence": "High | Medium | Low",
  "notes": "Critical, concise observation including unknowns",
  "sources": [
    {"label": "Company", "url": "https://...", "type": "primary"},
    {"label": "Funding announcement", "url": "https://...", "type": "primary|credible-secondary"}
  ]
}
```

Rules:

- Current web research is mandatory. Use primary sources first and credible secondary sources only where needed for financing/headcount.
- Never invent funding, headcount, customers, valuation, or technology. Use `null`, `Unknown`, or omit uncertain claims.
- Funding is total publicly announced equity/debt only when the source explains it; note ambiguity.
- Headcount should be a public range, not false precision.
- Scores are analytical judgments: 1 low, 5 high. Explain unusual scores in `notes`.
- Include 12-20 high-signal companies per sector mission, balancing leaders and promising funded startups.
- Deduplicate by normalized company name and website domain.
- No NVIDIA confidential information, contacts, benchmarks, or roadmaps.

Le merge ajoute un `status` normalisé (`Privée indépendante`, `Cotée`, `Acquise`, `Acquisition annoncée` ou `Transaction stratégique`) à partir des sources et notes datées. Il normalise aussi `sector` vers les 14 macro-secteurs de l’atlas; le libellé plus fin reste dans `subsector`.
