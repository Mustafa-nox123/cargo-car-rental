CarGo Project Completion Checklist
📝 Submission Requirements (Due: December 7, 2025)
Required Files
1. SQL Script ✓

 DDL script with all CREATE TABLE statements
 All constraints documented (PRIMARY KEY, FOREIGN KEY, CHECK, UNIQUE)
 Stored procedures included
 Triggers included
 Sample data INSERT statements
 File named: cargo_database_setup.sql

2. Application Code (ZIP File) ✓

 server.js - Main Express server
 package.json - Dependencies
 .env.example - Environment template (NO passwords!)
 public/index.html - Frontend
 README.md - Setup instructions
 .gitignore - Git ignore rules
 All files in one ZIP: CarGo_Application.zip

3. Comprehensive Report (PDF/DOCX)

 Title page with course name, project title, team members, ERPs
 Business scenario description
 Interview summary (at least one real-world user)
 Application analysis (2-3 existing car rental systems)
 Business rules explanation
 ER diagram (Crow's foot or Chen notation)
 Entities, attributes, relationships with multiplicity
 Relational schema diagram (using DBDesigner)
 Normalization steps up to 3NF with proof
 DDL script screenshots
 Constraints explanation
 Stored procedures explanation
 Triggers explanation
 Sample data screenshots
 Application flow diagram
 UI wireframes/sketches
 Page-by-page navigation documentation
 All SQL queries with purpose and screenshots
 Work contribution breakdown per member

4. Demo Video (2-3 minutes) ✓

 Shows complete user flow
 Features highlighted:

 User registration
 Login
 Browse cars
 Make booking
 View booking history
 Receipt generation


 Clear audio
 Good video quality (720p minimum)
 Team member names shown
 Duration: 2-3 minutes (strictly)
 Format: MP4
 File named: CarGo_Demo_Video.mp4


🗄️ Database Requirements
Tables Created (Minimum 6-8 entities)

 Customer (with password, license info)
 Branch (locations)
 Category (car categories)
 Car (vehicles with VIN, odometer, status)
 RatePlan (pricing rules)
 Reservation (bookings)
 Rental (active rentals)
 Payment (transactions)
 Inspection (vehicle condition)
 ExtraCharge (additional fees)
 Maintenance (service records)

Normalization ✓

 1NF: All atomic values
 2NF: No partial dependencies
 3NF: No transitive dependencies
 Normalization documented in report with proof

Constraints Implemented ✓

 Primary Keys on all tables
 Foreign Keys with proper relationships
 UNIQUE constraints (email, reg_no, vin)
 CHECK constraints (status values, dates)
 NOT NULL constraints
 All constraints documented

Stored Procedures (Examples)

 Calculate booking cost
 Process checkout
 Process check-in
 Generate invoice
 At least 2-3 procedures created
 All procedures documented with purpose

Triggers (Examples)

 Update car status on reservation
 Audit trail for changes
 Validate business rules
 At least 2-3 triggers created
 All triggers documented with purpose

Sample Data ✓

 At least 3 branches
 At least 3 categories
 At least 12 cars
 Rate plans for all categories
 Test customer accounts
 Sample reservations
 Sample payments


💻 Application Requirements
Backend (Node.js + Express) ✓

 Express.js server running
 Oracle database connection working
 JWT authentication implemented
 Password hashing (bcrypt)
 CORS enabled
 Error handling
 All routes functional:

 POST /api/auth/register
 POST /api/auth/login
 GET /api/cars/available
 GET /api/categories
 GET /api/branches
 POST /api/reservations (protected)
 GET /api/reservations/my (protected)
 POST /api/payments (protected)
 GET /api/rateplan



Frontend (HTML/CSS/JavaScript) ✓

 Professional, clean design
 Responsive layout
 Pages implemented:

 Home page
 Registration page
 Login page
 Browse cars page
 Booking page
 Receipt page
 My bookings page


 Navigation working
 Forms validated
 Error messages displayed
 Success messages displayed
 Loading indicators

CRUD Operations ✓

 Create: Register user, create reservation, record payment
 Read: Get cars, get bookings, get categories/branches
 Update: Update reservation (can be implemented)
 Delete: Cancel reservation (can be implemented)

SQL Queries Documented

 All queries listed in report
 Purpose explained for each
 Screenshots or code snippets included
 Explain how each query contributes to functionality


📋 Business Rules Implementation

 Operating hours: 8:00 AM - 11:00 PM enforced
 Single-day vs multi-day rental logic
 Different pricing for weekday/weekend/holiday
 Security deposit required
 Driver's license mandatory
 Grace period for returns
 Extra hour charges
 Late fees after 11 PM
 Tax calculation (15%)
 Availability checking prevents double-booking
 Multiple payment methods supported


📊 Report Documentation
Section 1: Title Page ✓

 Course: CS 341 Database Systems
 Project title: CarGo - Car Rental Management System
 Team member names and ERPs:

Abdul Moid Ghori - 29220
Rayyan Jan - 29200
Mustafa Ghani - 29281


 Section: DB 2
 Date: December 2025

Section 2: Business Scenario ✓

 Description of car rental domain
 Why this system is needed
 Who the users are (customers, admins)
 Interview summary (at least one person)
 Analysis of 2-3 existing systems:

Features
Strengths
Limitations
How CarGo improves on them



Section 3: Business Rules ✓

 Core business rules listed
 Operating hours
 Pricing model
 Booking policies
 Payment policies
 Cancellation policies
 Use cases described

Section 4: Data Model ✓

 ER Diagram (hand-drawn or digital)
 Notation: Crow's Foot or Chen
 All entities shown
 All relationships shown
 Cardinality constraints marked
 Participation constraints marked
 Detailed entity descriptions:

Entity name
Attributes (with data types)
Primary key marked
Foreign keys marked
Relationships explained



Section 5: Relational Schema ✓

 Schema diagram (using DBDesigner or similar)
 All tables shown
 Relationships indicated
 Normalization proof:

Functional dependencies listed
1NF validation
2NF validation
3NF validation


 DDL script included (screenshots or text)
 Constraints explained
 Stored procedures explained
 Triggers explained
 Sample data shown

Section 6: Application Documentation ✓

 Flow diagram showing user navigation
 Wireframes for all pages
 Technology stack described
 Architecture explained (3-tier: DB, Backend, Frontend)

Section 7: SQL Queries ✓

 Page-by-page navigation documented
 Each page lists:

Purpose
Features
SQL queries used
Screenshots


 Query explanations include:

What the query does
Why it's needed
Parameters used
How it contributes to application



Section 8: Work Contribution ✓

 Clear breakdown per team member
 Example:

Abdul Moid Ghori: Frontend development, UI design
Rayyan Jan: Database design, DDL scripts, procedures
Mustafa Ghani: Backend API, authentication, integration


 All members contributed equally
 Individual responsibilities listed


🎬 Presentation (Last Week of Classes)
Preparation

 Slides prepared (10-15 slides)
 Live demo ready
 Database populated with data
 Application deployed (or running locally)
 Backup plan if technology fails
 Each member knows their part

Content to Cover

 Business scenario overview (1-2 minutes)
 ER diagram walkthrough (2 minutes)
 Database schema highlights (2 minutes)
 Live application demo (3-4 minutes)
 Technical challenges & solutions (1-2 minutes)
 Q&A preparation


✅ Final Quality Checks
Code Quality

 Code is well-commented
 Variable names are meaningful
 No hardcoded passwords/secrets
 Error handling implemented
 No console errors in browser
 All features work as expected

Documentation Quality

 Report is well-formatted
 No spelling/grammar errors
 Screenshots are clear
 Diagrams are readable
 Page numbers included
 Table of contents included
 References cited (if any)

Testing

 Registration works
 Login works
 Can browse cars
 Can make booking
 Can view bookings
 Receipt displays correctly
 Database queries execute correctly
 No crashes or errors

Submission Format

 All files named correctly
 ZIP file under reasonable size (<100MB)
 Video file format correct (MP4)
 Report in PDF or DOCX
 SQL script in .sql format
 Submission deadline: December 7, 2025


🚀 Pre-Submission Checklist
24 Hours Before Submission:

 Test entire application end-to-end
 Verify all files are included in ZIP
 Watch demo video (ensure quality)
 Proofread report one final time
 Check all team member names/ERPs are correct
 Ensure database script runs without errors
 Test on fresh Oracle database

On Submission Day:

 Submit to correct platform/email
 Submit before deadline
 Keep backup copy of all files
 Confirm submission was successful
 Verify files can be downloaded/opened


🎓 Grading Criteria (20% of Final Grade)
Expected Breakdown:

Business Scenario & Rules: 10%
Data Modeling (ER Diagram): 15%
Database Design & Normalization: 20%
SQL Implementation: 20%
Application Development: 20%
Documentation: 10%
Presentation: 5%

To Maximize Points:

 Complete ALL requirements
 Professional presentation
 Thorough documentation
 Working demo
 Clear explanation of work
 Equal contribution from all members


📞 Final Reminders

No extensions possible - Submit on time!
Team size: Maximum 3 members
All work must be original - No plagiarism
Test thoroughly before submission
Backup everything multiple times
Start early - Don't wait until last minute
Communicate with team - Regular check-ins
Ask instructor if you have questions


🎉 Completion Status
Update as you complete each item:
Database: [ ] Complete
Backend: [ ] Complete
Frontend: [ ] Complete
Report: [ ] Complete
Video: [ ] Complete
Testing: [ ] Complete
Submission: [ ] Complete

Good luck with your project! You've got this! 💪🚀

Quick Access Links

Main README: README.md
Setup Guide: SETUP_GUIDE.md
Deployment Guide: DEPLOYMENT_GUIDE.md
Video Script: VIDEO_DEMO_SCRIPT.md
SQL Documentation: SQL_QUERIES_DOCUMENTATION.md
Sample Data: sample_data.sql


Project Team:

Abdul Moid Ghori (ERP: 29220)
Rayyan Jan (ERP: 29200)
Mustafa Ghani (ERP: 29281)

Course: CS 341 Database Systems
Instructors: Abeera Tariq / Maria Rahim
Section: DB 2
Fall 2025