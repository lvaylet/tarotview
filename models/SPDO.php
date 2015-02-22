<?php

class SPDO {

    // Single instance of self shared among all instances
    private $PDOInstance = null;
    private static $instance = null;

    // DB connection config vars
    const SQL_USER = 'tarot_admin';
    const SQL_PASSWORD = 'tarot_admin_pw';
    const SQL_DATABASE = 'tarot';
    const SQL_HOST = 'localhost';

    public static function getInstance() {
        if (!self::$instance instanceof self) {
            self::$instance = new self;
        }
        return self::$instance;
    }

    // Private constructor
    private function __construct() {
        try {
            $this->PDOInstance = new PDO(
                    'mysql:dbname=' . self::SQL_DATABASE
                    . ';host=' . self::SQL_HOST, self::SQL_USER, self::SQL_PASSWORD);
            $this->PDOInstance->exec('SET CHARACTER SET utf8');
            $this->PDOInstance->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $e) {
            echo $e->getMessage();
        }
    }

    // The clone and wakeup methods prevents external instantiation of copies of the Singleton class,
    // thus eliminating the possibility of duplicate objects.
    public function __clone() {
        trigger_error('Clone is not allowed.', E_USER_ERROR);
    }

    public function __wakeup() {
        trigger_error('Deserializing is not allowed.', E_USER_ERROR);
    }

    public function get_all_players() {
        $result = $this->PDOInstance->query('SELECT * FROM players');
        // Toss back first result as JSON associative array
        return json_encode($result->fetchAll(PDO::FETCH_ASSOC), JSON_NUMERIC_CHECK);
    }

    public function get_all_players_like($lastName) {
        // Add percentage signs as jokers (any number of characters)
        $lastName = $this->PDOInstance->quote('%' . $lastName . '%');
        $result = $this->PDOInstance->query("SELECT * FROM players WHERE last_name LIKE $lastName");
        // Toss back first result as JSON associative array
        return json_encode($result->fetchAll(PDO::FETCH_ASSOC), JSON_NUMERIC_CHECK);
    }

    public function get_player_first_name($lastName) {
        $lastName = $this->PDOInstance->quote($lastName);
        $result = $this->PDOInstance->query("SELECT first_name FROM players WHERE last_name = $lastName");
        // Toss back first result as JSON associative array
        return json_encode($result->fetch(PDO::FETCH_ASSOC), JSON_NUMERIC_CHECK);
    }

    public function get_global_ranking() {
        $query = "SELECT players.last_name, players.first_name, SUM(scores.score) AS total
            FROM players
            INNER JOIN scores
            ON players.id = scores.player_id
            GROUP BY scores.player_id
            ORDER BY total DESC";
        $result = $this->PDOInstance->query($query);
        return json_encode($result->fetchAll(PDO::FETCH_ASSOC), JSON_NUMERIC_CHECK);
    }

    public function create_player($firstName, $lastName) {
        $firstName = $this->PDOInstance->quote($firstName);
        $lastName = $this->PDOInstance->quote($lastName);
        $query = "INSERT INTO players (first_name, last_name) VALUES ($firstName, $lastName)";
        $nbRowsAffected = $this->PDOInstance->exec($query);
        return json_encode($nbRowsAffected, JSON_NUMERIC_CHECK);
    }

    public function create_score($lastName, $score, $date) {
        $lastName = $this->PDOInstance->quote($lastName);
        $score = $this->PDOInstance->quote($score);
        $date = $this->PDOInstance->quote($date);
        $query = "INSERT INTO scores (player_id, score, created_on) VALUES ((SELECT id FROM players WHERE last_name = $lastName), $score, $date)";
        $nbRowsAffected = $this->PDOInstance->exec($query);
        return json_encode($nbRowsAffected, JSON_NUMERIC_CHECK);
    }

    public function get_scores_for_last_name($lastName) {
        $lastName = $this->PDOInstance->quote($lastName);
        $query = "SELECT created_on, SUM(score) AS total
            FROM scores
            WHERE player_id = (SELECT id FROM players WHERE last_name = $lastName)
            GROUP BY created_on
            ORDER BY created_on ASC";
        $result = $this->PDOInstance->query($query);
        return json_encode($result->fetchAll(PDO::FETCH_ASSOC), JSON_NUMERIC_CHECK);
    }

}
