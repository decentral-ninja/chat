// @ts-check
import { Shadow } from '../../../../../web-components-toolbox/src/es/components/prototypes/Shadow.js'

/* global self */
/* global Environment */

/**
* @export
* @class NickName
* @type {CustomElementConstructor}
*/
export default class NickName extends Shadow() {
  constructor (options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, ...options }, ...args)

    this.hTagName = this.getAttribute('h-tag-name') || 'h4'

    this.clickEventListener = event => {
      event.preventDefault()
      event.stopPropagation()
      if (this.hasAttribute('user-dialog-show-event')) {
        this.dispatchEvent(new CustomEvent('user-dialog-show-event', {
          detail: { uid: this.getAttribute('uid') },
          bubbles: true,
          cancelable: true,
          composed: true
        }))
      } else if (this.hasAttribute('self') && (!this.hasAttribute('click-only-on-icon') || event.composedPath().some(node => node.tagName?.toUpperCase() === 'SVG'))) {
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

    this.keysChanged = []
    let timeoutId = null
    this.usersEventListener = async event => {
      this.keysChanged = this.keysChanged.concat(event.detail.keysChanged)
      clearTimeout(timeoutId)
      timeoutId = setTimeout(async () => {
        if (this.keysChanged.includes(this.getAttribute('uid'))) {
          this.keysChanged = []
          this.renderHTML((await event.detail.getData()).allUsers.get(this.getAttribute('uid'))?.nickname || '')
        }
      }, 2000)
    }
  }

  connectedCallback () {
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
      this.addEventListener('click', this.clickEventListener)
      this.globalEventTarget.addEventListener('yjs-users', this.usersEventListener)
    if (this.hasAttribute('self')) this.globalEventTarget.addEventListener('yjs-nickname', this.nicknameEventListener)
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
        --color-hover: var(--color-yellow);
        --${this.hTagName}-font-size: 1em;
        --${this.hTagName}-margin: 0;
        --${this.hTagName}-padding: 0.2em 0 0 0;
        cursor: pointer;
      }
      *:focus {
        outline: none;
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
      }
      :host > a > ${this.hTagName}, :host > span {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-decoration: underline;
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
    this.html = ''
    this.html = this.hasAttribute('self')
      ? `<a href="#">
          <${this.hTagName}>${nickname || 'Loading...'}</${this.hTagName}>
          <wct-icon-mdx hover-on-parent-element id="show-modal" title="edit nickname" icon-url="../../../../../../img/icons/pencil.svg" size="1em"></wct-icon-mdx>
        </a>`
      : `<span><${this.hTagName}>${nickname || 'Loading...'}</${this.hTagName}></span>`
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

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }
}
