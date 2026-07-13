import researchedTrends from "../../research/incoming/15-trends-taxonomy.json";
import type { Trend } from "./types";

// Veille macro sourcée au 13 juillet 2026. Les champs signal/whyNow/valueCapture
// distinguent explicitement faits publics, inférences de marché et risques.
// JSON imports widen string literals; the researched source is validated by the
// research pipeline before this typed application boundary.
export const trends = researchedTrends as Trend[];
