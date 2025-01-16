// @ts-check
import SetStringDialog from './prototypes/SetStringDialog.js'

/**
* @export
* @class Dialog
* https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
* @type {CustomElementConstructor}
*/
export default class NickNameDialog extends SetStringDialog {
  constructor (options = {}, ...args) {
    super({...options }, ...args)

    // @ts-ignore
    this.roomNamePrefix = self.Environment?.roomNamePrefix || 'chat-'

    this.nicknameEventListener = event => {
      this.nickname = Promise.resolve(event.detail.nickname)
      if (this.getNicknameInput) this.getNicknameInput.setAttribute('placeholder', event.detail.nickname)
    }

    this.setInputEventListener = event => {
      event.stopPropagation()
      this.dialog.close()
      const inputField = event.composedPath()[0].inputField || event.composedPath()[0].previousElementSibling?.inputField
      this.dispatchEvent(new CustomEvent('yjs-set-nickname', {
        /** @type {import("../../../../../event-driven-web-components-yjs/src/es/controllers/Users.js").SetNicknameDetail} */
        detail: {
          nickname: inputField?.value
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))
      if (this.getSetDefaultNickname.checked) localStorage.setItem(`${this.roomNamePrefix}default-nickname`, inputField?.value)
    }

    /** @type {(any)=>void} */
    this.nicknameResolve = map => map
    /** @type { Promise<string> } */
    this.nickname = new Promise(resolve => (this.nicknameResolve = resolve))
  }

  connectedCallback () {
    const result = super.connectedCallback()
    this.addEventListener('submit-input', this.setInputEventListener)
    this.addEventListener('submit-search', this.setInputEventListener)
    this.connectedCallbackOnce()
    this.globalEventTarget.addEventListener('yjs-nickname', this.nicknameEventListener)
    return result
  }

  connectedCallbackOnce () {
    this.dispatchEvent(new CustomEvent('yjs-get-nickname', {
      detail: {
        resolve: this.nicknameResolve
      },
      bubbles: true,
      cancelable: true,
      composed: true
    }))
    this.connectedCallbackOnce = () => {}
  }

  disconnectedCallback () {
    super.disconnectedCallback()
    this.removeEventListener('submit-input', this.setInputEventListener)
    this.removeEventListener('submit-search', this.setInputEventListener)
    this.globalEventTarget.removeEventListener('yjs-nickname', this.nicknameEventListener)
  }

  /**
   * Render HTML
   * @returns Promise<void>
   */
  renderCustomHTML() {
    return super.renderCustomHTML(this.getAttribute('nickname'), localStorage.getItem(`${this.roomNamePrefix}default-nickname`) || '', '', /* html */`
        <h4>Change your nickname:</h4>
      `, '', /* html */`
        <style protected>
          #set-default-nickname-wrapper {
            display: flex;
            gap: 0.5em;
            padding: 0.5em 0 0;
            justify-content: end;
          }
        </style>
        <div id=set-default-nickname-wrapper grid-column="1/6">
          <input id=set-default-nickname type=checkbox checked/><label for="set-default-nickname" class=italic>Set as default proposed nickname?</label>
        </div>
      `)
  }

  get grid () {
    return this.dialog.querySelector('wct-grid')
  }

  get getNicknameInput () {
    return this.grid?.root.querySelector('#input')
  }

  get getSetDefaultNickname () {
    return this.grid?.root.querySelector('#set-default-nickname')
  }

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }
}
