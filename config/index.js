const ENV = process.env.NODE_ENV || 'development';
const knex = require('knex');

const env = {
  development: require('./development'),
  staging: require('./staging'),
  production: require('./production')};

module.exports = {
  db: knex(env[ENV].dbConfig),
  bcryptSalt: 10,
  jwtSecret: 'Ohu4!YSd9n+2',
  jwtExpireTime: 60*60*1000,
  APPKEYS: ['DSJFI($I>ZOA'],
  SESSCONF: {
    key: 'koa.sess',
    maxAge: 30000,
    autoCommit: true, /** (boolean) automatically commit headers (default true) */
    overwrite: true, /** (boolean) can overwrite or not (default true) */
    httpOnly: true, /** (boolean) httpOnly or not (default true) */
    signed: true, /** (boolean) signed or not (default true) */
    rolling: false, /** (boolean) Force a session identifier cookie to be set on every response. (default is false) */
    renew: true, /** (boolean) renew session when session is nearly expired, so we can always keep user logged in. (default is false)*/
    secure: false, /** (boolean) secure cookie*/
    sameSite: null, /** (string) session cookie sameSite options (default null, don't set it) */
  },
  CORSCONF: {
    origin: '*',
    credentials: true,
  },
  webUrl: 'https://master.d2w5ix9s0dasc.amplifyapp.com',
};
