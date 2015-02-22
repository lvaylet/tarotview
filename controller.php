<?php

const ADMIN_PASSWORD = 'welcome';
const PAUSE = 200000; // usec

// Autoload classes when needed ('include' and 'require' not needed anymore)
function __autoload($className) {
    include_once("models/$className.php");
}

// Special case for Twitter typeahead
if (isset($_GET['query'])) {
    echo SPDO::getInstance()->get_all_players_like($_GET['query']);
    exit();
}

// Handle all over cases with POST
if (!isset($_POST['action'])) {
    echo json_encode(0);
    return;
}

switch ($_POST['action']) {

    case 'get_global_ranking':
        echo SPDO::getInstance()->get_global_ranking();
        usleep(PAUSE);
        break;

    case 'create_player':
        echo SPDO::getInstance()->create_player($_POST['first_name'], $_POST['last_name']);
        usleep(PAUSE);
        break;

    case 'get_player_first_name':
        echo SPDO::getInstance()->get_player_first_name($_POST['last_name']);
        break;

    case 'create_score':
        echo SPDO::getInstance()->create_score($_POST['last_name'], $_POST['score'], $_POST['date']);
        usleep(PAUSE);
        break;

    case 'get_scores':
        echo SPDO::getInstance()->get_scores_for_last_name($_POST['last_name']);
        usleep(PAUSE);
        break;

    case 'login':
        echo json_encode($_POST['password'] === ADMIN_PASSWORD);
        usleep(PAUSE);
        break;
}

exit();
