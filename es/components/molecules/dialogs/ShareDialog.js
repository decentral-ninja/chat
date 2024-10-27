// @ts-check
import Dialog from '../../../../../web-components-toolbox/src/es/components/molecules/dialog/Dialog.js'

/**
* @export
* @class Dialog
* https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
* @type {CustomElementConstructor}
*/
export default class ShareDialog extends Dialog {
  constructor (options = {}, ...args) {
    super({...options }, ...args)

    const superShow = this.show
    this.show = command => {
      // execute on show
      this.show = superShow
      return superShow(command)
    }

    const superShowEventListener = this.showEventListener
    this.showEventListener = event => {
      // execute on show event
      return superShowEventListener(event)
    }

    /** @type {(any)=>void} */
    this.roomResolve = map => map
    /** @type {Promise<{ locationHref: string, room: Promise<string> & {done: boolean} }>} */
    this.roomPromise = new Promise(resolve => (this.roomResolve = resolve))
  }

  connectedCallback () {
    if (this.shouldRenderCustomHTML()) this.renderCustomHTML()
    const result = super.connectedCallback()
    this.connectedCallbackOnce()
    return result
  }

  connectedCallbackOnce () {
    this.dispatchEvent(new CustomEvent('yjs-get-room', {
      detail: {
        resolve: this.roomResolve
      },
      bubbles: true,
      cancelable: true,
      composed: true
    }))
    this.connectedCallbackOnce = () => {}
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
        font-size: 1rem;
      }
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
  renderCustomHTML() {
    this.html = /* html */`
      <dialog>
        <wct-menu-icon id="close" no-aria class="open sticky" namespace="menu-icon-close-" no-click></wct-menu-icon>
        <h4>Share: "${this.getAttribute('room-name')}"</h4>
      </dialog>
    `
    new Promise(resolve => this.dispatchEvent(new CustomEvent('storage-get-rooms', {
      detail: {
        resolve
      },
      bubbles: true,
      cancelable: true,
      composed: true
    }))).then(getRoomsResult => {
      console.log('*********', getRoomsResult)
      this.root.querySelector('dialog').insertAdjacentHTML('beforeend', /* html */`
        <p>${getRoomsResult.value[this.getAttribute('room-name')].locationHref}</p>
        <wct-qr-code-svg data="${getRoomsResult.value[this.getAttribute('room-name')].locationHref}"></wct-qr-code-svg>
      `)
    })


    return this.fetchModules([
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../atoms/menuIcon/MenuIcon.js?${Environment?.version || ''}`,
        name: 'wct-menu-icon'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../atoms/qrCodeSvg/QrCodeSvg.js?${Environment?.version || ''}`,
        name: 'wct-qr-code-svg'
      }
    ])
  }
}
