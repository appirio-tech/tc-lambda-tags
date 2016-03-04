/** == Imports == */
var AWS = require('aws-sdk');
/*
 * The AWS credentials are picked up from the environment.
 * They belong to the IAM role assigned to the Lambda function.
 * Since the ES requests are signed using these credentials,
 * make sure to apply a policy that allows ES domain operations
 * to the role.
 */
var creds = new AWS.EnvironmentCredentials('AWS');

var es = require('elasticsearch').Client({
    hosts: 'search-topcoder-squ62azmqlwkvnmztjmk4cq5fq.us-east-1.es.amazonaws.com',
    connectionClass: require('http-aws-es'),
    amazonES: {
        region: "us-east-1",
        credentials: creds
    }
});

/**
 * Provide an event that contains the following keys:
 *
 *   - operation: one of the operations in the switch statement below
 *   - tableName: required for operations that interact with DynamoDB
 *   - payload: a parameter to pass to the operation being performed
 */
exports.handler = function(event, context) {
    console.log('Received event:', JSON.stringify(event, null, 2));

    var operation = event.operation;
    // validations
    if (operation === 'search' || operation == 'suggest') {
        if (!event.term || !event.term.length) {
            context.fail(new Error("400_BAD_REQUEST - search term should not be empty"))
        }
    }

    switch (operation) {
        case 'search':
            es.search({
                index: 'tags',
                type: 'tag',
                body: {
                    query: {
                        match: {
                            name: event.term
                        }
                    }
                }
            }).then(function(resp) {
                context.succeed(wrapResponse(context, 200, resp.hits.hits, resp.hits.total));
            }, function(err) {
                console.log(err.message)
                context.fail(new Error(err.message));
            })
            break;
        case 'suggest':
            es.suggest({
                index: 'tags',
                body: {
                    "tag-suggest": {
                        "text": event.term,
                        "completion": {
                            "field": "suggest"
                        }
                    }
                }
            }).then(function(resp) {
                context.succeed(wrapResponse(context, 200, resp['tag-suggest'].options), resp['tag-suggest'].length);
            }, function(err) {
                console.log(err.message)
                context.fail(new Error(err.message));
            })
            break;
        case 'ping':
            context.succeed('pong');
            break;
        default:
            context.fail(new Error('Unrecognized operation "' + operation + '"'));
    }
};


function wrapResponse(context, status, body, count) {
    return {
        id: context.awsRequestId,
        result: {
            success: status === 200,
            status: status,
            metadata: {
                totalCount: count
            },
            content: body
        }
    }
}
