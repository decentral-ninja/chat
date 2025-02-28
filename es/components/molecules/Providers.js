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
          this.renderHTML(await event.detail.getData())
        } else {
          console.log('todo update summary texts')
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
        this.renderHTML(await lastProvidersEventGetData())
        this.removeAttribute('updating')
      }
    }
    this.providerDialogShowEventEventListener = event => {
      this.setAttribute('active', event.detail.uid)
      this.openDialog(event)
    }

    this.onlineEventListener = async event => this.setAttribute('online', '')
    this.offlineEventListener = async event => this.removeAttribute('online')
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
    this.details.addEventListener('click', this.openDialog)
    self.addEventListener('online', this.onlineEventListener)
    self.addEventListener('offline', this.offlineEventListener)
  }

  disconnectedCallback () {
    this.globalEventTarget.removeEventListener('yjs-providers', this.providersEventListener)
    this.globalEventTarget.removeEventListener('provider-dialog-show-event', this.providerDialogShowEventEventListener)
    this.details.removeEventListener('click', this.openDialog)
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
    return !this.details
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
      :host > details > summary > a-loading {
        display: none;
      }
      :host([updating]) > details > summary > a-loading {
        display: inline-block;
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
  renderHTML (data) {
    console.log('*********', data)
    this.html = /* html */`
      <details>
        <summary><a-loading namespace="loading-default-" size="0.75"></a-loading> Looking up providers...</summary>
      </details>
      <wct-dialog namespace="dialog-top-slide-in-"${this.hasAttribute('online') ? ' online' : ''}>
        <style protected>
          :host {
            --dialog-top-slide-in-ul-padding-left: 0;
            --dialog-top-slide-in-ol-list-style: none;
            --dialog-top-slide-in-ul-li-padding-left: 1em;
          }
          :host h4.title {
            position: sticky;
            top: calc(-1em - 1px);
            background-color: var(--background-color);
            padding: 0.5em;
            border: 1px solid var(--color);
            width: fit-content;
            z-index: 1;
          }
          :host h4.title.connected {
            background-color: var(--color-green);
            color: var(--background-color);
          }
          :host h4.title.not-connected {
            background-color: var(--color-secondary);
            color: var(--background-color);
          }
          :host(:not([online])) h4.title {
            padding-bottom: 1em;
          }
          :host ol {
            --dialog-top-slide-in-ul-display: flex;
            --dialog-top-slide-in-ul-flex-direction: row;
            flex-wrap: wrap;
            gap: 1em;
          }
          :host ol > wct-load-template-tag {
            min-height: 25em;
          }
          :host ol > li {
            --box-shadow-color: var(--color-provider);
            --box-shadow-default: var(--box-shadow-length-one) var(--box-shadow-color), var(--box-shadow-length-two) var(--box-shadow-color);
            border: 1px solid var(--color-provider);
            word-break: break-all;
            margin-bottom: var(--spacing);
            box-shadow: var(--box-shadow-default);
            padding: 0.25em;
            padding-left: 0.25em !important;
            border-radius: var(--border-radius);
            overflow: auto;
            scrollbar-color: var(--color) var(--background-color);
            scrollbar-width: thin;
            transition: padding 0.05s ease-out;
          }
          :host ol > li, :host ol > wct-load-template-tag {
            width: calc(50% - 0.5em);
          }
          :host ol > li.self {
            --box-shadow-color: var(--color-secondary);
            --box-shadow-default: var(--box-shadow-length-one) var(--box-shadow-color), var(--box-shadow-length-two) var(--box-shadow-color);
            border: 1px solid var(--color-secondary);
          }
          :host ol > li.active {
            cursor: pointer;
          }
          :host ol > li:active {
            padding: 0;
            padding-left: 0 !important;
          }
          :host ol > li:active > * {
            padding: 1em;
          }
          :host ol > li > * {
            padding: 0.75em;
            margin: 0;
            transition: padding 0.05s ease-out;
          }
          :host ol > li.active > * {
            --box-shadow-default: var(--box-shadow-length-one) var(--box-shadow-color), var(--box-shadow-length-two) var(--box-shadow-color);
            --h4-color: var(--background-color);
            color: var(--background-color);
            background-color: var(--background-color-rgba-50);
            border-radius: var(--border-radius);
          }
          :host ol > li > div {
            height: 100%;
          }
          :host ol > li > div > table > tbody {
            display: grid;
            grid-template-columns: 1fr 1fr;
            margin: 0;
          }
          :host ol > li > div > table > tbody > tr {
            display: contents;
          }
          :host ol > li > div > table > tbody > tr > td {
            overflow-wrap: anywhere;
          }
          :host ol > li > div > table > tbody > tr.nickname {
            font-weight: bold;
          }
          :host ol > li.self > div > table > tbody > tr.nickname {
            color: var(--color-secondary);
            font-weight: bold;
          }
          :host ol > li > div > h2 {
            --color-hover: var(--color);
            --cursor-hover: auto;
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--color);
            overflow-wrap: anywhere;
          }
          :host ol > li > div > h2 > span.provider-icon {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          :host ol > li > div > h2 > span.provider-icon > .tiny{
            font-family: var(--font-family);
            color: var(--color);
            font-size: 0.25em;
            line-height: 0.5em;
            margin-bottom: 1.75em;
          }
          :host ol > li.active > div > h2 {
            --color: var(--background-color);
            --color-hover: var(--color);
          }
          :host ol > li.active > div > h2 > span.provider-icon > .tiny{
            color: var(--background-color);
          }
          :host ol > li.active > div > h2 {
            --cursor-hover: pointer;
            border-bottom: 1px solid var(--background-color);
          }
          :host chat-a-nick-name {
            display: inline-block;
          }
          :host > dialog #providers-graph {
            border-radius: var(--border-radius);
            padding: 5svh 10svw;
            border: 1px dashed var(--color-secondary);
          }
          :host([online]) > dialog #offline,
          :host(:not([online])) > dialog #providers-graph,
          :host > dialog #providers-graph:empty,
          :host > dialog #providers-graph:has(> chat-a-p2p-graph[no-data]),
          :host > dialog #providers-graph:has(> chat-a-p2p-graph:not([no-data])) ~ #no-connections {
            display: none
          }
          :host > dialog #offline {
            --dialog-top-slide-in-p-margin: 0;
            color: var(--color-secondary);
            z-index: 10;
            position: sticky;
            top: 4px;
          }
          :host > dialog #no-connections {
            --dialog-top-slide-in-p-margin: 0;
            color: var(--color-secondary);
          }
          @media only screen and (max-width: ${this.mobileBreakpoint}) {
            :host ol > li, :host ol > wct-load-template-tag {
              width: 100%;
            }
          }
          @media only screen and (min-width: 1500px) {
            :host ol > li, :host ol > wct-load-template-tag {
              width: calc(33.3% - 0.66em);
            }
          }
          @media only screen and (min-width: 2500px) {
            :host ol > li, :host ol > wct-load-template-tag {
              width: calc(25% - 0.75em);
            }
          }
        </style>
        <dialog>
          <wct-menu-icon id="close" no-aria class="open sticky" namespace="menu-icon-close-" no-click></wct-menu-icon>
          <h4>Connection Data:</h4>
          <p id="offline">You are offline!</p>
          <div>
            <div id="providers-graph"></div>
            <br>
            <hr>
            <br>
            <div>
              <h4 class="title connected">Connected Providers</h4>
              <ol id="providers"></ol>
            </div>
            <p id="no-connections">No active connections!</p>
            <br>
            <hr>
            <br>
            <div>
              <h4 class="title not-connected">Not Connected Providers</h4>
              <ol id="all-providers"></ol>
            </div>
          </div>
        </dialog>
      </wct-dialog>
    `
    // render the nickname dialog
    new Promise(resolve => this.dispatchEvent(new CustomEvent('yjs-get-nickname', {
      detail: {
        resolve
      },
      bubbles: true,
      cancelable: true,
      composed: true
    }))).then(nickname => (this.html = /* html */`<chat-m-nick-name-dialog namespace="dialog-top-slide-in-" show-event-name="open-nickname" nickname="${nickname}"></chat-m-nick-name-dialog>`))
    return this.fetchModules([
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../atoms/p2pGraph/P2pGraph.js?${Environment?.version || ''}`,
        name: 'chat-a-p2p-graph'
      },
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
        path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/molecules/loadTemplateTag/LoadTemplateTag.js?${Environment?.version || ''}`,
        name: 'wct-load-template-tag'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../atoms/nickName/NickName.js?${Environment?.version || ''}`,
        name: 'chat-a-nick-name'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}./dialogs/NickNameDialog.js?${Environment?.version || ''}`,
        name: 'chat-m-nick-name-dialog'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../components/atoms/loading/Loading.js?${Environment?.version || ''}`,
        name: 'a-loading'
      }
    ])
  }

  get details () {
    return this.root.querySelector('details')
  }

  get summary () {
    return this.details.querySelector('summary')
  }

  get dialog () {
    return this.root.querySelector('wct-dialog')
  }

  get dialogEl () {
    return this.dialog?.root.querySelector('dialog')
  }

  isDialogOpen () {
    return this.dialog.root.querySelector('dialog[open]')
  }

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }
}
