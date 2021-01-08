var db = require('../config/connection')
const ADMIN_COLLECTION = require('../config/collections')
var collection = require('../config/collections')
const bcrypt = require('bcrypt');
const collections = require('../config/collections');
const { ObjectID } = require('mongodb');
const { response } = require('express');
module.exports = {

    addAdmin: () => {
        admins = { username: 'shahabaz', password: 'muhammedsalah' }
        return new Promise(async (resolve, reject) => {
            let pass = "$2b$10$68Ky8h0C0vGAvkpOawZv6eMT3KjqEimq0mHrgY9tXXw/5QHddZ2v6"


            let adminUsername = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ username: admins.username })
            let adminPassword = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ password: pass })
            if (adminUsername && adminPassword) {
                console.log("same found");
            }
            else {
                admins.password = admins.password.toString()
                console.log(admins.password + pass);
                bcrypt.compare(admins.password, pass).then((status) => {
                    if (status) {
                        db.get().collection(collection.ADMIN_COLLECTION).insertOne({ username: admins.username, password: pass });
                        console.log("account created")
                    }
                    else {
                        console.log("failed");
                    }

                })
            }
        })
    },
    adminLogIn: (logData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false;
            let loginErr = false;
            let response = {}
            let adminUsername = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ username: logData.username })
            if (adminUsername) {
                bcrypt.compare(logData.password, "$2b$10$68Ky8h0C0vGAvkpOawZv6eMT3KjqEimq0mHrgY9tXXw/5QHddZ2v6").then((status) => {
                    if (status) {
                        loginStatus = true
                        response.admin = adminUsername;
                        response.status = true;
                        resolve(response, { loginErr: false })
                    }
                    else {
                        console.log("login failed. password incorrect");
                        resolve({ status: false, loginErr: true })
                    }
                })
            }
            else {
                console.log("Login failed. username incorrect");
                resolve({ status: false, loginErr: true })
            }
        })
    },
    addVendor: (vendor) => {
        return new Promise(async (resolve, reject) => {
            vendor.password = await bcrypt.hash(vendor.password, 10)
            vendor.status = false;
            db.get().collection(collection.VENDOR_COLLECTION).insertOne(vendor).then((data) => {
                resolve(data.ops[0]._id)
            })
        })


    },
    getVendors: () => {
        return new Promise(async (resolve, reject) => {
            let vendors = await db.get().collection(collection.VENDOR_COLLECTION).find().toArray()
            resolve(vendors)
        })
    },
    getVendorDetail: (vendorId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.VENDOR_COLLECTION).findOne({ _id: ObjectID(vendorId) }).then((vendor) => {
                resolve(vendor)
            })
        })
    },
    updateVendor: (vendorId, vendor) => {
        return new Promise(async (resolve, reject) => {
            if (vendor.password) {
                vendor.password = await bcrypt.hash(vendor.password, 10)
                db.get().collection(collection.VENDOR_COLLECTION)
                    .updateOne({ _id: ObjectID(vendorId) }, {
                        $set: {
                            username: vendor.username,
                            address: vendor.address,
                            storename: vendor.storename,
                            extrainfo: vendor.extrainfo,
                            phonenumber: vendor.phonenumber,
                            password: vendor.password
                        }
                    }).then((response) => {
                        resolve()
                    })
            }
            else {
                db.get().collection(collection.VENDOR_COLLECTION)
                    .updateOne({ _id: ObjectID(vendorId) }, {
                        $set: {
                            username: vendor.username,
                            address: vendor.address,
                            storename: vendor.storename,
                            extrainfo: vendor.extrainfo,
                            phonenumber: vendor.phonenumber
                        }
                    }).then((response) => {
                        resolve()
                    })
            }

        })
    },
    deleteVendor: (vendorId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.VENDOR_COLLECTION).removeOne({ _id: ObjectID(vendorId) }).then((response) => {
                resolve(response)
            })
        })
    },
    banVendor: (vendorDetails) => {
        return new Promise((resolve, reject) => {
            let username = vendorDetails.username;
            let password = vendorDetails.password;
            let address = vendorDetails.address;
            let storename = vendorDetails.storename;
            let extrainfo = vendorDetails.extrainfo;
            let phonenumber = vendorDetails.phonenumber;
            let opentime = vendorDetails.opentime;
            let closetime = vendorDetails.closetime;
            let newObjectId = vendorDetails._id;
            db.get().collection(collection.BANNED_COLLECTION).insertOne({ _id: ObjectID(newObjectId), username, password, address, storename, extrainfo, phonenumber, opentime, closetime }).then((data) => {
                resolve(data)
            })
            db.get().collection(collection.VENDOR_COLLECTION).removeOne({ _id: ObjectID(newObjectId) }).then((response) => {
                resolve(response)
            })
        })
    },
    getBanList: () => {
        return new Promise(async (resolve, reject) => {
            let bannedVendor = await db.get().collection(collection.BANNED_COLLECTION).find().toArray()

            resolve(bannedVendor)
        })
    },
    unBan: (vendorDetails) => {
        return new Promise((resolve, reject) => {
            let username = vendorDetails.username;
            let password = vendorDetails.password;
            let address = vendorDetails.address;
            let storename = vendorDetails.storename;
            let extrainfo = vendorDetails.extrainfo;
            let phonenumber = vendorDetails.phonenumber;
            let opentime = vendorDetails.opentime;
            let closetime = vendorDetails.closetime;
            let newObjectId = vendorDetails._id;
            console.log(closetime);
            db.get().collection(collection.VENDOR_COLLECTION).insertOne({ _id: ObjectID(newObjectId), username, password, address, storename, extrainfo, phonenumber, opentime, closetime }).then((data) => {
                resolve(data)
            })
            db.get().collection(collection.BANNED_COLLECTION).removeOne({ _id: ObjectID(newObjectId) }).then((response) => {
                resolve(response)
            })
        })

    },
    vendorsLive: () => {
        return new Promise(async (resolve, reject) => {

            let totalCount = await db.get().collection(collection.VENDOR_COLLECTION).count()
            let totalOpen = await db.get().collection(collection.VENDOR_COLLECTION).find({ status: true }).count()
            let totalClose = await db.get().collection(collection.VENDOR_COLLECTION).find({ status: false }).count()
            let liveShow = { total: totalCount, open: totalOpen, close: totalClose }
            resolve(liveShow)
        })
    },
    vendorStatus: () => {
        return new Promise(async (resolve, reject) => {
            var date = new Date();
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
            console.log("current time");
            console.log(time);
            let vendorsTotal = await db.get().collection(collection.VENDOR_COLLECTION).find().count()
            let vendors = await db.get().collection(collection.VENDOR_COLLECTION).find().toArray()
            for (i = 0; i < vendorsTotal; i++) {
                let vendorId = vendors[i]._id
                db.get().collection(collection.VENDOR_COLLECTION).findOne({ _id: ObjectID(vendors[i]._id) }).then((vendor) => {
                    if (time > vendor.opentime && time < vendor.closetime) {
                        console.log("close time");
                        console.log(vendor.closetime);
                        db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectID(vendorId) },
                            {
                                $set: {
                                    status: true
                                }
                            })
                    }
                    else {
                        console.log("open time");
                        console.log(vendor.opentime);
                        db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectID(vendorId) },
                            {
                                $set: {
                                    status: false
                                }
                            })
                    }
                    resolve(vendor)
                })
            }


        })
    },
    getUser: () => {
        return new Promise(async (resolve, reject) => {
            let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)
        })
    },
    getUserData: (id) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectID(id) }).then((data) => {
                resolve(data)
            })
        })
    },
    updateUser: (id, data) => {
        return new Promise(async(resolve, reject) => {
            if (data.password) {
                data.password = await bcrypt.hash(data.password, 10)
                db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectID(id) },
                    {
                        $set: {
                            username: data.username,
                            address: data.address,
                            email: data.email,
                            phonenumber: data.phonenumber,
                            password:data.password
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
                            phonenumber: data.phonenumber,
 
                        }
                    }).then(() => {
                        resolve()
                    })
            }

        })
    },
    deleteUser: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).removeOne({ _id: ObjectID(id) })
            resolve()
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
    getBanUserList: () => {
        return new Promise(async (resolve, reject) => {
            let userList = await db.get().collection(collection.BANNED_USER_COLLECTION).find().toArray()
            resolve(userList)
        })
    },
    unBanUser: (id) => {
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
    newUser: (data) => {
        return new Promise(async (resolve, reject) => {
            data.password = await bcrypt.hash(data.password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(data).then((userData) => {
                resolve(userData.ops[0]._id)
            })
        })
    },
    totalUsers: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).count().then((totalCount) => {
                resolve(totalCount)
            })
        })
    },
    totalBanned: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.BANNED_USER_COLLECTION).count().then((totalBanned) => {
                resolve(totalBanned)
            })
        })
    },
    addCategory: (inCategory) => {
        return new Promise(async (resolve, reject) => {
            insertedCategory = inCategory.name;
            let oldCategories = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ name: insertedCategory })
            if (oldCategories) {
                if (oldCategories.name == insertedCategory) {
                    console.log(oldCategories.category);
                    console.log("already have same category");
                    resolve()
                }
            }

            else {
                console.log("not found same category");
                db.get().collection(collection.CATEGORY_COLLECTION).insertOne(inCategory).then((categorydata) => {
                    resolve(categorydata.ops[0]._id)
                })
            }

        })
    },
    getCategories: () => {
        return new Promise(async (resolve, reject) => {
            let categories = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            resolve(categories)
        })
    },
    getCategoriesOfId: (id) => {
        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id: ObjectID(id) }).then((category) => {
                resolve(category)
            })

        })
    },
    updateCategory: (id, data) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ _id: ObjectID(id) },
                {
                    $set: {
                        name: data.name,
                        description: data.description,
                    }
                }).then(() => {
                    resolve()
                })
        })
    },
    deleteCategory: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).removeOne({ _id: ObjectID(id) })
            resolve()
        })
    },
    addNewStatus:(data)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_STATUS_COLLECTION).insertOne(data).then(()=>{
                resolve()
            })
        })
    },
    getOrderStatus:()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_STATUS_COLLECTION).find().toArray().then((status)=>{
                resolve(status)
            })
        })
    },
    totalOrders:()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).count().then((orderCount)=>{
                resolve(orderCount)
            })
        })
    }
}
