# Tendances IA 2026 — synthèse critique

Date de veille : 2026-07-13  
Périmètre : sources publiques uniquement; aucun signal NVIDIA privé; aucun TAM reconstruit.

Le livrable canonique contient **15 tendances** dans [`15-trends-taxonomy.json`](./15-trends-taxonomy.json). [`15-trends-synthesis.json`](./15-trends-synthesis.json) est un alias identique conservé pour la mission d’origine.

## Méthode

- `signal` et `whyNow` contiennent uniquement des faits ou constats attribuables aux sources.
- `valueCapture` commence par **Inférence** : c’est une hypothèse de création/capture de valeur, pas un fait de marché.
- Un [YC Request for Startups Summer 2026](https://www.ycombinator.com/rfs?year=2026) est traité comme signal de thèse investisseur, jamais comme validation de demande.
- `confidence` mesure la robustesse de la tendance, pas l’attractivité d’une startup particulière.
- `founderFit` favorise les wedges systèmes, GPU/inférence, fiabilité, hardware et science appliquée; il ne remplace pas l’accès au buyer ou au métier.

## Taxonomie

| Taxon macro | Tendances | Lecture critique |
|---|---|---|
| Model layer | `model-layer-convergence` | Les performances de tête convergent, mais le modèle ouvert n’a pas « gagné » et la frontière reste jagged. La différenciation crédible est workload-specific. |
| Agents | `agent-task-reliability-economics`, `agent-identity-authorization` | La capacité progresse plus vite que la fiabilité longue durée; identité, permissions, budget et preuve deviennent des primitives. |
| Infrastructure systèmes | `workflow-aware-inference`, `generated-systems-code-assurance`, `ai-factory-reliability-plane` | Le coût/risque se déplace vers état KV, graphes de tâches, correctness et fautes cross-layer. |
| Hardware × énergie | `power-aware-compute`, `rack-scale-hardware` | Grid, transformateurs, power delivery, cooling et load dynamics contraignent le compute au même niveau que le silicon. |
| Scientific & physical AI | `closed-loop-scientific-ai`, `constrained-domain-physical-ai` | La valeur vient de la boucle mesure-action dans un domaine contraint; les démos ouvertes et la réplication autonome restent faibles. |
| Vertical AI | `vertical-ai-service-execution` | Les gains observés sont plus solides sur du travail structuré, vérifiable et intégré; le copilot générique ne suffit pas. |
| Data | `operational-feedback-data-moat` | Le moat utile est le couple action → outcome avec droits d’usage, pas l’accumulation indifférenciée de documents. |
| Governance | `executable-governance-evidence` | Logs, versions, evals et incidents doivent devenir des preuves reproductibles dans le chemin de release. |
| Distribution & souveraineté | `agent-native-distribution`, `sovereign-plural-deployment` | Les agents deviennent des clients logiciels, tandis que résidence et capacités publiques imposent plusieurs runtimes et lieux de déploiement. |

Sources de cadrage principales : [Stanford AI Index 2026](https://hai.stanford.edu/ai-index/2026-ai-index-report), [YC RFS Summer 2026](https://www.ycombinator.com/rfs?year=2026), [IEA — Key Questions on Energy and AI](https://www.iea.org/reports/key-questions-on-energy-and-ai), [NIST AI Agent Standards Initiative](https://www.nist.gov/artificial-intelligence/ai-agent-standards-initiative), [EU AI Act](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai), [DOE autonomous laboratories](https://www.energy.gov/undersecretaryforscience/genesis-mission/achieving-ai-driven-autonomous-laboratories) et [OCP infrastructure standards](https://www.opencompute.org/about/a-call-for-collaboration-on-ai-data-center-infrastructure-standards).

## Cinq implications pour des idées techniquement différenciées et intégrées au métier

1. **Optimiser une unité métier mesurable.** Un scheduler agent doit prouver coût et temps par tâche réussie; un produit energy-compute doit prouver une flexibilité livrable sans rupture de SLO; une plateforme science doit prouver un résultat physique.

2. **Posséder la boucle de validation.** Le moat le plus défendable relie entrée, décision, action, exception humaine et ground truth. Sans mesure indépendante de l’outcome, l’amélioration du modèle n’est pas démontrable.

3. **Commencer dans un environnement contraint.** Préférer un cluster, un procédé, un instrument ou un workflow réglementé avec états observables et fallback sûr à une autonomie horizontale ouverte.

4. **Transformer l’intégration en control plane.** Identité, policy, observabilité, preuves et connecteurs versionnés doivent former un produit réutilisable; une accumulation de glue code reste du service difficile à scaler.

5. **Monétiser l’assurance ou l’outcome, pas l’accès au modèle.** Les wedges les plus cohérents facturent tâche validée, SLO, qualification, transaction ou économie vérifiée; le modèle reste remplaçable derrière une matrice d’evals.

Filtre minimal d’exploration :

```text
EXPLORE = outcome_mesurable
       && contrainte_technique_difficile
       && accès_workflow_et_ground_truth
       && intégration_au_system_of_record
       && validation_indépendante
```

## Narratifs écartés ou réduits

- **« Les modèles sont commoditisés. »** Trop fort : la tête converge sur certaines métriques, mais l’écart fermé/ouvert s’est rouvert et les capacités restent irrégulières.
- **« Le silicon pour agents est déjà une nouvelle catégorie. »** Le [RFS YC](https://www.ycombinator.com/rfs?year=2026#inference-chips-for-agent-workflows) et les travaux de scheduling montrent une inefficacité potentielle, pas encore une économie de puce validée indépendamment. Le wedge logiciel est testable avant le silicon.
- **« Company brain » horizontal.** Le [RFS YC](https://www.ycombinator.com/rfs?year=2026#company-brain) décrit un problème réel de contexte, mais pas la demande pour un produit autonome. La version défendable est attachée à un workflow, des permissions et un outcome précis.
- **Interfaces entièrement dynamiques.** Le [RFS YC](https://www.ycombinator.com/rfs?year=2026#dynamic-software-interfaces) est une hypothèse de produit; il manque des données d’adoption, de rétention et de sécurité.
- **Scientifique autonome généraliste.** Les scores de réplication et de recherche end-to-end du [AI Index Science](https://hai.stanford.edu/ai-index/2026-ai-index-report/science) restent faibles. L’autonomie crédible est limitée à une boucle instrumentée et validée.

## Gaps et inconnues

- Il n’existe pas encore de benchmark public standard du **coût énergétique et monétaire par tâche agent réussie** sur des workflows d’entreprise réels.
- Les résultats de SAGA, FastKernels et des roadmaps KV-cache sont récents; leur transfert multi-tenant et multi-hardware doit être reproduit.
- La flexibilité électrique a des preuves pilotes, mais peu de données publiques longitudinales sur pénalités, disponibilité et contrats utility à grande échelle.
- Les laboratoires autonomes publics démontrent une direction technique; les métriques commerciales comparables — temps de qualification, yield, coût par découverte validée — restent rares.
- L’AI Act et ses mesures de simplification ont encore des calendriers évolutifs. Toute décision produit exige une lecture juridique par juridiction et catégorie de risque.
- Les dépenses de souveraineté et les AI Factories ne prouvent pas qu’un buyer achètera un control plane vendor-neutral; le procurement public peut favoriser des consortiums établis.
- L’accès au ground truth, aux instruments et aux buyers reste le principal inconnue des wedges verticaux; il doit être sécurisé avant une construction lourde.
- Aucun chiffre de TAM n’est fourni : les sources disponibles mélangent dépenses d’infrastructure, investissement et adoption, sans isoler les revenus accessibles à chaque wedge.

