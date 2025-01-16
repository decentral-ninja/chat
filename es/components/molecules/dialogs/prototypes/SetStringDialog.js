// @ts-check
import Dialog from '../../../../../../web-components-toolbox/src/es/components/molecules/dialog/Dialog.js'

/**
* @export
* @class Dialog
* https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
* @type {CustomElementConstructor}
*/
export default class SetStringDialog extends Dialog {
  connectedCallback () {
    if (this.shouldRenderCustomHTML()) this.renderCustomHTML()
    return super.connectedCallback()
  }

  /**
     * evaluates if a render is necessary
     *
     * @return {boolean}
     */
  shouldRenderCustomHTML() {
    return !this.root.querySelector(this.cssSelector + ' > dialog')
  }

  /**
   * renders the css
   */
  renderCSS() {
    const result = super.renderCSS()
    this.setCss(/* css */`
      :host {
        --p-font-size: 0.75em;
        --p-font-style: italic;
        --button-primary-width: 100%;
        --button-primary-height: 100%;
        --wct-input-input-height: 100%;
        --wct-input-height: var(--wct-input-input-height);
        --wct-input-border-radius: var(--border-radius) 0 0 var(--border-radius);
        --button-primary-border-radius: 0 var(--border-radius) var(--border-radius) 0;
        --wct-input-placeholder-color: lightgray;
        font-size: 1rem;
      }
      :host > dialog {
        scrollbar-color: var(--color) var(--background-color);
        scrollbar-width: thin;
      }
    `, undefined, false)
    return result
  }

  /**
   * Render HTML
   * this function must be called in sync
   * 
   * @returns Promise<void>
   */
  renderCustomHTML(placeholder, value, prependDialog = '', appendDialog = '', prependGridSection = '', appendGridSection = '') {
    this.html = /* html */`
      <dialog>
        ${prependDialog}
        <wct-menu-icon id="close" no-aria class="open sticky" namespace="menu-icon-close-" no-click></wct-menu-icon>
        ${appendDialog}
      </dialog>
    `
    return Promise.all([
      this.dialogPromise,
      this.fetchModules([
        {
          // @ts-ignore
          path: `${this.importMetaUrl}../../../../../../web-components-toolbox/src/es/components/organisms/grid/Grid.js?${Environment?.version || ''}`,
          name: 'wct-grid'
        },
        {
          // @ts-ignore
          path: `${this.importMetaUrl}../../../../../../web-components-toolbox/src/es/components/atoms/button/Button.js?${Environment?.version || ''}`,
          name: 'wct-button'
        },
        {
          // @ts-ignore
          path: `${this.importMetaUrl}../../../../../../web-components-toolbox/src/es/components/atoms/input/Input.js?${Environment?.version || ''}`,
          name: 'wct-input'
        },
        {
          // @ts-ignore
          path: `${this.importMetaUrl}../../../../../../web-components-toolbox/src/es/components/atoms/menuIcon/MenuIcon.js?${Environment?.version || ''}`,
          name: 'wct-menu-icon'
        }
      ])
    ]).then(() => {
      const div = document.createElement('div')
      div.innerHTML = /* html */`
        <wct-grid auto-fill="20%">
          <section>
            ${prependGridSection}
            <wct-input id="input" inputId="input" placeholder="${placeholder}" namespace="wct-input-" namespace-fallback grid-column="1/5" value="${value}" submit-search autofocus force></wct-input>
            <wct-button namespace="button-primary-" request-event-name="submit-input">set</wct-button>
            ${appendGridSection}
          </section>
        </wct-grid>
      `
      Array.from(div.childNodes).forEach(node => this.dialog.appendChild(node))
    })
  }
}
