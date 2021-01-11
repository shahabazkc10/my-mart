var db = require('../config/connection')
const VENDOR_COLLECTION = require('../config/collections');
var collection = require('../config/collections');
const bcrypt = require('bcrypt');
const USER_COLLECTION = require('../config/collections');
const { ObjectID } = require('mongodb');
const { response } = require('express');
const Razorpay = require('razorpay')
var instance = new Razorpay({
    key_id: 'rzp_test_N8Uo1CA0Idg97q',
    key_secret: 'Iyh3NzphTK7naAmLqgTXlTOB',
});
module.exports = {
    loginData: (loginBody) => {
        return new Promise(async (resolve, rejectt) => {
            let response = {}
            let userEmail = await db.get().collection(collection.USER_COLLECTION).findOne({ email: loginBody.email })
            if (userEmail) {
                response.user = userEmail;
                response.status = true;
                response.user = userEmail;
                response.status = true;
                resolve(response)
            } else {
                console.log("Login failed Email incorrect");
                resolve({ status: false })
            }
        })
    },

    newUser: (data) => {
        return new Promise(async (resolve, reject) => {
            data.password = await bcrypt.hash(data.password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(data).then((userData) => {
                resolve(userData.ops[0]._id)
            })
        })
    },
    getCategory: () => {
        return new Promise((resolve, reject) => {
            let categories = db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            resolve(categories)
        })
    },
    getProducts: (vendorId, catId) => {
        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id: ObjectID(catId) })
            category = category.name;
            let products = await db.get().collection(collection.PRODUCTS_COLLECTION).find({ storeId: vendorId, category: category, productStatus: true }).toArray()
            resolve(products)
        })
    },
    addToCart: (proId, userId, storeId) => {
        return new Promise(async (resolve, reject) => {
            let productDetail = await db.get().collection(collection.PRODUCTS_COLLECTION).findOne({ _id: ObjectID(proId) })
            let product = await db.get().collection(collection.PRODUCTS_COLLECTION).aggregate([
                {
                    $match: { _id: ObjectID(proId) }
                },
                {
                    $addFields: {
                        "quantity": 1
                    }
                },
                {
                    $project: {
                        quantity: '$quantity',
                        price: '$price',

                    }
                },
                {
                    $project: {
                        totalPrice: { $sum: { $multiply: ['$quantity', '$price'] } }
                    }
                }
            ]).toArray()
            productTotal = product[0].totalPrice;
            let proObj = {
                item: ObjectID(proId),
                quantity: 1,
                name: productDetail.name,
                quantitytype: productDetail.quantitytype,
                description: productDetail.description,
                price: productDetail.price,
                totalPrice: productTotal
            }
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectID(userId), store: ObjectID(storeId) })
            if (userCart) {
                let productExist = await userCart.products.findIndex(product => product.item == proId)
                if (productExist != -1) {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: ObjectID(userId), 'products.item': ObjectID(proId) },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }

                        ).then(async () => {
                            let product = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectID(userId), 'products.item': ObjectID(proId) })
                            let productDetail = product.products[productExist]
                            let quantity = product.products[productExist].quantity
                            let price = product.products[productExist].price;
                            let total = quantity * price
                            db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectID(userId), 'products.item': ObjectID(proId) },
                                {
                                    $set: {
                                        'products.$.item': ObjectID(proId),
                                        'products.$.name': productDetail.name,
                                        'products.$.quantitytype': productDetail.quantitytype,
                                        'products.$.description': productDetail.description,
                                        'products.$.price': productDetail.price,
                                        'products.$.totalPrice': total
                                    }
                                }
                            ).then(() => {
                                resolve()
                            })
                        })
                }
                else {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectID(userId), store: ObjectID(storeId) },
                        {
                            $push: { products: proObj }
                        }
                    ).then((response) => {
                        resolve()
                    })
                }
            }
            else {
                let cartObj = {
                    store: ObjectID(storeId),
                    user: ObjectID(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectID(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCTS_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()
            resolve(cartItems)
        })
    },
    getProductsBySeller: (id, categoryId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id: ObjectID(categoryId) }).then(async (category) => {
                categoryName = category.name;
                let products = await db.get().collection(collection.PRODUCTS_COLLECTION).find({ storeId: id, category: categoryName }).toArray()
                resolve(products)
            })


        })
    },
    getAllStores: () => {
        return new Promise(async (resolve, reject) => {
            let stores = await db.get().collection(collection.VENDOR_COLLECTION).find().toArray()
            resolve(stores)
        })
    },
    getStatusCart: (userId, storeId) => {
        return new Promise(async (resolve, reject) => {
            let store = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectID(userId), store: ObjectID(storeId) })
            let otherStores = await db.get().collection(collection.CART_COLLECTION).find({ user: ObjectID(userId) }).toArray()
            if (otherStores.length > 1 && store) {
                let otherStoresFound = true;
                let sameStoreFound = true;
                resolve({ sameStoreFound, otherStoresFound: otherStoresFound, store: store })
            }
            else if (otherStores.length > 0 && store) {
                let otherStoresFound = false;
                let sameStoreFound = true;
                resolve({ sameStoreFound, otherStoresFound: otherStoresFound, store: store })
            }
            else if (otherStores.length > 0) {
                let otherStoresFound = true;
                let sameStoreFound = false;
                resolve({ sameStoreFound, otherStoresFound: otherStoresFound, store: store })
            }
            else {
                let otherStoresFound = false;
                let sameStoreFound = false;
                resolve({ sameStoreFound, otherStoresFound: otherStoresFound, store: store })
            }
        })
    },
    removeCartProducts: (userId, proId, storeId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).removeOne({ user: ObjectID(userId) })
            let proObj = {
                item: ObjectID(proId),
                quantity: 1
            }
            let cartObj = {
                store: ObjectID(storeId),
                user: ObjectID(userId),
                products: [proObj]
            }
            db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                resolve(response)
            })
        })
    },
    addAddress: (userId, address) => {
        return new Promise((resolve, reject) => {
            if (address.type) {
                address.type = 'primary';
                db.get().collection(collection.ADDRESS_COLLECTION).findOne({ userId: ObjectID(userId), 'address.type': 'primary' }).then((checkbox) => {
                    if (checkbox) {
                        db.get().collection(collection.ADDRESS_COLLECTION).updateOne({ userId: ObjectID(userId), 'address.type': 'primary' },
                            {
                                $set: {
                                    address: {
                                        name: checkbox.address.name,
                                        number: checkbox.address.number,
                                        state: checkbox.address.state,
                                        town: checkbox.address.state,
                                        pincode: checkbox.address.pincode,
                                        address: checkbox.address.address,
                                        type: 'alternative'
                                    }
                                }
                            }).then(() => {
                                db.get().collection(collection.ADDRESS_COLLECTION).insertOne({ userId: ObjectID(userId), address })
                                resolve()
                            })
                    }
                    else {
                        db.get().collection(collection.ADDRESS_COLLECTION).insertOne({ userId: ObjectID(userId), address })
                        resolve()
                    }
                })

            }
            else {
                address.type = 'alternative';
                db.get().collection(collection.ADDRESS_COLLECTION).insertOne({ userId: ObjectID(userId), address })
                resolve()
            }

        })
    },
    getThisPrimaryAddress: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADDRESS_COLLECTION).findOne({ userId: ObjectID(userId), 'address.type': 'primary' }).then((primaryAddress) => {
                resolve(primaryAddress)
            })
        })
    },
    getThisAlternativeAddress: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADDRESS_COLLECTION).find({ userId: ObjectID(userId), 'address.type': 'alternative' }).toArray().then((alternativeAddress) => {
                resolve(alternativeAddress)
            })
        })
    },
    getThisAddress: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADDRESS_COLLECTION).findOne({ _id: ObjectID(id) }).then((address) => {
                resolve(address)
            })
        })
    },
    updateAddress: (id, data, userId) => {
        return new Promise((resolve, reject) => {
            if (data.type) {
                db.get().collection(collection.ADDRESS_COLLECTION).findOne({ userId: ObjectID(userId), 'address.type': 'primary' }).then((checkbox) => {
                    if (checkbox) {
                        db.get().collection(collection.ADDRESS_COLLECTION).updateOne({ userId: ObjectID(userId), 'address.type': 'primary' },
                            {
                                $set: {
                                    address: {
                                        name: checkbox.address.name,
                                        number: checkbox.address.number,
                                        state: checkbox.address.state,
                                        town: checkbox.address.state,
                                        pincode: checkbox.address.pincode,
                                        address: checkbox.address.address,
                                        type: 'alternative'
                                    }
                                }
                            }).then(() => {
                                db.get().collection(collection.ADDRESS_COLLECTION).updateOne({ _id: ObjectID(id) },
                                    {
                                        $set: {
                                            address: {
                                                name: data.name,
                                                number: data.phonenumber,
                                                state: data.state,
                                                town: data.town,
                                                pincode: data.pincode,
                                                address: data.address,
                                                type: 'primary'
                                            }
                                        }
                                    }).then(() => {
                                        resolve()
                                    })
                            })
                    }
                    else {
                        db.get().collection(collection.ADDRESS_COLLECTION).updateOne({ _id: ObjectID(id) },
                            {
                                $set: {
                                    address: {
                                        name: data.name,
                                        number: data.phonenumber,
                                        state: data.state,
                                        town: data.town,
                                        pincode: data.pincode,
                                        address: data.address,
                                        type: 'primary'
                                    }
                                }
                            }).then(() => {
                                resolve()
                            })
                    }
                })
            }
            else {
                db.get().collection(collection.ADDRESS_COLLECTION).updateOne({ _id: ObjectID(id) },
                    {
                        $set: {
                            address: {
                                name: data.name,
                                number: data.phonenumber,
                                state: data.state,
                                town: data.town,
                                pincode: data.pincode,
                                address: data.address,
                                type: 'alternative'
                            }
                        }
                    }).then(() => {
                        resolve()
                    })
            }

        })
    },
    deleteAddress: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADDRESS_COLLECTION).removeOne({ _id: ObjectID(id) })
            resolve()
        })
    },
    getProductAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let productTotals = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectID(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCTS_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $project: {
                        totalproduct: { $sum: { $multiply: ['$quantity', '$product.price'] } },
                        item: '$item',
                        quantity: '$quantity',
                        productName: '$product.name',
                        productPrice: '$product.price',

                    }
                }

            ]).toArray()
            resolve(productTotals)
        })
    },
    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectID(userId), }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCTS_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', '$product.price'] } }
                    }
                }
            ]).toArray()
            resolve(total[0].total)
        })
    },
    removeItem: (proId, cartId, quantity) => {
        quantity = parseInt(quantity)
        return new Promise(async (resolve, reject) => {

            db.get().collection(collection.CART_COLLECTION).updateOne({ _id: ObjectID(cartId) },
                {
                    $pull: { products: { item: ObjectID(proId) } }
                }).then(async (response) => {
                    let cartcount = await db.get().collection(collection.CART_COLLECTION).findOne({ _id: ObjectID(cartId), })
                    if (cartcount.products[0]) {
                        resolve({ removeProduct: true })
                    }
                    else {
                        db.get().collection(collection.CART_COLLECTION).removeOne({ _id: ObjectID(cartId) })
                        resolve({ removeProduct: true })
                    }
                })

        })
    },
    placeOrder: (order, products, total, userId) => {
        return new Promise(async (resolve, reject) => {
            let vendorId = products[0].store
            let status = 'pending';
            let orderAddress = await db.get().collection(collection.ADDRESS_COLLECTION).findOne({ _id: ObjectID(order.address) })
            let fullProducts = products[0].products;
            let totalItems = fullProducts.length
            let orderObj = {
                deliveryDetails: {
                    name: orderAddress.address.name,
                    number: orderAddress.address.number,
                    state: orderAddress.address.state,
                    town: orderAddress.address.town,
                    pincode: orderAddress.address.pincode,
                    address: orderAddress.address.address,
                    type: orderAddress.address.type
                },
                userId: ObjectID(userId),
                paymentGateway: order.payment,
                products: fullProducts,
                vendor: vendorId,
                totalAmount: total,
                totalItems: totalItems,
                status: status,
                delivered: false,
                date: new Date()
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                resolve(orderObj._id)
            })
        })
    },
    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.CART_COLLECTION).find({ user: ObjectID(userId) }).toArray()
            resolve(orders)
        })
    },
    generateRazorpay: (orderId, totalPrice) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: totalPrice * 100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: "" + orderId
            };
            instance.orders.create(options, function (err, order) {
                resolve(order)
            });
        })
    },
    verifyPayment: (details, orderId) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto')
            let hmac = crypto.createHmac('sha256', 'Iyh3NzphTK7naAmLqgTXlTOB')
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]'])
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                db.get().collection(collection.ORDER_COLLECTION)
                    .updateOne({ _id: ObjectID(orderId) },
                        {
                            $set: {
                                status: 'rejected',
                                paymentGateway: 'failed'
                            }
                        }).then(() => {
                            resolve()
                        })
                reject()
            }
        })
    },
    changePaymentStatus: (orderId, userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION)
                .updateOne({ _id: ObjectID(orderId) },
                    {
                        $set: {
                            status: 'placed'
                        }
                    }).then(() => {
                        db.get().collection(collection.CART_COLLECTION).removeOne({ user: ObjectID(userId) })
                        resolve()
                    })
        })
    },
    getOrder: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).findOne({ _id: ObjectID(id) }).then((orderDetail) => {
                resolve(orderDetail)
            })
        })
    },
    changeProductQuantity: (details, userId) => {
        details.count = parseInt(details.count);
        details.quantity = parseInt(details.quantity);
        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: ObjectID(details.cart) },
                        {
                            $pull: { products: { item: ObjectID(details.product) } }
                        }).then((response) => {
                            resolve({ removeProduct: true })
                        })
            }
            else {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: ObjectID(details.cart), 'products.item': ObjectID(details.product) },
                        {
                            $inc: { 'products.$.quantity': details.count }
                        }).then(async (response) => {
                            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectID(userId), store: ObjectID(details.store) })
                            let productExist = await userCart.products.findIndex(product => product.item == details.product)
                            let product = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectID(userId), 'products.item': ObjectID(details.product) })
                            let productDetail = product.products[productExist]
                            let quantity = product.products[productExist].quantity
                            let price = product.products[productExist].price;
                            let total = quantity * price
                            db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectID(userId), 'products.item': ObjectID(details.product) },
                                {
                                    $set: {
                                        'products.$.item': ObjectID(details.product),
                                        'products.$.name': productDetail.name,
                                        'products.$.quantitytype': productDetail.quantitytype,
                                        'products.$.description': productDetail.description,
                                        'products.$.price': productDetail.price,
                                        'products.$.totalPrice': total
                                    }
                                }
                            ).then(() => {
                                resolve({ quantityChange: true })
                            })

                        })
            }
        })
    },
    getVendor: (id) => {
        return new Promise(async (resolve, reject) => {
            let vendor = await db.get().collection(collection.VENDOR_COLLECTION).findOne({ _id: ObjectID(id) })
            resolve(vendor)
        })
    },
    getOrderProducts: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).find({ userId: ObjectID(userId), $or: [{ status: 'placed' }, { status: 'Order Delivered' }] }).toArray().then((orders) => {
                resolve(orders)
            })
        })
    },
    getOrderDetails: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).findOne({ _id: ObjectID(id) }).then((orderDetail) => {
                resolve(orderDetail)
            })
        })
    },
    getVendors: () => {
        return new Promise(async (resolve, reject) => {
            let vendors = await db.get().collection(collection.VENDOR_COLLECTION).find().toArray()
            let totalVendor = vendors.length;
            var date = new Date();
            console.log(date);
            var hours = date.getHours();
            var minutes = date.getMinutes();
            for (i = 0; i < totalVendor; i++) {
                let vendorId = vendors[i]._id;
                if (minutes > 9 && hours > 9) {
                    var time = (hours + ':' + minutes)
                }
                else if (minutes > 9 && hours < 10) {
                    var time = ('0' + hours + ':' + minutes)
                }
                else if (minutes < 10 && hours > 9) {
                    var time = (hours + ':0' + minutes)
                }
                else if (minutes < 10 && hours < 10) {
                    var time = ('0' + hours + ':0' + minutes)
                }
                console.log(time);
                let openTime = await db.get().collection(collection.VENDOR_COLLECTION).findOne({ _id: ObjectID(vendorId) })
                let hoursopentime = openTime.opentime
                let hoursclosetime = openTime.closetime
                console.log('start');
                hoursopentime = parseInt(hoursopentime)
                hoursclosetime = parseInt(hoursclosetime)
                console.log(hoursopentime);
                console.log(hoursclosetime);
                console.log('end');
                console.log(openTime.opentime + "   " + openTime.closetime);
                if (hoursopentime >= 12 && hoursclosetime >= 12) {
                    console.log('opentime is after 12pm and close time is after 12pm');
                    if (time >= openTime.opentime && time >= openTime.closetime) {
                        console.log('time greater than opentime and time greater than close time');
                        console.log('changed with multiple extra conditions');
                        if (openTime.opentime >= openTime.closetime) {
                            console.log('opened');
                            db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectID(vendorId) },
                                {
                                    $set: {
                                        status: true
                                    }
                                })
                        }
                        else if (openTime.opentime < openTime.closetime) {
                            console.log('closed');
                            db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectID(vendorId) },
                                {
                                    $set: {
                                        status: false
                                    }
                                })
                        }
                    }
                    else if (time < openTime.opentime && time < openTime.closetime) {
                        console.log('time lesser than opentime and time lesser than close time');
                        console.log('changed');
                        db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectID(vendorId) },
                            {
                                $set: {
                                    status: false
                                }
                            })
                    }
                    else if (time >= openTime.opentime && time <= openTime.closetime) {
                        console.log('time greater than opentime and time lesser than close time');
                        console.log('correct');
                        db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectID(vendorId) },
                            {
                                $set: {
                                    status: true
                                }
                            })
                    }
                    else if (time < openTime.opentime && time >= openTime.closetime) {
                        console.log('time lesser than opentime and time greater than close time');
                        console.log('changed');
                        console.log('changed with multiple extra conditions');
                        if (openTime.opentime >= openTime.closetime) {
                            console.log('opened');
                            db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectID(vendorId) },
                                {
                                    $set: {
                                        status: false
                                    }
                                })
                        }
                        else if (openTime.opentime < openTime.closetime) {
                            console.log('closed');
                            db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectID(vendorId) },
                                {
                                    $set: {
                                        status: false
                                    }
                                })
                        }
                    }
                }
                else if (hoursopentime <= 12 && hoursclosetime <= 12) {
                    console.log('opentime is before 12pm and close time is before 12 pm');
                    if (time >= openTime.opentime && time >= openTime.closetime) {
                        console.log('time greater than opentime and time greater than close time');
                        console.log('fixed');
                        db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectID(vendorId) },
                            {
                                $set: {
                                    status: true
                                }
                            })

                    }
                    else if (time <= openTime.opentime && time <= openTime.closetime) {
                        console.log('time less than opentime and time less than closetime');
                        db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectID(vendorId) },
                            {
                                $set: {
                                    status: true
                                }
                            })
                    }
                    else if (time <= openTime.opentime && time >= openTime.closetime) {
                        console.log('time less than opentime and time greater than closetime');
                        db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectID(vendorId) },
                            {
                                $set: {
                                    status: false
                                }
                            })
                    }
                    else if (time >= openTime.opentime && time <= openTime.closetime) {
                        console.log('time greater than opentime and time less than closetime');
                        db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectID(vendorId) },
                            {
                                $set: {
                                    status: true
                                }
                            })
                    }
                    else {
                        console.log('not working');
                    }
                }
                else if (hoursopentime >= 12 && hoursclosetime <= 12) {
                    console.log('opentime is after 12pm and close time is before 12 pm');
                    if (time >= openTime.opentime && time >= openTime.closetime) {
                        console.log('time greater than opentime and time greater than close time');
                        console.log('changed');
                        db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectID(vendorId) },
                            {
                                $set: {
                                    status: true
                                }
                            })
                    }
                    else if (time <= openTime.opentime && time <= openTime.closetime) {
                        console.log('time lesser than opentime and time less than close time');
                        db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectID(vendorId) },
                            {
                                $set: {
                                    status: true
                                }
                            })
                    }
                    else if (time <= openTime.opentime && time > openTime.closetime) {
                        console.log('time less open and great close');
                        console.log('changed');
                        db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectID(vendorId) },
                            {
                                $set: {
                                    status: false
                                }
                            })
                    }
                    else if (time >= openTime.opentime && time <= openTime.closetime) {
                        console.log('time greater open and less close');
                        db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectID(vendorId) },
                            {
                                $set: {
                                    status: true
                                }
                            })
                    }
                    else {
                        console.log('not working');
                    }
                }
                else if (hoursopentime <= 12 && hoursclosetime >= 12) {
                    console.log('opentime is before 12pm and close time is after 12 pm');
                    if (time >= openTime.opentime && time >= openTime.closetime) {
                        console.log('time greater than opentime and time greater than close time');
                        db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectID(vendorId) },
                            {
                                $set: {
                                    status: false
                                }
                            })
                    }
                    else if (time <= openTime.opentime && time <= openTime.closetime) {
                        console.log('time lesser than opentime and time lesser than close time');
                        db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectID(vendorId) },
                            {
                                $set: {
                                    status: false
                                }
                            })
                    }
                    else if (time <= openTime.opentime && time >= openTime.closetime) {
                        console.log('time lesser than opentime and time greater than close time');
                        db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectID(vendorId) },
                            {
                                $set: {
                                    status: false
                                }
                            })
                    }
                    else if (time >= openTime.opentime && time <= openTime.closetime) {
                        console.log('time greater than opentime and time lesser than close time');
                        db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectID(vendorId) },
                            {
                                $set: {
                                    status: true
                                }
                            })
                    }
                }
                else {
                    console.log('not working');
                }
            }
            vendors = await db.get().collection(collection.VENDOR_COLLECTION).find({ status: true }).toArray()
            resolve(vendors)
        })
    },
    loginDataTempo: (loginData) => {
        return new Promise(async (resolve, rejectt) => {
            let response = {}
            let userEmail = await db.get().collection(collection.USER_COLLECTION).findOne({ email: loginData.email })
            if (userEmail) {
                let password = userEmail.password;
                bcrypt.compare(loginData.password, password).then((status) => {
                    if (status) {
                        response.user = userEmail;
                        response.status = true;
                        response.user = userEmail;
                        response.status = true;
                        resolve(response)
                    }
                    else {
                        console.log('login failed. password incorrect');
                        resolve({ status: false })
                    }
                })

            } else {
                console.log("Login failed Email incorrect");
                resolve({ status: false })
            }
        })
    }
}