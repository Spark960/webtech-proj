CREATE DATABASE IF NOT EXISTS skillswap;
USE skillswap;

CREATE TABLE IF NOT EXISTS users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100)  NOT NULL,
    email       VARCHAR(255)  NOT NULL UNIQUE,
    password    VARCHAR(255)  NOT NULL,
    department  VARCHAR(100),
    bio         TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skills (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT           NOT NULL,
    type        ENUM('teach','learn') NOT NULL,
    title       VARCHAR(150)  NOT NULL,
    description TEXT,
    category    VARCHAR(50),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS interests (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    from_user   INT NOT NULL,
    to_user     INT NOT NULL,
    skill_id    INT NOT NULL,
    message     TEXT,
    status      ENUM('pending','accepted','declined') DEFAULT 'pending',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_user) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user)   REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id)  REFERENCES skills(id) ON DELETE CASCADE
);
