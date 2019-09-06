const fetch = require('node-fetch');
const https = require("https");
const http = require('http');

const agentConfig = {
  rejectUnauthorized: false
};

const httpsAgent = new https.Agent(agentConfig);
const httpAgent = new http.Agent(agentConfig);

const defaultConfiguration = {
  overwriteExisting: true,
  updateUrl: null,
  frequency: 1000 * 60 * 5,
  exclude: []
};

const mapEnvironment = (configResponse, config, cb) => {
  Object.keys(configResponse.data).forEach(key => {
    if (config.exclude.indexOf(key) === -1) {
      if (process.env[key]) {
        if (config.overwriteExisting) {
          process.env[key] = configResponse.data[key];
        }
      } else {
        process.env[key] = configResponse.data[key];
      }
    }
  });
  cb && cb();
};

const update = (config, cb) => {
  const headers = {};

  if (config.auth) {
    if(config.auth.token) {
      headers['authorization'] = 'Bearer ' + config.auth.token;
    } else {
      headers['authorization'] = 'Basic ' + Buffer.from(config.auth.username + ':' + config.auth.password).toString('base64');
    }
  }

  fetch(config.updateUrl, {agent: (config.updateUrl.indexOf('https') > -1 ? httpsAgent : httpAgent), headers})
    .then(res => res.json())
    .then(data => mapEnvironment(data, config, cb))
    .catch(err => {
      console.error('Config update error:', err)
    });
};

module.exports = config => {
  const configuration = {
    ...defaultConfiguration,
    ...config
  };

  if (!configuration.updateUrl) {
    throw new Error('Missing configuration {updateUrl}, example: http://kubeip:4444/api/v1/namespaces/default/configmaps/acg')
  }

  const instance = setInterval(() => update(configuration), configuration.frequency);

  return {
    configuration,
    update: (cb) => update(configuration, cb),
    stop: () => {
      clearInterval(instance)
    }
  };
};
