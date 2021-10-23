var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var db=require('./config/connection')
var hbs =require('express-handlebars')
var session = require('express-session')



var adminRouter = require('./routes/admin');
var usersRouter = require('./routes/users');

var app = express();
var fileUpload=require('express-fileupload')
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// hbs.registerHelper('ifEquals', function(arg1, arg2, options) {
//   return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
// });

// hbs.registerHelper('if_eq', function(a, b, opts) {
//   if(a == b)
//       return opts.fn(this);
//   else
//       return opts.inverse(this);
// });
// hbs.registerHelper("inc", function(value, options)
// {
//     return parseInt(value) + 1;
// });

// hbs.registerHelper('if_eq', function(a, b, opts) {
//   if(a == b)
//       return opts.fn(this);
//   else
//       return opts.inverse(this);
// });

app.engine('hbs',hbs({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layout',partialsDir:__dirname+'/views/partials',helpers:{
  check:('if_eq', function(a, b, opts) {
    if(a == b)
        return opts.fn(this);
    else
        return opts.inverse(this);
})
}}))


//app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//SESSION
app.use(function(req, res, next) {
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  next();
});


app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie:{maxAge:6000000} 
}))

db.connect((err)=>{
  if(err)
  {
       console.log("Datbase  connection erreor"+err);
  }
else
  {
  console.log("databse connect succefully");
}
})
app.use(fileUpload())
app.use('/', usersRouter);
app.use('/admin', adminRouter);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
