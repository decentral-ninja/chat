// @ts-check
import { Hover } from '../../../../event-driven-web-components-prototypes/src/Hover.js'

/* global self */
/* global Environment */

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

    // @ts-ignore
    this.roomNamePrefix = self.Environment?.roomNamePrefix || 'chat-'
    this.notificationsMax = 9

    const isMuted = (mutes, roomName, hostname) => roomName && mutes.roomNames?.some(muteRoomName => muteRoomName === roomName) || hostname && mutes.hostnames?.some(muteHostname => muteHostname === hostname)
    if (this.hasAttribute('room')) {
      this.notificationsEventListener = event => {
        const roomName = this.getAttribute('room')
        const hostname = this.getAttribute('hostname')
        let notifications = (event.detail.notifications[roomName] || []).filter(notification => !isMuted(event.detail.notificationMutes, roomName, notification.host))
        if (hostname) notifications = notifications.filter(notification => notification.host === hostname)
        if (!(this.hidden = !notifications.length)) {
          this.counterEl.textContent = notifications.length > this.notificationsMax ? `${this.notificationsMax}+` : notifications.length
          // nickname can not be updated, since we would have to fetch the room of this notification and get user data
          this.messageEl.textContent = `${notifications[0].nickname}: ${notifications[0].text}`
          if (!this.hasAttribute('no-scroll')) setTimeout(() => this.parentNode?.scrollIntoView({ behavior: 'smooth' }), 200)
        }
        // check if this notification is muted
        if (this.hasAttribute('allow-mute') && isMuted(event.detail.notificationMutes, hostname ? '' : roomName, hostname)) {
          this.setAttribute('muted', '')
          this.hidden = false
        } else {
          this.removeAttribute('muted')
        }
      }
    } else {
      this.notificationsEventListener = event => {
        const keys = Object.keys(event.detail.notifications)
        const notificationsCounter = keys.reduce((acc, key) => {
          const timestamps = []
          return acc + (event.detail.rooms.value[key]
            ? event.detail.notifications[key].filter(notification => {
              if (timestamps.includes(notification.timestamp)) return false
              if (isMuted(event.detail.notificationMutes, key, notification.host)) return false
              timestamps.push(notification.timestamp)
              return true
            }).length
            : 0
          )
        }, 0)
        if (notificationsCounter) {
          // TODO: Play notification sound
          this.hidden = false
          this.counterEl.textContent = notificationsCounter > this.notificationsMax ? `${this.notificationsMax}+` : notificationsCounter
          if (typeof navigator.setAppBadge === 'function') navigator.setAppBadge(notificationsCounter)
          document.title = `(${this.counterEl.textContent}) ${document.title.replace(/\(\d.*\)\s/g, '')}`
        } else if (typeof navigator.clearAppBadge === 'function') {
          this.hidden = true
          navigator.clearAppBadge()
          document.title = document.title.replace(/\(\d+\)\s/g, '')
        }
      }
    }

    this.clickEventListener = event => {
      event.preventDefault()
      this.dispatchEvent(new CustomEvent(this.getAttribute('click-event-name') || 'open-room', {
        bubbles: true,
        cancelable: true,
        composed: true
      }))
    }

    // TODO: updating-mute animation
    this.muteEventListener = event => {
      event.stopPropagation()
      event.preventDefault()
      this.setAttribute('updating-mute', '')
      new Promise(resolve => this.dispatchEvent(new CustomEvent('yjs-mute-notifications', {
        detail: {
          roomName: this.getAttribute('room'),
          hostname: this.getAttribute('hostname'),
          resolve
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))).then(() => this.removeAttribute('updating-mute'))
    }
    this.unmuteEventListener = event => {
      event.stopPropagation()
      event.preventDefault()
      this.setAttribute('updating-mute', '')
      new Promise(resolve => this.dispatchEvent(new CustomEvent('yjs-unmute-notifications', {
        detail: {
          roomName: this.getAttribute('room'),
          hostname: this.getAttribute('hostname'),
          resolve
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))).then(() => this.removeAttribute('updating-mute'))
    }
  }

  connectedCallback () {
    super.connectedCallback()
    this.hidden = true
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
    this.globalEventTarget.addEventListener('yjs-notifications', this.notificationsEventListener)
    if (!this.hasAttribute('no-click')) this.addEventListener('click', this.clickEventListener)
    if (this.hasAttribute('allow-mute')) {
      this.muteEl.addEventListener('click', this.muteEventListener)
      this.unmuteEl.addEventListener('click', this.unmuteEventListener)
    }
    this.connectedCallbackOnce()
  }

  connectedCallbackOnce () {
    if (this.hasAttribute('on-connected-request-notifications')) {
      this.dispatchEvent(new CustomEvent('yjs-request-notifications', {
        bubbles: true,
        cancelable: true,
        composed: true
      }))
    }
    this.connectedCallbackOnce = () => {}
  }

  disconnectedCallback () {
    super.disconnectedCallback()
    this.globalEventTarget.removeEventListener('yjs-notifications', this.notificationsEventListener)
    if (!this.hasAttribute('no-click')) this.removeEventListener('click', this.clickEventListener)
      if (this.hasAttribute('allow-mute')) {
      this.muteEl.removeEventListener('click', this.muteEventListener)
      this.unmuteEl.removeEventListener('click', this.unmuteEventListener)
    }
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
      :host([hidden]) {
        display: none;
      }
      :host > div#status > div#bell-and-counter {
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: 1fr;
      }
      :host > div#status > div#bell-and-counter > * {
        grid-column: 1;
        grid-row: 1;
      }
      :host > div#status > div#bell-and-counter > wct-icon-mdx {
        display: block;
        height: 2em;
      }
      :host > div#status > div#bell-and-counter > span {
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
      :host([no-hover]) > div#status > div#bell-and-counter > span {
        cursor: default;
      }
      :host(:not([no-hover]):hover) > div#status > div#bell-and-counter > span, :host(.hover) > div#status > div#bell-and-counter > span {
        background-color: var(--color-yellow);
      }
      :host > div#status > div#bell-on-off {
        display: none;
      }
      :host([allow-mute]) > div#status:hover > div#bell-on-off {
        display: block;
      }
      :host([allow-mute][muted]) > div#status > div#bell-on-off {
        display: block;
      }
      :host([allow-mute]) > div#status:hover > div#bell-and-counter, :host([allow-mute][muted]) > div#status > div#bell-and-counter {
        display: none;
      }
      :host([allow-mute]) > div#status:hover > div#bell-on-off > #bell-off {
        display: block;
      }
      :host([allow-mute]) > div#status:hover > div#bell-on-off > #bell-plus {
        display: none;
      }
      :host([allow-mute][muted]) > div#status > div#bell-on-off > #bell-off, :host([allow-mute][muted]) > p > span#message {
        display: none;
      }
      :host([allow-mute][muted]) > div#status > div#bell-on-off > #bell-plus {
        display: block;
      }
      :host > p {
        color: var(--color-disabled);
        padding: 0;
        margin: 0;
        width: 100%;
        transition: color 0.3s ease-out;
      }
      :host(:not([no-hover]):hover) > p, :host(.hover) > p {
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
      <div id=status>
        <div id="bell-on-off">
          <wct-icon-mdx title="turn notifications off" id="bell-off" icon-url="../../../../../../img/icons/bell-off.svg" size="2em"></wct-icon-mdx>
          <wct-icon-mdx title="turn notifications on" id="bell-plus" icon-url="../../../../../../img/icons/bell-plus.svg" size="2em"></wct-icon-mdx>
        </div>
        <div id="bell-and-counter">
          <wct-icon-mdx id="show-modal" title=notifications icon-url="../../../../../../img/icons/bell.svg" size="2em" ${this.hasAttribute('no-hover') ? 'no-hover' : 'hover-on-parent-shadow-root-host'}></wct-icon-mdx>
          <span id="counter">10</span>
        </div>
      </div>
      <p><span id="message"></span></p>
    `
    return this.fetchModules([
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/atoms/iconMdx/IconMdx.js?${Environment?.version || ''}`,
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

  get muteEl () {
    return this.root.querySelector('#bell-off')
  }

  get unmuteEl () {
    return this.root.querySelector('#bell-plus')
  }

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }
}
