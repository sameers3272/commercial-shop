
// const { ObjectId } = require("mongodb");
// const { getDb } = require("../util/database");



// class User {
//     constructor(name, email, cart, id) {
//         this.name = name;
//         this.email = email;
//         this.cart = cart; // {items:[]}
//         this._id = id;
//     }



//     save() {
//         const db = getDb();
//         return db.collection('users').insertOne(this)
//     }

//     static findById(id) {
//         const db = getDb();
//         return db.collection('users').findOne({ _id: new ObjectId(id) });
//     }

//     addToCart(product) {
//         if (!this.cart.items) {
//             this.cart.items = [];
//         }

//         const cartProductIndex = this.cart.items.findIndex(p => {
//             return p.productId.toString() === product._id.toString();
//         });

//         let newQuantity = 1;
//         const updatedCartItems = [...this.cart.items];

//         if (cartProductIndex >= 0) {
//             newQuantity = this.cart.items[cartProductIndex].quantity + 1;
//             updatedCartItems[cartProductIndex].quantity = newQuantity;
//         }
//         else {
//             updatedCartItems.push({ productId: new ObjectId(product._id), quantity: newQuantity });
//         }


//         const updatedCart = { items: updatedCartItems }

//         const db = getDb();
//         return db.collection('users')
//             .updateOne({ _id: this._id }, { $set: { cart: updatedCart } })
//     }


//     getCart() {
//         if (!this.cart.items) {
//             this.cart.items = [];
//         }
//         const db = getDb();
//         const productIds = this.cart.items.map(i => i.productId);

//         return db.collection('products')
//             .find({ _id: { $in: productIds } })
//             .toArray()
//             .then(products => {
//                 return products.map(product => {
//                     return {
//                         ...product,
//                         quantity: this.cart.items.find(i => {
//                             return i.productId.toString() === product._id.toString()
//                         }).quantity

//                     }
//                 })
//             })

//     }
//     deleteItemById(productId) {
//         const updateCartItems = this.cart.items.filter(i => {
//             return i.productId.toString() !== productId.toString();
//         })

//         const db = getDb();
//         return db.collection('users').updateOne({ _id: this._id }, { $set: { cart: { items: updateCartItems } } })
//     }

//     addOrder() {
//         const db = getDb();
//         return this.getCart()
//             .then(products => {
//                 let order = {
//                     items: products,
//                     user: {
//                         _id: new ObjectId(this._id),
//                         name: this.name,
//                         email: this.email,
//                     }
//                 }
//                 return db.collection('orders').insertOne(order)
//             })
//             .then(() => {
//                 this.cart = [];
//                 return db.collection('users').updateOne({ _id: this._id }, { $set: { cart: [] } })
//             })
//     }
//     getOrders() {
//         const db = getDb();
//         return db.collection('orders').find({ user: { _id: this._id } }).toArray();
//     }
// }

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true,
    },
    cart: {
        items: [{
            productId: {
                type: Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            quantity: {
                type: Number,
                required: true
            }
        }]
    },
    resetToken: String,
    resetTokenExpiration: String


});

userSchema.methods.addToCart = function (product) {
    const cartProductIndex = this.cart.items.findIndex(p => {
        return p.productId.toString() === product._id.toString();
    });

    let newQuantity = 1;
    const updatedCartItems = [...this.cart.items];

    if (cartProductIndex >= 0) {
        newQuantity = this.cart.items[cartProductIndex].quantity + 1;
        updatedCartItems[cartProductIndex].quantity = newQuantity;
    }
    else {
        updatedCartItems.unshift({ productId: product._id, quantity: newQuantity });
    }

    const updatedCart = { items: updatedCartItems }

    this.cart = updatedCart;
    return this.save();
}


userSchema.methods.removeFormCart = function (productId) {
    const updateCartItems = this.cart.items.filter(i => {
        return i.productId.toString() !== productId.toString();
    })

    this.cart.items = updateCartItems;
    return this.save();
}

userSchema.methods.clearCart = function () {
    this.cart = { items: [] };
    return this.save();
}

module.exports = mongoose.model('User', userSchema);
