// @ts-check
import { Shadow } from '../../../../../web-components-toolbox/src/es/components/prototypes/Shadow.js'

/* global self */

/**
* @export
* @class NickName
* @type {CustomElementConstructor}
*/
export default class NickName extends Shadow() {
  constructor (options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, ...options }, ...args)

    this.clickEventListener = event => {
      event.preventDefault()
      event.stopPropagation()
      this.dispatchEvent(new CustomEvent('open-nickname', {
        detail: { command: 'show-modal' },
        bubbles: true,
        cancelable: true,
        composed: true
      }))
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
          this.renderHTML((await event.detail.getData()).allUsers.get(this.getAttribute('uid'))?.nickname)
        }
      }, 2000)
    }
  }

  connectedCallback () {
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
    if (this.hasAttribute('self')) {
      this.addEventListener('click', this.clickEventListener)
      this.globalEventTarget.addEventListener('yjs-nickname', this.nicknameEventListener)
    }
    this.globalEventTarget.addEventListener('yjs-users', this.usersEventListener)
  }

  disconnectedCallback () {
    if (this.hasAttribute('self')) {
      this.removeEventListener('click', this.clickEventListener)
      this.globalEventTarget.removeEventListener('yjs-nickname', this.nicknameEventListener)
    }
    this.globalEventTarget.removeEventListener('yjs-users', this.usersEventListener)
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
        --h4-font-size: 1em;
        --h4-margin: 0;
        --h4-padding: 0.2em 0 0 0;
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
      :host > a > h4, :host > span {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-decoration: underline;
      }
      @media only screen and (max-width: _max-width_) {
        :host {}
      }
    `
    return this.fetchTemplate()
  }

  /**
   * fetches the template
   */
  fetchTemplate () {
    /** @type {import("../../../../../web-components-toolbox/src/es/components/prototypes/Shadow.js").fetchCSSParams[]} */
    const styles = [
      {
        path: `${this.importMetaUrl}../../../../../web-components-toolbox/src/css/reset.css`, // no variables for this reason no namespace
        namespace: false
      },
      {
        path: `${this.importMetaUrl}../../../../../web-components-toolbox/src/css/style.css`, // apply namespace and fallback to allow overwriting on deeper level
        namespaceFallback: true
      }
    ]
    switch (this.getAttribute('namespace')) {
      case 'nickname-name-default-':
        return this.fetchCSS([{
          path: `${this.importMetaUrl}./default-/default-.css`, // apply namespace since it is specific and no fallback
          namespace: false
        }, ...styles])
      default:
        return this.fetchCSS(styles)
    }
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
          <h4>${nickname || 'Loading...'}</h4>
          <wct-icon-mdx hover-on-parent-element id="show-modal" title="edit nickname" icon-url="../../../../../../img/icons/pencil.svg" size="1em"></wct-icon-mdx>
        </a>`
      : `<span><h4>${nickname || 'Loading...'}</h4></span>`
    return this.fetchModules([
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../../web-components-toolbox/src/es/components/atoms/iconMdx/IconMdx.js?${Environment?.version || ''}`,
        name: 'wct-icon-mdx'
      }
    ])
  }

  get hTag () {
    return this.root.querySelector('h4')
  }

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }
}
