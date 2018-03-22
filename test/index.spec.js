const expect = require('chai').expect;
const http = require('http');

describe('Kubernetes ConfigMap Update', function () {
  it('should expose module', function () {
    expect(require('../')).to.be.a('function');
  });

  it('should throw error when updateUrl not provided', function () {
    const test = () => {
      require('../')({
        username: '',
        password: ''
      });
    };

    expect(test).to.throw('Missing');
  });

  it('should throw error when username not provided', function () {
    const test = () => {
      require('../')({
        password: '',
        updateUrl: ''
      });
    };

    expect(test).to.throw('Missing');
  });

  it('should throw error when password not provided', function () {
    const test = () => {
      require('../')({
        username: '',
        updateUrl: ''
      });
    };

    expect(test).to.throw('Missing');
  });

  it('should return interval id on successful configuration', function () {
    const updaterInstance = require('../')({
      updateUrl: 'http://127.0.0.1:4444/'
    });

    updaterInstance.stop();
    expect(updaterInstance).to.be.a('object');
  });

  it('should login with basic auth', function (done) {
    const httpInstance = http.createServer(function (req, res) {
      expect(req.headers.authorization).to.eq('Basic dGVzdHVzZXJuYW1lOnRlc3RwYXNz');
      res.end(JSON.stringify({
        data: {
          auth: 'yes'
        }
      }));
    }).listen(4444);

    const updaterInstance = require('../')({
      updateUrl: 'http://127.0.0.1:4444/',
      auth: {
        username: 'testusername',
        password: 'testpass'
      }
    });

    updaterInstance.update(() => {
      updaterInstance.stop();
      httpInstance.close(done);
    });
  });

  it('should update environment values', function (done) {
    process.env.testValue = 'false';

    const httpInstance = http.createServer(function (req, res) {
      res.end(JSON.stringify({
        data: {
          testValue: 'changed'
        }
      }));

    }).listen(4444);

    const updaterInstance = require('../')({
      updateUrl: 'http://127.0.0.1:4444/',
    });


    updaterInstance.update(() => {
      expect(process.env.testValue).to.eq('changed');
      updaterInstance.stop();
      httpInstance.close(done);
    });
  });

  it('should not update environment values for excluded keys', function (done) {
    process.env.testValue = 'false';

    const httpInstance = http.createServer(function (req, res) {
      res.end(JSON.stringify({
        data: {
          testValue: 'changed'
        }
      }));
    }).listen(4444);

    const updaterInstance = require('../')({
      updateUrl: 'http://127.0.0.1:4444/',
      exclude: ['testValue']
    });

    updaterInstance.update(() => {
      expect(process.env.testValue).to.eq('false');
      updaterInstance.stop();
      httpInstance.close(done);
    });
  });

  it('should fetch with in interval', function (done) {
    let i = 0;
    const httpInstance = http.createServer(function (req, res) {
      res.end(JSON.stringify({
        data: {
          testValue: 'changed' + ++i
        }
      }));
    }).listen(4444);

    const updaterInstance = require('../')({
      updateUrl: 'http://127.0.0.1:4444/',
      frequency: 500
    });

    setTimeout(() => {
      expect(process.env.testValue).to.eq('changed2');
      updaterInstance.stop();
      httpInstance.close(done);
    }, 1500);
  });
});
