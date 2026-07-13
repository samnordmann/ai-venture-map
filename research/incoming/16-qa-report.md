# QA finale — AI Venture Atlas

Date de contrôle : 2026-07-13  
Périmètre : `research/incoming/01-*` à `15-*`, données et rendu du site. Sources publiques uniquement.

## Verdict

**PASS avec réserves P1.** Aucun P0 : le site build, les tests passent, le schéma final est valide et les totaux affichés sont cohérents. Les réserves portent sur la comparabilité du financement, l'indépendance des preuves et une transaction manquante dans le statut de Daedalean.

## Couverture finale

- 261 entrées brutes, **254 sociétés uniques** après 7 doublons nom+domaine : Arize AI, Basis, Groq, Numeric, Phaidra, Poolside et Rillet.
- Aucun doublon de nom ou domaine restant dans `app/data/companies.json`.
- **14 macro-secteurs**, 7 layers, 254/254 fiches avec au moins 2 sources.
- 888 références attachées aux sociétés après application des correctifs : 701 `primary`, 6 `regulatory-filing`, 2 `regulatory`, 179 `credible-secondary`; ratio primaire/réglementaire **79,8 %**.
- Funding numérique : **165/254 (65,0 %)**. Headcount public exploitable : **111/254 (43,7 %)**.
- Statuts générés après correction Daedalean : 231 privées indépendantes, 10 cotées, 5 acquises, 6 acquisitions annoncées, 2 transactions stratégiques.
- 15 tendances, 46 références attachées; 7 faits capital et 19 nœuds investisseurs/accélérateurs; **30 idées uniques**.
- Géographie après rapprochement des alias : États-Unis 146, France 34, Royaume-Uni 12, Allemagne 11; 22 pays nommés, plus 3 sièges non publiés et 1 société distribuée.
- Stades : Growth 126, Series B 64, Series A 34, Seed 15, Public 11, Unknown 4.

## Constats prioritaires

### P0 — aucun

- Aucun champ obligatoire absent après merge; enums, scores 1–5, nombres et URLs sont syntaxiquement valides.
- Aucun `founded`, `fundingAsOf` ou `headcountAsOf` futur par rapport au 2026-07-13.
- Aucun domaine privé NVIDIA, benchmark interne, roadmap, contact ou donnée confidentielle détecté. Les mentions NVIDIA renvoient à des pages publiques, investisseurs, acquisitions ou documentation publique.

### P1 — financement encore hétérogène

`fundingUsdM` sert au tri, au seuil minimum et à la taille des bulles, mais ne représente pas toujours la même grandeur. Des fiches incluent explicitement dette/convertibles (Nebius, Spellbook, Verda), primaire+secondaire (Fireworks AI, Gamma), capital engagé (Xaira) ou facility (Zanskar). Les lower bounds et conversions de devises ajoutent une autre incertitude.

L'UI a déjà corrigé l'essentiel du risque en disant « montant public indicatif » et en avertissant que equity, dette et secondaire ne sont pas toujours comparables. Il reste préférable de nommer aussi le tri « montant public indicatif » et, à terme, d'ajouter `fundingScope` plutôt que de traiter la colonne comme un total homogène.

### P1 — corroboration indépendante inégale

Toutes les fiches ont au moins deux liens et au moins une source primaire/réglementaire, mais **79/254** reposent uniquement sur le domaine de l'entreprise (ou ses sous-domaines) et **75/254** n'ont qu'un seul domaine source exact. Cela suffit pour sourcer une annonce, pas pour vérifier indépendamment traction, performance ou nombre de clients.

Le texte méthode « produit, siège, financement et annonces sont attachés à des sources directes » est trop général : les sources sont attachées à la fiche, pas à chaque champ. Correction textuelle proposée dans le fichier de fixes.

### P1 — Daedalean n'est plus un comparable indépendant propre

Daedalean reste classée `Privée indépendante`, alors que Destinus a annoncé le 5 août 2025 un accord contraignant d'acquisition. Le domaine Daedalean redirige désormais vers Destinus. La clôture n'a pas été confirmée séparément pendant cet audit : le statut sûr est **`Acquisition annoncée`**, pas `Acquise`.

Source : [Destinus — acquisition de Daedalean](https://www.destinus.com/post/destinus-acquires-daedalean).

### P2 — cinq liens retournent 404

Contrôle GET de 1 162 URLs uniques du site, des fiches, du capital et des tendances : 1 085 réponses 2xx/206; 69 réponses 401/403/429 considérées comme restreintes, pas invalides; 5 réponses 404; 3 contrôles inconclusifs. Les cinq 404 sont :

1. `https://carbonre.com/cement-decarbonization/`
2. `https://carbonre.com/carbon-re-raises-new-funding-to-harness-ai-to-decarbonize-the-most-energy-intensive-industries/`
3. `https://www.daedalean.ai/certification/ailumina-vista`
4. `https://www.daedalean.ai/capabilities/navigation`
5. `https://qant.com/news/q-ant-takes-photonic-ai-computing-commercial-as-ai-s-power-demand-surges/`

Les remplacements vérifiés à 200 sont structurés dans `16-qa-fixes.json`. Carbon Re s'appelle désormais Gigaton; les deux URLs Daedalean ne disposent pas d'équivalent exact conservant le claim d'avancement de certification, donc le correctif réduit ce claim plutôt que d'inventer une preuve.

Trois contrôles restent inconclusifs : certificat TLS invalide pour `greenwaves-technologies.com` et comportement de redirection non géré par `fetch` pour deux pages `annuaire-entreprises.data.gouv.fr`. Ils ne sont pas déclarés invalides.

### P2 — biais de couverture

- 57,5 % des sociétés sont américaines et 13,4 % françaises; Amérique latine et Afrique absentes, Inde 1, Chine 4, Corée du Sud 3, pas de Japon ni d'Asie du Sud-Est.
- Growth représente 49,6 % du corpus contre 5,9 % de Seed : bon corpus de comparables financés, pas échantillon représentatif des nouvelles créations.
- Le headcount manque pour 56,3 % des sociétés et ses formats publics restent hétérogènes.
- La banque d'idées a 30 IDs/noms uniques et correspond à la provenance documentée : 12 thèses US initiales, 6 idées du venture radar et 12 pistes side-business. Les 6 idées radar n'ont toutefois pas d'artefact durable distinct du fil/provenance; 9 idées n'ont qu'une seule source attachée.
- Le bundle client principal fait environ 648 Ko non compressé / 178 Ko gzip; le build émet un warning de chunk >500 Ko. Acceptable pour v0.1, à découper si le corpus grossit fortement.

## Contrôles UI et pipelines

- Les KPI dynamiques correspondent aux données : 254 entreprises, 14 secteurs, 30 thèses, 165 fiches avec funding numérique.
- Aucun total de financement trompeur n'est agrégé; l'avertissement OCDE sur concentration/médiane est correctement sourcé.
- La taxonomie 14 secteurs et le statut société sont appliqués au merge; les scores analytiques des doublons ne sont plus fusionnés par `max`.
- `15-trends-taxonomy.json` contient 15 tendances uniques; chaque `signal`/`whyNow` est présenté comme fait, chaque `valueCapture` comme inférence, avec au moins deux sources.
- `npm run lint` : PASS.
- `npm test` : PASS (build + 3 tests). Warning non bloquant : chunk client >500 Ko.

## Limites

Cette base est curatée, non exhaustive et non statistiquement représentative. Funding, headcount, ARR, clients et acquisitions vieillissent vite. Une source d'entreprise établit qu'une annonce a été faite, pas que le claim opérationnel a été audité. Les scores moat/tech/intégration restent des jugements analytiques; ils ne doivent pas être lus comme des mesures empiriques.

## Artefacts contrôlés

- [`app/data/companies.json`](../../app/data/companies.json)
- [`scripts/merge-research.mjs`](../../scripts/merge-research.mjs)
- [`app/page.tsx`](../../app/page.tsx)
- [`15-trends-taxonomy.json`](./15-trends-taxonomy.json)
- [`14-capital-ecosystem.json`](./14-capital-ecosystem.json)
- [`research/IDEA-PROVENANCE.md`](../IDEA-PROVENANCE.md)
