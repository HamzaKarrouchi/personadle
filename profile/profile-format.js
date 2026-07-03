/**
 * profile/profile-format.js — Utilitaires de formatage partagés entre
 * profile-page.js (ton propre profil) et profile-view.js (profil d'un ami),
 * qui affichent tous deux le streak et le lecteur de musique de profil.
 */

/** Détermine le palier visuel (0-5) d'un streak pour les effets de flammes. */
export function getStreakTier(streak) {
  if (streak >= 30) return 5;
  if (streak >= 14) return 4;
  if (streak >= 7) return 3;
  if (streak >= 3) return 2;
  if (streak >= 1) return 1;
  return 0;
}

/** Formate un nombre de secondes en "m:ss" pour le lecteur de musique de profil. */
export function formatSongTime(s) {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${sec}`;
}
