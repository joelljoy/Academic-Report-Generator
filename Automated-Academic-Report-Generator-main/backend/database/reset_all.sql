USE academic_report_generator;
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE report_files;
TRUNCATE TABLE certification_details;
TRUNCATE TABLE workshop_details;
TRUNCATE TABLE seminar_details;
TRUNCATE TABLE outreach_details;

TRUNCATE TABLE reports;
SET FOREIGN_KEY_CHECKS = 1;
