-- Migration 035: Expert mode unlock conditions + Denial of Self badge
-- Date: 2026-08-25

-- Insert unlock conditions for each Expert mode (stored as badge-like conditions)
-- Classic: 10 wins with ≤4 attempts each
INSERT IGNORE INTO badges (slug, name_en, name_fr, name_es, name_de, name_it, category, rarity, image_path, condition_en, condition_type, condition_mode, condition_value, is_secret)
VALUES (
  'expert_classic_unlock',
  'Expert Mode Unlocked: Classic',
  'Mode Expert débloqué : Classique',
  'Modo Experto Desbloqueado: Clásico',
  'Expertenmodus Entsperrt: Klassisch',
  'Modalità Esperta Sbloccata: Classica',
  'expert_gate',
  'common',
  'profile/badges/images/Badge_Expert_Classic_Gate.webp',
  'Win 10 times with ≤4 attempts',
  'mode_wins_under_attempts',
  'classic',
  10,
  0
);

-- Emoji: 10 wins in a single day
INSERT IGNORE INTO badges (slug, name_en, name_fr, name_es, name_de, name_it, category, rarity, image_path, condition_en, condition_type, condition_mode, condition_value, is_secret)
VALUES (
  'expert_emoji_unlock',
  'Expert Mode Unlocked: Emoji',
  'Mode Expert débloqué : Émoji',
  'Modo Experto Desbloqueado: Emoji',
  'Expertenmodus Entsperrt: Emoji',
  'Modalità Esperta Sbloccata: Emoji',
  'expert_gate',
  'common',
  'profile/badges/images/Badge_Expert_Emoji_Gate.webp',
  'Win 10 times in a single day',
  'mode_wins_single_day',
  'emoji',
  10,
  0
);

-- Silhouette: 10 wins with ≤4 attempts each
INSERT IGNORE INTO badges (slug, name_en, name_fr, name_es, name_de, name_it, category, rarity, image_path, condition_en, condition_type, condition_mode, condition_value, is_secret)
VALUES (
  'expert_silhouette_unlock',
  'Expert Mode Unlocked: Silhouette',
  'Mode Expert débloqué : Silhouette',
  'Modo Experto Desbloqueado: Silueta',
  'Expertenmodus Entsperrt: Silhouette',
  'Modalità Esperta Sbloccata: Silhouetta',
  'expert_gate',
  'common',
  'profile/badges/images/Badge_Expert_Silhouette_Gate.webp',
  'Win 10 times with ≤4 attempts',
  'mode_wins_under_attempts',
  'silhouette',
  10,
  0
);

-- All Out Attack: 15 consecutive perfect wins (1 attempt each)
INSERT IGNORE INTO badges (slug, name_en, name_fr, name_es, name_de, name_it, category, rarity, image_path, condition_en, condition_type, condition_mode, condition_value, is_secret)
VALUES (
  'expert_alloutattack_unlock',
  'Expert Mode Unlocked: All Out Attack',
  'Mode Expert débloqué : Coup Massif',
  'Modo Experto Desbloqueado: Ataque Total',
  'Expertenmodus Entsperrt: Massiver Angriff',
  'Modalità Esperta Sbloccata: Attacco Totale',
  'expert_gate',
  'common',
  'profile/badges/images/Badge_Expert_AllOutAttack_Gate.webp',
  'Win 15 times in a row with 1 attempt',
  'mode_consecutive_perfects',
  'alloutattack',
  15,
  0
);

-- Personae: 15 consecutive perfect wins
INSERT IGNORE INTO badges (slug, name_en, name_fr, name_es, name_de, name_it, category, rarity, image_path, condition_en, condition_type, condition_mode, condition_value, is_secret)
VALUES (
  'expert_personae_unlock',
  'Expert Mode Unlocked: Personae',
  'Mode Expert débloqué : Persona',
  'Modo Experto Desbloqueado: Personae',
  'Expertenmodus Entsperrt: Personae',
  'Modalità Esperta Sbloccata: Personae',
  'expert_gate',
  'common',
  'profile/badges/images/Badge_Expert_Personae_Gate.webp',
  'Win 15 times in a row with 1 attempt',
  'mode_consecutive_perfects',
  'personae',
  15,
  0
);

-- Music: 15 consecutive perfect wins
INSERT IGNORE INTO badges (slug, name_en, name_fr, name_es, name_de, name_it, category, rarity, image_path, condition_en, condition_type, condition_mode, condition_value, is_secret)
VALUES (
  'expert_music_unlock',
  'Expert Mode Unlocked: Music',
  'Mode Expert débloqué : Musique',
  'Modo Experto Desbloqueado: Música',
  'Expertenmodus Entsperrt: Musik',
  'Modalità Esperta Sbloccata: Musica',
  'expert_gate',
  'common',
  'profile/badges/images/Badge_Expert_Music_Gate.webp',
  'Win 15 times in a row with 1 attempt',
  'mode_consecutive_perfects',
  'music',
  15,
  0
);

-- Denial of Self: All 6 Expert modes unlocked + 10 wins in Expert for each
INSERT IGNORE INTO badges (slug, name_en, name_fr, name_es, name_de, name_it, category, rarity, image_path, condition_en, condition_type, condition_mode, condition_value, is_secret)
VALUES (
  'denial_of_self',
  'Denial of Self',
  'Refus de Soi',
  'Negación de Uno Mismo',
  'Verleugnung des Selbst',
  'Negazione del Sé',
  'achievement',
  'epic',
  'profile/badges/images/Badge_Denial_Of_Self.webp',
  'Unlock all 6 Expert modes and win 10 in each',
  'manual',
  NULL,
  NULL,
  0
);
