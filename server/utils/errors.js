/**
 * Error formatting and helper responses
 */

function sendSuccess(res, data, status = 200) {
  return res.status(status).json({ data });
}

function sendError(res, message, status = 400) {
  return res.status(status).json({
    error: {
      message: message || 'An error occurred on the server.'
    }
  });
}

module.exports = {
  sendSuccess,
  sendError
};
