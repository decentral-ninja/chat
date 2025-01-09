// @ts-check
import Dialog from '../../../../../web-components-toolbox/src/es/components/molecules/dialog/Dialog.js'

/**
* @export
* @class Dialog
* https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
* @type {CustomElementConstructor}
*/
export default class NickName extends Dialog {
  constructor (options = {}, ...args) {
    super({...options }, ...args)

    // @ts-ignore
    this.roomNamePrefix = self.Environment?.roomNamePrefix || 'chat-'

    this.nicknameEventListener = event => {
      this.nickname = Promise.resolve(event.detail.nickname)
      this.getNicknameInput.setAttribute('placeholder', event.detail.nickname)
    }

    this.setNicknameEventListener = event => {
      event.stopPropagation()
      this.dialog.close()
      let inputField = event.composedPath()[0].inputField || event.composedPath()[0].previousElementSibling?.inputField
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
    if (this.shouldRenderCustomHTML()) this.renderCustomHTML()
    const result = super.connectedCallback()
    this.connectedCallbackOnce()
    this.globalEventTarget.addEventListener('yjs-nickname', this.nicknameEventListener)
    this.addEventListener('nickname', this.setNicknameEventListener)
    this.addEventListener('submit-search', this.setNicknameEventListener)
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
    this.globalEventTarget.removeEventListener('yjs-nickname', this.nicknameEventListener)
    this.removeEventListener('nickname', this.setNicknameEventListener)
    this.removeEventListener('submit-search', this.setNicknameEventListener)
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
   * @returns Promise<void>
   */
  renderCustomHTML() {
    this.html = /* html */`
      <dialog>
        <wct-menu-icon id="close" no-aria class="open sticky" namespace="menu-icon-close-" no-click></wct-menu-icon>
      </dialog>
    `
    return Promise.all([
      this.nickname,
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
    ]).then(([nickname]) => {
      const div = document.createElement('div')
      div.innerHTML = /* html */`
        <h4>Change your nickname:</h4>
        <wct-grid auto-fill="20%">
          <style protected>
            #set-default-nickname-wrapper {
              display: flex;
              gap: 0.5em;
              padding: 0.5em 0 0;
              justify-content: end;
            }
          </style>
          <section>
            <wct-input id="nickname" inputId="nickname" placeholder="${nickname}" namespace="wct-input-" namespace-fallback grid-column="1/5" value="${localStorage.getItem(`${this.roomNamePrefix}default-nickname`) || ''}" submit-search autofocus force></wct-input>
            <wct-button namespace="button-primary-" request-event-name="nickname">enter</wct-button>
            <div id=set-default-nickname-wrapper grid-column="1/6">
              <input id=set-default-nickname type=checkbox checked/><label for="set-default-nickname" class=italic>Set as default proposed nickname?</label>
            </div>
          </section>
        </wct-grid>
      `
      Array.from(div.childNodes).forEach(node => this.dialog.appendChild(node))
    })
  }

  get getNicknameInput () {
    return this.dialog.querySelector('wct-grid')?.root.querySelector('#nickname')
  }

  get getSetDefaultNickname () {
    return this.dialog.querySelector('wct-grid')?.root.querySelector('#set-default-nickname')
  }

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }
}
