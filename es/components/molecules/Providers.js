// @ts-check
import { Shadow } from '../../../../event-driven-web-components-prototypes/src/Shadow.js'

/* global self */

/**
 * The providers view
 * TODO: display providers and also allow provider changes
 * TODO: keepAlive time
 *
 * @export
 * @class Providers
 */
export default class Providers extends Shadow() {
  constructor (options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, ...options }, ...args)

    let lastProvidersEventGetData = null
    let timeoutId = null
    this.providersEventListener = (event, force) => {
      lastProvidersEventGetData = event.detail.getData
      this.setAttribute('updating', '')
      clearTimeout(timeoutId)
      timeoutId = setTimeout(async () => {
        if (this.isDialogOpen()) {
          this.renderData(await event.detail.getData(), force)
        } else {
          Providers.renderSectionText(this.section, await event.detail.getData(), this.hasAttribute('online'), force)
        }
        this.removeAttribute('updating')
        // @ts-ignore
      }, this.isDialogOpen() ? 200 : self.Environment.awarenessEventListenerDelay)
    }
    
    this.providersChangeEventListener = event => {
      if (lastProvidersEventGetData) this.providersEventListener({detail: { getData: lastProvidersEventGetData}}, true)
    }

    this.openDialog = async event => {
      event.preventDefault()
      this.dialog.show('show-modal')
      if (lastProvidersEventGetData) {
        clearTimeout(timeoutId)
        this.renderData(await lastProvidersEventGetData())
        this.removeAttribute('updating')
      }
    }
    this.providerDialogShowEventEventListener = event => this.openDialog(event)

    this.submitWebsocketUrlEventListener = event => {
      event.stopPropagation()
      let input
      if ((input = this.websocketInput)) {
        this.dispatchEvent(new CustomEvent('yjs-update-providers', {
          detail: {
            // @ts-ignore
            websocketUrl: input.value
          },
          bubbles: true,
          cancelable: true,
          composed: true
        }))
      }
    }
    this.submitWebrtcUrlEventListener = event => {
      event.stopPropagation()
      let input
      if ((input = this.webrtcInput)) {
        this.dispatchEvent(new CustomEvent('yjs-update-providers', {
          detail: {
            // @ts-ignore
            webrtcUrl: input.value
          },
          bubbles: true,
          cancelable: true,
          composed: true
        }))
      }
    }

    this.onlineEventListener = async event => {
      this.setAttribute('online', '')
      this.dialog?.setAttribute('online', '')
      if (lastProvidersEventGetData) Providers.renderSectionText(this.section, await lastProvidersEventGetData(), this.hasAttribute('online'))
    }
    this.offlineEventListener = async event => {
      this.removeAttribute('online')
      this.dialog?.removeAttribute('online')
      if (lastProvidersEventGetData) Providers.renderSectionText(this.section, await lastProvidersEventGetData(), this.hasAttribute('online'))
    }
    if (navigator.onLine) {
      this.onlineEventListener()
    } else {
      this.offlineEventListener()
    }
  }

  connectedCallback () {
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
    this.addEventListener('submit-websocket-url', this.submitWebsocketUrlEventListener)
    this.addEventListener('submit-webrtc-url', this.submitWebrtcUrlEventListener)
    this.globalEventTarget.addEventListener('yjs-providers-data', this.providersEventListener)
    this.globalEventTarget.addEventListener('yjs-providers-change', this.providersChangeEventListener)
    this.globalEventTarget.addEventListener('provider-dialog-show-event', this.providerDialogShowEventEventListener)
    this.section.addEventListener('click', this.openDialog)
    self.addEventListener('online', this.onlineEventListener)
    self.addEventListener('offline', this.offlineEventListener)
  }

  disconnectedCallback () {
    this.removeEventListener('submit-websocket-url', this.submitWebsocketUrlEventListener)
    this.removeEventListener('submit-webrtc-url', this.submitWebrtcUrlEventListener)
    this.globalEventTarget.removeEventListener('yjs-providers-data', this.providersEventListener)
    this.globalEventTarget.removeEventListener('yjs-providers-change', this.providersChangeEventListener)
    this.globalEventTarget.removeEventListener('provider-dialog-show-event', this.providerDialogShowEventEventListener)
    this.section.removeEventListener('click', this.openDialog)
    self.removeEventListener('online', this.onlineEventListener)
    self.removeEventListener('offline', this.offlineEventListener)
  }

  /**
   * Evaluates if a render of CSS is necessary
   *
   * @return {boolean}
   */
  shouldRenderCSS () {
    return !this.root.querySelector(`:host > style[_css], ${this.tagName} > style[_css]`)
  }

  /**
   * Evaluates if a render of HTML is necessary
   *
   * @return {boolean}
   */
  shouldRenderHTML () {
    return !this.section
  }

  /**
   * Renders the CSS
   *
   * @return {void}
   */
  renderCSS () {
    this.css = /* css */`
      :host {
        --button-primary-width: 100%;
        --button-primary-height: 100%;
        --wct-input-input-height: 100%;
        --wct-input-height: var(--wct-input-input-height);
        --wct-input-border-radius: var(--border-radius) 0 0 var(--border-radius);
        --button-primary-border-radius: 0 var(--border-radius) var(--border-radius) 0;
        cursor: pointer;
      }
      :host > section {
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: 1fr;
        align-content: center;
        justify-content: center;
      }
      :host > section > *, :host > section > wct-icon-mdx::part(svg) {
        grid-column: 1;
        grid-row: 1;
      }
      :host > section > wct-icon-mdx::part(svg) {
        align-self: center;
        justify-self: center;
      }
      :host > section > a-loading {
        display: none;
      }
      :host([updating]) > section > a-loading {
        display: flex;
      }
    `
  }

  /**
  * renders the html
  *
  * @return {Promise<void>}
  */
  renderHTML () {
    this.html = /* html */`
      <section>
        <wct-icon-mdx title="Network providers" icon-url="../../../../../../img/icons/network.svg" size="2em"></wct-icon-mdx>
        <a-loading namespace="loading-default-" size="1.5"></a-loading>
      </section>
      <wct-dialog namespace="dialog-top-slide-in-"${this.hasAttribute('online') ? ' online' : ''}>
        <style protected>
          :host([online]) > dialog #offline {
            display: none
          }
          :host > dialog #offline {
            --dialog-top-slide-in-p-margin: 0;
            color: var(--color-secondary);
            z-index: 10;
            position: sticky;
            top: 4px;
          }
        </style>
        <dialog>
          <wct-menu-icon id="close" no-aria class="open sticky" namespace="menu-icon-close-" no-click></wct-menu-icon>
          <h4>Provider Data:</h4>
          <p id="offline">You are offline!</p>
          <div id=providers>
            <!-- TODO: ******************************* Below only reproduces the old behavior ******************************* -->
            <h4 class=left>websocketUrls:</h4>
            <wct-grid auto-fill="20%">
              <section>
                <wct-input grid-column="1/5" inputId="websocket-url" value="" placeholder='websocketUrls separated with a "," and no spaces in between' namespace="wct-input-" namespace-fallback submit-search="submit-websocket-url" force></wct-input>
                <wct-button namespace="button-primary-" request-event-name="submit-websocket-url" click-no-toggle-active>set</wct-button>
              </section>
            </wct-grid>
            <hr>
            <h4 class=left>webrtcUrls:</h4>
            <wct-grid auto-fill="20%">
              <section>
                <wct-input grid-column="1/5" inputId="webrtc-url" value="" placeholder='webrtcUrls separated with a "," and no spaces in between' namespace="wct-input-" namespace-fallback submit-search="submit-webrtc-url" force></wct-input>
                <wct-button namespace="button-primary-" request-event-name="submit-webrtc-url" click-no-toggle-active>set</wct-button>
              </section>
            </wct-grid>
          </div>
        </dialog>
      </wct-dialog>
    `
    // prefetch offline icon
    this.html = '<wct-icon-mdx style="display:none" icon-url="../../../../../../img/icons/network-off.svg" size="0em"></wct-icon-mdx>'
    return this.fetchModules([
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/atoms/menuIcon/MenuIcon.js?${Environment?.version || ''}`,
        name: 'wct-menu-icon'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/molecules/dialog/Dialog.js?${Environment?.version || ''}`,
        name: 'wct-dialog'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/atoms/iconMdx/IconMdx.js?${Environment?.version || ''}`,
        name: 'wct-icon-mdx'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/organisms/grid/Grid.js?${Environment?.version || ''}`,
        name: 'wct-grid'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/atoms/input/Input.js?${Environment?.version || ''}`,
        name: 'wct-input'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../components/atoms/loading/Loading.js?${Environment?.version || ''}`,
        name: 'a-loading'
      }
    ])
  }

  renderData (data, force) {
    Providers.renderSectionText(this.section, data, this.hasAttribute('online'), force)
    Providers.renderProvidersList(this.providersDiv, data, force)
    // TODO: ******************************* Below only reproduces the old behavior *******************************
    new Promise(resolve => this.dispatchEvent(new CustomEvent('yjs-get-providers', {
      detail: {
        resolve
      },
      bubbles: true,
      cancelable: true,
      composed: true
    }))).then(async ({ websocketUrl, webrtcUrl }) => {
      /** @type {HTMLInputElement | any} */
      let websocketInput
      if ((websocketInput = this.websocketInput) && websocketUrl !== websocketInput.value && !websocketInput.matches(':focus')) websocketInput.value = websocketUrl
      /** @type {HTMLInputElement | any} */
      let webrtcInput
      if ((webrtcInput = this.webrtcInput) && webrtcUrl !== webrtcInput.value && !webrtcInput.matches(':focus')) webrtcInput.value = webrtcUrl
    })
  }

  static async renderSectionText (section, data, online, force) {
    section.innerHTML = /* html */`
      ${online
        ? (await data.getSessionProvidersByStatus(force)).connected.length
          ? '<wct-icon-mdx title="Network providers connected" style="color:var(--color-green-full)" icon-url="../../../../../../img/icons/network.svg" size="2em"></wct-icon-mdx>'
          : '<wct-icon-mdx title="No connection to Network providers" style="color:var(--color-error)" icon-url="../../../../../../img/icons/network-off.svg" size="2em"></wct-icon-mdx>'
        : '<wct-icon-mdx title="You are offline!" style="color:var(--color-error)" icon-url="../../../../../../img/icons/network-off.svg" size="2em"></wct-icon-mdx>'
      }
      <a-loading namespace="loading-default-" size="1.5"></a-loading>
    `
  }

  static async renderProvidersList (div, data, force) {
    const providers = new Map()
    // important, keep order not that less information overwrites the more precise information at mergeProvider
    Providers.fillProvidersWithAllProviders(providers, data.allProviders)
    // TODO: get providers from storage, which once were connected
    Providers.fillProvidersWithSessionProvidersByStatus(providers, await data.getSessionProvidersByStatus(force), data.separator)
    // TODO: data.getWebsocketInfo (don't overwrite any providers with the urls received here)
    // TODO: make a nice interface/types for providers map
    console.log('***renderProvidersList******', providers)
  }

  static fillProvidersWithSessionProvidersByStatus (providers, data, separator) {
    for (const key in data) {
      data[key].forEach(url => {
        const [name, realUrl] = url.split(separator)
        url = new URL(realUrl)
        providers.set(url.hostname, Providers.mergeProvider(providers.get(url.hostname), {
          name,
          status: key,
          urls: new Map([[url.origin, url]]),
          origins: ['session']
        }))
      })
    }
    return providers
  }

  static fillProvidersWithAllProviders (providers, data) {
    Array.from(data).forEach(([name, providersMap]) => Array.from(providersMap).forEach(([url, users]) => {
      try {
        url = new URL(url)
      } catch (error) {
        url = { hostname: url }
      }
      providers.set(url.hostname, Providers.mergeProvider(providers.get(url.hostname), {
        name,
        urls: new Map([[url.origin, url]]),
        origins: ['crdt']
      }))
    }))
    return providers
  }

  static mergeProvider (providerA, providerB) {
    if (!providerA) return providerB
    const providerNew = {}
    providerNew.urls = new Map(Array.from(providerA.urls).concat(Array.from(providerB.urls)))
    providerNew.origins = providerA.origins.concat(providerB.origins)
    return Object.assign(providerA, providerB, providerNew)
  }

  get section () {
    return this.root.querySelector('section')
  }

  get dialog () {
    return this.root.querySelector('wct-dialog')
  }

  get dialogEl () {
    return this.dialog?.root.querySelector('dialog')
  }

  get providersDiv () {
    return this.dialog.root.querySelector('#providers')
  }

  get providersDivGrids () {
    return Array.from(this.providersDiv.querySelectorAll('wct-grid'))
  }

  get websocketInput () {
    let input = null
    this.providersDivGrids.find(grid => (input = grid.root.querySelector('[inputId="websocket-url"]')?.inputField))
    return input
  }

  get webrtcInput () {
    let input = null
    this.providersDivGrids.find(grid => (input = grid.root.querySelector('[inputId="webrtc-url"]')?.inputField))
    return input
  }

  isDialogOpen () {
    return this.dialog.root.querySelector('dialog[open]')
  }

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }
}
