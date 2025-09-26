// @ts-check
import { Shadow } from '../../../../event-driven-web-components-prototypes/src/Shadow.js'
import { jsonStringifyMapUrlReplacer } from '../../../../Helpers.js'
import { scrollElIntoView } from '../../../../event-driven-web-components-prototypes/src/helpers/Helpers.js'

/* global Environment */
/* global self */

/**
 * Provider container for rendering
 @typedef {
  'environment' | 'crdt' | 'session' | string
 } Origin
*/

/**
 * Provider container for rendering
 * Status gets filled by 5 runs, so max. length 5
 @typedef {
  'connected' | 'disconnected' | 'default' | 'once-established' | 'active' | 'unknown'
 } Status
*/

/**
 * Provider container for rendering
 @typedef {{
  origins: Origin[],
  status: Status[],
  statusCount?: number,
  providerFallbacks?: Map<string, string[]>,
  permanentFallback?: string,
  urls: Map<string, {
    name: import("../../../../event-driven-web-components-yjs/src/es/EventDrivenYjs.js").ProviderNames,
    status: Status,
    origins: Origin,
    url: URL
  }>
}} Provider

/**
 * Provider container for rendering
 @typedef {
  Map<string, Provider>
 } ProvidersContainer
*/

/**
 * The providers view
 *
 * @export
 * @class Providers
 */
export default class Providers extends Shadow() {
  constructor (options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, ...options }, ...args)

    let lastProvidersEventGetData = null
    this.lastSeparator = this.getAttribute('separator') || '<>'
    let timeoutId = null
    this.providersEventListener = (event, setUpdating = true) => {
      lastProvidersEventGetData = event.detail.getData
      if (!setUpdating) this.iconStatesEl.setAttribute('updating', '')
      clearTimeout(timeoutId)
      timeoutId = setTimeout(async () => {
        if (this.isDialogOpen()) {
          this.renderData(await event.detail.getData(), await (await this.roomPromise).room, true)
        } else {
          Providers.toggleIconStates(this.iconStatesEl, await event.detail.getData(), this.hasAttribute('online'))
        }
        this.iconStatesEl.removeAttribute('updating')
        // @ts-ignore
      }, self.Environment.awarenessEventListenerDelay || 1000)
    }

    this.providersChangeEventListener = event => {
      if (lastProvidersEventGetData) this.providersEventListener({ detail: { getData: lastProvidersEventGetData } }, false)
    }

    this.openDialog = async event => {
      event.preventDefault()
      this.dialog.show('show-modal')
      if (lastProvidersEventGetData) {
        clearTimeout(timeoutId)
        await this.renderData(await lastProvidersEventGetData(), await (await this.roomPromise).room, false)
        // the graph has to be refreshed when dialog opens
        if (this.lastP2pGraphData) Providers.renderP2pGraph(this.providersGraph, await this.lastP2pGraphData, this.lastSeparator, true)
      }
    }
    this.providerDialogShowEventEventListener = event => {
      this.dialog.close()
      this.openDialog(event).then(() => {
        if (event.detail?.id) this.setActive('id', event.detail.id, [this.providersDiv])
      })
    }

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

    this.connectProviderEventListener = event => {
      if (event.detail.urlHrefObj) {
        const isWebsocket = event.detail.urlHrefObj.name === 'websocket'
        const urls = (isWebsocket ? this.websocketUrl : this.webrtcUrl || '').split(',').filter(urlStr => {
          try {
            const url = new URL(urlStr) // eslint-disable-line
            if (url.hostname === event.detail.urlHrefObj.url.hostname) return false
            return true
          } catch (error) {
            return false
          }
        })
        urls.push(event.detail.urlHrefObj.href)
        this.dispatchEvent(new CustomEvent('yjs-update-providers', {
          detail: {
            // @ts-ignore
            [isWebsocket ? 'websocketUrl': 'webrtcUrl']: urls.join(',')
          },
          bubbles: true,
          cancelable: true,
          composed: true
        }))
      }
    }
    this.disconnectProviderEventListener = event => {
      if (event.detail.urlHrefObj) {
        const isWebsocket = event.detail.urlHrefObj.name === 'websocket'
        const urls = (isWebsocket ? this.websocketUrl : this.webrtcUrl || '').split(',').filter(urlStr => {
          try {
            const url = new URL(urlStr) // eslint-disable-line
            if (url.hostname === event.detail.urlHrefObj.url.hostname) return false
            return true
          } catch (error) {
            return false
          }
        })
        this.dispatchEvent(new CustomEvent('yjs-update-providers', {
          detail: {
            // @ts-ignore
            [isWebsocket ? 'websocketUrl': 'webrtcUrl']: urls.join(',')
          },
          bubbles: true,
          cancelable: true,
          composed: true
        }))
      }
    }

    this.providerDialogWasClosed = false
    this.providerDialogClosed = event => (this.providerDialogWasClosed = true)

    this.openUserDialogClickListener = event => {
      event.preventDefault()
      this.dispatchEvent(new CustomEvent('user-dialog-show-event', {
        bubbles: true,
        cancelable: true,
        composed: true
      }))
    }

    this.p2pGraphClickEventListener = event => {
      // @ts-ignore
      if (event.detail.graphUserObj) this.setActive('id', `${self.Environment?.providerNamespace || 'p_'}${event.detail.graphUserObj.id}`, [this.providersDiv], event.detail.isActive)
    }

    this.onlineEventListener = async event => {
      this.setAttribute('online', '')
      this.dialog?.setAttribute('online', '')
      if (lastProvidersEventGetData) Providers.toggleIconStates(this.iconStatesEl, await lastProvidersEventGetData(), this.hasAttribute('online'))
    }
    this.offlineEventListener = async event => {
      this.removeAttribute('online')
      this.dialog?.removeAttribute('online')
      if (lastProvidersEventGetData) Providers.toggleIconStates(this.iconStatesEl, await lastProvidersEventGetData(), this.hasAttribute('online'))
    }
    if (navigator.onLine) {
      this.onlineEventListener()
    } else {
      this.offlineEventListener()
    }

    let resizeTimeout = null
    this.resizeEventListener = event => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(async () => {
        // the graph has to be refreshed when resize
        if (this.lastP2pGraphData) Providers.renderP2pGraph(this.providersGraph, await this.lastP2pGraphData, this.lastSeparator, true)
      }, 200)
    }

    /** @type {(any)=>void} */
    this.roomResolve = map => map
    /** @type {Promise<{ locationHref: string, room: Promise<string> & {done: boolean} }>} */
    this.roomPromise = new Promise(resolve => (this.roomResolve = resolve))
  }

  connectedCallback () {
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML().then(() => this.dialog.dialogPromise.then(dialog => this.usersDialogLink.addEventListener('click', this.openUserDialogClickListener)))
    this.addEventListener('submit-websocket-url', this.submitWebsocketUrlEventListener)
    this.addEventListener('submit-webrtc-url', this.submitWebrtcUrlEventListener)
    this.addEventListener('connect-provider', this.connectProviderEventListener)
    this.addEventListener('disconnect-provider', this.disconnectProviderEventListener)
    this.addEventListener('provider-dialog-closed', this.providerDialogClosed)
    this.globalEventTarget.addEventListener('yjs-providers-data', this.providersEventListener)
    this.globalEventTarget.addEventListener('yjs-providers-change', this.providersChangeEventListener)
    this.globalEventTarget.addEventListener('provider-dialog-show-event', this.providerDialogShowEventEventListener)
    this.iconStatesEl.addEventListener('click', this.openDialog)
    this.addEventListener('p2p-graph-click', this.p2pGraphClickEventListener)
    self.addEventListener('online', this.onlineEventListener)
    self.addEventListener('offline', this.offlineEventListener)
    self.addEventListener('resize', this.resizeEventListener)
    if (this.isConnected) this.connectedCallbackOnce()
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
    // @ts-ignore
    this.connectedCallbackOnce = () => {}
  }

  disconnectedCallback () {
    this.removeEventListener('submit-websocket-url', this.submitWebsocketUrlEventListener)
    this.removeEventListener('submit-webrtc-url', this.submitWebrtcUrlEventListener)
    this.removeEventListener('connect-provider', this.connectProviderEventListener)
    this.removeEventListener('disconnect-provider', this.disconnectProviderEventListener)
    this.removeEventListener('provider-dialog-closed', this.providerDialogClosed)
    this.dialog.dialogPromise.then(dialog => this.usersDialogLink.removeEventListener('click', this.openUserDialogClickListener))
    this.globalEventTarget.removeEventListener('yjs-providers-data', this.providersEventListener)
    this.globalEventTarget.removeEventListener('yjs-providers-change', this.providersChangeEventListener)
    this.globalEventTarget.removeEventListener('provider-dialog-show-event', this.providerDialogShowEventEventListener)
    this.iconStatesEl.removeEventListener('click', this.openDialog)
    this.removeEventListener('p2p-graph-click', this.p2pGraphClickEventListener)
    self.removeEventListener('online', this.onlineEventListener)
    self.removeEventListener('offline', this.offlineEventListener)
    self.removeEventListener('resize', this.resizeEventListener)
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
    return !this.iconStatesEl
  }

  /**
   * Renders the CSS
   *
   * @return {void}
   */
  renderCSS () {
    this.css = /* css */`
      :host {
        --chat-m-provider-min-height: 15em;
        --button-primary-width: 100%;
        --button-primary-height: 100%;
        --wct-input-input-height: 100%;
        --wct-input-height: var(--wct-input-input-height);
        --wct-input-border-radius: var(--border-radius) 0 0 var(--border-radius);
        --button-primary-border-radius: 0 var(--border-radius) var(--border-radius) 0;
        --counter-color: var(--color-green-full);
        --counter-color-hover: var(--counter-color);
        cursor: pointer;
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
      <a-icon-states show-counter-on-hover>
        <wct-icon-mdx state="default" title="Network providers" icon-url="../../../../../../img/icons/network.svg" size="2em"></wct-icon-mdx>
        <wct-icon-mdx state="connected" title="Network providers connected" style="color:var(--color-green-full)" icon-url="../../../../../../img/icons/network.svg" size="2em"></wct-icon-mdx>
        <wct-icon-mdx state="disconnected" title="No connection to Network providers" style="color:var(--color-error)" icon-url="../../../../../../img/icons/network-off.svg" size="2em"></wct-icon-mdx>
        <wct-icon-mdx state="offline" title="You are offline!" style="color:var(--color-error)" icon-url="../../../../../../img/icons/network-off.svg" size="2em"></wct-icon-mdx>
      </a-icon-states>
      <wct-dialog namespace="dialog-top-slide-in-"${this.hasAttribute('online') ? ' online' : ''} closed-event-name="provider-dialog-closed">
        <style protected>
          :host > dialog {
            scrollbar-color: var(--color) var(--background-color);
            scrollbar-width: thin;
          }
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
          :host > dialog > #providers {
            --color: var(--a-color);
            --color-hover: var(--color-yellow);
            display: flex;
            flex-direction: column;
            gap: var(--grid-gap, 0.5em);
          }
          :host > dialog > #providers > wct-load-template-tag {
            min-height: var(--chat-m-provider-min-height);
          }
          :host > dialog > #providers > #providers-graph {
            border-radius: var(--border-radius);
            padding: 5svh 10svw;
            border: 1px dashed var(--color-secondary);
            position: relative;
          }
          :host(:not([online])) > dialog > #providers > #providers-graph {
            display: none;
          }
          :host > dialog > #providers > #providers-graph:has(~ chat-m-provider[updating])::after {
            animation: updating 3s ease infinite;
            content: "";
            border-radius: var(--border-radius);
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(120deg, var(--color-secondary), var(--background-color));
            background-size: 200% 200%;
            opacity: .5;
          }
          :host > dialog > #providers:has(> chat-m-provider[updating]) > chat-m-provider {
            pointer-events: none;
            cursor: not-allowed;
          }
          @keyframes updating { 
            0%{background-position:10% 0%}
            50%{background-position:91% 100%}
            100%{background-position:10% 0%}
          }
        </style>
        <dialog>
          <wct-menu-icon id="close" no-aria class="open sticky" namespace="menu-icon-close-" no-click background style="--outline-style-focus-visible: none;"></wct-menu-icon>
          <h4>Provider Data:</h4>
          <p id="offline">You are offline!</p>
          <div id=providers>
            <div id="providers-graph"></div>
            <ul>
              <li><a id=users-dialog-link href="#">Users connection graph</a></li>
              <li><a href="https://github.com/Weedshaker/y-websocket/tree/master" target="_blank">Host your own websocket - github</a></li>
              <li><a href="https://hub.docker.com/repository/docker/weedshaker/y-websocket/general" target="_blank">Host your own websocket - docker container</a></li>
            </ul>
            <!-- TODO: ******************************* Below only reproduces the old behavior ******************************* -->
            <wct-details namespace="details-default-" id=set-providers-manually mode=false>
              <details>
                <summary>
                  <h4>Set (new) providers manually:</h4>
                </summary>
                <div>
                  <p>Note: Write providers separated with a "," and no spaces in between.</p>
                  <hr>
                  <h4 class=left>websocketUrls:</h4>
                  <wct-grid auto-fill="20%">
                    <section>
                      <wct-input grid-column="1/5" inputId="websocket-url" value="" placeholder='websocketUrls separated with a "," and no spaces in between' namespace="wct-input-" namespace-fallback submit-search="submit-websocket-url" force></wct-input>
                      <wct-button namespace="button-primary-" request-event-name="submit-websocket-url" click-no-toggle-active>set</wct-button>
                    </section>
                  </wct-grid>
                  <hr>
                  <h4 class=left>webrtcUrls:</h4>
                  <wct-grid auto-fill="20%" style="margin-bottom: 0;">
                    <section>
                      <wct-input grid-column="1/5" inputId="webrtc-url" value="" placeholder='webrtcUrls separated with a "," and no spaces in between' namespace="wct-input-" namespace-fallback submit-search="submit-webrtc-url" force></wct-input>
                      <wct-button namespace="button-primary-" request-event-name="submit-webrtc-url" click-no-toggle-active>set</wct-button>
                    </section>
                  </wct-grid>
                </div>
              </details>
            </wct-details>
            <!-- TODO: ******************************* Above only reproduces the old behavior ******************************* -->
          </div>
        </dialog>
      </wct-dialog>
    `
    // prefetch offline icon
    this.html = '<wct-icon-mdx style="display:none" icon-url="../../../../../../img/icons/network-off.svg" size="0em"></wct-icon-mdx>'
    return this.fetchModules([
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../atoms/p2pGraph/P2pGraph.js?${Environment?.version || ''}`,
        name: 'chat-a-p2p-graph'
      },
      {
        // @ts-ignorem
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
        path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/molecules/details/Details.js?${Environment?.version || ''}`,
        name: 'wct-details'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/atoms/button/Button.js?${Environment?.version || ''}`,
        name: 'wct-button'
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
        path: `${this.importMetaUrl}../../../../components/atoms/iconStates/IconStates.js?${Environment?.version || ''}`,
        name: 'a-icon-states'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/molecules/loadTemplateTag/LoadTemplateTag.js?${Environment?.version || ''}`,
        name: 'wct-load-template-tag'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}./Provider.js?${Environment?.version || ''}`,
        name: 'chat-m-provider'
      }
    ])
  }

  renderData (data, roomName, force) {
    this.lastSeparator = data.separator
    return new Promise(resolve => this.dispatchEvent(new CustomEvent('yjs-get-providers', {
      detail: {
        resolve
      },
      bubbles: true,
      cancelable: true,
      composed: true
    }))).then(async ({ websocketUrl, webrtcUrl }) => {
      this.websocketUrl = websocketUrl
      this.webrtcUrl = webrtcUrl
      Providers.toggleIconStates(this.iconStatesEl, data, this.hasAttribute('online'))
      this.lastP2pGraphData = Providers.renderProvidersList(this.providersDiv, data, roomName, this.providersGraph, this.providerDialogWasClosed, force)
      this.providerDialogWasClosed = false
      // TODO: ******************************* Below only reproduces the old behavior *******************************
      /** @type {HTMLInputElement | any} */
      let websocketInput
      if ((websocketInput = this.websocketInput) && websocketUrl !== websocketInput.value) {
        if (websocketInput.matches(':focus')) {
          websocketInput.addEventListener('blur', event => (websocketInput.value = websocketUrl), {once: true})
        } else {
          websocketInput.value = websocketUrl
        }
      }
      /** @type {HTMLInputElement | any} */
      let webrtcInput
      if ((webrtcInput = this.webrtcInput) && webrtcUrl !== webrtcInput.value) {
        if (webrtcInput.matches(':focus')) {
          webrtcInput.addEventListener('blur', event => (webrtcInput.value = webrtcUrl), {once: true})
        } else {
          webrtcInput.value = webrtcUrl
        }
      }
    })
  }

  setActive (attributeName, attributeValue, parentNodes, active = true, scroll = true) {
    parentNodes.reduce((acc, parentNode) => [...acc, ...(parentNode.querySelectorAll('.active') || [])], []).forEach(node => node.classList.remove('active'))
    let node
    if (active) {
      // @ts-ignore
      if (parentNodes.some(parentNode => (node = parentNode.querySelector(`[${attributeName}='${attributeValue}']`)))) node.classList.add('active')
      if (scroll) scrollElIntoView(() => {
        let node
        if(parentNodes.some(parentNode => (node = parentNode.querySelector('.active')))) return node
        return null
      }, null, this.dialogEl, { behavior: 'smooth', block: 'nearest' })
    }
    if (node) {
      this.setAttribute('active', attributeValue)
    } else {
      this.removeAttribute('active')
    }
  }

  static async toggleIconStates (iconStatesEl, data, online) {
    let counter = 0
    iconStatesEl.setAttribute('state', online
      ? (counter = (await data.getSessionProvidersByStatus()).connected.length)
          ? 'connected'
          : 'disconnected'
      : 'offline'
    )
    if (counter) {
      iconStatesEl.setAttribute('counter', counter)
    } else {
      iconStatesEl.removeAttribute('counter')
    }
  }

  static async renderProvidersList (div, data, roomName, providersGraph, providerDialogWasClosed, force) {
    const providers = Array.from(await data.getCompleteProviders(force))
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = providers.reduce((acc, [name, providerData], i) => {
      /// / render or update
      // @ts-ignore
      const id = `${self.Environment?.providerNamespace || 'p_'}${name.replaceAll('.', '-')}` // string <ident> without dots https://developer.mozilla.org/en-US/docs/Web/CSS/ident
      const renderProvider = () => /* html */`<wct-load-template-tag id=${id} no-css style="order: ${i};" copy-class-list><template><chat-m-provider><template>${JSON.stringify({ id, name, data: providerData, order: i, roomName }, jsonStringifyMapUrlReplacer)}</template></chat-m-provider></template></wct-load-template-tag>`
      let provider
      if ((provider = div.querySelector(`#${id}`))) {
        if (typeof provider.update === 'function') {
          provider.update(providerData, i, providerDialogWasClosed, force)
        } else {
          provider.outerHTML = renderProvider()
        }
      } else {
        return acc + renderProvider()
      }
      return acc
    }, '')
    Array.from(tempDiv.children).forEach(child => div.appendChild(child))
    const p2pGraphData = providers.reduce((acc, [hostname, provider]) => {
      // @ts-ignore
      if (provider.status.includes('connected')) acc.push([hostname, provider])
      return acc
    }, [])
    Providers.renderP2pGraph(providersGraph, p2pGraphData, data.separator)
    return p2pGraphData
  }

  static renderP2pGraph (graph, data, separator, force = false) {
    const stringifiedData = JSON.stringify(Array.isArray(data) ? data : Array.from(data))
    const isSame = graph.children[0]?.template.content.textContent === stringifiedData
    if (force || !isSame) {
      graph.setAttribute('style', `min-height: ${graph.clientHeight}px;`)
      graph.innerHTML = /* html */`
        <chat-a-p2p-graph separator="${separator || ''}" providers>
          <template>${stringifiedData}</template>
        </chat-a-p2p-graph>
      `
      graph.addEventListener('p2p-graph-load', event => self.requestAnimationFrame(timeStamp => graph.removeAttribute('style')), { once: true })
    }
  }

  get iconStatesEl () {
    return this.root.querySelector('a-icon-states')
  }

  get dialog () {
    return this.root.querySelector('wct-dialog')
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

  get usersDialogLink () {
    return this.dialog?.root.querySelector('#users-dialog-link')
  }

  get providersGraph () {
    return this.dialog?.root.querySelector('#providers-graph')
  }

  isDialogOpen () {
    return this.dialog.root.querySelector('dialog[open]')
  }

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }
}
