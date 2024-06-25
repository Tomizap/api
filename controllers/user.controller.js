const mongoose = require('mongoose')

module.exports = {
    login: async (req, res) => {
        try {
            const credentials = req.body
            if (!credentials.email) { return res.status(500).json({ message: 'missing email' }); }
            if (!credentials.auth || !credentials.auth.password) { return res.status(500).json({ message: 'missing password' }); }
            const user = await mongoose.model('users').findOne({ email: credentials.email, 'auth.password': credentials.auth.password })
            if (user === null) { return res.status(500).json({ message: 'auth failed' }); }
            res.status(200).json(user);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
    auth: async (req, res, next) => {
        try {
            const token = req.headers.token || req.query.token || req.cookies.token || null
            if (token === null) { return res.status(500).json({ message: 'missing credentials' }); }
            delete req.query.token
            const user = await mongoose.model('users').findOne({ 'auth.token': token })
            if (user === null) { return res.status(500).json({ message: 'auth failed' }); }
            res.cookie('token', user.auth.token)
            req.user = user
            next()
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
    register: async (req, res) => {
        try {
            res.status(200).json({});
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}