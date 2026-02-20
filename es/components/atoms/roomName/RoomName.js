// @ts-check
import { Shadow } from '../../../../../event-driven-web-components-prototypes/src/Shadow.js'
import { escapeHTML } from '../../../../../event-driven-web-components-prototypes/src/helpers/Helpers.js'

/* global Environment */
/* global self */

/**
* @export
* @class RoomName
* @type {CustomElementConstructor}
*/
export default class RoomName extends Shadow() {
  constructor (roomName, room, isActiveRoom, options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, tabindex: 'no-tabindex', ...options }, ...args)

    if (this.template) {
      ({ roomName: this.roomName, room: this.room, isActiveRoom: this.isActiveRoom } = JSON.parse(this.template.content.textContent))
    } else {
      this.roomName = roomName
      this.room = room
      this.isActiveRoom = isActiveRoom
    }

    this.roomNameAkaEventListener = async event => {
      let target
      if ((target = this.root.querySelector('.aka')) && event.detail?.key === this.roomName) target.textContent = event.detail.aka ? event.detail.aka : ''
    }

    /** @type {(any)=>void} */
    this.roomResolve = map => map
    /** @type {Promise<{room: any, isActiveRoom: boolean}>} */
    this.roomPromise = new Promise(resolve => (this.roomResolve = resolve))

    this.roomPromise.then(({room, isActiveRoom}) => {
      this.renderHTML(room)
      if (isActiveRoom) {
        this.setAttribute('is-active-room', '')
        this.setAttribute('title', 'currently active room')
      }
    })
  }

  connectedCallback () {
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
    this.globalEventTarget.addEventListener('room-name-aka', this.roomNameAkaEventListener)
    if (this.isConnected) this.connectedCallbackOnce()
  }

  connectedCallbackOnce () {
    if (this.room) {
      this.roomResolve({room: this.room, isActiveRoom: this.isActiveRoom})
    } else {
      this.dispatchEvent(new CustomEvent('yjs-get-specific-room', {
        detail: {
          roomName: this.roomName,
          resolve: this.roomResolve
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))
    }
    this.connectedCallbackOnce = () => {}
  }

  disconnectedCallback () {
    this.globalEventTarget.removeEventListener('room-name-aka', this.roomNameAkaEventListener)
  }

  /**
   * evaluates if a render is necessary
   *
   * @return {boolean}
   */
  shouldRenderCSS () {
    return !this.root.querySelector(`${this.cssSelector} > style[_css]`)
  }

  /**
   * evaluates if a render is necessary
   *
   * @return {boolean}
   */
  shouldRenderHTML () {
    return !this.a
  }

  /**
   * renders the css
   */
  renderCSS () {
    this.css = /* css */`
      :host {
        --a-margin: 0;
        --color-hover: var(--color-yellow);
      }
      :host([is-active-room]) {
        --a-color: var(--color-disabled);
        --color-hover: var(--color-disabled);
        --color: var(--color-disabled);
        --a-color-visited: var(--color-disabled);
      }
      :host([is-active-room]) > a {
        cursor: not-allowed;
        pointer-events: none;
      }
      :host > a {
        display: flex;
        flex-direction: column;
      }
      :host > a > div:not(.aka) {
        word-break: break-all;
      }
      :host > a > div.aka {
        color: var(--color-disabled);
        font-style: italic;
        font-size: 0.75em;
        text-decoration: underline;
        margin-left: 1em;
        display: list-item;
        list-style: inside;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      :host > a > div.aka:empty {
        display: none;
      }
    `
    return this.fetchTemplate()
  }

  /**
   * fetches the template
   */
  fetchTemplate () {
    return this.fetchCSS([
      {
        path: `${this.importMetaUrl}../../../../../web-components-toolbox/src/css/reset.css`, // no variables for this reason no namespace
        namespace: false
      },
      {
        path: `${this.importMetaUrl}../../../../../web-components-toolbox/src/css/style.css`, // apply namespace and fallback to allow overwriting on deeper level
        namespaceFallback: true
      }
    ])
  }

  /**
   * Render HTML
   * @prop {any} room
   * @returns Promise<void>
   */
  renderHTML (room) {
    const roomName = this.roomName ? escapeHTML(this.roomName) : 'Loading...'
    this.setAttribute('title', roomName)
    this.html = ''
    this.html = /* html */`<a ${this.hasAttribute('route') ? `route="${this.getAttribute('route')}"` : room?.locationHref ? `route href="${room.locationHref}"` : ''}>
      <div>${roomName}</div>
      <div class=aka>${room?.aka ? escapeHTML(room.aka) : ''}</div>
    </a>`
    return Promise.resolve()
  }

  get a () {
    return this.root.querySelector('a')
  }

  get template () {
    return this.root.querySelector('template')
  }

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }
}
