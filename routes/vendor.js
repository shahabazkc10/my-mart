const { response } = require('express');
var express = require('express');
const { Db } = require('mongodb');
var router = express.Router();
var vendorHelpers = require('../helpers/vendor-helpers')
/* GET users listing. */
var verifyVendorLogin = (req, res, next) => {
  if (req.session.vendor) {
    next()
  }
  else {
    res.redirect('/vendor/login')
  }
}
router.get('/', verifyVendorLogin, function (req, res, next) {
  let vendorId = req.session.vendor._id;
  vendorHelpers.getOrderList(vendorId).then((orders) => {
    vendorHelpers.getOrderStatus().then((orderStatus) => {
      console.log(orderStatus);
      res.render('vendor/orders', { orders, vendor: true, orderStatus, response: req.session.vendor.username, storename: req.session.vendor.storename, id: req.session.vendor._id })
    })

  })
});
router.get('/login', (req, res) => {
  let loginErr = req.query.loginErr
  res.render('vendor/login', { loginErr })
})
router.post('/login', (req, res) => {
  vendorHelpers.login(req.body).then((response) => {
    if (response.status) {
      req.session.vendor = response.vendor;
      req.session.vendorLoggedIn = true;
      res.json({status:true})
    }
    else {
      req.session.vendorLoginErr = true;
      res.json({status:false})
    }
  })
})
router.get('/logout', (req, res) => {
  req.session.vendor = null;
  res.redirect('/vendor')
})
router.get('/orders', verifyVendorLogin, (req, res) => {
  res.redirect('/vendor')
})
router.get('/order-history', verifyVendorLogin, async (req, res) => {
  let orders = await vendorHelpers.getOrderDeliveredProducts()
  res.render('vendor/order-history', { vendor: true, orders, response: req.session.vendor.username, storename: req.session.vendor.storename, id: req.session.vendor._id })
})
router.get('/users', verifyVendorLogin, (req, res) => [
  vendorHelpers.getUsers(req.session.vendor.username).then((users) => {
    res.render('vendor/users', { users, vendor: true, response: req.session.vendor.username, storename: req.session.vendor.storename, id: req.session.vendor._id })
  })
])
router.get('/settings', verifyVendorLogin, (req, res) => {
  vendorHelpers.getStatus(req.session.vendor._id).then((vendorD) => {
    vendorHelpers.getBanList().then((banData) => {
      res.render('vendor/settings', { vendor: true, banData, response: req.session.vendor.username, id: req.session.vendor._id, status: vendorD.status, vendorD, storename: req.session.vendor.storename })
    })
  })

})
router.get('/products', verifyVendorLogin, (req, res) => {
  vendorHelpers.getProducts(req.session.vendor.username).then((products) => {
    vendorHelpers.getDisableProduct(req.session.vendor.username).then((disableProduct) => {
      res.render('vendor/products', { products, vendor: true, disableProduct, response: req.session.vendor.username, storename: req.session.vendor.storename, id: req.session.vendor._id })
    })
  })

})
router.get('/feedback', verifyVendorLogin, (req, res) => {
  res.render('vendor/feedback', { vendor: true, response: req.session.vendor.username, storename: req.session.vendor.storename, id: req.session.vendor._id })
})
router.get('/add-products', verifyVendorLogin, (req, res) => {
  vendorHelpers.getCategories().then((categories) => {
    res.render('vendor/add-products', { response: req.session.vendor.username, categories, storename: req.session.vendor.storename, storeId: req.session.vendor._id })
  })

})
router.post('/add-products', verifyVendorLogin, (req, res) => {
  vendorHelpers.addProduct(req.body).then((id) => {
    let image = req.files.croppedImage
    image.mv('./public/product-images/' + id + '.jpg', (err, done) => {
      if (!err) {
        res.redirect('/vendor/products')

      }
      else {
        console.log(err);
      }
    })
  })

})
router.get('/edit-product/:id', verifyVendorLogin, async (req, res) => {
  let product = await vendorHelpers.getProductDetail(req.params.id).then((product) => {

    vendorHelpers.getCategories().then((category) => {
      let mass = product.quantitytype
      if (mass == 'kilogram') {
        type = true
      }
      else {
        type = false
      }
      res.render('vendor/edit-product', { response: req.session.vendor.username, type, product, storename: req.session.vendor.storename, storeId: req.session.vendor._id, category })
    })

  })
})
router.post('/edit-product/:id', verifyVendorLogin, (req, res) => {
  let id = req.params.id;
  vendorHelpers.updateProduct(id, req.body).then(() => {
    res.redirect('/vendor/products')
    if (req.files.Image) {
      let image = req.files.Image
      image.mv('./public/product-images/' + id + '.jpg')

    }
  })
}),
  router.get('/disable-product/:id', verifyVendorLogin, (req, res) => {
    let id = req.params.id;
    vendorHelpers.disableProduct(id).then(() => {
      res.redirect('/vendor/products')
    })
  })
router.get('/enable/:id', verifyVendorLogin, (req, res) => {
  let id = req.params.id;
  vendorHelpers.enable(id).then(() => {
    res.redirect('/vendor/products')
  })
})
router.get('/delete-product/:id', verifyVendorLogin, (req, res) => {
  let id = req.params.id;
  vendorHelpers.deleteProduct(id).then(() => {
    res.redirect('/vendor/products')
  })
})
router.get('/stock/:id', verifyVendorLogin, (req, res) => {
  let id = req.params.id;
  vendorHelpers.editStock(id).then((product) => {
    res.render('vendor/stock', { product })
  })
})
router.post('/stock/:id', verifyVendorLogin, (req, res) => {
  let id = req.params.id;
  vendorHelpers.editStockUpdate(id, req.body).then(() => {
    res.redirect('/vendor/products')
  })
})
router.get('/closenow', verifyVendorLogin, (req, res) => {
  let id = req.session.vendor._id;
  vendorHelpers.closeDealer(id).then(() => {
    res.redirect('/vendor/settings')
  })
})
router.get('/opennow', verifyVendorLogin, (req, res) => {
  let id = req.session.vendor._id;
  vendorHelpers.OpenDealer(id).then(() => {
    res.redirect('/vendor/settings')
  })
})
router.post('/time/:id', verifyVendorLogin, (req, res) => {
  let id = req.params.id;
  vendorHelpers.updateTime(id, req.body).then(() => {
    res.json({status:true})
  })
})
router.get('/add-user', verifyVendorLogin, (req, res) => {
  res.render('vendor/add-user', { response: req.session.vendor.username })
})
router.post('/new-user', verifyVendorLogin, (req, res) => {
  vendorHelpers.newUser(req.body).then((id) => {
    image.mv('./public/user-images/' + id + '.jpg', (err, done) => {
      if (!err) {
        res.redirect('/vendor/users')
        console.log("added user successfully");
      }
      else {
        console.log(err);
      }
    })
  })
})
router.get('/user-edit/:id', verifyVendorLogin, (req, res) => {
  let id = req.params.id;
  vendorHelpers.getUser(id).then((userdata) => {
    res.render('vendor/edit-user', { userdata })
  })
})
router.post('/user-edit/:id', verifyVendorLogin, (req, res) => {
  let id = req.params.id;
  vendorHelpers.updateUser(id, req.body).then(() => {
    res.redirect('/vendor/users')
    if (req.files.Image) {
      let image = req.files.Image
      image.mv('./public/user-images/' + id + '.jpg')
    }
  })
})
router.get('/user-ban/:id', verifyVendorLogin, (req, res) => {
  let id = req.params.id;
  vendorHelpers.banUser(id).then(() => {
    res.redirect('/vendor/users')
  })
})
router.get('/unban-user/:id', verifyVendorLogin, (req, res) => {
  let id = req.params.id;
  vendorHelpers.unBan(id).then(() => {
    res.redirect('/vendor/settings')
  })
})

router.get('/user-delete/:id', verifyVendorLogin, (req, res) => {
  let id = req.params.id;
  vendorHelpers.deleteUser(id).then(() => {
    res.redirect('/vendor/users')
  })
})
router.get('/delete-disable-product/:id', verifyVendorLogin, (req, res) => {
  let id = req.params.id;
  vendorHelpers.deleteDisableProduct(id).then(() => {
    res.redirect('/vendor/products')
  })
})
router.post('/update-status/:id', verifyVendorLogin, (req, res) => {
  let data = req.body;
  let id = req.params.id
  console.log(data);
  vendorHelpers.updateOrderStatus(data, id).then(() => {
    res.json({ response })
  })
})
module.exports = router;
