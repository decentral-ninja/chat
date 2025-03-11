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
    this.providersEventListener = event => {
      lastProvidersEventGetData = event.detail.getData
      this.setAttribute('updating', '')
      clearTimeout(timeoutId)
      timeoutId = setTimeout(async () => {
        if (this.isDialogOpen()) {
          this.renderData(await event.detail.getData())
        } else {
          Providers.renderSectionText(this.section, await event.detail.getData(), this.hasAttribute('online'))
        }
        this.removeAttribute('updating')
        // @ts-ignore
      }, this.isDialogOpen() ? 200 : self.Environment.awarenessEventListenerDelay)
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
    this.providerDialogShowEventEventListener = event => {
      this.setAttribute('active', event.detail.uid)
      this.openDialog(event)
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
    this.globalEventTarget.addEventListener('yjs-providers', this.providersEventListener)
    this.globalEventTarget.addEventListener('provider-dialog-show-event', this.providerDialogShowEventEventListener)
    this.section.addEventListener('click', this.openDialog)
    self.addEventListener('online', this.onlineEventListener)
    self.addEventListener('offline', this.offlineEventListener)
  }

  disconnectedCallback () {
    this.globalEventTarget.removeEventListener('yjs-providers', this.providersEventListener)
    this.globalEventTarget.removeEventListener('provider-dialog-show-event', this.providerDialogShowEventEventListener)
    this.section.removeEventListener('click', this.openDialog)
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
      :host > wct-dialog {
        font-size: 1rem;
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
            Providers...
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
        path: `${this.importMetaUrl}../../../../components/atoms/loading/Loading.js?${Environment?.version || ''}`,
        name: 'a-loading'
      }
    ])
  }

  renderData (data) {
    Providers.renderSectionText(this.section, data, this.hasAttribute('online'))
    Providers.renderProvidersList(this.providersDiv, data)
  }

  static async renderSectionText (section, data, online) {
    section.innerHTML = /* html */`
      ${online
        ? (await data.getSessionProvidersByStatus()).connected.length
          ? '<wct-icon-mdx title="Network providers connected" style="color:var(--color-green-full)" icon-url="../../../../../../img/icons/network.svg" size="2em"></wct-icon-mdx>'
          : '<wct-icon-mdx title="No connection to Network providers" style="color:var(--color-error)" icon-url="../../../../../../img/icons/network-off.svg" size="2em"></wct-icon-mdx>'
        : '<wct-icon-mdx title="You are offline!" style="color:var(--color-error)" icon-url="../../../../../../img/icons/network-off.svg" size="2em"></wct-icon-mdx>'
      }
      <a-loading namespace="loading-default-" size="1.5"></a-loading>
    `
  }

  static async renderProvidersList (div, data) {
    console.log('***renderProvidersList******', div, data)
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

  isDialogOpen () {
    return this.dialog.root.querySelector('dialog[open]')
  }

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }
}
