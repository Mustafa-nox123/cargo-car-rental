// Simple helper to update an existing customer's password with a bcrypt hash.
// Usage: node scripts/update_user_password.js <email> <newPassword>
// This script uses the same DB config as server.js via dotenv.

const oracledb = require('oracledb')
const bcrypt = require('bcryptjs')
require('dotenv').config()

async function run(){
  const [,, email, newPassword] = process.argv
  if(!email || !newPassword){
    console.error('Usage: node scripts/update_user_password.js <email> <newPassword>')
    process.exit(1)
  }

  const dbConfig = {
    user: process.env.DB_USER || 'c##car_rental',
    password: process.env.DB_PASSWORD || '123',
    connectString: process.env.DB_CONNECT_STRING || 'localhost:1521/orcl'
  }

  let connection
  try{
    connection = await oracledb.getConnection(dbConfig)
    const result = await connection.execute(
      `SELECT customer_id, email FROM customer WHERE email = :email`,
      [email]
    )

    if(result.rows.length === 0){
      console.error('No customer found with email:', email)
      process.exit(2)
    }

    const customerId = result.rows[0][0]
    const hashed = await bcrypt.hash(newPassword, 10)

    await connection.execute(
      `UPDATE customer SET password = :pwd WHERE customer_id = :id`,
      { pwd: hashed, id: customerId },
      { autoCommit: true }
    )

    console.log('Updated password for customer_id', customerId)
  } catch(err){
    console.error('Error updating password:', err)
    process.exit(3)
  } finally{
    if(connection) await connection.close()
  }
}

run()
