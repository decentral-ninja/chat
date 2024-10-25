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
      :host > dialog {
        --dialog-top-slide-in-a-text-decoration: underline;
        scrollbar-color: var(--color) var(--background-color);
        scrollbar-width: thin;
        transition: height 0.3s ease-out;
      }
      :host([started]) > dialog > wct-icon-mdx {
        display: none;
      }
      :host([started]) > dialog > #stop {
        display: block;
      }
      :host([stopped]) > dialog > wct-icon-mdx {
        display: none;
      }
      :host([stopped]) > dialog > #start {
        display: block;
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
      <wct-menu-icon id="close" no-aria class="open sticky" namespace="menu-icon-close-" no-click></wct-menu-icon>
      <dialog>
        <h4>Video conference:</h4>
        <p class=font-size-tiny>("click: Join in browser")</p>
        <wct-icon-mdx id="start" title="Restart voice call" icon-url="../../../../../../img/icons/video-plus.svg" size="3em"></wct-icon-mdx>
        <wct-icon-mdx id="stop" title="Stop voice call" icon-url="../../../../../../img/icons/video-off.svg" size="3em"></wct-icon-mdx>
        <a href="${this.iframeSrc}" target="_blank">If the video call does not work 100%, click this link!</a>
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
        path: `${this.importMetaUrl}../../atoms/iframe/Iframe.js?${Environment?.version || ''}`,
        name: 'wct-iframe'
      }
    ])
  }
}
