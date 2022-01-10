// importing libraries
const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
const session = require('express-session');
const mongodbStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
// importing routes
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
const errorRoutes = require('./routes/error');
const errorController = require('./controllers/error');


//importing models
const User = require('./models/user');


// middileWares
const app = express();
require("dotenv").config();

const MONGOBD_URI = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@shop.mhlr7.mongodb.net/${process.env.MONGODB_DATABASE}?retryWrites=true&w=majority`;
const store = new mongodbStore({
    uri: MONGOBD_URI,
    collection: 'sessions'
});
const csrfProtection = csrf();

const fileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }

});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        cb(null, true);
    }
    else {
        cb(null, false);
    }
}

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });
app.set("view engine", "ejs");
app.set("views", "views");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(helmet());
app.use(compression());
app.use(morgan('combined', { stream: accessLogStream  }));

app.use(session({ secret: 'my secret', resave: false, saveUninitialized: false, store: store }));

app.use(csrfProtection);

app.use(flash());

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
})


app.use((req, res, next) => {
    if (!req.session.user) {
        return next();

    }
    

    User.findById(req.session.user._id)
        .then(user => {
            if (!user) {
                return next();
            }
            req.user = user;
            next();
        })
        .catch(err => {
            next(new Error(err));
        });

});



// routes
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);
app.use(errorRoutes);

app.use(errorController.get404)

app.use((errors, req, res, next) => {
    res.redirect('/500');
    next();
})

mongoose.connect(MONGOBD_URI)
    // .then(() => {
    //     return User.findOne()
    // })
    // .then(user => {
    //     if (!user) {
    //         const user = new User({
    //             name: 'Sameer Shaikh',
    //             email: 'sameers3272@gmail.com',
    //             cart: []
    //         })
    //         return user.save()
    //     }
    // })
    .then(result => {
        console.log('Connected');
        app.listen(process.env.PORT || 3000);
    })
    .catch(err => {
        console.log(err);
    })