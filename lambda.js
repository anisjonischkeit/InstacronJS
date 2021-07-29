const instacron = require("./lib")

exports.handler = async function(_event, context) {
    console.log("starting lambda")
    await instacron.run()
    context.succeed();
    return context.logStreamName
}
  
  