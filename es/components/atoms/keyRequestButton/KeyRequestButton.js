// @ts-check
import { Shadow } from '../../../../../event-driven-web-components-prototypes/src/Shadow.js'
import { escapeHTML } from '../../../../../event-driven-web-components-prototypes/src/helpers/Helpers.js'
import { getHexColor } from '../../../../../Helpers.js'

/* global self */
/* global Environment */

/**
* @export
* @class KeyRequestButton
* @type {CustomElementConstructor}
*/
export default class KeyRequestButton extends Shadow() {
  constructor (textObj, options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, tabindex: 'no-tabindex', ...options }, ...args)

    if (this.template) {
      this.textObj = JSON.parse(this.template.content.textContent)
      /** @type {import('../../../../../event-driven-web-components-prototypes/src/controllers/Crypto.js').ENCRYPTED & {public: {name: string}}} */
      this.encrypted = this.textObj.encrypted
    } else {
      this.textObj = textObj
      /** @type {import('../../../../../event-driven-web-components-prototypes/src/controllers/Crypto.js').ENCRYPTED & {public: {name: string}}} */
      this.encrypted = this.textObj.encrypted
    }

    this.clickEventListener = event => {
      event.preventDefault()
      event.stopPropagation()
      /** @type {import('../../../../../event-driven-web-components-prototypes/src/controllers/Crypto.js').KEY_EPOCH & {public: {name: string}}} */
      const key = {
        public: this.encrypted?.public,
        ...this.encrypted?.key
      }
      this.setAttribute('requested', '')
      this.dispatchEvent(new CustomEvent('chat-add', {
        detail: {
          type: 'key-request',
          noDefaultEncryption: true,
          key,
          replyToTextObj: this.textObj
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))
    }
  }

  connectedCallback () {
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
    this.addEventListener('click', this.clickEventListener, { once: true })
  }

  disconnectedCallback () {
    this.removeEventListener('click', this.clickEventListener)
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
    return !this.section
  }

  /**
   * renders the css
   */
  renderCSS () {
    this.css = /* css */`
      :host {
        --a-display: flex;
        --a-margin: 0 auto;
        --a-text-decoration: underline;
        --p-margin: 0;
        --color-hover: var(--color-yellow);
        --svg-filter: drop-shadow(0px 0px 0.075em var(--color-white));
        white-space: collapse;
      }
      :host > section > a {
        gap: 0.5em;
        align-items: flex-end;
        justify-content: center;
      }
      :host([requested]) {
        --a-color: var(--color-disabled);
        --a-color-visited: var(--a-color);
        --a-text-decoration: none;
        pointer-events: none;
      }
      :host > section > a #requested, :host([requested]) > section > a #request {
        display: none;
      }
      :host([requested]) > section > a #requested {
        display: inline;
      }
      @media only screen and (max-width: _max-width_) {
        :host > section > a {
          flex-direction: column;
          align-items: center;
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
   * @returns Promise<void>
   */
  renderHTML () {
    if (this.textObj.requested) this.setAttribute('requested', '')
    this.html = /* html */`
      <section>
        <a href=#>
          <p><span id=request>Click here to request</span><span id=requested>Requested</span> key:</p>
          <a-icon-combinations id=icon namespace=icon-combinations-add-key- title="Request key">
            <template>
              <wct-icon-mdx title="Request key" icon-url="../../../../../../img/icons/key-square.svg" size="3em" hover-selector="a"></wct-icon-mdx>
              <wct-icon-mdx title="Request key" icon-url="../../../../../../img/icons/plus.svg" size="1.5em" hover-selector="a"></wct-icon-mdx>
            </template>
          </a-icon-combinations>
          <p>"${
            // @ts-ignore
            escapeHTML(this.encrypted?.key.public?.name || this.encrypted?.public?.name)}"</p>
        </a>
        <p>to decrypt this message: "${this.encrypted?.text.substring(0, 10)}..."</p>
      </section>
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
        path: `${this.importMetaUrl}../../../../../components/atoms/iconCombinations/IconCombinations.js?${Environment?.version || ''}`,
        name: 'a-icon-combinations'
      }
    ])
  }

  renderHexColor () {
    getHexColor(this.encrypted?.key.epoch).then(hex => this.icon.setAttribute('style', `--color: ${hex}`))
  }

  get section () {
    return this.root.querySelector('section')
  }

  get icon () {
    return this.root.querySelector('#icon')
  }

  get template () {
    return this.root.querySelector('template')
  }
}
