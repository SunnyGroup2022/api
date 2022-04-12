const tool = require('../tools/index.js');
const expect = require('chai').expect;

describe('generateRandomString funtion test', function() {
  it('should be 10 characters', function() {
    expect(tool.generateRandomString(10)).to.have.length(10);
  });
});
