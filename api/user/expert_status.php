<?php
/**
 * GET /api/user/expert-status — État de déblocage des 6 modes Expert
 *
 * Retourne un objet {classic, emoji, silhouette, alloutattack, personae, music}
 * avec {unlocked: bool, requirement: string descriptif} pour chaque mode.
 * Utilisé par le front pour griser les boutons ⚡ et afficher le tooltip.
 */

header('Content-Type: application/json');
require_once '../bootstrap.php';

$user = requireAuth();
$userId = $user['id'];
$pdo = pdo();

// Définitions des conditions de déblocage par mode
$conditions = [
    'classic'       => ['type' => 'mode_wins_under_attempts', 'mode' => 'classic', 'value' => 10],
    'emoji'         => ['type' => 'mode_wins_single_day', 'mode' => 'emoji', 'value' => 10],
    'silhouette'    => ['type' => 'mode_wins_under_attempts', 'mode' => 'silhouette', 'value' => 10],
    'alloutattack'  => ['type' => 'mode_consecutive_perfects', 'mode' => 'alloutattack', 'value' => 15],
    'personae'      => ['type' => 'mode_consecutive_perfects', 'mode' => 'personae', 'value' => 15],
    'music'         => ['type' => 'mode_consecutive_perfects', 'mode' => 'music', 'value' => 15],
];

// Descriptions des conditions pour le tooltip
$descriptions = [
    'mode_wins_under_attempts'   => '{{count}} wins with ≤4 attempts each',
    'mode_wins_single_day'       => '{{count}} wins in a single day',
    'mode_consecutive_perfects'  => '{{count}} perfect wins in a row',
];

$result = [];

foreach ($conditions as $modeName => $cond) {
    $unlocked = personadle_verify_condition($pdo, $userId, $cond['type'], $cond['mode'], $cond['value']);
    $requirement = str_replace('{{count}}', (string) $cond['value'], $descriptions[$cond['type']]);

    $result[$modeName] = [
        'unlocked' => $unlocked,
        'requirement' => $requirement,
    ];
}

http_response_code(200);
echo json_encode($result);
