const { pool } = require('../config/db'); 

const User = {
    create: async (name, email, password, verificationToken, tokenExpiry) => {
        await pool.query(
            'INSERT INTO users (name, email, password, verification_token, token_expiry) VALUES (?, ?, ?, ?, ?)', 
            [name, email, password, verificationToken, tokenExpiry]
        );
    },
    findAll: async () => {
        const [rows] = await pool.query('SELECT * FROM users');
        return rows;
    },
    findById: async (id) => {
        const [rows] = await pool.query('SELECT * FROM users WHERE id =  ?', [id])
        return rows[0];
    },
    findByEmail: async (email) => {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0]; // Return the user object if found
    },

    findByVerificationToken: async (token) => {
        const [rows] = await pool.query('SELECT * FROM users WHERE verification_token = ?', [token]);
        return rows[0]; // Return the user object if found
    },

    verifyUser: async (userId) => {
        await pool.query('UPDATE users SET verification_token = NULL, token_expiry = NULL, verified = 1 WHERE id = ?', [userId]);
    },
    updateUser: async (userId, role, status) => {
        const query = 'UPDATE users SET status = ?, role = ? WHERE id = ?';
        console.log('Executing query:', query, [status, role, userId]); // Log the query
        const result = await pool.query(query, [status, role, userId]); // Store the result
        return result; // Return the result of the query
    },
    updateName: async (userId, newName) => {
        const query = 'UPDATE users SET name = ? WHERE id = ?';
        const result = await pool.query(query, [newName, userId]);
        return result;
    },
    updatePassword: async (userId, currentPassword, newPassword) => {
        // First, get the current user's password hash
        const [user] = await pool.query('SELECT password FROM users WHERE id = ?', [userId]);
        
        if (!user || user.length === 0) {
            throw new Error('User not found');
        }

        // Check if the current password is correct
        const isMatch = await bcrypt.compare(currentPassword, user[0].password);
        if (!isMatch) {
            throw new Error('Current password is incorrect');
        }

        // Hash the new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update the password in the database
        const query = 'UPDATE users SET password = ? WHERE id = ?';
        const result = await pool.query(query, [hashedPassword, userId]);
        return result;
    },
    
    
    setStatus: async(userId, status) => {
        await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, userId]);
    },
    setRole: async(userId, role) => {
        await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
    },
    removeUser: async(userId) => {
        await pool.query('DELETE FROM users WHERE id = ?', [userId]);
    }

};

module.exports = User;
