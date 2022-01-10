const User = require("../models/user");
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendGridTransoporter = require('nodemailer-sendgrid-transport');
const crypto = require('crypto');
const { validationResult } = require('express-validator/check');

const transporter = nodemailer.createTransport(sendGridTransoporter({
    auth: {
        api_key: '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',
    }
}));

exports.getLogin = (req, res, next) => {

    res.render('auth/login', {
        pageTitle: "Login",
        path: "/login",
        errorMessage: '',
        oldData: {
            email: '',
            password: '',
        },
        errors: []
    });
}

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render('auth/login', {
            pageTitle: "Login",
            path: "/login",
            errorMessage: errors.array()[0].msg,
            oldData: {
                email: email,
                password: password
            },
            errors: errors.array(),
        });
    }

    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                return res.status(422).render('auth/login', {
                    pageTitle: "Login",
                    path: "/login",
                    errorMessage: 'Email Id not found please sign up',
                    oldData: {
                        email: email,
                        password: password
                    },
                    errors: [{ param: 'email' }],
                });
            }

            bcrypt.compare(password, user.password)
                .then(doMatch => {
                    if (doMatch) {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        return req.session.save(err => {
                            res.redirect('/');
                        })
                    }
                    return res.status(422).render('auth/login', {
                        pageTitle: "Login",
                        path: "/login",
                        errorMessage: 'Please Enter the correct password',
                        oldData: {
                            email: email,
                            password: password
                        },
                        errors: [{ param: 'password' }],
                    });
                })
                .catch(err => {
                    console.log(err)
                    res.redirect('/login');
                });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}


exports.postLogout = (req, res, next) => {

    req.session.destroy(() => {
        res.redirect('/');
    });
}

exports.getSignup = (req, res, next) => {
    let message = validationResult(req);
    if (message.array().length > 0) {
        message = message.array()[0].msg;
    } else {
        message = null;
    }
    res.render('auth/signup', {
        pageTitle: "Signup",
        path: "/signup",
        errorMessage: message,
        oldData: {
            name: '',
            email: '',
            password: '',
            confirmPassword: ''
        },
        errors: []
    });
}

exports.postSignup = (req, res, next) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/signup', {
            pageTitle: "Signup",
            path: "/signup",
            errorMessage: errors.array()[0].msg,
            oldData: {
                name: name,
                email: email,
                password: password,
                confirmPassword: confirmPassword
            },
            errors: errors.array()
        });
    }

    bcrypt.hash(password, 12)
        .then(pass => {
            const newUser = new User({
                name: name,
                email: email,
                password: pass,
                cart: { items: [] },
                resetToken: null,
                resetTokenExpiration: null
            })
            return newUser.save();

        })
        .then(() => {
            return res.redirect('/login');
            // return transporter.sendMail({
            //     to: email,
            //     from: 'sameers3272@gmail.com',
            //     subject: 'Signup Succeeded',
            //     html: '<h1>You have sucessfully signed up</h1>'
            // })

            // .catch(err => console.log(err))
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}


exports.getReset = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/reset', {
        pageTitle: "Reset Password",
        path: "/reset",
        errorMessage: message,
        oldData: {
            email: ''
        },
        errors:[]
    });
}

exports.postReset = (req, res, next) => {
    const email = req.body.email;
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User.findOne({ email: email })
            .then(user => {
                if (!user) {
                    return res.status(422).render('auth/reset', {
                        pageTitle: "Reset Password",
                        path: "/reset",
                        errorMessage: 'No Account found with that email',
                        oldData: {
                            email: email
                        },
                        errors:[{param:'email'}]
                    })
                    
                }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000;
                return user.save();
            })
            .then(result => {
                transporter.sendMail({
                    to: req.body.email,
                    from: 'sameers3272@gmail.com',
                    subject: "Reseting the Password",
                    html: `
                            <p>You Requested a password reset</p>
                            <p>Click this <a href='http://localhost:3000/reset/${token}'>link</a> to reset the new password</p>
                            `});
                return res.redirect('/login');
            })
            .catch(err => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            });
    })
}

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    // console.log(token);
    User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
        .then(user => {
            console.log(user)
            let message = req.flash('error');
            if (message.length > 0) {
                message = message[0];
            } else {
                message = null;
            }
            res.render('auth/new-password', {
                pageTitle: "New Password",
                path: "/new-password",
                errorMessage: message,
                userId: user._id,
                passwordToken: token,
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}
exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let resetUser;

    User.findOne({ id: userId, resetToken: passwordToken, resetTokenExpiration: { $gt: Date.now() } })
        .then(user => {
            resetUser = user;
            return bcrypt.hash(newPassword, 12)
        })
        .then(hashPassword => {
            resetUser.password = hashPassword;
            resetUser.resetToken = null;
            resetUser.resetTokenExpiration = null;
            return resetUser.save()
        })
        .then(result => {

            return res.redirect('/login');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}