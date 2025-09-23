// @ts-check
import { Hover } from '../../../../event-driven-web-components-prototypes/src/Hover.js'

/* global self */
/* global Environment */

/**
 * The notifications view
 *
 * @export
 * @class Notifications
 */
export default class Notifications extends Hover() {
  constructor (options = {}, ...args) {
    // @ts-ignore
    super({ importMetaUrl: import.meta.url, ...options }, ...args)

    // @ts-ignore
    this.roomNamePrefix = self.Environment?.roomNamePrefix || 'chat-'
    this.notificationsMax = 9

    const isMuted = (mutes, includedOrigins, roomName, hostname) => (roomName && mutes && mutes.roomNames?.some(muteRoomName => muteRoomName === roomName)) || (hostname && ((mutes && mutes.hostnames?.some(muteHostname => muteHostname === hostname)) || includedOrigins.every(includedOrigin => !includedOrigin.includes(hostname))))
    if (this.hasAttribute('room')) {
      this.notificationsEventListener = event => {
        const roomName = this.getAttribute('room')
        const hostname = this.getAttribute('hostname')
        let notifications = (event.detail.notifications[roomName] || []).filter(notification => !isMuted(event.detail.notificationMutes, event.detail.origins, roomName, notification.host))
        if (hostname) notifications = notifications.filter(notification => notification.host === hostname)
        if (!this.hasAttribute('allow-mute')) this.hidden = !notifications.length
        if (notifications.length) {
          this.iconStatesEl.setAttribute('counter', notifications.length > this.notificationsMax ? `${this.notificationsMax}+` : notifications.length)
          this.setAttribute('has-notifications', '')
          // nickname can not be updated, since we would have to fetch the room of this notification and get user data
          this.messageEl.textContent = `${notifications[0].nickname}: ${notifications[0].text}`
          if (this.hasAttribute('scroll')) setTimeout(() => this.parentNode?.scrollIntoView({ behavior: 'smooth' }), 200)
        } else {
          this.iconStatesEl.removeAttribute('counter')
          this.removeAttribute('has-notifications')
        }
        // check if this notification is muted
        if (this.hasAttribute('allow-mute') && isMuted(event.detail.notificationMutes, event.detail.origins, hostname ? '' : roomName, hostname)) {
          this.setAttribute('muted', '')
          this.iconStatesEl.setAttribute('state', 'muted')
          if (!this.hasAttribute('allow-mute')) this.hidden = false
        } else {
          this.removeAttribute('muted')
          this.iconStatesEl.removeAttribute('state')
        }
        this.iconStatesEl.removeAttribute('updating')
      }
    } else {
      this.notificationsEventListener = event => {
        const keys = Object.keys(event.detail.notifications)
        const notificationsCounter = keys.reduce((acc, key) => {
          const timestamps = []
          return acc + (event.detail.rooms.value[key]
            ? event.detail.notifications[key].filter(notification => {
              if (timestamps.includes(notification.timestamp)) return false
              if (isMuted(event.detail.notificationMutes, event.detail.origins, key, notification.host)) return false
              timestamps.push(notification.timestamp)
              return true
            }).length
            : 0
          )
        }, 0)
        if (notificationsCounter) {
          // TODO: Play notification sound
          if (!this.hasAttribute('allow-mute')) this.hidden = false
          const textContent = notificationsCounter > this.notificationsMax ? `${this.notificationsMax}+` : notificationsCounter
          this.iconStatesEl.setAttribute('counter', textContent)
          this.setAttribute('has-notifications', '')
          if (typeof navigator.setAppBadge === 'function') navigator.setAppBadge(notificationsCounter)
          document.title = `(${textContent}) ${document.title.replace(/\(\d.*\)\s/g, '')}`
        } else if (typeof navigator.clearAppBadge === 'function') {
          if (!this.hasAttribute('allow-mute')) this.hidden = true
          this.iconStatesEl.removeAttribute('counter')
          this.removeAttribute('has-notifications')
          navigator.clearAppBadge()
          document.title = document.title.replace(/\(\d+\)\s/g, '')
        }
        this.iconStatesEl.removeAttribute('updating')
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

    this.muteEventListener = event => {
      event.stopPropagation()
      event.preventDefault()
      this.iconStatesEl.setAttribute('updating', '')
      this.dispatchEvent(new CustomEvent('yjs-mute-notifications', {
        detail: {
          roomName: this.getAttribute('room'),
          hostname: this.getAttribute('hostname')
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))
    }
    this.unmuteEventListener = event => {
      event.stopPropagation()
      event.preventDefault()
      this.iconStatesEl.setAttribute('updating', '')
      this.dispatchEvent(new CustomEvent('yjs-unmute-notifications', {
        detail: {
          roomName: this.getAttribute('room'),
          hostname: this.getAttribute('hostname')
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))
    }
  }

  connectedCallback () {
    super.connectedCallback()
    if (!this.hasAttribute('allow-mute')) this.hidden = true
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
    this.globalEventTarget.addEventListener('yjs-notifications', this.notificationsEventListener)
    if (!this.hasAttribute('no-click')) this.addEventListener('click', this.clickEventListener)
    if (this.hasAttribute('allow-mute')) {
      this.muteEl.addEventListener('click', this.muteEventListener)
      this.unmuteEl.addEventListener('click', this.unmuteEventListener)
    }
    if (this.isConnected) this.connectedCallbackOnce()
  }

  connectedCallbackOnce () {
    this.iconStatesEl.setAttribute('updating', '')
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
        --color-hover: var(--color-yellow);
        --counter-color: var(--color-secondary);
        display: flex;
        align-items: center;
      }
      :host(.hover) {
        --color: var(--color-yellow);
        --counter-color: var(--color-yellow);
      }
      :host(:not([muted])) {
        --color: var(--color-green-full);
      }
      :host([has-notifications]) {
        --color: var(--color-error);
      }
      :host > span#message {
        display: none;
        ${this.hasAttribute('span-cursor')
          ? `cursor: ${this.getAttribute('span-cursor')};`
          : ''
        }
        font-style: italic;
        font-size: 0.75em;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        width: fit-content;
        max-width: 10em;
        align-self: end;
        padding-left: 0.75em;
      }
      :host([has-notifications]) > span#message {
        display: block;
      }
      :host([allow-mute][muted]) > span#message {
        display: none;
      }
      :host([hidden]) {
        display: none;
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
      <a-icon-states no-pointer-events-updating show-counter-on-hover mode=false id=icon-states>
        ${this.hasAttribute('allow-mute')
          ? '<wct-icon-mdx state="default-hover" no-counter title="turn notifications off" id="bell-off" icon-url="../../../../../../img/icons/bell-off.svg" size="2em"></wct-icon-mdx>'
          : ''
        }
        <wct-icon-mdx state="muted" no-counter title="turn notifications on" id="bell-plus" icon-url="../../../../../../img/icons/bell-plus.svg" size="2em"></wct-icon-mdx>
        <wct-icon-mdx state="default" id="show-modal" title=notifications icon-url="../../../../../../img/icons/bell.svg" size="2em" ${this.hasAttribute('no-hover') ? 'no-hover' : 'hover-on-parent-shadow-root-host'}></wct-icon-mdx>
      </a-icon-states>
      <span id="message"></span>
    `
    return this.fetchModules([
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/atoms/iconMdx/IconMdx.js?${Environment?.version || ''}`,
        name: 'wct-icon-mdx'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../components/atoms/iconStates/IconStates.js?${Environment?.version || ''}`,
        name: 'a-icon-states'
      }
    ])
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

  get iconStatesEl () {
    return this.root.querySelector('a-icon-states')
  }

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }
}
