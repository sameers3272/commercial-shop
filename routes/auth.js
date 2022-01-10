const express = require('express');
const { check, body } = require('express-validator/check');
const User = require('../models/user');


const router = express.Router();

const authController = require('../controllers/auth');

router.get('/login', authController.getLogin);

router.post('/login',
    [
        body('email')
            .isEmail().withMessage('Enter a valid Email with @ sign')
            .normalizeEmail(),
        body('password').isLength(5).withMessage('Password must be at least 5 characters')
            .trim()
            .isAlphanumeric().withMessage('Please Enter with only numbers and text'),

    ], authController.postLogin);

router.post('/logout', authController.postLogout);

router.get('/signup', authController.getSignup);

router.post('/signup',
    [
        check('email')
            .isEmail()
            .withMessage('Invalid Email Please Enter a Valid Email Id')
            .custom((value, { req }) => {
                return User.findOne({ email: value })
                    .then(user => {
                        if (user) {
                            return Promise.reject('Email exist already, Pick a different one');
                        }
                    });
            })
            .normalizeEmail(),
        body('password')
            .trim()
            .isLength(5).withMessage('Password should least 5 character')
            .isAlphanumeric().withMessage('Please Enter with only numbers and text'),
        body('confirmPassword')
            .trim()
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error('Password and Confirm Password must be same')
                }
                return true;
            })
    ],
    authController.postSignup);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;