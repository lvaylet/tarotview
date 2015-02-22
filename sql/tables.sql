CREATE TABLE IF NOT EXISTS players (
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 last_name CHAR(50) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL UNIQUE,
 first_name CHAR(50) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL
);

CREATE TABLE IF NOT EXISTS scores(
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 player_id INT NOT NULL,
 score INT NOT NULL,
 created_on DATE NOT NULL,
 FOREIGN KEY (player_id) REFERENCES players(id)
);

INSERT INTO players (last_name, first_name)
 VALUES ('VAYLET', 'Laurent');
INSERT INTO players (last_name, first_name)
 VALUES ('RICORD', 'Matthieu');
INSERT INTO players (last_name, first_name)
 VALUES ('RENARD', 'Patrick');
INSERT INTO players (last_name, first_name)
 VALUES ('CICCOLI', 'Stéphanie');
INSERT INTO players (last_name, first_name)
 VALUES ('BRIZARD', 'Mélinda');
INSERT INTO players (last_name, first_name)
 VALUES ('COPHEIN', 'Laurent');
INSERT INTO players (last_name, first_name)
 VALUES ('SANCHEZ', 'David');
INSERT INTO players (last_name, first_name)
 VALUES ('BOUETTE', 'Caroline');

INSERT INTO scores (player_id, score, created_on)
 VALUES (1, -250, '2014-02-12');
INSERT INTO scores (player_id, score, created_on)
 VALUES (2, 150, '2014-02-12');
INSERT INTO scores (player_id, score, created_on)
 VALUES (3, -50, '2014-02-12');
INSERT INTO scores (player_id, score, created_on)
 VALUES (4, 150, '2014-02-12');
INSERT INTO scores (player_id, score, created_on)
 VALUES (5, 50, '2014-02-12');
INSERT INTO scores (player_id, score, created_on)
 VALUES (6, 150, '2014-02-12');
INSERT INTO scores (player_id, score, created_on)
 VALUES (7, -200, '2014-02-12');
INSERT INTO scores (player_id, score, created_on)
 VALUES (8, 0, '2014-02-12');
