const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: ''
};

const dbName = 'MCDLEcommerce';
const pool = mysql.createPool(dbConfig);

const init_db = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Connected to MySQL server.');

        const [databases] = await connection.query('SHOW DATABASES LIKE ?', [dbName]);

        if (databases.length === 0) {
            console.log(`Database ${dbName} doesn't exist. Creating...`);
            await connection.query(`CREATE DATABASE ${dbName}`);
            console.log(`Database ${dbName} has been created!`);
        } else {
            console.log(`Database ${dbName} already exists!`);
        }

        await connection.changeUser({ database: dbName });

        const createUsersTableQuery = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('admin', 'customer') DEFAULT 'customer',
                verification_token VARCHAR(255),
                token_expiry DATETIME,
                verified TINYINT(1) DEFAULT 0
            );
        `;

        const createCategoriesTableQuery = `
            CREATE TABLE IF NOT EXISTS categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL
            );
        `;

        const createProductsTableQuery = `
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10, 2) NOT NULL,
                image VARCHAR(255),
                stock_quantity INT,
                category_id INT,
                FOREIGN KEY (category_id) REFERENCES categories(id)
            );
        `;

        const createOrdersTableQuery = `
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                total_price DECIMAL(10, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                order_status ENUM('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled') DEFAULT 'Pending',
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
        `;

        const createOrderItemsTableQuery = `
            CREATE TABLE IF NOT EXISTS order_items(
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                product_id INT NOT NULL,
                quantity INT NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders(id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            );
        `;

        await connection.query(createUsersTableQuery);
        await connection.query(createCategoriesTableQuery);
        await connection.query(createProductsTableQuery);
        await connection.query(createOrdersTableQuery);
        await connection.query(createOrderItemsTableQuery);

        console.log('All tables are ready!');

        await connection.release(); // release the connection back to the pool
    } 
    catch (error) {
        console.error('Error initializing database: ', error.message);
        throw error;        
    }
};

module.exports = { init_db, pool };