require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkReactions() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT,
            ssl: { rejectUnauthorized: false }
        });

        const [reactionCols] = await connection.query('SHOW COLUMNS FROM comment_reactions');
        console.log('Reaction Columns:', reactionCols.map(c => c.Field));
        
        await connection.end();
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkReactions();
