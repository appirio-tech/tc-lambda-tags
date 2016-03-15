module.exports = {
  //profile: <shared credentials profile name>, // optional for loading AWS credentials from custom profile 
  region: 'us-east-1',
  handler: 'index.handler',
  role: 'arn:aws:iam::811668436784:role/ap-lambda-default',
  functionName: 'tc-tags-api',
  timeout: 5,
  memorySize: 512,
  // eventSource: {
  //   EventSourceArn: <event source such as kinesis ARN>,
  //   BatchSize: 200,
  //   StartingPosition: "TRIM_HORIZON"
  // }
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

