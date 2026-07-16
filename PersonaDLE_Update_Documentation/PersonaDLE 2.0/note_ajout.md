# PersonaDLE v2.0 — Notes techniques pour les développeurs

> Document destiné aux **développeurs qui maintiennent le site**. Contient tout ce qu'il faut savoir pour comprendre ce qui a changé, où, pourquoi, et ce qu'il ne faut pas toucher sans raison.

---

## Sommaire

1. [Décisions d'architecture actées](#1-décisions-darchitecture-actées)
2. [CSS — du monolithe aux fichiers par mode](#2-css--du-monolithe-aux-fichiers-par-mode)
3. [Système de traduction i18n](#3-système-de-traduction-i18n)
4. [Modules JavaScript partagés](#4-modules-javascript-partagés)
5. [Système de filtres](#5-système-de-filtres)
6. [Mode Musique — lecteur & tracks](#6-mode-musique--lecteur--tracks)
7. [Backend PHP & Base de données](#7-backend-php--base-de-données)
8. [Système Social](#8-système-social)
9. [Leaderboard](#9-leaderboard)
10. [Titres, Badges & Récompenses](#10-titres-badges--récompenses)
11. [Profil Utilisateur](#11-profil-utilisateur)
12. [Panneau Admin](#12-panneau-admin)
13. [CI/CD & Infrastructure](#13-cicd--infrastructure)
14. [Sécurité](#14-sécurité)
15. [Tests](#15-tests)
16. [Pièges connus & anti-patterns](#16-pièges-connus--anti-patterns)

---

## 1. Décisions d'architecture actées

Ces décisions ont été prises délibérément. Ne pas les remettre en question sans bonne raison.

### Frontend — Vanilla JS uniquement

Aucun framework (React, Vue, Svelte…). Tout en HTML5 / CSS3 / JavaScript ES6+ natif avec modules ES6 (`import`/`export`). Cette contrainte est volontaire : zéro build step, zéro dépendance NPM en prod, déploiement par simple upload FTP sur Hostinger.

### Backend — PHP 8.3 vanilla + PDO

**Pas Laravel, pas Symfony.** PHP vanilla avec PDO et requêtes préparées partout. Raison : Hostinger shared hosting (pas de Composer en prod facilement, pas de CLI artisan). Toutes les requêtes BDD passent **obligatoirement** par des prepared statements — jamais de concaténation SQL.

### Auth — Sessions PHP httpOnly, pas JWT

Les sessions PHP suffisent, sont plus simples à révoquer (côté serveur), et n'exposent pas de token dans le JS. Cookie `PHPSESSID` httpOnly + `remember_me` SHA-256 en BDD pour la persistance longue durée.

### Target quotidienne — seed déterministe côté client

`parisDateKey()` dans `js/gameCore.js` génère la clé du jour à Paris. Chaque joueur a sa propre cible générée localement par seed sur la liste de personnages — il n'y a **pas** de cible commune côté serveur. Conséquence : la stat communautaire "X% of players found this character today" a été abandonnée (incompatible avec les cibles personnalisées par navigateur).

### Offline-first

`savePendingSession()` dans `js/gameCore.js` est un **fire-and-forget** intentionnel. Si l'API est inaccessible, la session est mise en queue dans `localStorage` (`pendingSessions`). `api.js syncPending()` tente de vider la queue à chaque reconnexion. Les callers sont des event handlers non-async — c'est voulu, le jeu ne doit pas bloquer sur un appel réseau.

### Hébergement — Hostinger shared

MySQL 8.0 en local pour le développement, MariaDB 10.6+ en prod Hostinger. Les schémas sont compatibles mais attention : `IF NOT EXISTS` sur `ADD COLUMN` est une extension MariaDB — en local MySQL 8.0, utiliser `ADD COLUMN` sans condition.

---

## 2. CSS — du monolithe aux fichiers par mode

### Avant v2.0

Un seul fichier `css/style.css` de 2000+ lignes contenant les styles de tous les modes. Tout était couplé.

### Architecture actuelle

```text
css/
├── global.css          ← Reset, typo, dark mode, confetti, modales, bottomNav, toasts
├── index.css           ← Page d'accueil uniquement (boutons de mode, animations hover)
├── filterMenu.css      ← Panneau de filtres collapsible (partagé entre tous les modes)
├── bottomNav.css       ← Barre de navigation fixe en bas
├── langSelector.css    ← Sélecteur de langue (dropdown animé)
├── settings-modal.css  ← Modale préférences animations
├── calling-card.css    ← Export profil PNG (html2canvas)
├── challenge-banner.css← Bandeau défi actif en jeu
├── challenge-result.css← Overlay victoire/défaite sur défi
├── challenge-notif.css ← Notifications défis hors-jeu
├── p3-evoker-anim.css  ← Animation Evoker P3 (demandes d'amis)
├── streak-recovery.css ← Menu Jack Frost récupération streak
├── stats-compare.css   ← Overlay comparaison stats amis
├── rank10-effect.css   ← Halo + burst True Confidant rang 10
└── tv-friend-anim.css  ← Animation TV Persona 4 (demandes d'amis)

classiqueMode/classique.css
emojiMode/emoji.css
silhouetteMode/silhouette.css
musicsMode/music.css
personaeMode/personae.css
allOutAttackMode/allOutAttack.css

profile/
├── profile-page.css    ← Styles communs aux pages profil (header, diamonds, etc.)
├── badges/badges.css
├── friends/friends.css
└── leaderboard/leaderboard.css

admin/admin.css
```

**Règle** : chaque page ne charge que `global.css` + son propre CSS. Ne jamais mettre de styles spécifiques à un mode dans `global.css`.

### Dark Mode

Via la classe `.darkmode` sur `<body>`, toggleée par `js/gameCore.js`. Le localStorage key est `'darkMode'`. Pas de `prefers-color-scheme` — c'est un choix délibéré pour rester simple.

Les logos d'opus dans le panneau de filtres utilisent un fond semi-transparent coloré (`.filter-color-p3`, etc.) plutôt que `filter: invert()` — l'inversion cassait les couleurs de jeu (ex: rouge P5 → bleu).

### Breakpoints standardisés

```css
@media (max-width: 480px)  { /* mobile 360px+ */ }
@media (max-width: 768px)  { /* tablette */       }
@media (max-width: 1024px) { /* petit desktop */  }
```

`min()`, `clamp()`, `vw/vh` pour les tailles fluides. Le logo d'accueil : `width: min(1200px, 95vw)` — ne jamais remettre `width: 1200px` fixe.

---

## 3. Système de traduction i18n

### Architecture

```text
lang/
├── en.json   ← SOURCE DE VÉRITÉ — 760 clés — toujours complet
├── fr.json   ← 760 clés
├── es.json   ← 760 clés
├── de.json   ← 760 clés
└── it.json   ← 760 clés

js/i18n.js    ← setLang(), t(), initLang(), applyToDOM(), updateLangButtons()
```

**Règle absolue** : ajouter la clé dans `en.json` EN PREMIER, puis dans les 4 autres. Vérifier avec `npm run i18n:check`.

### Fonctions clés

```js
// Récupère une traduction avec interpolation
window.i18n.t('modes.classic.hint_label')           // → "Hint"
window.i18n.t('challenge.result', { name: 'Ryuji' }) // → "Ryuji beat you!"

// Changer la langue (sauvegarde + re-render DOM)
window.i18n.setLang('fr')

// Initialiser (fetch en.json + lang actuelle + appliquer au DOM)
await initLang()  // retourne une Promise
```

### Le piège `t(key) ?? fallback`

**NE PAS FAIRE :**

```js
const label = window.i18n.t('some.key') ?? 'Default';
// FAUX — t() retourne la clé brute (string truthy) si la clé n'existe pas
// ?? ne se déclenche jamais même quand la clé est absente
```

**FAIRE :**

```js
const r = window.i18n?.t?.('some.key');
const label = (r != null && r !== 'some.key') ? r : 'Default';
// OU plus court :
const label = window.i18n.t('some.key') || 'Default';
// (marche si la clé absente retourne '' via le helper local tf())
```

Pattern utilisé dans `friends.js` : `tf(key, fallback)` helper local.

### Boutons localisés (assets WebP)

Les boutons Hint/Give-Up/Submit/Replay existent en 5 langues dans `assets/buttons/EN/`, `FR/`, `ES/`, `DE/`, `IT/`. La fonction `updateLangButtons(lang)` dans `i18n.js` met à jour les `src` de ces images. Les anciens fichiers racine (`Hint_button.webp`, etc.) ont été supprimés — ne pas les recréer.

### Quotes personnages

`database/quotes.js` contient les répliques par personnage, structure multilingue. Pour v2.0, seul `en` est rempli — les autres langues ont `null` avec fallback vers EN. **Ne jamais inventer ou paraphraser une quote** — source officielle Atlus uniquement.

---

## 4. Modules JavaScript partagés

### `js/gameCore.js` — fonctions communes à tous les modes

Toujours vérifier si une fonction utilitaire existe ici avant d'en écrire une nouvelle.

| Fonction | Rôle |
| :--- | :--- |
| `parisDateKey()` | Date courante à Paris (DST-safe via `Intl.DateTimeFormat`) |
| `msUntilNextParisMidnight()` | Millisecondes jusqu'au prochain minuit Paris |
| `normalize(str)` | Lowercase + strip accents latins NFD + trim (Katakana préservé) |
| `buildGameSession(mode, result)` | Construit l'objet session à envoyer à l'API |
| `savePendingSession(session)` | Fire-and-forget : tente l'API, sinon queue localStorage |
| `showConfettiExplosion()` | Animation confettis victoire |
| `FILTER_STORAGE_KEYS` | Map `mode → localStorage key` pour les filtres actifs |

**`normalize()` et le NFD** : `"José".normalize("NFD")` décompose `é` en `e + U+0301` puis `replace(/[̀-ͯ]/g, '')` retire le combining mark. Les caractères Katakana japonais (ex: `ジ` = `シ + U+3099` dakuten) décomposent aussi sous NFD, mais U+3099 est **hors** de la plage U+0300–U+036F — ils ne sont donc pas altérés. Ne jamais élargir la plage de strip sans test.

### `js/api.js` — client REST

Couche d'abstraction sur `fetch`. Exporte `window._personadleApi` (bridge global pour éviter les imports circulaires avec `gameCore.js`).

```js
// Utilisation
const api = window._personadleApi;
await api.auth.login(email, password);
await api.user.getProfile(userId);
await api.stats.syncPending();       // fire-and-forget, vide la queue localStorage
await api.friends.list();
await api.leaderboard.get({ mode, period, metric, scope, page });
```

**Détection dev/prod automatique** : `IS_LOCAL` basé sur `window.location.hostname`. Les URLs d'API sont relatives (`/api/...`) en prod, préfixées en local.

**409 sur syncPending** : une 409 signifie "session déjà enregistrée côté serveur" → `continue` silencieux dans la boucle (pas `return` qui arrêterait la queue). Les autres erreurs accumulent dans `remaining[]` pour retry.

### `js/auth.js` — UI auth

Gère les modales login/register et les états connecté/déconnecté. Dispatch des événements custom après résolution :

```js
window.dispatchEvent(new Event('personadle:auth-ready'));   // init terminée
window.dispatchEvent(new Event('personadle:auth-login'));   // connexion réussie
window.dispatchEvent(new Event('personadle:auth-logout'));  // déconnexion
```

Écouter ces événements (et non `DOMContentLoaded`) pour toute logique qui dépend de l'état auth.

`window._currentUser` contient le profil connecté ou `null`. `window._authReady` est une Promise résolue après `initAuth()`.

**Important** : à chaque login/register, `localStorage.removeItem('_crInitDone')` est appelé pour reset l'animation de résultat de défi (elle ne doit pas se rejouer lors d'un changement de compte).

### `js/cloud-sync.js` — sync cloud ↔ localStorage

`pullProfileFromCloud()` est la **source de vérité** : elle écrase tout le localStorage depuis le backend (pseudo, lang, avatar, wallpaper, badges, titres, stats, settings). Ne jamais appeler avant `await syncPending()` — les sessions en attente doivent être envoyées avant d'écraser les stats locales.

```js
// Pattern correct dans profile-page.js :
await api.stats.syncPending();
await pullProfileFromCloud();
```

`window._onCloudSync` est un hook que la page profil peut brancher pour re-render l'UI après sync sans rechargement.

### `js/bottomNav.js` — navigation fixe

Calcule automatiquement les hrefs relatifs selon la profondeur de la page courante :

- Racine (`/index.html`) → `base = './'`
- 1 niveau (`/profile/profile.html`) → `base = '../'`
- 2 niveaux (`/profile/friends/friends.html`) → `base = '../../'`

La logique `isDeepSubpath` dans `buildHrefs()` couvre `profile/friends/` et `profile/leaderboard/`. Si tu ajoutes un autre sous-dossier à 2 niveaux, l'ajouter dans cette condition.

---

## 5. Système de filtres

### Point d'entrée — `js/filterMenu.js`

```js
import { initFilterMenu } from '../../js/filterMenu.js';

const { getActive } = initFilterMenu(
  'filters_Classic',   // clé localStorage pour persister la sélection
  ALL_OPUS,            // array de tous les opus supportés par ce mode
  (activeOpus) => {    // callback appelé à chaque changement
    filterCharacterPool();
    resetGame();
  }
);
```

`getActive()` retourne `string[]` des codes opus actuellement actifs.

### `ALL_OPUS` par mode

| Mode | Différences notables |
| :--- | :--- |
| Classic / Emoji / Silhouette | P3R, P4AU, P4D, P5S, P5T, P5X inclus |
| Musique | P3R inclus, P4AU inclus depuis v2.0 |
| Personae | P4AU inclus depuis v2.0 |
| All-Out Attack | P3, P5, P5X uniquement |

**Important** : si tu ajoutes un opus dans `ALL_OPUS`, il faut aussi l'ajouter dans `filterMenu.js` (mapping logo + couleur + sous-filtres). Sans ça, le bouton est ignoré silencieusement (log de warning dans la console).

### `_migrate()` — migration format ancien

L'ancien format stockait un code générique (`"P5"`) là où le nouveau stocke les codes précis (`["P5","P5R","P5S","P5T"]`). `_migrate()` convertit automatiquement.

**Piège critique** : l'expand de `"P5"` → sous-codes ne doit se faire que si **aucun** sous-code n'est déjà présent dans le tableau sauvegardé. Si `["P5","P5R"]` est en localStorage, `"P5"` ne doit PAS être expandé en ajoutant `P5S` et `P5T` — l'utilisateur a fait une sélection précise.

```js
// Vérification correcte dans _migrate()
const shouldExpand = LEGACY_EXPAND[code] && !children.some(c => saved.includes(c));
```

### Guard pool vide

Chaque callback `onFilterChange` commence par :

```js
if (newActive.length === 0) return; // Évite un crash si l'utilisateur décoche tout
```

Sans ce guard, `pickCharacter()` peut crasher ou boucler indéfiniment.

### Filtres de défi

Quand un défi est accepté, les filtres opus de l'expéditeur sont sauvegardés dans `activeChallenge.originalFilters` et restaurés après résolution. Ne jamais effacer `activeChallenge` sans avoir appelé `checkChallengeCompletion()` d'abord.

---

## 6. Mode Musique — lecteur & tracks

### Architecture du lecteur audio

Le lecteur est entièrement CSS custom (style Persona 5 — fond dégradé sombre, cercle vinyle animé, boutons SVG). Fichiers clés :

- `musicsMode/musics.html` — structure HTML du lecteur
- `musicsMode/music.css` — styles + thèmes de couleur par opus
- `musicsMode/modeMusic.js` — logique (lecture, guess, filtres, skip, replay)

### Thèmes de couleur dynamiques par opus

Chaque opus a un thème de couleur CSS défini via data-attributes :

```js
const OPUS_THEMES = {
  P3: { primary: '#1a6ab1', secondary: '#5fb0f0', bg: '#05192e' },
  P5: { primary: '#e8001e', secondary: '#ff4060', bg: '#1a0005' },
  // etc.
};
```

Quand une piste joue, son `image` correspond à une pochette dans `musicsMode/database/img/` (ex: `P5R.webp`). Le thème est appliqué via CSS variables sur `.audio-wrapper`.

### Base de données musicale

```text
musicsMode/database/
├── musicDatabase.js   ← Array complet des tracks (130+ pistes)
└── img/               ← Pochettes opus (P1.webp, P2IS.webp, P3R.webp, P4AU.webp, P5T.webp…)
```

Structure d'une track :

```js
{
  title:   "Last Surprise",
  artist:  "Lyn Inaizumi",
  opus:    "P5",
  image:   "P5.webp",          // Fichier dans database/img/
  file:    "last_surprise.mp3" // Fichier audio (non inclu dans le dépôt)
}
```

### Nouvelles pistes ajoutées en v2.0

13 tracks ajoutées lors de la session 2026-05-13/14 :

| Titre | Artiste | Opus |
| :--- | :--- | :--- |
| Danger Zone | (instrumental) | P3P |
| Time | Mayumi Fujita | P3P |
| Want to Be Close -Reload- | Azumi Takahashi | P3R |
| A Fool or Clown? | (instrumental) | P4AU |
| Best Friends | Yumi Kawamura | P4AU |
| Break Out Of | Shihoko Hirata, Lotus Juice | P4AU |
| I'll Face Myself -Battle- | (instrumental) | P4G |
| Throw Away Your Mask | Lyn Inaizumi | P5R |
| Axe to Grind | Lyn Inaizumi | P5S |
| Counter Strike | Lyn Inaizumi | P5S |
| Got Your Tail | Lyn Inaizumi | P5T |
| Revolution is a Blade | Lyn Inaizumi | P5T |
| Truth or Dare | Lyn Inaizumi | P5T |

P4AU et P5T ont également été ajoutés aux filtres (boutons + logos + couleurs).

### `debugAllMusic()` — outil développeur

Cette fonction (exportée dans `modeMusic.js`) liste toutes les tracks avec leurs métadonnées dans la console. Elle n'est **pas** auto-appelée (l'appel automatique a été supprimé car il polluait la console en prod). Pour l'utiliser en développement :

```js
import('/musicsMode/modeMusic.js').then(m => m.debugAllMusic())
```

Même chose pour `debugAllPersonae()` dans `personaeMode/modePersonae.js`.

---

## 7. Backend PHP & Base de données

### Structure des endpoints

```text
api/
├── bootstrap.php         ← CORS, session, PDO singleton, helpers JSON, requireAuth()
├── config.php            ← Identifiants BDD (gitignored)
├── config.example.php    ← Template (commiter ce fichier, pas config.php)
├── auth/
│   ├── register.php      ← POST /api/auth/register
│   ├── login.php         ← POST /api/auth/login (+ rate limiting 5/15min)
│   ├── logout.php        ← POST /api/auth/logout
│   └── me.php            ← GET /api/auth/me (vérifie is_banned)
├── sessions.php          ← POST /api/sessions (enregistrer une partie + calcul streaks)
├── user/
│   ├── index.php         ← GET/PATCH/DELETE /api/user/:id
│   ├── stats.php         ← GET /api/user/:id/stats
│   ├── migrate.php       ← POST /api/user/migrate (localStorage → BDD, idempotent)
│   ├── compare.php       ← GET /api/user/compare?with=ID (stats + XP Social Link)
│   └── recover-streak.php← POST /api/user/recover-streak (Jack Frost, cooldown 2 mois)
├── friends/index.php     ← GET/POST/PATCH/DELETE /api/friends
├── messages/index.php    ← GET/POST/PATCH/DELETE /api/messages (défis, XP auto)
├── social-links/index.php← GET/POST /api/social-links
├── leaderboard/index.php ← GET /api/leaderboard
├── badges/index.php      ← GET/POST /api/badges (unlock vérifié côté serveur)
├── titles/index.php      ← GET/POST /api/titles
├── wallpapers/index.php  ← GET/POST /api/wallpapers
├── community-stats.php   ← GET /api/community-stats
└── admin/
    ├── user_stats.php    ← Admin : stats utilisateurs
    └── event_codes.php   ← Admin : CRUD codes événement
```

### Ajouter un nouvel endpoint dans un sous-dossier

**Chaque fichier PHP dans `api/user/`, `api/admin/`, etc. nécessite sa propre `RewriteRule` dans le `.htaccess` du sous-dossier.** Sans ça : 404 immédiat. Exemple pour `api/user/mon-endpoint.php` :

```apache
# Dans api/user/.htaccess
RewriteRule ^mon-endpoint$ mon-endpoint.php [L,QSA]
```

Ne jamais oublier cette étape à chaque nouvel endpoint.

### PDO — règles obligatoires

```php
// BIEN
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$userId]);

// MAL — jamais faire ça
$result = $pdo->query("SELECT * FROM users WHERE id = $userId");
```

**Paramètre nommé répété** : MySQL PDO ne supporte pas `:param` utilisé plusieurs fois dans le même `prepare()`. Utiliser des `?` positionnels avec `execute([$val, $val, $val])`.

### Schema BDD — 20 tables

Les tables sont définies dans `sql/bdd_mysql.sql`. Toujours vérifier `sql/explication.md` pour le contexte de chaque table.

Tables principales :

- `users` — compte (email, pseudo, friend_code, is_banned, is_admin, is_deleted)
- `profiles` — données profil (avatar_data, border_color, wallpaper_id, profile_music_id, selected_badges, equipped_title_id)
- `user_stats` — stats par mode (wins, giveups, games, streak, streak_record, perfect_wins, total_time_ms)
- `game_sessions` — historique des parties (mode, played_date, target_name, result, attempts, time_ms, active_filters)
- `friendships` — relations d'amitié (status: pending/accepted/blocked)
- `social_links` — rang et XP Social Link entre deux amis
- `messages` — défis quotidiens et messages entre amis
- `leaderboard_cache` — cache précalculé par cron

**`rank` est un mot réservé MySQL 8.0** (window function). Toujours entourer de backticks : `` `rank` ``.

### Migrations

Les migrations sont dans `api/migrations/`. Numérotées `001_`, `002_`, etc. Pour appliquer en local :

```bash
mysql -u root -p personadle < api/migrations/011_moderation.sql
```

Pour Hostinger, via SSH :

```bash
ssh hostinger-personadle
mysql -u u870779941_Hamza -p u870779941_personadle < migration.sql
```

**Ne jamais importer une procédure stockée via PhpMyAdmin** (erreur `DELIMITER`). Toujours utiliser le CLI MariaDB avec `--delimiter='$$'` ou SSH direct.

---

## 8. Système Social

### Architecture friends — `profile/friends/friends.js`

La page friends est à `profile/friends/friends.html` (sous-dossier, 2 niveaux de profondeur). Tous les imports JS/CSS partent de `../../`.

Fonctionnalités implémentées :

- Recherche par pseudo ou code ami (8 chars alphanumériques)
- Envoyer/accepter/refuser/supprimer une demande d'ami
- "Browse Players" : liste paginée de tous les joueurs
- Dot online (seuil : `ONLINE_THRESHOLD_MS = 30 * 60 * 1000` ms)

**XP Social Link** : ne jamais déclencher l'XP sur un clic de bouton. L'XP est un effet secondaire automatique d'une **vraie action** :

- Visite de profil → appel `gainSocialLinkXp` au load de la page
- Comparaison stats → endpoint `/api/user/compare` déclenche l'XP côté serveur

### Animations de demandes d'amis — 3 styles

Configurable via `personaSettings.anim_friend_request_style` (localStorage) :

| Valeur | Style | Fichier CSS/JS |
| :--- | :--- | :--- |
| `'calling_card'` | Carte manuscrite Phantom Thieves | `css/calling-card.css`, `js/calling-card.js` |
| `'p4_tv'` | Animation TV Persona 4 (CSS pur) | `css/tv-friend-anim.css`, `js/tv-friend-anim.js` |
| `'p3_evoker'` | Animation Evoker Persona 3 | `css/p3-evoker-anim.css`, `js/p3-evoker-anim.js` |

Le sélecteur est dans `js/settings-modal.js`. Le guard `_settingsListenerBound` évite l'empilement de listeners si `initSettingsModal()` est appelé plusieurs fois.

### Social Link — rangs 1-10

Système symétrique : le rang est partagé entre les deux joueurs. La procédure stockée `gain_social_link_xp` dans MariaDB gère l'XP mutuel (×2 si les deux ont fait l'action le même jour).

Les rangs sont dans la table `social_link_ranks` :

| Rang | Nom | XP cumulés |
| :--- | :--- | :--- |
| 1 | Stranger | 0 |
| 5 | Confidant | 700 |
| 10 | True Confidant | 2700 |

**Rang 10 — True Confidant** : halo doré pulsant + animation burst 8 particules + typewriter "✦ True Confidant" à chaque visite du profil. Implémenté dans `css/rank10-effect.css` + `applyRank10Effect()` dans `js/social-link.js`.

### Défis quotidiens

Flux complet :

1. A envoie un défi depuis la page amis → `POST /api/messages` avec `type=challenge`, `challenge_mode`, filtres actifs
2. B voit le bandeau défi via `js/challenge-banner.js` (vérifie `activeChallenge` au chargement du mode correct)
3. B joue — si victoire ou give-up : `checkChallengeCompletion(isWin)` est appelé
4. A voit l'animation résultat (win/loss) au prochain chargement d'une page non-jeu via `notifications.js`

**`checkChallengeCompletion()` doit être appelé sur give-up aussi.** Si tu modifies un mode, vérifier que l'appel est hors du bloc `if (!force)` avec `isWin = !force`.

### Notifications hors-jeu — `js/notifications.js`

Polling toutes les `POLL_INTERVAL_MS = 60 000` ms. Vérifie les résultats de défis dans une fenêtre de `CHALLENGE_RESULT_CUTOFF_MS = 48 * 60 * 60 * 1000` ms.

`_crInitDone` est namespaced par user_id (`_crInitDone_${me.id}`) pour éviter que l'animation soit rejouée lors d'un changement de compte.

### Streak Recovery — Jack Frost

`js/streak-recovery.js` + `api/user/recover-streak.php`. Cooldown 2 mois côté serveur. Le bouton "🔥 Restore" apparaît dans les stats du profil quand `streak === 0 && canRecover()`.

---

## 9. Leaderboard

La page est à `profile/leaderboard/leaderboard.html` (2 niveaux de profondeur).

### API

```text
GET /api/leaderboard?mode=classic&period=week&metric=wins&scope=global&page=1
```

Paramètres valides :

- `mode` : `all | classic | emoji | silhouette | alloutattack | personae | music`
- `period` : `ever | month | week | day`
- `metric` : `wins | winrate | streak | perfect | games`
- `scope` : `global | friends` (friends nécessite auth)
- `page` : entier ≥ 1

Réponse : `{ rows: [...], my_rank: { rank, score } }`. `my_rank` est toujours inclus même si l'utilisateur est hors de la page affichée.

### Cron de recalcul

`api/cron/leaderboard.php` recalcule `leaderboard_cache` périodiquement. À configurer dans le panel Hostinger (tâche cron). Tournait déjà en local via `crontab`.

### `friend_code` masqué

Le leaderboard est public (pas de `requireAuth`). `friend_code` n'est retourné que si l'utilisateur est authentifié (`$myId > 0`) pour éviter le scraping des codes d'amis.

---

## 10. Titres, Badges & Récompenses

### Titres

Catalogue dans la table `titles` (11 titres actifs). Débloqués par conditions vérifiées **côté serveur** dans `api/titles/index.php` → `verifyTitleCondition()`.

Types de conditions : `wins_total`, `mode_wins`, `streak_record`, `social_link_rank_10`, etc.

Titre spécial `joker_looking_cool` : condition `joker_profile` = équiper le thème All-Out Attack + une des 4 musiques P5 signature. Marqué `is_hidden: true` — n'apparaît pas dans le catalogue avant déblocage.

Un seul titre équipé à la fois (`profiles.equipped_title_id`).

### Badges — 60 badges, 4 catégories

Catalogue dans la table `badges`. Déblocage vérifié côté serveur dans `api/badges/index.php` → `verifyBadgeCondition()`.

**Piège race condition** : `syncBadgesWithBackend()` est async fire-and-forget. `renderBadgesModal()` était appelé avant la fin du fetch. Fix : appeler explicitement `renderBadgesPreview()` + `renderBadgesModal()` **dans** le callback du fetch, après l'ajout des nouveaux badges.

Les sélections de badges (max affichés sur le profil) sont dans `profiles.selected_badges` (JSON array de slugs). Chaque slug validé côté serveur avec `[a-z0-9_-]{1,100}`.

### Wallpapers — 7 disponibles

Dans la table `wallpapers`. Les wallpapers avec `is_default = true` sont libres. Les autres nécessitent un unlock (conditions serveur dans `canUnlockWallpaper()`).

### Codes événement

Gérés depuis le panneau admin (`api/admin/event_codes.php`). Un code valide débloque un badge spécifique. Le flux :

1. Admin crée le code dans `event_codes` (slug badge + expiration)
2. Joueur saisit le code dans le profil → `POST /api/badges` avec `{ code }`
3. `api/badges/index.php` : vérifie le code → insère dans `event_codes_redeemed` ET dans `badges_unlocked`

**Attention** : le endpoint doit faire les deux inserts. Un bug passé n'insérait que dans `event_codes_redeemed` — le badge restait bloqué.

---

## 11. Profil Utilisateur

### Page profil — `profile/profile.html`

Point d'entrée principal du système de profil. Charge `profile-page.js` (logique principale) + `profileStats.js` (stats et streaks).

**Dirty-state save button** : le bouton "Sauvegarder" n'apparaît que si des modifications ont été faites (avatar, pseudo, settings). Implémenté via un flag `_profileDirty` dans `profile-page.js`. Ne pas rendre ce bouton toujours visible.

**Sync périodique** : `pullProfileFromCloud()` est appelé au login + toutes les 3 minutes + sur `visibilitychange` (retour sur l'onglet). Toujours précédé de `syncPending()`.

### Avatar — canvas crop

L'upload et le crop d'avatar utilisent `<canvas>` nativement (pas de librairie externe). L'avatar est stocké en `data:image/webp;base64,` dans `profiles.avatar_data`. Taille max recommandée : 200×200px après crop.

Validation côté serveur dans `api/user/index.php` : le préfixe `data:image/(jpeg|png|webp);base64,` est vérifié.

### Profil public (read-only)

`profile/profile.html?view=FRIEND_CODE` affiche le profil d'un autre joueur en lecture seule. `api/user/index.php` retourne un profil restreint (pseudo, friend_code, avatar, border) pour tout utilisateur authentifié — plus de 403.

### Calling Card — export PNG

`js/calling-card.js` utilise `html2canvas` pour capturer la carte de profil en PNG (780×1386px à scale:2). La preview dans la modale est réduite via `transform: scale(0.455)`. La capture se fait sur un **clone off-screen** pour ne pas être affectée par ce scale.

Les GIFs animés ont été retirés du sélecteur (une frame statique dans le PNG était confuse).

### Profile Song

Sélectable depuis le profil (liste des musiques du jeu). Jouée uniquement sur la page profil (propre et public). Sauvegardée dans `profiles.profile_music_id`.

---

## 12. Panneau Admin

Accessible à `/admin/` (lien conditionnel dans la bottomNav si `window._currentUser.is_admin`).

### Fonctionnalités

- **Vue utilisateurs** : recherche par pseudo/email/code, édition stats, visualisation détaillée
- **Onglet Badges** : grille visuelle, attribution à un utilisateur via queue + FAB "Appliquer"
- **Onglet Wallpapers** : même système de queue
- **Onglet Titres** : cartes avec image ou placeholder 👑 par rareté
- **Onglet Codes événement** : CRUD codes, stats de redemption
- **Modération** : bannir un compte (`is_banned`), verrouiller le pseudo (`pseudo_locked`)
- **Animation divine gift** : quand l'admin attribue des items, une animation Persona joue côté admin

**Mobile** : aside en drawer slide-in (hamburger), bouton `← Users`, FAB plein largeur.

### Ajouter un fichier PHP dans `api/admin/`

Comme pour `api/user/`, chaque fichier nécessite sa `RewriteRule` dans `api/admin/.htaccess` :

```apache
RewriteRule ^mon-fichier$ mon-fichier.php [L,QSA]
```

---

## 13. CI/CD & Infrastructure

### GitHub Actions

`.github/workflows/ci.yml` tourne sur `push` vers `develop` et `main` :

1. `npm ci` — install dépendances
2. `npm test` — Vitest (190 tests, 0 fail requis)
3. Lint PHP (si configuré)

`.github/workflows/cd.yml` — déploiement manuel depuis `main` uniquement (bouton "Run workflow").

### Git Hooks

```text
.githooks/
├── commit-msg   ← Enforce Conventional Commits (feat:, fix:, chore:, etc.)
└── pre-push     ← Bloque si npm test échoue
```

Pour activer localement :

```bash
git config core.hooksPath .githooks
```

### Service Worker — `sw.js`

Stratégies par type de requête :

- **Cache-first** : CSS, JS, images, sons
- **Network-first** : pages HTML
- **Stale-while-revalidate** : Google Fonts
- **Network-only** : `/api/*` → fallback JSON `{ error: 'offline' }` (503)

`CACHE_VERSION` dans `sw.js` doit être **incrémentée à chaque déploiement** pour invalider l'ancien cache. Les chemins dans `PRECACHE_URLS` doivent correspondre exactement aux URLs servies — attention aux fichiers déplacés.

Les chemins `profile/friends/` et `profile/leaderboard/` sont corrects depuis la réorganisation v2.0. Ne pas remettre les anciens chemins sans sous-dossier.

### Crons Hostinger

Deux crons à configurer :

- `php /path/to/api/cron/leaderboard.php` — toutes les heures (recalcul leaderboard_cache)
- `php /path/to/api/cron/hard-delete.php` — quotidien (suppression définitive comptes J+30 RGPD)

### Déploiement local

```bash
bash setup.sh   # Crée la BDD MySQL locale, configure Apache, crée le symlink
```

La conf Apache doit avoir deux blocs `<Directory>` : un sur le chemin réel ET un sur le chemin symlinké. Sans ça, `AllowOverride All` ne s'applique pas au chemin résolu et Apache renvoie 404 malgré des `.htaccess` corrects.

---

## 14. Sécurité

### Headers PHP — `api/bootstrap.php`

Ajoutés en début de `bootstrap.php` après le bloc CORS :

```php
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: strict-origin-when-cross-origin');
```

### Rate Limiting — login & register

5 tentatives par fenêtre de 15 minutes par IP. Fichiers JSON dans `sys_get_temp_dir()`. Portable pour Hostinger shared (pas de Redis). Clés distinctes pour login vs register.

### Unlock conditions — côté serveur obligatoire

**Ne jamais faire confiance au client** pour les unlocks. Les trois endpoints vérifient la condition côté serveur :

- `api/badges/index.php` → `verifyBadgeCondition($pdo, $userId, $badge)`
- `api/titles/index.php` → `verifyTitleCondition($pdo, $userId, $title)`
- `api/wallpapers/index.php` → `canUnlockWallpaper($pdo, $userId, $wallpaper)`

Avant v2.0, ces vérifications n'existaient pas — n'importe quel compte authentifié pouvait s'auto-attribuer tout.

### IDOR défis — `api/messages/index.php`

La transition vers le statut `beaten` utilise `receiver_id = ?` exclusivement. L'expéditeur ne peut pas marquer son propre défi comme gagné pour farmer XP Social Link.

### Utilisateur banni — `api/auth/me.php`

`is_banned` est vérifié sur les deux chemins (session PHP + remember_me). Si banni : session détruite, cookie révoqué, réponse `{ user: null, banned: true }`.

### Session fixation

`session_regenerate_id(true)` est appelé dans `login.php` et `register.php` immédiatement avant `$_SESSION['user_id'] = $user['id']`.

### Validation inputs — `api/user/index.php`

- `avatar_data` : préfixe `data:image/(jpeg|png|webp);base64,` requis
- `selected_badges` : chaque slug validé contre `/^[a-z0-9_-]{1,100}$/`
- `equipped_title_id` : ownership check dans `user_titles`
- `wallpaper_id` : ownership check dans `user_wallpapers`

### CORS

Whitelist d'origines exactes dans `bootstrap.php`. Jamais de wildcard `*` avec `credentials: 'include'` — les navigateurs bloquent.

---

## 15. Tests

### Lancer les tests

```bash
npm test              # Vitest, une fois
npm run test:watch    # Relance à chaque sauvegarde
npm run i18n:check    # Vérifie les clés manquantes dans lang/
```

### Couverture — 190 tests

| Fichier | Tests | Contenu |
| :--- | :--- | :--- |
| `tests/gameCore.test.js` | 146 | `parisDateKey`, `normalize`, `buildGameSession`, `savePendingSession`, streaks, filtres, i18n fallback trap, syncPending 409, filterMenu _migrate(), DST Paris, normalize edge cases |
| `tests/backend.test.js` | 18 | `buildGameSession` shape, `savePendingSession` offline/online, migration payload, auth UI DOM |
| `tests/i18n.test.js` | ≈20 | `t()`, `getCurrentLang()`, `setLang()`, `initLang()`, interpolation, fallback |
| `tests/profileStats.test.js` | ≈26 | `updateProfileStats()`, streaks, normalisation modes, favoriteMode |

### Règles pour les nouveaux tests

- Chaque nouvelle fonction utilitaire dans `gameCore.js` → tests correspondants dans `gameCore.test.js`
- Les tests de l'API backend PHP sont manuels via curl (voir exemples dans `setup.sh`)
- `savePendingSession` est async fire-and-forget — les tests ne doivent pas `await` son retour

---

## 16. Pièges connus & anti-patterns

Ces erreurs ont déjà été faites. Ne pas les répéter.

### JavaScript

| Piège | Explication & fix |
| :--- | :--- |
| `t(key) ?? fallback` | `t()` retourne la clé brute (truthy) si absente. Utiliser `(r !== key) ? r : fallback` |
| `window.onclick = fn` | Écrase silencieusement le handler précédent. Toujours `window.addEventListener('click', fn)` |
| Listener autocomplete empilé | `initializeAutocomplete()` appelé une seule fois au chargement. Mutation en place sur le tableau `personas` |
| `syncPending` bloqué sur 409 | 409 = session déjà connue → `continue` silencieux, pas `return` |
| `_crInitDone` partagé entre comptes | Toujours namespaced par `user_id`. Reset au login/logout |
| XP Social Link sur click bouton | L'XP est un effet secondaire automatique d'une action, pas déclenché par un click de jauge |
| `pullProfileFromCloud` avant `syncPending` | Toujours `await syncPending()` en premier pour ne pas écraser des sessions non envoyées |
| `isolation: isolate` clip enfants positionnés | Ex: TV P4 burst avatar clippé. Sortir l'élément du scope d'isolation |
| `animation-fill-mode` oublié | Sans `forwards`, l'overlay disparaît après l'animation. Toujours `forwards` pour les états "en attente" |

### PHP

| Piège | Explication & fix |
| :--- | :--- |
| `:param` répété dans `prepare()` | MySQL PDO ne supporte pas les params nommés dupliqués. Utiliser `?` positionnels |
| `ALTER TABLE ADD COLUMN IF NOT EXISTS` | Extension MariaDB uniquement. En local MySQL 8.0, utiliser `ADD COLUMN` sans condition |
| Procédure stockée via PhpMyAdmin | Ne pas utiliser PhpMyAdmin pour `DELIMITER`. Toujours le CLI MariaDB |
| `LEAVE proc_name` sur MariaDB | Labelliser le bloc : `proc_body: BEGIN … END` puis `LEAVE proc_body` |
| Nouvel endpoint sans `.htaccess` RewriteRule | 404 immédiat. Toujours ajouter la ligne dans le `.htaccess` du sous-dossier |
| Apache 403 après chmod | `chmod o+x /home/pchamza` — www-data doit traverser le home |
| `AllowOverride` sur chemin symlinké | Ajouter un bloc `<Directory>` sur le vrai chemin ET sur le chemin symlinké |

### Pièges architecture & fichiers

| Piège | Explication |
| :--- | :--- |
| Importer `FILTER_STORAGE_KEYS` dans `friends.js` plutôt que redéfinir | Exporté depuis `gameCore.js`. Une seule source de vérité |
| `checkChallengeCompletion()` hors du bloc win | Doit être appelé sur give-up aussi (avec `isWin = false`) |
| Profile/friends et leaderboard à 2 niveaux | `base = '../../'` dans bottomNav, `../../css/`, `../../js/` dans les HTML |
| Service Worker — chemins après déplacement de fichiers | Mettre à jour `PRECACHE_URLS` dans `sw.js` à chaque déplacement/rename de fichier servi |

---

*Document maintenu manuellement. Mettre à jour à chaque ajout de fonctionnalité ou correction importante.*
