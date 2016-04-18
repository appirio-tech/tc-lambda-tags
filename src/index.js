/** == Imports == */
var AWS = require('aws-sdk');
var _   = require('lodash');
var querystring = require('querystring')

/*
 * The AWS credentials are picked up from the environment.
 * They belong to the IAM role assigned to the Lambda function.
 * Since the ES requests are signed using these credentials,
 * make sure to apply a policy that allows ES domain operations
 * to the role.
 */
var creds = new AWS.EnvironmentCredentials('AWS');
var es = require('elasticsearch').Client({
  hosts: process.env.TAGS_ES_HOST,
  apiVersion: '1.5',
  connectionClass: require('http-aws-es'),
  amazonES: {
    region: 'us-east-1',
    credentials: creds
  }
});

// Entry point for the lambda function handler
exports.handler = function(event, context) {
  console.log('Received event:', JSON.stringify(event, null, 2));

  var operation = getOperation(event, context)

  // Convert query params to JSON
  switch (operation) {
    case 'SEARCH':
      var filterFromURL = _.get(event, 'params.querystring.filter', '')

      // Replace %3D with = so that querystring.parse works correctly
      var modifiedFilter = _.replace(filterFromURL, '%3D', '=')
      filter = querystring.parse(modifiedFilter)

      // Make sure name param was passed is non-empty
      var term = _.get(filter, 'name', '')

      if (term.length == 0) {
        context.fail(new Error('400_BAD_REQUEST: \'name\' param is currently required to filter'));
      } else {
        console.log('Term to send to es: ', term)

        es.search({
          index: 'tags',
          type: 'tag',
          body: {
            query: {
              term: {
                name: term
              }
            }
          }
        }).then(function(resp) {
          console.log('Resp', JSON.stringify(resp, null, 2))

          var content = resp.hits.hits.map(function(obj) {
            // Remove suggest prop from response
            delete obj._source.suggest
            return obj._source;
          });

          console.log('Content', JSON.stringify(content, null, 2))

          context.succeed(wrapResponse(context, 200, content, resp.hits.total))
        }, function(err) {
          context.fail(new Error('500_INTERNAL_ERROR ' + err.message));
        })
      }
      break
    case 'SUGGEST':
      var term = _.get(event, 'params.querystring.q', '')
      term = decodeURIComponent(term)

      if (term.length == 0) {
        context.fail(new Error('400_BAD_REQUEST: \'q\' param is required for auto-complete'));
      } else {
        es.suggest({
          index: 'tags',
          body: {
            'tag-suggest': {
              text: term,
              completion: {
                field: 'suggest'
              }
            }
          }
        }).then(function(resp) {
          var content = resp['tag-suggest'][0].options

          context.succeed(wrapResponse(context, 200, content, content.length));
        }, function(err) {
          context.fail(new Error('500_INTERNAL_ERROR' + err.message));
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
  var method = _.get(event, 'context.http-method', '')
  var resourcePath = _.get(event, 'context.resource-path', '')

  switch (method.toUpperCase()) {
    case 'GET':
      if (_.endsWith(resourcePath, 'tags') || _.endsWith(resourcePath, 'tags/')) {
        return 'SEARCH'
      } else if (_.endsWith(resourcePath, '_suggest') || _.endsWith(resourcePath, '_suggest/')) {
        return 'SUGGEST'
      }
    default:
      return null
  }
}
