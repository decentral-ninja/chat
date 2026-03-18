// @ts-check
import Dialog from '../../../../../web-components-toolbox/src/es/components/molecules/dialog/Dialog.js'
import { scrollElIntoView } from '../../../../../event-driven-web-components-prototypes/src/helpers/Helpers.js'

/* global self */
/* global Environment */
/* global FileReader */

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
        detail: { resolve },
        bubbles: true,
        cancelable: true,
        composed: true
      }))).then(async keyContainers => {
        await this.renderData(keyContainers)
        // use the event details from the previously triggered this.showEventListener which calls this.show
        let epoch
        if (this.showEventDetail) {
          if (this.showEventDetail.checkbox) {
            this.setAttribute('checkbox', '')
            KeysDialog.setKeysClassList(this.keyEls, 'add', 'checkbox')
          } else {
            this.removeAttribute('checkbox')
            KeysDialog.setKeysClassList(this.keyEls, 'remove', 'checkbox')
          }
          epoch = this.showEventDetail.epoch
          this.messageUid = this.showEventDetail.messageUid
          this.showEventDetail = null
        }
        if (this.hasAttribute('checkbox')) {
          KeysDialog.setKeysClassList(this.keyEls, 'remove', 'no-checkbox', true)
        } else {
          KeysDialog.setKeysClassList(this.keyEls, 'add', 'no-checkbox', true)
        }
        this.setActive('epoch', epoch, [this.keysDiv], undefined, undefined, this.hasAttribute('checkbox'))
        if (this.hasChecked) {
          this.setAttribute('has-checked', '')
        } else {
          this.removeAttribute('has-checked')
        }
      })
      return superShow(command)
    }

    this._showEventListener = this.showEventListener
    this.showEventListener = event => {
      this.showEventDetail = event.detail
      return this._showEventListener(event)
    }

    this.dialogWasClosed = false
    const superClose = this.close
    this.close = () => {
      if (this.deletedKeyEls.length) {
        new Promise(resolve => this.dispatchEvent(new CustomEvent('yjs-delete-key', {
          detail: {
            resolve,
            epochs: this.deletedKeyEls.map(el => el.getAttribute('epoch')),
            dispatch: true
          },
          bubbles: true,
          cancelable: true,
          composed: true
        }))).then(result => this.deletedKeyEls.forEach(el => el.remove()))
      }
      this.dialogWasClosed = true
      this.removeAttribute('touched')
      return superClose()
    }

    this.clickAddKeyElEventListener = event => {
      this.addKeyEl.setAttribute('updating', '')
      this.dispatchEvent(new CustomEvent('yjs-set-new-key', {
        detail: {
          setActiveRoomDefaultKey: !this.keyEls.some(keyEl => keyEl.hasAttribute('checked') || keyEl.classList.contains('is-default'))
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))
    }

    this.clickUploadKeyElEventListener = event => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'text/plain'
      input.multiple = true
      input.onchange = () => {
        if (!input.files?.length) return
        Array.from(input.files).forEach(file => {
          const reader = new FileReader()
          reader.onload = () => this.dispatchEvent(new CustomEvent('yjs-set-key', {
            detail: {
              keyContainer: reader.result,
              setActiveRoomDefaultKey: !this.keyEls.some(keyEl => keyEl.hasAttribute('checked') || keyEl.classList.contains('is-default'))
            },
            bubbles: true,
            cancelable: true,
            composed: true
          }))
          reader.readAsText(file)
        })
      }
      input.click()
    }

    this.clickCancelElEventListener = event => {
      this.close()
      this.keyEls.forEach(key => {
        if (key.checkbox) {
          // @ts-ignore
          key.checkbox.checked = false
          // @ts-ignore
          key.inputEventListener(undefined, false)
        }
      })
    }

    this.clickEncryptElEventListener = event => {
      this.close()
      const epoch = this.hasAttribute('has-checked') ? this.keyEls.find(keyEl => keyEl.hasAttribute('checked'))?.getAttribute('epoch') : ''
      if (this.messageUid) {
        // TODO: Supply a checkbox to allow this new key become the ActiveRoomDefaultKey
        console.log('****TODO:*****', 'dispatch message change encryption with this.messageUid + epoch at Chat.js through Keys.js')
      } else {
        this.dispatchEvent(new CustomEvent('yjs-set-active-room-default-key', {
          detail: {
            epoch
          },
          bubbles: true,
          cancelable: true,
          composed: true
        }))
      }
    }

    this.keyCheckedEventListener = event => {
      event.stopPropagation()
      if (event.detail.checked) {
        this.setAttribute('has-checked', '')
        KeysDialog.setKeysClassList(this.keyEls, 'add', 'no-checkbox')
      } else {
        this.removeAttribute('has-checked')
        KeysDialog.setKeysClassList(this.keyEls, 'remove', 'no-checkbox')
      }
      if (event.detail.event) this.setAttribute('touched', '')
    }

    this.keysEventListener = event => {
      if (event.detail.error) return
      this.addKeyEl.removeAttribute('updating')
      if (this.isDialogOpen()) this.renderData(event.detail.keyContainers || event.detail)
    }
  }

  connectedCallback () {
    if (this.shouldRenderCustomHTML()) this.renderCustomHTML()
    const result = super.connectedCallback()
    this.addEventListener('key-checked', this.keyCheckedEventListener)
    this.addKeyEl.addEventListener('click', this.clickAddKeyElEventListener)
    this.uploadKeyEl.addEventListener('click', this.clickUploadKeyElEventListener)
    this.cancelEl.addEventListener('click', this.clickCancelElEventListener)
    this.encryptEl.addEventListener('click', this.clickEncryptElEventListener)
    this.removeEncryptionEl.addEventListener('click', this.clickEncryptElEventListener)
    this.globalEventTarget.addEventListener('yjs-keys', this.keysEventListener)
    this.globalEventTarget.addEventListener('yjs-new-key', this.keysEventListener)
    this.globalEventTarget.addEventListener('yjs-encrypted', this.keysEventListener)
    this.globalEventTarget.addEventListener('yjs-decrypted', this.keysEventListener)
    this.globalEventTarget.addEventListener('yjs-shared-key', this.keysEventListener)
    this.globalEventTarget.addEventListener('yjs-received-key', this.keysEventListener)
    return result
  }

  disconnectedCallback () {
    super.disconnectedCallback()
    this.removeEventListener('key-checked', this.keyCheckedEventListener)
    this.addKeyEl.removeEventListener('click', this.clickAddKeyElEventListener)
    this.uploadKeyEl.removeEventListener('click', this.clickUploadKeyElEventListener)
    this.cancelEl.removeEventListener('click', this.clickCancelElEventListener)
    this.encryptEl.removeEventListener('click', this.clickEncryptElEventListener)
    this.removeEncryptionEl.removeEventListener('click', this.clickEncryptElEventListener)
    this.globalEventTarget.removeEventListener('yjs-keys', this.keysEventListener)
    this.globalEventTarget.removeEventListener('yjs-new-key', this.keysEventListener)
    this.globalEventTarget.removeEventListener('yjs-encrypted', this.keysEventListener)
    this.globalEventTarget.removeEventListener('yjs-decrypted', this.keysEventListener)
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
      :host([checkbox]) > dialog > #title-default, :host(:not([checkbox])) > dialog > #title-checkbox {
        display: none;
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
      :host > dialog > section > #add-key, :host > dialog > section > #upload-key {
        --color-hover: var(--color-yellow);
        display: flex;
        gap: 0.25em;
        align-items: flex-end;
      }
      :host > dialog > section > #add-key[updating], :host > dialog > section > #upload-key[updating] {
        cursor: not-allowed;
        pointer-events: none;
      }
      :host > dialog > section > #add-key > p, :host > dialog > section > #upload-key > p {
        margin: 0;
        padding: 0;
        white-space: nowrap;
        color: var(--color);
        transition: var(--transition);
      }
      :host > dialog > #keys > chat-m-key, :host > dialog > #keys > wct-load-template-tag {
        width: calc(33.3% - 0.66em);
      }
      :host > dialog > #keys > wct-load-template-tag {
        min-height: 24em;
      }
      :host > dialog > section[buttons] {
        --button-primary-background-color-hover-custom: var(--color-yellow);
        --button-primary-background-color-custom: var(--color-green);
        --button-primary-border-color: var(--color-green);
        --button-secondary-color-hover-custom: var(--color-yellow);
        --button-secondary-border-color-hover-custom: var(--color-yellow);
        display: none;
        opacity: 0;
        transition: var(--transition);
        position: sticky;
        bottom: -1em;
        background: linear-gradient(180deg, transparent -70%, var(--background-color) 30%);
        margin-left: -1em;
        margin-right: -1em;
        padding: 1em;
        padding-top: 2em;
        gap: 1em;
        justify-content: flex-end;
      }
      :host > dialog > section[buttons] > #remove-encryption {
        --button-primary-background-color-custom: var(--color-secondary);
        --button-primary-border-color: var(--color-secondary);
      }
      :host([checkbox]) > dialog > section[buttons] {
        display: flex;
        opacity: 1;
      }
      :host(:not([has-checked])) > dialog > section[buttons] > #encrypt,
      :host([has-checked]) > dialog > section[buttons] > #remove-encryption,
      :host(:not([touched])) > dialog > section[buttons] > #remove-encryption,
      :host(:not([touched])) > dialog > section[buttons] > #encrypt,
      :host > dialog:has(> #keys > chat-m-key[checked].is-default) > section[buttons] > #encrypt {
        display: none;
      }
      :host > dialog > section[buttons] > wct-button::part(button) {
        gap: 0.25em;
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
        <h4 id=title-default>Keys:</h4>
        <h4 id=title-checkbox>Select a key:</h4>
        <section controls>
          <div id=add-key>
            <a-icon-states loading-size=2>
              <template>
                <a-icon-combinations state="default" namespace=icon-combinations-add-key- title="Add new key">
                  <template>
                    <wct-icon-mdx title="Generate key" icon-url="../../../../../../img/icons/key-square.svg" size="3em" no-hover></wct-icon-mdx>
                    <wct-icon-mdx title="Generate key" icon-url="../../../../../../img/icons/plus.svg" size="1.5em" no-hover></wct-icon-mdx>
                  </template>
                </a-icon-combinations>
              </template>
            </a-icon-states>
            <p>Generate key</p>
          </div>
          <div id=upload-key>
            <wct-icon-mdx title="Generate key" icon-url="../../../../../../img/icons/upload.svg" size="3em" hover-selector="div"></wct-icon-mdx>
            <p>Upload key textfile</p>
          </div>
        </section>
        <div id=keys></div>
        <section buttons>
          <wct-button id=cancel title="close" namespace="button-secondary-" click-no-toggle-active>close</wct-button>
          <wct-button id=encrypt title="encrypt" namespace="button-primary-" click-no-toggle-active><wct-icon-mdx title="encrypt" icon-url="../../../../../../img/icons/lock.svg" size="1em" no-hover class="icon-left"></wct-icon-mdx>set</wct-button>
          <wct-button id=remove-encryption title="remove encryption" namespace="button-primary-" click-no-toggle-active><wct-icon-mdx title="remove encryption" icon-url="../../../../../../img/icons/lock-open-2.svg" size="1em" no-hover class="icon-left"></wct-icon-mdx>unset</wct-button>
        </section>
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
        path: `${this.importMetaUrl}../../../../../../components/atoms/iconStates/IconStates.js?${Environment?.version || ''}`,
        name: 'a-icon-states'
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
   * @param {import('../../../../../event-driven-web-components-yjs/src/es/controllers/Keys.js').KEY_CONTAINERS|import('../../../../../event-driven-web-components-prototypes/src/controllers/Crypto.js').JSON_WEB_KEY_TO_CRYPTOKEY_ERROR|null} keyContainers
   * @returns {Promise<void>}
   */
  async renderData (keyContainers) {
    if (!keyContainers) return
    /** @type {import('../../../../../event-driven-web-components-yjs/src/es/controllers/Keys.js').KEY_CONTAINER} */
    const defaultKeyContainer = await new Promise(resolve => this.dispatchEvent(new CustomEvent('yjs-get-active-room-default-key', {
      detail: {
        resolve
      },
      bubbles: true,
      cancelable: true,
      composed: true
    })))
    KeysDialog.renderKeys(this.keysDiv, keyContainers, this.dialogWasClosed, this.hasAttribute('has-checked'), defaultKeyContainer?.key.epoch)
    this.dialogWasClosed = false
  }

  /**
   * Description
   *
   * @param {any} div
   * @param {import('../../../../../event-driven-web-components-yjs/src/es/controllers/Keys.js').KEY_CONTAINERS|import('../../../../../event-driven-web-components-prototypes/src/controllers/Crypto.js').JSON_WEB_KEY_TO_CRYPTOKEY_ERROR} keyContainers
   * @param {boolean} dialogWasClosed
   * @param {boolean} hasChecked
   * @param {string} defaultKeyEpoch
   * @returns {void}
   */
  static renderKeys (div, keyContainers, dialogWasClosed, hasChecked, defaultKeyEpoch) {
    const tempDiv = document.createElement('div')
    // @ts-ignore
    tempDiv.innerHTML = keyContainers.error
      // @ts-ignore
      ? `<span style="color: red;">Error: ${JSON.stringify(keyContainers.error)}</span>`
      : keyContainers
      // @ts-ignore
        .sort((a, b) => Math.max(a.private.origin?.timestamp || '', a.private.shared?.[0]?.timestamp || '', a.private.received?.[0]?.timestamp || '', a.private.encrypted?.[0]?.timestamp || '', a.private.decrypted?.[0]?.timestamp || '') - Math.max(b.private.origin?.timestamp || '', b.private.shared?.[0]?.timestamp || '', b.private.received?.[0]?.timestamp || '', b.private.encrypted?.[0]?.timestamp || '', b.private.decrypted?.[0]?.timestamp || ''))
        .reverse()
        .reduce((acc, keyContainer, i) => {
        /// / render or update
        // @ts-ignore
          const epoch = keyContainer.key.epoch
          const isDefault = defaultKeyEpoch
            ? defaultKeyEpoch === epoch
            : false
          const renderKey = () => KeysDialog.renderKey(epoch, keyContainer, i, false, hasChecked, isDefault)
          let key
          if ((key = div.querySelector(`[epoch='${epoch}']`))) {
            if (typeof key.update === 'function') {
            // dialogWasClosed gives indication to provider updateOrder
              key.update(keyContainer, i, dialogWasClosed)
              key.classList[isDefault ? 'add' : 'remove']('is-default')
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
   * @param {boolean} active
   * @param {boolean} hasChecked
   * @param {boolean} isDefault
   * @returns {string}
   */
  static renderKey (epoch, keyContainer, i, active, hasChecked, isDefault) {
    return /* html */`<wct-load-template-tag epoch=${epoch} no-css style="order: ${i};" copy-class-list class="${active ? 'active' : ''}${active && (hasChecked || isDefault) ? ' ' : ''}${hasChecked ? 'no-checkbox' : ''}${hasChecked && isDefault ? ' ' : ''}${isDefault ? 'is-default' : ''}"><template><chat-m-key ${active ? 'class=active' : ''}><template>${JSON.stringify({ epoch, keyContainer, order: i })}</template></chat-m-key></template></wct-load-template-tag>`
  }

  /**
   * @static
   * @param {HTMLElement[]} keys
   * @param {string} command
   * @param {string} className
   * @returns {void}
   */
  static setKeysClassList (keys, command, className, resetCheckbox = false) {
    keys.forEach(key => {
      key.classList[command](className)
      // @ts-ignore
      if (resetCheckbox && key.checkbox) {
        // @ts-ignore
        key.checkbox.checked = false
        // @ts-ignore
        key.inputEventListener(undefined, false)
      }
    })
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
   * @param {boolean} [setCheckbox=false]
   * @returns {void}
   */
  setActive (attributeName, attributeValue, parentNodes, active = true, scroll = true, setCheckbox = false) {
    parentNodes.reduce((acc, parentNode) => [...acc, ...(parentNode.querySelectorAll('.active') || [])], []).forEach(node => node.classList.remove('active'))
    if (!attributeName) return
    if (!attributeValue) return
    /** @type {any} */
    let node
    if (active) {
      if (parentNodes.some(parentNode => (node = parentNode.querySelector(`[${attributeName}='${attributeValue}']`)))) {
        node.classList.add('active')
        if (setCheckbox) {
          if (node.loadPromise) {
            node.loadPromise.then(node => {
              if (node.checkbox) {
                node.checkbox.checked = true
                node.inputEventListener()
              }
            })
          } else if (node.checkbox) {
            node.checkbox.checked = true
            node.inputEventListener()
          }
        }
      }
      if (scroll) {
        scrollElIntoView(() => {
          let node
          if (parentNodes.some(parentNode => (node = parentNode.querySelector('.active')))) return node
          return null
        }, ':not([intersecting])', this.dialog, { behavior: 'smooth', block: 'nearest' }, 500)
      }
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

  get keyEls () {
    return Array.from(this.keysDiv.children)
  }

  get hasChecked () {
    return this.keyEls.some(keyEl => keyEl.hasAttribute('checked'))
  }

  get deletedKeyEls () {
    return Array.from(this.keysDiv.querySelectorAll('chat-m-key[deleted][epoch]'))
  }

  get addKeyEl () {
    return this.root.querySelector('#add-key')
  }

  get uploadKeyEl () {
    return this.root.querySelector('#upload-key')
  }

  get cancelEl () {
    return this.root.querySelector('#cancel')
  }

  get encryptEl () {
    return this.root.querySelector('#encrypt')
  }

  get removeEncryptionEl () {
    return this.root.querySelector('#remove-encryption')
  }

  isDialogOpen () {
    return this.dialog.hasAttribute('open')
  }

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }
}
