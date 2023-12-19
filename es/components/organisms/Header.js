// @ts-check
import { Shadow } from '../../../../event-driven-web-components-prototypes/src/Shadow.js'

/* global self */

/**
 * The chats header
 * TODO: replace all buttons and move them into navigation
 * TODO: use this chat header for status information
 * TODO: ... properly spread functionality to ../../chat/es/components/molecules/... Rooms, Providers, Users and move the triggers (buttons) to a simple navigation view component including room, provider, user, video, share and qr code
 *
 * @export
 * @class Users
 */
export default class Header extends Shadow() {
  constructor (options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, ...options }, ...args)

    this.eventListener = async event => {
      if (event.composedPath()[0].getAttribute('id') === 'share') {
        try {
          await navigator.share({
            title: document.title,
            url: location.href
          })
        } catch (err) {
          alert(`use this link 👉 ${location.href}`)
        }
      } else if (event.composedPath()[0].getAttribute('id') === 'qr') {
        if (!confirm('api.qrserver.com generates your qr code, continue?')) return
        self.open(`https://api.qrserver.com/v1/create-qr-code/?data="${self.encodeURIComponent(location.href)}"`)
      } else if (event.composedPath()[0].getAttribute('id') === 'reload') {
        self.open(location.origin + location.pathname)
      } else if (event.composedPath()[0].getAttribute('id') === 'jitsi') {
        self.open(`https://meet.hostpoint.ch/${this.root.querySelector('#room-name').textContent.replace(/\s+/g, '')}`)
      } else if (event.composedPath()[0].getAttribute('id') === 'nickname') {
        new Promise(resolve => this.dispatchEvent(new CustomEvent('yjs-get-nickname', {
          detail: {
            resolve
          },
          bubbles: true,
          cancelable: true,
          composed: true
        }))).then(nickname => {
          if ((nickname = self.prompt('nickname', nickname))) {
            this.dispatchEvent(new CustomEvent('yjs-set-nickname', {
              /** @type {import("../../../../event-driven-web-components-yjs/src/es/controllers/Users.js").SetNicknameDetail} */
              detail: {
                nickname
              },
              bubbles: true,
              cancelable: true,
              composed: true
            }))
          }
        })
      } else if (event.composedPath()[0].getAttribute('id') === 'server') {
        new Promise(resolve => this.dispatchEvent(new CustomEvent('yjs-get-providers', {
          detail: {
            resolve
          },
          bubbles: true,
          cancelable: true,
          composed: true
        }))).then(async ({ websocketUrl, webrtcUrl }) => {
          const newWebsocketUrls = prompt('websocketUrls separated with a "," and no spaces in between', websocketUrl || '')
          let resolveProviders
          (new Promise(resolve => (resolveProviders = resolve))).then(providers => {
            // TODO: when changing the providers this has to be dispatched newly
            this.dispatchEvent(new CustomEvent('yjs-subscribe-notifications', {
              detail: {
                resolve: result => console.log('subscribed', result)
              },
              bubbles: true,
              cancelable: true,
              composed: true
            }))
          })
          if (newWebsocketUrls !== null && newWebsocketUrls !== websocketUrl) {
            this.dispatchEvent(new CustomEvent('yjs-update-providers', {
              detail: {
                websocketUrl: newWebsocketUrls,
                resolve: resolveProviders
              },
              bubbles: true,
              cancelable: true,
              composed: true
            }))
          }
          const newWebrtcUrls = prompt('webrtcUrls separated with a "," and no spaces in between', webrtcUrl || '')
          if (newWebrtcUrls !== null && newWebrtcUrls !== webrtcUrl) {
            this.dispatchEvent(new CustomEvent('yjs-update-providers', {
              detail: {
                webrtcUrl: newWebrtcUrls
              },
              bubbles: true,
              cancelable: true,
              composed: true
            }))
          }
        })
      }
    }
  }

  connectedCallback () {
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
    this.addEventListener('click', this.eventListener)
    new Promise(resolve => this.dispatchEvent(new CustomEvent('yjs-get-room', {
      detail: {
        resolve
      },
      bubbles: true,
      cancelable: true,
      composed: true
    }))).then(async ({ room }) => {
      this.root.querySelector('#room-name').textContent = await room
      document.title = await room
    })
  }

  disconnectedCallback () {
    this.removeEventListener('click', this.eventListener)
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
      :host {
        display: flex;
        flex-wrap: wrap;
        align-items: stretch;
        gap: 0.3em;
      }
      :host > button {
        cursor: pointer;
        flex-grow: 1;
        max-width: calc(50% - 0.25em);
        min-height: max(3em, 100%);
        word-break: break-all;
        font-size: 0.7em;
      }
      :host > button > #room-name {
        font-size: 0.9em;
      }
    `
  }

  /**
  * renders the html
  *
  * @return {void}
  */
  renderHTML () {
    this.html = /* html */`
      <button id=reload>&#9842;<br>new room</button>
      <button id=server>&#9741;<br>connections</button>
      <button id=jitsi>&#9743;<br>video</button>
      <button id=share>💌<br>${this.textContent} [<span id=room-name></span>]</button>
      <button id=qr>&#9783;<br>generate a qr code</button>
      <button id=nickname>&#9731;<br>nickname</button>
    `
  }
}
