// Author: Cattalyya

// Utils function for Router


/**
 * check whether all properties exist 
 * 
 * @param  {[Object]}  props All props that must be exist
 * @return {Boolean} true if all props are not null
 *                   false otherwise
 */
exports.allPropsExist = function(props){
    return props.reduce(function(isValid, val){
        if(val){
            return isValid 
        }
        return false
    }, true)
}

/**
 * Send success response
 * @param  {Object} res     response
 * @param  {Object} content content to send back
 * 
 */
exports.sendSuccessResponse = function(res, content) {
    res.status(200).json({
        success: true,
        content: content
    }).end();
};
