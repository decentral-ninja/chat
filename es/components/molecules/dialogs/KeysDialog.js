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

    const superShow = this.show
    this.show = command => {
      new Promise(resolve => this.dispatchEvent(new CustomEvent('yjs-get-keys', {
        detail: {resolve},
        bubbles: true,
        cancelable: true,
        composed: true
      }))).then(keyContainers => this.renderData(keyContainers))
      return superShow(command)
    }

    const superClose = this.close
    this.close = () => {
      // TODO: Dialog closed - return selected key
      return superClose()
    }

    this.keysEventListener = event => {
      this.renderData(event.detail.keyContainers || event.detail)
      console.log('****keysEventListener*****', event.detail.keyContainers || event.detail)
    }

    this.keyChangedEventListener = event => {
      // TODO: call functions regarding key changes
      console.log('****keyChangedEventListener*****', event.detail.modified || event.detail.deleted || event.detail.shared)
    }
    // TODO: key crud(d=disable+delete)
  }

  connectedCallback () {
    if (this.shouldRenderCustomHTML()) this.renderCustomHTML()
    const result = super.connectedCallback()
    this.globalEventTarget.addEventListener('yjs-keys', this.keysEventListener)
    this.globalEventTarget.addEventListener('yjs-new-key', this.keysEventListener)
    this.globalEventTarget.addEventListener('yjs-key-property-modified', this.keyChangedEventListener)
    this.globalEventTarget.addEventListener('yjs-key-deleted', this.keyChangedEventListener)
    this.globalEventTarget.addEventListener('yjs-shared-key', this.keysEventListener)
    this.globalEventTarget.addEventListener('yjs-received-key', this.keysEventListener)
    return result
  }

  disconnectedCallback () {
    super.disconnectedCallback()
    this.globalEventTarget.removeEventListener('yjs-keys', this.keysEventListener)
    this.globalEventTarget.removeEventListener('yjs-new-key', this.keysEventListener)
    this.globalEventTarget.removeEventListener('yjs-key-property-modified', this.keyChangedEventListener)
    this.globalEventTarget.removeEventListener('yjs-key-deleted', this.keyChangedEventListener)
    this.globalEventTarget.removeEventListener('yjs-shared-key', this.keysEventListener)
    this.globalEventTarget.removeEventListener('yjs-received-key', this.keysEventListener)
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
        <a-icon-combinations keys>
          <template>
            <wct-icon-mdx title="Private key" style="--color-hover: var(--color-red-full); color:var(--color-red);" icon-url="../../../../../../img/icons/key-filled.svg" size="20em"></wct-icon-mdx>
            <wct-icon-mdx title="Public key" style="--color-hover: var(--color-green-full); color:var(--color-green-dark);" icon-url="../../../../../../img/icons/key-filled.svg" size="20em"></wct-icon-mdx>
          </template>
        </a-icon-combinations>
        <div id=keys></div>
      </dialog>
    `
    return this.fetchModules([
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../atoms/menuIcon/MenuIcon.js?${Environment?.version || ''}`,
        name: 'wct-menu-icon'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../../../components/atoms/iconCombinations/IconCombinations.js?${Environment?.version || ''}`,
        name: 'a-icon-combinations'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../loadTemplateTag/LoadTemplateTag.js?${Environment?.version || ''}`,
        name: 'wct-load-template-tag'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../../../chat/es/components/molecules/Key.js?${Environment?.version || ''}`,
        name: 'chat-m-key'
      }
    ])
  }

  /**
   * initializes the rendering of the keys
   * 
   * @param {import('../../../../../event-driven-web-components-yjs/src/es/controllers/Keys.js').KEY_CONTAINERS} keyContainers
   * @returns {void}
   */
  renderData (keyContainers) {
    console.log('*********', 'render')
    this.keysDiv.innerHTML = keyContainers.reduce((acc, keyContainer, i) => /* html */`
      ${acc}<li>Key ${i + 1}: <input value='${JSON.stringify(keyContainer)}' type=password /></li>
    `, '<ul>') + '</ul>'
  }

  static async renderKeys (div, data, keyDialogWasClosed, force) {
    const keys = Array.from(await data.getCompleteKeys(force))
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = keys.reduce((acc, [name, keyData], i) => {
      /// / render or update
      // @ts-ignore
      const id = `${self.Environment?.keyNamespace || 'p_'}${name.replaceAll('.', '-')}` // string <ident> without dots https://developer.mozilla.org/en-US/docs/Web/CSS/ident
      const renderKey = () => KeysDialog.renderKey(id, name, i, keyData)
      let key
      if ((key = div.querySelector(`#${id}`))) {
        if (typeof key.update === 'function') {
          // force triggers removeDataUpdating on key, since it got fresh data when forced (renderDataForce) since this occurs on fresh data
          key.update(keyData, i, keyDialogWasClosed, force)
        } else {
          key.outerHTML = renderKey()
        }
      } else {
        return acc + renderKey()
      }
      return acc
    }, '')
    Array.from(tempDiv.children).forEach(child => div.appendChild(child))
  }

  /**
   * Render a key component
   * 
   * @static
   * @param {string} id
   * @param {string} name
   * @param {number} i
   * @param {any} keyData
   * @param {boolean} [active=false]
   * @returns {string}
   */
  static renderKey (id, name, i, keyData, active = false) {
    return /* html */`<wct-load-template-tag id=${id} no-css style="order: ${i};" copy-class-list ${active ? 'class=active' : ''}><template><chat-m-key ${active ? 'class=active' : ''}><template>${JSON.stringify({ id, name, data: keyData, order: i })}</template></chat-m-key></template></wct-load-template-tag>`
  }

  get keysDiv () {
    return this.root.querySelector('#keys')
  }

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }
}
