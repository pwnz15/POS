const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please provide a username'],
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [function() {
            // Only required if this is a new document (not an update)
            return this.isNew;
        }, 'Please confirm your password'],
        validate: {
            validator: function (el) {
                return el === this.password;
            },
            message: 'Passwords are not the same!'
        },
        select: false
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'superadmin', 'manager', 'supervisor', 'cashier', 'accountant', 'guest'],
        default: 'user'
    },
    passwordChangedAt: Date,
    refreshTokens: [String],
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

// Pre-save middleware to hash the password
userSchema.pre('save', async function (next) {
    // Only run this function if password was actually modified
    if (!this.isModified('password')) return next();
    if (typeof this.password !== 'string' || this.password.length === 0) {
        // Check if password is defined and is a string
        return next(new Error('Password must be a non-empty string'));
    }
    try {
        // Hash the password with cost of 12
        this.password = await bcrypt.hash(this.password, 12);
        this.passwordConfirm = undefined;
        next();
    } catch (error) {
        return next(error);
    }
});

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

userSchema.methods.createRefreshToken = function () {
    const refreshToken = jwt.sign({ id: this._id }, config.JWT_REFRESH_SECRET, {
        expiresIn: config.JWT_REFRESH_EXPIRES_IN
    });
    this.refreshTokens.push(refreshToken);
    return refreshToken;
};

userSchema.methods.removeRefreshToken = function (refreshToken) {
    this.refreshTokens = this.refreshTokens.filter(token => token !== refreshToken);
};

userSchema.pre(/^find/, function(next) {
    this.find({ active: { $ne: false } });
    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
