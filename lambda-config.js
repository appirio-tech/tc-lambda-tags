module.exports = {
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET,
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