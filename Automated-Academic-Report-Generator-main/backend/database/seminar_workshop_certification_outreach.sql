-- MySQL dump 10.13  Distrib 8.0.44, for macos15 (arm64)
--
-- Host: localhost    Database: academic_report_generator
-- ------------------------------------------------------
-- Server version	8.4.7

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `certification_details`
--

DROP TABLE IF EXISTS `certification_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `certification_details` (
  `certification_id` int NOT NULL AUTO_INCREMENT,
  `report_id` int NOT NULL,
  `detailed_curriculum` varchar(255) DEFAULT NULL,
  `assessment_details` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`certification_id`),
  KEY `fk_certification_report_idx` (`report_id`),
  CONSTRAINT `fk_certification_report` FOREIGN KEY (`report_id`) REFERENCES `reports` (`report_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `certification_details`
--

LOCK TABLES `certification_details` WRITE;
/*!40000 ALTER TABLE `certification_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `certification_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `outreach_details`
--

DROP TABLE IF EXISTS `outreach_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `outreach_details` (
  `outreach_id` int NOT NULL AUTO_INCREMENT,
  `report_id` int DEFAULT NULL,
  `number_of_beneficiaries` int DEFAULT NULL,
  `number_of_student_volunteers` int DEFAULT NULL,
  `collaborating_agency` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`outreach_id`),
  KEY `fk_outreach_report_idx` (`report_id`),
  CONSTRAINT `fk_outreach_report` FOREIGN KEY (`report_id`) REFERENCES `reports` (`report_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `outreach_details`
--

LOCK TABLES `outreach_details` WRITE;
/*!40000 ALTER TABLE `outreach_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `outreach_details` ENABLE KEYS */;
UNLOCK TABLES;


--
-- Table structure for table `seminar_details`
--

DROP TABLE IF EXISTS `seminar_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seminar_details` (
  `seminar_id` int NOT NULL AUTO_INCREMENT,
  `report_id` int NOT NULL,
  `nature_of_participants` varchar(100) DEFAULT NULL,
  `number_of_participants` int DEFAULT NULL,
  PRIMARY KEY (`seminar_id`),
  KEY `fk_seminar_report_idx` (`report_id`),
  CONSTRAINT `fk_seminar_report` FOREIGN KEY (`report_id`) REFERENCES `reports` (`report_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seminar_details`
--

LOCK TABLES `seminar_details` WRITE;
/*!40000 ALTER TABLE `seminar_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `seminar_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `workshop_details`
--

DROP TABLE IF EXISTS `workshop_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workshop_details` (
  `workshop_id` int NOT NULL AUTO_INCREMENT,
  `report_id` int NOT NULL,
  `nature_of_participants` varchar(100) DEFAULT NULL,
  `number_of_participants` int DEFAULT NULL,
  PRIMARY KEY (`workshop_id`),
  KEY `fk_workshop_report_idx` (`report_id`),
  CONSTRAINT `fk_workshop_report` FOREIGN KEY (`report_id`) REFERENCES `reports` (`report_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workshop_details`
--

LOCK TABLES `workshop_details` WRITE;
/*!40000 ALTER TABLE `workshop_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `workshop_details` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-29  0:09:49
