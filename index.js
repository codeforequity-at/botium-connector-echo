const fs = require('fs')
const path = require('path')
const _ = require('lodash')
const debug = require('debug')('botium-connector-echo')

const Capabilities = {
  ECHO_ANSWERS: 'ECHO_ANSWERS',
  ECHO_WELCOMEMESSAGE: 'ECHO_WELCOMEMESSAGE',
  ECHO_DELAY: 'ECHO_DELAY',
  ECHO_DELAY_INCREASE: 'ECHO_DELAY_INCREASE'
}

const GlobalState = {
  delaySlowdown: 0
}

const audioFile = 'file_example_MP3_700KB.mp3'
let audioBuffer = null
if (fs.existsSync(path.join(__dirname, audioFile))) {
  audioBuffer = Buffer.from(fs.readFileSync(path.join(__dirname, audioFile)))
} else if (fs.existsSync(path.join(__dirname, '..', audioFile))) {
  audioBuffer = Buffer.from(fs.readFileSync(path.join(__dirname, '..', audioFile)))
}

const videoFile = 'mov_bbb.mp4'
let videoBuffer = null
if (fs.existsSync(path.join(__dirname, videoFile))) {
  videoBuffer = Buffer.from(fs.readFileSync(path.join(__dirname, videoFile)))
} else if (fs.existsSync(path.join(__dirname, '..', videoFile))) {
  videoBuffer = Buffer.from(fs.readFileSync(path.join(__dirname, '..', videoFile)))
}

class BotiumConnectorEcho {
  constructor ({ queueBotSays, caps }) {
    this.queueBotSays = queueBotSays
    this.caps = caps
    this.session = {}
    this.welcomeMessages = []
    this.answers = [
      {
        input: ['help'],
        output: (msg, session) => ({
          messageText: 'Recognized commands: ' + this.answers.map(a => a.input.join(', ')).join(', '),
          nlp: {
            intent: {
              name: 'help',
              confidence: 1
            }
          }
        })
      },
      {
        input: ['fail'],
        output: (msg, session) => {
          throw new Error('Here is a delivery failure')
        }
      },
      {
        input: ['random fail'],
        output: (msg, session) => {
          const possibility = Math.random()
          if (possibility < 0.5) {
            throw new Error(`Here is a random delivery failure (${possibility})`)
          }
          return {
            messageText: `Delivery succesful (${possibility})`
          }
        }
      },
      {
        input: ['add to cart'],
        output: (msg, session) => {
          const item = msg.messageText.substr(11).trim()
          if (!session.cart) session.cart = []
          session.cart.push(item)
          return {
            messageText: `Added to cart: ${item}`,
            nlp: {
              intent: {
                name: 'addtocart',
                confidence: 0.8
              },
              entities: [
                { name: 'product', value: item, confidence: 0.7 }
              ]
            }
          }
        }
      },
      {
        input: ['show cart'],
        output: (msg, session) => {
          return {
            messageText: `In your cart: ${(session.cart || []).join(', ')}`,
            nlp: {
              intent: {
                name: 'showcart',
                confidence: 0.8
              }
            }
          }
        }
      },
      {
        input: ['clear cart'],
        output: (msg, session) => {
          session.cart = []
          return {
            messageText: 'Your cart is now empty',
            nlp: {
              intent: {
                name: 'clearcart',
                confidence: 0.8
              }
            }
          }
        }
      },
      {
        input: ['weak intent'],
        output: {
          messageText: 'This is an intent with weak confidence (0.3)',
          nlp: {
            intent: {
              name: 'weak',
              confidence: 0.3
            }
          }
        }
      },
      {
        input: ['duplicate intent'],
        output: {
          messageText: 'Identified two intents with same confidence',
          nlp: {
            intent: {
              name: 'dupintent1',
              confidence: 0.7,
              intents: [
                { name: 'dupintent2', confidence: 0.7 },
                { name: 'dupintent3', confidence: 0.6 }
              ]
            }
          }
        }
      },
      {
        input: ['button', 'buttons', 'show me buttons', 'show me some buttons', 'give me buttons', 'give me a button'],
        output: {
          messageText: 'Here are some buttons',
          buttons: [
            { text: 'First Button' },
            { text: 'Second Button' }
          ],
          nlp: {
            intent: {
              name: 'buttons',
              confidence: 0.8
            }
          }
        }
      },
      {
        input: ['picture', 'pictures', 'show me pictures', 'show me a picture', 'give me a picture', 'give me pictures'],
        output: {
          messageText: 'Here is a picture',
          media: [
            { altText: 'Botium Logo', mediaUri: 'https://www.botium.ai/wp-content/uploads/2020/03/logo.png' }
          ],
          nlp: {
            intent: {
              name: 'picture',
              confidence: 0.8
            }
          }
        }
      },
      {
        input: ['card', 'show me a card', 'give me a card'],
        output: {
          messageText: 'Here is a card',
          cards: [
            {
              text: 'Botium is great!',
              image: { mediaUri: 'https://www.botium.ai/wp-content/uploads/2020/03/logo.png' },
              buttons: [
                { text: 'First Button' },
                { text: 'Second Button' }
              ]
            }
          ],
          nlp: {
            intent: {
              name: 'card',
              confidence: 0.8
            }
          }
        }
      },
      {
        input: ['audio', 'show me an audio', 'give me an audio'],
        output: (msg, session) => {
          if (!audioBuffer) {
            throw new Error(`Audio file ${audioFile} not found`)
          }
          return {
            messageText: 'Here is an audio',
            media: [{
              mediaUri: `data:audio/mp3;base64,${audioBuffer.toString('base64')}`,
              mimeType: 'audio/mp3'
            }],
            nlp: {
              intent: {
                name: 'audio',
                confidence: 0.8
              }
            }
          }
        }
      },
      {
        input: ['form'],
        output: {
          messageText: 'Here is a formc',
          forms: [
            {
              type: 'Text',
              name: 'username',
              label: 'User name',
              value: 'Joe'
            },
            {
              type: 'ChoiceSet',
              name: 'title',
              label: 'Title',
              value: 'no',
              options: [
                { title: '<no title>', value: 'no' },
                { title: 'Miss', value: 'miss' },
                { title: 'Mr', value: 'mr' }
              ]
            }
          ],
          nlp: {
            intent: {
              name: 'formcard',
              confidence: 0.8
            }
          }
        }
      },
      {
        input: ['attachment', 'audio attachment'],
        output: (msg, session) => {
          if (!audioBuffer) {
            throw new Error(`Audio file ${audioFile} not found`)
          }
          return {
            messageText: 'An audio is attached to this message',
            attachments: [
              {
                name: audioFile,
                mimeType: 'audio/mp3',
                base64: audioBuffer.toString('base64')
              }
            ],
            nlp: {
              intent: {
                name: 'audioattachment',
                confidence: 0.8
              }
            }
          }
        }
      },
      {
        input: ['video', 'show me a video', 'give me a video'],
        output: (msg, session) => {
          if (!videoBuffer) {
            throw new Error(`Video file ${videoFile} not found`)
          }
          return {
            messageText: 'Here is a video',
            media: [{
              mediaUri: `data:video/mp4;base64,${videoBuffer.toString('base64')}`,
              mimeType: 'video/mp4'
            }],
            nlp: {
              intent: {
                name: 'video',
                confidence: 0.8
              }
            }
          }
        }
      },
      {
        input: ['videoattachment'],
        output: (msg, session) => {
          if (!videoBuffer) {
            throw new Error(`Video file ${videoFile} not found`)
          }
          return {
            messageText: 'A video is attached to this message',
            attachments: [
              {
                name: videoFile,
                mimeType: 'video/mp4',
                base64: videoBuffer.toString('base64')
              }
            ],
            nlp: {
              intent: {
                name: 'videoattachment',
                confidence: 0.8
              }
            }
          }
        }
      }
    ]
    this.echoDelay = 0
  }

  Build () {
    if (this.caps[Capabilities.ECHO_ANSWERS]) {
      const extraAnswers = _.isString(this.caps[Capabilities.ECHO_ANSWERS]) ? JSON.parse(this.caps[Capabilities.ECHO_ANSWERS]) : this.caps[Capabilities.ECHO_ANSWERS]
      this.answers = this.answers.concat(extraAnswers)
      for (const a of this.answers) {
        if (_.isString(a.input)) a.input = [a.input]
      }
    }
    if (this.caps[Capabilities.ECHO_WELCOMEMESSAGE]) {
      const extraWelcomeMessages = _.isString(this.caps[Capabilities.ECHO_WELCOMEMESSAGE])
        ? JSON.parse(this.caps[Capabilities.ECHO_WELCOMEMESSAGE])
        : this.caps[Capabilities.ECHO_WELCOMEMESSAGE]
      this.welcomeMessages = this.welcomeMessages.concat(extraWelcomeMessages)
    }
    if (this.caps[Capabilities.ECHO_DELAY]) {
      this.echoDelay = this.caps[Capabilities.ECHO_DELAY]
    }
  }

  Start () {
    this.session = {}

    for (const welcomeMessage of this.welcomeMessages) {
      let botMsg = {
        sender: 'bot'
      }
      if (_.isString(welcomeMessage)) {
        botMsg.messageText = welcomeMessage
      } else if (_.isFunction(welcomeMessage.output)) {
        botMsg = Object.assign(botMsg, welcomeMessage.output({}, this.session))
      } else if (_.isString(welcomeMessage.output)) {
        botMsg.messageText = welcomeMessage.output
      } else {
        botMsg = Object.assign(botMsg, welcomeMessage.output)
      }
      setTimeout(() => this.queueBotSays(botMsg), 0)
    }
  }

  UserSays (msg) {
    debug('UserSays called, echo back')

    let botMsg = {
      sender: 'bot',
      sourceData: {
        request: {
          messageText: msg.messageText,
          buttons: msg.buttons,
          media: msg.media
        }
      }
    }

    let template = null
    if (msg.messageText) {
      template = this.answers.find(a => {
        if (a.input.findIndex(u => u.toLowerCase() === msg.messageText.toLowerCase()) >= 0) return true
        return false
      })
      if (!template) {
        const parts = msg.messageText.split(' ')
        if (parts.length > 1) {
          template = this.answers.find(a => {
            if (a.input.findIndex(u => u.toLowerCase().startsWith(parts[0].toLowerCase())) >= 0) return true
            return false
          })
        }
      }
    }
    if (template && template.output) {
      if (_.isFunction(template.output)) {
        botMsg = Object.assign(botMsg, template.output(msg, this.session))
      } else if (_.isString(template.output)) {
        botMsg.messageText = template.output
      } else {
        botMsg = Object.assign(botMsg, template.output)
      }
    } else if (msg.buttons && msg.buttons.length > 0) {
      botMsg.messageText = `BUTTON PRESSED: ${msg.buttons[0].text || msg.buttons[0].payload}`
    } else if (msg.media && msg.media.length > 0) {
      const media = msg.media[0]
      const mediaName = decodeURIComponent(path.basename(media.downloadUri || media.mediaUri) || '-')
      botMsg.messageText = `RECEIVED FILE: ${mediaName}`
      botMsg.media = [{
        mediaUri: media.mediaUri,
        downloadUri: media.downloadUri,
        mimeType: media.mimeType,
        buffer: media.buffer
      }]
      if (media.buffer) {
        botMsg.attachments = [{
          name: mediaName,
          mimeType: media.mimeType,
          base64: media.buffer.toString('base64')
        }]
      }
    } else {
      botMsg.messageText = 'You said: ' + (msg.messageText || '-')
    }

    botMsg.sourceData.session = JSON.parse(JSON.stringify(this.session))
    setTimeout(() => this.queueBotSays(botMsg), this.echoDelay + GlobalState.delaySlowdown)

    if (this.caps[Capabilities.ECHO_DELAY_INCREASE]) {
      GlobalState.delaySlowdown += this.caps[Capabilities.ECHO_DELAY_INCREASE]
    }
  }
}

module.exports = {
  PluginVersion: 1,
  PluginClass: BotiumConnectorEcho,
  Import: {
    Handler: () => {
      return {
        convos: [
          {
            header: { name: 'TC01 - buttons' },
            conversation: [
              { sender: 'me', messageText: 'buttons' },
              {
                sender: 'bot',
                asserters: [
                  {
                    name: 'INTENT',
                    args: ['buttons']
                  }
                ]
              }
            ]
          },
          {
            header: { name: 'TC02 - pictures' },
            conversation: [
              { sender: 'me', messageText: 'picture' },
              {
                sender: 'bot',
                asserters: [
                  {
                    name: 'INTENT',
                    args: ['picture']
                  }
                ]
              }
            ]
          },
          {
            header: { name: 'TC03 - cards' },
            conversation: [
              { sender: 'me', messageText: 'card' },
              {
                sender: 'bot',
                asserters: [
                  {
                    name: 'INTENT',
                    args: ['card']
                  }
                ]
              }
            ]
          }
        ],
        utterances: [
          {
            name: 'buttons',
            utterances: ['buttons', 'show me buttons', 'show me some buttons', 'give me buttons']
          },
          {
            name: 'picture',
            utterances: ['picture', 'show me a picture', 'give me a picture']
          },
          {
            name: 'card',
            utterances: ['card', 'show me a card', 'give me a card']
          }
        ]
      }
    },
    Args: {}
  },
  Export: {
    Handler: ({ ...rest } = {}, { convos, utterances } = {}, { statusCallback } = {}) => {
      if (statusCallback) {
        statusCallback(`Exporting ${convos ? convos.length : 0} convo(s)`)
        statusCallback(`Exporting ${utterances ? utterances.length : 0} utterance(s)`)
      }
      return {}
    },
    Args: {}
  },
  PluginDesc: {
    name: 'Botium Sample Chatbot (Echo)',
    provider: 'Botium',
    features: {
      intentResolution: true,
      intentConfidenceScore: true,
      alternateIntents: true,
      entityResolution: true,
      entityConfidenceScore: true,
      testCaseGeneration: true,
      testCaseExport: true,
      audioInput: true
    },
    capabilities: [
      {
        name: Capabilities.ECHO_WELCOMEMESSAGE,
        label: 'Welcome Messages',
        description: 'JSON-Array holding the welcome messages to send for a new session (example: [ "Hello!", "My name is Dave. How can I help you ?" ])',
        type: 'json',
        required: false,
        advanced: true
      },
      {
        name: Capabilities.ECHO_ANSWERS,
        label: 'Customize Responses',
        description: 'JSON-Structure holding keywords to detect and response (example: { "input": "special", "output": { "messageText": "something special", "nlp": { "intent": { "name": "extra2", "confidence": 0.8 } } } })',
        type: 'json',
        required: false,
        advanced: true
      },
      {
        name: Capabilities.ECHO_DELAY,
        label: 'Delay response',
        description: 'Delay for sending responses in milliseconds',
        type: 'int',
        required: false,
        advanced: true
      },
      {
        name: Capabilities.ECHO_DELAY_INCREASE,
        label: 'Increase Delay',
        description: 'Increase delay on each message in milliseconds',
        type: 'int',
        required: false,
        advanced: true
      }
    ]
  }
}
