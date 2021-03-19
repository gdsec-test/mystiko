const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const logger = require('./logger.js');
const fs = require('fs');
const TARGETS = [ 'file', 'env' ];

module.exports = async function ({ env }) {
  var data = fs.readFileSync('.mystiko.json', 'utf8');
  var config;
  try {
    data = JSON.parse(data);
    config = data.environments[env];
  } catch (err) {
    logger.error('Unable to parse .mystiko.json\n' + err.toString());
  }
  const { region, secrets = []} = config;
  const requests = [];
  secrets.forEach(secretConfig => {
    const { name, target, targetValue } = secretConfig;
    if (TARGETS.indexOf(target) < 0) {
      logger.warn(`Secret ${name} is not processed, cause it's target ${target} is not supported. Supported:${
        TARGETS.join(',')}`);
      return;
    }
    const secretName = name;
    requests.push(
      readValue(secretName, region)
        .then(secretVal => {
          if (secretVal) {
            const secret = Object.values(JSON.parse(secretVal))[0];
            if (target === TARGETS[0]) { // it is file
              let filePath = targetValue;
              logger.log(`Saving ${secretName} into file ${filePath}`);
              filePath = filePath.split('/');
              if (filePath.length > 1) {
                const dirPath = filePath.slice(0, filePath.length - 1);
                fs.mkdirSync(dirPath.join('/'), { recursive: true });
              }
              fs.writeFileSync(targetValue, secret);
            } else {
              logger.log(`Saving ${secretName} into environment variable ${targetValue}`);
              process.env[targetValue] = secret;
            }
          }
        })
        .catch(err => {
          logger.error(err);
        })
    );
  });
  return await Promise.all(requests);
}

async function readValue (secretName, region) {
  var client = new SecretsManagerClient({
    region: region
  });
  const [err, data] = await new Promise((resolve, reject) => {
    var command = new GetSecretValueCommand({ SecretId: secretName });
    client.send(command).then(
      (data) => {
        resolve([null, data]);
      },
      (error) => {
        resolve([error, null]);
      }
    );
  });

  if (err) {
    if (err.name === 'DecryptionFailureException') {
      logger.error("Secrets Manager can't decrypt the protected secret text using the provided KMS key.\n"
        + err.toString());
    } else if (err.name === 'AccessDeniedException') {
      logger.error('Access denied to current user\n' + err.toString());
    } else if (err.name === 'InternalServiceErrorException') {
      logger.error('An error occurred on the server side.\n' + err.toString());
    } else if (err.name === 'InvalidParameterException') {
      logger.error('You provided an invalid value for a parameter.\n' + err.toString());
    } else if (err.name === 'InvalidRequestException') {
      logger.error('You provided a parameter value that is not valid for the current state of the resource.\n'
        + err.toString());
    } else if (err.name === 'ResourceNotFoundException') {
      logger.error(`We can't find secret ${secretName} that you asked for.\n${err.toString()}`);
    } else if (err.name === 'ExpiredTokenException') {
      logger.error('Your credentials expired. Please, re-login\n' + err.toString());
    } else {
      logger.error('Unknow error:' + err.name + '\n' + err.toString());
    }
  } else {
    // Depending on whether the secret is a string or binary, one of these fields will be populated.
    if ('SecretString' in data) {
      return data.SecretString;
    } else {
      const buff = new Buffer(data.SecretBinary, 'base64');
      return buff.toString('ascii');
    }
  }
}
