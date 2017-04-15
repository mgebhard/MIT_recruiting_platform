// Author: Megan

/*
 * Model representing our Correction concept. We represent the Corrections as an object
 * where the key: value pairs are key = _id of the correction and value =
 * the object representing the correction.
 *
 * EXAMPLE Correction:
 *   { 'creator': User {username: mgebhard}
 *     'originalMessage': Message {text: "I love canines" author: User {username: emilyG}}
 *     'errorPhrase': "canines"
 *     'correctPhrase': "dogs"
 *     'comments': 'Athough canines means dogs no one says that in America! (:'
 *     'date': 'A Date() object representing when the correction was posted.' }
 *
 * date is always a Date() parsable object (printable as a string)
 */
var mongoose = require('mongoose');
var User = require("./User.js");
var Message = require("./Message.js");

var correctionSchema = mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  errorPhrase: String,
  correctPhrase: String,
  comments: String,
  date: {
    type: Date,
    default: Date.now
  },
});

correctionSchema.path("errorPhrase").validate(function (value) {
    return value.length > 0;
}, "User can not post a correction on no text.");

correctionSchema.path("correctPhrase").validate(function (value) {
    return value.length > 0;
}, "User can not post an empty correction");

var correctionModel = mongoose.model('Correction', correctionSchema);

var Corrections = (function(correctionModel) {

  var that = {};

  /**
   * Adds a given correction to the mongodb.
   * @param {Object} userId - The id of the user who created the correction.
   * @param {Object} messageId - The id of the message to attach the correction.
   * @param {Object} errorPhrase - The incorrect text in the message.
   * @param {Object} correctPhrase - The text to change the error to.
   * @param {Object} comments - Any additional feedback that was posted.
   * @param {Object} callback - The function that returns the results. 
   *                            Returns true if successful or false with error message.
   */
  that.addCorrection = function(userId, messageId, errorPhrase, correctPhrase, comments, callback) {
    var respToAddingCorrectionToMessage = function(err, correction) {
      if (err) {
          console.log("Error saving the correction to a message: " + err);
          callback(formatJson(false, err));
        } else {
          correctionModel.populate(
            correction,
            {path:"creator",
             select:"username"},
            function(err, finalCorrection) {
              if (err) {
                callback(formatJson(false, err));
              } else {
                callback(formatJson(true, finalCorrection));
              }
            });
      }
    };

    correctionModel.create({
        creator: userId,
        errorPhrase: errorPhrase,
        correctPhrase: correctPhrase,
        comments: comments
    }, function(err, newCorrection) {
        if (newCorrection) {
          // We then must add the correction ID to the Message Schema field.
          Message.addCorrectionToMessage(
            messageId, newCorrection, respToAddingCorrectionToMessage);
        } else {
          callback(formatJson(false, err));
        }
     });
  };

  /**
   * Formats the response to the callback to be
   * {success: True|False
   *  message: correction posted}
   */
  var formatJson = function (success, message) {
    return {
      'success': success,
      'message': message
    };
  };

  Object.freeze(that);
  return that;

})(correctionModel);

module.exports = Corrections;