const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const logger = require('./logger.js');
const fs = require('fs');
const TARGETS = [ 'file', 'env' ];

module.exports = async function ({ env, configFile = '.mystiko.json' }) {
  const config = readConfigFile(env, configFile)
  const { region, secrets = []} = config;
  const requests = [];
  secrets.forEach(secretConfig => {
    const { name, target } = secretConfig;
    if ((TARGETS.indexOf(target) < 0) && target) {
      errorMsg = `Secret ${name} is not processed, because it's target ${target} is not supported. Supported:${TARGETS.join(',')}`;
      throw new Error(errorMsg);
    }
    const secretName = name;
    requests.push(
      readValue(secretName, region)
        .then(secretValue => {
          if (secretValue) {
            processSecrets(secretValue, secretConfig);
          }
        })
    );
  });
  return await Promise.all(requests);
}

function getTargetValue(secretConfig = {}) {
  const { target } = secretConfig;
  if (target === 'file') {
    return secretConfig.filename;
  } else if (target === 'env') {
    return secretConfig.envname;
  } else {
    errorMsg = `Unknown type of target: ${target} in ${JSON.stringify(secretConfig)}`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }
}

function processSecrets(secretValue, secretConfig) {
  if ('keyValues' in secretConfig) {
    secrets = secretConfig['keyValues'];
    secretValue = safelyParseSecretString(secretValue);
    for (const secret of secrets) {
      if (!(secret.key in secretValue)) {
        errorMsg = `${secret.key} is not a key in the ASM secret ${secretConfig.name}`;
        throw new Error(errorMsg);
      }
      processSecret(secret.key, secretValue[secret.key], secret.target, getTargetValue(secret));
    }
  } else {
    processSecret(secretConfig.name, secretValue, secretConfig.target, getTargetValue(secretConfig));
  }
}

function processSecret(secretName, secretValue, target, targetValue) {
  if (target === 'file') {
    let filePath = targetValue;
    logger.log(`Saving ${secretName} into file ${filePath}`);
    filePath = filePath.split('/');
    if (filePath.length > 1) {
      const dirPath = filePath.slice(0, filePath.length - 1);
      fs.mkdirSync(dirPath.join('/'), { recursive: true });
    }
    fs.writeFileSync(targetValue, secretValue);
  } else if (target === 'env') {
    logger.log(`Saving ${secretName} into environment variable ${targetValue} with value ${secretValue}`);
    process.env[targetValue] = secretValue;
  } else {
    errorMsg = `No logic to support target ${target} for ${secretName}`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }
}

async function getSecretFromSecretManager(secretName, region) {
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
  return err, data;
}

async function readValue(secretName, region) {
  [err, data] = await getSecretFromSecretManager(secretName, region);

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
      logger.error('Unknown error:' + err.name + '\n' + err.toString());
    }
    throw err;
  } else {
    return parseSecret(data);
  }
}

function parseSecret (data) {
  // Depending on whether the secret is a string or binary, one of these fields will be populated.
  if ('SecretString' in data) {
    return safelyParseSecretString(data.SecretString);
  } else {
    const buff = Buffer.from(data.SecretBinary, 'base64');
    return buff.toString('ascii');
  }
}

function readConfigFile (env, configFile) {
  var data = fs.readFileSync(configFile, 'utf8');
  var config;
  try {
    data = JSON.parse(data);
    config = data.environments[env];
    return config;
  } catch (err) {
    throw new Error(`Unable to parse ${configFile}\n` + err.toString());
  }
}

function safelyParseSecretString (string) {
  try {
    return JSON.parse(string);
  } catch (err) { // Plain text secret
    return string;
  }
}
