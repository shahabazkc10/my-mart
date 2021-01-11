var db = require('../config/connection')
const VENDOR_COLLECTION = require('../config/collections');
var collection = require('../config/collections');
const bcrypt = require('bcrypt');
const collections = require('../config/collections');
const { ObjectID } = require('mongodb');
const { response } = require('express');
const { PRODUCTS_COLLECTION } = require('../config/collections');
module.exports = {
    login: (loginData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false;
            let response = {}
            let VendorUsername = await db.get().collection(collection.VENDOR_COLLECTION).findOne({ username: loginData.username })
            if (VendorUsername) {
                bcrypt.compare(loginData.password, VendorUsername.password).then((status) => {
                    if (status) {
                        response.vendor = VendorUsername;
                        response.status = true;
                        resolve(response)
                    }
                    else {
                        console.log("login failed. password incorrect");
                        resolve({ status: false })
                    }
                })
            }
            else {
                console.log("Login failed. username incorrect");
                resolve({ status: false })
            }
        })
    },
    addProduct: (product) => {
        product.price = parseFloat(product.price);
        product.stock = parseFloat(product.stock);
        return new Promise((resolve, reject) => {
            product.productStatus = product.productStatus = true;
            db.get().collection(collection.PRODUCTS_COLLECTION).insertOne(product).then((data) => {
                resolve(data.ops[0]._id)
            })
        })
    },
    getProducts: (vendor) => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCTS_COLLECTION).find({ vendor: vendor, productStatus: true }).toArray()
            resolve(products)
        })
    },
    getProductDetail: (productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCTS_COLLECTION).findOne({ _id: ObjectID(productId) }).then((product) => {
                resolve(product)
            })
        })
    },
    updateProduct: (id, product) => {
        return new Promise((resolve, reject) => {
            product.price = parseFloat(product.price)
            product.stock = parseFloat(product.stock)
            db.get().collection(collection.PRODUCTS_COLLECTION)
                .updateOne({ _id: ObjectID(id) },
                    {
                        $set: {
                            name: product.name,
                            category: product.category,
                            price: product.price,
                            stock: product.stock,
                            description: product.description,
                            vendor: product.vendor,
                            storename: product.storename,
                            storeId: product.storeId,
                            quantitytype: product.quantitytype,
                            productStatus: true
                        }
                    }).then((response) => {
                        resolve()
                    })
        })
    },
    disableProduct: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCTS_COLLECTION).updateOne({ _id: ObjectID(id) },
                {
                    $set: {
                        productStatus: false
                    }
                })
            resolve()
        })
    },
    getDisableProduct: (vendor) => {
        return new Promise(async (resolve, reject) => {
            let disableProduct = await db.get().collection(collection.PRODUCTS_COLLECTION).find({ vendor: vendor, productStatus: false }).toArray()
            resolve(disableProduct)
        })
    },
    enable: (proId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.PRODUCTS_COLLECTION).updateOne({ _id: ObjectID(proId) },
                {
                    $set: {
                        productStatus: true
                    }
                })
            resolve()
        })
    },
    deleteProduct: (productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCTS_COLLECTION).removeOne({ _id: ObjectID(productId) })
            resolve()
        })
    },
    editStock: (productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCTS_COLLECTION).findOne({ _id: ObjectID(productId) }).then((product) => {
                resolve(product)
            })
        })
    },
    editStockUpdate: (productId, newstock) => {
        newstock.left = parseFloat(newstock.left)
        newstock.stock = parseFloat(newstock.stock)
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCTS_COLLECTION).
                updateOne({ _id: ObjectID(productId) },
                    {
                        $set: {
                            stock: newstock.stock,
                            left: newstock.left
                        }
                    }).then((response) => {
                        resolve()
                    })
        })
    },
    closeDealer: (vendorId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectID(vendorId) },
                {
                    $set: {
                        status: false
                    }
                })
            resolve()
        })
    },
    OpenDealer: (vendorId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectID(vendorId) },
                {
                    $set: {
                        status: true
                    }
                })
            resolve()
        })
    },
    getStatus: (vendorId) => {
        return new Promise(async (resolve, reject) => {
            var date = new Date();
            console.log(date);
            var hours = date.getHours();
            var minutes = date.getMinutes();
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
                    if(openTime.opentime>=openTime.closetime){
                        console.log('opened');
                        db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectID(vendorId) },
                        {
                            $set: {
                                status: true
                            }
                        }).then(() => {
                            db.get().collection(collection.VENDOR_COLLECTION).findOne({ _id: ObjectID(vendorId) }).then((vendor) => {
                                resolve(vendor)
                            })
                        })
                    }
                    else if(openTime.opentime<openTime.closetime){
                        console.log('closed');
                        db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectID(vendorId) },
                        {
                            $set: {
                                status: false
                            }
                        }).then(() => {
                            db.get().collection(collection.VENDOR_COLLECTION).findOne({ _id: ObjectID(vendorId) }).then((vendor) => {
                                resolve(vendor)
                            })
                        })
                    }

                }
                else if (time < openTime.opentime && time < openTime.closetime) {
                    console.log('time lesser than opentime and time lesser than close time');
                    console.log('changed');
                    db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectID(vendorId) },
                        {
                            $set: {
                                status:false
                            }
                        }).then(() => {
                            db.get().collection(collection.VENDOR_COLLECTION).findOne({ _id: ObjectID(vendorId) }).then((vendor) => {
                                resolve(vendor)
                            })
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
                        }).then(() => {
                            db.get().collection(collection.VENDOR_COLLECTION).findOne({ _id: ObjectID(vendorId) }).then((vendor) => {
                                resolve(vendor)
                            })
                        })

                }
                else if (time < openTime.opentime && time >= openTime.closetime) {
                    console.log('time lesser than opentime and time greater than close time');
                    console.log('changed');
                    console.log('changed with multiple extra conditions');
                    if(openTime.opentime>=openTime.closetime){
                        console.log('opened');
                        db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectID(vendorId) },
                        {
                            $set: {
                                status: false
                            }
                        }).then(() => {
                            db.get().collection(collection.VENDOR_COLLECTION).findOne({ _id: ObjectID(vendorId) }).then((vendor) => {
                                resolve(vendor)
                            })
                        })
                    }
                    else if(openTime.opentime<=openTime.closetime){
                        console.log('closed');
                        db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectID(vendorId) },
                        {
                            $set: {
                                status: false
                            }
                        }).then(() => {
                            db.get().collection(collection.VENDOR_COLLECTION).findOne({ _id: ObjectID(vendorId) }).then((vendor) => {
                                resolve(vendor)
                            })
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
                        }).then(() => {
                            db.get().collection(collection.VENDOR_COLLECTION).findOne({ _id: ObjectID(vendorId) }).then((vendor) => {
                                resolve(vendor)
                            })
                        })

                }
                else if (time <= openTime.opentime && time <= openTime.closetime) {
                    console.log('time less than opentime and time less than closetime');
                    db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectID(vendorId) },
                        {
                            $set: {
                                status: true
                            }
                        }).then(() => {
                            db.get().collection(collection.VENDOR_COLLECTION).findOne({ _id: ObjectID(vendorId) }).then((vendor) => {
                                resolve(vendor)
                            })
                        })

                }
                else if (time <= openTime.opentime && time >= openTime.closetime) {
                    console.log('time less than opentime and time greater than closetime');
                    db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectID(vendorId) },
                        {
                            $set: {
                                status: false
                            }
                        }).then(() => {
                            db.get().collection(collection.VENDOR_COLLECTION).findOne({ _id: ObjectID(vendorId) }).then((vendor) => {
                                resolve(vendor)
                            })
                        })

                }
                else if (time >= openTime.opentime && time <= openTime.closetime) {
                    console.log('time greater than opentime and time less than closetime');
                    db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectID(vendorId) },
                        {
                            $set: {
                                status: true
                            }
                        }).then(() => {
                            db.get().collection(collection.VENDOR_COLLECTION).findOne({ _id: ObjectID(vendorId) }).then((vendor) => {
                                resolve(vendor)
                            })
                        })

                }
                else {
                    console.log('not working');
                    db.get().collection(collection.VENDOR_COLLECTION).findOne({ _id: ObjectID(vendorId) }).then((vendor) => {
                        resolve(vendor)
                    })
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
                        }).then(() => {
                            db.get().collection(collection.VENDOR_COLLECTION).findOne({ _id: ObjectID(vendorId) }).then((vendor) => {
                                resolve(vendor)
                            })
                        })

                }
                else if (time <= openTime.opentime && time <= openTime.closetime) {
                    console.log('time lesser than opentime and time less than close time');
                    db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectID(vendorId) },
                        {
                            $set: {
                                status: true
                            }
                        }).then(() => {
                            db.get().collection(collection.VENDOR_COLLECTION).findOne({ _id: ObjectID(vendorId) }).then((vendor) => {
                                resolve(vendor)
                            })
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
                        }).then(() => {
                            db.get().collection(collection.VENDOR_COLLECTION).findOne({ _id: ObjectID(vendorId) }).then((vendor) => {
                                resolve(vendor)
                            })
                        })

                }
                else if (time >= openTime.opentime && time <= openTime.closetime) {
                    console.log('time greater open and less close');
                    db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectID(vendorId) },
                        {
                            $set: {
                                status: true
                            }
                        }).then(() => {
                            db.get().collection(collection.VENDOR_COLLECTION).findOne({ _id: ObjectID(vendorId) }).then((vendor) => {
                                resolve(vendor)
                            })
                        })

                }
                else {
                    console.log('not working');
                    db.get().collection(collection.VENDOR_COLLECTION).findOne({ _id: ObjectID(vendorId) }).then((vendor) => {
                        resolve(vendor)
                    })
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
                        }).then(() => {
                            db.get().collection(collection.VENDOR_COLLECTION).findOne({ _id: ObjectID(vendorId) }).then((vendor) => {
                                resolve(vendor)
                            })
                        })

                }
                else if (time <= openTime.opentime && time <= openTime.closetime) {
                    console.log('time lesser than opentime and time lesser than close time');
                    db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectID(vendorId) },
                        {
                            $set: {
                                status: false
                            }
                        }).then(() => {
                            db.get().collection(collection.VENDOR_COLLECTION).findOne({ _id: ObjectID(vendorId) }).then((vendor) => {
                                resolve(vendor)
                            })
                        })

                }
                else if (time <= openTime.opentime && time >= openTime.closetime) {
                    console.log('time lesser than opentime and time greater than close time');
                    db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectID(vendorId) },
                        {
                            $set: {
                                status: false
                            }
                        }).then(() => {
                            db.get().collection(collection.VENDOR_COLLECTION).findOne({ _id: ObjectID(vendorId) }).then((vendor) => {
                                resolve(vendor)
                            })
                        })

                }
                else if (time >= openTime.opentime && time <= openTime.closetime) {
                    console.log('time greater than opentime and time lesser than close time');
                    db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectID(vendorId) },
                        {
                            $set: {
                                status: true
                            }
                        }).then(() => {
                            db.get().collection(collection.VENDOR_COLLECTION).findOne({ _id: ObjectID(vendorId) }).then((vendor) => {
                                resolve(vendor)
                            })
                        })

                }
            }
            else {
                console.log('not working');
                db.get().collection(collection.VENDOR_COLLECTION).findOne({ _id: ObjectID(vendorId) }).then((vendor) => {
                    resolve(vendor)
                })
            }

        })
    },
    updateTime: (vendorId, time) => {
        return new Promise((resolve, reject) => {

            db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectID(vendorId) },
                {
                    $set: {
                        opentime: time.opentime,
                        closetime: time.closetime
                    }
                }).then((vendor) => {
                    resolve()
                })
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
    getUsers: (username) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).find({ referredby: username }).toArray()
            resolve(user)
        })
    },
    getUser: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectID(id) }).then((data) => {
                resolve(data)
            })
        })
    },
    updateUser: (id, data) => {
        return new Promise(async (resolve, reject) => {
            if (data.password) {
                data.password = await bcrypt.hash(data.password, 10)
                db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectID(id) },
                    {
                        $set: {
                            username: data.username,
                            address: data.address,
                            email: data.email,
                            phonenumber: data.phonenumber,
                            password: data.password
                        }
                    }).then(() => {
                        resolve()
                    })
            }
            else {
                db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectID(id) },
                    {
                        $set: {
                            username: data.username,
                            address: data.address,
                            email: data.email,
                            phonenumber: data.phonenumber
                        }
                    }).then(() => {
                        resolve()
                    })
            }

        })
    },
    banUser: (id) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectID(id) })

            let username = user.username;
            let address = user.address;
            let email = user.email;
            let password = user.password;
            let phonenumber = user.phonenumber;

            db.get().collection(collection.BANNED_USER_COLLECTION).insertOne({ _id: ObjectID(user._id), username, address, email, password, phonenumber })
            db.get().collection(collection.USER_COLLECTION).removeOne({ _id: ObjectID(id) }).then(() => {
                resolve()
            })
        })
    },
    getBanList: () => {
        return new Promise(async (resolve, reject) => {
            let banlist = await db.get().collection(collection.BANNED_COLLECTION).find().toArray()
            resolve(banlist)
        })
    },
    unBan: (id) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.BANNED_USER_COLLECTION).findOne({ _id: ObjectID(id) })
            let username = user.username;
            let address = user.address;
            let email = user.email;
            let password = user.password;
            let phonenumber = user.phonenumber;

            db.get().collection(collection.USER_COLLECTION).insertOne({ _id: ObjectID(user._id), username, address, email, password, phonenumber })
            db.get().collection(collection.BANNED_USER_COLLECTION).removeOne({ _id: ObjectID(id) }).then(() => {
                resolve()
            })
        })
    },
    deleteUser: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).removeOne({ _id: ObjectID(id) })
            resolve()
        })
    },
    getCategories: () => {
        return new Promise(async (resolve, reject) => {
            let categories = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            resolve(categories)
        })
    },
    deleteDisableProduct: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.DISABLEPRODUCT_COLLECTION).removeOne({ _id: ObjectID(id) }).then(() => {
                resolve()
            })
        })
    },
    getOrderList: (vendorId) => {
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).find({ vendor: ObjectID(vendorId), delivered: false }).toArray()
            resolve(orderItems)
        })
    },
    getOrderStatus: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_STATUS_COLLECTION).find().toArray().then((status) => {
                resolve(status)
            })
        })
    },
    updateOrderStatus: (data, id) => {
        return new Promise((resolve, reject) => {
            let statusData = data.status;
            if (statusData == 'Order Delivered') {
                db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectID(id) },
                    {
                        $set: {
                            status: data.status,
                            deliveredOn: new Date(),
                            updatedOn: new Date(),
                            delivered: true
                        }
                    }).then(() => {
                        resolve()
                    })
            }
            else {
                db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectID(id) },
                    {
                        $set: {
                            status: data.status,
                            updatedOn: new Date(),
                            delivered: false
                        }
                    }).then(() => {
                        resolve()
                    })
            }

        })
    },
    getOrderDeliveredProducts: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).find({ status: 'Order Delivered', delivered: true }).toArray().then((orders) => {
                resolve(orders)
            })
        })
    }
}