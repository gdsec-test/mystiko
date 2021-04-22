# Mystiko

Allows to store all secrets in AWS Secrets Manager and read them locally in different ways to be used by any environment (build or runtime locally, or in CICD)

## Usage

1. Create file `.mystiko.json` in folder where you run it with below syntax. See `example` folder

```json
{
  "environments": {
    "<any_env_name>": {
      "region": "<AWS Region,e.g. me-south-1>",
      "secrets": [
        { 
          "name": "<secret_name_in_AWS_Secret_Manager>",
          "target": "env",
          "envname": "<name of env variable to put secret value to>"
        },
        {
          "name": "<secret_name_in_AWS_Secret_Manager>",
          "keyValues": [
            { 
              "key": "<key in AWS Secret>",
              "target": "file",
              "filename": "<relative or absolute path of target file to put secret value to>"
            }
          ]
        }
      ]
    }
  }
}
```

2. Call mystiko anywhere you want to dd your secrets

Remember, `mystiko` is async Promisify library, so to make sure you receive your secrets before usage, you have to wait for it
`mystiko` uses standard AWS auth process [see Configuration settings and precedence ](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html) to access Secrets Manager

```javascript
import mystiko from 'mystiko';
......
await mystiko({ env: 'dev'});
```

3. Use your Secret
Secret will appear as env var, so you can read it from `process.env.<name of secret>`. Or it will be saved in file

## Tests

Run tests with `npm run test`. When adding a new feature, make sure the code coverage does not go down.

## Questions?

Slack: https://godaddy-oss.slack.com/