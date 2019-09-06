### Kubernetes Auto Config Updater

You can change your pods environment variables without creating new pods when you update your configmap. This package will update your environment on the fly! 

### Install
* Using yarn
```
yarn add kubernetes-configmap-updater
```

* Using npm

```
npm install kubernetes-configmap-updater
```

### Usage

```js
const configUpdater = require('kubernetes-configmap-updater');
configUpdater({
  updateUrl: 'https://127.0.0.1:6443/api/v1/namespaces/default/configmaps/example',
  frequency: 1000 * 60 * 3,
  overwriteExisting: true,
  exclude: ['NODE_ENV', 'CUSTOM1','CUSTOM2'],
  auth: {
    username: 'username',
    password: 'password',
    token: 'token' // provide token or username/password
  }
});
```

* **updateUrl**: Kubernetes configmap api endpoint url
* **frequency**: (Optional) Update interval in ms. Default: `300000`
* **overwriteExisting**: (Optional) Change value of existing key. Default: `true`
* **exclude**: (Optional) Exclude keys from being updated. Default: []
* **auth**: (Optional) Most Kubernetes apis require basic auth. You can provide your username and password or token(for Bearer auth). **(Best practice: Use kubernetes secrets, don't write your username and password directly here)**

### Refs

* Manually triggering update
```js
configUpdater.update([cb]);
```

* Stop checking updates
```js
configUpdater.stop();
```
