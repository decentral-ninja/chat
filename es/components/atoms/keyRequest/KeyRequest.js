// @ts-check
import { Shadow } from '../../../../../event-driven-web-components-prototypes/src/Shadow.js'
import { escapeHTML } from '../../../../../event-driven-web-components-prototypes/src/helpers/Helpers.js'
import { getHexColor } from '../../../../../Helpers.js'

/* global self */
/* global Environment */

/**
* @export
* @class KeyRequest
* @type {CustomElementConstructor}
*/
export default class KeyRequest extends Shadow() {
  constructor (keyContainer, options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, tabindex: 'no-tabindex', ...options }, ...args)

    if (this.template) {
      /** @type {import('../../../../../event-driven-web-components-prototypes/src/controllers/Crypto.js').ENCRYPTED & {public: {name: string}}} */
      this.keyContainer = JSON.parse(this.template.content.textContent)
    } else {
      /** @type {import('../../../../../event-driven-web-components-prototypes/src/controllers/Crypto.js').ENCRYPTED & {public: {name: string}}} */
      this.keyContainer = keyContainer
    }
    this.setAttribute('epoch', this.keyContainer.key.epoch)

    this.clickEventListener = event => {
      event.preventDefault()
      event.stopPropagation()
      console.log('*********', event)
    }
  }

  connectedCallback () {
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
    this.addEventListener('click', this.clickEventListener)
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
    return !this.icon
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
    this.html = /* html */`
      <section>
        <a href=#>
          <p>Request unknown key:</p>
          <a-icon-combinations id=icon namespace=icon-combinations-add-key- title="Request key">
            <template>
              <wct-icon-mdx title="Request key"  icon-url="../../../../../../img/icons/key-square.svg" size="3em" hover-selector="a"></wct-icon-mdx>
              <wct-icon-mdx title="Request key"  icon-url="../../../../../../img/icons/plus.svg" size="1.5em" hover-selector="a"></wct-icon-mdx>
            </template>
          </a-icon-combinations>
          <p>"${escapeHTML(this.keyContainer.public.name)}"</p>
        </a>
        <p>to decrypt this message: "${this.keyContainer.text.substring(0, 10)}..."</p>
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
    getHexColor(this.getAttribute('epoch')).then(hex => this.icon.setAttribute('style', `--color: ${hex}`))
  }

  get icon () {
    return this.root.querySelector('#icon')
  }

  get template () {
    return this.root.querySelector('template')
  }

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }
}
