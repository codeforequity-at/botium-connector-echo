const debug = require('debug')('botium-connector-echo')

class BotiumConnectorEcho {
  constructor ({ queueBotSays }) {
   this.queueBotSays = queueBotSays
  }

  Validate () {
   debug('Validate called')
   return Promise.resolve()
  }

  Build () {
   debug('Build called')
   return Promise.resolve()
  }

  Start () {
   debug('Start called')
   return Promise.resolve()
  }

  UserSays (msg) {
   debug('UserSays called, echo back')
   const botMsg = { sender: 'bot', sourceData: msg.sourceData, messageText: msg.messageText }
   this.queueBotSays(msg)
  }

  Stop () {
   debug('Stop called')
   return Promise.resolve()
  }

  Clean () {
   debug('Clean called')
   return Promise.resolve()
  }
}

module.exports = {
  PluginVersion: 1,
  PluginClass: BotiumConnectorEcho
}
