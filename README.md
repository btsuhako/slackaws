# SlackAWS - Slackbot for AWS

SlackAWS is an example project for using a Slackbot to control AWS resources. Slackbot commands are sent to an [AWS API Gateway](https://aws.amazon.com/api-gateway/), which passes execution to a [Lambda](https://aws.amazon.com/lambda/) function.

SlackAWS uses the [Serverless](http://serverless.com) application framework and [Slack Lambda Router](https://github.com/localytics/lambda-slack-router)

# SlackAWS v0.1.0

## Features

* Resize auto-scaling group and create Redis cache cluster
* Terminate Redis cluster and downsize ASG
* Query for the status of computing resources
* Trigger an application deploy from Slack to OpsWorks

## Getting Started

Install The Serverless Framework via npm: (requires Node V4)

```
npm install serverless@0.5.5 -g
```

Clone [SlackAWS project](https://github.com/btsuhako/slackaws)

```
git clone https://github.com/btsuhako/slackaws
```

Make note of the API Gateway URL after running the following command:

```
serverless stage create
```

Refer to Slack documentation to create a [slash command](https://api.slack.com/slash-commands) and make note of the Slack verification token.

```
serverless variables set -k SLACK_VERIFICATION_TOKEN -v your-slack-verification-token
serverless dash deploy
```
Be sure to deploy all necessary endpoints and functions.

Now you can invoke your Slackbot in Slack!
```
/my-slash-command help
/my-slash-command servers start
/my-slash-command servers stop
/my-slash-command servers status
/my-slash-command deploy my_stack my_app
```
