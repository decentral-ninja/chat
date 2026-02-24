// @ts-check
import { Intersection } from '../../../../event-driven-web-components-prototypes/src/Intersection.js'
import { escapeHTML } from '../../../../event-driven-web-components-prototypes/src/helpers/Helpers.js'
import { getHexColor, jsonParseMapUrlReviver } from '../../../../Helpers.js'
import { separator } from '../../../../event-driven-web-components-yjs/src/es/controllers/Users.js'
import { scrollElIntoView } from '../../../../event-driven-web-components-prototypes/src/helpers/Helpers.js'

/* global Environment */

/**
* @export
* @class Provider
* @type {CustomElementConstructor}
*/
export default class Provider extends Intersection() {
  static get observedAttributes () {
    return ['class']
  }

  constructor (id, name, data, order, roomName, options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, tabindex: 'no-tabindex', intersectionObserverInit: {}, ...options }, ...args)

    // @ts-ignore
    this.roomNamePrefix = self.Environment?.roomNamePrefix || 'chat-'

    if (this.template) {
      ({ id: this.id, name: this.name, data: this.data, order: this.order, roomName: this.roomName } = JSON.parse(this.template.content.textContent, jsonParseMapUrlReviver))
      // revive url from href
      /** @type {import('./Providers.js').Provider} */
      this.data.urls.forEach((url, key) => {
        if (typeof url.url === 'string') this.data.urls.set(key, { ...url, url: new URL(url.url) })
      })
    } else {
      this.id = id
      this.name = name
      /** @type {import('./Providers.js').Provider} */
      this.data = data
      this.order = order
      this.roomName = roomName
    }
    this.setAttribute('id', this.id)

    this.keepAliveDefaultValue = 86400000 // has to be the same as on Servers Utils.js (delay) L: 333

    const changeEventListener = event => this.setAttribute('touched', '')
    let msCounter, daysCounter
    this.inputKeepAliveChangeEventListener = (event, initialValue = false) => {
      this.spanKeepAliveCounter.textContent = event.target.value
      this.spanKeepAliveText.textContent = `(keep data on websocket for: ${msCounter = event.target.value / 1000 / 60 / 60} ${msCounter === 0 ? ' seconds = deleted immediately after the last client disconnects!' : `hours ≈ ${daysCounter = (msCounter / 24).toFixed(1)} day${Number(daysCounter) >= 2 ? 's' : ''}`})`
      if (!initialValue) changeEventListener(event)
    }
    this.selectNameChangeEventListener = event => {
      event.target.setAttribute('value', event.target.value)
      changeEventListener(event)
    }
    this.selectProtocolChangeEventListener = event => changeEventListener(event)
    this.inputPortChangeEventListener = event => changeEventListener(event)

    this.connectEventListener = event => {
      event.stopPropagation()
      this.removeAttribute('touched')
      this.setAttribute('updating', '')
      this.iconConnectionState.setAttribute('updating', '')
      this.dispatchEvent(new CustomEvent('connect-provider', {
        detail: {
          urlHrefObj: this.getUrlHrefObj()
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))
    }
    this.disconnectEventListener = event => {
      event.stopPropagation()
      this.removeAttribute('touched')
      this.setAttribute('updating', '')
      this.iconConnectionState.setAttribute('updating', '')
      this.dispatchEvent(new CustomEvent('disconnect-provider', {
        detail: {
          urlHrefObj: this.getUrlHrefObj()
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))
    }
    this.undoEventListener = event => {
      event.stopPropagation()
      this.removeAttribute('touched')
      this.update(this.data, this.order)
    }

    this.titleElClickEventListener = event => {
      if (this.classList.contains('active')) this.classList.remove('active')
    }

    this.iconPingStateClickEventListener = event => {
      if (this.details.details.hasAttribute('open')) {
        this.details.details.removeAttribute('open')
      } else {
        this.details.details.setAttribute('open', '')
      }
    }

    this.iconShareClickEventListener = event => {
      this.fetchModules([{
        // @ts-ignore
        path: `${this.importMetaUrl}../molecules/dialogs/ShareDialog.js?${Environment?.version || ''}`,
        name: 'chat-m-share-dialog'
      }]).then(async () => {
        const urlHrefObj = this.getUrlHrefObj()
        const shareValue = `${urlHrefObj?.name || this.selectName.value}${separator}${urlHrefObj?.url.origin || Array.from(this.data.urls.keys())[0]}`
        if (this.shareDialog) {
          this.shareDialog.setAttribute('href', shareValue)
          this.shareDialog.setAttribute('href-title', `provider - ${shareValue}`)
          // @ts-ignore
          this.shareDialog.show('show-modal')
        } else {
          const div = document.createElement('div')
          div.innerHTML = /* html */`
            <chat-m-share-dialog
              namespace="dialog-top-slide-in-"
              open="show-modal"
              href="${shareValue}"
              href-title="provider - ${shareValue}"
              chat-add-type="share-provider"
              chat-add-id="${this.getAttribute('id')}"
              no-navigator-share
            ></chat-m-share-dialog>
          `
          this.shareDialog = div.children[0]
          this.root.appendChild(div.children[0])
        }
      })
    }

    this.openDetailsEventListener = event => {
      this.renderProviderInfo(true)
      // @ts-ignore
      scrollElIntoView(() => (this), ':not([intersecting])')
    }

    this.closeDetailsEventListener = event => this.updateHeight(true)

    this.detailsAnimationendEventListener = event => this.updateHeight()

    this.renderProviderInfoForce = false
    this.onlineEventListener = async event => {
      this.iconConnectionState.setAttribute('updating', '')
      if (this.hasAttribute('intersecting')) this.renderProviderInfo(this.renderProviderInfoForce)
    }
    this.offlineEventListener = async event => {
      this.iconConnectionState.setAttribute('state', 'offline')
      this.renderProviderInfoForce = true
    }

    // this updates the min-height on resize, see updateHeight function for more info
    let resizeTimeout = null
    this.resizeEventListener = event => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(async () => this.updateHeight(), 200)
    }
  }

  connectedCallback () {
    super.connectedCallback()
    this.hidden = true
    const showPromises = []
    if (this.shouldRenderCSS()) showPromises.push(this.renderCSS())
    if (this.shouldRenderHTML()) showPromises.push(this.renderHTML())
    Promise.all(showPromises).then(() => {
      this.hidden = false
      if (navigator.onLine) {
        this.onlineEventListener()
      } else {
        this.offlineEventListener()
      }
      this.updateHeight()
    })
    this.inputKeepAlive.addEventListener('change', this.inputKeepAliveChangeEventListener)
    this.selectName.addEventListener('change', this.selectNameChangeEventListener)
    this.selectProtocol.addEventListener('change', this.selectProtocolChangeEventListener)
    this.inputPort.addEventListener('change', this.inputPortChangeEventListener)
    this.addEventListener('connect', this.connectEventListener)
    this.addEventListener('disconnect', this.disconnectEventListener)
    this.addEventListener('undo', this.undoEventListener)
    this.titleEl.addEventListener('click', this.titleElClickEventListener)
    this.iconPingState.addEventListener('click', this.iconPingStateClickEventListener)
    this.iconDefault.addEventListener('click', this.iconPingStateClickEventListener)
    this.iconShare.addEventListener('click', this.iconShareClickEventListener)
    this.addEventListener('open', this.openDetailsEventListener)
    this.addEventListener('close', this.closeDetailsEventListener)
    this.addEventListener('wct-details-animationend', this.detailsAnimationendEventListener)
    self.addEventListener('online', this.onlineEventListener)
    self.addEventListener('offline', this.offlineEventListener)
    self.addEventListener('resize', this.resizeEventListener)
  }

  disconnectedCallback () {
    super.disconnectedCallback()
    this.inputKeepAlive.removeEventListener('change', this.inputKeepAliveChangeEventListener)
    this.selectName.removeEventListener('change', this.selectNameChangeEventListener)
    this.selectProtocol.removeEventListener('change', this.selectProtocolChangeEventListener)
    this.inputPort.removeEventListener('change', this.inputPortChangeEventListener)
    this.removeEventListener('connect', this.connectEventListener)
    this.removeEventListener('disconnect', this.disconnectEventListener)
    this.removeEventListener('undo', this.undoEventListener)
    this.titleEl.removeEventListener('click', this.titleElClickEventListener)
    this.iconPingState.removeEventListener('click', this.iconPingStateClickEventListener)
    this.iconDefault.removeEventListener('click', this.iconPingStateClickEventListener)
    this.iconShare.removeEventListener('click', this.iconShareClickEventListener)
    this.removeEventListener('open', this.openDetailsEventListener)
    this.removeEventListener('close', this.closeDetailsEventListener)
    this.removeEventListener('wct-details-animationend', this.detailsAnimationendEventListener)
    self.removeEventListener('online', this.onlineEventListener)
    self.removeEventListener('offline', this.offlineEventListener)
    self.removeEventListener('resize', this.resizeEventListener)
  }

  attributeChangedCallback (name, oldValue, newValue) {
    if (this.details) {
      if (this.classList.contains('active')) {
        this.details.details.setAttribute('open', '')
      } else {
        this.details.details.removeAttribute('open', '')
      }
    }
  }

  intersectionCallback (entries, observer) {
    if (this.areEntriesIntersecting(entries)) {
      this.setAttribute('intersecting', '')
      if (navigator.onLine) {
        this.renderProviderInfo(this.renderProviderInfoForce)
        this.renderProviderInfoForce = false
      }
      if (this.doOnIntersection) this.doOnIntersection()
      return
    }
    this.removeAttribute('intersecting')
  }

  /**
   * evaluates if a render is necessary
   *
   * @return {boolean}
   */
  shouldRenderCSS () {
    return !this.root.querySelector(`${this.cssSelector} > style[_css]`)
  }

  /**
   * evaluates if a render is necessary
   *
   * @return {boolean}
   */
  shouldRenderHTML () {
    return !this.section
  }

  /**
   * renders the css
   * @returns Promise<void>
   */
  renderCSS () {
    this.css = /* css */`
      :host {
        --button-primary-border-radius: var(--border-radius);
        --button-primary-width: 100%;
        --button-primary-height: 100%;
        --button-secondary-border-radius: var(--border-radius);
        --button-secondary-width: 100%;
        --button-secondary-height: 100%;
        --color: var(--a-color);
        --color-hover: var(--color-yellow);
        --h2-word-break: break-word;
        --h2-font-family: var(--font-family);
        --h2-font-size: 2em;
        position: relative;
      }
      :host {
        display: block;
      }
      :host([has-height]:not([intersecting])) > section#grid {
        display: none;
      }
      :host(.active) > section > wct-details::part(title) {
        cursor: pointer;
        text-decoration: underline;
      }
      :host([updating]) > section > wct-button {
        --button-primary-background-color-custom: var(--color-gray);
        --button-primary-border-color: var(--color-gray);
        pointer-events: none;
      }
      :host([updating])::after {
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
      @keyframes updating { 
        0%{background-position:10% 0%}
        50%{background-position:91% 100%}
        100%{background-position:10% 0%}
      }
      :host > section {
        background-color: var(--card-background-color, transparent);
        border: var(--wct-input-border, 1px solid var(--color-black));
        border-radius: var(--border-radius);
        box-shadow: var(--box-shadow-length-one) var(--box-shadow-color), var(--box-shadow-length-two) var(--box-shadow-color);
        min-height: var(--chat-m-provider-min-height, 5em); /* wct-load-template-tag requirement */
      }
      /* https://weedshaker.github.io/cssGridLayout/ */
      #grid {
        display: grid;
        grid-template-areas:
          "connectionStateIcon title title title title notification"
          "url url url url url url"
          "keep-alive keep-alive keep-alive keep-alive keep-alive keep-alive"
          "set-btn set-btn undo-btn undo-btn connect-btn connect-btn";
        grid-template-columns: repeat(6, 1fr);
        padding: var(--card-padding, 0.75em);
        align-items: center;
        gap: var(--grid-gap, 0.5em);
      }
      :host > section > div.icons {
        display: flex;
        align-self: start;
        justify-self: start;
        gap: 1em;
      }
      :host > section > div.icons:has(> chat-m-notifications) {
        align-self: start;
        justify-self: end;
      }
      :host > section > div.icons > chat-m-notifications {
        display: none;
      }
      :host > section > div.icons:has(~ div#url > select[value=websocket]) > chat-m-notifications {
        display: flex;
      }
      :host(:not([default])) > section > div.icons > wct-icon-mdx#default {
        display: none;
      }
      :host > section > div#url > span:has(+ input#port:placeholder-shown) {
        display: none;
      }
      :host > section > div#url > input#port {
        width: 9em;
      }
      :host > section > div:where(#url, #keep-alive) {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        background-color: var(--input-area-background-color, var(--color-gray-lighter));
        padding: 0.5em;
        border: var(--input-area-border, 1px solid var(--color-black));
        border-radius: var(--border-radius);
      }
      :host > section > div:where(#url, #keep-alive) > :where(select, input) {
        height: 2em;
        font-size: 1em;
        background-color: var(--input-area-select-background-color, transparent);
        --outline-color: transparent;
        border: 0;
        cursor: pointer;
        color: var(--color);
        padding: 0 2em 0 1em;
      }
      :host > section > div#keep-alive {
        gap: 1em;
        justify-content: space-between;
      }
      :host > section > div#keep-alive, :host > section > div#url > :where(#keep-alive-name, #keep-alive-counter) {
        display: none;
      }
      :host > section:has(> div#url > select[value=websocket]) > div#keep-alive {
        display: flex;
      }
      :host > section:has(> div#url > select[value=websocket]) > div#url > :where(#keep-alive-name, #keep-alive-counter) {
        display: inline;
      }
      :host > section > div#keep-alive > #keep-alive-input {
        accent-color: var(--color-secondary);
        max-width: 100%;
        margin: 0;
        flex-grow: 1;
      }
      :host > section > wct-button {
        height: 100%;
        word-break: break-word;
      }
      :host > section wct-button {
        display: none;
      }
      :host(:not([connected])) > section wct-button#connect, :host([connected]) > section wct-button#disconnect {
        display: block;
      }
      :host([touched][connected]) > section > :where(wct-button#set, wct-button#undo) {
        display: block;
      }
      :host([touched]:not([connected])) > section > wct-button#connect, :host([touched]) > section > wct-button#disconnect {
        display: none;
      }
      :host([touched]:not([connected])) > section > :where(wct-button#set-and-connect, wct-button#undo) {
        display: block;
      }
      :host > section > wct-button:where(#connect, #set-and-connect, #set) {
        --button-primary-background-color-custom: var(--color-green);
        --button-primary-border-color: var(--color-green);
        --button-secondary-color: var(--color-green);
        --button-secondary-border-color: var(--color-green);
      }
      @media only screen and (max-width: _max-width_) {
        #grid {
          grid-template-areas:
            "connectionStateIcon connectionStateIcon connectionStateIcon notification notification notification"
            "title title title title title title"
            "url url url url url url"
            "keep-alive keep-alive keep-alive keep-alive keep-alive keep-alive"
            "set-btn set-btn set-btn undo-btn undo-btn undo-btn"
            "connect-btn connect-btn connect-btn connect-btn connect-btn connect-btn";
        }
      }
    `
    getHexColor(Array.from(this.data.urls)?.[0][1].url.host).then(hex => {
      this.css = /* css */`
        :host > section {
          border-color: ${hex};
        }
      `
    })
    return this.fetchTemplate()
  }

  /**
   * fetches the template
   */
  fetchTemplate () {
    return this.fetchCSS([
      {
        path: `${this.importMetaUrl}../../../../web-components-toolbox/src/css/reset.css`, // no variables for this reason no namespace
        namespace: false
      },
      {
        path: `${this.importMetaUrl}../../../../web-components-toolbox/src/css/style.css`, // apply namespace and fallback to allow overwriting on deeper level
        namespaceFallback: true
      }
    ], false)
  }

  /**
   * Render HTML
   * @returns Promise<void>
   */
  renderHTML () {
    // keep-alive max=10days, value=1day, step=1h
    this.html = /* html */`
      <section id=grid>
        <div class=icons style="grid-area: connectionStateIcon">
          <wct-icon-mdx id="default" title="Decentral Ninja default provider" style="color:var(--color-green-full)" icon-url="../../../../../../img/icons/shield-check.svg" size="2em"></wct-icon-mdx>
          <a-icon-states id=ping-state>
            <template>
              <wct-icon-mdx state="default" title="pinging..." icon-url="../../../../../../img/icons/network.svg" size="2em"></wct-icon-mdx>
              <wct-icon-mdx state="fetch-success" title="fetch successful!" style="color:var(--color-green-full)" icon-url="../../../../../../img/icons/network.svg" size="2em"></wct-icon-mdx>
              <wct-icon-mdx state="ping-success" title="ping successful!" style="color:var(--color-orange)" icon-url="../../../../../../img/icons/network.svg" size="2em"></wct-icon-mdx>
              <wct-icon-mdx state="error" title="not able to fetch nor ping the provider" style="color:var(--color-error)" icon-url="../../../../../../img/icons/network-off.svg" size="2em"></wct-icon-mdx>
            </template>
          </a-icon-states>
          <a-icon-states id=connection-state state="disconnected">
            <template>
              <wct-icon-mdx state="connected" id=connected title=connected style="--color: var(--color-green-full);" no-hover icon-url="../../../../../../img/icons/plug-connected.svg" size="2em"></wct-icon-mdx>
              <wct-icon-mdx state="connecting" id=connecting title="trying to connect" style="--color: var(--color-orange);" no-hover icon-url="../../../../../../img/icons/plug-connected.svg" size="2em"></wct-icon-mdx>
              <wct-icon-mdx state="disconnected" id=disconnected title=disconnected style="--color: var(--color-error);" no-hover icon-url="../../../../../../img/icons/plug-connected-x.svg" size="2em"></wct-icon-mdx>
              <wct-icon-mdx state="offline" title="You are offline!" style="color:var(--color-error)" no-hover icon-url="../../../../../../img/icons/plug-connected-x.svg" size="2em"></wct-icon-mdx>
            </template>
          </a-icon-states>
        </div>
        <wct-details style="grid-area: title" animationend-event-name=wct-details-animationend>
          <style protected>
            :host > details > table {
              --h3-margin: 1.143rem auto 0;
              margin: 0;
            }
            :host > details > table > tbody {
              display: grid;
              grid-template-columns: 1fr 1fr;
              margin: 0;
            }
            :host > details > table > tbody > tr {
              display: contents;
            }
            :host > details > table > tbody > tr > td {
              border-bottom: 1px solid var(--color);
              overflow-wrap: anywhere;
            }
            :host > details > table > tbody > tr > td:last-child {
              font-family: monospace;
            }
            :host > details > table > tbody > tr > td#fallbacks > div {
              align-items: center;
              display: flex;
              font-family: var(--font-family);
            }
            :host > details > table > tbody > tr > td#fallbacks > div > span {
              font-size: 0.75em;
              white-space: nowrap;
            }
            :host > details > table > tbody > tr > td:where(#origins, #status) {
              display: flex;
              flex-wrap: wrap;
              overflow: auto;
              scrollbar-color: var(--color) var(--background-color);
              scrollbar-width: thin;
            }
            :host > details > table > tbody > tr > td#origins {
              flex-direction: column;
            }
            :host > details > table > tbody > tr > td:where(#origins, #status) > span {
              margin-right: 1em;
              white-space: nowrap;
            }
            :host > details > table > tbody > tr > td:where(#origins, #status) > span:where(.is-active-room, .once-established, .connected, .active) {
              color: var(--color-green-full);
              order: 1;
              text-decoration: underline;
            }
            :host > details > table > tbody > tr > td:where(#origins, #status) > span:not(:where(.is-active-room, .once-established, .connected, .active)) {
              order: 2;
            }
            @media only screen and (max-width: ${this.mobileBreakpoint}) {
              :host > details > table > tbody > tr > td, :host > details > table > tbody > tr > td[style="grid-column: span 2;"] {
                grid-column: 1/3 !important;
                border-bottom: 1px solid transparent;
                margin-left: 1em;
              }
              :host > details > table > tbody > tr > td[style="grid-column: span 2;"] {
                margin-left: 0 !important;
              }
              :host > details > table > tbody > tr > td:first-child {
                border-bottom: 1px solid var(--color);
              }
              :host > details > table > tbody > tr > td:last-child {
                margin-left: 2em;
              }
            }
          </style>
          <details>
            <summary>
              <h2 part=title>Title</h2>
            </summary>
            <table>
              <tbody>
                <tr>
                  <td style="grid-column: span 2;" colspan="2"><h3 id=title>...</h3></td>
                </tr>
                <tr>
                  <td>Provider response:</td>
                  <td id=custom-message>fetching...</td>
                </tr>
                <tr>
                  <td>Fallbacks:</td>
                  <td id=fallbacks>fetching...</td>
                </tr>
                <tr>
                  <td>Origins:</td>
                  <td id=origins></td>
                </tr>
                <tr>
                  <td>Status:</td>
                  <td id=status></td>
                </tr>
              </tbody>
            </table>
          </details>
        </wct-details>
        <div class=icons style="grid-area: notification">
          <chat-m-notifications room="${escapeHTML(this.roomName)}" hostname="${Array.from(this.data?.urls || [])?.[0]?.[1].url.hostname || ''}" on-connected-request-notifications allow-mute no-click no-hover></chat-m-notifications>
          <wct-icon-mdx id=share title=share icon-url="../../../../../../img/icons/share-3.svg" size="2em"></wct-icon-mdx>
        </div>
        <div id=url style="grid-area: url">
          <select id=name></select>
          <select id=protocol></select>
          <span>//</span>
          <span id=hostname></span>
          <span>:</span>
          <input id=port type=number min=0 max=99999 placeholder=":[add port]" />
          <span id=keep-alive-name>?keep-alive=</span>
          <span id=keep-alive-counter></span>
        </div>
        <div id=keep-alive style="grid-area: keep-alive">
          <input id=keep-alive-input type=range min=0 max=864000000 value="${this.keepAliveDefaultValue}" step=3600000 />
          <span id=keep-alive-text></span>
        </div>
        <wct-button id=connect style="grid-area: connect-btn" namespace="button-primary-" request-event-name="connect" click-no-toggle-active>connect</wct-button>
        <wct-button id=disconnect style="grid-area: connect-btn" namespace="button-primary-" request-event-name="disconnect" click-no-toggle-active>disconnect</wct-button>
        <wct-button id=set-and-connect style="grid-area: connect-btn" namespace="button-primary-" request-event-name="connect" click-no-toggle-active>save changes & connect</wct-button>
        <wct-button id=set style="grid-area: connect-btn" namespace="button-secondary-" request-event-name="connect" click-no-toggle-active>save changes</wct-button>
        <wct-button id=undo style="grid-area: undo-btn" namespace="button-secondary-" request-event-name="undo" click-no-toggle-active>undo</wct-button>
      </section>
    `
    this.html = this.customStyle
    this.html = this.customStyleHeight
    this.inputKeepAliveChangeEventListener({ target: { value: this.inputKeepAlive.value } }, true)
    this.update(this.data, this.order, true)
    return this.fetchModules([
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/atoms/iconMdx/IconMdx.js?${Environment?.version || ''}`,
        name: 'wct-icon-mdx'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/atoms/button/Button.js?${Environment?.version || ''}`,
        name: 'wct-button'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/molecules/details/Details.js?${Environment?.version || ''}`,
        name: 'wct-details'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../components/atoms/iconStates/IconStates.js?${Environment?.version || ''}`,
        name: 'a-icon-states'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}./Notifications.js?${Environment?.version || ''}`,
        name: 'chat-m-notifications'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../atoms/providerName/ProviderName.js?${Environment?.version || ''}`,
        name: 'chat-a-provider-name'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../atoms/roomName/RoomName.js?${Environment?.version || ''}`,
        name: 'chat-a-room-name'
      }
    ])
  }

  /**
   * Update components
   * @param {import('./Providers.js').Provider} data
   * @param {number} order
   * @param {boolean} [updateOrder=false]
   * @param {boolean} [removeDataUpdating=true]
   * @returns {void}
   */
  update (data, order, updateOrder = false, removeDataUpdating = true) {
    this.data = data
    this.order = order
    if (updateOrder) this.customStyle.textContent = /* css */`
      :host {
        order: ${order};
      }
    `
    if (removeDataUpdating && this.hasAttribute('updating')) {
      this.dispatchEvent(new CustomEvent('yjs-request-notifications', {
        detail: { force: true },
        bubbles: true,
        cancelable: true,
        composed: true
      }))
      this.removeAttribute('updating')
    }
    this.doOnIntersection = () => {
      this.notifications.setAttribute('hostname', Array.from(this.data?.urls || [])?.[0]?.[1].url.hostname || '')
      if (data.status.includes('connected') || data.status.includes('active')) {
        this.setAttribute('connected', '')
      } else {
        this.removeAttribute('connected')
      }
      if (data.status.includes('default')) {
        this.setAttribute('default', '')
      } else {
        this.removeAttribute('default')
      }
      let removeIconStateUpdating = true
      if (navigator.onLine) {
        if (data.status.includes('connected')) {
          this.iconConnectionState.setAttribute('state', 'connected')
        } else if (data.status.includes('active')) {
          this.iconConnectionState.setAttribute('state', 'connecting')
          this.iconConnectionState.setAttribute('updating', '')
          removeIconStateUpdating = false
        } else {
          this.iconConnectionState.setAttribute('state', 'disconnected')
        }
      } else {
        this.iconConnectionState.setAttribute('state', 'offline')
      }
      if (removeIconStateUpdating) this.iconConnectionState.removeAttribute('updating')
      // avoid updating when inputs got changed
      if (this.hasAttribute('touched')) return
      let keepAlive = this.keepAliveDefaultValue
      this.selectName.disabled = data.status.includes('active') || data.status.includes('connected')
      // reset the selected options
      Provider.resetSelect(this.selectName)
      Provider.resetSelect(this.selectProtocol)
      this.inputPort.value = ''
      let hasSelected = false
      Array.from(data.urls).forEach(([origin, urlContainer], i) => {
        let selected = data.status.includes('active')
          ? urlContainer.status === 'active'
          : urlContainer.status === 'connected' || urlContainer.status === 'disconnected'
        if (selected) {
          hasSelected = true
        } else if (!hasSelected) {
          selected = urlContainer.status === 'once-established' || urlContainer.status === 'default'
          if (selected) hasSelected = true
        }
        Provider.updateSelect(this.selectName, urlContainer.name || 'websocket', selected)
        this.selectName.setAttribute('value', this.selectName.value)
        Provider.updateSelect(this.selectProtocol, urlContainer.url.protocol, selected)
        this.selectProtocol.setAttribute('value', this.selectProtocol.value)
        if (i === 0) {
          this.titleEl.textContent = urlContainer.url.hostname
          this.spanHostname.textContent = urlContainer.url.hostname
        }
        if (selected) this.inputPort.value = urlContainer.url.port ? urlContainer.url.port : ''
        let currentKeepAlive
        if (selected && keepAlive === this.keepAliveDefaultValue && urlContainer.url.searchParams.get('keep-alive') !== null && !isNaN(currentKeepAlive = Number(urlContainer.url.searchParams.get('keep-alive')))) keepAlive = currentKeepAlive
      })
      this.inputKeepAliveChangeEventListener({ target: { value: (this.inputKeepAlive.value = keepAlive) } }, true)
      this.updateHeight()
      this.doOnIntersection = null
    }
    if (this.hasAttribute('intersecting')) this.doOnIntersection()
  }

  static resetSelect (select) {
    Array.from(select.querySelectorAll('option')).forEach(option => (option.selected = false))
  }

  static updateSelect (select, value, selected) {
    let option
    if (!(option = select.querySelector(`option[value="${value}"]`))) {
      option = document.createElement('option')
      option.value = option.textContent = value
      select.appendChild(option)
    }
    if (!option.selected) option.selected = selected
  }

  // Due to performance issues, dialog open took around 1300ms (after this change ca. 350ms) on a chat with many users. This eliminated the recalculate style thanks to :host([has-height]:not([intersecting])) > li: display: none; for not intersecting user components but also keeps the height, to avoid weird scrolling effects.
  updateHeight (clear = false) {
    // wct-details has an animation, which is triggered when intersecting, this animation is typically 300ms when not specified by attribute open-duration
    // set --animation: none; if this has still side effects
    clearTimeout(this._timeoutUpdateHeight)
    this._timeoutUpdateHeight = setTimeout(() => {
      this.removeAttribute('has-height')
      this.customStyleHeight.textContent = ''
      if (!clear) self.requestAnimationFrame(timeStamp => {
        this.customStyleHeight.textContent = /* css */`
          :host {
            min-height: ${this.clientHeight}px;
          }
        `
        this.setAttribute('has-height', '')
      })
    }, clear ? 0 : 350)
  }

  renderProviderInfo (force) {
    this.iconPingState.setAttribute('updating', '')
    return this.getProvidersEventDetail().then(providersEventDetail => providersEventDetail.getData(false)).then(data => {
      const urlInfo = Array.from(this.data.urls).reduce((acc, [origin, urlContainer]) => {
        if (urlContainer.name === 'websocket') acc.hasWebsocket = true
        if (urlContainer.url.hostname) acc.hostname = urlContainer.url.hostname
        return acc
      }, {
        hostname: '',
        hasWebsocket: false
      })
      this.detailsCustomTitle.textContent = urlInfo.hostname
      this.detailsOrigins.innerHTML = this.data.origins.reduce((acc, origin) => /* html */`
        ${acc}
        ${origin.includes(this.roomNamePrefix)
          ? `
            <chat-a-room-name>
              <template>${JSON.stringify({roomName: origin})}</template>
            </chat-a-room-name>
          `
          : `<span>${escapeHTML(origin)}</span>`
        }
      `, '')
      this.detailsStatus.innerHTML = this.data.status.reduce((acc, status) => /* html */`${acc}<span class="${status}">${status}</span>`, '')
      const url = Array.from(this.data.urls.keys())[0]
      const pingProvider = errorMessage => data.pingProvider(url, force).then(response => {
        this.iconPingState.removeAttribute('updating')
        if (response.status === 'success') {
          this.detailsCustomMessage.textContent = 'Ping: success!'
          this.iconPingState.setAttribute('state', 'ping-success')
        } else {
          this.detailsCustomMessage.textContent = `${errorMessage}; ping: failed!`
          this.iconPingState.setAttribute('state', 'error')
        }
      })
      const renderProviderFallbacks = providerFallbacks => {
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = providerFallbacks.reduce((acc, [name, providers]) => {
          return acc + providers.reduce((acc, href) => {
            // render or update
            const url = new URL(href)
            // @ts-ignore
            const id = `${self.Environment?.providerNamespace || 'p_'}${url.hostname.replaceAll('.', '-')}` // string <ident> without dots https://developer.mozilla.org/en-US/docs/Web/CSS/ident
            const renderProviderName = () => /* html */`<div><chat-a-provider-name id="${id}" provider-dialog-show-event><span name>${name}${separator}${url.origin}</span></chat-a-provider-name><span>&nbsp;(${name})</span></div>`
            if (!this.detailsFallbacks.querySelector(`#${id}`) && urlInfo.hostname !== url.hostname) return acc + renderProviderName()
            return acc
          }, '')
        }, '')
        if (!this.detailsFallbacks.children.length) this.detailsFallbacks.textContent = ''
        Array.from(tempDiv.children).forEach(child => this.detailsFallbacks.appendChild(child))
      }
      // Render the fallbacks saved at local storage rooms
      const renderProviderFallbacksFromStorage = providerFallbacks => {
        renderProviderFallbacks([providerFallbacks.reduce((acc, providerFallback) => {
          // @ts-ignore
          acc[1].push(providerFallback)
          return acc
        }, ['websocket', []])])
      }
      if (urlInfo.hasWebsocket) {
        const providerFallbacks = this.data.providerFallbacks?.get('websocket')
        // prerender the local storage fallbacks, before getWebsocketInfo answers
        if (providerFallbacks?.length) {
          renderProviderFallbacksFromStorage(providerFallbacks)
        } else {
          this.detailsFallbacks.textContent = 'Loading...'
        }
        data.getWebsocketInfo(url, force).then(info => {
          if (info.error) {
            this.detailsCustomMessage.textContent = info.error
            if (providerFallbacks?.length) {
              renderProviderFallbacksFromStorage(providerFallbacks)
            } else {
              this.detailsFallbacks.textContent = info.error
            }
            pingProvider(info.error)
          } else {
            // htmlPurify from provider responses if using html
            this.detailsCustomMessage.textContent = info.customMessage
            if (Array.isArray(info.providerFallbacks)) {
              renderProviderFallbacks(info.providerFallbacks)
            } else {
              this.detailsFallbacks.textContent = 'None'
            }
            this.iconPingState.removeAttribute('updating')
            this.iconPingState.setAttribute('state', 'fetch-success')
          }
        })
      } else {
        pingProvider('Server')
        this.detailsFallbacks.textContent = 'None'
      }
    })
  }

  getProvidersEventDetail (force) {
    return (!force && this._providersEventDetail) || (this._providersEventDetail = new Promise(resolve => this.dispatchEvent(new CustomEvent('yjs-get-providers-event-detail', {
      detail: { resolve },
      bubbles: true,
      cancelable: true,
      composed: true
    }))))
  }

  /**
   * @returns {{ url: URL; href: string; name: any; } | null}
   */
  getUrlHrefObj () {
    const urlsArr = Array.from(this.data.urls)
    let url
    try {
      url = new URL(urlsArr[0][1].url.href)
      if (this.selectProtocol.value) url.protocol =  this.selectProtocol.value
      if (this.inputPort.value) {
        url.port = this.inputPort.value
      } else {
        url.port = ''
      }
    } catch (error) {
      return null
    }
    if (this.selectName.value === 'websocket') {
      url.searchParams.set('keep-alive', this.inputKeepAlive.value)
    } else {
      url.searchParams.delete('keep-alive')
    }
    return { url, href: url.href, name: this.selectName.value }
  }

  get iconConnectionState () {
    return this.root.querySelector('#connection-state')
  }

  get iconPingState () {
    return this.root.querySelector('#ping-state')
  }

  get iconDefault () {
    return this.root.querySelector('#default')
  }

  get iconShare () {
    return this.root.querySelector('#share')
  }

  get details () {
    return this.root.querySelector('wct-details')
  }

  get titleEl () {
    return this.details?.root.querySelector('h2')
  }

  get detailsCustomTitle () {
    return this.details?.root.querySelector('#title')
  }

  get detailsCustomMessage () {
    return this.details?.root.querySelector('#custom-message')
  }

  get detailsFallbacks () {
    return this.details?.root.querySelector('#fallbacks')
  }

  get detailsOrigins () {
    return this.details?.root.querySelector('#origins')
  }

  get detailsStatus () {
    return this.details?.root.querySelector('#status')
  }

  get section () {
    return this.root.querySelector('section')
  }

  get selectName () {
    return this.root.querySelector('select[id=name]')
  }

  get selectProtocol () {
    return this.root.querySelector('select[id=protocol]')
  }

  get spanHostname () {
    return this.root.querySelector('span[id=hostname]')
  }

  get inputPort () {
    return this.root.querySelector('input[id=port]')
  }

  get spanKeepAliveCounter () {
    return this.root.querySelector('span[id=keep-alive-counter]')
  }
  get spanKeepAliveText () {
    return this.root.querySelector('span[id=keep-alive-text]')
  }

  get inputKeepAlive () {
    return this.root.querySelector('input[id=keep-alive-input]')
  }

  get notifications () {
    return this.root.querySelector('chat-m-notifications')
  }

  get template () {
    return this.root.querySelector('template')
  }

  get customStyle () {
    return (
      this._customStyle ||
        (this._customStyle = (() => {
          const style = document.createElement('style')
          style.setAttribute('protected', 'true')
          return style
        })())
    )
  }

  get customStyleHeight () {
    return (
      this._customStyleHeight ||
        (this._customStyleHeight = (() => {
          const style = document.createElement('style')
          style.setAttribute('protected', 'true')
          return style
        })())
    )
  }
}
