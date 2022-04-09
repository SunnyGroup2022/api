const config = require('../config');
const db = config.db;
const knex = require('knex');

/**
 * @param {string} token - Token from Request.header
 * @param {object} session - ctx.session
 */
module.exports = async function(token, session) {
  try {
    if (session.isNew && token.id) {
      /**
       * Session is new.
       *  - User has already login, but session was new
       *  - should insert data to Table.user_logging.
       */

      // Get today();
      const now = new Date();
      const year = new Date(now).getFullYear();
      const month = new Date(now).getMonth()+1;
      const day = new Date(now).getDate();
      const date = new Date(`${year}-${month}-${day}`);

      // Insert new session record.
      await db.transaction(async (trx) => {
        await db('user').where({id: token.id}).update({last_online: now}).transacting(trx);
        await db.raw(`INSERT INTO user_logging(user_id, date, count) VALUES(${token.id}, '${date.toISOString()}', ${1}) 
                      ON CONFLICT (user_id, date) DO UPDATE SET count=user_logging.count+1`).transacting(trx);
      });

      session.userId = token.id;
    }
    return;
  } catch (err) {
    console.error('======= MIDDLEWARE-SESSION ======', e.message);
    throw new Error('Session invalid');
  }
};
