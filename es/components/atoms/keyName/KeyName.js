// @ts-check
import { Shadow } from '../../../../../event-driven-web-components-prototypes/src/Shadow.js'
import { escapeHTML } from '../../../../../event-driven-web-components-prototypes/src/helpers/Helpers.js'
import { getHexColor } from '../../../../../Helpers.js'

/* global self */
/* global Environment */

/**
* @export
* @class KeyName
* @type {CustomElementConstructor}
*/
export default class KeyName extends Shadow() {
  static get observedAttributes () {
    return ['name', 'epoch']
  }

  constructor (options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, ...options }, ...args)

    this.hTagName = this.getAttribute('h-tag-name') || 'h4'

    this.clickEventListener = event => {
      event.preventDefault()
      event.stopPropagation()
      if (this.hasAttribute('key-dialog-show-event')) {
        this.dispatchEvent(new CustomEvent('key-dialog-show-event', {
          detail: { epoch: this.getAttribute('epoch') },
          bubbles: true,
          cancelable: true,
          composed: true
        }))
      }
    }

    this.keyChangedEventListener = event => {
      // TODO: call functions regarding key changes
      console.log('****keyChangedEventListener*****', event.detail.modified || event.detail.deleted || event.detail.shared)
    }
  }

  connectedCallback () {
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
    this.addEventListener('click', this.clickEventListener)
    this.globalEventTarget.addEventListener('yjs-key-property-modified', this.keyChangedEventListener)
  }

  disconnectedCallback () {
    this.removeEventListener('click', this.clickEventListener)
    this.globalEventTarget.removeEventListener('yjs-key-property-modified', this.keyChangedEventListener)
  }

  attributeChangedCallback (name, oldValue, newValue) {
    if (oldValue === null) return
    if (name === 'name') {
      if (this.hTag && oldValue !== newValue) this.hTag.textContent = newValue
    } else {
      if (this.avatar && oldValue !== newValue) this.renderHexColor()
    }
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
        margin-right: 0.25em;
        transform: translateY(0.1em);
        flex-shrink: 0;
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
   * @prop {string} keyName
   * @returns Promise<void>
   */
  renderHTML (keyName = this.getAttribute('name')) {
    if (this.lastKeyName === keyName) return Promise.resolve()
    this.lastKeyName = keyName
    this.html = ''
    this.html = /* html */`
      <a href="#">
        <span class=avatar>
          <wct-icon-mdx hover-on-parent-shadow-root-host id=connected title=connected icon-url="../../../../../../img/icons/mobiledata.svg" size="0.75em"></wct-icon-mdx>
        </span>
        <${this.hTagName}>${escapeHTML(keyName) || 'None'}</${this.hTagName}>
      </a>
    `
    this.renderHexColor()
    return this.fetchModules([
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../../web-components-toolbox/src/es/components/atoms/iconMdx/IconMdx.js?${Environment?.version || ''}`,
        name: 'wct-icon-mdx'
      }
    ])
  }

  renderHexColor () {
    getHexColor(this.getAttribute('epoch')).then(hex => this.avatar.setAttribute('style', `background-color: ${hex}`))
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
