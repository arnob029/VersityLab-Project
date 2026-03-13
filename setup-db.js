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
        console.log('🔧 Setting up Task Management System database...\n');

        await conn.query('CREATE DATABASE IF NOT EXISTS task_management');
        console.log('✅ Database created: task_management');

        await conn.query('USE task_management');

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
                status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
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

        // Seed sample user
        const [existingUser] = await conn.query("SELECT id FROM users WHERE email = 'rahim@example.com'");
        if (existingUser.length === 0) {
            const hash = await bcrypt.hash('password123', 10);
            await conn.query(
                "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
                ['Rahim Ahmed', 'rahim@example.com', hash, 'user']
            );
            console.log('✅ Sample user created: rahim@example.com (password: password123)');
        }

        console.log('\n🎉 Database setup complete!');
        console.log('\n📋 Login Credentials:');
        console.log('   Admin  → admin@taskmanager.com / password');
        console.log('   User   → rahim@example.com / password123\n');
    } catch (error) {
        console.error('❌ Setup error:', error);
        process.exit(1);
    }

    await conn.end();
}

setup();
