const AWS = require('aws-sdk')
const Promise = require('bluebird')

const localConfig = require('./config.json')
const configBuilder = require('./src/configBuilder')
const run = require('./src/run')

AWS.config.setPromisesDependency(Promise)

// Lambda Handler
module.exports.handler = function handler (event, context) {
  const config = configBuilder(localConfig, context)
  // Check event for dry run, which prevents actual deletion
  // check logs to see what would have been deleted
  console.log(event)
  const ecr = new AWS.ECR({ region: config.REGION })
  const ecs = new AWS.ECS({ region: config.ECS_REGION })

  if (Array.isArray(config.REPO_TO_CLEAN)) {
    const tasks = config.REPO_TO_CLEAN.map(repoName => {
      const configRepo = Object.assign({}, config, { REPO_TO_CLEAN: repoName })
      return run(configRepo, ecr, ecs)
    })
    return Promise.all(tasks)
      .then(context.succeed)
      .catch(context.fail)
  }

  return run(config, ecr, ecs)
    .then(context.succeed)
    .catch(context.fail)
}
