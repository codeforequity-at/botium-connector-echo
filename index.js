const fs = require('fs')
const path = require('path')
const debug = require('debug')('botium-connector-echo')

class BotiumConnectorEcho {
  constructor ({ queueBotSays }) {
    this.queueBotSays = queueBotSays
    this.session = {}
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
        input: ['buttons', 'show me buttons', 'show me some buttons', 'give me buttons'],
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
        input: ['picture', 'show me a picture', 'give me a picture'],
        output: {
          messageText: 'Here is a picture',
          media: [
            { altText: 'Botium Logo', mediaUri: 'http://www.botium.at/img/logo.png' }
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
              image: { mediaUri: 'http://www.botium.at/img/logo.png' },
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
        input: ['attachment', 'audio attachment'],
        output: (msg, session) => {
          const audioFile = 'file_example_MP3_700KB.mp3'
          let audioBuffer = null
          if (fs.existsSync(path.join(__dirname, audioFile))) {
            audioBuffer = Buffer.from(fs.readFileSync(path.join(__dirname, audioFile)))
          } else if (fs.existsSync(path.join(__dirname, '..', audioFile))) {
            audioBuffer = Buffer.from(fs.readFileSync(path.join(__dirname, '..', audioFile)))
          } else {
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
                name: 'attachment',
                confidence: 0.8
              }
            }
          }
        }
      },
      {
        input: ['form'],
        output: {
          messageText: 'Here is a form',
          buttons: [
            { text: 'Some other button' }
          ],
          forms: [
            { name: 'Username', value: 'God' },
            { name: 'Age', value: 30 },
            { name: 'Female', value: 'true' },
            { name: 'Description' }
          ],
          nlp: {
            intent: {
              name: 'form',
              confidence: 0.77
            }
          }
        }
      }
    ]
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
    this.session = {}
    return Promise.resolve()
  }

  UserSays (msg) {
    debug('UserSays called, echo back')

    let botMsg = {
      sender: 'bot',
      sourceData: {
        request: msg
      }
    }

    if (msg.buttons && msg.buttons.length > 0) {
      botMsg.messageText = `BUTTON PRESSED: ${msg.buttons[0].text}`
    } else {
      const template = this.answers.find(a => a.input.findIndex(u => msg.messageText.startsWith(u)) >= 0)
      if (template) {
        if (template.output.messageText) {
          botMsg = Object.assign(botMsg, template.output)
        } else {
          botMsg = Object.assign(botMsg, template.output(msg, this.session))
        }
      } else {
        botMsg.messageText = 'You said: ' + msg.messageText
      }
    }

    botMsg.sourceData.session = JSON.parse(JSON.stringify(this.session))
    setTimeout(() => this.queueBotSays(botMsg), 0)
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
