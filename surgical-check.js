require('dotenv').config();
const mysql = require('mysql2/promise');

async function surgicalCheck() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT,
            ssl: { rejectUnauthorized: false }
        });

        console.log('✅ Connected.');

        // 1. Check current column definition
        const [rows] = await connection.query("SHOW COLUMNS FROM tasks LIKE 'status'");
        console.log('Current Status Definition:', rows[0].Type);

        // 2. Try ALTER TABLE individually
        console.log('🔄 Attempting ALTER TABLE...');
        try {
            await connection.query("ALTER TABLE tasks MODIFY COLUMN status ENUM('pending', 'in_progress', 'completed', 'ongoing') DEFAULT 'pending'");
            console.log('✅ ALTER TABLE Success!');
        } catch (e) {
            console.error('❌ ALTER TABLE Failed:', e.message);
        }

        // 3. Check values in the table
        const [values] = await connection.query("SELECT DISTINCT status FROM tasks");
        console.log('Distinct status values currently in DB:', values);

        await connection.end();
    } catch (err) {
        console.error('❌ Connection/Overall error:', err.message);
    }
}

surgicalCheck();
