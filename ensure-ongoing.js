require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrateStatus() {
    console.log('🚀 Migrating task status names in Aiven database...');
    
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

        // 1. Add 'ongoing' to ENUM status
        console.log('🔄 Altering tasks status ENUM...');
        await connection.query("ALTER TABLE tasks MODIFY COLUMN status ENUM('pending', 'in_progress', 'completed', 'ongoing') DEFAULT 'pending'");
        console.log('✅ ENUM updated.');

        // 2. Update in_progress to ongoing
        const [result] = await connection.query("UPDATE tasks SET status = 'ongoing' WHERE status = 'in_progress'");
        console.log(`✅ Updated ${result.affectedRows} tasks from 'in_progress' to 'ongoing'.`);

        await connection.end();
        console.log('🎉 Migration complete!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    }
}

migrateStatus();
