const config = require('../config');
const db = config.db;
const bcrypt = require('bcrypt');
const tools = require('../tools');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(config.SENDGRID_API_KEY);

/**
 * @param {string} token - Token from Request.header
 * @param {object} body - Request.body
 * @param {object} query - Request.query
 * @param {object} params - Request.params
 * @param {object} ctx - ctx
 * @return {object}
 */
async function login(token, body, query, params, ctx) {
  try {
    // Get user profile
    let user = await db('user').where({
      email: body.email,
    });

    // Check if user exists
    if (user.length>1) {
      throw new Error('Could not find the correct user');
    }
    if (user.length<1) {
      throw new Error('User does not exists');
    }

    user = user[0];

    // Check if password is correct（use Bcrypt）
    const compareResult = await bcrypt.compare(body.password, user.password);

    if (!compareResult) {
      throw new Error('Login mismatch');
    }

    // User Login Process
    const tokenObj = await userLogin(ctx, user);

    return {
      body: {
        status: 1,
        token: tokenObj.token,
        expireTime: new Date(tokenObj.expireTime),
        userId: user.id,
        name: user.name,
      },
    };
  } catch (e) {
    console.error('===== user.login =====', e);
    throw new Error(JSON.stringify({body: {status: 400, message: e.message}}));
  };
}

/**
 * @param {string} token - Token from Request.header
 * @param {object} body - Request.body
 * @param {object} query - Request.query
 * @param {object} params - Request.params
 * @param {object} ctx - ctx
 * @return {object}
 */
async function auth0login(token, body, query, params, ctx) {
  try {
    // Variable Declaration
    let user;
    let userConnection;
    let userInfo;
    let connectionId;

    /*
     *   Get User Infomation From Auth0 Server
     *   Auth0 Server: https://dev-o-49rumg.us.auth0.com
     */
    userInfo = await axios.get('https://dev-o-49rumg.us.auth0.com/userInfo', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${body.accessToken}`,
      }});

    userInfo = userInfo.data;

    if (!(userInfo && userInfo.sub)) {
      throw new Error('Auth0 login failed');
    }

    /*
     * Check Provider
     * Provider[Facebook]: connectionId = 2
     * Provider[Google-Oauth2]: connectionId = 3
     * Provider[Other]: Not allowed
     */

    const provider = userInfo.sub.split('|')[0];
    const auth0UserId = userInfo.sub.split('|')[1];

    switch (provider) {
      case 'facebook':
        connectionId = 2;
        break;
      case 'google-oauth2':
        connectionId = 3;
        break;
      default:
        throw new Error('Auth0 login failed');
    }

    /*
     * User Login/Create/Update
     *
     * Auth0 登入成功之後有三種情況：
     *   TYPE 1: 新的會員，新的登入方式
     *           完全未註冊過的會員。
     *           -> 需要新增 user, user_connection
     *   TYPE 2: 舊會員，新的登入方式
     *           已有會員（Email相同），但沒有Auth0登入的紀錄（有傳統電子郵件與密碼的登入記錄）
     *           -> 需要新增 user_connection
     *   TYPE 3: 舊會員，已有登入方式
     *           已有會員資料，也有Auth0登入記錄，純登入即可
     *           -> 只需登入
     */

    // 先確認會員是否曾以此種登入方式登入過
    userConnection = await db('user_connection').where({
      connection_id: connectionId,
      account: auth0UserId,
    });

    if (userConnection.length) {
      // 會員有以此種方式登入過，找到該會員資料進行登入步驟即可
      userConnection = userConnection[0];
      user = await db('user').where({id: userConnection.user_id});
      if (!user.length) {
        throw new Error('User does not exists');
      }
      user = user[0];
    } else {
      // 會員沒有以此種方式登入過，必須判斷會員是否存在
      // 兩種情況：
      //  1. 會員存在（相同Email），但沒有以此種方式登入過（可能之前用FB登入，本次卻用Google登入）
      //  2. 會員不存在，此會員完全沒有登入過本應用程式
      if (userInfo.email) {
        user = await db('user').where({
          email: userInfo.email,
        });
        if (user.length) {
          // 狀況一：會員存在（相同Email），但沒有以此種方式登入過（例如：之前用FB登入，本次卻用Google登入）
          // 在會員資料裡，新增此一登入方式即可
          user = user[0];
          userConnection = await userConnectionCreate({
            user_id: user.id,
            connection_id: connectionId,
            account: auth0UserId,
            verified: 1,
            info: userInfo,
          });
        } else {
          // 狀況二：會員不存在，此會員完全沒有登入過本應用程式
          // 需新增會員與會員此一登入方式
          user = await userCreate(connectionId, auth0UserId, userInfo, {
            email: userInfo.email,
            email_verified: 1,
            name: userInfo.name,
          });
        }
      } else {
        // 若使用者透過第三方程式登入，卻不願意提供Email時，依樣新增會員資料
        user = await userCreate(connectionId, auth0UserId, {
          email_verified: 1,
          name: userInfo.name,
        });
      }
    }

    // User Login Process
    const tokenInfo = await userLogin(ctx, user);

    return {
      body: {
        status: 1,
        token: tokenInfo.token,
        expireTime: new Date(tokenInfo.expireTime),
        userId: user.id,
        name: user.name,
      },
    };
  } catch (e) {
    console.error('===== user.auth0login =====', e);
    throw new Error(JSON.stringify({body: {status: 400, message: e.message}}));
  };
}

/**
 * @param {string} token - Token from Request.header
 * @param {object} body - Request.body
 * @param {object} query - Request.query
 * @param {object} params - Request.params
 * @param {object} ctx - ctx
 * @return {object}
 */
async function signUp(token, body, query, params, ctx) {
  try {
    // Check if this email already exists.
    const checkEmail = await db('user').where({
      email: body.email,
    });

    if (checkEmail.length>0) {
      throw new Error('This email already exists');
    }

    if (body.password !== body.password2) {
      throw new Error('Password confirmation failed');
    }

    // Password encryption
    const password = await bcrypt.hash(body.password, config.bcryptSalt);

    // Generate VerifyCode
    const verifyCode= await tools.generateRandomString(20);

    // Save user's data into Database
    const user = await userCreate(1, body.email, {}, {
      email: body.email,
      password,
      verify_code: verifyCode,
      logins: 1,
    });

    // User Login Process
    const tokenObj = await userLogin(ctx, user);

    // Send Email with SendGrid
    const msg = {
      to: user.email,
      from: 'sunny038423@gmail.com',
      subject: '[Sunnytest] Verify your email address',
      html: `<strong>Hello! You're almost ready to start enjoying Sunnytest.
            Simply click this link below to verify your email address.</strong><p>
            <link href="${config.webUrl}/verifyEmail?code=${verifyCode}">
            ${config.webUrl}/verifyEmail?code=${verifyCode}</link></p>`,
    };

    sgMail.send(msg)
        .then((response) => {
          console.log(response[0].statusCode);
          console.log(response[0].headers);
        })
        .catch((error) => {
          console.error(error);
        });

    return {
      body: {
        status: 1,
        token: tokenObj.token,
        expireTime: new Date(tokenObj.expireTime),
        userId: user.id,
        name: user.name,
      },
    };
  } catch (e) {
    console.error('===== user.signup =====', e);
    throw new Error(JSON.stringify({body: {status: 400, message: e.message}}));
  };
}

/**
 * @param {string} token - Token from Request.header
 * @param {object} body - Request.body
 * @param {object} query - Request.query
 * @param {object} params - Request.params
 * @param {object} ctx - ctx
 * @return {object}
 */
async function find(token, body, query, params, ctx) {
  try {
    // Token is required. Users have to log in to get their profile
    if (params.id != ctx.token.id) {
      throw new Error('Permission denied');
    }

    // Get user profile
    let user = await db('user').where({
      id: params.id,
    });

    if (user.length>1) {
      throw new Error('Could not find the correct user');
    }

    if (user<1) {
      throw new Error('User does not exists');
    }

    user = user[0];

    return {body: user};
  } catch (e) {
    console.error('===== user.find =====', e);
    throw new Error(JSON.stringify({body: {status: 400, message: e.message}}));
  };
}

/**
 * @param {string} token - Token from Request.header
 * @param {object} body - Request.body
 * @param {object} query - Request.query
 * @param {object} params - Request.params
 * @param {object} ctx - ctx
 * @return {object}
 */
async function list(token, body, query, params, ctx) {
  try {
    const users= await db('user').where({}).limit(100).orderBy('id', 'ASC');
    return {body: {total: users.length, data: users}};
  } catch (e) {
    console.error('===== user.list =====', e);
    throw new Error(JSON.stringify({body: {status: 400, message: e.message}}));
  };
}

/**
 * @param {string} token - Token from Request.header
 * @param {object} body - Request.body
 * @param {object} query - Request.query
 * @param {object} params - Request.params
 * @param {object} ctx - ctx
 * @return {object}
 */
async function statistic(token, body, query, params, ctx) {
  try {
    /* now */
    const now = new Date();
    const year = new Date(now).getFullYear();
    const month = new Date(now).getMonth()+1;
    const date = new Date(now).getDate();

    /* Today */
    const startTime = new Date(`${year}-${month}-${date}`);
    const endTime = new Date(new Date(startTime).getTime() + 23*60*60*1000 + 59*60*1000 + 59*1000);

    /* Last 7 days */
    const last7DaysStartTime = new Date(startTime.getTime() - 6*24*60*60*1000);
    const last7DaysEndTime = startTime;

    /* Get Statistic Info */
    const userCount = await db('user').where({}).count();
    const actUserCount = await db('user').whereBetween('last_online', [startTime, endTime]).count();
    const last7DayActUserCount = await db.select('date', db.raw('count(user_id)'))
        .from('user_logging')
        .whereBetween('date', [last7DaysStartTime, last7DaysEndTime])
        .groupByRaw('date');

    last7DayActUserAvg = (last7DayActUserCount.reduce((p, a) => p + parseInt(a.count, 10), 0));

    return {
      body: {
        userCount: parseInt(userCount[0].count, 10),
        activeUserCount: parseInt(actUserCount[0].count, 10),
        weekActiveUserAvg: parseInt(last7DayActUserAvg / 7, 10),
      },
    };
  } catch (e) {
    console.error('===== user.statistic =====', e);
    throw new Error(JSON.stringify({body: {status: 400, message: e.message}}));
  };
}

/**
 * @param {string} token - Token from Request.header
 * @param {object} body - Request.body
 * @param {object} query - Request.query
 * @param {object} params - Request.params
 * @param {object} ctx - ctx
 * @return {object}
 */
async function sendmail(token, body, query, params, ctx) {
  try {
    // Get user profile
    let user = await db('user').where({id: ctx.token.id});

    // Check if user exists
    if (user.length>1) {
      throw new Error('Could not find the correct user');
    }
    if (user.length<1) {
      throw new Error('User does not exists');
    }

    user = user[0];

    // If this email address has already been verified. return an error.
    if (user.email_verified) {
      throw new Error('email has already been verified');
    }

    // Generate VerifyCode
    const verifyCode = await tools.generateRandomString(20);
    await db('user').where({id: user.id}).update({verify_code: verifyCode});

    // Send mail with SendGrid
    const msg = {
      to: user.email,
      from: 'sunny038423@gmail.com',
      subject: '[Sunnytest] Verify your email address',
      html: `<strong>Hello! You're almost ready to start enjoying Sunnytest.
            Simply click this link below to verify your email address.</strong><p>
            <link href="${config.webUrl}/verifyEmail?code=${verifyCode}">
            ${config.webUrl}/verifyEmail?code=${verifyCode}</link></p>`,
    };

    sgMail.send(msg)
        .then((response) => {
          console.log(response[0].statusCode);
          console.log(response[0].headers);
        })
        .catch((error) => {
          console.error('error', error);
        });

    return {
      body: {
        status: 1,
      },
    };
  } catch (e) {
    console.error('===== user.sendmail =====', e);
    throw new Error(JSON.stringify({body: {status: 400, message: e.message}}));
  };
}

/**
 * @param {string} token - Token from Request.header
 * @param {object} body - Request.body
 * @param {object} query - Request.query
 * @param {object} params - Request.params
 * @param {object} ctx - ctx
 * @return {object}
 */
async function verify(token, body, query, params, ctx) {
  try {
    // Find user with code
    // If user email address has already been verified, return an error.
    let user = await db('user').where({verify_code: query.code, email_verified: 0});

    if (user.length !== 1) {
      throw new Error('User does not exists');
    }

    user = user[0];

    await db('user').where({id: user.id}).update({email_verified: 1});

    return {
      body: {
        status: 1,
      },
    };
  } catch (e) {
    console.error('===== user.verify =====', e);
    throw new Error(JSON.stringify({body: {status: 400, message: e.message}}));
  };
}

/**
 * @param {string} token - Token from Request.header
 * @param {object} body - Request.body
 * @param {object} query - Request.query
 * @param {object} params - Request.params
 * @param {object} ctx - ctx
 * @return {object}
 */
async function update(token, body, query, params, ctx) {
  try {
    // Get user
    let user = await db('user').where({id: ctx.token.id});

    // Check if user exists
    if (user.length>1) {
      throw new Error('Could not find the correct user');
    }
    if (user.length<1) {
      throw new Error('User does not exists');
    }

    user = user[0];

    const info = {};

    /* Update user's name */
    if (body.name) {
      info.name = body.name;
    }

    /* Update user's password */
    if (body.password) {
      if (!body.oldPassword) {
        throw new Error('Old password cannot be empty');
      }

      if (!user.password) {
        throw new Error('User use FB or GOOGLE to log in, no password is required');
      }

      if (body.password !== body.password2) {
        throw new Error('Password comfirmation failed');
      }

      const compareResult = await bcrypt.compare(body.oldPassword, user.password);
      if (!compareResult) {
        throw new Error('Old password incorrect');
      }

      info.password = await bcrypt.hash(body.password, config.bcryptSalt);
    }

    if (Object.keys(info).length !== 0) {
      await db('user').where({id: user.id}).update(info);
    }

    return {
      body: {
        status: 1,
      },
    };
  } catch (e) {
    console.error('===== user.update =====', e);
    throw new Error(JSON.stringify({body: {status: 400, message: e.message}}));
  };
}


/* Function */

/**
 * @param {integer} provider - Connection provider (1:email 2:fb, 3:google)
 * @param {string} account - User account(Email or Auth0UserId)
 * @param {object} info - User info from auth0
 * @param {object} data - Data to be saved to the database
 * @return {object}
 */
async function userCreate(provider, account, info, data) {
  try {
    const user = await db.transaction(async (trx) => {
      // Create user
      data.logins = 0;
      data.name = data.name || '';
      let user = await db('user').insert(data).returning('*').transacting(trx);

      if (user.length!==1) {
        throw new Error('Failed to create user');
      }

      user = user[0];

      // Create user connection
      let userConnection = await db('user_connection').insert({
        user_id: user.id,
        connection_id: provider,
        account: account,
        verified: ( provider === 1 ? 0 : 1),
        info: info,
      }).returning('*').transacting(trx);

      if (userConnection.length!==1) {
        throw new Error('Failed to create user_connection');
      }

      userConnection = userConnection[0];
      return user;
    });

    return user;
  } catch (e) {
    throw e;
  }
}

/**
 * @param {object} data - Data to be saved to the database
 * @return {object}
 */
async function userConnectionCreate(data) {
  try {
    await db.transaction(async (trx) => {
      const userConnection = await db('user_connection').insert(data).returning('*').transacting(trx);

      if (userConnection.length!==1) {
        throw new Error('Failed to create user_connection');
      }

      return userConnection[0];
    });
  } catch (e) {
    throw e;
  }
}

/**
 * @param {object} ctx - ctx
 * @param {object} user - user info
 * @return {object}
 */
async function userLogin(ctx, user) {
  try {
    // Get Today()
    const now = new Date();
    const year = new Date(now).getFullYear();
    const month = new Date(now).getMonth()+1;
    const day = new Date(now).getDate();
    const date = new Date(`${year}-${month}-${day}`);

    // Update user
    await db.transaction(async (trx) => {
      await db('user').where({id: user.id}).update({last_login: now, last_online: now}).increment({logins: 1}).transacting(trx);
      await db.raw(`INSERT INTO user_logging(user_id, date, count) VALUES(${user.id}, '${date.toISOString()}', ${1}) 
                    ON CONFLICT (user_id, date) DO UPDATE SET count=user_logging.count+1`).transacting(trx);
    });

    const expireTime = now.getTime() + config.jwtExpireTime;

    // Generate Token
    const payload = {
      type: 1,
      id: user.id,
      rememberMe: false,
      exp: parseInt(expireTime / 1000, 10),
    };

    const token = jwt.sign(payload, config.jwtSecret);

    // Set Session
    ctx.session.userId = user.id;

    if (!token) {
      throw new Error('TOKEN_ERROR');
    }

    return {
      expireTime,
      token,
    };
  } catch (e) {
    console.error('===== Function user.login =====', e);
    throw e;
  }
}

module.exports = {
  login,
  auth0login,
  signUp,
  find,
  list,
  statistic,
  sendmail,
  verify,
  update,
};
