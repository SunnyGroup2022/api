const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const routes = require('./routes/index');
const logger = require('koa-logger');
const cors = require('@koa/cors');
const app = new Koa();
const session = require('koa-session');
const config = require('./config');

app.keys = config.APPKEYS;

app.use(logger());
app.use(cors(config.CORSCONF));
app.use(session(config.SESSCONF, app));
app.use(bodyParser());
app.use(routes);
app.listen(3838);
