# AI Venture Atlas

Site de recherche partagé pour cartographier l’écosystème des entreprises IA, comparer leurs marchés, GTM, financements et moats, puis confronter une banque d’idées business à des critères falsifiables.

## Contenu

- cartographie de 266 entreprises, 14 macro-secteurs et 953 liens, filtrable et exportable en CSV ;
- visualisation `profondeur technique × intégration métier` ;
- éditeur local pour ajouter/modifier/restaurer des fiches, notes personnelles par entreprise et import/export JSON ;
- 15 tendances sourcées dans 9 familles ;
- lecture critique de l’écosystème de financement et 19 investisseurs/accélérateurs ;
- banque de 30 idées issue des explorations précédentes ;
- méthodologie séparant faits, inférences et inconnues.

Les sources sont publiques. Aucune information confidentielle NVIDIA n’est utilisée.

## Éditeur et notes

L’onglet **Éditeur** sauvegarde automatiquement les ajouts, modifications et notes dans le `localStorage` du navigateur. Ces données sont privées à ce navigateur : elles ne sont pas synchronisées entre collaborateurs et ne partent pas dans l’export CSV. L’export/import JSON sert de sauvegarde et de revue manuelle tant qu’un backend authentifié n’est pas connecté.

## Version statique

Le site peut désormais être exporté sans serveur :

```bash
npm run static:build
```

Le dossier `out/` contient le site HTML/CSS/JavaScript à publier sur n’importe quel hébergeur statique. Le workflow GitHub Pages est prêt dans `.github/workflows/deploy-static.yml` : il suffit d’activer **Settings → Pages → GitHub Actions** dans le dépôt. Les entrées et notes restent locales à chaque navigateur ; l’export statique ne crée pas d’édition collaborative.

## Développement

```bash
npm install
npm run dev
npm run research:merge
npm run build
npm test
```

Les contributions de recherche conformes à [`research/SCHEMA.md`](research/SCHEMA.md) sont déposées dans `research/incoming/`. `npm run research:merge` déduplique, normalise et valide les données avant d’écrire `app/data/companies.json`.

## Mise à jour d’une fiche

1. Modifier le fichier source dans `research/incoming/` en conservant une date et au moins deux liens.
2. Laisser une valeur à `null` ou `Unknown` si elle n’est pas publiquement vérifiable.
3. Relancer `npm run research:merge && npm test`.
4. Examiner `research/merge-report.json` avant publication.

Funding, dette, secondaire, valorisation et engagements cloud ne sont pas additionnés sans périmètre explicite.

Le statut courant distingue les sociétés privées, cotées, acquises, sous acquisition annoncée et les transactions stratégiques. Le corpus reste une sélection large de sociétés financées/high-signal, pas un registre exhaustif du marché mondial.
