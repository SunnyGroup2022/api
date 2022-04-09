const jwt = require('jsonwebtoken');
const config = require('../config');
const session = require('./session');

/**
 * @param {object} ctx - request.ctx
 */
module.exports = async function(ctx) {
  try {
    // Get token from request header
    const token = ctx.cookies.get('x-aha-authorization-token') || ctx.request.header.token;

    if (!token) {
      throw new Error('PERMISSION_DENIED');
    }

    // Verify token
    ctx.token = jwt.verify(token, config.jwtSecret);

    // Set session infomation
    await session(ctx.token, ctx.session);
  } catch (e) {
    console.error('======= MIDDLEWARE-JWT ======', e.message);
    ctx.session = null;
    throw new Error(JSON.stringify({status: 401, body: {code: 'Token invalid'}}));
  }
};
