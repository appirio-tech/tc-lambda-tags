var chai = require("chai");
var expect = require("chai").expect,
  lambdaToTest = require('../index');

  sinon = require("sinon");
chai.use(require('sinon-chai'));

const context = require('aws-lambda-mock-context');

var testLambda = function(event, ctx, resp) {
  // Fires once for the group of tests, done is mocha's callback to 
  // let it know that an   async operation has completed before running the rest 
  // of the tests, 2000ms is the default timeout though
  before(function(done) {
    //This fires the event as if a Lambda call was being sent in
    lambdaToTest.handler(event, ctx)
      //Captures the response and/or errors
    ctx.Promise
      .then(response => {
        resp.success = response;
        done();
      })
      .catch(err => {
        resp.error = err;
        done();
      })
  })
}

describe('When receiving an invalid request', function() {
  var resp = {success: null, error: null};
  const ctx = context()
  testLambda({
    operation: 'search1',
    term: 'java',
    "request": {
      "type": "LaunchRequest",
      "requestId": "request5678"
    }
  }, ctx, resp)

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

// describe.skip('When receiving a valid search request', function() {
//   var resp = {success: null, error: null};
//   const ctx = context();
//   var sandbox, esStub;
//   sandbox = sinon.sandbox.create();
//   esStub = sandbox.stub(es)

//   testLambda({
//     operation: 'search',
//     term: 'java',
//     "request": {
//       "type": "LaunchRequest",
//       "requestId": "request5678"
//     }
//   }, ctx, resp)

//   describe.skip('then success response ', function() {
//     it('should be a valid response', function() {
//       console.log(resp.error)
//       expect(resp.success).to.not.be.null
//     })
//   })
// })
