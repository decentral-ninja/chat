// @ts-check
import { Shadow } from '../../../../../web-components-toolbox/src/es/components/prototypes/Shadow.js'

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
      this.dispatchEvent(new CustomEvent('open-nickname', {
        bubbles: true,
        cancelable: true,
        composed: true
      }))
    }

    this.nicknameEventListener = event => this.renderHTML(event.detail.nickname)
  }

  connectedCallback () {
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
    this.addEventListener('click', this.clickEventListener)
    this.globalEventTarget.addEventListener('yjs-nickname', this.nicknameEventListener)
    this.dispatchEvent(new CustomEvent('yjs-get-nickname', {
      bubbles: true,
      cancelable: true,
      composed: true
    }))
  }

  disconnectedCallback () {
    this.removeEventListener('click', this.clickEventListener)
    this.globalEventTarget.removeEventListener('yjs-nickname', this.nicknameEventListener)
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
        --color: var(--color-disabled);
        --a-color: var(--color-disabled);
        --h6-font-size: 1.75em;
        --h6-margin: 0;
        --h6-padding: 0.2em 0 0 0;
      }
      :host > a {
        align-items: center;
        display: flex;
        tap-highlight-color: transparent;
        --webkit-tap-highlight-color: transparent;
      }
      :host > a > a-icon-mdx {
        display: flex;
      }
      :host > a > h6 {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
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
  renderHTML (nickname) {
    this.html = ''
    this.html = `<a href="#">
      <a-icon-mdx id="show-modal" icon-url="../../../../../../img/icons/tool.svg" size="1.75em"></a-icon-mdx>
      <h6>${nickname || 'Loading...'}</h6>
    </a>`
    return this.fetchModules([
      {
        path: `${this.importMetaUrl}../../../../../web-components-toolbox/src/es/components/atoms/iconMdx/IconMdx.js`,
        name: 'a-icon-mdx'
      }
    ])
  }

  get hTag () {
    return this.root.querySelector('h6')
  }

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }
}
