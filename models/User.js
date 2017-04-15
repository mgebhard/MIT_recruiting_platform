// Author: Laura
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var mongoose = require('mongoose');

var schemaOptions = {
  timestamps: true,
  toJSON: {
    virtuals: true
  }
};

var userSchema = new mongoose.Schema({
  username: String, // not enforced as unique, many people can share names
  email: { type: String, unique: true},
  password: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  nativeLanguages: [String],
  learningLanguages: [String],
  about: String,
  rating: { type: Number, default: 0}, // Float value. 0<=rating<=5
  reports: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  points: {type: Number, default: 50} // assuming -10pts to open chat, +1pt for a correction,
}, schemaOptions);

/* Before writing an updated document into the database,
 * check to see if the password has changed.
 * If it has, replace the plaintext value with a hash before proceeding.
 */
userSchema.pre('save', function(next) {
  var user = this;
  if (!user.isModified('password')) { return next(); }
  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(user.password, salt, null, function(err, hash) {
      user.password = hash;
      next();
    });
  });
});

/*
 * Adds a method to each document allowing for password comparison
 * usage: if user is a document in the collection:
 *  user.comparePassword(testPassword, function(err, match) { // proceed if match })
 */
userSchema.methods.comparePassword = function(password, callback) {
  bcrypt.compare(password, this.password, function(err, isMatch) {
    callback(err, isMatch);
  });
};

userSchema.options.toJSON = {
  transform: function(doc, ret, options) {
    delete ret.password;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpires;
  }
};

userSchema.path("rating").validate(function(rating){

    return rating>=0 && rating<=5;

}, "Rating must satisfy 0<=rating<=5 ");


var userModel = mongoose.model('User', userSchema);

var User = (function(userModel) {

  var that = {};

  /**
   * Number of points over which a user should be banned from logging in.
   */
  that.reportsThresholdForBan = 3;

  /**
   * Creates a new user.
   * @param {Object} json - form
   *    {
   *      username: String,
   *      email: String,
   *      nativeLanguages: [String],
   *      learningLanguages: [String],
   *      password: String
   *    }
   * @param {Function} callback - a function of form callback(err, newUser)
   */
  that.create = function(json, callback) {
    var user = new userModel(json);
    user.save(function(err) {
      callback(err, user);
    });
  };

  /**
   * Validates that a user has enough points to enter a chat room.
   * @param {String} userId - The mongo id associated with the active user.
   * @param {Function} callback - Function of form callback(err, result)
   *                 Result is true if successful or false if not enough points.
   */
  that.enterChatRoom = function(userId, callback) {

    userModel.findById(userId, function(err, user) {
      if (err) {
        callback(err, null);
      } else {
        if (user.points >= 10) {
          user.points = user.points - 10;
          user.save(function(err) {
            if (err) {
              callback(err, null);
            } else {
              callback(null, true);
            }
          });
        } else {
          callback(null, false);
        }
      }
    });
  };

  /**
   * Reports a user.
   * @param {String} userId = the mongo id of the user being reported
   * @param {Function} callback - Function of form callback(err, success)
   */
  that.report = function(userId, reporterId, callback) {

    userModel.findById(userId, function(err, user) {
      if (err) {
        callback(err, false);
      } else {
        if (user.reports.indexOf(reporterId) == -1) {
          // if new user reporting, add to array
          user.reports.push(reporterId);
        }
        user.save(function(err) {
          if (err) {
            callback(err, false);
          } else {
            callback(null, true);
          }
        });
      }
    });
  };

  /**
   * Gives a user 1 point for making a correction
   * @param {String} userId = the mongo id of the user who posted the correction
   * @param {Function} callback - Function of form callback(err, success, points)
   */
  that.addPointsForCorrection = function(userId, callback) {

    userModel.findById(userId, function(err, user) {
     if (user) {
        user.points = user.points + 1;
        user.save(function(err) {
          if (err) {
            callback(err, false, user.points);
          } else {
            callback(null, true, user.points);
          }
        });
      } else {
        callback(err, false);
      }
    });
  };

  /**
   * Gets all users that could be pen pals of this user.
   * Banned users cannot be pen pals.
   * Currently: all other users.
   * @param {String} userId - The mongo id associated with the active user.
   * @param {Function} callback - A function of form callback(err, users)
   */
  that.getPotentialPenPals = function(userId, callback) {

    // return only useful public information in the query
    var userProjection  = {
      password: false,
      passwordResetToken: false,
      passwordResetExpires: false,
      points: false,
      reports: false,
    };

    // Reports.2 = false says return no Users with reports.length > 2.
    userModel.find({_id: {$ne: userId }, 'reports.2': {$exists: false}},
      userProjection,
      callback);
  };
  /**
   * Validates that a password reset token is valid and unexpired
   * If so, returns the associated user
   * @param {String} token - the password reset token provided to the user
   * @param {Function} callback - a function of the form callback(error, user)
   */
  that.validatePasswordReset = function(token, callback) {

    userModel.findOne({ passwordResetToken: req.params.token })
      .where('passwordResetExpires').gt(Date.now())
      .exec(callback);
  };

  /**
   * Finds a user with the given email
   * @param {String} email
   * @param {Function} callback - a function of  the form callback(error, user)
   */
  that.findByEmail = function(email, callback) {

    userModel.findOne({ 'email': email }, callback);
  };

  /**
   * Copy of findById
   */
  that.findById = function(userid, callback) {
    userModel.findById(userid, callback);
  };

  /**
   * Copy of remove function to delete documents
   */
  that.removeById = function(id, callback) {
    userModel.remove({_id: id}, callback);
  };

  /**
   * Get the number of points a user has
   */
  that.getPoints = function(id, callback) {
    userModel.findOne({_id: id}, {points: 1}, callback);
  };

  /**
   * Rating is calculated by
   * rating = (scoreRoom1+ scoreRoom2+...+ scoreRoomK)/K
   *   for all and only K the user participate in
   * @param  {ObjectId}   userId    userId to update rating
   * @param  {Number}     oldRating user get from a specific chatRoom
   *                                0 <= oldRating <= 5
   * @param  {Number}     newRating user get from a specific chatRoom
   *                                0 <= newRating <= 5
   * @param  {Number}     totalRoom total number of room this userId joined
   * @param  {boolean}    forNewRoom true if this update occur for initializing the new room
   *                                 false otherwise
   * @param  {Function}   callback  callback function after updateRating pass {
                          'success': false | true
                          } as argument
   */
    that.updateRating = function(userId, oldRating, newRating, totalRoom, forNewRoom, callback){

      userModel.findOne({_id: userId})
      .exec(function(err, user) {
        if (err) {
          callback({
            'success': false
          });
        } else {

            const averageRating = user.rating;
            // set to 0 when never participate in any chat.
            const DEFAULT_RATING_OF_USER = 0;

            var updatedAvgRating = DEFAULT_RATING_OF_USER;

            if(totalRoom != 0){
                if(!forNewRoom){
                    updatedAvgRating = (averageRating*totalRoom - oldRating + newRating) / totalRoom;
                } else {
                    // update user rating when entering new chat room
                    // receiving newRating score by default (3)
                    updatedAvgRating = (averageRating*(totalRoom-1) + newRating) / totalRoom;
                }
            }

            userModel.update({_id: userId}, {$set: { rating: updatedAvgRating }})
            .exec(function(err) {
                  if (err) {
                    callback({
                      'success': false
                    });
                  } else {
                    callback({
                      'success': true
                    });
                  }
            });
        }
      });
  };

  Object.freeze(that);

  return that;

}(userModel));

module.exports = User;
