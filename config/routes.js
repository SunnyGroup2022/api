module.exports = {
  user: {
    login: {method: 'post', path: '/login'},
    auth0login: {method: 'post', path: '/auth0login'},
    signUp: {method: 'post', path: '/signUp'},
    sendmail: {method: 'post', path: '/sendmail', auth: true},
    statistic: {method: 'get', path: '/statistics'},
    verify: {method: 'get', path: '/verify'},
    list: {method: 'get', path: '/list'},
    find: {method: 'get', path: '/:id', auth: true},
    update: {method: 'put', path: '/:id', auth: true},
  },
};
