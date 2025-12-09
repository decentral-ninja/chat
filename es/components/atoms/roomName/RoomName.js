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
  constructor (options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, ...options }, ...args)

    this.clickEventListener = event => {
      event.preventDefault()
      this.dispatchEvent(new CustomEvent('open-room', {
        bubbles: true,
        cancelable: true,
        composed: true
      }))
    }

    this.roomNameAkaEventListener = async event => {
      let target
      if ((target = this.root.querySelector('.aka')) && event.detail?.key === await (await this.roomPromise)?.room) target.textContent = event.detail.aka ? event.detail.aka : ''
    }

    /** @type {(any)=>void} */
    this.roomResolve = map => map
    /** @type {Promise<{ locationHref: string, room: Promise<string> & {done: boolean} }>} */
    this.roomPromise = new Promise(resolve => (this.roomResolve = resolve))

    this.roomPromise.then(async ({ locationHref, room }) => {
      this.renderHTML(await room, await new Promise(resolve => this.dispatchEvent(new CustomEvent('yjs-get-active-room', {
        detail: {
          resolve
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))))
    })
  }

  connectedCallback () {
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
    this.addEventListener('click', this.clickEventListener)
    this.globalEventTarget.addEventListener('room-name-aka', this.roomNameAkaEventListener)
    if (this.isConnected) this.connectedCallbackOnce()
  }

  connectedCallbackOnce () {
    this.dispatchEvent(new CustomEvent('yjs-get-room', {
      detail: {
        resolve: this.roomResolve
      },
      bubbles: true,
      cancelable: true,
      composed: true
    }))
    this.connectedCallbackOnce = () => {}
  }

  disconnectedCallback () {
    this.removeEventListener('click', this.clickEventListener)
    this.globalEventTarget.removeEventListener('room-name-aka', this.roomNameAkaEventListener)
  }

  /**
   * evaluates if a render is necessary
   *
   * @return {boolean}
   */
  shouldRenderCSS () {
    return !this.root.querySelector(`:host > style[_css], ${this.tagName} > style[_css]`)
  }

  /**
   * evaluates if a render is necessary
   *
   * @return {boolean}
   */
  shouldRenderHTML () {
    return !this.hTag
  }

  /**
   * renders the css
   */
  renderCSS () {
    this.css = /* css */`
      :host {
        --a-margin: 0;
        --a-text-decoration: underline;
        --a-display: flex;
        --color: var(--a-color);
        --h1-font-size: 1.75em;
        --h1-margin: 0;
        --h1-padding: 0.2em 0 0 0;
      }
      :host > a:hover {
        --a-color-hover: var(--color-yellow);
        --color-hover: var(--a-color-hover);
      }
      *:focus {
        outline: none;
      }
      :host > a, :host > a > div.name {
        align-items: end;
        display: flex;
        tap-highlight-color: transparent;
        --webkit-tap-highlight-color: transparent;
      }
      :host > a wct-icon-mdx {
        display: flex;
      }
      :host > a h1 {
        flex-shrink: 1;
      }
      :host > a h1, :host > a div.aka, :host > a > div.name {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      :host > a div.aka {
        color: var(--color-disabled);
        font-style: italic;
        font-size: 0.75em;
        text-decoration: underline;
        margin-left: 1em;
        display: list-item;
        list-style: inside;
        flex-shrink: 2;
      }
      :host > a div.aka:empty {
        display: none;
      }
      @media only screen and (max-width: _max-width_) {
        :host > a {
          flex-wrap: wrap;
        }
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
   * @prop {string} roomName
   * @prop {} room
   * @returns Promise<void>
   */
  renderHTML (roomName, room) {
    roomName = roomName ? escapeHTML(roomName) : 'Loading...'
    this.html = ''
    this.html = /* html */`<a href="#">
      <div class=name>
        <wct-icon-mdx title="open rooms" hover-on-parent-element id="show-modal" rotate="180deg" icon-url="../../../../../../img/icons/chevron-left.svg" size="1.75em"></wct-icon-mdx>
        <h1 title="${roomName}">${roomName}</h1>
      </div>
      <div class=aka>${room?.aka ? escapeHTML(room.aka) : ''}</div>
    </a>`
    return this.fetchModules([
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../../web-components-toolbox/src/es/components/atoms/iconMdx/IconMdx.js?${Environment?.version || ''}`,
        name: 'wct-icon-mdx'
      }
    ])
  }

  get hTag () {
    return this.root.querySelector('h1')
  }

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }
}
