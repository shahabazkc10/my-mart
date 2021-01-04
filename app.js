var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var hbs = require('express-handlebars');
var fileUpload = require('express-fileupload');
var usersRouter = require('./routes/user');
var adminRouter = require('./routes/admin');
var vendorRouter = require('./routes/vendor');

var session = require('express-session');
var db = require('./config/connection')
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs', hbs({ extname: 'hbs', defaultlayout: 'layout', layoutsDir: __dirname + '/views/layout/', partialsDir: __dirname + '/views/partials/' }));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(fileUpload())

app.use(session({secret:"key",cookie:{maxAge:6000000}}))
app.use(express.static(path.join(__dirname, 'public')));
db.connect((err,data) => {
  console.log(data);
  if (err) {
    console.log(err);
  }
  else {
    console.log("Database connected successfully");
  }

})
app.use('/', usersRouter);
app.use('/admin', adminRouter);
app.use('/vendor', vendorRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
module.exports = app;
