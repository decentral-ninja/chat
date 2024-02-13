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
        // TODO: move this logic to src/es/chat/es/components/molecules/Rooms.js 
        const url = new URL(location.href)
        let room = url.searchParams.get('room') || ''
        url.searchParams.set('room', (room = `chat-${self.prompt('room name', room.replace(/^chat-/, '')) || room.replace(/^chat-/, '')}` || room))
        history.pushState({ ...history.state, pageTitle: (document.title = room) }, room, url.href)
      } else if (event.composedPath()[0].getAttribute('id') === 'jitsi') {
        self.open(`https://jitsi.mgrs.dev/${this.root.querySelector('#room-name').textContent.replace(/\s+/g, '')}`)
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
      if (this.root.querySelector('#room-name')) this.root.querySelector('#room-name').textContent = await room
    })
  }

  disconnectedCallback () {
    this.removeEventListener('click', this.eventListener)
    if (typeof this.dialog?.close === 'function') this.dialog.close()
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
    return !this.dialog
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
    `
  }

  /**
  * renders the html
  *
  * @return {void}
  */
  renderHTML () {
    this.html = /* html */`
      <m-dialog
        namespace="dialog-left-slide-in-"
        autofocus
      >
        <a-menu-icon id="close" class="open" namespace="menu-icon-close-" no-click></a-menu-icon>
        <a-menu-icon id="show-modal" namespace="menu-icon-open-" no-click></a-menu-icon>
        <o-grid auto-fill="calc(25% - 0.75em)" auto-fill-mobile="calc(50% - 0.5em)" gap="1em" padding="1em">
          <style protected=true>
            :host >section > button {
              cursor: pointer;
              word-break: break-all;
            }
          </style>
          <button id=jitsi>&#9743;<br>start video meeting</button>
          <button id=reload>&#9842;<br>change room</button>
          <button id=nickname>&#9731;<br>change nickname</button>
          <button id=server>&#9741;<br>adjust connections</button>
          <button id=share>💌<br>${this.textContent} [<span id=room-name></span>]</button>
          <button id=qr>&#9783;<br>generate a qr code</button>
        </o-grid>
      </m-dialog>
    `
    return this.fetchModules([
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../..//web-components-toolbox/src/es/components/atoms/button/Button.js?${Environment?.version || ''}`,
        name: 'a-button'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../..//web-components-toolbox/src/es/components/atoms/menuIcon/MenuIcon.js?${Environment?.version || ''}`,
        name: 'a-menu-icon'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../..//web-components-toolbox/src/es/components/molecules/dialog/Dialog.js?${Environment?.version || ''}`,
        name: 'm-dialog'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../..//web-components-toolbox/src/es/components/organisms/grid/Grid.js?${Environment?.version || ''}`,
        name: 'o-grid'
      }
    ])
  }

  get dialog () {
    return this.root.querySelector('m-dialog')
  }
}
