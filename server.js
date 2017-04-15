// Author: Emily

var express = require('express');
var path = require('path');
var logger = require('morgan');
var compression = require('compression');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var dotenv = require('dotenv');
var React = require('react');
var ReactDOM = require('react-dom/server');
var Router = require('react-router');
var Provider = require('react-redux').Provider;
var exphbs = require('express-handlebars');
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var moment = require('moment');
var request = require('request');
var session = require('express-session');
var webpackDevHelper = require('./hotReload.js');

// Load environment variables from .env file
dotenv.load();

// ES6 Transpiler
require('babel-core/register');
require('babel-polyfill');

// Models
var User = require('./models/User');

// Controllers
var userController = require('./controllers/user');
var chatController = require('./controllers/chat');
var chatRoomController = require('./controllers/chatRoom');

// React and Server-Side Rendering
var routes = require('./app/routes');
var configureStore = require('./app/store/configureStore').default;

var app = express();
var http = require('http').Server(app); // must pass an http.Server instance into socket.io
var io = require('socket.io')(http);

// Set up webpack-hot-middleware for development, express-static for production
if (process.env.NODE_ENV !== 'production'){
  console.log("DEVELOPMENT: Turning on WebPack middleware...");
  app = webpackDevHelper.useWebpackMiddleware(app);
  app.use('/css', express.static(path.join(__dirname, 'public/css')));
  app.use('/html', express.static(path.join(__dirname, 'public/html')));
  app.use('/images', express.static(path.join(__dirname, 'public/images')));
  app.use('/fonts', express.static(path.join(__dirname, 'public/fonts')));
} else {
  console.log("PRODUCTION: Serving static files from /public...");
  app.use(express.static(path.join(__dirname, 'public')));
}

// Mongoose setup
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/lingua');
mongoose.connection.on('error', function() {
  console.log('MongoDB Connection Error. Please make sure that MongoDB is running.');
  process.exit(1);
});

// handlebars setup
var hbs = exphbs.create({
  defaultLayout: 'main',
  helpers: {
    ifeq: function(a, b, options) {
      if (a === b) {
        return options.fn(this);
      }
      return options.inverse(this);
    },
    toJSON : function(object) {
      return JSON.stringify(object);
    }
  }
});

app.engine('handlebars', hbs.engine);
app.use(compression());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator({
  customValidators: {
    /**
     * isValidLanguage: checks if the user's native language is a supported language on the system
     * @param {String} input a string with the name of a language
     * This is used in user.js
     * NOTE: when more langauges are added to the system, we must edit this list
     */
    isValidLanguage: function (input) {
      var langs = ["French", "English"];
      return langs.indexOf(input) > -1;
    }
  }
}));
app.use(cookieParser());
app.use(session({ secret : '6170', resave : true, saveUninitialized : true }));

app.set('view engine', 'handlebars');
app.set('port', process.env.PORT || 3000);

app.use(function(req, res, next) {

  /**
   * isAuthenticated: return true if there is currently an authenticated user using
   *  tokens on the system
   */
  req.isAuthenticated = function() {
    var token = (req.headers.authorization && req.headers.authorization.split(' ')[1]) || req.cookies.token;
    try {
      return jwt.verify(token, process.env.TOKEN_SECRET);
    } catch (err) {
      return false;
    }
  };

  // determine the id and information about the user if there is currently an authenticated user
  if (req.isAuthenticated()) {
    var payload = req.isAuthenticated();
    User.findById(payload.sub, function(err, user) {
      if (err || user == null) return false;
      req.session.userId = user._id;
      req.session.user = user;
      next();
    });
  } else {
    next();
  }

});

app.get('/', chatRoomController.indexRedirect);

// RESTful account routes
app.put('/users/:userId', userController.ensureAuthenticated, userController.ensureMatch, userController.accountPut);
app.delete('/users/:userId', userController.ensureAuthenticated, userController.ensureMatch, userController.accountDelete);
app.get('/users/:userId', userController.ensureAuthenticated, userController.ensureMatch);
app.get('/users/:userId/chats', userController.ensureAuthenticated, userController.ensureMatch, chatRoomController.getAllJoinedChatRooms);
app.get('/users/:userId/points', userController.ensureAuthenticated, userController.ensureMatch, userController.getPoints);
app.post('/users/:userId/report', userController.ensureAuthenticated, userController.postReport);
app.get('/users', userController.ensureAuthenticated, userController.getAllUsers);

// account routes
app.post('/signup', userController.signupPost);
app.post('/login', userController.loginPost);
app.post('/forgot', userController.forgotPost);
app.post('/reset/:token', userController.resetPost);
app.get('/logout', userController.clearSession);

// Chat router
app.post('/chat/message', userController.ensureAuthenticated, chatController.createMessage);

// ChatRoom router
app.post('/info/chatRoom', userController.ensureAuthenticated, chatRoomController.createChatRoom);
app.post('/chat/:chatRoomId/rate', userController.ensureAuthenticated, chatRoomController.updateRating);
app.get('/info/chat/:chatRoomId', userController.ensureAuthenticated, chatRoomController.getChatRoom);
app.get('/info/', userController.ensureAuthenticated, chatRoomController.getChatRoom);

// Corrections Router
app.post('/message/:messageId/correction', userController.ensureAuthenticated, chatController.createCorrection);

// React server rendering
// this information is used in mapStateToProps method of every React component
app.use(function(req, res) {
  var initialState = {
    auth: { token: req.cookies.token, user: req.session.user },
    messages: {}
  };

  var store = configureStore(initialState);

  Router.match({ routes: routes.default(store), location: req.url }, function(err, redirectLocation, renderProps) {
    if (err) {
      res.status(500).send(err.message);
    } else if (redirectLocation) {
      res.status(302).redirect(redirectLocation.pathname + redirectLocation.search);
    } else if (renderProps) {
      var html = ReactDOM.renderToString(React.createElement(Provider, { store: store },
        React.createElement(Router.RouterContext, renderProps)
      ));
      res.render('layouts/main', {
        html: html,
        initialState: store.getState()
      });
    } else {
      res.sendStatus(404);
    }
  });
});

// Production error handler
if (app.get('env') === 'production') {
  app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.sendStatus(err.status || 500);
  });
}

//create a connection with socket.io
io.on('connection', function(socket){
  console.log('a user connected to socket.io');

  socket.on('subscribe', function(roomId) { // subscribe to a channel corresponding to roomId
    console.log('socket.io subscribing to channel ' + roomId);
    socket.join(roomId);
  });

  socket.on('chat message', function(roomId){ // a new message was posted in chatRoom roomId
    console.log('socket.io server responding to message: ' + roomId);
    io.to(roomId).emit('chat message', roomId);
  });

  socket.on('correction', function(roomId) { // a new correction was posted in chatRoom roomId
    console.log('socket.io server responding to correction: ' + roomId);
    io.to(roomId).emit('correction', roomId);
  });

  socket.on('disconnect', function(){
    console.log('user disconnected from socket.io');
  });

})

http.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});

module.exports = app;
