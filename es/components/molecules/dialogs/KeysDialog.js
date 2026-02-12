// @ts-check
import Dialog from '../../../../../web-components-toolbox/src/es/components/molecules/dialog/Dialog.js'
import { scrollElIntoView } from '../../../../../event-driven-web-components-prototypes/src/helpers/Helpers.js'

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

    this._showEventListener = this.showEventListener
    this.showEventListener = event => {
      const result = this._showEventListener(event)
      if (event.detail?.id) this.setActive('id', event.detail.id, [this.keysDiv])
      return result
    }

    this.dialogWasClosed = false
    const superClose = this.close
    this.close = () => {
      // TODO: Dialog closed - return selected key
      this.dialogWasClosed = true
      return superClose()
    }

    this.clickAddKeyElEventListener = event => this.dispatchEvent(new CustomEvent('yjs-set-new-key', {
      bubbles: true,
      cancelable: true,
      composed: true
    }))

    this.keysEventListener = event => {
      this.renderData(event.detail.keyContainers || event.detail)
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
    this.addKeyEl.addEventListener('click', this.clickAddKeyElEventListener)
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
    this.addKeyEl.removeEventListener('click', this.clickAddKeyElEventListener)
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
      :host > dialog > section[controls] {
        margin-bottom: 1em;
      }
      :host > dialog > section[controls] > * {
        --color: var(--color-secondary);
        cursor: pointer;
      }
      :host > dialog > section[controls] > *:hover {
        --color: var(--color-yellow);
      }
      :host > dialog > section[controls], :host > dialog > #keys {
        display: flex;
        flex-wrap: wrap;
        gap: 1em;
      }
      :host > dialog > #keys > chat-m-key, :host > dialog > #keys > wct-load-template-tag {
        width: calc(33.3% - 0.66em);
      }
      :host > dialog > #keys > wct-load-template-tag {
        min-height: 25em;
      }
      @media only screen and (max-width: 1200px) {
        :host > dialog > #keys > chat-m-key, :host > dialog > #keys > wct-load-template-tag {
          width: calc(50% - 0.5em);
        }
      }
      @media only screen and (max-width: ${this.mobileBreakpoint}) {
        :host > dialog > #keys > chat-m-key, :host > dialog > #keys > wct-load-template-tag {
          width: 100%;
        }
      }
      @media only screen and (min-width: 1500px) {
        :host > dialog > #keys > chat-m-key, :host > dialog > #keys > wct-load-template-tag {
          width: calc(25% - 0.75em);
        }
      }
      @media only screen and (min-width: 2500px) {
        :host > dialog > #keys > chat-m-key, :host > dialog > #keys > wct-load-template-tag {
          width: calc(20% - 0.8em);
        }
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
        <section controls>
          <a-icon-combinations id=add-key add-key title=keypair>
            <template>
              <wct-icon-mdx title="Generate key"  icon-url="../../../../../../img/icons/key-square.svg" size="3em" no-hover></wct-icon-mdx>
              <wct-icon-mdx title="Generate key"  icon-url="../../../../../../img/icons/plus.svg" size="1.5em" no-hover></wct-icon-mdx>
            </template>
          </a-icon-combinations>
        </section>
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
        path: `${this.importMetaUrl}../loadTemplateTag/LoadTemplateTag.js?${Environment?.version || ''}`,
        name: 'wct-load-template-tag'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../atoms/iconMdx/IconMdx.js?${Environment?.version || ''}`,
        name: 'wct-icon-mdx'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../../../chat/es/components/molecules/Key.js?${Environment?.version || ''}`,
        name: 'chat-m-key'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../../../components/atoms/iconCombinations/IconCombinations.js?${Environment?.version || ''}`,
        name: 'a-icon-combinations'
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
    // TODO: Decide here, if the component will be info, select option for single encryption key (message) or select checkbox for multiple encryption keys (share with user)
    KeysDialog.renderKeys(this.keysDiv, keyContainers, this.dialogWasClosed)
    this.dialogWasClosed = false
  }

  /**
   * Description
   * 
   * @param {any} div
   * @param {import('../../../../../event-driven-web-components-yjs/src/es/controllers/Keys.js').KEY_CONTAINERS} keyContainers
   * @param {boolean} dialogWasClosed
   * @returns {void}
   */
  static renderKeys (div, keyContainers, dialogWasClosed) {
    const tempDiv = document.createElement('div')
    // @ts-ignore
    tempDiv.innerHTML = keyContainers.error
      // @ts-ignore
      ? `<span style="color: red;">Error: ${JSON.stringify(keyContainers.error)}</span>`
      : keyContainers.reverse().reduce((acc, keyContainer, i) => {
        /// / render or update
        // @ts-ignore
        const epoch = keyContainer.key.epoch
        const renderKey = () => KeysDialog.renderKey(epoch, keyContainer, i)
        let key
        if ((key = div.querySelector(`[epoch='${epoch}']`))) {
          if (typeof key.update === 'function') {
            // dialogWasClosed gives indication to provider updateOrder
            key.update(keyContainer, i, dialogWasClosed)
          } else {
            key.outerHTML = renderKey()
          }
        } else {
          return acc + renderKey()
        }
        return acc
      }, '')
    Array.from(tempDiv.children).forEach(child => div.prepend(child))
  }

  /**
   * Render a key component
   * 
   * @static
   * @param {string} epoch
   * @param {import('../../../../../event-driven-web-components-yjs/src/es/controllers/Keys.js').KEY_CONTAINER} keyContainer
   * @param {number} i
   * @param {boolean} [active=false]
   * @returns {string}
   */
  static renderKey (epoch, keyContainer, i, active = false) {
    return /* html */`<wct-load-template-tag epoch=${epoch} no-css style="order: ${i};" copy-class-list ${active ? 'class=active' : ''}><template><chat-m-key ${active ? 'class=active' : ''}><template>${JSON.stringify({ epoch, keyContainer, order: i })}</template></chat-m-key></template></wct-load-template-tag>`
  }

  /**
   * Description
   * 
   * @async
   * @param {string} attributeName
   * @param {string} attributeValue
   * @param {any[]} parentNodes
   * @param {boolean} [active=true]
   * @param {boolean} [scroll=true]
   * @returns {Promise<void>}
   */
  async setActive (attributeName, attributeValue, parentNodes, active = true, scroll = true) {
    parentNodes.reduce((acc, parentNode) => [...acc, ...(parentNode.querySelectorAll('.active') || [])], []).forEach(node => node.classList.remove('active'))
    let node
    if (active) {
      // @ts-ignore
      if (parentNodes.some(parentNode => (node = parentNode.querySelector(`[${attributeName}='${attributeValue}']`)))) node.classList.add('active')
      if (scroll) scrollElIntoView(() => {
        let node
        if(parentNodes.some(parentNode => (node = parentNode.querySelector('.active')))) return node
        return null
      }, ':not([intersecting])', this.dialogEl, { behavior: 'smooth', block: 'nearest' }, 500)
    }
    if (node) {
      this.setAttribute('active', attributeValue)
    } else {
      this.removeAttribute('active')
    }
  }

  get keysDiv () {
    return this.root.querySelector('#keys')
  }

  get addKeyEl () {
    return this.root.querySelector('#add-key')
  }

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }
}
