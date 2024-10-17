// @ts-check
import { Hover } from '../../../../event-driven-web-components-prototypes/src/Hover.js'

/**
 * The notifications view
 *
 * @export
 * @class Providers
 */
export default class Notifications extends Hover() {
  constructor (options = {}, ...args) {
    // @ts-ignore
    super({ importMetaUrl: import.meta.url, ...options }, ...args)

    this.roomNamePrefix = 'chat-'
    this.notificationsMax = 9
    
    if (this.hasAttribute('room')) {
      this.notificationsEventListener = event => {
        let notifications
        if ((notifications = event.detail.notifications[this.getAttribute('room')]) && !(this.hidden = !notifications.length)) {
          this.counterEl.textContent = notifications.length > this.notificationsMax ? `${this.notificationsMax}+` : notifications.length
          // nickname can not be updated, since we would have to fetch the room of this notification and get user data
          this.messageEl.textContent = `${notifications[0].nickname}: ${notifications[0].text}`
        }
      }
    } else {
      this.notificationsEventListener = event => {
        let keys
        if (!(this.hidden = !(keys = Object.keys(event.detail.notifications)).length)) {
          const notificationsCounter = keys.reduce((acc, key) => acc + (event.detail.rooms.value[key]
            ? event.detail.notifications[key].length
            : 0
          ), 0)
          this.counterEl.textContent = notificationsCounter > this.notificationsMax ? `${this.notificationsMax}+` : notificationsCounter
          if (typeof navigator.setAppBadge === 'function') navigator.setAppBadge(notificationsCounter)
          if (!notificationsCounter) this.hidden = true
        } else if (typeof navigator.clearAppBadge === 'function') {
          navigator.clearAppBadge()
        }
      }
    }

    this.clickEventListener = event => {
      event.preventDefault()
      this.dispatchEvent(new CustomEvent('open-room', {
        bubbles: true,
        cancelable: true,
        composed: true
      }))
    }
  }

  connectedCallback () {
    super.connectedCallback()
    this.hidden = true
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
    this.globalEventTarget.addEventListener('yjs-notifications', this.notificationsEventListener)
    if (!this.hasAttribute('no-click')) this.addEventListener('click', this.clickEventListener)
    this.connectedCallbackOnce()
  }

  connectedCallbackOnce () {
    if (this.hasAttribute('on-connected-request-notifications')) this.dispatchEvent(new CustomEvent('yjs-request-notifications', {
      bubbles: true,
      cancelable: true,
      composed: true
    }))
    this.connectedCallbackOnce = () => {}
  }

  disconnectedCallback () {
    super.disconnectedCallback()
    this.globalEventTarget.removeEventListener('yjs-notifications', this.notificationsEventListener)
    if (!this.hasAttribute('no-click')) this.removeEventListener('click', this.clickEventListener)
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
    return !this.root.querySelector('wct-icon-mdx')
  }

  /**
   * Renders the CSS
   *
   * @return {void}
   */
  renderCSS () {
    this.css = /* css */`
      :host {
        --color: var(--color-error);
        --color-hover: var(--color-yellow);
        display: flex;
        align-items: baseline;
        gap: 0.5em;
      }
      :host(.hover) {
        --color: var(--color-yellow);
      }
      :host > div {
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: 1fr;
      }
      :host > div > * {
        grid-column: 1;
        grid-row: 1;
      }
      :host > div > wct-icon-mdx {
        display: block;
        height: 2em;
      }
      :host > div > span {
        background-color: var(--color-secondary);
        border-radius: 50%;
        color: white;
        cursor: pointer;
        font-size: 0.75em;
        height: fit-content;
        margin-right: 1.5em;
        max-width: 2em;
        opacity: 0.75;
        overflow: hidden;
        padding: 0.1em 0.5em;
        text-overflow: ellipsis;
        transform: translate(1.5em, 1.25em);
        transition: background-color 0.3s ease-out;
        white-space: nowrap;
        width: fit-content;
      }
      :host(:hover) > div > span, :host(.hover) > div > span {
        background-color: var(--color-yellow);
      }
      :host > p {
        color: var(--color-disabled);
        padding: 0;
        margin: 0;
        width: 100%;
        transition: color 0.3s ease-out;
      }
      :host(:hover) > p, :host(.hover) > p {
        color: var(--color-yellow);
      }
      :host > p:has(> span:empty) {
        display: none;
      }
      :host > p > span {
        display: block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `
  }

  /**
  * renders the html
  *
  * @return {Promise<void>}
  */
  renderHTML () {
    this.html = /* html */`
      <div>
        <wct-icon-mdx id="show-modal" icon-url="../../../../../../img/icons/bell.svg" size="2em" hover-on-parent-shadow-root-host></wct-icon-mdx>
        <span id="counter">10</span>
      </div>
      <p><span id="message"></span></p>
    `
    return this.fetchModules([
      {
        path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/atoms/iconMdx/IconMdx.js`,
        name: 'wct-icon-mdx'
      }
    ])
  }

  get counterEl () {
    return this.root.querySelector('#counter')
  }

  get messageEl () {
    return this.root.querySelector('#message')
  }

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }
}
