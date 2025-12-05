CarGo - Car Rental Management System
A comprehensive car rental management system built with Node.js, Express, and Oracle Database.

Team Members
Abdul Moid Ghori (ERP: 29220)
Rayyan Jan (ERP: 29200)
Mustafa Ghani (ERP: 29281)


Features:

->Customer Features

1. User registration and authentication
2. Browse available cars by date, category, and branch
3. Real-time car availability checking
4. Book cars with pickup/return dates
5. Multiple payment options (Card/Cash)
6. View booking history
7. Download/Print receipts
   
->  System Features
1. Single-day and multi-day rental support
2. Operating hours: 8:00 AM - 11:00 PM
3. Automatic pricing calculation
4. Security deposit management
5. Tax calculation (15%)
6. JWT-based authentication
7. Password encryption
8. Technology Stack

   
-> Backend
Node.js - Runtime environment
Express.js - Web framework
Oracle Database - Database system
oracledb - Oracle database driver
bcryptjs - Password hashing
jsonwebtoken - JWT authentication
cors - Cross-origin resource sharing
dotenv - Environment variable management


Frontend
HTML5 - Structure
CSS3 - Styling with gradients and animations
Vanilla JavaScript - Interactivity and API calls


Prerequisites
Before running this project, **make sure** you have:

- Node.js (v14 or higher) installed
- Oracle Database (11g or higher) or Oracle Express Edition (XE)
- Oracle Instant Client installed and configured
- Database tables created (use the DDL scripts from your team)
  
Installation
Clone or extract the project
bash
   cd cargo-car-rental
Install dependencies
bash
   npm install

Configure Oracle Instant Client

Download Oracle Instant Client from Oracle's website

Extract it to a directory
Set environment variables:

Windows:
cmd
   set PATH=C:\path\to\instantclient;%PATH%
Mac/Linux:

bash
   export LD_LIBRARY_PATH=/path/to/instantclient:$LD_LIBRARY_PATH

Configure Database Connection Edit the .env file with your Oracle database credentials:
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_CONNECT_STRING=localhost:1521/XEPDB1

Create Database Tables Run the DDL scripts provided by your database team to create:
Customer
Branch
Category
Car
RatePlan
Reservation
Rental
Inspection
Payment
ExtraCharge
Maintenance


Insert Sample Data Insert at least:
2-3 branches
3-4 categories (Economy, SUV, Luxury)
10+ cars
Rate plans for each category

-> Running the Application
Start the server
bash
   npm start
For development with auto-restart:

bash
   npm run dev

->Access the application Open your browser and navigate to:

   http://localhost:3000

-> Database Schema
Key Tables
Customer

customer_id (PK)
name, email, password (hashed)
phone, license_no, license_expiry
address
Car

car_id (PK)
reg_no (UNIQUE)
make, model, year, vin
category_id (FK → Category)
branch_id (FK → Branch)
odometer, status
Reservation

res_id (PK)
customer_id (FK → Customer)
car_id (FK → Car)
pickup_branch_id, return_branch_id (FK → Branch)
start_dt, end_dt
is_single_day (BOOLEAN)
status (Booked/Cancelled/CheckedOut/Completed)
Payment

payment_id (PK)
res_id (FK → Reservation)
amount, currency, method
paid_at, purpose, txn_ref


->API Endpoints

1. Authentication
- POST /api/auth/register - Register new user
- POST /api/auth/login - User login

2. Cars
GET /api/cars/available - Get available cars (with filters)
GET /api/categories - Get all categories
GET /api/branches - Get all branches

3. Reservations
POST /api/reservations - Create new reservation (requires auth)
GET /api/reservations/my - Get user's reservations (requires auth)

4. Payments
POST /api/payments - Record payment (requires auth)

5. Rate Plans
GET /api/rateplan - Get pricing for category

6. Business Rules Implementation
- Operating Hours: 8:00 AM - 11:00 PM (enforced in frontend)
- Single-day Rentals: Must start and end same day
- Multi-day Rentals: Can span multiple days
  
7. Pricing:
Single day: PKR 5,000 base
Multi-day: PKR 4,500 per day
Deposit: PKR 10,000
Tax: 15%
Availability: Checks for overlapping reservations

8. Deployment to Vercel
Install Vercel CLI
bash
   npm install -g vercel
Login to Vercel
bash
   vercel login
Deploy
bash
   vercel
Configure Environment Variables In Vercel dashboard, add:
DB_USER
DB_PASSWORD
DB_CONNECT_STRING
JWT_SECRET
Note: Vercel is primarily for static/serverless deployments. For Oracle database connectivity, consider:

Using Heroku or Railway
Switching to PostgreSQL/MySQL (requires approval)
Deploying backend separately on a VPS

-> Project Structure
cargo-car-rental/
├── server.js           # Main Express server
├── package.json        # Dependencies
├── .env               # Environment variables
├── .gitignore         # Git ignore rules
├── README.md          # This file
└── public/
    └── index.html     # Frontend application
Testing the Application
Register a new account
Fill in all required fields including license details
Browse cars
Select dates, category, and branch
Click "Search Available Cars"
Make a booking
Select a car
Choose pickup/return details
Complete payment information
Confirm booking
View bookings
Navigate to "My Bookings"
See all your reservations
SQL Queries Used
Check User Login
sql
SELECT customer_id, name, email, password 
FROM Customer 
WHERE email = :email
Get Available Cars
sql
SELECT c.car_id, c.reg_no, c.make, c.model, c.year, 
       cat.name as category_name, b.name as branch_name
FROM Car c
JOIN Category cat ON c.category_id = cat.category_id
JOIN Branch b ON c.branch_id = b.branch_id
WHERE c.status = 'Available'
AND c.car_id NOT IN (
  SELECT r.car_id FROM Reservation r
  WHERE r.status IN ('Booked', 'CheckedOut')
  AND (start_date BETWEEN r.start_dt AND r.end_dt)
)
Create Reservation
sql
INSERT INTO Reservation (customer_id, car_id, pickup_branch_id, 
                         return_branch_id, start_dt, end_dt, 
                         is_single_day, status)
VALUES (:customer_id, :car_id, :pickup_branch_id, :return_branch_id,
        TO_DATE(:start_dt, 'YYYY-MM-DD HH24:MI:SS'), 
        TO_DATE(:end_dt, 'YYYY-MM-DD HH24:MI:SS'),
        :is_single_day, 'Booked')
RETURNING res_id INTO :res_id
Get User Bookings
sql
SELECT r.res_id, r.start_dt, r.end_dt, r.status,
       c.make, c.model, c.reg_no,
       pb.name as pickup_branch, rb.name as return_branch
FROM Reservation r
JOIN Car c ON r.car_id = c.car_id
JOIN Branch pb ON r.pickup_branch_id = pb.branch_id
JOIN Branch rb ON r.return_branch_id = rb.branch_id
WHERE r.customer_id = :customer_id
ORDER BY r.start_dt DESC
Troubleshooting
Oracle Connection Issues
Error: DPI-1047: Cannot locate a 64-bit Oracle Client library
Solution: Install Oracle Instant Client and set PATH/LD_LIBRARY_PATH

Port Already in Use
Error: listen EADDRINUSE: address already in use :::3000
Solution: Change PORT in .env or kill the process using port 3000

Database Connection Timeout
Solution: Check your Oracle database is running and connection string is correct

Security Notes
Passwords are hashed using bcrypt
JWT tokens expire after 7 days
All authenticated endpoints require valid token
SQL injection prevented using parameterized queries
CORS enabled for frontend-backend communication
Future Enhancements
Admin dashboard
Email notifications
SMS reminders
Advanced reporting
Car images upload
Payment gateway integration
Mobile app (React Native)
GPS tracking
Loyalty program
Support
For issues or questions, contact:

Abdul Moid Ghori
Rayyan Jan
Mustafa Ghani
License
MIT License - Free to use for educational purposes

Course: CS 341 Database Systems
Instructors: Abeera Tariq / Maria Rahim
Fall 2025


