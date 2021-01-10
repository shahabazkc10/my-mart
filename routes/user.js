var express = require('express');
var router = express.Router();
var userHelpers = require('../helpers/user-helpers');
const Nexmo = require('nexmo');
const { response } = require('express');
const e = require('express');
const { Db, ReplSet } = require('mongodb');
const nexmo = new Nexmo({
  apiKey: 'fc61d2e3',
  apiSecret: 'TufY1Gnbf58miiXJ'
})

/* GET home page. */
var verifyUserLogin = (req, res, next) => {
  if (req.session.user) {
    next()
  }
  else {
    let url = req.url;
    res.redirect('/tempo-login?url='+url)
  }
}

router.get('/', (req, res, next) => {
  if (req.session.user) {
    let userId = req.session.user._id;
    userHelpers.getVendors().then((vendors) => {
      res.render('user/user', { user: true, response: req.session.user.username, vendors });
    })
  }
  else {
    userHelpers.getVendors().then((vendors) => {
      res.render('user/user', { user: true, vendors });
    })

  }

});
router.get('/login', (req, res) => {
  let loginErr = req.query.loginErr;
  console.log(loginErr);
  res.render('user/login', { loginErr })
})


router.post('/login', (req, res) => {
  userHelpers.loginData(req.body).then((response) => {
    if (response.status) {
      responsedata = response
      console.log(response);
      console.log("login data corrrect");
      let mobile = response.user.phonenumber;
      let number = mobile;
      console.log(number);
      nexmo.verify.request({
        number: +91 + number,
        brand: 'ACME Corp'
      }, (error, result) => {
        if (result.status != 0) {
          console.log(result);
          res.json(status)
        }
        else {
          console.log("request id");
          console.log(result);
          let requestId = result.request_id;
          console.log(requestId);
          res.json({ requestId })
          res.status(requestId)
          router.post('/verify', (req, res) => {
            nexmo.verify.check({
              request_id: req.body.requestId,
              code: req.body.code
            }, (error, result) => {
              if (result.status != 0) {
                res.json()
              }
              else {
                req.session.user = response.user;
                req.session.userLoggedin = true;
                res.json({ success: true })
              }
            })
          })
        }
      })
    }
    else {
      req.session.userLoginErr = true;
      res.json()
    }

  })
})

router.get('/logout', (req, res) => {
  req.session.user = null
  res.redirect('/')
})

router.get('/signup', (req, res) => {
  res.render('user/signup')
})
router.post('/signup', (req, res) => {
  let userdata = req.body;
  let userImage = req.files.Image;
  let mobile = userdata.phonenumber;
  nexmo.verify.request({
    number: +91 + mobile,
    brand: 'ACME Corp'
  }, (error, result) => {
    if (result.status != 0) {
      console.log("not entered");
      console.log(result);
      res.redirect('/signup')
    }
    else {
      let requestId = result.request_id;
      console.log(requestId);
      res.json({ requestId })
      res.status(requestId)
      router.post('/verify', (req, res) => {
        nexmo.verify.check({
          request_id: req.body.requestId,
          code: req.body.code
        }, (error, result) => {
          if (result.status != 0) {
            res.json()
          }
          else {
            userHelpers.newUser(userdata).then((id) => {
              userImage.mv('./public/user-images/' + id + '.jpg', (err, done) => {
                if (!err) {
                  res.json({ success: true })
                }
                else {
                  res.json()
                  console.log("unsuccesfull");
                  console.log(err);
                }
              })
            })
          }
        })
      })
    }
  })
})

router.get('/view/:vendorid/a', (req, res) => {

  if (req.session.user) {
    userHelpers.getCategory().then((categories) => {
      res.render('user/get-category', { user: true, response: req.session.user.username, categories })
    })

  }
  else {
    userHelpers.getCategory().then((categories) => {
      res.render('user/get-category', { user: true, categories })
    })
  }
})
router.get('/view/:vendorid/:catid', (req, res) => {

  let vendorId = req.params.vendorid;
  let catId = req.params.catid;
  userHelpers.getProducts(vendorId, catId).then((product) => {
    if (req.session.user) {
      res.render('user/view-products', { user: true, product, response: req.session.user.username })
    }
    else {
      res.render('user/view-products', { user: true, product })
    }

  })

})
router.post('/check-status-cart', verifyUserLogin, (req, res) => {
  let store = req.body.storeId;
  let userId = req.session.user._id;
  userHelpers.getStatusCart(userId, store).then((data) => {
    res.json(data)
  })
})
router.post('/view-products/add-to-cart/:id', verifyUserLogin, (req, res) => {
  let proId = req.params.id;
  let userId = req.session.user._id;
  let storeId = req.body.storeId
  userHelpers.addToCart(proId, userId, storeId).then(() => {
    res.json({ status: true, response: req.session.user.username })
  })
})
router.get('/tempo-login', (req, res) => {
  var id = req.query.url;
  let loginErr = req.query.loginErr
  res.render('user/tempo-login',{url:id,loginErr})
})
router.post('/tempo-login/:id', (req, res) => {
  let url = req.params.id
  userHelpers.loginDataTempo(req.body).then((response) => {
    if (response.status) {
      req.session.user = response.user;
      req.session.userLoggedin = true; 
      res.json({status:true,url:url})
    }
    else {
      res.json({status:false})
    }
  })
})
router.post('/tempo-login', (req, res) => {
  userHelpers.loginDataTempo(req.body).then((response) => {
    if (response.status) {
      req.session.user = response.user;
      req.session.userLoggedin = true; 
      res.json({status:true})
    }
    else {
      res.json({status:false})
    }
  })
})

router.get('/cart', verifyUserLogin, async (req, res) => {
  let userId = req.session.user._id;
  userHelpers.getCategory().then(async (categories) => {
    let primaryAddress = await userHelpers.getThisPrimaryAddress(userId)
    let products = await userHelpers.getCartProducts(userId)

    let totalValue = 0;
    if (products.length > 0) {
      totalValue = await userHelpers.getTotalAmount(userId)
    }
    let productLength = products.length;
    let productValue = await userHelpers.getProductAmount(userId)
    if (primaryAddress) {
      if (primaryAddress[0]) {
        let address = primaryAddress[0].address;
        res.render('user/cart', { user: true, productLength, products, totalValue, productValue, response: req.session.user.username, address, categories });
      }
      else {
        res.render('user/cart', { user: true, productLength, products, totalValue, productValue, response: req.session.user.username, categories });
      }

    }

    else {
      res.render('user/cart', { user: true, productLength, products, totalValue, productValue, response: req.session.user.username, categories });
    }

  })
})
router.get('/view-products-seller/:id/:category', async (req, res) => {
  let sellerId = req.params.id;
  let categoryId = req.params.category;
  if (req.session.user) {
    let userId = req.session.user._id;
    let address = await userHelpers.getThisPrimaryAddress(userId)
    let products = await userHelpers.getCartProducts(req.session.user._id)
    userHelpers.getProductsBySeller(sellerId, categoryId).then((product) => {
      res.render('user/seller-view', { user: true, product, products, response: req.session.user.username, categoryId, address })
    })
  }
  else {
    userHelpers.getProductsBySeller(sellerId, categoryId).then((product) => {
      res.render('user/seller-view', { user: true, product })
    })
  }

})
router.get('/manage-address', verifyUserLogin, (req, res) => {
  let id = req.session.user._id;
  userHelpers.getThisPrimaryAddress(id).then((primaryAddress) => {
    userHelpers.getThisAlternativeAddress(id).then((alternativeAddress) => {
      res.render('user/manage-address', { primaryAddress, alternativeAddress, user: true, response: req.session.user.username })
    })
  })

})
router.post('/delete-other-cart-product', verifyUserLogin, (req, res) => {
  let id = req.session.user._id;
  let proId = req.body.proId;
  let storeId = req.body.storeId;
  userHelpers.removeCartProducts(id, proId, storeId).then((response) => {
    res.json(response)
  })
})
router.post('/new-address', verifyUserLogin, (req, res) => {
  let id = req.session.user._id;
  let address = req.body;
  userHelpers.addAddress(id, address).then(() => {
    res.redirect('/manage-address')
  })
})
router.get('/edit-address/:id', verifyUserLogin, (req, res) => {
  let id = req.params.id;
  userHelpers.getThisAddress(id).then((address) => {
    if (address.address.type == 'primary') {
      let primary = true;
      res.render('user/edit-address', { user: true, primary, address, response: req.session.user.username })
    }
    else if (address.address.type == 'alternative') {
      let alternative = true;
      res.render('user/edit-address', { user: true, alternative, address, response: req.session.user.username })
    }

  })
})
router.post('/edit-address/:id', verifyUserLogin, (req, res) => {
  let userId = req.session.user._id;
  let id = req.params.id;
  let data = req.body;
  userHelpers.updateAddress(id, data, userId).then(() => {
    res.redirect('/manage-address')
  })
})
router.get('/delete-address/:id', verifyUserLogin, (req, res) => {
  let id = req.params.id;
  userHelpers.deleteAddress(id).then(() => {
    res.redirect('/manage-address')
  })
})
router.post('/remove-item/:proid', verifyUserLogin, (req, res) => {
  let proId = req.params.proid;
  let cartId = req.body.cart;
  let quantity = req.body.quantity;
  userHelpers.removeItem(proId, cartId, quantity).then((response) => {
    res.json(response)
  })
})
router.get('/place-order', verifyUserLogin, async (req, res) => {
  let userId = req.session.user._id;
  let primaryAddress = await userHelpers.getThisPrimaryAddress(userId)
  let productsCart = await userHelpers.getProductAmount(req.session.user._id);
  let total = 0;
  total = await userHelpers.getTotalAmount(req.session.user._id);
  let alternativeAddress = await userHelpers.getThisAlternativeAddress(userId)
  if (total > 0) {
    res.render('user/place-order', { total, productsCart, user: true, response: req.session.user.username, primaryAddress, alternativeAddress })
  }
  else {
    res.render('user/place-order', {  productsCart, user: true, response: req.session.user.username, primaryAddress, alternativeAddress })
  }
})
router.post('/place-order', verifyUserLogin, async (req, res) => {

  let userId = req.session.user._id;
  let products = await userHelpers.getCartProductList(userId)

  let totalPrice = await userHelpers.getTotalAmount(userId)

  userHelpers.placeOrder(req.body, products, totalPrice, userId).then((orderObj) => {
    if (req.body.payment == 'cod') {
      userHelpers.changePaymentStatus(orderObj, userId).then(() => {
        res.json({ codSuccess: true, orderId: orderObj })
      })
    }
    else if (req.body.payment == 'paypal') {
      res.json({ paypal: true })
    }
    else if (req.body.payment == 'amazonpay') {
      res.json({ amazonpay: true })
    }
    else if (req.body.payment == 'razorpay') {
      console.log('razorpay clicked');
      userHelpers.generateRazorpay(orderObj, totalPrice).then((data) => {
        res.json({ data: data, orderObj: orderObj })
      })
    }
  })
})
router.get('/order-detail/:id', verifyUserLogin, async (req, res) => {
  let orderId = req.params.id;
  userHelpers.getOrder(orderId).then(async (orderDetail) => {
    let vendorDetail = await userHelpers.getVendor(orderDetail.vendor)
    res.render('user/order-detail', { user: true, response: req.session.user.username, orderDetail, vendorDetail })
  })

})
router.post('/verify-payment', (req, res) => {
  let userId = req.session.user._id;
  let orderId = req.body.orderId
  userHelpers.verifyPayment(req.body,orderId).then(() => {
    let oldOrderId = req.body.oldorderId;
    
    userHelpers.changePaymentStatus(req.body['order[receipt]'], userId).then(() => {
      let orderId = req.body['order[receipt]']
      res.json({ status: true, orderId: orderId })
    })
  }).catch((err) => {
    console.log(err);
    res.json({ status: false, errMsg: '' })
  })
})
router.post('/change-product-quantity', (req, res, next) => {
  let userId = req.session.user._id;
  userHelpers.changeProductQuantity(req.body, userId).then((response) => {
    res.json(response)
  })
})
router.get('/view-orders', verifyUserLogin, (req, res) => {
  let userId = req.session.user._id;
  userHelpers.getOrderProducts(userId).then((products) => {
    res.render('user/view-orders', { products, user: true, response: req.session.user.username })
  })

})
router.get('/view-order-details/:id', verifyUserLogin, (req, res) => {
  let id = req.params.id;
  userHelpers.getOrderDetails(id).then((orderDetails) => {
    res.render('user/view-order-details', { user: true, response: req.session.user.username, orderDetails })
  })
})
router.get('/category/:id', (req, res) => {
  userHelpers.getCategory().then((categories) => {
    if (req.session.user) {
      res.render('user/get-category', { user: true, response: req.session.user.username, categories });
    }
    else {
      res.render('user/get-category', { user: true, categories })
    }

  })

})
module.exports = router;