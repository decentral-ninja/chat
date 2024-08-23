// @ts-check
import Dialog from '../../../../../web-components-toolbox/src/es/components/molecules/dialog/Dialog.js'

/**
* @export
* @class Dialog
* In Progress
* https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
* @type {CustomElementConstructor}
*/
export default class MessageDialog extends Dialog {
  connectedCallback () {
    if (this.shouldRenderCustomHTML()) this.renderCustomHTML()
    super.connectedCallback()
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
      :host > dialog {
        scrollbar-color: var(--color) var(--background-color);
        scrollbar-width: thin;
      }
      :host > dialog [delete] {
        display: contents;
      }
      :host([deleted]) > dialog [delete] {
        display: none;
      }
      :host > dialog [undo] {
        display: none;
      }
      :host([deleted]) > dialog [undo] {
        display: contents;
      }
      :host > dialog #controls {
        display: flex;
        justify-content: flex-end;
        padding: 0.5em;
        border: 1px solid lightgray;
        border-top: 0;
        border-radius: 0 0 0.5em 0.5em;
      }
      :host > dialog #controls > * {
        --color: var(--color-secondary);
        --color-hover: var(--color-yellow);
      }
      :host > dialog #controls > #delete {
        display: flex;
      }
    `, undefined, false)
    return result
  }

  /**
   * Render HTML
   * @returns Promise<void>
   */
  renderCustomHTML() {
    this.html = /* html */`
      <wct-menu-icon id="close" class="open" namespace="menu-icon-close-" no-click></wct-menu-icon>
      <dialog>
        <h4>Message:</h4>
        ${this.hasAttribute('self')
          ? /* html */`
            <div id="controls">
              <div id="delete">
                <a-icon-mdx delete icon-url="../../../../../../img/icons/trash.svg" size="2em"></a-icon-mdx>
                <a-icon-mdx undo icon-url="../../../../../../img/icons/trash-off.svg" size="2em"></a-icon-mdx>
              </div>
            </div>
          `
          : ''
        }
      </dialog>
    `
    return this.fetchModules([
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../atoms/menuIcon/MenuIcon.js?${Environment?.version || ''}`,
        name: 'wct-menu-icon'
      },
      {
        path: `${this.importMetaUrl}../../atoms/iconMdx/IconMdx.js`,
        name: 'a-icon-mdx'
      }
    ])
  }
}
