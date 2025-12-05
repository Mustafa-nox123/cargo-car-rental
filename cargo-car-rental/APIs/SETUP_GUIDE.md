CarGo Setup Guide - Step by Step
This guide will help you set up and run the CarGo Car Rental System on your local machine.
📋 Table of Contents

Prerequisites Installation
Oracle Database Setup
Project Setup
Running the Application
Testing
Troubleshooting


1. Prerequisites Installation
Install Node.js
Windows:

Download from https://nodejs.org/ (LTS version)
Run the installer
Verify installation:

cmd   node --version
   npm --version
Mac:
bashbrew install node
Linux:
bashsudo apt update
sudo apt install nodejs npm
Install Oracle Instant Client
Windows:

Download from: https://www.oracle.com/database/technologies/instant-client/downloads.html
Extract to C:\oracle\instantclient_21_12
Add to System PATH:

Right-click "This PC" → Properties
Advanced System Settings → Environment Variables
Edit PATH, add: C:\oracle\instantclient_21_12


Restart terminal/cmd

Mac:
bash# Download from Oracle website
# Extract and move to /usr/local/
sudo mkdir -p /usr/local/lib
sudo mv instantclient_21_12/* /usr/local/lib/
export DYLD_LIBRARY_PATH=/usr/local/lib:$DYLD_LIBRARY_PATH
Linux:
bashsudo apt install libaio1
# Download instant client
sudo mkdir -p /opt/oracle
sudo unzip instantclient-basic-linux.zip -d /opt/oracle
export LD_LIBRARY_PATH=/opt/oracle/instantclient_21_12:$LD_LIBRARY_PATH

2. Oracle Database Setup
Option A: Using Oracle XE (Express Edition)

Download Oracle XE

Visit: https://www.oracle.com/database/technologies/xe-downloads.html
Install following the wizard


Connect to Database

sql   sqlplus sys as sysdba
   -- Password: (what you set during installation)

Create User and Grant Privileges

sql   -- Connect to PDB
   ALTER SESSION SET CONTAINER = XEPDB1;
   
   -- Create user
   CREATE USER cargo_admin IDENTIFIED BY cargo_password123;
   
   -- Grant privileges
   GRANT CONNECT, RESOURCE, CREATE SESSION TO cargo_admin;
   GRANT CREATE TABLE, CREATE VIEW, CREATE PROCEDURE, CREATE TRIGGER TO cargo_admin;
   GRANT UNLIMITED TABLESPACE TO cargo_admin;
   
   -- Verify
   SELECT USERNAME FROM ALL_USERS WHERE USERNAME = 'CARGO_ADMIN';

Create Tables

Use the DDL scripts created by your database team
Connect as cargo_admin:



sql   sqlplus cargo_admin/cargo_password123@localhost:1521/XEPDB1
   @path/to/your/ddl_script.sql

Insert Sample Data

sql   @sample_data.sql
Option B: Using Oracle Cloud (Free Tier)

Sign up at: https://www.oracle.com/cloud/free/
Create Autonomous Database
Download Wallet
Update connection string in .env


3. Project Setup
Step 1: Extract Project Files
Extract the ZIP file to your desired location:
C:\Users\YourName\Desktop\cargo-car-rental
Step 2: Open Terminal/CMD in Project Directory
Windows:
cmdcd C:\Users\YourName\Desktop\cargo-car-rental
Mac/Linux:
bashcd ~/Desktop/cargo-car-rental
Step 3: Install Dependencies
bashnpm install
This will install:

express (web framework)
oracledb (database driver)
cors (cross-origin support)
bcryptjs (password hashing)
jsonwebtoken (authentication)
dotenv (environment variables)

Common Issues:

If oracledb installation fails, ensure Oracle Instant Client is properly installed
On Windows, you may need Visual Studio Build Tools

Step 4: Configure Database Connection
Edit the .env file:
envDB_USER=cargo_admin
DB_PASSWORD=cargo_password123
DB_CONNECT_STRING=localhost:1521/XEPDB1

JWT_SECRET=your_secure_random_string_here
PORT=3000
NODE_ENV=development
Connection String Formats:

Local XE: localhost:1521/XEPDB1
Local DB: localhost:1521/ORCL
Remote: hostname:1521/servicename

Step 5: Verify Database Connection
Create a test file test-db.js:
javascriptconst oracledb = require('oracledb');

async function testConnection() {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: 'cargo_admin',
      password: 'cargo_password123',
      connectString: 'localhost:1521/XEPDB1'
    });
    
    console.log('✅ Database connection successful!');
    
    const result = await connection.execute('SELECT COUNT(*) FROM Car');
    console.log('✅ Tables accessible. Cars count:', result.rows[0][0]);
    
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  } finally {
    if (connection) await connection.close();
  }
}

testConnection();
Run:
bashnode test-db.js

4. Running the Application
Start the Server
Method 1: Normal Start
bashnpm start
Method 2: Development Mode (auto-restart on changes)
bashnpm run dev
You should see:
Oracle connection pool created
CarGo server running on port 3000
Access the Application
Open your browser and navigate to:
http://localhost:3000

5. Testing
Test User Registration

Click "Register" in navigation
Fill in all fields:

Full Name: John Doe
Email: john@example.com
Password: password123
Phone: +92-300-1234567
License Number: ABC-123456
License Expiry: 2026-12-31
Address: House 123, Karachi


Click "Register"
Should redirect to login

Test User Login

Email: john@example.com
Password: password123
Click "Login"
Should see "Hello, John Doe!" in navbar

Test Car Browsing

Click "Browse Cars"
Select dates (future dates)
Select category and branch (optional)
Click "Search Available Cars"
Should see car listings

Test Booking

Click "Book Now" on any car
Fill pickup/return details
Select payment method
Click "Confirm Booking"
Should see receipt page

Test Booking History

Click "My Bookings" in navbar
Should see all your reservations


6. Troubleshooting
Issue: Oracle Client Not Found
Error:
DPI-1047: Cannot locate a 64-bit Oracle Client library
Solution:

Verify Oracle Instant Client is installed
Check PATH environment variable includes instant client directory
Restart terminal/IDE
On Windows, may need to restart computer

Verify PATH:
bash# Windows
echo %PATH%

# Mac/Linux
echo $PATH
Issue: Port Already in Use
Error:
Error: listen EADDRINUSE: address already in use :::3000
Solution:
Windows:
cmdnetstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
Mac/Linux:
bashlsof -ti:3000 | xargs kill -9
Or change port in .env:
PORT=3001
Issue: Database Connection Timeout
Error:
ORA-12170: TNS:Connect timeout occurred
Solution:

Verify Oracle database is running:

sql   lsnrctl status

Check firewall settings
Verify connection string is correct
Test with SQL*Plus first:

bash   sqlplus cargo_admin/cargo_password123@localhost:1521/XEPDB1
Issue: Table or View Does Not Exist
Error:
ORA-00942: table or view does not exist
Solution:

Verify tables are created:

sql   SELECT table_name FROM user_tables;

Re-run DDL scripts
Ensure connected to correct schema

Issue: Cannot Install oracledb Module
Error:
npm ERR! node-gyp rebuild
Solution:
Windows:

Install Visual Studio Build Tools:

cmd   npm install --global windows-build-tools

Or download from: https://visualstudio.microsoft.com/downloads/

Mac:
bashxcode-select --install
Linux:
bashsudo apt install build-essential
Issue: CORS Errors in Browser Console
Error:
Access to fetch has been blocked by CORS policy
Solution:

Ensure server is running
Check API_URL in frontend points to correct server
CORS is already enabled in server.js

Issue: JWT Token Expired
Error:
401 Unauthorized
Solution:

Logout and login again
Token validity is 7 days (configurable in server.js)


Additional Configuration
Changing Port
Edit .env:
PORT=8080
Update API_URL in public/index.html:
javascriptconst API_URL = 'http://localhost:8080/api';
Enabling Debug Logging
Edit .env:
NODE_ENV=development
DEBUG=*
Database Connection Pooling
Connection pool is automatically created with these defaults:

Pool Min: 2
Pool Max: 10
Pool Increment: 1

To customize, edit server.js:
javascriptconst dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECT_STRING,
  poolMin: 2,
  poolMax: 10,
  poolIncrement: 1
};

Development Tips
Hot Reload
Use nodemon for automatic restart on code changes:
bashnpm install -g nodemon
nodemon server.js
Database Inspection
Connect with SQL Developer or SQL*Plus:
sql-- View all tables
SELECT table_name FROM user_tables;

-- View all customers
SELECT * FROM Customer;

-- View all reservations
SELECT * FROM Reservation;

-- View available cars
SELECT * FROM Car WHERE status = 'Available';
API Testing with cURL
Test endpoints without browser:
bash# Test health
curl http://localhost:3000/api/health

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# Test get cars (with auth)
curl http://localhost:3000/api/cars/available \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

Next Steps

✅ Complete project documentation
✅ Test all features thoroughly
✅ Create presentation slides
✅ Record demo video (2-3 minutes)
✅ Prepare for live demonstration


Support Resources

Oracle Documentation: https://docs.oracle.com/
Node.js Documentation: https://nodejs.org/docs/
Express.js Guide: https://expressjs.com/
oracledb Module: https://oracle.github.io/node-oracledb/


Quick Command Reference
bash# Install dependencies
npm install

# Start server
npm start

# Start with auto-reload
npm run dev

# Test database connection
node test-db.js

# Check Node version
node --version

# Check npm version
npm --version

# View running processes on port
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Mac/Linux

Good luck with your project! 🚀