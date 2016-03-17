module.exports = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'us-east-1',
  description: "Lambda function to support Tags related CRUD",
  handler: 'index.handler',
  role: process.env.AWS_LAMBDA_ROLE_ARN,
  region: 'us-east-1',
  handler: 'index.handler',
  functionName: 'tc-tags-api',
  timeout: 5,
  memorySize: 512
  // eventSource: {}
}
switch (process.env.TRAVIS_BRANCH) {
  case 'dev':
    module.exports.accessKeyId=process.env.DEV_AWS_KEY
    module.exports.secretAccessKey=process.env.DEV_AWS_SECRET
    break;
  case 'release':
    module.exports.accessKeyId=process.env.QA_AWS_KEY
    module.exports.secretAccessKey=process.env.QA_AWS_SECRET
    break;
  case 'master':
    module.exports.accessKeyId=process.env.PROD_AWS_KEY
    module.exports.secretAccessKey=process.env.PROD_AWS_SECRET
    break;
}

