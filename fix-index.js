require('dotenv').config();
const mysql = require('mysql2/promise');

async function updateUniqueKey() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT,
            ssl: { rejectUnauthorized: false }
        });

        console.log('Updating comment_reactions unique key...');
        
        // Remove existing unique keys if any
        try {
            await connection.query('ALTER TABLE comment_reactions DROP INDEX unique_user_reaction');
        } catch (e) {}
        try {
            await connection.query('ALTER TABLE comment_reactions DROP INDEX unique_reaction');
        } catch (e) {}

        // Add new unique key (one reaction per user per comment)
        await connection.query('ALTER TABLE comment_reactions ADD UNIQUE KEY unique_user_comment (comment_id, user_id)');
        console.log('✅ Updated unique key to (comment_id, user_id).');
        
        await connection.end();
    } catch (err) {
        console.error('Error:', err.message);
    }
}

updateUniqueKey();
