"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
  return (mod && mod.__esModule) ? mod : {"default": mod};
};
Object.defineProperty(exports, "__esModule", {value: true});
const rxjs_1 = require("rxjs");
require("rxjs/add/observable/from");
const request_1 = __importDefault(require("request"));
const operators_1 = require("rxjs/operators");
const JSONStream_1 = __importDefault(require("JSONStream"));
const event_stream_1 = __importDefault(require("event-stream"));
var KUBE_RESPONSE_TYPE;
(function (KUBE_RESPONSE_TYPE) {
  KUBE_RESPONSE_TYPE["ADDED"] = "ADDED";
  KUBE_RESPONSE_TYPE["MODIFIED"] = "MODIFIED";
})(KUBE_RESPONSE_TYPE || (KUBE_RESPONSE_TYPE = {}));

class ConfigUpdater {
  constructor(config) {
    this.configMapValues = {};
    this.configuration = config;
    this.start();
  }

  start() {
    this.k8sUpdate = rxjs_1.Observable.create((subscriber) => this.getRequestStream(subscriber));
    this.k8sUpdate
      .pipe(operators_1.map(this.mapResponse))
      .pipe(operators_1.filter((update) => update.kind === 'ConfigMap'))
      .subscribe(this.updateHandler.bind(this));
  }

  getRequestStream(observer) {

    const headers = {};

    if (this.configuration.auth) {
      if (this.configuration.auth.token) {
        headers['authorization'] = 'Bearer ' + this.configuration.auth.token;
      } else {
        headers['authorization'] = 'Basic ' + Buffer.from(this.configuration.auth.username + ':' + this.configuration.auth.password).toString('base64');
      }
    }

    const req = request_1.default({
      url: `${this.configuration.url}/api/v1/namespaces/${this.configuration.namespace}/configmaps?watch=1`,
      headers,
      strictSSL: false
    });
    req.on('complete', () => {
      console.warn('JSON stream ended, refreshing connection');
      this.getRequestStream(observer);
    });
    req.on('error', (err) => {
      console.error('An error occurred on JSON stream', err);
      this.getRequestStream(observer);
    });
    req.on('abort', () => {
      console.error('An error occurred on JSON stream');
      this.getRequestStream(observer);
    });
    req
      .pipe(JSONStream_1.default.parse())
      .pipe(event_stream_1.default.mapSync((data) => observer.next(data)));
    return req;
  }

  mapResponse(response) {
    return {
      type: response.type,
      data: response.object.data,
      kind: response.object.kind,
      name: response.object.metadata.name
    };
  }

  updateHandler(kubeResponse) {
    this.configMapValues[kubeResponse.name] = kubeResponse.data || Object.assign(this.configMapValues[kubeResponse.name] || {}, kubeResponse.data);
    rxjs_1.Observable
      .from(this.configuration.configmaps)
      .reduce((configResult, key) => Object.assign(configResult, this.configMapValues[key] || {}), {})
      .subscribe((configObject) => {
        console.info('Environment configuration is updated.');
        Object.assign(process.env, configObject);
      });
  }
}

module.exports = ConfigUpdater;
