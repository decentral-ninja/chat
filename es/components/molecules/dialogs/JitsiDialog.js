// @ts-check
import Dialog from '../../../../../web-components-toolbox/src/es/components/molecules/dialog/Dialog.js'

/**
* @export
* @class Dialog
* https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
* @type {CustomElementConstructor}
*/
export default class JitsiDialog extends Dialog {
  constructor (options = {}, ...args) {
    super({...options }, ...args)

    const superShow = this.show
    this.show = async command => {
      this.start()
      this.show = superShow
      return superShow(command)
    }

    const superShowEventListener = this.showEventListener
    this.showEventListener = async event => {
      if (event.detail?.this && event.detail?.this.hasAttribute('src')) {
        this.iframeSrc = event.detail?.this.getAttribute('src')
        if (this.iframe && this.iframe.getAttribute('src') !== this.iframeSrc) {
          this.iframe.setAttribute('src', this.iframeSrc)
          this.start()
        }
      }
      return superShowEventListener(event)
    }

    this.startClickEventListener = event => this.start()
    this.stopClickEventListener = event => this.stop()

    /** @type {(any)=>void} */
    this.roomResolve = map => map
    /** @type {Promise<{ locationHref: string, room: Promise<string> & {done: boolean} }>} */
    this.roomPromise = new Promise(resolve => (this.roomResolve = resolve))
  }

  connectedCallback () {
    if (this.shouldRenderCustomHTML()) this.renderCustomHTML()
    super.connectedCallback()
    this.connectedCallbackOnce()
    this.startIcon.addEventListener('click', this.startClickEventListener)
    this.stopIcon.addEventListener('click', this.stopClickEventListener)
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

  disconnectedCallback () {
    super.disconnectedCallback()
    this.startIcon.removeEventListener('click', this.startClickEventListener)
    this.stopIcon.removeEventListener('click', this.stopClickEventListener)
    this.stop()
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
        scrollbar-color: var(--color) var(--background-color);
        scrollbar-width: thin;
        transition: height 0.3s ease-out;
      }
      :host([started]) > dialog > a-icon-mdx {
        display: none;
      }
      :host([started]) > dialog > #stop {
        display: block;
      }
      :host([stopped]) > dialog > a-icon-mdx {
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
      <wct-menu-icon id="close" no-aria class="open" namespace="menu-icon-close-" no-click></wct-menu-icon>
      <dialog>
        <h4>Video conference:</h4>
        <p>("click: Join in browser")</p>
        <a-icon-mdx id="start" title="Restart voice call" icon-url="../../../../../../img/icons/video-plus.svg" size="3em"></a-icon-mdx>
        <a-icon-mdx id="stop" title="Stop voice call" icon-url="../../../../../../img/icons/video-off.svg" size="3em"></a-icon-mdx>
      </dialog>
    `
    // alternative: https://meet.hostpoint.ch/
    this.roomPromise.then(async ({locationHref, room}) => {
      this.root.querySelector('dialog').insertAdjacentHTML('beforeend', /* html */`
        <wct-iframe>
          <template>
            <iframe width="${self.innerWidth}" height="${self.innerHeight}" src="${this.iframeSrc || (this.iframeSrc = `https://jitsi.mgrs.dev/${await room}`)}" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture; fullscreen; allow-top-navigation; screen-wake-lock; microphone; camera; window-management;"></iframe>
          </template>
        </wct-iframe>
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
        path: `${this.importMetaUrl}../../atoms/iframe/Iframe.js?${Environment?.version || ''}`,
        name: 'wct-iframe'
      }
    ])
  }

  start () {
    this.dispatchEvent(new CustomEvent('jitsi-video-started', {
      detail: {
        iframe: this.iframe,
        iframeSrc: this.iframeSrc
      },
      bubbles: true,
      cancelable: true,
      composed: true
    }))
    this.setAttribute('started', '')
    this.removeAttribute('stopped')
    if (this.dialog) this.dialog.appendChild(this.iframeWrapper)
  }

  stop () {
    this.dispatchEvent(new CustomEvent('jitsi-video-stopped', {
      detail: {
        iframe: this.iframe,
        iframeSrc: this.iframeSrc
      },
      bubbles: true,
      cancelable: true,
      composed: true
    }))
    this.setAttribute('stopped', '')
    this.removeAttribute('started')
    this.iframeWrapper.remove()
  }

  get iframeWrapper () {
    return this._iframeWrapper || (this._iframeWrapper = this.root.querySelector('wct-iframe'))
  }

  get iframe () {
    return this.iframeWrapper?.root.querySelector('iframe')
  }

  get startIcon () {
    return this.root.querySelector('#start')
  }

  get stopIcon () {
    return this.root.querySelector('#stop')
  }
}
