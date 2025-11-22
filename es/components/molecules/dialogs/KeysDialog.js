// @ts-check
import Dialog from '../../../../../web-components-toolbox/src/es/components/molecules/dialog/Dialog.js'

/* global self */
/* global Environment */

/**
* @export
* @class Dialog
* https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
* @type {CustomElementConstructor}
*/
export default class KeysDialog extends Dialog {
  constructor (options = {}, ...args) {
    super({ ...options }, ...args)

    // TODO: keys event listener -> render when dialog open

    const superShowEventListener = this.showEventListener
    this.showEventListener = event => {
      // TODO: render last keys data
      return superShowEventListener(event)
    }

    // TODO: Dialog closed - return selected key
    // TODO: key crud(d=disable+delete)
  }

  connectedCallback () {
    if (this.shouldRenderCustomHTML()) this.renderCustomHTML()
    const result = super.connectedCallback()
    if (this.isConnected) this.connectedCallbackOnce()
    return result
  }

  connectedCallbackOnce () {
    // TODO: request keys
    this.connectedCallbackOnce = () => {}
  }

  disconnectedCallback () {
    super.disconnectedCallback()
    this.close()
  }

  /**
     * evaluates if a render is necessary
     *
     * @return {boolean}
     */
  shouldRenderCustomHTML () {
    return !this.root.querySelector(this.cssSelector + ' > dialog')
  }

  /**
   * renders the css
   */
  renderCSS () {
    const result = super.renderCSS()
    this.setCss(/* css */`
      :host > dialog {
        --dialog-top-slide-in-a-text-decoration: underline;
        scrollbar-color: var(--color) var(--background-color);
        scrollbar-width: thin;
        transition: height 0.3s ease-out;
      }
    `, undefined, false)
    return result
  }

  /**
   * Render HTML
   * @returns Promise<void>
   */
  renderCustomHTML () {
    this.html = /* html */`
      <dialog>
        <wct-menu-icon id="close" no-aria class="open sticky" namespace="menu-icon-close-" no-click background style="--outline-style-focus-visible: none;"></wct-menu-icon>
        <h4>Keys:</h4>
        <p>keys...</p>
      </dialog>
    `
    new Promise(resolve => this.dispatchEvent(new CustomEvent('yjs-get-keys', {
      detail: {resolve},
      bubbles: true,
      cancelable: true,
      composed: true
    }))).then(keyContainers => (this.html = keyContainers.reduce((acc, keyContainer, i) => /* html */`
      ${acc}<li>Key ${i + 1}: <input value='${JSON.stringify(keyContainer)}' type=password /></li>
    `, '<ul>') + '</ul>'))
    return this.fetchModules([
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../atoms/menuIcon/MenuIcon.js?${Environment?.version || ''}`,
        name: 'wct-menu-icon'
      }
    ])
  }
}
