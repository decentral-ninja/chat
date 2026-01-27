// @ts-check
import SetStringDialog from './prototypes/SetStringDialog.js'
import { escapeHTML } from '../../../../../event-driven-web-components-prototypes/src/helpers/Helpers.js'

/**
* @export
* @class Dialog
* https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
* @type {CustomElementConstructor}
*/
export default class KeyNameDialog extends SetStringDialog {
  static get observedAttributes () {
    return ['name']
  }

  constructor (options = {}, ...args) {
    super({ ...options }, ...args)

    this.setInputEventListener = event => {
      event.stopPropagation()
      this.dialog.close()
      const inputField = event.composedPath()[0].inputField || event.composedPath()[0].previousElementSibling?.inputField
      if (inputField?.value) this.dispatchEvent(new CustomEvent(`yjs-set-key-${this.hasAttribute('private') ? 'private' : 'public'}-name`, {
        detail: {
          epoch: this.getAttribute('epoch'),
          propertyValue: inputField.value
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))
    }
  }

  connectedCallback () {
    const result = super.connectedCallback()
    this.addEventListener('submit-input', this.setInputEventListener)
    this.addEventListener('submit-search', this.setInputEventListener)
    return result
  }

  disconnectedCallback () {
    super.disconnectedCallback()
    this.removeEventListener('submit-input', this.setInputEventListener)
    this.removeEventListener('submit-search', this.setInputEventListener)
    this.close()
  }

  attributeChangedCallback (name, oldValue, newValue) {
    if (oldValue === null) return
    if (this.input?.inputField) {
      this.input.inputField.value = newValue
      this.input.setAttribute('placeholder', newValue)
    }
  }

  /**
   * Render HTML
   * @returns Promise<void>
   */
  renderCustomHTML () {
    const name = escapeHTML(this.getAttribute('name'))
    return super.renderCustomHTML(name, name, '', /* html */`
        <h4>Set the ${this.hasAttribute('private') ? 'private' : 'public'} key name:</h4>
        ${this.hasAttribute('private')
          ? /* html */ `<p>The private key name is saved locally and not shared with anyone but helps you as a mental note.</p>`
          : /* html */ `<p>The public key name is visible to the user with whom the key is shared.</p>`
        }
      `, '', '')
  }
}
