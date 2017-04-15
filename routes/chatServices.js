// Author: Megan

const BASE_URL = 'http://localhost:3000';

  var request = require('request-promise-native');

  export default {

    /**
     * POST request to request /message/${messageId}/correction/
     * submit correction on a message
     * body must contain errorPhrase, correctPhrase, and comments
     * @return {[Object]} [request object]
     */
    createCorrection : (messageId, errorPhrase, correctPhrase, comments) => {
      // Need to get user ID from session on backend.
      return request({
        uri : BASE_URL + `/message/${messageId}/correction`,
        method: 'POST',
        body: {
          errorPhrase: errorPhrase,
          correctPhrase: correctPhrase,
          comments: comments,
        },
        json : true
      });
    },

    /**
     * POST request to request /chat/message
     * submit a new chat message
     * body must contain id of chatroom and the message text
     * @return {Object} request object
     */
    createMessage: (chatRoomId, message) => {
      // Get user ID from session
      return request({
        uri : BASE_URL + "/chat/message",
        method: 'POST',
        body: {
          chatRoomId: chatRoomId,
          message: message,
        },
        json: true
      });
    },

    /**
     * POST request to request /chat/:chatRoomId/rate
     * submit change in rating
     * body must contain rating
     * @return {[Object]} [request object]
     */
    changeRating : (chatRoomId, rating) => {
      return request({
        uri : BASE_URL+`/chat/${chatRoomId}/rate`,
        method: 'POST',
        body: {
          rating: rating
        },
        json : true
      });

    }

}
