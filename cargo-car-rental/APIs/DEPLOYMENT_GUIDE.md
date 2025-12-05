CarGo Deployment Guide
This guide covers deployment options for your CarGo application.
⚠️ Important Note About Vercel
Vercel is primarily designed for:

Static websites
Serverless functions
Frontend frameworks (Next.js, React, etc.)

Vercel limitations for this project:

Does NOT support long-running Node.js servers
Oracle database connections are challenging in serverless environment
Instant Client binaries are difficult to include

🎯 Recommended Deployment Options
Option 1: Railway.app (Recommended ⭐)
Railway is perfect for full-stack Node.js apps with databases.
Steps:

Sign up at Railway

Visit: https://railway.app
Sign up with GitHub


Install Railway CLI

bash   npm install -g @railway/cli

Login

bash   railway login

Initialize Project

bash   cd cargo-car-rental
   railway init

Add Environment Variables

bash   railway variables set DB_USER=your_user
   railway variables set DB_PASSWORD=your_password
   railway variables set DB_CONNECT_STRING=your_connection_string
   railway variables set JWT_SECRET=your_jwt_secret

Deploy

bash   railway up

Generate Domain

bash   railway domain
Cost: Free tier includes $5 credit/month

Option 2: Render.com (Also Great 🌟)

Sign up at Render

Visit: https://render.com


Create New Web Service

Connect your GitHub repository
Or upload files directly


Configure Service

Name: cargo-car-rental
Environment: Node
Build Command: npm install
Start Command: npm start


Add Environment Variables

Go to "Environment" tab
Add all variables from .env


Deploy

Click "Create Web Service"



Cost: Free tier available (spins down after inactivity)

Option 3: Heroku

Install Heroku CLI

bash   # Windows (using npm)
   npm install -g heroku
   
   # Mac
   brew tap heroku/brew && brew install heroku

Login

bash   heroku login

Create App

bash   cd cargo-car-rental
   heroku create cargo-car-rental

Add Oracle Buildpack

bash   heroku buildpacks:add https://github.com/heroku/heroku-buildpack-oracle.git
   heroku buildpacks:add heroku/nodejs

Set Environment Variables

bash   heroku config:set DB_USER=your_user
   heroku config:set DB_PASSWORD=your_password
   heroku config:set DB_CONNECT_STRING=your_connection_string
   heroku config:set JWT_SECRET=your_jwt_secret

Deploy

bash   git init
   git add .
   git commit -m "Initial commit"
   git push heroku main
Cost: $7/month minimum (no free tier anymore)

Option 4: DigitalOcean App Platform

Sign up at DigitalOcean

Visit: https://www.digitalocean.com


Create App

Click "Create" → "Apps"
Connect GitHub or upload


Configure

Detect Node.js automatically
Set environment variables


Deploy

Click "Next" and deploy



Cost: $5/month minimum

Option 5: AWS EC2 (Most Control 💪)
Full control but requires more setup.

Launch EC2 Instance

Choose Amazon Linux 2 or Ubuntu
t2.micro (free tier eligible)


Connect via SSH

bash   ssh -i your-key.pem ec2-user@your-instance-ip

Install Node.js

bash   # Amazon Linux
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   source ~/.bashrc
   nvm install 18
   
   # Ubuntu
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

Install Oracle Instant Client

bash   wget https://download.oracle.com/otn_software/linux/instantclient/instantclient-basic-linuxx64.zip
   sudo unzip instantclient-basic-linuxx64.zip -d /opt/oracle
   export LD_LIBRARY_PATH=/opt/oracle/instantclient_21_12:$LD_LIBRARY_PATH

Clone and Setup Project

bash   git clone your-repo-url
   cd cargo-car-rental
   npm install

Create .env file

bash   nano .env
   # Add your variables

Install PM2 (Process Manager)

bash   npm install -g pm2
   pm2 start server.js
   pm2 startup
   pm2 save

Setup Nginx (Optional)

bash   sudo yum install nginx
   sudo nano /etc/nginx/nginx.conf
Add:
nginx   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }

Start Nginx

bash   sudo systemctl start nginx
   sudo systemctl enable nginx
Cost: Free tier for 12 months, then ~$10/month

🗄️ Database Hosting Options
Option A: Oracle Cloud Free Tier (Recommended)

Sign up

Visit: https://www.oracle.com/cloud/free/


Create Autonomous Database

Choose "Always Free"
Database type: Transaction Processing


Download Wallet

Download client credentials (wallet.zip)


Configure Connection

javascript   // Update server.js
   const dbConfig = {
     user: process.env.DB_USER,
     password: process.env.DB_PASSWORD,
     connectString: process.env.DB_CONNECT_STRING,
     walletLocation: './wallet',
     walletPassword: process.env.WALLET_PASSWORD
   };

Upload Wallet to Server

Extract wallet.zip to project
Add to .gitignore
Upload manually to hosting



Cost: FREE forever (with limits)
Option B: Keep Local Oracle and Use Ngrok
For demo/testing purposes:

Install Ngrok

bash   npm install -g ngrok

Start Your Server

bash   npm start

Expose to Internet

bash   ngrok http 3000

Share the URL

Get URL like: https://abc123.ngrok.io
This URL is accessible worldwide



Cost: Free (with time limits)

🔧 Alternative: Switch to PostgreSQL/MySQL
If Oracle is causing issues, you can switch databases:
Using PostgreSQL on Heroku/Render

Install PostgreSQL adapter

bash   npm install pg

Update server.js

javascript   const { Pool } = require('pg');
   
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     ssl: {
       rejectUnauthorized: false
     }
   });

Convert SQL queries

Oracle: TO_DATE(:date, 'YYYY-MM-DD')
PostgreSQL: TO_TIMESTAMP(:date, 'YYYY-MM-DD')
Oracle: SYSDATE
PostgreSQL: NOW()
Oracle: RETURNING id INTO :id
PostgreSQL: RETURNING id


Recreate tables in PostgreSQL

Note: Requires instructor approval!

📱 Deployment Checklist
Before deploying:

 Test locally thoroughly
 All environment variables documented
 Database connection tested
 All dependencies in package.json
 Error handling implemented
 Security: No hardcoded passwords
 CORS configured properly
 API endpoints documented
 README.md complete
 .gitignore configured
 Sample data in database
 Test user created


🚀 Quick Deploy Script
Create deploy.sh:
bash#!/bin/bash

echo "🚀 CarGo Deployment Script"

# 1. Build check
echo "✓ Checking Node version..."
node --version

# 2. Install dependencies
echo "✓ Installing dependencies..."
npm install

# 3. Test database connection
echo "✓ Testing database..."
node test-db.js

# 4. Start server
echo "✓ Starting server..."
npm start
Make executable:
bashchmod +x deploy.sh
./deploy.sh

🔐 Security Best Practices

Never commit .env

bash   # Add to .gitignore
   .env
   .env.local
   .env.production

Use strong JWT secret

bash   # Generate random secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

Use HTTPS in production

Most platforms provide this automatically


Rate limiting (optional)

bash   npm install express-rate-limit
javascript   const rateLimit = require('express-rate-limit');
   
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 100
   });
   
   app.use('/api/', limiter);

Helmet for security headers

bash   npm install helmet
javascript   const helmet = require('helmet');
   app.use(helmet());

📊 Monitoring
Simple Health Check
Add to server.js:
javascriptapp.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});
PM2 Monitoring (if using EC2/VPS)
bash# View logs
pm2 logs

# Monitor resources
pm2 monit

# Restart on changes
pm2 restart all

# View status
pm2 status

🎬 Demo Video Tips
For your 2-3 minute video:

Show deployed URL (not localhost)
Quick tour:

Home page
Register/Login
Browse cars
Make booking
View booking history


Highlight features:

Real-time availability
Multiple payment options
Receipt generation


Show database:

Quick look at tables
Data changes after booking




📞 Support
If deployment fails:

Check error logs
Verify all environment variables
Test database connection separately
Use platform-specific support:

Railway: https://docs.railway.app
Render: https://render.com/docs
Heroku: https://devcenter.heroku.com




✅ Final Steps

Deploy your application
Test all features on live URL
Record demo video with live site
Include live URL in project submission
Document any issues in README

Good luck with deployment! 🎉