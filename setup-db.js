require('dotenv').config();
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

async function setup() {
    // First connect without a database to create it
    const conn = mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        port: process.env.DB_PORT || 3306,
        multipleStatements: true,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : null
    }).promise();

    try {
        console.log('🔧 Setting up TiDB Cloud database...\n');
        
        const dbName = process.env.DB_NAME || 'test';
        await conn.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
        console.log(`✅ Database checked/created: ${dbName}`);

        await conn.query(`USE ${dbName}`);

        // Create users table
        await conn.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role ENUM('admin', 'user') DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Table created: users');

        // Create tasks table
        await conn.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                description TEXT,
                status ENUM('pending', 'in_progress', 'completed', 'ongoing') DEFAULT 'pending',
                assigned_user_id INT,
                deadline DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);
        console.log('✅ Table created: tasks');

        // Create comments table
        await conn.query(`
            CREATE TABLE IF NOT EXISTS comments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                task_id INT NOT NULL,
                user_id INT NOT NULL,
                comment TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Table created: comments');

        // Create reactions table (missing from previous setup)
        await conn.query(`
            CREATE TABLE IF NOT EXISTS comment_reactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                comment_id INT NOT NULL,
                user_id INT NOT NULL,
                emoji VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_reaction (comment_id, user_id, emoji),
                FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Table created: comment_reactions');

        // Seed admin user
        const [existing] = await conn.query("SELECT id FROM users WHERE email = 'admin@taskmanager.com'");
        if (existing.length === 0) {
            const hash = await bcrypt.hash('password', 10);
            await conn.query(
                "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
                ['Admin', 'admin@taskmanager.com', hash, 'admin']
            );
            console.log('✅ Default admin user created');
        } else {
            console.log('ℹ️  Admin user already exists');
        }

        console.log('\n🎉 Database setup complete on TiDB Cloud!');
    } catch (error) {
        console.error('❌ Setup error:', error);
        process.exit(1);
    }


    await conn.end();
}

setup();
