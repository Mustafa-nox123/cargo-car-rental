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
const path = require('path')
const fs = require('fs')
// multer for file uploads
let multer
try { multer = require('multer') } catch(e) { console.warn('multer not installed; image upload endpoints will fail until multer is added') }

// ensure upload dir exists
const VEHICLE_UPLOAD_DIR = path.join(__dirname, 'public', 'uploads', 'vehicles')
try { fs.mkdirSync(VEHICLE_UPLOAD_DIR, { recursive: true }) } catch(e) {}

let upload = null
if(multer){
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, VEHICLE_UPLOAD_DIR)
    },
    filename: function (req, file, cb) {
      const safe = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_')
      cb(null, safe)
    }
  })
  upload = multer({ storage })
}

// Oracle DB Configuration
const dbConfig = {
  user: process.env.DB_USER || 'c##car_rental',
  password: process.env.DB_PASSWORD || '123',
  connectString: process.env.DB_CONNECT_STRING || 'localhost:1521/orcl'
};
console.log('DB CONFIG USED BY NODE:', dbConfig);


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

// Verify admin token (JWT must include isAdmin: true)
const verifyAdmin = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(403).json({ error: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET || 'cargo_secret_key_2025', (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Unauthorized' });
    if (!decoded.isAdmin) return res.status(403).json({ error: 'Admin access required' });
    req.adminId = decoded.id;
    next();
  });
};

// ============= AUTH ROUTES =============

// Register
app.post('/api/auth/register', async (req, res) => {
  let connection;
  try {
    const { name, email, password, phone, license_no, license_expiry, address, national_id } = req.body;

    // Split "name" into FIRST_NAME + LAST_NAME
    const parts = (name || '').trim().split(' ');
    const first_name = parts[0] || null;
    const last_name  = parts.slice(1).join(' ') || null;

    connection = await oracledb.getConnection();

    // Check if user exists
    const checkUser = await connection.execute(
      `SELECT customer_id FROM customer WHERE email = :email`,
      [email]
    );

    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new customer into YOUR CUSTOMER table
    const result = await connection.execute(
      `INSERT INTO customer (
         first_name, last_name, email, password,
         phone_no, license_no, license_expiry, address, national_id
       ) VALUES (
         :first_name, :last_name, :email, :password,
         :phone_no, :license_no,
         TO_DATE(:license_expiry, 'YYYY-MM-DD'),
         :address, :national_id
       )
       RETURNING customer_id INTO :id`,
      {
        first_name,
        last_name,
        email,
        password: hashedPassword,
        phone_no: phone,
        license_no,
        license_expiry,
        address,
        national_id,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      { autoCommit: true }
    );

    const customerId = result.outBinds.id[0];

    const token = jwt.sign(
      { id: customerId },
      process.env.JWT_SECRET || 'cargo_secret_key_2025',
      { expiresIn: '7d' }
    );

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
      `SELECT customer_id, first_name, last_name, email, password
         FROM customer
        WHERE email = :email`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const row = result.rows[0];
    const user = {
      customer_id: row[0],
      first_name:  row[1],
      last_name:   row[2],
      email:       row[3],
      password:    row[4],
    };

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.customer_id },
      process.env.JWT_SECRET || 'cargo_secret_key_2025',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.customer_id,
        name: `${user.first_name} ${user.last_name || ''}`.trim(),
        email: user.email
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed', details: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// ============= BRANCH ROUTES =============

// Get all branches
app.get('/api/branches', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();

    const result = await connection.execute(
      `SELECT branch_id,
              branch_name,
              city,
              address_line,
              phone_no
         FROM branch
         ORDER BY city, branch_name`
    );

    const branches = result.rows.map(r => ({
      branch_id: r[0],
      branch_name: r[1],
      city: r[2],
      address: r[3],
      phone_no: r[4]
    }));

    res.json(branches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch branches', details: err.message });
  } finally {
    if (connection) await connection.close();
  }
});


// Get vehicle types (e.g. Economy, SUV, etc.)
app.get('/api/vehicle-types', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();

    const result = await connection.execute(
      `SELECT vehicle_type_id, type_name, daily_rate, description
         FROM vehicle_type
         ORDER BY daily_rate`
    );

    const types = result.rows.map(r => ({
      vehicle_type_id: r[0],
      type_name: r[1],
      daily_rate: r[2],
      description: r[3]
    }));

    res.json(types);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch vehicle types', details: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// Admin: create vehicle type
app.post('/api/vehicle-types', verifyAdmin, async (req, res) => {
  let connection;
  try {
    const { type_name, daily_rate, description } = req.body;
    connection = await oracledb.getConnection();
    const result = await connection.execute(
      `INSERT INTO vehicle_type (type_name, daily_rate, description)
       VALUES (:type_name, :daily_rate, :description)
       RETURNING vehicle_type_id INTO :id`,
      { type_name, daily_rate, description, id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } },
      { autoCommit: true }
    );
    const id = result.outBinds.id[0];
    res.json({ message: 'Vehicle type created', id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create vehicle type', details: err.message });
  } finally { if (connection) await connection.close(); }
});

// Admin: update vehicle type
app.put('/api/vehicle-types/:id', verifyAdmin, async (req, res) => {
  let connection;
  try {
    const id = Number(req.params.id);
    const { type_name, daily_rate, description } = req.body;
    connection = await oracledb.getConnection();
    await connection.execute(
      `UPDATE vehicle_type SET type_name = :type_name, daily_rate = :daily_rate, description = :description WHERE vehicle_type_id = :id`,
      { type_name, daily_rate, description, id },
      { autoCommit: true }
    );
    res.json({ message: 'Vehicle type updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update vehicle type', details: err.message });
  } finally { if (connection) await connection.close(); }
});

// Admin: delete vehicle type
app.delete('/api/vehicle-types/:id', verifyAdmin, async (req, res) => {
  let connection;
  try {
    const id = Number(req.params.id);
    connection = await oracledb.getConnection();
    await connection.execute(`DELETE FROM vehicle_type WHERE vehicle_type_id = :id`, { id }, { autoCommit: true });
    res.json({ message: 'Vehicle type deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete vehicle type', details: err.message });
  } finally { if (connection) await connection.close(); }
});


// ============= VEHICLE ROUTES =============

// Get available vehicles for optional date range, type, branch
app.get('/api/vehicles/available', async (req, res) => {
  let connection;
  try {
    const { start_date, end_date, vehicle_type_id, branch_id } = req.query;
    connection = await oracledb.getConnection();

    let query = `
      SELECT v.vehicle_id,
             v.registration_no,
             v.make,
             v.model,
             v.year_made,
        v.image_url,
             vt.type_name,
             vt.description,
             vt.daily_rate,
             b.branch_name,
             b.city,
             v.status
        FROM vehicle v
        JOIN vehicle_type vt ON vt.vehicle_type_id = v.vehicle_type_id
        JOIN branch b ON b.branch_id = v.branch_id
       WHERE v.status = 'AVAILABLE'
    `;

    const binds = {};

    if (vehicle_type_id) {
      query += ` AND v.vehicle_type_id = :vehicle_type_id`;
      binds.vehicle_type_id = Number(vehicle_type_id);
    }

    if (branch_id) {
      query += ` AND v.branch_id = :branch_id`;
      binds.branch_id = Number(branch_id);
    }

    // Exclude cars already reserved in the given date range
    if (start_date && end_date) {
      query += `
        AND v.vehicle_id NOT IN (
          SELECT r.vehicle_id
            FROM reservation r
           WHERE r.status IN ('BOOKED', 'CONVERTED')
             AND (
                  r.start_date <= TO_DATE(:end_date, 'YYYY-MM-DD')
              AND r.end_date   >= TO_DATE(:start_date, 'YYYY-MM-DD')
                 )
        )
      `;
      binds.start_date = start_date;
      binds.end_date   = end_date;
    }

    const result = await connection.execute(query, binds);

    const vehicles = result.rows.map(r => ({
      vehicle_id: r[0],
      registration_no: r[1],
      make: r[2],
      model: r[3],
      year_made: r[4],
      image_url: r[5],
      type_name: r[6],
      type_description: r[7],
      daily_rate: r[8],
      branch_name: r[9],
      city: r[10],
      status: r[11]
    }));

    res.json(vehicles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch vehicles', details: err.message });
  } finally {
    if (connection) await connection.close();
  }
});


// ============= RESERVATION ROUTES =============

// Create a reservation
app.post('/api/reservations', verifyToken, async (req, res) => {
  let connection;
  try {
    const {
      vehicle_id,
      pickup_branch_id,
      dropoff_branch_id,
      start_date,
      end_date
    } = req.body;

    const customer_id = req.userId;

    connection = await oracledb.getConnection();

    // Check if vehicle is already reserved in that period
    const check = await connection.execute(
      `SELECT reservation_id
         FROM reservation
        WHERE vehicle_id = :vehicle_id
          AND status IN ('BOOKED', 'CONVERTED')
          AND (
               start_date <= TO_DATE(:end_date, 'YYYY-MM-DD')
           AND end_date   >= TO_DATE(:start_date, 'YYYY-MM-DD')
          )`,
      { vehicle_id, start_date, end_date }
    );

    if (check.rows.length > 0) {
      return res.status(400).json({ error: 'Vehicle is not available in that date range' });
    }

    // Insert reservation
    const result = await connection.execute(
      `INSERT INTO reservation
         (customer_id, vehicle_id, pickup_branch_id, dropoff_branch_id,
          start_date, end_date, status)
       VALUES
         (:customer_id, :vehicle_id, :pickup_branch_id, :dropoff_branch_id,
          TO_DATE(:start_date, 'YYYY-MM-DD'),
          TO_DATE(:end_date,   'YYYY-MM-DD'),
          'BOOKED')
       RETURNING reservation_id INTO :res_id`,
      {
        customer_id,
        vehicle_id,
        pickup_branch_id,
        dropoff_branch_id,
        start_date,
        end_date,
        res_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      { autoCommit: true }
    );

    const reservation_id = result.outBinds.res_id[0];

    res.json({ message: 'Reservation created successfully', reservation_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create reservation', details: err.message });
  } finally {
    if (connection) await connection.close();
  }
});


// Get reservations for logged-in customer
app.get('/api/reservations/my', verifyToken, async (req, res) => {
  let connection;
  try {
    const customer_id = req.userId;
    connection = await oracledb.getConnection();

    const result = await connection.execute(
      `SELECT r.reservation_id,
              r.start_date,
              r.end_date,
              r.status,
              v.make,
              v.model,
              v.registration_no,
              pb.branch_name AS pickup_branch,
              db.branch_name AS dropoff_branch
         FROM reservation r
         JOIN vehicle v ON r.vehicle_id = v.vehicle_id
         JOIN branch pb ON r.pickup_branch_id = pb.branch_id
         JOIN branch db ON r.dropoff_branch_id = db.branch_id
        WHERE r.customer_id = :customer_id
        ORDER BY r.start_date DESC`,
      { customer_id }
    );

    const reservations = result.rows.map(r => ({
      reservation_id: r[0],
      start_date: r[1],
      end_date: r[2],
      status: r[3],
      vehicle_make: r[4],
      vehicle_model: r[5],
      registration_no: r[6],
      pickup_branch: r[7],
      dropoff_branch: r[8]
    }));

    res.json(reservations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reservations', details: err.message });
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

// ============= RENTAL ROUTES =============

// Start a rental (convert reservation → rental)
app.post('/api/rentals/start', verifyToken, async (req, res) => {
  let connection;
  try {
    const { reservation_id } = req.body;
    connection = await oracledb.getConnection();

    const result = await connection.execute(
      `
      BEGIN
        START_RENTAL(
          p_reservation_id => :reservation_id,
          p_pickup_dt      => SYSDATE,
          p_rental_id      => :out_rental_id
        );
      END;
      `,
      {
        reservation_id,
        out_rental_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );

    res.json({
      message: "Rental started successfully",
      rental_id: result.outBinds.out_rental_id[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to start rental", details: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// Close rental → returns total amount
app.post('/api/rentals/close', verifyToken, async (req, res) => {
  let connection;
  try {
    const { rental_id, dropoff_branch_id } = req.body;
    connection = await oracledb.getConnection();

    const result = await connection.execute(
      `
      DECLARE
        v_total NUMBER;
      BEGIN
        CLOSE_RENTAL(
          p_rental_id         => :rental_id,
          p_dropoff_branch_id => :dropoff_branch_id,
          p_total             => :v_total
        );
      END;
      `,
      {
        rental_id,
        dropoff_branch_id,
        v_total: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );

    res.json({
      message: "Rental closed successfully",
      total_amount: result.outBinds.v_total[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to close rental", details: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

app.get('/api/rentals/my', verifyToken, async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(
      `SELECT r.rental_id,
              r.pickup_datetime,
              r.dropoff_datetime,
              r.status,
              v.make,
              v.model,
              v.registration_no,
              r.total_amount
         FROM rental r
         JOIN vehicle v ON r.vehicle_id = v.vehicle_id
        WHERE r.customer_id = :customer_id
        ORDER BY r.pickup_datetime DESC`,
      { customer_id: req.userId }
    );

    const rentals = result.rows.map(r => ({
      rental_id: r[0],
      pickup_datetime: r[1],
      dropoff_datetime: r[2],
      status: r[3],
      make: r[4],
      model: r[5],
      registration_no: r[6],
      total_amount: r[7]
    }));

    res.json(rentals);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch rentals", details: err.message });
  } finally {
    if (connection) await connection.close();
  }
});





// ============= PAYMENT ROUTES =============

// Create payment for a rental
app.post('/api/payments', verifyToken, async (req, res) => {
  let connection;
  try {
    const { rental_id, amount, method, remarks } = req.body;
    const customer_id = req.userId;

    connection = await oracledb.getConnection();

    // Optional safety check: make sure this rental belongs to the logged-in user
    const check = await connection.execute(
      `SELECT customer_id
         FROM rental
        WHERE rental_id = :rental_id`,
      { rental_id }
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Rental not found' });
    }

    const rentalCustomer = check.rows[0][0];
    if (rentalCustomer !== customer_id) {
      return res.status(403).json({ error: 'You are not allowed to pay for this rental' });
    }

    // Call your PL/SQL procedure MAKE_PAYMENT
    await connection.execute(
      `
      BEGIN
        MAKE_PAYMENT(
          p_rental_id => :rental_id,
          p_amount    => :amount,
          p_method    => :method,
          p_remarks   => :remarks
        );
      END;
      `,
      {
        rental_id,
        amount,
        method: method || 'CASH',
        remarks
      }
    );

    // Procedure handles INSERT + COMMIT
    res.json({ message: 'Payment recorded successfully' });

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

// ============= ADMIN AUTH ROUTES =============
// Admin login: attempts to authenticate against common admin tables (admin_users, admin)
app.post('/api/admin/login', async (req, res) => {
  let connection;
  try {
    const { email, password } = req.body;
    if(!email || !password) return res.status(400).json({ error: 'Email and password required' });

    connection = await oracledb.getConnection();

    // Try common admin table names. If found, map columns by name (using metaData)
    const tryTables = [ 'admin_users', 'admin', 'admins', 'administrator' ]
    let result = null
    let foundTable = null
    for (const t of tryTables) {
      try {
        // select all columns so we can map by name using result.metaData
        result = await connection.execute(`SELECT * FROM ${t} WHERE email = :email`, [email])
        if (result.rows && result.rows.length > 0) { foundTable = t; break }
      } catch (e) {
        // ignore missing table or other SQL errors for this probe
      }
    }

    if (!result || !result.rows || result.rows.length === 0) return res.status(401).json({ error: 'Invalid admin credentials' })

    const row = result.rows[0]
    // Build a map of columnName -> value using result.metaData (Oracle returns uppercase names)
    const meta = result.metaData || []
    const obj = {}
    for (let i = 0; i < meta.length; i++) {
      const col = (meta[i].name || meta[i].NAME || '').toString()
      obj[col.toUpperCase()] = row[i]
    }

    // Determine likely column names (case-insensitive)
    const idKey = Object.keys(obj).find(k => /(^|_)id$/.test(k) || k === 'ADMIN_ID')
    const nameKey = Object.keys(obj).find(k => /NAME/.test(k))
    const emailKey = Object.keys(obj).find(k => /EMAIL/.test(k))
    const passKey = Object.keys(obj).find(k => /(PASS|PWD)/.test(k))

    if(!passKey) return res.status(401).json({ error: 'Invalid admin credentials' })

    const admin = {
      admin_id: idKey ? obj[idKey] : null,
      name: nameKey ? obj[nameKey] : null,
      email: emailKey ? obj[emailKey] : null,
      password: obj[passKey]
    }

  console.log('Admin login: found table', foundTable, 'for email', admin.email)
  if(!admin.password) return res.status(401).json({ error: 'Invalid admin credentials' })
  const valid = await bcrypt.compare(password, admin.password);
    if(!valid) return res.status(401).json({ error: 'Invalid admin credentials' });

    const token = jwt.sign(
      { id: admin.admin_id, isAdmin: true },
      process.env.JWT_SECRET || 'cargo_secret_key_2025',
      { expiresIn: '7d' }
    );

    res.json({ message: 'Admin login successful', token, admin: { id: admin.admin_id, name: admin.name, email: admin.email } });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Admin login failed', details: err.message });
  } finally {
    if(connection) await connection.close();
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`CarGo server running on port ${PORT}`);
});

process.on('SIGINT', async () => {
  await oracledb.getPool().close(10);
  process.exit(0);
});

// Admin: create branch
app.post('/api/branches', verifyAdmin, async (req, res) => {
  let connection;
  try {
    const { branch_name, city, address_line, phone_no } = req.body;
    connection = await oracledb.getConnection();
    const result = await connection.execute(
      `INSERT INTO branch (branch_name, city, address_line, phone_no)
       VALUES (:branch_name, :city, :address_line, :phone_no)
       RETURNING branch_id INTO :id`,
      {
        branch_name, city, address_line, phone_no,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      { autoCommit: true }
    );
    const branchId = result.outBinds.id[0];
    res.json({ message: 'Branch created', branchId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create branch', details: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// Admin: update branch
app.put('/api/branches/:id', verifyAdmin, async (req, res) => {
  let connection;
  try {
    const id = Number(req.params.id);
    const { branch_name, city, address_line, phone_no } = req.body;
    connection = await oracledb.getConnection();
    await connection.execute(
      `UPDATE branch SET branch_name = :branch_name, city = :city, address_line = :address_line, phone_no = :phone_no WHERE branch_id = :id`,
      { branch_name, city, address_line, phone_no, id },
      { autoCommit: true }
    );
    res.json({ message: 'Branch updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update branch', details: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// Admin: delete branch
app.delete('/api/branches/:id', verifyAdmin, async (req, res) => {
  let connection;
  try {
    const id = Number(req.params.id);
    connection = await oracledb.getConnection();
    await connection.execute(
      `DELETE FROM branch WHERE branch_id = :id`,
      { id },
      { autoCommit: true }
    );
    res.json({ message: 'Branch deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete branch', details: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// Admin: create vehicle
app.post('/api/vehicles', verifyAdmin, async (req, res) => {
  let connection;
  try {
    const { registration_no, make, model, year_made, vehicle_type_id, branch_id, status } = req.body;
    connection = await oracledb.getConnection();
    const result = await connection.execute(
      `INSERT INTO vehicle (registration_no, make, model, year_made, vehicle_type_id, branch_id, status)
       VALUES (:registration_no, :make, :model, :year_made, :vehicle_type_id, :branch_id, :status)
       RETURNING vehicle_id INTO :id`,
      {
        registration_no, make, model, year_made, vehicle_type_id, branch_id, status,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      { autoCommit: true }
    );
    const vehicleId = result.outBinds.id[0];
    res.json({ message: 'Vehicle created', vehicleId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create vehicle', details: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// Admin: update vehicle
app.put('/api/vehicles/:id', verifyAdmin, async (req, res) => {
  let connection;
  try {
    const id = Number(req.params.id);
    const { registration_no, make, model, year_made, vehicle_type_id, branch_id, status } = req.body;
    connection = await oracledb.getConnection();
    await connection.execute(
      `UPDATE vehicle SET registration_no = :registration_no, make = :make, model = :model, year_made = :year_made, vehicle_type_id = :vehicle_type_id, branch_id = :branch_id, status = :status WHERE vehicle_id = :id`,
      { registration_no, make, model, year_made, vehicle_type_id, branch_id, status, id },
      { autoCommit: true }
    );
    res.json({ message: 'Vehicle updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update vehicle', details: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// Admin: delete vehicle
app.delete('/api/vehicles/:id', verifyAdmin, async (req, res) => {
  let connection;
  try {
    const id = Number(req.params.id);
    connection = await oracledb.getConnection();
    await connection.execute(
      `DELETE FROM vehicle WHERE vehicle_id = :id`,
      { id },
      { autoCommit: true }
    );
    res.json({ message: 'Vehicle deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete vehicle', details: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// Admin: upload image for vehicle
app.post('/api/vehicles/:id/images', verifyAdmin, async (req, res) => {
  if(!upload) return res.status(500).json({ error: 'File upload not configured on server' })
  const handler = upload.single('image')
  handler(req, res, async function(err){
    if(err) return res.status(500).json({ error: 'Upload failed', details: err.message })
    if(!req.file) return res.status(400).json({ error: 'No file provided' })
    const filename = req.file.filename
    const publicPath = `/uploads/vehicles/${filename}`
    // try to persist to vehicle table if image_url column exists
    let connection
    try{
      connection = await oracledb.getConnection()
      try{
        await connection.execute(
          `UPDATE vehicle SET image_url = :url WHERE vehicle_id = :id`,
          { url: publicPath, id: Number(req.params.id) },
          { autoCommit: true }
        )
      }catch(e){
        // ignore if column/table doesn't exist
      }
    }catch(e){
      // ignore connection errors; upload still succeeded
    }finally{
      if(connection) await connection.close()
    }

    res.json({ message: 'Upload successful', url: publicPath })
  })
})

// Admin: delete image file for vehicle (and unset image_url if present)
app.delete('/api/vehicles/:id/images/:filename', verifyAdmin, async (req, res) => {
  const { filename } = req.params
  const filePath = path.join(VEHICLE_UPLOAD_DIR, filename)
  try{
    if(fs.existsSync(filePath)) fs.unlinkSync(filePath)
    // try to unset image_url if it points to this file
    let connection
    try{
      connection = await oracledb.getConnection()
      try{
        await connection.execute(
          `UPDATE vehicle SET image_url = NULL WHERE vehicle_id = :id AND image_url = :url`,
          { id: Number(req.params.id), url: `/uploads/vehicles/${filename}` },
          { autoCommit: true }
        )
      }catch(e){ }
    }catch(e){ }finally{ if(connection) await connection.close() }

    res.json({ message: 'Deleted' })
  }catch(err){
    res.status(500).json({ error: 'Failed to delete', details: err.message })
  }
})