const ctrl = require('./egg-rest/prompt')

module.exports = function(plop) {
  plop.setGenerator('ctrl', ctrl)
}
