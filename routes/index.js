const Router = require('koa-router');
const plugins = require('../plugins');
const routes = require('../config/routes');
const validator = require('../middleware/validator');
const sanitizer = require('../middleware/sanitizer');
const jwtAuth = require('../middleware/jwt');

const router = new Router({
  prefix: '/v1/',
});

for (let i=0; i<Object.keys(routes).length; i++) {
  const key = Object.keys(routes)[i];
  for (let y=0; y<Object.keys(routes[key]).length; y++) {
    const fnName = Object.keys(routes[key])[y];
    const fn = plugins[key][fnName];
    const routeData = routes[key][fnName];
    if (fn) {
      router[routeData.method](key + routeData.path, async (ctx, next) => {
        try {
          // Check if token is required
          if (routeData.auth) {
            await jwtAuth(ctx);
          }

          // Check if the Input Data is valid
          ctx.request.body = await validator(key, fnName, ctx.request.body);

          // Business Logic Function
          const data = await fn(ctx.token, ctx.request.body, ctx.query, ctx.params, ctx);
          if (!data) {
            throw new Error(JSON.stringify({body: 'OUTPUT_DATA_ERROR'}));
          }

          // Check if the Output Data is valid
          ctx.status = data.status || 200;
          ctx.body = await sanitizer(key, fnName, data.body);
        } catch (e) {
          const errorMsg = JSON.parse(e.message);
          console.error('========= Error message =========', errorMsg);
          ctx.status = errorMsg.status || 400;
          ctx.body = errorMsg.body;
        }
      });
    }
  }
}

module.exports = router.routes();
