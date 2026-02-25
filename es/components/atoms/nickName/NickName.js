// @ts-check
import { Shadow } from '../../../../../event-driven-web-components-prototypes/src/Shadow.js'
import { escapeHTML } from '../../../../../event-driven-web-components-prototypes/src/helpers/Helpers.js'
import { getHexColor } from '../../../../../Helpers.js'

/* global self */
/* global Environment */

/**
* @export
* @class NickName
* @type {CustomElementConstructor}
*/
export default class NickName extends Shadow() {
  constructor (options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, tabindex: 'no-tabindex', ...options }, ...args)

    this.hTagName = this.getAttribute('h-tag-name') || 'h4'

    this.clickEventListener = event => {
      event.preventDefault()
      event.stopPropagation()
      if (!this.hasAttribute('uid')) return
      if (this.hasAttribute('user-dialog-show-event')) {
        this.dispatchEvent(new CustomEvent('user-dialog-show-event', {
          detail: { uid: this.getAttribute('uid') },
          bubbles: true,
          cancelable: true,
          composed: true
        }))
      } else if (this.hasAttribute('user-dialog-show-event-only-on-avatar') && event.composedPath().some(node => node.classList?.contains('avatar'))) {
        this.dispatchEvent(new CustomEvent('user-dialog-show-event', {
          detail: { uid: this.getAttribute('uid') },
          bubbles: true,
          cancelable: true,
          composed: true
        }))
      } else if (this.hasAttribute('self') && !event.composedPath().some(node => node.classList?.contains('avatar'))) {
        this.dispatchEvent(new CustomEvent('open-nickname', {
          detail: { command: 'show-modal' },
          bubbles: true,
          cancelable: true,
          composed: true
        }))
      } else {
        this.dispatchEvent(new CustomEvent('nickname-click', {
          detail: { uid: this.getAttribute('uid') },
          bubbles: true,
          cancelable: true,
          composed: true
        }))
      }
    }

    this.nicknameEventListener = event => this.renderHTML(event.detail.nickname)

    let timeoutId = null
    const skipTimeoutClear = 5
    let timeoutCounter = 1
    this.usersEventListener = async event => {
      if (timeoutCounter % skipTimeoutClear) clearTimeout(timeoutId)
      timeoutCounter++
      timeoutId = setTimeout(async () => {
        timeoutCounter = 1
        const data = await event.detail.getData()
        let user
        if ((user = data.allUsers.get(this.getAttribute('uid')))) {
          if ((user.isSelf && data.usersConnectedWithSelf.size) || data.usersConnectedWithSelf.has(this.getAttribute('uid'))) {
            this.setAttribute('is-connected-with-self', '')
          } else {
            this.removeAttribute('is-connected-with-self')
          }
          this.renderHTML(user.nickname || '')
        } else if (this.hasAttribute('nickname')) {
          this.renderHTML(this.getAttribute('nickname'))
        }
        // @ts-ignore
      }, self.Environment.awarenessEventListenerDelay)
    }
  }

  connectedCallback () {
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
    this.addEventListener('click', this.clickEventListener)
    this.globalEventTarget.addEventListener('yjs-users', this.usersEventListener)
    if (this.hasAttribute('self')) this.globalEventTarget.addEventListener('yjs-nickname', this.nicknameEventListener)
    if (this.isConnected) this.connectedCallbackOnce()
  }

  connectedCallbackOnce () {
    new Promise(resolve => this.dispatchEvent(new CustomEvent('yjs-get-users-event-detail', {
      detail: { resolve },
      bubbles: true,
      cancelable: true,
      composed: true
    }))).then(detail => {
      if (!this.hasAttribute('uid') && this.hasAttribute('self')) this.setAttribute('uid', detail.selfUser.uid)
      this.usersEventListener({ detail })
    })
    this.connectedCallbackOnce = () => {}
  }

  disconnectedCallback () {
    this.removeEventListener('click', this.clickEventListener)
    this.globalEventTarget.removeEventListener('yjs-users', this.usersEventListener)
    if (this.hasAttribute('self')) this.globalEventTarget.removeEventListener('yjs-nickname', this.nicknameEventListener)
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
        --color-hover: var(--color-yellow);
        --${this.hTagName}-font-size: 1em;
        --${this.hTagName}-margin: 0;
        --${this.hTagName}-padding: 0.2em 0 0 0;
        max-width: 100%;
      }
      :host(:not([uid])) {
        --a-color: var(--color-disabled);
        --color-hover: var(--color-disabled);
        --color: var(--color-disabled);
        --a-color-visited: var(--color-disabled);
      }
      :host(:not([uid])) > a {
        cursor: not-allowed;
        pointer-events: none;
      }
      *:focus {
        outline: none;
      }
      :host > a {
        cursor: pointer;
      }
      :host > a, :host > span {
        align-items: center;
        display: flex;
        padding-bottom: var(--spacing);
        tap-highlight-color: transparent;
        --webkit-tap-highlight-color: transparent;
      }
      :host > a > wct-icon-mdx {
        display: flex;
        flex-shrink: 0;
      }
      :host > a > :not(wct-icon-mdx) {
        flex-shrink: 100;
      }
      :host > a > ${this.hTagName}, :host > span {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-decoration: underline;
      }
      :host .avatar {
        height: 1.25em;
        width: 1.25em;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 50%;
        box-shadow: 0px 0px 0.25em var(--color-white);
        margin-right: 0.25em;
        transform: translateY(0.1em);
        flex-shrink: 0;
        background-color: var(--color-disabled);
      }
      :host .avatar > #connected {
        display: none;
      }
      :host([is-connected-with-self]) .avatar > #connected {
        --color: var(--background-color);
        --color-hover: var(--color-secondary);
        display: contents;
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
   * @prop {string} nickname
   * @returns Promise<void>
   */
  renderHTML (nickname = this.getAttribute('nickname')) {
    if (this.lastNickname === nickname) return Promise.resolve()
    this.lastNickname = nickname
    nickname = escapeHTML(nickname) || (this.hasAttribute('self') ? 'Loading...' : 'users nickname is unknown')
    this.setAttribute('title', nickname)
    this.html = ''
    this.html = /* html */`
      <a href="#">
        <span class=avatar>
          <wct-icon-mdx hover-on-parent-shadow-root-host id=connected title=connected icon-url="../../../../../../img/icons/mobiledata.svg" size="0.75em"></wct-icon-mdx>
        </span>
        <${this.hTagName}>${nickname}</${this.hTagName}>
        ${this.hasAttribute('self') ? '<wct-icon-mdx hover-on-parent-element id="show-modal" title="edit nickname" icon-url="../../../../../../img/icons/pencil.svg" size="1em"></wct-icon-mdx>' : ''}
      </a>
    `
    if (this.hasAttribute('uid')) getHexColor(this.getAttribute('uid')).then(hex => this.avatar.setAttribute('style', `background-color: ${hex}`))
    return this.fetchModules([
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../../web-components-toolbox/src/es/components/atoms/iconMdx/IconMdx.js?${Environment?.version || ''}`,
        name: 'wct-icon-mdx'
      }
    ])
  }

  get hTag () {
    return this.root.querySelector(this.hTagName)
  }

  get avatar () {
    return this.root.querySelector('.avatar')
  }

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }
}
