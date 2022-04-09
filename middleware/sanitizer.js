const Ajv = require('ajv');
const ajv = new Ajv({removeAdditional: true, allErrors: true, nullable: true});
const schemaList = require('../schema/index.js');

/**
 * @param {string} plugin - Folder Name (Ex:user)
 * @param {string} name - Action Name (Ex: find/update...)
 * @param {object} body - Output Data
 */
module.exports = async function(plugin, name, body) {
  try {
    const pluginSchema = (schemaList[plugin] || {} )[name];

    // 例：沒有 user/login 資料夾，則代表 user/login 不需檢查output的data，可以直接返回 body
    if (!pluginSchema) {
      return body;
    }

    const schema = pluginSchema;

    // 例：有 user/login 資料夾，但沒有該 identity 所屬的資料夾，代表無權限返回資料，所以 return 空物件
    if (!(schema && schema['output'])) {
      return;
    }

    // schema compile
    const validate = ajv.compile(schema['output']);

    // schema validation
    if (!validate(body)) {
      // Generate error mesage
      const description = validate.errors.map((e) => '[' + e.keyword.toUpperCase() + '] ' + (e.dataPath ? '(' + e.dataPath.slice(1) + ') ' : '') + e.message);
      throw new Error(JSON.stringify(description));
    }

    return body;
  } catch (e) {
    console.error('======= MIDDLEWARE-SANITIZER ======', e.message);
    throw new Error(JSON.stringify({status: 403, body: {code: 'Output data incorrect', message: JSON.parse(e.message)}}));
  };
};
