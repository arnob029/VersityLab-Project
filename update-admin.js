require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function updateAdmin() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        port: process.env.DB_PORT || 27176,
        database: process.env.DB_NAME || 'task_management',
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : null
    });

    try {
        console.log('🔄 Updating admin account...');

        // Check if the user arnob0653@gmail.com exists
        const [rows] = await conn.query('SELECT * FROM users WHERE email = ?', ['arnob0653@gmail.com']);
        
        const hash = await bcrypt.hash('@Ar87?&Pu', 10);
        
        if (rows.length > 0) {
            // User exists, just update role and password
            await conn.query('UPDATE users SET role = \'admin\', password = ? WHERE email = ?', [hash, 'arnob0653@gmail.com']);
            console.log('✅ User arnob0653@gmail.com updated to admin');
        } else {
            // User doesn't exist, create missing admin
             await conn.query(
                "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
                ['Arnob', 'arnob0653@gmail.com', hash, 'admin']
            );
            console.log('✅ Created new admin account for arnob0653@gmail.com');
        }

        // Delete the old admin
        await conn.query('DELETE FROM users WHERE email = \'admin@taskmanager.com\'');
        console.log('🗑️ Deleted old default admin (admin@taskmanager.com)');

    } catch (e) {
        console.error('❌ Error updating admin:', e.message);
    } finally {
        await conn.end();
        console.log('✅ Done!');
        process.exit(0);
    }
}

updateAdmin();
