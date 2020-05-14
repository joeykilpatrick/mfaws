# mfaws [![npm](https://img.shields.io/npm/v/mfaws)](https://www.npmjs.com/package/mfaws)

Easy MFA access for AWS IAM Users for the AWS CLI.

Works with any AWS tool that reads from ~/.aws/credentials (e.g. SDKs, CDK, SAM, CodeCommit GRC).

### Install
Install with NPM: `npm i -g mfaws`

### Usage
Each example below assumes that you have run `aws configure` and have set an access key id and secret access key. 

All `mfaws` commands can be run with the `--profile` flag to select a user profile.

###### Set credentials
```sh
$ mfaws set
? Enter your MFA Code: » 012345

Expiration: 5/4/2020, 9:18:29 AM

$ aws ... // This call is MFA authenticated
```

###### Restore original credentials
```sh
$ mfaws restore

$ aws ... // This call is not MFA authenticated
```
