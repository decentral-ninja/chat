// @ts-check
import SetStringDialog from './prototypes/SetStringDialog.js'
import { escapeHTML } from '../../../../../event-driven-web-components-prototypes/src/helpers/Helpers.js'

/**
* @export
* @class Dialog
* https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
* @type {CustomElementConstructor}
*/
export default class RoomNameAkaDialog extends SetStringDialog {
  constructor (options = {}, ...args) {
    super({ ...options }, ...args)

    this.setInputEventListener = event => {
      event.stopPropagation()
      this.dialog.close()
      const inputField = event.composedPath()[0].inputField || event.composedPath()[0].previousElementSibling?.inputField
      this.dispatchEvent(new CustomEvent('yjs-merge-room', {
        detail: {
          key: this.getAttribute('room-name'),
          value: { aka: inputField?.value }
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))
      this.dispatchEvent(new CustomEvent('room-name-aka', {
        detail: {
          key: this.getAttribute('room-name'),
          aka: inputField?.value,
          liCount: this.getAttribute('li-count')
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

  /**
   * Render HTML
   * @returns Promise<void>
   */
  renderCustomHTML () {
    const templateTextContent = this.template.content.textContent
    this.template.remove()
    const roomName = escapeHTML(this.getAttribute('room-name') || '')
    return super.renderCustomHTML(`${roomName} aka. ???`, escapeHTML(JSON.parse(templateTextContent)?.[this.getAttribute('room-name')]?.aka || ''), '', /* html */`
        <h4>Set an aka. (also known as) room name for ${roomName}:</h4>
        <p>The given name is saved locally and not shared with anyone but helps you as a mental note.</p>
      `, '', '')
  }

  get template () {
    return this.root.querySelector('template')
  }
}
