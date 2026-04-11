require('dotenv').config();
const mysql = require('mysql2');

async function migrate() {
    const conn = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
        multipleStatements: true,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : null
    }).promise();

    try {
        console.log('🚀 Starting migration on Aiven database...');

        // 1. Add parent_id to comments
        const [commentCols] = await conn.query("SHOW COLUMNS FROM comments LIKE 'parent_id'");
        if (commentCols.length === 0) {
            await conn.query('ALTER TABLE comments ADD COLUMN parent_id INT DEFAULT NULL');
            await conn.query('ALTER TABLE comments ADD FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE');
            console.log('✅ Added parent_id column to comments table.');
        } else {
            console.log('ℹ️ parent_id column already exists.');
        }

        // 2. Create/Update comment_reactions table
        await conn.query(`
            CREATE TABLE IF NOT EXISTS comment_reactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                comment_id INT NOT NULL,
                user_id INT NOT NULL,
                reaction VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_reaction (comment_id, user_id, reaction)
            )
        `);

        // Check if we need to rename 'emoji' to 'reaction'
        const [reactionCols] = await conn.query("SHOW COLUMNS FROM comment_reactions LIKE 'emoji'");
        if (reactionCols.length > 0) {
            await conn.query('ALTER TABLE comment_reactions CHANGE COLUMN emoji reaction VARCHAR(50) NOT NULL');
            console.log('✅ Renamed emoji column to reaction in comment_reactions.');
        }

        // Check if we need to add the unique key if it was missing or had different name
        const [indexes] = await conn.query("SHOW INDEX FROM comment_reactions WHERE Key_name = 'unique_user_reaction'");
        if (indexes.length === 0) {
            // Check for the old name from setup-db.js
            const [oldIndexes] = await conn.query("SHOW INDEX FROM comment_reactions WHERE Key_name = 'unique_reaction'");
            if (oldIndexes.length > 0) {
                await conn.query('ALTER TABLE comment_reactions DROP INDEX unique_reaction');
            }
            await conn.query('ALTER TABLE comment_reactions ADD UNIQUE KEY unique_user_reaction (comment_id, user_id, reaction)');
            console.log('✅ Updated unique key on comment_reactions.');
        }

        console.log('✅ Created comment_reactions table.');

        console.log('\n🎉 Migration complete!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await conn.end();
    }
}

migrate();
