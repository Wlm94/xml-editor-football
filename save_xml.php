<?php
header("Content-Type: text/plain");

// Chemin absolu recommandé
$filepath = __DIR__ . '/FET-EDT.xml';

$xmlData = file_get_contents('php://input');

// Validation minimale
if (strpos($xmlData, '<?xml') === false) {
    http_response_code(400);
    die("Erreur: Format XML invalide");
}

if (file_put_contents($filepath, $xmlData)) {
    echo "Fichier XML mis à jour avec succès !";
}
