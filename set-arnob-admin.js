require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function setArnobAsAdmin() {
    console.log('🚀 Setting up Arnob as Admin...');
    
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT,
            ssl: { rejectUnauthorized: false }
        });

        console.log('✅ Connected to TiDB.');

        const email = 'arnob0653@gmail.com';
        const name = 'Arnob';
        const password = '@Ar87?&Pu';
        const hashedPassword = await bcrypt.hash(password, 10);

        // 1. Remove old admin if exists
        await connection.query("DELETE FROM users WHERE email = 'admin@taskmanager.com'");
        console.log('🗑️ Removed old default admin.');

        // 2. Check if Arnob already exists
        const [existing] = await connection.query("SELECT id FROM users WHERE email = ?", [email]);
        
        if (existing.length > 0) {
            // Update existing user to admin with new password
            await connection.query(
                "UPDATE users SET name = ?, password = ?, role = 'admin' WHERE email = ?",
                [name, hashedPassword, email]
            );
            console.log('✅ Updated existing user Arnob to Admin.');
        } else {
            // Insert new admin user
            await connection.query(
                "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin')",
                [name, email, hashedPassword]
            );
            console.log('✅ Created new Admin account for Arnob.');
        }

        await connection.end();
        console.log('\n🎉 Successfully set up your new Admin credentials!');
        console.log('   Email:    arnob0653@gmail.com');
        console.log('   Password: @Ar87?&Pu\n');
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

setArnobAsAdmin();
