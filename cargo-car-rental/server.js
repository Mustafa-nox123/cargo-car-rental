const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Oracle DB Configuration
const dbConfig = {
  user: process.env.DB_USER || 'your_username',
  password: process.env.DB_PASSWORD || 'your_password',
  connectString: process.env.DB_CONNECT_STRING || 'localhost:1521/XEPDB1'
};

// Initialize connection pool
async function initialize() {
  try {
    await oracledb.createPool(dbConfig);
    console.log('Oracle connection pool created');
  } catch (err) {
    console.error('Error creating connection pool:', err);
  }
}

initialize();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(403).json({ error: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET || 'cargo_secret_key_2025', (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Unauthorized' });
    req.userId = decoded.id;
    next();
  });
};

// ============= AUTH ROUTES =============

// Register
app.post('/api/auth/register', async (req, res) => {
  let connection;
  try {
    const { name, email, password, phone, license_no, license_expiry, address } = req.body;
    
    connection = await oracledb.getConnection();
    
    // Check if user exists
    const checkUser = await connection.execute(
      `SELECT customer_id FROM Customer WHERE email = :email`,
      [email]
    );
    
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert new customer
    const result = await connection.execute(
      `INSERT INTO Customer (name, email, password, phone, license_no, license_expiry, address) 
       VALUES (:name, :email, :password, :phone, :license_no, TO_DATE(:license_expiry, 'YYYY-MM-DD'), :address)
       RETURNING customer_id INTO :id`,
      {
        name, email, password: hashedPassword, phone, license_no, license_expiry, address,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      { autoCommit: true }
    );
    
    const customerId = result.outBinds.id[0];
    const token = jwt.sign({ id: customerId }, process.env.JWT_SECRET || 'cargo_secret_key_2025', { expiresIn: '7d' });
    
    res.json({ message: 'Registration successful', token, customerId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed', details: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  let connection;
  try {
    const { email, password } = req.body;
    
    connection = await oracledb.getConnection();
    
    const result = await connection.execute(
      `SELECT customer_id, name, email, password FROM Customer WHERE email = :email`,
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = {
      customer_id: result.rows[0][0],
      name: result.rows[0][1],
      email: result.rows[0][2],
      password: result.rows[0][3]
    };
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user.customer_id }, process.env.JWT_SECRET || 'cargo_secret_key_2025', { expiresIn: '7d' });
    
    res.json({ 
      message: 'Login successful', 
      token, 
      user: { id: user.customer_id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed', details: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// ============= CAR ROUTES =============

// Get available cars
app.get('/api/cars/available', async (req, res) => {
  let connection;
  try {
    const { start_date, end_date, category_id, branch_id } = req.query;
    
    connection = await oracledb.getConnection();
    
    let query = `
      SELECT c.car_id, c.reg_no, c.make, c.model, c.year, c.vin, 
             cat.name as category_name, cat.description as category_desc,
             b.name as branch_name, b.city, c.status
      FROM Car c
      JOIN Category cat ON c.category_id = cat.category_id
      JOIN Branch b ON c.branch_id = b.branch_id
      WHERE c.status = 'Available'
    `;
    
    const binds = {};
    
    if (category_id) {
      query += ` AND c.category_id = :category_id`;
      binds.category_id = category_id;
    }
    
    if (branch_id) {
      query += ` AND c.branch_id = :branch_id`;
      binds.branch_id = branch_id;
    }
    
    // Check availability for date range
    if (start_date && end_date) {
      query += ` AND c.car_id NOT IN (
        SELECT r.car_id FROM Reservation r
        WHERE r.status IN ('Booked', 'CheckedOut')
        AND (
          (TO_DATE(:start_date, 'YYYY-MM-DD') BETWEEN r.start_dt AND r.end_dt)
          OR (TO_DATE(:end_date, 'YYYY-MM-DD') BETWEEN r.start_dt AND r.end_dt)
          OR (r.start_dt BETWEEN TO_DATE(:start_date2, 'YYYY-MM-DD') AND TO_DATE(:end_date2, 'YYYY-MM-DD'))
        )
      )`;
      binds.start_date = start_date;
      binds.end_date = end_date;
      binds.start_date2 = start_date;
      binds.end_date2 = end_date;
    }
    
    const result = await connection.execute(query, binds);
    
    const cars = result.rows.map(row => ({
      car_id: row[0],
      reg_no: row[1],
      make: row[2],
      model: row[3],
      year: row[4],
      vin: row[5],
      category_name: row[6],
      category_desc: row[7],
      branch_name: row[8],
      city: row[9],
      status: row[10]
    }));
    
    res.json(cars);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch cars', details: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// Get categories
app.get('/api/categories', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(`SELECT category_id, name, description FROM Category`);
    
    const categories = result.rows.map(row => ({
      category_id: row[0],
      name: row[1],
      description: row[2]
    }));
    
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  } finally {
    if (connection) await connection.close();
  }
});

// Get branches
app.get('/api/branches', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(`SELECT branch_id, name, city, address FROM Branch`);
    
    const branches = result.rows.map(row => ({
      branch_id: row[0],
      name: row[1],
      city: row[2],
      address: row[3]
    }));
    
    res.json(branches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch branches' });
  } finally {
    if (connection) await connection.close();
  }
});

// ============= RESERVATION ROUTES =============

// Create reservation
app.post('/api/reservations', verifyToken, async (req, res) => {
  let connection;
  try {
    const { car_id, pickup_branch_id, return_branch_id, start_dt, end_dt, is_single_day } = req.body;
    const customer_id = req.userId;
    
    connection = await oracledb.getConnection();
    
    // Check car availability
    const checkAvail = await connection.execute(
      `SELECT car_id FROM Reservation 
       WHERE car_id = :car_id 
       AND status IN ('Booked', 'CheckedOut')
       AND (
         (TO_DATE(:start_dt, 'YYYY-MM-DD HH24:MI:SS') BETWEEN start_dt AND end_dt)
         OR (TO_DATE(:end_dt, 'YYYY-MM-DD HH24:MI:SS') BETWEEN start_dt AND end_dt)
       )`,
      { car_id, start_dt, end_dt }
    );
    
    if (checkAvail.rows.length > 0) {
      return res.status(400).json({ error: 'Car not available for selected dates' });
    }
    
    // Create reservation
    const result = await connection.execute(
      `INSERT INTO Reservation (customer_id, car_id, pickup_branch_id, return_branch_id, 
                                 start_dt, end_dt, is_single_day, status)
       VALUES (:customer_id, :car_id, :pickup_branch_id, :return_branch_id,
               TO_DATE(:start_dt, 'YYYY-MM-DD HH24:MI:SS'), TO_DATE(:end_dt, 'YYYY-MM-DD HH24:MI:SS'),
               :is_single_day, 'Booked')
       RETURNING res_id INTO :res_id`,
      {
        customer_id, car_id, pickup_branch_id, return_branch_id, start_dt, end_dt,
        is_single_day: is_single_day ? 1 : 0,
        res_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      { autoCommit: true }
    );
    
    const res_id = result.outBinds.res_id[0];
    
    res.json({ message: 'Reservation created successfully', res_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create reservation', details: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// Get user reservations
app.get('/api/reservations/my', verifyToken, async (req, res) => {
  let connection;
  try {
    const customer_id = req.userId;
    
    connection = await oracledb.getConnection();
    
    const result = await connection.execute(
      `SELECT r.res_id, r.start_dt, r.end_dt, r.status, r.is_single_day,
              c.make, c.model, c.reg_no,
              pb.name as pickup_branch, rb.name as return_branch
       FROM Reservation r
       JOIN Car c ON r.car_id = c.car_id
       JOIN Branch pb ON r.pickup_branch_id = pb.branch_id
       JOIN Branch rb ON r.return_branch_id = rb.branch_id
       WHERE r.customer_id = :customer_id
       ORDER BY r.start_dt DESC`,
      [customer_id]
    );
    
    const reservations = result.rows.map(row => ({
      res_id: row[0],
      start_dt: row[1],
      end_dt: row[2],
      status: row[3],
      is_single_day: row[4],
      car_make: row[5],
      car_model: row[6],
      reg_no: row[7],
      pickup_branch: row[8],
      return_branch: row[9]
    }));
    
    res.json(reservations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reservations', details: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// Get rate plan for pricing
app.get('/api/rateplan', async (req, res) => {
  let connection;
  try {
    const { category_id, day_type } = req.query;
    
    connection = await oracledb.getConnection();
    
    const result = await connection.execute(
      `SELECT base_daily_rate, single_day_base_rate, extra_hour_rate, deposit_amount
       FROM RatePlan
       WHERE category_id = :category_id
       AND day_type = :day_type
       AND SYSDATE BETWEEN effective_from AND effective_to`,
      { category_id, day_type: day_type || 'weekday' }
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rate plan not found' });
    }
    
    const ratePlan = {
      base_daily_rate: result.rows[0][0],
      single_day_base_rate: result.rows[0][1],
      extra_hour_rate: result.rows[0][2],
      deposit_amount: result.rows[0][3]
    };
    
    res.json(ratePlan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch rate plan' });
  } finally {
    if (connection) await connection.close();
  }
});

// ============= PAYMENT ROUTES =============

// Create payment
app.post('/api/payments', verifyToken, async (req, res) => {
  let connection;
  try {
    const { res_id, amount, currency, method, purpose } = req.body;
    
    connection = await oracledb.getConnection();
    
    const result = await connection.execute(
      `INSERT INTO Payment (res_id, amount, currency, method, purpose, txn_ref)
       VALUES (:res_id, :amount, :currency, :method, :purpose, :txn_ref)
       RETURNING payment_id INTO :payment_id`,
      {
        res_id, amount, currency: currency || 'PKR', method, purpose,
        txn_ref: 'TXN' + Date.now(),
        payment_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      { autoCommit: true }
    );
    
    const payment_id = result.outBinds.payment_id[0];
    
    res.json({ message: 'Payment recorded successfully', payment_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process payment', details: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'CarGo API is running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`CarGo server running on port ${PORT}`);
});

process.on('SIGINT', async () => {
  await oracledb.getPool().close(10);
  process.exit(0);
});