const fs = require('fs')
const path = require('path')
const debug = require('debug')('botium-connector-echo')

class BotiumConnectorEcho {
  constructor ({ queueBotSays }) {
    this.queueBotSays = queueBotSays
    this.answers = [
      {
        input: ['help'],
        output: () => ({
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
        output: () => {
          throw new Error('Here is a delivery failure')
        }
      },
      {
        input: ['add to cart'],
        output: (msg) => {
          const item = msg.messageText.substr(11).trim()
          if (!this.session.cart) this.session.cart = []
          this.session.cart.push(item)
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
        output: (msg) => {
          return {
            messageText: `In your cart: ${(this.session.cart || []).join(', ')}`,
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
        output: (msg) => {
          this.session.cart = []
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
        output: () => ({
          messageText: 'An audio is attached to this message',
          attachments: [
            {
              name: 'file_example_MP3_700KB.mp3',
              mimeType: 'audio/mp3',
              base64: Buffer.from(fs.readFileSync(path.join(__dirname, 'file_example_MP3_700KB.mp3'))).toString('base64')
            }
          ],
          nlp: {
            intent: {
              name: 'attachment',
              confidence: 0.8
            }
          }
        })
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
        request: msg,
        session: this.session
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
          botMsg = Object.assign(botMsg, template.output(msg))
        }
      } else {
        botMsg.messageText = 'You said: ' + msg.messageText
      }
    }

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
