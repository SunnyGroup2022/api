const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const routes = require('./routes/index');
const logger = require('koa-logger');
const cors = require('@koa/cors');
const app = new Koa();
const session = require('koa-session');
const config = require('./config');
const Router = require('koa-router');
const router = new Router();
const pjson = require('./package.json');
const swagger = require('swagger2');
const {ui} = require('swagger2-koa');
const swaggerDocument = swagger.loadDocumentSync('./schema/api.yaml');

app.keys = config.APPKEYS;

router.get('/', (ctx, next) => {
  ctx.body = `version: ${pjson.version}`;
});

app.use(logger());
app.use(ui(swaggerDocument, '/swagger'));
app.use(cors(config.CORSCONF));
app.use(session(config.SESSCONF, app));
app.use(bodyParser());
app.use(router.routes());
app.use(routes);
app.listen(3838);
