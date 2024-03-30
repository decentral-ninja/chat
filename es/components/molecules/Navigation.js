// @ts-check
import { Shadow } from '../../../../event-driven-web-components-prototypes/src/Shadow.js'

/* global self */

/**
 * The chats Navigation
 * TODO: replace all buttons and move them into navigation
 * TODO: use this chat Navigation for status information
 *
 * @export
 * @class Users
 */
export default class Navigation extends Shadow() {
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
      } else if (event.composedPath()[0].getAttribute('id') === 'jitsi') {
        self.open(`https://jitsi.mgrs.dev/${this.dialogGrid.root.querySelector('#room-name').textContent.replace(/\s+/g, '')}`)
      } else if (event.composedPath()[0].getAttribute('id') === 'nickname') {
        this.dispatchEvent(new CustomEvent('open-nickname', {
          bubbles: true,
          cancelable: true,
          composed: true
        }))
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
          if (newWebsocketUrls !== null && newWebsocketUrls !== websocketUrl) {
            this.dispatchEvent(new CustomEvent('yjs-update-providers', {
              detail: {
                websocketUrl: newWebsocketUrls
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
    this.hidden = true
    if (this.shouldRenderCSS()) this.renderCSS()
    this.addEventListener('click', this.eventListener)
    this.connectedCallbackOnce()
  }

  connectedCallbackOnce () {
    Promise.all([
      new Promise(resolve => this.dispatchEvent(new CustomEvent('yjs-get-room', {
        detail: {
          resolve
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))),
      this.shouldRenderCSS()
        ? this.renderCSS()
        : null,
      this.shouldRenderHTML()
        ? this.renderHTML()
        : null
    ]).then(async ([{room}]) => {
      if (this.dialogGrid) this.dialogGrid.root.querySelector('#room-name').textContent = await room
      this.hidden = false
    })
    this.connectedCallbackOnce = () => {}
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
   * @return {Promise<void>}
   */
  renderCSS () {
    this.css = /* css */`
      :host {
        display: flex;
        flex-wrap: wrap;
        align-items: stretch;
        gap: 0.3em;
      }
      :host > wct-dialog {
        display: contents;
      }
    `
    return Promise.resolve()
  }

  /**
  * renders the html
  *
  * @return {Promise<void>}
  */
  renderHTML () {
    this.html = /* html */`
      <wct-dialog
        namespace="dialog-top-slide-in-"
        close-event-name="close-menu"
      >
        <wct-menu-icon id="close" class="open" namespace="menu-icon-close-" no-click></wct-menu-icon>
        <a-icon-mdx id="show-modal" icon-url="../../../../../../img/icons/settings-heart.svg" size="2em"></a-icon-mdx>
        <dialog>
          <nav>
            <wct-grid auto-fill="calc(25% - 0.75em)" auto-fill-mobile="calc(50% - 0.5em)" gap="1em" padding="1em">
              <section>
                <style protected=true>
                  :host > section > button {
                    cursor: pointer;
                    word-break: break-all;
                  }
                </style>
                <button id=jitsi>&#9743;<br>start video meeting</button>
                <button id=nickname>&#9731;<br>change nickname</button>
                <button id=server>&#9741;<br>adjust connections</button>
                <button id=share>💌<br>${this.textContent} [<span id=room-name></span>]</button>
                <button id=qr>&#9783;<br>generate a qr code</button>
              </section>
            </wct-grid>
          </dialog>
        </wct-dialog>
      </nav>
    `
    return this.fetchModules([
      {
        // TODO: Implement a button with click events later
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/atoms/button/Button.js?${Environment?.version || ''}`,
        name: 'wct-button'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/atoms/menuIcon/MenuIcon.js?${Environment?.version || ''}`,
        name: 'wct-menu-icon'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/molecules/dialog/Dialog.js?${Environment?.version || ''}`,
        name: 'wct-dialog'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/organisms/grid/Grid.js?${Environment?.version || ''}`,
        name: 'wct-grid'
      },
      {
        path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/atoms/iconMdx/IconMdx.js`,
        name: 'a-icon-mdx'
      }
    ])
  }

  get dialog () {
    return this.root.querySelector('wct-dialog')
  }
  get dialogGrid () {
    return this.dialog.root?.querySelector('wct-grid')
  }
}
