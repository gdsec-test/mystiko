var sinon = require("sinon");
const rewire = require('rewire');
const mystiko = rewire('../src/index.js');
const readValue = mystiko.__get__('readValue');

describe('Error from Secret Manager', function() {
  const parameters = [
    { errName: "DecryptionFailureException" },
    { errName: "AccessDeniedException" },
    { errName: "InternalServiceErrorException" },
    { errName: "InvalidParameterException" },
    { errName: "InvalidRequestException" },
    { errName: "ResourceNotFoundException" },
    { errName: "ExpiredTokenException" },
    { errName: "UnknownException" }
  ];
  let getSecretFromSecretManagerStub;

  beforeAll(function() {
    const getSecretFromSecretManager = { getSecretFromSecretManager: mystiko.__get__('getSecretFromSecretManager') };
    getSecretFromSecretManagerStub = sinon.stub(getSecretFromSecretManager, "getSecretFromSecretManager");
  });

  parameters.forEach(parameter => {
    it('mystiko fails to run when getting the secret from secret manager fails', async function() {
      const returnValue = [{"name": parameter.errName}, null];
      const mockResponse = new Promise(function(resolve, reject) {
        resolve(returnValue);
      });
        
      getSecretFromSecretManagerStub.returns(mockResponse);
      mystiko.__set__('getSecretFromSecretManager', getSecretFromSecretManagerStub);
      
      let passed = false;
      try {
        await readValue("secretName", "region");
        passed = true;
      } catch (e) {
        expect(e.name).toEqual(parameter.errName);
      }
      expect(passed).toEqual(false);
    });
  });
});
