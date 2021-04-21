# Mystiko

Allows to store all secrets in AWS Secrets Manager and read them locally in different ways to be used by any environment (build or runtime locally, or in CICD)

## Usage

Create file `.mystiko.json` with below syntax. See `example` folder

```json
{
  "environments": {
    "<any_env_name>": {
      "region": "<AWS Region,e.g. us-west-2>",
      "secrets": [
        { 
          "name": "<secret_name_in_AWS_Secret_Manager>",
          "target": "<env or file>",
          "targetValue": "<name or path of target to put secret value>"
        },
        {
          "name": "<secret_name_in_AWS_Secret_Manager>",
          "keyValues": [
            { 
              "key": "<key in AWS Secret>",
              "target": "<env or file>",
              "targetValue": "<name or path of target to put secret value>"
            }
          ]
        }
      ]
    }
  }
}
```

## Tests

Run tests with `npm run test`. When adding a new feature, make sure the code coverage does not go down.

## Questions?

Slack: https://godaddy-oss.slack.com/