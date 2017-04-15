// Author: Cattalyya

/*
* Model representing our Chat Room concept. 
* We represent the Chat Room by exactly two users in the conversation
* Any two users will share exactly one Chat Room.
* The model bundles two users, their ratings received from the partner in this chatroom
* and their messages in the room.
*
* Additional constraint:
*   ratingFromRoom on each user must be one of this value 0, 0.5, 1,  ..., 5
*   default value of rating is 3
*
* EXAMPLE Chat Room:
*   { 'users': [User {username: mgebhard, _id: 123}, User {username: emilyG, _id: 221}]
      'messages': [Message {text:"Hola" corrections:[] ...}, Message {"Bonjour"}]
      ratings: [{ userId: 123, ratingFromRoom: 4 }, { userId: 221, ratingFromRoom: 4.5 }]
    }
*/

var mongoose = require('mongoose');
var User = require("./User.js");
var Message = require("./Message.js");

var chatRoomSchema = mongoose.Schema({
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  } ],
  ratings: [{ 
    userId: String, 
    ratingFromRoom: Number
  }]
});


chatRoomSchema.path("users").validate(function(users){
    
    return users.length == 2 && users[0].toString() != users[1].toString();

}, "Chat Room must contain exactly two different users");

chatRoomSchema.path("ratings").validate(function(ratings){
    
    var POSSIBLE_RATINGS = [ 0,0.5,1,1.5,2,2.5,3,3.5,4,4.5,5 ]
    
    if ( ratings.length != 2 || ratings[0].userId.toString() == ratings[1].userId.toString() ) {
        // incorrect number of ratings or rating on same user
        return false;
    } else {
        // check whether both ratings are 0, 0.5, 1,  ..., 5 or not 
        return POSSIBLE_RATINGS.indexOf(ratings[0].ratingFromRoom) != -1 && POSSIBLE_RATINGS.indexOf(ratings[1].ratingFromRoom)!=-1;
    }

}, "Chat Room must contain exactly two different users");

var chatRoomModel = mongoose.model('ChatRoom', chatRoomSchema);

var ChatRooms = (function(chatRoomModel) {

  var that = {};

  /**
   * Updates the arrays in the model based on a query.
   *
   * @param {Object} chatRoomId - The chat room to update.
   * @param {Object} operationQuery - The queries for which fields to update.
   * @param {Object} callback - Returns true if successful or false.
   *                            {'success': true | false}
   */
  var updateChatRoom = function(chatRoomId, operationQuery, callback) {
    var selectionQuery = {
      _id: chatRoomId
    };
    chatRoomModel
      .update(selectionQuery, operationQuery, {runValidators: true})
      .exec(function(err) {
        var success = true;
        if (err) {
          success = false;
        }
        callback({
          'success': success
        });
      });
  };


  /**
   * update user rating for in chatroom
   * @param  {String}   ratedUserId id of user who is rated by the partner (current login user)
   * @param  {Number}   oldRating   old rating receiving from this chatRoom
   * @param  {Number}   newRating   new rating receiving from this chatRoom
   * @param  {Boolean}  isNewRoom   true if the update happens when creating a new chat room. false otherwise
   * @param  {Function} callback    function to call after finishing update rating on this user
   *                                passing argument {'success': false | true}
   */
  var updateUserRating = function(ratedUserId, oldRating, newRating, isNewRoom, callback){

      chatRoomModel.find({users: ratedUserId})
      .exec(function(err, chatRooms) {
          if (err) {
            callback({
              'success': false
            });
          } else {

            var totalRoom = chatRooms.length

            User.updateRating(ratedUserId, oldRating, newRating, totalRoom, isNewRoom, function(response){
                  if(response.success){
                      callback({
                          'success': true
                      });
                  } else {
                      callback({
                          'success': false
                      });
                  }
            });
          }
      })
  }


  /**
   * Creates a chat room for conversation between userId1 and userId2
   * with default rating = 3 on each user
   *
   * @param {Object} userId1 - The user id of one user
   * @param {Object} userId2 - The user id of another user
   * @param {Object} callback - The function that returns the results.
   *                            {'success': true|false
   *                             'message': [newChatRoom]|error}
   */
  that.addChatRoom = function(userId1, userId2, callback) {


      const INTIAL_RATING_FOR_NEW_CHAT = 3
      chatRoomModel.create({
        users: [userId1, userId2],
        ratings: [{userId: userId1, ratingFromRoom: Number(INTIAL_RATING_FOR_NEW_CHAT)}, 
                  {userId: userId2, ratingFromRoom: Number(INTIAL_RATING_FOR_NEW_CHAT)}]
      },
      function(err, newChatRoom) {

        if (err) {
          callback({
            'success': false,
            'message': err.message
          });
        } else {

          updateUserRating(userId1, 0, INTIAL_RATING_FOR_NEW_CHAT, true, function(response){

            if(response.success){
                
              updateUserRating(userId2, 0, INTIAL_RATING_FOR_NEW_CHAT, true, function(response){
                  
                  if(response.success){
                      
                        callback({
                          'success': true,
                          'message': [newChatRoom]
                        });

                  } else {
                      callback({
                        'success': false,
                        'message': err.message
                      });
                  }
              });
            } else {
                callback({
                  'success': false,
                  'message': err.message
                });
            }

            
        });

          
        }
      });
  };

  /**
   * Add a message to the chat.
   *
   * @param {Object} chatRoomId - The ID of the chat room.
   * @param {Object} messageId - The ID of the message to post in the chat.
   * @param {Object} callback - The function that returns success of adding message.
   *                            {'success': true|false}
   */
  that.addMessageToChatRoom = function(chatRoomId, messageId, callback) {
    var addMessageQuery = {
      $addToSet: {
        messages: messageId
      }
    };
    updateChatRoom(chatRoomId, addMessageQuery, callback);
  };



  /**
   * Find data associated with a given chat room.
   *
   * @param {Object} chatRoomId - The ID of the chat room.
   * @param {Object} callback - The function that returns the the chat room or error.
   *                            {'success': true|false
   *                             'message': [chatRoom]|error}
   */
  that.getChatRoom = function(chatRoomId, callback) {
    chatRoomModel
      .findOne({
        _id: chatRoomId
      })
      .populate({
        path: 'users',
        select: 'username rating reports',
      })
      .populate({
        path: 'messages',
        populate: {
          path: 'author',
          select: 'username'
        }
      })
      .populate({
        path: 'messages',
        populate: {
          path: 'corrections',
          populate: {
            path: 'creator',
            select: 'username',
          }
        }
      })
      .exec(function(err, chatRoom) {
          if (err) {
            callback({
              'success': false,
              'message': err.message
            });
          } else {
            callback({
              'success': true,
              'message': [chatRoom]
            });
          }
      });
  };

  /**
   * Find all the chat rooms that this userId is in.
   *
   * @param {Object} userId - The ID of the user you want to find his/her chat room.
   * @param {Object} callback - The function that returns the a list chat rooms
   *                            or error.
   *                            {'success': true|false
   *                             'message': chatRooms (List)|error}
   */
  that.getAllChatRoomsForUser = function(userId, callback) {
    chatRoomModel
      .find({
        users: userId
      })
      .populate({
        path: 'users',
        select: 'username rating reports'
      })
      .populate({
        path: 'messages',
        populate: {
          path: 'author',
          select: 'username',}
      })
      .populate({
        path: 'messages',
        populate: {
          path: 'corrections',
          populate: {
            path: 'creator',
            select: 'username',
          }
        }
      })
      .exec(function(err, chatRooms) {
          if (err) {
            callback({
              'success': false,
              'message': err.message
            });
          } else {
            callback({
              'success': true,
              'message': chatRooms
            });
          }
      });
  };

  /**
   * Find the chat room that exists between two users.
   *
   * @param {String} userId1 - The ID of one user in the chat room.
   * @param {String} userId2 - The ID of the other user in the chat room.
   * @param {Function} callback - A function of form callback(err, chatRoom)
   *                              to be called after finding the room.
   */
  that.findChatRoom = function(userId1, userId2, callback) {

    chatRoomModel.findOne(
      // mongoose recognizes the user list as ordered
      { $or:
        [ {users: [userId1, userId2] },
          {users: [userId2, userId1] } ]
      }, function(err, room) {
        callback(err, room);
    });
  };

  /**
   * Update rating of requestUserId's partner in the specific chat room
   * @param {String} chatRoomId - The ID of chat room.
   * @param {String} ratedUserId - The ID of rated user.
   * @param {[{userId:, rating: }]} oldRatings - array of rating for these two users in the chat room
   *                              {userId: 123, rating: 5} means userId 123 receive 5 as a rating score from the partner in this chatroom
   * @param {[{userId:, rating: }]} newRatings - array of rating for these two users in the chat room
   * @param {Function} callback - A function of form callback(
   *                            {'success': true | false})
   *                              to be called after updating the rating in room.
   */
  that.updateRating = function(chatRoomId, ratedUserId, oldRatings, newRatings, callback) {
      
      var ratingQuery = { $set: { ratings: newRatings } };
      var oldRatingObj = oldRatings.filter(function(ratingObj){
          return ratingObj.userId.toString() == ratedUserId.toString()
      });
      var newRatingObj = newRatings.filter(function(ratingObj){
          return ratingObj.userId.toString() == ratedUserId.toString()
      });

      updateUserRating(ratedUserId, oldRatingObj[0].ratingFromRoom, newRatingObj[0].ratingFromRoom, false,
          function(response){
              if(response.success){
                  updateChatRoom({ _id: chatRoomId}, ratingQuery, callback);
              } else {
                  callback({'success': false});
              }
          }
      );

  };

  Object.freeze(that);
  return that;

})(chatRoomModel);

module.exports = ChatRooms;
