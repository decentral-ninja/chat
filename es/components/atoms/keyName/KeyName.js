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
    super({ importMetaUrl: import.meta.url, tabindex: 'no-tabindex', ...options }, ...args)

    this.hTagName = this.getAttribute('h-tag-name') || 'h4'
    this.linkTagName = this.hasAttribute('is-editable') ? 'a' : 'span'

    this.clickEventListener = event => {
      if (event.composedPath().some(el => el === this.dialog)) return
      event.preventDefault()
      event.stopPropagation()
      if (!this.dialog) {
        this.html = /* html */`
          <chat-m-key-name-dialog
            namespace="dialog-top-slide-in-"
            open="show-modal"
            name="${escapeHTML(this.getAttribute('name'))}"
            epoch='${this.getAttribute('epoch')}'
            ${this.hasAttribute('private')
              ? 'private'
              : 'public'
            }
          >
          </chat-m-key-name-dialog>
        `
      } else if (!this.dialog.dialog.hasAttribute('open')) {
        this.dialog.show('show-modal')
      }
    }

    this.keyChangedEventListener = event => {
      const propNames = this.hasAttribute('private') ? 'private.name' : 'public.name'
      if (event.detail.modified?.propNames === propNames && event.detail.modified.keyContainer.key.epoch === this.getAttribute('epoch')) this.setAttribute('name', propNames.split('.').reduce((acc, curr) => acc[curr], event.detail.modified.keyContainer))
    }
  }

  connectedCallback () {
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
    if (this.hasAttribute('is-editable')) this.addEventListener('click', this.clickEventListener)
    this.globalEventTarget.addEventListener('yjs-key-property-modified', this.keyChangedEventListener)
  }

  disconnectedCallback () {
    if (this.hasAttribute('is-editable')) this.removeEventListener('click', this.clickEventListener)
    this.globalEventTarget.removeEventListener('yjs-key-property-modified', this.keyChangedEventListener)
  }

  attributeChangedCallback (name, oldValue, newValue) {
    if (oldValue === null) return
    if (name === 'name') {
      if (this.hTag && oldValue !== newValue) {
        const value = newValue || 'None'
        this.hTag.textContent = value
        this.setAttribute('name', value)
        this.setAttribute('title', value)
      }
      if (this.dialog) this.dialog.setAttribute('name', newValue)
    } else {
      if (this.avatar && oldValue !== newValue) this.renderHexColor()
      if (this.dialog) this.dialog.setAttribute('epoch', newValue)
    }
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
        max-width: 100%;
      }
      :host([is-editable]) {
        cursor: pointer;
      }
      *:focus {
        outline: none;
      }
      :host > ${this.linkTagName} {
        --a-margin: 0;
        --a-text-decoration: underline;
        --a-display: flex;
        --color: var(--a-color);
        --color-hover: var(--color-yellow);
        --${this.hTagName}-font-size: 1em;
        --${this.hTagName}-margin: 0;
        --${this.hTagName}-padding: 0.2em 0 0 0;
        align-items: center;
        display: flex;
        padding-bottom: var(--spacing);
        tap-highlight-color: transparent;
        --webkit-tap-highlight-color: transparent;
      }
      :host > ${this.linkTagName} > ${this.hTagName} {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      :host > a > ${this.hTagName} {
        text-decoration: underline;
      }
      :host > ${this.linkTagName} > wct-icon-mdx {
        flex-shrink: 0;
      }
      :host > ${this.linkTagName} > :not(wct-icon-mdx) {
        flex-shrink: 100;
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
    keyName = escapeHTML(keyName) || 'None'
    this.setAttribute('name', keyName)
    this.setAttribute('title', keyName)
    this.html = ''
    this.html = /* html */`
      <${this.linkTagName} href="#">
        <span class=avatar></span>
        <${this.hTagName}>${keyName}</${this.hTagName}>
        ${this.hasAttribute('is-editable')
          ? /* html */`<wct-icon-mdx hover-on-parent-element id="show-modal" title="edit key name" icon-url="../../../../../../img/icons/pencil.svg" size="1em"></wct-icon-mdx>`
          : ''
        }
      </${this.linkTagName}>
    `
    this.renderHexColor()
    return this.fetchModules([
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../../web-components-toolbox/src/es/components/atoms/iconMdx/IconMdx.js?${Environment?.version || ''}`,
        name: 'wct-icon-mdx'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../molecules/dialogs/KeyNameDialog.js?${Environment?.version || ''}`,
        name: 'chat-m-key-name-dialog'
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

  get dialog () {
    return this.root.querySelector('chat-m-key-name-dialog')
  }

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }
}
