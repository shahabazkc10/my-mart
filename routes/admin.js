var express = require('express');
var hbs = require('express-handlebars');
const addAdmin = require('../helpers/admin-helpers');
var router = express.Router();
var adminHelpers = require('../helpers/admin-helpers')
var fileUpload = require('express-fileupload');
const { Db } = require('mongodb');

var verifyAdminLogin = (req, res, next) => {
    if (req.session.admin) {
        next()
    }
    else {
        res.redirect('/admin/login')
    }
}


/* GET users listing. */
router.get('/', verifyAdminLogin, function (req, res) {

    adminHelpers.addAdmin()
    adminHelpers.getVendors().then((vendors) => {
        adminHelpers.vendorsLive().then((vendorsLive) => {
            adminHelpers.vendorStatus().then(() => {
                res.render('admin/admin', { admin: true, response: req.session.admin.username, vendors, status: vendors.status, vendorsLive });
            })
        })
    })
});
router.get('/new-dealer', verifyAdminLogin, (req, res) => {
    res.render('admin/new-dealer')
})
router.get('/edit-dealer/:id', verifyAdminLogin, async (req, res) => {
    let dealer = await adminHelpers.getVendorDetail(req.params.id)
    res.render('admin/edit-dealer', { dealer })
})
router.post('/edit-dealer/:id', verifyAdminLogin, (req, res) => {
    let id = req.params.id;
    adminHelpers.updateVendor(req.params.id, req.body).then(() => {
        res.redirect('/admin')
        if (req.files.Image) {
            let image = req.files.Image
            image.mv('./public/vendor-images/' + id + '.jpg')
        }
    })
})
router.get('/ban-dealer', verifyAdminLogin, (req, res) => {
    let vendorDetails = {
        _id: req.query.id,
        username: req.query.username,
        password: req.query.password,
        address: req.query.address,
        storename: req.query.storename,
        extrainfo: req.query.extrainfo,
        phonenumber: req.query.phonenumber,
        opentime: req.query.opentime,
        closetime: req.query.closetime
    }

    adminHelpers.banVendor(vendorDetails).then(() => {
        res.redirect('/admin')
    })
})

router.get('/login', (req, res) => {
    if (req.session.admin) {
        res.redirect('/admin')
    }
    else {
        res.render('admin/login')
    }

})
router.get('/delete-dealer/:id', verifyAdminLogin, (req, res) => {
    let vendorId = req.params.id
    adminHelpers.deleteVendor(vendorId).then((response) => {
        res.redirect('/admin')
    })
})
router.post('/login', (req, res) => {
    adminHelpers.adminLogIn(req.body).then((response, loginErr) => {
        if (response.status) {
            req.session.admin = response.admin;
            req.session.adminLoggedIn = true;
            res.json({ status: true })
        }
        else {
            res.json({ status: false })
        }
    })

})
router.get('/logout', verifyAdminLogin, (req, res) => {
    req.session.admin = null;
    res.redirect('/admin')
})
router.post('/new-dealer', verifyAdminLogin, (req, res) => {
    adminHelpers.addVendor(req.body).then((id) => {
        let image = req.files.Image
        image.mv('./public/vendor-images/' + id + '.jpg', (err, done) => {
            if (!err) {
                res.redirect('/admin')

            }
            else {
                console.log(err);
            }
        })
    })
})
router.get('/settings', verifyAdminLogin, (req, res) => {
    adminHelpers.getBanList().then((bannedvendors) => {
        adminHelpers.getBanUserList().then((bannedusers) => {
            adminHelpers.getCategories().then((categories) => {
                res.render('admin/settings', { admin: true, categories, bannedvendors, bannedusers })
            })

        })

    })
})
router.get('/unban', verifyAdminLogin, (req, res) => {
    let vendorDetails = {
        _id: req.query.id,
        username: req.query.username,
        password: req.query.password,
        address: req.query.address,
        storename: req.query.storename,
        extrainfo: req.query.extrainfo,
        phonenumber: req.query.phonenumber,
        opentime: req.query.opentime,
        closetime: req.query.closetime
    }
    adminHelpers.unBan(vendorDetails).then(() => {

        res.redirect('/admin/settings')
    })
})
router.get('/edit-user/:id', verifyAdminLogin, (req, res) => {
    let id = req.params.id
    adminHelpers.getUserData(id).then((userdata) => {
        res.render('admin/edit-user', { userdata })
    })
})
router.post('/edit-user/:id', verifyAdminLogin, (req, res) => {
    let id = req.params.id;
    adminHelpers.updateUser(id, req.body).then(() => {
        res.redirect('/admin/users')
        if (req.files.Image) {
            let image = req.files.Image
            image.mv('./public/user-images/' + id + '.jpg')
        }
    })
})
router.get('/delete-user/:id', verifyAdminLogin, (req, res) => {
    let id = req.params.id;
    adminHelpers.deleteUser(id).then(() => {
        res.redirect('/admin/users')
    })
})
router.get('/ban-user/:id', verifyAdminLogin, (req, res) => {
    let id = req.params.id;
    adminHelpers.banUser(id).then(() => {
        res.redirect('/admin/users')
    })
})
router.get('/unban/:id', verifyAdminLogin, (req, res) => {
    let id = req.params.id;
    adminHelpers.unBanUser(id).then(() => {
        res.redirect('/admin/settings')
    })
})
router.get('/users', verifyAdminLogin, (req, res) => {
    adminHelpers.getUser().then((user) => {
        adminHelpers.totalUsers().then((totalUsers) => {
            adminHelpers.totalBanned().then((totalBanned) => {
                adminHelpers.totalOrders().then((totalOrders) => {
                    res.render('admin/users', { user, admin: true, totalOrders, totalBanned, totalUsers, response: req.session.admin.username, totalUsers })
                })
            })
        })
    })
})
router.get('/add-user', verifyAdminLogin, (req, res) => {
    res.render('admin/add-user')
})
router.post('/new-user', verifyAdminLogin, (req, res) => {
    adminHelpers.newUser(req.body).then((id) => {
        let image = req.files.Image
        image.mv('./public/user-images/' + id + '.jpg', (err, done) => {
            if (!err) {
                res.redirect('/admin/users')
            }
            else {
                console.log(err);
            }
        })

    })
})
router.get('/edit-category/:id', verifyAdminLogin, (req, res) => {
    let id = req.params.id
    adminHelpers.getCategoriesOfId(id).then((categories) => {
        res.render('admin/edit-category', { categories })
    })

})
router.post('/edit-category/:id', verifyAdminLogin, (req, res) => {
    let id = req.params.id;
    adminHelpers.updateCategory(id, req.body).then(() => {
        res.redirect('/admin/settings')
        if (req.files.Image) {
            let image = req.files.Image
            image.mv('./public/category-images/' + id + '.jpg')
        }
    })
})
router.post('/new-category', verifyAdminLogin, (req, res) => {
    adminHelpers.addCategory(req.body).then((id) => {
        let image = req.files.Image;
        image.mv('./public/category-images/' + id + '.jpg', (err, done) => {
            if (!err) {
                res.redirect('/admin/settings')
            }
            else {
            }
        })
    })
})
router.get('/delete-category/:id', verifyAdminLogin, (req, res) => {
    let id = req.params.id;
    adminHelpers.deleteCategory(id).then(() => {
        res.redirect('/admin/settings')
    })
})
router.get('/others', verifyAdminLogin, (req, res) => {
    adminHelpers.getOrderStatus().then((status) => {
        res.render('admin/others', { admin: true, status })
    })

})
router.post('/newstatus', verifyAdminLogin, (req, res) => {
    let data = req.body
    adminHelpers.addNewStatus(data).then(() => {
        res.json({ status: true })
    })
})


module.exports = router;
