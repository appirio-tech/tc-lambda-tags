/**
 * Add mocks here .. cos well.. just do it..
 */

var mockEvent = {
  "body-json": {},
  "params": {
      "path": {},
      "querystring": {
          "filter": "name%3Dc%2B%2B"
      },
      "header": {}
  },
  "stage-variables": {},
  "context": {
    "account-id": "811668436784",
    "api-id": "bd1cmoh5ag",
    "api-key": "test-invoke-api-key",
    "authorizer-principal-id": "",
    "caller": "AIDAJUYC3TUFF3VEGQ5PQ",
    "cognito-authentication-provider": "",
    "cognito-authentication-type": "",
    "cognito-identity-id": "",
    "cognito-identity-pool-id": "",
    "http-method": "GET",
    "stage": "test-invoke-stage",
    "source-ip": "test-invoke-source-ip",
    "user": "AIDAJUYC3TUFF3VEGQ5PQ",
    "user-agent": "Apache-HttpClient/4.3.4 (java 1.5)",
    "user-arn": "arn:aws:iam::811668436784:user/nlitwin",
    "request-id": "test-invoke-request",
    "resource-id": "m3zey8",
    "resource-path": "/v3/tags"
  }
}

var _ = require('lodash')
var elasticsearch = require('elasticsearch')
var es = {}
elasticsearch.Client = function() {
  return es
}
require('es6-promise').polyfill();

var chai = require("chai");
var expect = require("chai").expect,
  lambdaToTest = require('./index.js');

sinon = require("sinon");
chai.use(require('sinon-chai'));
var context = require('aws-lambda-mock-context');

var testLambda = function(event, ctx, resp) {
  // Fires once for the group of tests, done is mocha's callback to
  // let it know that an   async operation has completed before running the rest
  // of the tests, 2000ms is the default timeout though
  before(function(done) {
    //This fires the event as if a Lambda call was being sent in
    lambdaToTest.handler(event, ctx)
      //Captures the response and/or errors
    ctx.Promise
      .then(function(response) {
        resp.success = response;
        done();
      })
      .catch(function(err) {
        resp.error = err;
        done();
      })
  })
}

describe('When receiving an invalid request', function() {
  var resp = { success: null, error: null };
  var ctx = context()
  var myMock = _.cloneDeep(mockEvent)
  myMock.context['resource-path'] = '/v3/tags1'
  testLambda(myMock, ctx, resp)

  describe('then response object ', function() {
    it('should be an error object', function() {
      console.log(resp.error)
      expect(resp.error).to.exist
        .and.be.instanceof(Error)
    })

    it('should contain 400 error msg', function() {
      expect(resp.error.message).to.match(/400_BAD_REQUEST/)
    })
  })
})

describe('When receiving a valid search request', function() {
  var resp = { success: null, error: null }
  var ctx = context()

  es.search = function(input) {
    return Promise.resolve({
      "took": 31,
      "timed_out": false,
      "_shards": {
        "total": 5,
        "successful": 5,
        "failed": 0
      },
      "hits": {
        "total": 1,
        "max_score": 4.5115457,
        "hits": [{
          "_index": "tags",
          "_type": "tag",
          "_id": "247",
          "_score": 4.5115457,
          "_source": {
            "domain": "SKILLS",
            "name": "Java",
            "id": 247,
            "categories": [
              "DEVELOP"
            ],
            "priority": 14,
            "status": "APPROVED",
            "suggest": {
              "input": "Java",
              "output": "Java",
              "payload": {
                "id": 247,
                "domain": "SKILLS"
              }
            }
          }
        }]
      }
    })
  }
  testLambda(mockEvent, ctx, resp)

  describe('then success response ', function() {
    var spy = sinon.spy(es, 'search')
    it('should be a valid response', function() {
      var result = resp.success.result
      console.log(result)
      expect(spy.calledOnce).to.be.true
      expect(resp.success.result).to.not.be.null
      expect(result.success).to.be.true
      expect(result.metadata).to.deep.equal({ totalCount: 1 })
      expect(result.status).to.equal(200)
      expect(result.content).to.have.lengthOf(1)
    })
  })
})

xdescribe('When receiving a valid suggest request', function() {
  var resp = { success: null, error: null };
  var ctx = context()

  es.suggest = function(input) {
    return Promise.resolve({
      "_shards": {
        "total": 5,
        "successful": 5,
        "failed": 0
      },
      "tag-suggest": [{
        "text": "jav",
        "offset": 0,
        "length": 3,
        "options": [{
          "text": "Java",
          "score": 1,
          "payload": {
            "id": 247,
            "domain": "SKILLS"
          }
        }, {
          "text": "JavaScript",
          "score": 1,
          "payload": {
            "id": 248,
            "domain": "SKILLS"
          }
        }]
      }]
    })
  }
  testLambda(mockEvent, ctx, resp)

  describe('then success response ', function() {
    var spy = sinon.spy(es, 'suggest')
    it('should be a valid response', function() {
      expect(spy.calledOnce).to.be.true
      expect(resp.success.result).to.not.be.null
      var result = resp.success.result
      expect(result.success).to.be.true
      expect(result.metadata).to.deep.equal({ totalCount: 2 })
      expect(result.status).to.equal(200)
      expect(result.content).to.have.lengthOf(2)
    })
  })
})
