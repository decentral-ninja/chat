// @ts-check
import { Shadow } from '../../../../../event-driven-web-components-prototypes/src/Shadow.js'

/* global self */
/* global Environment */

/**
* @export
* @class KeyName
* @type {CustomElementConstructor}
*/
export default class KeyName extends Shadow() {
  constructor (options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, tabindex: 'no-tabindex', ...options }, ...args)

    this.clickEventListener = event => this.dispatchEvent(new CustomEvent('keys-dialog-show-event', {
      detail: {
        command: 'show-modal',
        checkbox: true,
        epoch: this.getAttribute('epoch')
      },
      bubbles: true,
      cancelable: true,
      composed: true
    }))
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
    return !this.iconStates
  }

  /**
   * renders the css
   */
  renderCSS () {
    this.css = /* css */`
      :host {
        --color: var(--a-color);
        --color-hover: var(--color-yellow);
        cursor: pointer;
      }
      :host > section {
        display: flex;
      }
      :host > section > p {
        position: absolute;
        left: calc(100% - var(--padding));
        bottom: 0;
        margin: 0;
        padding: 0;
        font-size: 0.65em;
        white-space: nowrap;
        color: var(--color);
        transition: var(--transition);
      }
      :host(:hover) > section > p {
        color: var(--color-yellow);
      }
    `
  }

  /**
   * Render HTML
   * @prop {string} keyName
   * @returns Promise<void>
   */
  renderHTML () {
    this.html = /* html */`
      <section id=section-key-icon>
        <a-icon-states id=key-icon>
          <template>
            <a-icon-combinations state="default" namespace=icon-combinations-add-key->
              <template>
                <wct-icon-mdx title="No encryption key active!" icon-url="../../../../../../img/icons/key-square.svg" size="1.8em" hover-selector="section#section-key-icon"></wct-icon-mdx>
                <wct-icon-mdx title="No encryption key active!" icon-url="../../../../../../img/icons/plus.svg" size="0.9em" hover-selector="section#section-key-icon"></wct-icon-mdx>
              </template>
            </a-icon-combinations>
          </template>
        </a-icon-states>
        <p>No Active Key</p>
      </section>
    `
    return this.fetchModules([
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../../components/atoms/iconStates/IconStates.js?${Environment?.version || ''}`,
        name: 'a-icon-states'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../../components/atoms/iconCombinations/IconCombinations.js?${Environment?.version || ''}`,
        name: 'a-icon-combinations'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../../web-components-toolbox/src/es/components/atoms/iconMdx/IconMdx.js?${Environment?.version || ''}`,
        name: 'wct-icon-mdx'
      }
    ])
  }

  get iconStates () {
    return this.root.querySelector('a-icon-states')
  }

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }
}
