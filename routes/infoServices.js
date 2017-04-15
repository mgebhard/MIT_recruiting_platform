// Author: Cattalyya

const BASE_URL = 'http://localhost:3000/';

  var request = require('request-promise-native');

  export default {
    /**
     * GET request to request /info/allUsers
     * get all users from database
     * @return {[Object]} [request object]
     */
    getAllUsers : (userId) => {
      // setup userId param for future refactoring of this route
      return request({
        uri : BASE_URL+'users',
        method: 'GET',
        json : true
      });
    },

    /**
     * GET request to request /info/chat/:chatRoomId
     * get Chat Room info
     * @return {[Object]} [request object]
     */
    getChatRoom: (chatRoomId) => {
      return request({
        uri : BASE_URL+"info/chat/"+chatRoomId,
        method: 'GET',
        json : true
      });
    },

    /**
     * POST request to report a user: /users/:userId/report
     * @param activeUserId The user doing the reporting
     * @param reportedUserId The user being reported
     * @return {[Object]} [request object]
     */
    reportUser: (activeUserId, reportedUserId, token) => {
      console.log("reached infoService");
      return request({
        uri: BASE_URL+"users/"+reportedUserId+"/report",
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: {
          reporterId: activeUserId
        },
        json: true
      });
    },

    /**
     * Attempt to either create or load a chat between current user
     * and potential pen pal. Chat can not be created if current user
     * does not have enough points.
     *
     * @param {MongoDB ID} potentialPenPalId - ID to the record of the user you
     *                                         want to chat with.
     * @return {[Object]} [request object]
     */
    onAttemptToEnterChat: (potentialPenPalId) => {
      return request({
        uri : BASE_URL + "info/chatRoom/",
        method: 'POST',
        body: {
          potentialPenPalId: potentialPenPalId,
        },
        json : true
      });
    },

    /**
     * GET request to /users/:userId/chats
     * get All Chat Rooms that this current login user join
     * @return {[Object]} [request object]
     */
    getAllChatRooms: (userId, token) => {
      return request({
        uri: BASE_URL+"users/"+userId+"/chats",
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        json: true
      });
    },

    /**
     * GET request to request /users/:userId/points
     * get the number of points for the user who is currently logged in
     * userId must exist in req.session.userId
     * @return {[Object]} [request object]
     */
    getPoints: (userId) => {
      return request({
        uri: BASE_URL+'users/'+userId+'/points',
        method: 'GET',
        json: true
      })
    }
  };
