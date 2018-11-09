const debug = require('debug')('botium-connector-echo')

const answers = [
  {
    input: ['buttons', 'show me buttons', 'show me some buttons', 'give me buttons'],
    output: {
      messageText: 'Here are some buttons',
      buttons: [
        { text: 'First Button' },
        { text: 'Second Button' }
      ]
    }
  },
  {
    input: ['picture', 'show me a picture', 'give me a picture'],
    output: {
      messageText: 'Here is a picture',
      media: [
        { altText: 'Botium Logo', mediaUri: 'http://www.botium.at/img/logo.png' }
      ]
    }
  },
  {
    input: ['card', 'show me a card', 'give me a card'],
    output: {
      messageText: 'Here is a card',
      cards: [
        {
          text: 'Botium is great!',
          image: { mediaUri: 'http://www.botium.at/img/logo.png' },
          buttons: [
            { text: 'First Button' },
            { text: 'Second Button' }
          ]
        }
      ]
    }
  }
]

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
    const template = answers.find((a) => a.input.indexOf(msg.messageText) >= 0)
    if (template) {
      setTimeout(() => this.queueBotSays(Object.assign({}, { sender: 'bot', sourceData: msg }, template.output)), 0)
    } else {
      setTimeout(() => this.queueBotSays({ sender: 'bot', sourceData: msg, messageText: 'You said: ' + msg.messageText }), 0)
    }
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
