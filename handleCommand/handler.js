/**
 * Serverless Module: Lambda Handler
 * - Your lambda functions should be a thin wrapper around your own separate
 * modules, to keep your code testable, reusable and AWS independent
 * - 'serverless-hxelpers-js' module is required for Serverless ENV var support.  Hopefully, AWS will add ENV support to Lambda soon :)
 */

(function() {
    'use strict';

    // Require Logic
    var SlackBot = require('lambda-slack-router');
    var async = require('async');
    var AWS = require('aws-sdk');

    var slackBot = new SlackBot({
        token: process.env.SLACK_VERIFICATION_TOKEN
    });

    slackBot.addCommand('servers', ['command'], 'Manage servers infrastructure. Valid commands are `stop`, `start`, or `status`', function(options, callback) {
        var command = options.args.command.toLowerCase();
        var AUTO_SCALE_SIZE = 10;
        var REDIS_CLUSTER_ID = 'MY_REDIS_CLUSTER';
        var ASG_NAME = 'MY_ASG_NAME'; // TODO accept input from user
        var AWS_REGION = 'us-west-2';
        var AZ_MODE = 'single-az';
        var CACHE_NODE_TYPE = 'cache.r3.xlarge';
        var CACHE_SUBNET_GROUP_NAME = 'MY_CACHE_SUBNET';
        var CACHE_ENGINE = 'redis';
        var CACHE_ENGINE_VERSION = '2.8.24';
        var CACHE_NUM_NODES = 1;
        var CACHE_PORT = 6379;
        var CACHE_SG_IDS = [
            'MY_CACHE_SG'
        ];
        var CACHE_RETENTION_LIMIT = 0;
        var PREFERRED_AVAILABILITY_ZONE = 'us-west-2b';
        var errors = [];
        var userName = options.userName;

        var autoscaling = new AWS.AutoScaling({
            region: AWS_REGION
        });
        var elasticache = new AWS.ElastiCache({
            region: AWS_REGION
        });

        if (command === 'start') {
            async.parallel([
                function(asynccallback) {
                    var params = {
                        AutoScalingGroupName: ASG_NAME,
                        /* required */
                        DesiredCapacity: AUTO_SCALE_SIZE,
                        /* required */
                        HonorCooldown: true
                    };
                    autoscaling.setDesiredCapacity(params, function(err, data) {
                        if (err)
                            console.log(err, err.stack); // an error occurred
                        else
                            console.log(data); // successful response
                        asynccallback(err);
                    });
                },
                function(asynccallback) {
                    var paramsCache = {
                        CacheClusterId: REDIS_CLUSTER_ID,
                        /* required */
                        AZMode: AZ_MODE,
                        AutoMinorVersionUpgrade: true,
                        CacheNodeType: CACHE_NODE_TYPE,
                        // CacheParameterGroupName: null,
                        // CacheSecurityGroupNames: [],
                        CacheSubnetGroupName: CACHE_SUBNET_GROUP_NAME,
                        Engine: CACHE_ENGINE,
                        EngineVersion: CACHE_ENGINE_VERSION,
                        // NotificationTopicArn: null,
                        NumCacheNodes: CACHE_NUM_NODES,
                        Port: CACHE_PORT,
                        PreferredAvailabilityZone: PREFERRED_AVAILABILITY_ZONE,
                        // PreferredAvailabilityZones: [],
                        // PreferredMaintenanceWindow: null,
                        // ReplicationGroupId: null,
                        SecurityGroupIds: CACHE_SG_IDS,
                        // SnapshotArns: [],
                        // SnapshotName: null,
                        SnapshotRetentionLimit: CACHE_RETENTION_LIMIT,
                        // SnapshotWindow: null,
                        // Tags: []
                    };
                    elasticache.createCacheCluster(paramsCache, function(err, data) {
                        if (err)
                            console.log(err, err.stack); // an error occurred
                        else
                            console.log(data); // successful response
                        asynccallback(err);
                    });
                }
            ], function(err) {
                if (err) {
                    console.log(err);
                    callback(null, slackBot.ephemeralResponse({
                        text: 'Errors with starting `' + REDIS_CLUSTER_ID + '` and `' + ASG_NAME + '`. Please see logs for details:',
                        attachments: [{
                            text: JSON.stringify(err, null, 2)
                        }]
                    }));
                } else {
                    callback(null, slackBot.inChannelResponse({
                        text: userName + ' successfully started servers infrastructure `' + REDIS_CLUSTER_ID + '` and `' + ASG_NAME + '`'
                    }));
                }
            });
        } else if (command === 'status') {
            async.parallel([
                function(asynccallback) {
                    var params = {
                        AutoScalingGroupNames: [
                            ASG_NAME,
                            /* more items */
                        ],
                        MaxRecords: 20
                            // NextToken: 'STRING_VALUE'
                    };
                    autoscaling.describeAutoScalingGroups(params, function(err, data) {
                        if (err) {
                            console.log(err, err.stack); // an error occurred
                            asynccallback(err);
                        } else {
                            console.log(data); // successful response
                            asynccallback(null, ASG_NAME, 'has desired capacity of ' + data.AutoScalingGroups[0].DesiredCapacity);
                        }
                    });
                },
                function(asynccallback) {
                    var params = {
                        CacheClusterId: REDIS_CLUSTER_ID,
                        // Marker: 'STRING_VALUE',
                        MaxRecords: 20,
                        ShowCacheNodeInfo: true
                    };
                    elasticache.describeCacheClusters(params, function(err, data) {
                        if (err) {
                            if (err.code === 'CacheClusterNotFound') {
                                asynccallback(null, REDIS_CLUSTER_ID, 'has not been created');
                            } else {
                                console.log(err, err.stack); // an error occurred
                                asynccallback(err);
                            }
                        } else {
                            console.log(data); // successful response
                            asynccallback(null, REDIS_CLUSTER_ID, 'cluster status is ' + data.CacheClusters[0].CacheClusterStatus);
                        }
                    });
                }
            ], function(err, results) {
                if (err) {
                    console.log(err);
                    callback(null, slackBot.ephemeralResponse({
                        text: 'Errors with getting status of `' + REDIS_CLUSTER_ID + '` and `' + ASG_NAME + '`. Please see logs for details:',
                        attachments: [{
                            text: JSON.stringify(err, null, 2)
                        }]
                    }));
                } else {
                    callback(null, slackBot.inChannelResponse({
                        text: 'Status of server infrastructure',
                        attachments: [{
                            title: 'View server dashboard',
                            title_link: 'https://MY_LINK_TO_DASHBOARD',
                            fields: results.map(function(res) {
                                return {
                                    title: res[0],
                                    value: res[1],
                                    short: false
                                };
                            })
                        }]
                    }));
                }
            });
        } else if (command === 'stop') {
            async.parallel([
                function(asynccallback) {
                    var params = {
                        AutoScalingGroupName: ASG_NAME,
                        /* required */
                        DesiredCapacity: 0,
                        /* required */
                        HonorCooldown: true
                    };
                    autoscaling.setDesiredCapacity(params, function(err, data) {
                        if (err)
                            console.log(err, err.stack); // an error occurred
                        else
                            console.log(data); // successful response
                        asynccallback(err);
                    });
                },
                function(asynccallback) {
                    var paramsCache = {
                        CacheClusterId: REDIS_CLUSTER_ID /* required */
                    };
                    elasticache.deleteCacheCluster(paramsCache, function(err, data) {
                        if (err)
                            console.log(err, err.stack); // an error occurred
                        else
                            console.log(data); // successful response
                        asynccallback(err);
                    });
                }
            ], function(err) {
                if (err) {
                    console.log(err);
                    callback(null, slackBot.ephemeralResponse({
                        text: 'Errors with starting `' + REDIS_CLUSTER_ID + '` and `' + ASG_NAME + '`. Please see logs for details:',
                        attachments: [{
                            text: JSON.stringify(err, null, 2)
                        }]
                    }));
                } else {
                    callback(null, slackBot.inChannelResponse({
                        text: userName + ' successfully stopped server infrastructure `' + REDIS_CLUSTER_ID + '` and `' + ASG_NAME + '`'
                    }));
                }
            });
        } else {
            callback(null, slackBot.ephemeralResponse('Invalid command switch. Valid commands are `stop`, `start`, `status`, or `progress`'));
        }
    });

    slackBot.addCommand('deploy', ['stack', 'app', {
        migrate: 'false'
    }], 'Trigger an application deploy', function(options, callback) {

        var opsworks = new AWS.OpsWorks({
            region: 'us-east-1'
        });
        var stack = options.args.stack;
        var app = options.args.app;
        var migrate = options.args.migrate.toLowerCase();
        var userName = options.userName;

        console.log('Running /deploy with the following switches: ' + stack + ' ' + app + ' ' + migrate);

        if (migrate !== 'false' && migrate !== 'true') {
            console.log('Invalid migration switch, please use "true" or "false". User input was: ' + migrate);
            // callback(null, slackBot.ephemeralResponse('Invalid migration switch, please use true or false'));
            callback(null, slackBot.ephemeralResponse('Invalid migration switch, please use `true` or `false` instead of ' + migrate));
        } else {
            // find app in Opsworks, stack_id and app_id
            async.waterfall([
                function(asynccallback) {
                    var opsworksParams = {};
                    console.log('describing stacks with opsworksParams = ' + JSON.stringify(opsworksParams));
                    opsworks.describeStacks(opsworksParams, function(err, data) {
                        if (err) {
                            console.log(err, err.stack); // an error occurred
                            asynccallback(slackBot.ephemeralResponse({
                                text: 'Error describing stacks',
                                attachments: [{
                                    text: JSON.stringify(err, null, 2)
                                }]
                            }));
                        } else {
                            asynccallback(null, data);
                        }
                    });
                },
                function(data, asynccallback) {
                    var stackId;
                    console.log('Received data from describeStacks()'); // successful response
                    data.Stacks.forEach(function(currentValue, index, array) {
                        if (currentValue.Name === stack) {
                            stackId = currentValue.StackId;
                            console.log('Request stack ' + stack + ' has an ID of ' + stackId);
                        }
                    });
                    if (stackId === null || stackId === undefined) {
                        console.log('Unable to find requested stack: ' + stack);
                        asynccallback(slackBot.ephemeralResponse('Unable to find requested stack: ' + stack));
                        // callback(null, slackBot.ephemeralResponse('Unable to find requested stack: ' + stack));
                    } else {
                        asynccallback(null, stackId);
                    }
                },
                function(stackId, asynccallback) {
                    var appId;
                    var appRevision;
                    var opsworksParams = {
                        StackId: stackId
                    };
                    console.log('describing apps with opsworksParams = ' + JSON.stringify(opsworksParams));
                    opsworks.describeApps({
                        StackId: stackId
                    }, function(err, data) {
                        if (err) {
                            console.log(err, err.stack); // an error occurred
                            asynccallback(slackBot.ephemeralResponse({
                                text: 'Error describing applications',
                                attachments: [{
                                    text: JSON.stringify(err, null, 2)
                                }]
                            }));
                        } else {
                            console.log('received data from describeApps()'); // successful response
                            var appId;
                            var appRevision;
                            data.Apps.forEach(function(currentValue, index, array) {
                                if (currentValue.Name === app) {
                                    appId = currentValue.AppId;
                                    appRevision = currentValue.AppSource.Revision;
                                }
                            });
                            if (appId === null || appId === undefined) {
                                console.log('Unable to find requested app: ' + app);
                                asynccallback(slackBot.ephemeralResponse('Unable to find requested app: ' + app));
                            } else {
                                asynccallback(null, stackId, appId, appRevision);
                            }
                        }
                    });
                },
                function(stackId, appId, appRevision, asynccallback) {
                    // trigger a deploy
                    var opsworksParams = {
                        Command: { /* required */
                            Name: 'deploy',
                            /* required */
                            Args: {
                                migrate: [
                                    migrate
                                ]
                            }
                        },
                        StackId: stackId,
                        /* required */
                        AppId: appId,
                        Comment: 'triggered from Slack by ' + userName
                            // CustomJson: 'STRING_VALUE',
                            // InstanceIds: []
                    };
                    opsworks.createDeployment(opsworksParams, function(err, data) {
                        if (err) {
                            console.log(err, err.stack); // an error occurred
                            asynccallback(slackBot.ephemeralResponse('Unable to create deployment'));
                        } else {
                            console.log(data); // successful response
                            var response = 'https://console.aws.amazon.com/opsworks/home?region=' + AWS_REGION + '#stack/' + stackId + '/deployments/' + data.DeploymentId;
                            asynccallback(null, slackBot.inChannelResponse({
                                text: userName + ' successfully started deployment of `' + app + '` at `' + appRevision + '` on `' + stack + '`. Check on status at link below:',
                                attachments: [{
                                    text: JSON.stringify(response)
                                }]
                            }));
                        }
                    });
                }
            ], function(err, result) {
                if (err) {
                    console.log('Error with creating deployment');
                    callback(null, err);
                } else {
                    console.log('Success with creating deployment');
                    callback(null, result);
                }
            });
        }
    });

    // Router configuration
    module.exports.handler = slackBot.buildRouter();
    module.exports.slackBot = slackBot;
}());
