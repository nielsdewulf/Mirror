-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mirror
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema mirror
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `mirror` DEFAULT CHARACTER SET utf8 ;
USE `mirror` ;

-- -----------------------------------------------------
-- Table `mirror`.`gcalendar`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mirror`.`gcalendar` (
  `idgcalendar` VARCHAR(64) NOT NULL,
  `session` BLOB NULL DEFAULT NULL,
  PRIMARY KEY (`idgcalendar`),
  UNIQUE INDEX `idgcalendar_UNIQUE` (`idgcalendar` ASC))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mirror`.`calendar`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mirror`.`calendar` (
  `idcalendar` INT NOT NULL AUTO_INCREMENT,
  `idgcalendar` VARCHAR(64) NULL,
  PRIMARY KEY (`idcalendar`),
  INDEX `fk_calendar_gcalendar1_idx` (`idgcalendar` ASC),
  CONSTRAINT `fk_calendar_gcalendar1`
    FOREIGN KEY (`idgcalendar`)
    REFERENCES `mirror`.`gcalendar` (`idgcalendar`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mirror`.`timelimit`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mirror`.`timelimit` (
  `idtimelimit` INT NOT NULL AUTO_INCREMENT,
  `timelimit` INT NULL,
  PRIMARY KEY (`idtimelimit`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mirror`.`user`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mirror`.`user` (
  `iduser` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NOT NULL,
  `idcalendar` INT NULL,
  `idtimelimit` INT NULL,
  `sound` TINYINT(1) NOT NULL,
  PRIMARY KEY (`iduser`),
  INDEX `fk_user_calendar1_idx` (`idcalendar` ASC),
  INDEX `fk_user_timelimit1_idx` (`idtimelimit` ASC),
  CONSTRAINT `fk_user_calendar1`
    FOREIGN KEY (`idcalendar`)
    REFERENCES `mirror`.`calendar` (`idcalendar`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_user_timelimit1`
    FOREIGN KEY (`idtimelimit`)
    REFERENCES `mirror`.`timelimit` (`idtimelimit`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mirror`.`settings`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mirror`.`settings` (
  `idsettings` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NOT NULL,
  `value` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`idsettings`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mirror`.`calendarURL`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mirror`.`calendarURL` (
  `idurl` INT NOT NULL AUTO_INCREMENT,
  `url` VARCHAR(1024) NOT NULL,
  `idcalendar` INT NOT NULL,
  PRIMARY KEY (`idurl`, `idcalendar`),
  UNIQUE INDEX `idurl_UNIQUE` (`idurl` ASC),
  CONSTRAINT `fk_calendarURL_calendar`
    FOREIGN KEY (`idcalendar`)
    REFERENCES `mirror`.`calendar` (`idcalendar`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mirror`.`sensor`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mirror`.`sensor` (
  `idsensor` INT NOT NULL AUTO_INCREMENT,
  `sensor` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`idsensor`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mirror`.`history`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mirror`.`history` (
  `idhistoriek` INT NOT NULL AUTO_INCREMENT,
  `idsensor` INT NULL,
  `datetime` DATETIME NOT NULL,
  `value` FLOAT NULL,
  `iduser` INT NULL,
  PRIMARY KEY (`idhistoriek`),
  INDEX `fk_historiek_sensor1_idx` (`idsensor` ASC) ,
  INDEX `fk_historiek_user1_idx` (`iduser` ASC) ,
  CONSTRAINT `fk_historiek_sensor1`
    FOREIGN KEY (`idsensor`)
    REFERENCES `mirror`.`sensor` (`idsensor`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_historiek_user1`
    FOREIGN KEY (`iduser`)
    REFERENCES `mirror`.`user` (`iduser`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
