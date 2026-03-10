// @ts-check
import { Shadow } from '../../../../../event-driven-web-components-prototypes/src/Shadow.js'
import { escapeHTML } from '../../../../../event-driven-web-components-prototypes/src/helpers/Helpers.js'
import { getHexColor } from '../../../../../Helpers.js'

/* global self */
/* global Environment */

/**
* @export
* @class KeyRequestMessage
* @type {CustomElementConstructor}
*/
export default class KeyRequestMessage extends Shadow() {
  constructor (textObj, options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, tabindex: 'no-tabindex', ...options }, ...args)

    if (this.template) {
      this.textObj = JSON.parse(this.template.content.textContent)
    } else {
      this.textObj = textObj
    }

    this.clickEventListener = async event => {
      event.preventDefault()
      event.stopPropagation()
      if (!this.keyContainer) return
      const user = (await new Promise(resolve => this.dispatchEvent(new CustomEvent('yjs-get-user', {
        detail: {
          resolve,
          uid: this.textObj.uid
        },
        bubbles: true,
        cancelable: true,
        composed: true
      })))).user
      let publicKey
      try {
        publicKey = JSON.parse(user.publicKey)
      } catch (error) {
        return console.warn('Users publicKey is broken!', user)
      }
      const shared = await new Promise(resolve => this.dispatchEvent(new CustomEvent('yjs-share-key', {
        detail: {
          resolve,
          key: this.keyContainer,
          publicKey
        },
        bubbles: true,
        cancelable: true,
        composed: true
      })))
      if (shared.error) return
      this.setAttribute('answered', '')
      this.dispatchEvent(new CustomEvent('chat-add', {
        detail: {
          type: 'key-answer',
          noDefaultEncryption: true,
          sharedEncrypted: shared.encrypted,
          keyName: this.keyContainer.public.name,
          keyEpoch: this.keyContainer.key.epoch,
          receiver: user
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
      :host([answered]), :host([self]), :host([unknown]) {
        --a-color: var(--color-disabled);
        --a-color-visited: var(--a-color);
        --a-text-decoration: none;
        pointer-events: none;
      }
      :host > section > a #answered, :host([answered]) > section > a #answer {
        display: none;
      }
      :host([answered]) > section > a #answered {
        display: inline;
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
    if (this.textObj.isSelf) {
      this.setAttribute('self', '')
      this.html = /* html */`
        <section>
          <a href=#>
            <wct-icon-mdx id=icon title="Request key" icon-url="../../../../../../img/icons/key-square.svg" size="3em" hover-selector="a"></wct-icon-mdx>
            <p>"${
              // @ts-ignore
              escapeHTML(this.textObj.key.public?.name || this.textObj.public?.name)}" requested...</p>
          </a>
        </section>
      `
      this.renderHexColor()
    } else {
      this.html = /* html */'<section></section>'
      new Promise(resolve => this.dispatchEvent(new CustomEvent('yjs-get-key', {
        detail: {
          resolve,
          // @ts-ignore
          epoch: this.textObj.key.epoch
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))).then(keyContainer => {
        if (keyContainer) {
          this.keyContainer = keyContainer
          this.section.innerHTML = /* html */`
            <a href=#>
              <p><span id=answer>Please, send me the</span><span id=answered>Answered with</span> key:</p>
              <wct-icon-mdx id=icon title="Request key" icon-url="../../../../../../img/icons/key-square.svg" size="3em" hover-selector="a"></wct-icon-mdx>
              <p>"${
                // @ts-ignore
                escapeHTML(this.textObj.key.public?.name || this.textObj.public?.name)}"</p>
            </a>
          `
        } else {
          this.setAttribute('unknown', '')
          this.section.innerHTML = /* html */`
            <a href=#>
              <p>Key:</p>
              <wct-icon-mdx id=icon title="Request key" icon-url="../../../../../../img/icons/key-square.svg" size="3em" hover-selector="a"></wct-icon-mdx>
              <p>"${
                // @ts-ignore
                escapeHTML(this.textObj.key.public?.name || this.textObj.public?.name)}" is unknown</p>
            </a>
          `
        }
        this.renderHexColor()
      })
    }
    return this.fetchModules([
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../../web-components-toolbox/src/es/components/atoms/iconMdx/IconMdx.js?${Environment?.version || ''}`,
        name: 'wct-icon-mdx'
      }
    ])
  }

  renderHexColor () {
    getHexColor(this.textObj.key.epoch).then(hex => this.icon.setAttribute('style', `--color: ${hex}`))
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
