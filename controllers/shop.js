const mongodb = require('mongodb');

// const Cart = require('../models/cart');
const Product = require('../models/product');
const path = require('path');
const fs = require('fs');
const Order = require('../models/order');
const PDFDocument = require('pdfkit');
const { createInvoice } = require('../util/invoice');
// const User = require('../models/user');

exports.getProducts = (req, res, next) => {
    // console.log('shop', req.user)
    Product.find()
        .then(products => {
            res.render('shop/product-list', {
                pageTitle: 'Shop',
                prods: products,
                path: "/products",

            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;

    Product.findById(prodId)
        .then(product => {
            res.render('shop/product-detail', {
                pageTitle: product.title,
                product: product,
                path: '',
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}
exports.getIndex = (req, res, next) => {
    Product.find()
        .then(products => {
            res.render('shop/index',
                {
                    pageTitle: 'Shop',
                    prods: products,
                    path: "/",

                });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

exports.getCart = (req, res, next) => {
    req.user
        .populate('cart.items.productId')

        .then(user => {
            const products = user.cart.items;
            res.render('shop/cart', {
                pageTitle: "Cart",
                path: "/cart",
                products: products,
            })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;

    Product.findById(prodId)
        .then(product => {
            return req.user.addToCart(product)
        })
        .then(result => {
            res.redirect('/cart');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}


exports.postDeleteCart = (req, res, next) => {
    const prodId = req.body.productId;

    req.user
        .removeFormCart(prodId)
        .then(() => {
            res.redirect('/cart');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

exports.postOrders = (req, res, next) => {

    req.user
        .populate('cart.items.productId')
        .then(user => {
            const updatedProducts = user.cart.items.map(i => {
                return {
                    quantity: i.quantity,
                    product: { ...i.productId._doc }
                }
            })
            const order = new Order({
                products: updatedProducts,
                user: {
                    name: req.user.name,
                    userId: req.user._id,
                }
            })
            return order.save();
        })
        .then(() => {
            return req.user.clearCart();
        })
        .then(result => {
            res.redirect('/orders');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

exports.getOrders = (req, res, next) => {
    Order.find({ 'user.userId': req.user._id })
        .then(orders => {
            res.render('shop/orders', {
                pageTitle: "Orders",
                path: "/orders",
                orders: orders,
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

exports.getInvoice = (req, res, next) => {
    const orderId = req.params.orderId;
    Order.findOne({ 'user.userId': req.user._id, _id: orderId })
        .then(order => {
            if (!order) {
                return next(new Error('No Order Found..!'));
            }



            const invoiceName = 'invoice-' + orderId + '.pdf'
            const invoicePath = path.join('data', 'invoice', invoiceName);

            // const pdfDoc = new PDFDocument();

            // pdfDoc.pipe(fs.createWriteStream(invoicePath));
            // pdfDoc.pipe(res);

            // pdfDoc.text('Invoice', {
            //     underline: true
            // });

            // pdfDoc.text('-------------------');

            let totalPrice = 0;
            let items = [];
            order.products.forEach(product => {
                items.push({
                    item: product.product.title,
                    description: product.product.description,
                    quantity: product.quantity,
                    amount: Number(product.product.price) * Number(product.quantity),
                })
                totalPrice = totalPrice + (Number(product.product.price) * Number(product.quantity));
                // pdfDoc.text(product.product.title + ' - ' + product.quantity + ' x ' + product.product.price);
            });

            const invoice = {
                shipping: {
                    name: 'Sameer',
                    address: 'Upper Depo',
                    city: 'Pune',
                    state: 'Maharashtra',
                    country: 'India',
                    postal_code: 411042,
                },
                items: items,
                subtotal: totalPrice,
                paid: 0,
                invoice_nr: orderId,
            };

            createInvoice(invoice,invoicePath,path.join(__dirname,'..','public','image','logo.png'),res);
            // pdfDoc.text('total price is ' + totalPrice);

            // pdfDoc.end();

        })
        .catch(err => {
            next(err)
        })
}