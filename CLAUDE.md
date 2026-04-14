# CLAUDE.md — PersonaDLE

> Document de référence pour Claude Code. À lire en priorité au début de chaque conversation sur ce projet.

---

## 1. Présentation du projet

**PersonaDLE** est un jeu de devinettes quotidien fan-made basé sur la saga Persona (P1 → P5X).
Le joueur identifie des personnages, personas ou musiques via 6 modes de jeu distincts.

- **Site** : <https://personadle.net>
- **Dépôt** : <https://github.com/HamzaKarrouchi/personadle>
- **Version actuelle** : 2.0 (backend PHP+MariaDB, navigation repensée, page profil dédiée)
- **Licence** : MIT

### Contributeurs

| Pseudo | Rôle |
| --- | --- |
| Hamza Karrouchi | Fondateur & Lead Dev (logique de jeu, animations, profil) |
| Léo (L2GENDAIRE) | Data & Design (BDD personnages, portraits, mises en page) |
| Damien (Corbover) | Front-End (architecture CSS, responsive) |
| Dzulian | Consultant créatif (précision P1/P2, expertise classic trilogy) |

---

## 2. Stack technique

### Frontend (existant — ne pas refactoriser sans raison)

- **HTML5 / CSS3 / JavaScript ES6+** — vanilla uniquement, zéro framework
- **Modules ES6** (`import`/`export`) — chaque mode importe depuis `js/gameCore.js`
- **localStorage** — toute la persistance actuelle (profil, stats, filtres, état de jeu)
- **Vitest + jsdom** — tests unitaires (`npm test`)

> **Règle importante** : le frontend reste en vanilla JS pour l'instant. On n'introduit un framework (React, Vue, Svelte…) que si une fonctionnalité le nécessite vraiment et après décision explicite.

### Backend (v2.0 — implémenté en local, déploiement Hostinger à venir)

- **Langage** : PHP 8.3 avec PDO (Prepared Statements obligatoires — protection injection SQL)
- **BDD** : MySQL 8.0 en local (développement) · MariaDB 10.6+ chez Hostinger (production) — schémas compatibles
- **Hébergement** : Hostinger (déploiement à planifier)
- **API** : REST (endpoints JSON, structure `api/`)
- **Authentification** : Email + mot de passe (hashé bcrypt via `password_hash()`), sessions PHP httpOnly (pas JWT — sessions PHP suffisantes, plus simples à révoquer)
- **Sécurité** : PDO + requêtes préparées, bcrypt, HTTPS en prod, CORS exact-origin (pas de wildcard quand `credentials: 'include'`)
- **Offline-first** : `savePendingSession()` tente l'API, fallback localStorage si offline, sync au retour en ligne
- **Bridge global** : `window._personadleApi` — évite les imports circulaires entre `gameCore.js` et `api.js`

---

## 3. Architecture des fichiers

```text
personadle/
├── index.html                        ← Page d'accueil (sélecteur de mode)
├── 404.html
├── CLAUDE.md                         ← CE FICHIER
├── package.json / vitest.config.js   ← Config tests
│
├── js/                               ← Utilitaires partagés
│   ├── gameCore.js                   ← Fonctions communes (date, confetti, filtres, buildGameSession…)
│   ├── filterMenu.js                 ← Panneau de filtres collapsible
│   ├── api.js                        ← Client REST (api.auth.*, api.stats.*, api.user.*) + window._personadleApi
│   └── auth.js                       ← UI connexion/inscription, initAuth(), migration localStorage→cloud
│
├── css/                              ← Styles globaux
│   ├── global.css                    ← Commun à toutes les pages
│   ├── index.css                     ← Page d'accueil uniquement
│   └── filterMenu.css                ← Panneau de filtres
│
├── database/                         ← BDD personnages globale (200+ persos)
│   ├── characters_clean.js
│   ├── personas.js
│   ├── quotes.js                     ← Quotes par perso, par langue (fallback EN)
│   ├── portraitsMap.js
│   └── portraits/                    ← WebP portraits
│
├── lang/                             ← Fichiers de traduction i18n
│   ├── en.json                       ← SOURCE DE VÉRITÉ — toujours complet
│   ├── fr.json
│   ├── es.json
│   └── de.json
│
├── classiqueMode/                    ← Mode Classique (Wordle-style, 7 attributs)
├── emojiMode/                        ← Mode Emoji (séquence d'emojis progressive)
├── allOutAttackMode/                 ← Mode All-Out Attack (GIFs animés, cache LRU)
├── silhouetteMode/                   ← Mode Silhouette (révélation progressive par CSS)
├── personaeMode/                     ← Mode Personae (identifier la Persona, pas le perso)
├── musicsMode/                       ← Mode Musique (extrait audio, 120+ titres)
│
├── profile/                          ← Système de profil utilisateur
│   ├── profile.js                    ← Gestion profil, avatar (canvas crop), export JSON
│   ├── profileStats.js               ← Suivi stats (streaks, wins, playtime…)
│   ├── badges/                       ← Système de badges (20+ badges, 4 catégories)
│   └── Wallpaper/                    ← 37 fonds d'écran Persona-thémés
│
├── assets/                           ← Boutons, sons, icônes partagés
├── img/                              ← Graphismes UI (logo, previews, avatars)
├── api/                              ← Backend PHP REST
│   ├── bootstrap.php                 ← CORS, PDO singleton, helpers JSON, requireAuth()
│   ├── config.php                    ← Identifiants BDD (gitignored — voir config.example.php)
│   ├── config.example.php            ← Template à copier pour local + Hostinger
│   ├── auth/                         ← register.php, login.php, logout.php, me.php
│   ├── sessions.php                  ← POST /api/sessions (enregistrer une partie)
│   └── user/                         ← index.php (GET/PATCH/DELETE), stats.php, migrate.php
│
├── tests/                            ← Tests unitaires (120 tests — tous passants)
│   ├── gameCore.test.js              ← 102 tests (logique de jeu, dates, streaks…)
│   └── backend.test.js               ← 18 tests (buildGameSession, savePendingSession, auth UI)
│
├── sql/                              ← Schéma BDD et documentation
│   ├── bdd_mysql.sql                 ← Schéma MySQL 8.0 / MariaDB 10.6+ complet (16 tables)
│   └── explication.md                ← Explication de chaque table avec exemples
├── scripts/                          ← Scripts utilitaires dev
│   └── check-i18n.js                 ← Détection des clés manquantes dans les fichiers lang/
│
└── PersonaDLE_Update_Documentation/
    ├── PersonaDLE 1.0/
    ├── PersonaDLE 1.1/
    └── PersonaDLE 2.0/               ← Documenter TOUTES les modifications ici
```

---

## 4. Objectif de la v2.0 — Vue d'ensemble

La v2.0 est une **mise à jour majeure de stabilisation et d'infrastructure**. L'objectif principal est :

> **Construire le backend complet, de la création de la BDD à son intégration en jeu, tout en maintenant la stabilité du frontend existant.**

### Priorités dans l'ordre

1. **Stabilité du jeu** — ne rien casser de ce qui marche
2. **Backend & BDD** — architecture solide, sécurisée, scalable
3. **Système de traduction** — i18n EN (base) + FR + ES + DE + IT
4. **Responsive complet** — mobile, tablette, desktop
5. **Documentation & commentaires** — tout ajout documenté

---

## 5. Backend — Spécifications détaillées

### 5.1 Authentification

- **Inscription** : email + mot de passe (hashé bcrypt via `password_hash()`)
- **Connexion** : vérification via `password_verify()`
- **Sessions** : tokens sécurisés (JWT ou sessions PHP)
- **Migration** : à la connexion, l'utilisateur peut importer son ancien fichier JSON localStorage pour migrer son profil local vers son compte cloud
- **Règle** : toutes les requêtes BDD passent par PDO avec requêtes préparées — jamais de concaténation de chaînes SQL

### 5.2 Schéma BDD (tables complètes)

```text
users                    → id, email, pseudo, password_hash, friend_code, lang, created_at, is_deleted
profiles                 → user_id, avatar_data, border_color, wallpaper_id, profile_music_id, selected_badges, equipped_title_id
user_stats               → user_id, mode, wins, giveups, games, streak, streak_record, perfect_wins, total_time_ms
game_sessions            → user_id, mode, played_date, target_name, result, attempts, time_ms, active_filters
daily_targets            → (mode + date) PK, target_name, target_data JSON
badges_unlocked          → user_id, badge_id, unlocked_at
event_codes_redeemed     → user_id, code, redeemed_at
titles                   → id, slug, name_[en/fr/es/de], condition_type, condition_mode, condition_value, rarity
user_titles              → user_id, title_id, unlocked_at
friendships              → requester_id, addressee_id, status (pending/accepted/blocked)
social_links             → user_a_id, user_b_id, rank (1-10), xp, badge_generated
social_link_ranks        → rank (1-10), rank_name_[en/fr/es/de], xp_required
social_link_interactions → social_link_id, initiator_id, action_type, xp_gained, is_mutual
social_link_badges       → social_link_id, user_a_avatar, user_b_avatar (True Confidant badge)
leaderboard_cache        → user_id, mode, period, score, rank_position, period_start
deletion_requests        → user_id, requested_at, processed_at (RGPD)
```

> Schéma SQL complet avec explications dans [sql/bdd.sql](sql/bdd.sql) et [sql/explication.md](sql/explication.md).

### 5.3 Leaderboard

- **Types** : Global (tous modes) + par mode séparé (Classic, Emoji, Silhouette, AllOutAttack, Personae, Music)
- **Périodes** : Hebdomadaire / Mensuel / Permanent — toutes consultables
- **Métriques** : à définir précisément (ratio victoires, streaks, score composé…)
- **Scalabilité** : prévoir index sur `(mode, period, score)` pour les requêtes de classement

### 5.4 Système d'amis

- Recherche par pseudo **ou** code unique d'ami
- Actions disponibles : envoyer une demande, accepter, refuser, supprimer
- Partage de profil entre amis
- Comparaison de stats côte-à-côte
- Envoi de "partie" (défi ou notification)

### 5.5 Sauvegarde & synchronisation progression

- **Phase 1** : migration localStorage → compte cloud (import JSON au moment de la création de compte)
- **Phase 2** : sync automatique cloud (après connexion, chaque action enregistrée côté serveur)
- **Offline first** : le jeu continue de fonctionner sans connexion ; sync au retour en ligne

### 5.6 Partage de profil

- Page publique dynamique ou image statique exportable (à trancher selon complexité)
- Accessible via recherche par pseudo ou lien direct
- Affiche : avatar, pseudo, badges sélectionnés, stats clés, fond d'écran

### 5.7 Badges & fonds d'écran débloquables

> **Décision actuelle (avril 2026)** : badges et wallpapers passent en backend ensemble.

- **Badges → backend** : les conditions de déblocage seront vérifiées côté serveur (anti-triche), les `badges_unlocked` sont déjà dans le schéma
- **Wallpapers → backend** : gérés exactement comme les badges (condition + unlock côté serveur), avec une table `wallpapers_unlocked` à ajouter au schéma
- En attendant la migration complète : logique localStorage conservée, sync via `migrate.php` au moment de l'inscription

### 5.8 Musique de profil

- Sélection parmi les musiques du jeu (playlist prédéfinie)
- Jouée **uniquement** sur la page de profil (du joueur ou lors de la consultation par un autre)
- Modèle inspiré de Dokkan Battle : musique associée au profil, pas au gameplay

### 5.9 Système Social Link

Mécanisme inspiré directement des jeux Persona : une relation entre deux amis progresse en rang (1 → 10) via des interactions mutuelles.

#### Règles

- Symétrique — le rang est partagé entre les deux joueurs
- Les actions des deux côtés font monter le rang, mais les **actions mutuelles** donnent **2× l'XP**
- Pas de décroissance — le rang ne baisse jamais
- Illimité en nombre d'amis

#### Actions qui génèrent de l'XP

| Action | XP solo | XP mutuel |
| --- | --- | --- |
| Partager sa streak à un ami | 15 | 30 |
| Partager son score du jour | 10 | 20 |
| Visiter le profil d'un ami | 5 | 10 |
| Jouer le même jour (détecté auto) | 20 | 20 (toujours mutuel) |
| Comparer ses stats avec un ami | 10 | 20 |
| Envoyer/relever un défi | 15 | 35 |

#### Rangs (Persona-themed)

| Rang | Nom EN | XP cumulés requis |
| --- | --- | --- |
| 1 | Stranger | 0 |
| 2 | Acquaintance | 100 |
| 3 | Companion | 250 |
| 4 | Ally | 450 |
| 5 | Confidant | 700 |
| 6 | Trusted Ally | 1 000 |
| 7 | True Ally | 1 350 |
| 8 | Bond | 1 750 |
| 9 | Unbreakable Bond | 2 200 |
| 10 | True Confidant | 2 700 |

#### Récompense rang 10 — True Confidant Badge

- Badge généré dynamiquement avec les **deux avatars côte à côte** dans un cadre fixe
- Unique par paire d'amis (badge Hamza+Léo ≠ badge Hamza+Damien)
- Stocké dans `social_link_badges` (snapshot des avatars + pseudos au moment de la génération)
- Affiché dans les badges du profil de chacun des deux joueurs

### 5.10 Titres / Rangs de joueur

Texte affiché sous le pseudo sur le profil. Débloqué par conditions de stats.

- Exemples : "Phantom Thief" (10 victoires Classic), "Wild Card" (50 victoires tous modes), "Velvet Apprentice" (Social Link rang 5)
- Traduit dans les 4 langues via la table `titles`
- Rarity : common / rare / epic / legendary selon la difficulté
- Un seul titre équipé à la fois (`profiles.equipped_title_id`)

### 5.11 RGPD — Suppression de compte

- Bouton "Delete my account" sur la page profil
- Soft delete immédiat : `users.is_deleted = TRUE`, données anonymisées
- Hard delete différé (30 jours) : suppression en cascade de toutes les tables
- Log dans `deletion_requests` pour traçabilité
- Page `/privacy` obligatoire si collecte d'emails

### 5.12 Stats globales post-partie

Après chaque partie, afficher une stat communautaire type Wordle :

- "X% of players found this character today"
- Calculé depuis `game_sessions` groupé par `(mode, played_date, target_name)`

---

## 6. Système de traduction (i18n)

### Langues cibles

- **v2.0** : `EN` (base) · `FR` · `ES` · `DE` · `IT`
- **Post-v2.0** : `JP` — repoussé, nécessite une relecture native sérieuse

### Langue de base : EN

Le projet est entièrement en anglais. `lang/en.json` est la **source de vérité**.
Les autres langues en dérivent. En cas de clé manquante : fallback `en` → clé brute.

### Architecture

| Fichier | Statut |
| --- | --- |
| `lang/en.json` | ✅ Complet — source de vérité (452 clés) |
| `lang/fr.json` | ✅ Complet (452 clés) |
| `lang/es.json` | ✅ Complet (452 clés) |
| `lang/de.json` | ✅ Complet (452 clés) |
| `lang/it.json` | ✅ Complet (452 clés) |
| `lang/jp.json` | ⏳ Post-v2.0 |

- Clés hiérarchiques : `ui.submit`, `modes.classic.hint`, `badges.ace_detective.name`…
- Variables dynamiques : syntaxe `{{variable}}` — ex: `"Found in {{count}} attempt(s)"`
- Fonction utilitaire `t('key', { vars })` — implémentée dans `js/i18n.js`
- Détection automatique langue navigateur + choix manuel sauvegardé
- Documentation complète : [lang/README.md](lang/README.md)

### Règles de traduction

- **Ne pas traduire** : noms de personnages, personas, titres de musique, opus codes (P3, P4G…), termes lore ("All-Out Attack", "Velvet Room", "Arcana")
- **Traduire** : boutons, labels, messages de jeu, règles, descriptions de badges et titres
- Toujours ajouter la clé dans `en.json` en premier, puis les autres langues
- `npm run i18n:check` — vérifie la cohérence entre tous les fichiers lang/

### Quotes du mode Classique — stratégie spécifique

Chaque personnage dans `characters_clean.js` a un champ `quote` (~200 phrases, toutes en EN).

Architecture retenue : fichier séparé `database/quotes.js` + fallback EN

```js
// database/quotes.js
export const characterQuotes = {
  "Ryuji Sakamoto": {
    en: "You're a Phantom Thief now too, right?",
    fr: null,  // pas encore traduit → fallback EN
    es: null,
    de: null
  }
  // ...
}
```

Règles :

- v2.0 : toutes les quotes restent en EN — `quotes.js` est structuré mais vide hors EN
- Post-v2.0 : sourcer les traductions FR **officielles** depuis les localisations des jeux (pas de traduction libre)
- Ne jamais inventer ou paraphraser une quote — source officielle Atlus uniquement
- `getQuote(name, lang)` retourne `quotes[name][lang] ?? quotes[name]['en']`

---

## 7. Responsive — Règles

Chaque page doit fonctionner correctement sur :

- **Mobile** : 360px et plus
- **Tablette** : 768px et plus
- **Desktop** : 1024px et plus

### Breakpoints standards à utiliser

```css
@media (max-width: 480px)  { /* mobile */         }
@media (max-width: 768px)  { /* tablette */       }
@media (max-width: 1024px) { /* petit desktop */  }
```

### Règles CSS

- Utiliser `min()`, `clamp()`, `vw`/`vh` pour les tailles fluides plutôt que des breakpoints rigides
- Grilles de résultats (mode Classic) : `overflow-x: auto` sur mobile, `grid-template-columns` adaptatif
- Éviter les largeurs fixes en `px` sur les conteneurs principaux
- Tester sur les 3 types d'écran à chaque modification CSS

---

## 8. Conventions de code

### JavaScript

- **ES6+ uniquement** : arrow functions, destructuring, template literals, `async/await`
- **Modules ES6** : `import`/`export` — ne jamais utiliser de `<script>` global pour partager du code entre modules
- Nommage : `camelCase` pour les variables/fonctions, `PascalCase` pour les classes
- Réutiliser `gameCore.js` avant de réécrire une utilité existante (date, normalisation, confetti…)
- Ne pas accumuler des `addEventListener` — toujours vérifier si un listener existe déjà avant d'en ajouter un

### CSS

- Architecture multi-fichiers : `global.css` pour le commun, un CSS par mode dans son dossier
- Pas de styles inline dans le HTML sauf pour les variables dynamiques JS
- Dark mode via classe `.darkmode` sur `<body>`
- Préfixer les animations spécifiques à un mode (ex: `p5ImpactFlash`, `tarotFlip`)

### PHP / Backend

- **PDO obligatoire** — toutes les requêtes SQL via prepared statements
- Hashage bcrypt : `password_hash($pwd, PASSWORD_BCRYPT)`
- Validation des inputs côté serveur avant toute requête BDD
- Structure REST : `GET /api/user/:id`, `POST /api/auth/login`, etc.
- Retourner du JSON propre avec codes HTTP corrects (200, 201, 400, 401, 403, 404, 500)

### Commentaires

- Commenter les logiques non évidentes (ex : système de cache LRU, anti-race token, DST handling)
- Ne pas commenter ce qui est évident (`// increment counter` → inutile)
- En-tête de fichier décrivant le rôle du module (voir `gameCore.js` comme modèle)

---

## 9. Documentation des mises à jour

> **Règle absolue** : tout ajout, correction ou modification notable **doit être documenté** dans `PersonaDLE_Update_Documentation/PersonaDLE 2.0/`.

### Format à respecter (même style que v1.0 et v1.1)

Fichier principal : `PersonaDLE_Update_Documentation/PersonaDLE 2.0/PersonaDLE_Update.md`

Structure d'une entrée :

```markdown
## 🏷️ Titre de la fonctionnalité *(vX.X.X)*

Description concise de ce qui a été ajouté/modifié/corrigé.

### Détails techniques (si pertinent)
- Ce qui a changé
- Pourquoi (bug, amélioration, nouvelle feature)
- Code snippet si la logique est non triviale
```

Fichier de notes rapides : `PersonaDLE_Update_Documentation/PersonaDLE 2.0/note_ajout.md`

- Notes informelles, rappels, TODO liés à la version

---

## 10. Tests

- Framework : **Vitest** (`npm test` ou `npm run test:watch`)
- `tests/gameCore.test.js` — 102 tests (logique de jeu, dates, streaks, filtres, normalisation…)
- `tests/backend.test.js` — 18 tests (buildGameSession, savePendingSession offline/online, migration payload, auth UI DOM)
- **Total : 120 tests, tous passants**
- À chaque nouvel utilitaire dans `gameCore.js` → ajouter les tests correspondants
- `savePendingSession` est async (fire-and-forget côté appelant) — les callers sont des event handlers non-async, c'est voulu
- Pour le backend PHP : tests manuels via curl ou Postman (voir les exemples dans `setup.sh`)
- Si les tests existants deviennent incompatibles avec un changement d'architecture → les adapter, ne pas les supprimer

---

## 11. Fonctionnalités en place (ne pas recoder)

| Fonctionnalité | Fichier clé | Statut |
| --- | --- | --- |
| Reset quotidien Paris (DST-safe) | `js/gameCore.js` | ✅ Stable |
| Système de filtres opus | `js/filterMenu.js` | ✅ Stable |
| Autocomplete avec portraits | chaque `mode*.js` | ✅ Stable |
| Cache LRU GIFs | `allOutAttackMode/modeAllOutAttack.js` | ✅ Stable |
| Profil + avatar (canvas crop) | `profile/profile.js` | ✅ Stable |
| Badges + codes événement | `profile/badges/badgesManager.js` | ✅ Stable |
| Stats + streaks | `profile/profileStats.js` | ✅ Stable |
| Dark mode / Colorblind | `js/gameCore.js` | ✅ Stable |
| Son victoire / boutons | `assets/sound_effect/` | ✅ Stable |
| Export/Import profil JSON | `profile/profile.js` | ✅ Stable |

---

## 12. Ce qu'il reste à construire (roadmap v2.0)

### Backend & BDD

- [x] Schéma BDD MySQL 8.0 / MariaDB 10.6+ — 16 tables (`sql/bdd_mysql.sql`)
- [x] API REST PHP — auth (register, login, logout, me)
- [x] API REST PHP — sessions (`POST /api/sessions` avec calcul streaks)
- [x] API REST PHP — user (GET/PATCH/DELETE `/api/user/:id`, stats, migrate)
- [x] Système de comptes (inscription, connexion, sessions PHP httpOnly)
- [x] Migration localStorage → BDD (`api/user/migrate.php`, idempotent)
- [x] Sync automatique offline-first (`savePendingSession` → API ou fallback localStorage)
- [x] RGPD — soft delete + anonymisation immédiate + log `deletion_requests`
- [ ] Déploiement BDD MariaDB chez Hostinger
- [ ] Script cron `daily_targets` (génération personnage du jour côté serveur)
- [ ] Script cron `leaderboard_cache` (recalcul périodique classements)
- [ ] RGPD — job hard delete J+30 (côté serveur, cron)

### Social & Profil

- [x] Leaderboard — page HTML + CSS + JS (filtres mode/période/métrique, pagination, filter note)
- [x] API `/api/leaderboard` — requêtes directes user_stats + game_sessions, `my_rank` dans réponse
- [x] Système d'amis — page HTML + CSS + JS (liste, demandes, recherche, add by code)
- [x] API `/api/friends` — GET/POST/PATCH/DELETE, online dots, `last_seen_at`
- [ ] Social Link — XP, rangs 1-10, interactions mutuelles
- [ ] True Confidant Badge — génération dynamique au rang 10
- [ ] Titres/rangs joueur — déblocage automatique + équipement
- [ ] Page de profil publique (dynamique ou image statique)
- [ ] Stats globales post-partie ("X% of players found this character today")
- [ ] Badges → backend (conditions vérifiées côté serveur, unlock via API)
- [ ] Wallpapers → backend (même logique que badges, table `wallpapers_unlocked`)
- [ ] Comparaison stats amis côte à côte (sur la page Friends)
- [ ] Défis entre amis — envoyer/relever un défi quotidien

### i18n

- [x] `lang/en.json` — 452 clés, source de vérité
- [x] `lang/fr.json` — traduction complète synchronisée
- [x] `lang/es.json` — traduction complète synchronisée
- [x] `lang/de.json` — traduction complète synchronisée
- [x] `lang/it.json` — traduction complète synchronisée (ajout hors scope initial)
- [x] `scripts/check-i18n.js` + `npm run i18n:check`
- [x] `js/i18n.js` — `setLang()`, `t()`, `initLang()`, fallback EN, `window.i18n`
- [x] `data-i18n` intégré : `index.html` (profil complet, news, footer, titre) + 6 modes (titre + placeholder)
- [x] Sélecteur de langue : bouton `🌐 EN ▼` + dropdown animé + illustration décorative (bas-droite page)
- [x] Détection automatique langue navigateur au premier chargement
- [x] Boutons localisés (Hint, Give-Up, Replay, Submit) — assets WebP par langue, `updateLangButtons()` câblé dans `setLang()`
- [x] `database/quotes.js` structuré (EN uniquement pour v2.0)
- [x] Messages d'erreur JS traduits (`alert()` dans AllOutAttack)

### Frontend & Qualité

- [ ] Audit responsive complet (mobile 360px → desktop)
- [ ] Extension de la couverture de tests

---

## 13. Pièges connus & décisions techniques passées

| Problème | Solution retenue |
| --- | --- |
| Listeners autocomplete empilés à chaque filtre | Mutation en place (`personas.length = 0; personas.push(...)`) + init unique |
| Focus listener rechargement intempestif (Emoji) | Supprimé — `visibilitychange` seul, avec vérification de date |
| DST Paris mal géré | `Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris' })` |
| Dark mode + inversion couleurs logos opus | Fond coloré semi-transparent par jeu (pas de `filter: invert`) |
| GIFs All-Out Attack → saturation mémoire | Cache LRU max 20 + preload 5 suivants |
| Grille Classic déborde < 1024px | `overflow-x: auto` + nouveau breakpoint 901–1024px |
| `rank` est un mot réservé MySQL 8.0 (window function) | Toujours entourer de backticks : `` `rank` `` dans CREATE TABLE, INSERT, CHECK, VIEW |
| Apache 403 après chmod | `chmod o+x /home/pchamza` — www-data doit pouvoir traverser le home |
| Apache 404 malgré AllowOverride dans la conf | Apache résout le symlink → AllowOverride doit être sur le **vrai chemin** ET le chemin symlinké (deux blocs `<Directory>` dans la conf) |
| CORS avec `credentials: 'include'` | Wildcard `*` interdit — utiliser une whitelist d'origines exactes + `Access-Control-Allow-Credentials: true` |
| Import circulaire `gameCore.js` ↔ `api.js` | Bridge `window._personadleApi` — même pattern que `window.i18n` |
| `savePendingSession` async mais callers non-async | Fire-and-forget voulu — les callers sont des event handlers, le jeu ne doit pas attendre la fin de l'appel réseau |

---

## 14. Commandes utiles

```bash
# Lancer les tests
npm test

# Mode watch (relance à chaque sauvegarde)
npm run test:watch

# Vérifier les clés i18n manquantes
npm run i18n:check

# Installer le backend en local (première fois seulement)
# Crée la BDD MySQL, l'utilisateur, importe le schéma, configure Apache
bash setup.sh

# Pas de build — ouvrir directement index.html dans un navigateur
# ou via Live Server (VSCode)
# En local avec backend : http://localhost/personadle/
```

---

*Ce document doit rester à jour. Toute décision d'architecture majeure prise en cours de développement doit y être ajoutée.*

---

## 15. Comportement attendu de Claude Code — Rôle de Mentor

> Règle explicitement demandée par Hamza (session avril 2026).

Claude Code doit se comporter comme un **mentor technique**, pas uniquement comme un exécutant.

### Ce que cela implique :

- **Critiquer les choix si nécessaire** : si une décision technique a des problèmes évidents (performance, maintenabilité, sécurité, UX), les signaler avant de coder, même si l'utilisateur ne l'a pas demandé.
- **Proposer une alternative si elle est clairement meilleure** : ne pas imposer, mais expliquer pourquoi l'alternative est préférable et laisser l'utilisateur décider.
- **Poser des questions avant de coder** sur les tâches importantes : s'assurer de comprendre l'intention réelle, pas juste la demande de surface.
- **Dire "je ne suis pas sûr que ce soit la bonne approche" quand c'est le cas**, plutôt que d'exécuter aveuglément.
- **Expliquer les décisions non évidentes** prises pendant le développement (ex : pourquoi un pattern plutôt qu'un autre).

### Ce que cela ne signifie PAS :

- Ne pas remettre en cause chaque ligne ou chaque choix cosmétique.
- Ne pas surcharger les réponses d'avertissements inutiles.
- Ne pas bloquer le travail — si l'utilisateur confirme sa décision après avoir entendu la critique, l'exécuter sans résistance.

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"` to keep the graph current
