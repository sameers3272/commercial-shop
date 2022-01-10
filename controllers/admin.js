const Product = require("../models/product");
const { validationResult } = require('express-validator/check');
const { deletefile } = require('../util/fileHander');

exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', {
        pageTitle: "Add Product",
        path: "/admin/add-products",
        editing: false,
        hasErrors: false,
        errorMessage: null,
        oldData: {
            title: '',
            imgUrl: '',
            price: '',
            description: ''
        },

        errors: []
    });
}


exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const image = req.file;
    // console.log(req.file);
    const price = req.body.price;
    const description = req.body.description;
    const errors = validationResult(req);

    if (!image) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: "Add Product",
            path: "/admin/add-products",
            editing: false,
            hasErrors: true,
            oldData: {
                title: title,
                price: price,
                description: description
            },
            isAuthenticated: true,

            // csrfToken:req.csrfToken(),
            errorMessage: 'Attached file is not valid',
            errors: [],
        });
    }

    const imgUrl = image.path;

    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: "Add Product",
            path: "/admin/add-products",
            editing: false,
            hasErrors: true,
            errorMessage: errors.array()[0].msg,
            oldData: {
                title: title,
                price: price,
                description: description
            },
            isAuthenticated: true,
            // csrfToken:req.csrfToken(),
            errors: errors.array(),
        });
    }

    const product = new Product({
        title: title,
        imgUrl: imgUrl,
        price: price,
        description: description,
        userId: req.user,
    });
    product.save()
        .then(result => {
            res.redirect('/admin/products');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    if (!editMode) {
        return res.redirect('/');
    }
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then(product => {
            if (!product) {
                res.redirect('/');
            }
            res.render('admin/edit-product', {
                pageTitle: 'Edit Product',
                path: '/admin/edit-product',
                editing: editMode,
                hasErrors: false,
                errorMessage: null,
                oldData: {
                    title: product.title,
                    price: product.price,
                    description: product.description,
                    _id: prodId
                },
                errors: [],

            })
        })
}



exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const image = req.file;
    const updatePrice = req.body.price;
    const updatedDescription = req.body.description;
    const errors = validationResult(req);


    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: "Edit Product",
            path: "/admin/edit-products",
            editing: true,
            hasErrors: true,
            errorMessage: errors.array()[0].msg,
            oldData: {
                title: updatedTitle,
                price: updatePrice,
                description: updatedDescription,
                _id: prodId
            },
            errors: errors.array(),
        });
    }




    Product.findById(prodId)
        .then(product => {
            if (product.userId.toString() !== req.user._id.toString()) {
                return next(new Error("Unauthorized user..!"));
            }
            product.title = updatedTitle;
            product.price = updatePrice;
            if (image) {
                deletefile(product.imgUrl);
                product.imgUrl = image.path;
            }
            product.description = updatedDescription;
            return product.save();
        })
        .then(result => {
            console.log("Updated");
            res.redirect('/admin/products');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}


exports.getProducts = (req, res, next) => {
    Product
        .find({userId:req.user._id})
        .then(products => {
            res.render('admin/products', {
                pageTitle: "Admin Products",
                path: '/admin/products',
                prods: products,
            })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}


exports.postDeleteProduct = async (req, res, next) => {
    const prodId = req.params.productId
    try {
        const product = await Product.findById(prodId);
        const deleteStatus = await deletefile(product.imgUrl);
        const result = await Product.findByIdAndDelete(prodId)
        console.log('Deleted');
        res.redirect('/admin/products');
    }
    catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        throw err;
    }
    // .catch(err => {
    //     const error = new Error(err);
    //     error.httpStatusCode = 500;
    //     return next(error);
    // });





}

