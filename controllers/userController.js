const User = require('../models/user');
const { updateStatus } = require('./orderController');

const methods = {
    setStatus: async (req, res) => {
        try {
            const {status} = req.body;
            const id = req.params.id;
    
            await User.setStatus(id, status); 
        } catch(error) {
            console.error('Set status error:', error);
            return res.status(500).json({ success: false, message: 'An error occured.' });
        }
    },
    updateUser: async (req, res) => {
        try {
            const { role, status } = req.body;
            const id = req.params.id;
    
            console.log('Updating user:', { id, role, status });
    
            // Validate the input
            if (!role || !status || !id) {
                return res.status(400).json({ success: false, message: 'Invalid input data.' });
            }
    
            const result = await User.updateUser(id, role, status); // Store the result
            console.log('Update result:', result); // Log the result
    
            // Check if the update was successful
            if (result && result[0].affectedRows > 0) {
                return res.status(200).json({ success: true, message: 'Successfully updated the user' });
            } else {
                return res.status(500).json({ success: false, message: 'Failed to update user, please try again.' });
            }
            
        } catch (error) {
            console.error('Update error:', error);
            return res.status(500).json({ success: false, message: error.message || 'An error occurred.' });
        }
    },
    
    setRole: async (req, res) => {
        try {
            const {role} = req.body;
            const id = req.params.id;

            await User.setRole(id, role);

            return res.status(200).json({ success: true, message: 'Role has been set!' });
        } catch(error) {
            console.error('Set status error:', error);
            return res.status(500).json({ success: false, message: 'An error occured.' });
        }
    },
    removeUser: async(req, res) => {
        try {
            const id = req.params.id;
            await User.removeUser(id);
            return res.status(200).json({success: true, message: 'User has been removed.'})
        } catch (error) {
            console.error('Removing user error: ', error);
            return res.status(500).json( { success: false, message: 'An error occured.'});
        }
    },
    displayAllUser: async(req, res) => {
        try {
            const users = await User.findAll();
            res.render('users', {
                users,
                title: 'User manager'
            })
        } catch (error) {
            console.error('Error displaying users: ', error);
            return res.status(500).json({success:false, message: 'An error occured.'})
        }
    },
    updateName: async (req, res) => {
        try {
            const { newName } = req.body;
            const userId = req.params.id;

            console.log('Updating user name:', { userId, newName });

            // Validate the input
            if (!newName || !userId) {
                return res.status(400).json({ success: false, message: 'Invalid input data.' });
            }

            const result = await User.updateName(userId, newName);
            console.log('Update name result:', result);

            // Check if the update was successful
            if (result && result[0].affectedRows > 0) {
                return res.status(200).json({ success: true, message: 'Successfully updated the user\'s name' });
            } else {
                return res.status(500).json({ success: false, message: 'Failed to update user\'s name, please try again.' });
            }
        } catch (error) {
            console.error('Update name error:', error);
            return res.status(500).json({ success: false, message: error.message || 'An error occurred while updating the name.' });
        }
    },
    updatePassword: async (req, res) => {
        try {
            const { currentPassword, newPassword, confirmPassword } = req.body;
            const userId = req.params.id;

            console.log('Updating user password:', { userId });

            // Validate the input
            if (!currentPassword || !newPassword || !confirmPassword) {
                return res.status(400).json({ success: false, message: 'All password fields are required.' });
            }

            if (newPassword !== confirmPassword) {
                return res.status(400).json({ success: false, message: 'New password and confirmation do not match.' });
            }


            const result = await User.updatePassword(userId, currentPassword, newPassword);
            console.log('Update password result:', result);

            // Check if the update was successful
            if (result && result[0].affectedRows > 0) {
                return res.status(200).json({ success: true, message: 'Successfully updated the password' });
            } else {
                return res.status(500).json({ success: false, message: 'Failed to update password, please try again.' });
            }
        } catch (error) {
            console.error('Update password error:', error);
            if (error.message === 'Current password is incorrect') {
                return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
            }
            return res.status(500).json({ success: false, message: error.message || 'An error occurred while updating the password.' });
        }
    },
    displayUser: async (req, res) => {
        try {
            const userId = req.session.userId;
    
            // Ensure userId is present
            if (!userId) {
                return res.status(400).json({ success: false, message: 'User ID is missing.' });
            }
    
            const user = await User.findById(userId);
            if (user) {
                res.render('profile', { user });
            } else {
                return res.status(404).json({ success: false, message: 'User not found.' });
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message || 'An error occurred while displaying the user.' });
        }
    }
    
}

module.exports = methods;