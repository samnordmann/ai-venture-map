export type Source = {
  label: string;
  url: string;
  type: string;
};

export type Company = {
  name: string;
  website: string;
  status: "Privée indépendante" | "Cotée" | "Acquise" | "Acquisition annoncée" | "Transaction stratégique";
  hq: string;
  founded: number | null;
  stage: string;
  sector: string;
  subsector: string;
  layer: string;
  product: string;
  targetCustomer: string;
  buyer: string;
  gtm: string;
  aiTech: string[];
  deployment: string;
  differentiators: string[];
  moatStrength: number;
  technicalDepth: number;
  verticalIntegration: number;
  fundingUsdM: number | null;
  fundingDisplay: string;
  fundingAsOf: string;
  latestRound: string;
  headcount: string | null;
  headcountAsOf: string | null;
  investors: string[];
  traction: string;
  confidence: "High" | "Medium" | "Low";
  notes: string;
  sources: Source[];
};

export type IdeaVerdict = "EXPLORE" | "PARK" | "KILL" | "WEDGE" | "RESEARCH";

export type Idea = {
  id: string;
  name: string;
  theme: string;
  pitch: string;
  buyer: string;
  wedge: string;
  aiNative: string;
  technicalMoat: string;
  businessIntegration: string;
  missingCapability: string;
  founderFit: number;
  technicalDifferentiation: number;
  businessIntegrationScore: number;
  scalePotential: number;
  distribution: number;
  verdict: IdeaVerdict;
  confidence: "haute" | "moyenne" | "moyenne-faible" | "faible";
  keyRisk: string;
  killCriterion: string;
  origin: string;
  sources: Source[];
};

export type Trend = {
  id: string;
  title: string;
  category: string;
  horizon: string;
  signal: string;
  whyNow: string;
  valueCapture: string;
  risk: string;
  founderFit: "fort" | "moyen" | "faible";
  confidence: "haute" | "moyenne" | "faible";
  sources: Source[];
};

export type CapitalFact = {
  metric: string;
  label: string;
  context: string;
  source: Source;
};

export type FundingArchetype = {
  name: string;
  examples: string;
  whatGetsFunded: string;
  evidenceBeforeRound: string;
  durableMoat: string;
  commonFailure: string;
};

export type CapitalNode = {
  name: string;
  kind: string;
  geography: string;
  stage: string;
  focus: string;
  relevance: string;
  source: Source;
};
