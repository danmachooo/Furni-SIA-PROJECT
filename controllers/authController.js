const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../models/user');
const emailService = require('../services/emailService');
const { title } = require('process');
const { query } = require('express'); 

const register = async (req, res) => {
    const {email, name, password} = req.body;
    console.log('Received data:', { email, name, password }); // Log the received data
    console.log(req.body);
    // Basic server-side validation
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    try {
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already registered.' });
        }


        // Hashing the password
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await User.create(name, email, hashedPassword, verificationToken, tokenExpiry);
        await emailService.sendVerificationEmail(email, verificationToken);

        // Respond with success

        res.status(200).json({ success: true });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Server error during registration.' });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    // Basic server-side validation
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    try {
        const user = await User.findByEmail(email);
        if (!user || !user.verified) {
            return res.status(400).json({ success: false, message: 'Invalid email or your email is not verified.' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).json({ success: false, message: 'Invalid password.' });
        }

        req.session.userId = user.id;
        const role = user.role;
        console.log('Role: ', role)
        const status = 'Active';

        if(role === 'admin') {
            res.status(200).json({ success: true, message: role });
        } else {
            if(user.status === 'Blocked'){
                res.status(200).json({ success: false, message: 'You are blocked by the admin!' });
            }else {
                res.status(200).json({ success: true, message: role });
                await User.setStatus(user.id, status);

            }
        }
        // Respond with success
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error during login.' });
    }
};

const logout = async (req, res) => {
    const status = 'Not Active';
    await User.setStatus(req.session.id, status);
    req.session.destroy(err => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ success: false, message: 'Server error during logout.' });
        }

        renderLogin(req, res)
    });
};

const verifyEmail = async (req, res) => {
    const token = req.params.token;

    try {
        const user = await User.findByVerificationToken(token);
        if (!user) {
            return res.status(400).send('Invalid verification token.');
        }

        if (user.token_expiry < new Date()) {
            return res.status(400).send('Verification token has expired.');
        }

        // Update the user's verification status
        await User.verifyUser(user.id);

        // Redirect to login with a success message
        res.redirect('/login?verified=true');
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).send('Server error during verification.');
    }
}

const renderLogin = (req, res) => {
    res.render('login', {
        title: 'login',
        query: req.query,
    }); 
}

const renderRegister = (req, res) => {
    res.render('register', {
        title: 'register',

    });
}



module.exports = { register, login, renderLogin, renderRegister, verifyEmail, logout };
