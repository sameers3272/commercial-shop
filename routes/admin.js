const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin');
const isAuth = require('../middlewares/is-auth');
const { body } = require('express-validator/check');

/* routes starts with /admin/add-products */

router.get('/add-products', adminController.getAddProduct);


/* routes starts with /admin/products */

router.get('/products', adminController.getProducts);

/* routes starts with /admin/add-products for post request */

router.post('/add-products',
  [
    body('title')
      .isString()
      .isLength({ min: 3 }).withMessage('Title Should more the 3 characters.')
      .trim(),
    body('price').isFloat(),
    body('description')
      .isLength({ min: 5, max: 400 }).withMessage('Description Should be atleast 5 charachers')

  ]
  ,
  isAuth,
  adminController.postAddProduct);

router.get('/edit-product/:productId', adminController.getEditProduct);

router.post('/edit-product',
  [
    body('title')
      .isString()
      .isLength({ min: 3 }).withMessage('Title Should more the 3 characters.')
      .trim(),
    body('price').isFloat(),
    body('description')
      .isLength({ min: 5, max: 400 }).withMessage('Description Should be atleast 5 charachers')
  ]
  , isAuth,
  adminController.postEditProduct);

router.post('/delete-product/:productId',
  isAuth,
  adminController.postDeleteProduct);

module.exports = router;