#!/usr/bin/env node

import AWS from 'aws-sdk';
import logger from './logger.js';
import fs from 'fs';
import { execSync } from 'child_process';

(function () {
  var data = fs.readFileSync('.mystiko', 'utf8');
  data.split('\n').forEach(s => {
    if (!s) {
      return;
    }
    const params = s.split('=');
    if (params.length < 2 || params.length > 3) {
      logger.warn(
        `Line "${s}" has incorrect format. Should be <ENV_VAR>=<secret_name> or file:<file_path>=<secret_name>`
      );
      return;
    }
    const destName = params[0];
    const secretName = params[1];
    console.log(destName);
    
    readValue(secretName)
      .then(secret => {
        if (secret) {
          
          if (destName.startsWith('file:')) {
            let filePath = destName.split(':')[1];
            logger.log(`Saving ${secretName} into file ${filePath}`);
            filePath = filePath.split('/');
            if (filePath.length > 1) {
              const dirPath = filePath.slice(0, filePath.length - 1);
              fs.mkdirSync(dirPath.join('/'), { recursive: true });
            }
            fs.writeFileSync(destName.split(':')[1], secret);
          } else {
            logger.log(`Saving ${secretName} into environment variable ${destName}`);
          }
        }
      })
      .catch(err => {
        logger.error(err);
      });

    // const stdout = execSync('ls');
  });
})();

async function readValue (secretName) {
  const region = 'us-west-2';

  var client = new AWS.SecretsManager({
    region: region
  });

  const [err, data] = await new Promise((resolve, reject) => {
    client.getSecretValue({ SecretId: secretName }, function (err, data) {
      resolve([err, data]);
    });
  });

  if (err) {
    if (err.code === 'DecryptionFailureException') {
      logger.error("Secrets Manager can't decrypt the protected secret text using the provided KMS key.");
    } else if (err.code === 'InternalServiceErrorException') {
      logger.error('An error occurred on the server side.');
    } else if (err.code === 'InvalidParameterException') {
      logger.error('You provided an invalid value for a parameter.');
    } else if (err.code === 'InvalidRequestException') {
      logger.error('You provided a parameter value that is not valid for the current state of the resource.');
    } else if (err.code === 'ResourceNotFoundException') {
      logger.error(`We can't find secret ${secretName} that you asked for.`);
    } else if (err.code === 'ExpiredTokenException') {
      logger.error('Your credentials expired. Please, re-login');
    } else {
      logger.error('Unknow error:' + err.code);
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
