// Helper to update an admin user's password across common admin tables.
// Usage: node scripts/update_admin_password.js <email> <newPassword>
// It will try common table names (admin_users, admin, admins, administrator),
// map the password column heuristically (PASS, PWD, PASSWORD, PASSWD) and update it.

const oracledb = require('oracledb')
const bcrypt = require('bcryptjs')
require('dotenv').config()

async function run(){
  const [,, email, newPassword] = process.argv
  if(!email || !newPassword){
    console.error('Usage: node scripts/update_admin_password.js <email> <newPassword>')
    process.exit(1)
  }

  const dbConfig = {
    user: process.env.DB_USER || 'c##car_rental',
    password: process.env.DB_PASSWORD || '123',
    connectString: process.env.DB_CONNECT_STRING || 'localhost:1521/orcl'
  }

  const tryTables = [ 'admin_users', 'admin', 'admins', 'administrator' ]

  let connection
  try{
    connection = await oracledb.getConnection(dbConfig)

    for(const t of tryTables){
      try{
        const result = await connection.execute(
          `SELECT * FROM ${t} WHERE email = :email`,
          [email]
        )

        if(!result || !result.rows || result.rows.length === 0) continue

        // build map of column name -> index / value
        const meta = result.metaData || []
        const row = result.rows[0]
        const colMap = {}
        for(let i=0;i<meta.length;i++){
          const name = (meta[i].name || meta[i].NAME || '').toString().toUpperCase()
          colMap[name] = { index: i, value: row[i] }
        }

        // find password-like column
        const passKey = Object.keys(colMap).find(k => /(PASS|PWD|PASSWORD|PASSWD)/i.test(k))
        const idKey = Object.keys(colMap).find(k => /(^|_)ID$/.test(k) || k === 'ADMIN_ID')

        if(!passKey){
          console.warn(`Table ${t} matched by email but no password-like column found; trying next table`)
          continue
        }

        const hashed = await bcrypt.hash(newPassword, 10)

        if(idKey){
          const idVal = colMap[idKey].value
          await connection.execute(
            `UPDATE ${t} SET ${passKey} = :pwd WHERE ${idKey} = :id`,
            { pwd: hashed, id: idVal },
            { autoCommit: true }
          )
          console.log(`Updated password for admin id ${idVal} in table ${t}`)
          process.exit(0)
        } else {
          // fallback to matching by email column name
          const emailKey = Object.keys(colMap).find(k => /EMAIL/.test(k)) || 'EMAIL'
          await connection.execute(
            `UPDATE ${t} SET ${passKey} = :pwd WHERE ${emailKey} = :email`,
            { pwd: hashed, email },
            { autoCommit: true }
          )
          console.log(`Updated password for email ${email} in table ${t}`)
          process.exit(0)
        }

      } catch(e){
        // ignore and try next table
      }
    }

    console.error('No admin row found for email in known admin tables')
    process.exit(2)

  } catch(err){
    console.error('Error updating admin password:', err)
    process.exit(3)
  } finally{
    if(connection) await connection.close()
  }
}

run()
