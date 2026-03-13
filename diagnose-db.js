require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkDB() {
    console.log('--- AIVEN DB DIAGNOSTICS ---');
    console.log('Host:', process.env.DB_HOST);
    
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT,
            ssl: { rejectUnauthorized: false }
        });

        console.log('✅ Connected successfully!');

        // Check tables
        const [tables] = await connection.query('SHOW TABLES');
        console.log('Tables:', tables.map(t => Object.values(t)[0]));

        // Check tasks status values
        const [statusCounts] = await connection.query('SELECT status, COUNT(*) as count FROM tasks GROUP BY status');
        console.log('Task Status Counts:', statusCounts);

        // Check columns in comments
        const [commentCols] = await connection.query('SHOW COLUMNS FROM comments');
        console.log('Comment Columns:', commentCols.map(c => c.Field));

        // Check reactions table rows
        const [reactionRows] = await connection.query('SELECT COUNT(*) as count FROM comment_reactions');
        console.log('Total Reactions:', reactionRows[0].count);

        await connection.end();
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
    }
}

checkDB();
