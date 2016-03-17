/** == Imports == */
var AWS = require('aws-sdk'),
  _ = require('lodash');

/*
 * The AWS credentials are picked up from the environment.
 * They belong to the IAM role assigned to the Lambda function.
 * Since the ES requests are signed using these credentials,
 * make sure to apply a policy that allows ES domain operations
 * to the role.
 */
var creds = new AWS.EnvironmentCredentials('AWS');
var querystring = require('querystring')
var es = require('elasticsearch').Client({
  hosts: process.env.TAGS_ES_HOST,
  apiVersion: '1.5',
  connectionClass: require('http-aws-es'),
  amazonES: {
    region: "us-east-1",
    credentials: creds
  }
});

String.prototype.endsWith = function(str) {
  var lastIndex = this.lastIndexOf(str);
  return (lastIndex !== -1) && (lastIndex + str.length === this.length);
}

/**
 * Entry point for lambda function handler
 */
exports.handler = function(event, context) {
  console.log('Received event:', JSON.stringify(event, null, 2));
  var operation = getOperation(event, context)

  // convert query params to JSON
  switch (operation) {
    case 'SEARCH':
      // make sure name param was passed is non-empty
      var filter = _.get(event, 'queryParams.filter', '')
      filter = querystring.parse(decodeURIComponent(filter))
      var term = _.get(filter, 'name', '')
      if (term.length == 0) {
        context.fail(new Error("400_BAD_REQUEST: 'name' param is currently required to filter"));
      } else {
        es.search({
          index: 'tags',
          type: 'tag',
          body: {
            query: {
              match: {
                name: term
              }
            }
          }
        }).then(function(resp) {
          console.log('Resp', JSON.stringify(resp, null, 2))
          var content = resp.hits.hits.map(function(obj) {
            // remove suggest prop from response
            delete obj._source.suggest
            return obj._source;
          });
          console.log('Content', JSON.stringify(content, null, 2))
          context.succeed(wrapResponse(context, 200, content, resp.hits.total))
        }, function(err) {
          context.fail(new Error("500_INTERNAL_ERROR " + err.message));
        })
      }
      break
    case 'SUGGEST':
      var term = _.get(event, 'queryParams.q', '')
      term = decodeURIComponent(term)
      if (term.length == 0) {
        context.fail(new Error("400_BAD_REQUEST: 'q' param is required for auto-complete"));
      } else {
        es.suggest({
          index: 'tags',
          body: {
            "tag-suggest": {
              "text": term,
              "completion": {
                "field": "suggest"
              }
            }
          }
        }).then(function(resp) {
          var content = resp['tag-suggest'][0].options
          context.succeed(wrapResponse(context, 200, content, content.length));
        }, function(err) {
          context.fail(new Error("500_INTERNAL_ERROR" + err.message));
        })
      }
      break;
    case 'ping':
      context.succeed('pong');
      break;
    default:
      context.fail(new Error('400_BAD_REQUEST: Unrecognized operation "' + operation + '"'));
  }
}


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

/**
 * @brief Determine description based on request context
 * 
 * @param event lambda event obj
 * @param context lambda context
 * 
 * @return String operation
 */
function getOperation(event, context) {
  switch (event.httpMethod.toUpperCase()) {
    case 'GET':
      if (event.resourcePath.endsWith('tags') || event.resourcePath.endsWith('tags/')) {
        return 'SEARCH'
      } else if (event.resourcePath.endsWith('_suggest') || event.resourcePath.endsWith('_suggest/')) {
        return 'SUGGEST'
      }
    default:
      return null
  }
}