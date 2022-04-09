module.exports = {
  // 建立隨機字串
  generateRandomString: function(num) {
    const chars ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result= '';
    const charsLength = chars.length;
    for ( let i = 0; i < num; i++ ) {
      result += chars.charAt(Math.floor(Math.random() * charsLength));
    }
    return result;
  },
};
