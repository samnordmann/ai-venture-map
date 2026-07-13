import researchedTrends from "../../research/incoming/15-trends-taxonomy.json";
import type { Trend } from "./types";

// Veille macro sourcée au 13 juillet 2026. Les champs signal/whyNow/valueCapture
// distinguent explicitement faits publics, inférences de marché et risques.
export const trends = researchedTrends satisfies Trend[];
