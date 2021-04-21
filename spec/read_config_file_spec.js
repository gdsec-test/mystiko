const rewire = require('rewire');
const mystiko = rewire('../src/index.js');
const readConfigFile = mystiko.__get__('readConfigFile');

describe('Read Config File', function() {
  it('should be able to read the environment config from the config file', function() {
    const config = readConfigFile('test', './spec/fixtures/.mystiko.json');
    const expected_config = {
      "region": "us-west-2",
      "secrets": [{
        "name": "KEY_VALUE_SECRET1",
        "keyValues": [{
          "key": "SECRET_KEY1",
          "target": "env",
          "targetValue": "SECRET_KEY1_ENV"
        }, {
          "key": "SECRET_KEY2",
          "target": "env",
          "targetValue": "SECRET_KEY2_ENV"
        }, {
          "key": "SECRET_KEY3",
          "target": "file",
          "targetValue": "./test_gen_files/cert.crt"
        }]
      }, {
        "name": "NON_KEY_VALUE_SECRET1",
        "target": "env",
        "targetValue": "SECRET_KEY3_ENV"
      }, {
        "name": "NON_KEY_VALUE_SECRET2",
        "target": "file",
        "targetValue": "./test_gen_files/cert2.crt"
      }]
    };
    expect(config).toEqual(expected_config);
  });
});
