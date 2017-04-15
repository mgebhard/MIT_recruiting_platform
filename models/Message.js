// Author: Megan

/*
 * Model representing our Message concept. This is a message sent by a user in a chat.
 *
 * EXAMPLE Message:
 *   { 'author': User {username: mgebhard}
 *     'text': "Holla, me llamo Megan!"
 *     'corrections': [Correction {}, Correction {}]
 *     'date': 'A Date() object representing when the message was posted.
 *    }
 */
var mongoose = require('mongoose');

var messageSchema = mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  text: String,
  corrections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Correction'
  }, ],
  date: {
    type: Date,
    default: Date.now
  },
});

messageSchema.path("text").validate(function (value) {
    return value.length > 0;
}, "User can not send an empty message");

var messageModel = mongoose.model('Message', messageSchema);

var Messages = (function(messageModel) {

  var that = {};

  /**
   * Adds a given message.
   *
   * @param {Object} userId - The user mongo id associated with the author.
   * @param {Object} messageText - The text the author wrote.
   * @param {Object} callback - The function that returns the results.
   *                            {'success': true|false
   *                             'message': [newMessage]|error}
   */
  that.addMessage = function(userId, messageText, callback) {
    messageModel.create({
        author: userId,
        text: messageText,
      },
      function(err, newMessage) {
        if (err) {
          console.log(err);
          callback({
            'success': false,
            'message': err.message
          });
        } else {
          callback({
            'success': true,
            'message': [newMessage]
          });
        }
      });
  };


  /**
   * Find all corrections that were made for a user.
   * This is returns a list of all thier mistakes
   *
   * @param {Object} userId - The user id to find corrections for.
   * @param {Object} callback - The function that returns the a list of corrections
   *                            sorted by date created.
   *                            {'success': true|false
   *                             'message': correctionsForUser|error}
   */
  that.getCorrectionsWrittenForUser = function(userId, callback) {
    messageModel
      .find({author: userId})
      .select('corrections')
      .populate('corrections')
      .sort({date: -1})
      .exec(function(err, correctionsForUser) {
        if (err) {
          callback({
            'success': false,
            'message': err.message
          });
        } else {
          callback({
            'success': true,
            'message': correctionsForUser
          });
        }
      });
  };

  /**
   * Add the correction just created to the message corrections field.
   *
   * @param {Object} messageId - The message id the correction was made for.
   * @param {Object} newCorrection - The correction object that was created.
   * @param {Object} callback - The function that returns in the form of 
   *                            Callback(err, newCorrection)
   */
  that.addCorrectionToMessage = function(messageId, newCorrection, callback) {
    messageModel
      .update({
        _id: messageId
      }, {
        $addToSet: {
          corrections: newCorrection._id
        }
      }).exec(function (err) {
        callback(err, newCorrection);
      });
  };

  Object.freeze(that);
  return that;

})(messageModel);

module.exports = Messages;