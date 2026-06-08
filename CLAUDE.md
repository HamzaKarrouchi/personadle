# CLAUDE.md — PersonaDLE

> Référence Claude Code. Lire en priorité.

---

## 1. Présentation

**PersonaDLE** — jeu de devinettes quotidien fan-made (Persona P1→P5X), 6 modes.
**Site** : https://personadle.net | **Dépôt** : https://github.com/HamzaKarrouchi/personadle | **v2.0** (backend PHP+MariaDB)

| Pseudo | Rôle |
|---|---|
| Hamza Karrouchi | Lead Dev |
| Léo (L2GENDAIRE) | Data & Design |
| Damien (Corbover) | Front-End / CSS |
| Dzulian | Consultant P1/P2 |

---

## 2. Stack

- **Frontend** : Vanilla JS ES6+ (zéro framework), modules ES6, `localStorage`
- **Backend** : PHP 8.3 + PDO — MySQL 8.0 local / MariaDB 10.6+ Hostinger
- **Tests** : Vitest + jsdom (`npm test`)
- **Auth** : bcrypt + sessions PHP httpOnly — pas JWT

---

## 3. Architecture

```
personadle/
├── js/                  ← gameCore.js, api.js, auth.js, i18n.js, cloud-sync.js…
├── css/                 ← global.css + un CSS par composant
├── database/            ← characters_clean.js, personas.js, quotes.js, portraits/
├── lang/                ← en.json (source de vérité, ~760 clés), fr/es/de/it.json
├── classiqueMode/  emojiMode/  allOutAttackMode/  silhouetteMode/  personaeMode/  musicsMode/
├── profile/             ← profile.js, badges/, friends/, leaderboard/
├── api/                 ← PHP REST (auth/, user/, messages/, social-links/, leaderboard/…)
├── tests/               ← gameCore.test.js (172) + backend.test.js (18) + i18n.test.js + profileStats.test.js
└── sql/                 ← bdd_mysql.sql (20 tables)
```

**Fichiers clés :**
- `js/gameCore.js` — utilitaires partagés : `parisDateKey()`, `getDailyTarget()`, `savePendingSession()`, `FILTER_STORAGE_KEYS`
- `js/api.js` — client REST + `window._personadleApi` (bridge anti-circulaire)
- `js/cloud-sync.js` — `pullProfileFromCloud()` : backend = source de vérité absolue
- `api/bootstrap.php` — CORS, PDO singleton, `requireAuth()`, `requireAdmin()`
- `api/sessions.php` — logique streak (par mode, par date Paris, UTC → Paris)

---

## 4. Conventions

### Nommage des fichiers — RÈGLE ABSOLUE
**Tous les nouveaux fichiers utilisent le `snake_case` avec underscores** (ex: `badge_manager.js`, `user_stats.php`).
Ne jamais utiliser camelCase ou kebab-case pour les noms de fichiers afin de garantir la stabilité de l'arborescence sur tous les OS.

### JavaScript
- Arrow functions, destructuring, template literals, `async/await`
- `camelCase` variables/fonctions · `PascalCase` classes
- Réutiliser `gameCore.js` avant de réécrire une utilité
- Bridge `window._personadleApi` pour éviter les imports circulaires (`gameCore` ↔ `api`)
- Ne pas empiler des `addEventListener` — vérifier si le listener existe déjà

### CSS
- `global.css` commun, un CSS par mode dans son dossier
- Dark mode via classe `.darkmode` sur `<body>` (jamais `<html>` sauf script inline)
- Préfixer les animations spécifiques (`p5ImpactFlash`, `tarotFlip`…)

### PHP
- PDO obligatoire — **jamais** de concaténation SQL
- `password_hash($pwd, PASSWORD_BCRYPT)` uniquement
- Codes HTTP corrects (200, 201, 400, 401, 403, 404, 409, 500)
- Tout nouveau `.php` dans `api/user/` ou `api/admin/` → ajouter sa `RewriteRule` dans `.htaccess`

---

## 5. i18n

- `lang/en.json` = **source de vérité** — toujours ajouter la clé EN en premier
- Variables : `{{variable}}` — `t('key', { vars })` dans `js/i18n.js`
- Ne pas traduire : noms persos, personas, titres musiques, codes opus, termes lore
- `npm run i18n:check` — vérifie la cohérence entre tous les fichiers lang/

**Pattern fallback correct :**
```js
const r = window.i18n?.t?.(key);
return (r != null && r !== key) ? r : fallback;
// ⚠️ t(key) retourne la clé (truthy) si absente — ?? ne se déclenche jamais
```

---

## 6. Responsive

| Breakpoint | Cible |
|---|---|
| `max-width: 480px` | Mobile |
| `max-width: 768px` | Tablette |
| `max-width: 1024px` | Petit desktop |

Utiliser `min()`, `clamp()`, `vw`/`vh`. Éviter les largeurs fixes en `px` sur les conteneurs.

---

## 7. Pièges critiques

| Problème | Solution |
|---|---|
| `rank` mot réservé MySQL 8.0 | Toujours entourer de backticks |
| CORS + `credentials: 'include'` | Whitelist exacte + `Allow-Credentials: true` — jamais `*` |
| `t(key) ?? fallback` | Voir pattern section 5 |
| Import circulaire `gameCore` ↔ `api` | Bridge `window._personadleApi` |
| `savePendingSession` 409 | `continue` silencieux, pas `return` |
| `.htaccess` api/user/ ou api/admin/ | Chaque nouveau `.php` = nouvelle `RewriteRule` |
| PDO param nommé répété | MySQL PDO ne supporte pas `:param` deux fois — utiliser `?` positionnels |
| `window.onclick` écrase handlers | Toujours `window.addEventListener('click', fn)` |
| `LEAVE proc_name` non reconnu MariaDB | Labelliser `proc_body: BEGIN…END` → `LEAVE proc_body` |
| Procédure stockée import Hostinger | SSH + `mysql --delimiter='$$' < fichier.sql` — jamais phpMyAdmin |
| Streak cooldown Jack Frost | Le cooldown de 60j est géré **côté client uniquement** — vulnérabilité connue |
| DST Paris mal géré | `Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris' })` |
| `ALTER TABLE … ADD COLUMN IF NOT EXISTS` | Syntaxe MariaDB uniquement — MySQL 8.0 : `ADD COLUMN` sans condition |
| `isolation: isolate` clippe le burst avatar | Sortir `.tv-burst-wrap` du corps TV → enfant direct de `.tv-wrap`, z-index:20 |

---

## 8. Tests

- `npm test` · `npm run test:watch`
- 4 suites : `gameCore.test.js` (172), `backend.test.js` (18), `i18n.test.js`, `profileStats.test.js`
- Tout nouvel utilitaire `gameCore.js` → tests correspondants obligatoires

---

## 9. Documentation des mises à jour

> **Règle absolue** : tout ajout/correction notable → `PersonaDLE_Update_Documentation/PersonaDLE 2.0/PersonaDLE_Update.md`

```markdown
## 🏷️ Titre _(vX.X.X)_
Description concise.
### Détails techniques (si pertinent)
```

Notes rapides → `note_ajout.md` (même dossier).

---

## 10. Commandes utiles

```bash
npm test                  # Tests
npm run test:watch        # Mode watch
npm run i18n:check        # Vérifier clés i18n manquantes
bash setup.sh             # Install backend local (première fois)
ssh hostinger-personadle  # Accès SSH Hostinger
mysql -u u870779941_Hamza -p u870779941_personadle  # MariaDB prod
```

---

## 11. Comportement — Rôle de Mentor

Claude Code agit en **mentor technique** : critiquer les choix problématiques avant de coder, proposer une alternative si clairement meilleure, expliquer les décisions non évidentes. Ce rôle ne signifie pas remettre en cause chaque détail ou bloquer si l'utilisateur confirme sa décision.

---

## 12. Graphify

Knowledge graph dans `graphify-out/`.
- Questions d'architecture → lire `graphify-out/GRAPH_REPORT.md` en premier
- Après modification de fichiers : `python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"`
