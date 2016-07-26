var slackBot = require('../handleCommand/handler').slackBot;
var chai = require('chai');
var expect = chai.expect;

chai.use(require('dirty-chai'));

describe('handleCommand', function () {
  var received;
  var receivedArgs;
  var callback = function (error, success) {
    received = true;
    receivedArgs = [error, success];
  };

  beforeEach(function () {
    received = false;
    receivedArgs = [];
  });

  it('responds to /deploy my_stack my_app invalid', function () {
    slackBot.deploy({ args: { stack: 'my_stack', app: 'my_app', migrate: 'invalid' } }, callback);
    expect(received).to.be.true();
    expect(receivedArgs).to.deep.eq([null, slackBot.ephemeralResponse('Invalid migration switch, please use `true` or `false` instead of invalid')]);
  });

  it('responds to /deploy my_invalid_stack my_app false', function () {
    slackBot.deploy({ args: { stack: 'my_invalid_stack', app: 'my_app', migrate: 'false' } }, callback);
    expect(received).to.be.false();
    expect(receivedArgs).to.deep.eq([]);
  });

  it('responds to /deploy my_stack my_invalid_app false', function () {
    slackBot.deploy({ args: { stack: 'my_stack', app: 'my_invalid_app', migrate: 'false' } }, callback);
    expect(received).to.be.false();
    expect(receivedArgs).to.deep.eq([]);
  });

  it('responds to /servers stop', function () {
    slackBot.servers({ args: { command: 'stop' } }, callback);
    expect(received).to.be.false();
    expect(receivedArgs).to.deep.eq([]);
  });

  it('responds to /servers start', function () {
    slackBot.servers({ args: { command: 'start' } }, callback);
    expect(received).to.be.false();
    expect(receivedArgs).to.deep.eq([]);
  });

  it('responds to /servers status', function () {
    slackBot.servers({ args: { command: 'start' } }, callback);
    expect(received).to.be.false();
    expect(receivedArgs).to.deep.eq([]);
  });

});
