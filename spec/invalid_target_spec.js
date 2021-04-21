const mystiko = require('../src/index.js');

describe('Invalid Target', function() {
  it('should throw an error if the target is not valid', async function() {
    let passed = false;
    try {
      await mystiko({ env: 'test', configFile: './spec/fixtures/.mystiko_invalid_target.json'});
      passed = true;
    } catch (e) {
      const errMessage = `Secret KEY_VALUE_SECRET1 is not processed, because it's target envv is not supported. Supported:file,env`;
      expect(e.message).toEqual(errMessage);
    }
    expect(passed).toEqual(false);
  });
});
