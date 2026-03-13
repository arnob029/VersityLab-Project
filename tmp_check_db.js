require('dotenv').config();
const mysql = require('mysql2');

async function checkDb() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : null
    }).promise();

    try {
        console.log('--- Database Check ---');
        
        const [commentsCols] = await pool.query('SHOW COLUMNS FROM comments');
        console.log('\nComments table columns:');
        console.log(commentsCols.map(c => c.Field));

        const [tables] = await pool.query('SHOW TABLES');
        console.log('\nTables in DB:');
        console.log(tables.map(t => Object.values(t)[0]));

    } catch (error) {
        console.error('Database connection error:', error.message);
    } finally {
        await pool.end();
    }
}

checkDb();
