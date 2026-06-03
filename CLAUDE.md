# CLAUDE.md — PersonaDLE

> Référence Claude Code. Lire en priorité à chaque session.

---

## 1. Présentation

**PersonaDLE** — jeu de devinettes quotidien fan-made (saga Persona P1→P5X), 6 modes de jeu.

- **Site** : https://personadle.net
- **Dépôt** : https://github.com/HamzaKarrouchi/personadle
- **Version** : 2.0 (backend PHP+MariaDB)

| Pseudo          | Rôle                                          |
| --------------- | --------------------------------------------- |
| Hamza Karrouchi | Fondateur & Lead Dev                          |
| Léo (L2GENDAIRE)| Data & Design                                 |
| Damien (Corbover)| Front-End / CSS                              |
| Dzulian         | Consultant créatif (P1/P2)                    |

---

## 2. Stack technique

### Frontend
- **Vanilla JS ES6+ uniquement** — zéro framework (ne pas introduire React/Vue/Svelte sans décision explicite)
- Modules ES6 (`import`/`export`), `localStorage` pour la persistance locale
- Tests : **Vitest + jsdom** (`npm test`)

### Backend
- **PHP 8.3** + PDO (prepared statements obligatoires — jamais de concaténation SQL)
- **MySQL 8.0** local · **MariaDB 10.6+** Hostinger (schémas compatibles)
- Auth : bcrypt (`password_hash`), sessions PHP httpOnly (pas JWT)
- CORS : whitelist exacte, jamais wildcard avec `credentials: 'include'`
- Offline-first : `savePendingSession()` → API ou fallback localStorage, sync au retour en ligne

---

## 3. Architecture (résumé)

```
personadle/
├── js/                  ← Utilitaires partagés (gameCore.js, api.js, auth.js, i18n.js…)
├── css/                 ← global.css + un CSS par composant
├── database/            ← characters_clean.js, personas.js, quotes.js, portraits/
├── lang/                ← en.json (source de vérité), fr/es/de/it.json
├── classiqueMode/  emojiMode/  allOutAttackMode/  silhouetteMode/  personaeMode/  musicsMode/
├── profile/             ← profile.js, badges/, friends/, leaderboard/, Wallpaper/
├── api/                 ← Backend PHP REST (auth/, user/, messages/, social-links/, leaderboard/…)
├── tests/               ← gameCore.test.js + backend.test.js
├── sql/                 ← bdd_mysql.sql (20 tables) + explication.md
└── PersonaDLE_Update_Documentation/PersonaDLE 2.0/
```

**Fichiers clés à connaître :**
- `js/gameCore.js` — fonctions communes (date DST-safe, filtres, confetti, `FILTER_STORAGE_KEYS`)
- `js/api.js` — client REST + bridge `window._personadleApi`
- `js/cloud-sync.js` — `pullProfileFromCloud()` : backend = source de vérité absolue
- `api/bootstrap.php` — CORS, PDO singleton, `requireAuth()`

---

## 4. Conventions de code

### JavaScript
- ES6+ : arrow functions, destructuring, template literals, `async/await`
- `camelCase` variables/fonctions · `PascalCase` classes
- Réutiliser `gameCore.js` avant de réécrire une utilité existante
- Ne pas empiler des `addEventListener` — vérifier si le listener existe déjà
- Bridge `window._personadleApi` pour éviter les imports circulaires (`gameCore` ↔ `api`)

### CSS
- `global.css` pour le commun, un CSS par mode dans son dossier
- Pas de styles inline sauf variables dynamiques JS
- Dark mode via classe `.darkmode` sur `<body>`
- Préfixer les animations spécifiques (`p5ImpactFlash`, `tarotFlip`…)

### PHP
- PDO obligatoire — toutes les requêtes via prepared statements
- Bcrypt : `password_hash($pwd, PASSWORD_BCRYPT)`
- Validation inputs côté serveur avant toute requête BDD
- REST propre : codes HTTP corrects (200, 201, 400, 401, 403, 404, 500)
- Chaque nouveau fichier PHP dans `api/user/` ou `api/admin/` → ajouter sa `RewriteRule` dans `.htaccess`

### Commentaires
- Commenter les logiques non évidentes (cache LRU, anti-race token, DST…)
- En-tête de fichier décrivant le rôle du module (voir `gameCore.js`)

---

## 5. Responsive

| Breakpoint        | Cible          |
| ----------------- | -------------- |
| `max-width: 480px`| Mobile         |
| `max-width: 768px`| Tablette       |
| `max-width: 1024px`| Petit desktop |

- Utiliser `min()`, `clamp()`, `vw`/`vh` pour les tailles fluides
- Grilles Classic : `overflow-x: auto` sur mobile, `grid-template-columns` adaptatif
- Éviter les largeurs fixes en `px` sur les conteneurs principaux

---

## 6. i18n

- `lang/en.json` = **source de vérité** (760 clés) — toujours ajouter la clé EN en premier
- Langues : EN · FR · ES · DE · IT (toutes complètes) · JP post-v2.0
- Clés hiérarchiques : `ui.submit`, `modes.classic.hint`, `badges.ace_detective.name`
- Variables : syntaxe `{{variable}}` — fonction `t('key', { vars })` dans `js/i18n.js`
- **Ne pas traduire** : noms persos, personas, titres musiques, opus codes, termes lore
- `npm run i18n:check` — vérifie la cohérence entre tous les fichiers lang/

**Pattern fallback correct :**
```js
const r = window.i18n?.t?.(key);
return (r != null && r !== key) ? r : fallback;
// ⚠️ t(key) retourne la clé (truthy) si absente — ?? ne se déclenche jamais
```

---

## 7. Tests

- `npm test` · `npm run test:watch`
- `tests/gameCore.test.js` — 146 tests · `tests/backend.test.js` — 18 tests
- Tout nouvel utilitaire dans `gameCore.js` → tests correspondants obligatoires
- `savePendingSession` est async fire-and-forget — les callers sont des event handlers, c'est voulu

---

## 8. Documentation des mises à jour

> **Règle absolue** : tout ajout/correction notable → `PersonaDLE_Update_Documentation/PersonaDLE 2.0/PersonaDLE_Update.md`

```markdown
## 🏷️ Titre _(vX.X.X)_
Description concise.
### Détails techniques (si pertinent)
- Ce qui a changé / pourquoi / snippet si logique non triviale
```

Notes rapides → `note_ajout.md` (même dossier).

---

## 9. Pièges connus

| Problème | Solution |
| -------- | -------- |
| Listeners autocomplete empilés | Mutation en place (`personas.length = 0; personas.push(...)`) + init unique |
| DST Paris mal géré | `Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris' })` |
| `rank` mot réservé MySQL 8.0 | Toujours entourer de backticks : `` `rank` `` |
| CORS avec `credentials: 'include'` | Whitelist d'origines exactes + `Access-Control-Allow-Credentials: true` |
| Import circulaire `gameCore` ↔ `api` | Bridge `window._personadleApi` |
| `savePendingSession` 409 | `continue` silencieux (déjà enregistré), pas `return` |
| `t(key) ?? fallback` ne marche pas | `t()` retourne la clé (truthy) — voir pattern section 6 |
| `.htaccess` api/user/ ou api/admin/ | Chaque nouveau `.php` = nouvelle `RewriteRule` explicite |
| PDO param nommé répété | MySQL PDO ne supporte pas `:param` deux fois — utiliser `?` positionnels |
| `isolation: isolate` clippe le burst avatar | Sortir `.tv-burst-wrap` du corps TV → enfant direct de `.tv-wrap`, z-index:20 |
| `animation-fill-mode: forwards` oublié | Sans ça, l'overlay disparaît après l'animation |
| Race condition badge BDD → UI | Appeler `renderBadgesPreview()` + `renderBadgesModal()` dans le callback fetch |
| `LEAVE proc_name` non reconnu MariaDB | Labelliser `proc_body: BEGIN…END` et utiliser `LEAVE proc_body` |
| Procédure stockée import Hostinger | SSH + `mysql --delimiter='$$' < fichier.sql` — jamais PhpMyAdmin |
| `window.onclick` écrase le handler précédent | Toujours `window.addEventListener('click', fn)` |
| `ALTER TABLE … ADD COLUMN IF NOT EXISTS` | Syntaxe MariaDB uniquement — MySQL 8.0 local : `ADD COLUMN` sans condition |
| `default_avatar.png` 404 depuis `index.html` | Utiliser `_imgBase()` (pattern `streak-recovery.js`) |
| Animation défi rejouée après changement de compte | `localStorage.removeItem('_crInitDone')` dans `auth.js` avant dispatch login/register |
| `_migrate()` expand incorrect filtres défi | `children.some(c => saved.includes(c))` avant d'expand |
| `checkChallengeCompletion()` non appelé sur give-up | Hors du bloc `if (!force)` avec `isWin = !force` |
| `GET /api/user/:id` retournait 403 profils tiers | Profil public restreint pour tout user authentifié |
| DB schema drift colonnes absentes en local | `formatUser()` gère les fallbacks `?? false` |
| `modeSilhouette.js` envoyait `"Shadow"` | `const modeName = "silhouette"` + alias map dans `syncPending` |
| Apache 403 après chmod | `chmod o+x /home/pchamza` (www-data doit traverser le home) |
| Apache 404 malgré AllowOverride | Deux blocs `<Directory>` : vrai chemin ET chemin symlinké |

---

## 10. Commandes utiles

```bash
npm test                  # Lancer les tests
npm run test:watch        # Mode watch
npm run i18n:check        # Vérifier clés i18n manquantes

bash setup.sh             # Install backend local (première fois)
# Dev : ouvrir index.html ou http://localhost/personadle/
```

---

## 11. Comportement attendu — Rôle de Mentor

Claude Code agit en **mentor technique**, pas uniquement en exécutant :

- **Critiquer** les choix problématiques (perf, sécu, maintenabilité) avant de coder
- **Proposer une alternative** si clairement meilleure — expliquer, laisser décider
- **Poser des questions** sur les tâches importantes avant de se lancer
- **Expliquer** les décisions non évidentes prises pendant le dev

Ce que ça ne signifie **pas** : remettre en cause chaque détail, surcharger de warnings, bloquer si l'utilisateur confirme sa décision après avoir entendu la critique.

---

## 12. Graphify

Knowledge graph disponible dans `graphify-out/`.

- Avant de répondre à des questions d'architecture : lire `graphify-out/GRAPH_REPORT.md`
- Si `graphify-out/wiki/index.md` existe : naviguer dedans plutôt que lire les fichiers bruts
- Après modification de fichiers : `python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"`