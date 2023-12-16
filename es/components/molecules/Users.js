// @ts-check
import { Shadow } from '../../../../event-driven-web-components-prototypes/src/Shadow.js'

/**
 * The users view
 * TODO: replace confirm box
 * TODO: listen to "yjs-users" event dispatched from controller/Users.js with func. detail.getData() and not awareness-change event!!!
 * TODO: view component for controllers/Users.js with https://github.com/feross/p2p-graph
 *
 * @export
 * @class Users
 */
export default class Users extends Shadow() {
  constructor (options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, ...options }, ...args)

    this.usersEventListener = event => {
      console.log('users', event.detail.getData())
    }

    this.stateValues = new Map()
    this.eventListener = event => {
      this.stateValues.set(event.detail.url, JSON.stringify(event.detail.stateValues))
      this.renderHTML(event.detail)
    }
  }

  connectedCallback () {
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
    document.body.addEventListener('yjs-users', this.usersEventListener)
    document.body.addEventListener(`yjs-${this.getAttribute('key') || 'websocket'}-awareness-change`, this.eventListener)
    new Promise(resolve => this.dispatchEvent(new CustomEvent('yjs-get-room', {
      detail: {
        resolve
      },
      bubbles: true,
      cancelable: true,
      composed: true
    }))).then(async ({ room }) => {
      let nickname = 'no-name' + Date.now()
      if (self.localStorage.getItem(await room + '-nickname')) {
        // @ts-ignore
        nickname = self.localStorage.getItem(await room + '-nickname')
      } else {
        // browser issue with two prompts too close, so we wait a moment here
        // @ts-ignore
        await new Promise(resolve => setTimeout(() => resolve(), 200))
        nickname = self.prompt('nickname', `${nickname}-${new Date().getUTCMilliseconds()}`) || `${nickname}-${new Date().getUTCMilliseconds()}`
      }
      this.dispatchEvent(new CustomEvent('yjs-set-local-state-field', {
        /** @type {import("../../../../event-driven-web-components-yjs/src/es/EventDrivenYjs.js").SetLocalStateFieldEventDetail} */
        detail: {
          value: {
            nickname
          }
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))
      self.localStorage.setItem(await room + '-nickname', nickname)
    })
  }

  disconnectedCallback () {
    document.body.removeEventListener('yjs-users', this.usersEventListener)
    document.body.removeEventListener(`yjs-${this.getAttribute('key') || 'websocket'}-awareness-change`, this.eventListener)
  }

  /**
   * Evaluates if a render of CSS is necessary
   *
   * @return {boolean}
   */
  shouldRenderCSS () {
    return !this.root.querySelector(`:host > style[_css], ${this.tagName} > style[_css]`)
  }

  /**
   * Evaluates if a render of HTML is necessary
   *
   * @return {boolean}
   */
  shouldRenderHTML () {
    return !this.root.querySelector('span')
  }

  /**
   * Renders the CSS
   *
   * @return {void}
   */
  renderCSS () {
    this.css = /* css */`
      :host > ul > li {
        word-break: break-all;
        margin-bottom: 1em;
      }
      :host .nickname {
        color: blue;
        font-weight: bold;
      }
      :host .self {
        color: orange;
        font-weight: bold;
      }
      :host .certainly-self {
        color: green;
        font-weight: bold;
      }
      :host .certainly-self::after {
        color: black;
        content: ' <- this is your own user';
        font-weight: normal;
        text-decoration: underline;
      }
      :host .warning {
        color: red;
      }
    `
  }

  /**
  * renders the html
  *
  * @return {void}
  */
  renderHTML (detail) {
    this.html = ''
    this.html = /* html */`
      <details>
        <summary>Directly connected Users...</summary>
          <div>
            <span>Awareness on ${this.getAttribute('key') || 'websocket'} changed with stateValues:</span>
          </div>
      </details>
    `
    if (!detail) return
    const ul = document.createElement('ul')
    let length = 0
    this.stateValues.forEach((stateValue, url) => {
      length += JSON.parse(stateValue).reduce((prev, curr) => {
        // TODO: TypeError: Cannot read properties of undefined (reading 'localEpoch')
        return (prev += curr.user.localEpoch !== detail.localEpoch ? 1 : 0)
      }, 0)
      const uuid = JSON.parse(detail.localEpoch).uuid
      // TODO: TypeError: Cannot read properties of undefined (reading 'localEpoch')
      JSON.parse(stateValue).forEach(user => (ul.innerHTML += `<li class=${JSON.parse(user?.user.localEpoch).uuid === uuid ? 'certainly-self' : ''}>${url}:<br>${
        JSON.stringify(user)
          .replace(/},/g, '},<br><br>')
          .replace(/"nickname":"(.*?)"/g, '<span class=nickname>"nickname":"$1"</span>')
          .replace(new RegExp(`"fingerprint":(${detail.fingerprint})`, 'g'), '<span class=self>"own-fingerprint":$1</span>')
        }</li>`)
      )
    })
    this.root.querySelector(':host > details > summary').innerHTML = `Directly connected Users: ${length < 1 ? '<span class=warning>You are alone!</span>' : length}`
    this.root.querySelector(':host > details > div').appendChild(ul)
  }
}
