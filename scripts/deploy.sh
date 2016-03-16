#!/bin/bash
set -e # exit with nonzero exit code if anything fails
echo "Starting Deployment"

if [ ${TRAVIS_BRANCH} == dev ]; then
    AWS_ACCESS_KEY=${DEV_AWS_KEY}
    AWS_ACCESS_KEY_SECRET=${DEV_AWS_SECRET}
elif [ ${TRAVIS_BRANCH} == release ]; then
    AWS_ACCESS_KEY=${QA_AWS_KEY}
    AWS_ACCESS_KEY_SECRET=${QA_AWS_SECRET}
elif [ ${TRAVIS_BRANCH} == master ]; then
    AWS_ACCESS_KEY=${PROD_AWS_KEY}
    AWS_ACCESS_KEY_SECRET=${PROD_AWS_SECRET}
fi

export AWS_ACCESS_KEY
export AWS_ACCESS_KEY_SECRET

./node_modules/.bin/node-lambda deploy