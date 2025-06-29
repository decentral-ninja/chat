// @ts-check
import { Shadow } from '../../../../web-components-toolbox/src/es/components/prototypes/Shadow.js'
import { jsonParseMapUrlReviver } from '../../../../Helpers.js'

/* global Environment */

/**
* @export
* @class Provider
* @type {CustomElementConstructor}
*/
export default class Provider extends Shadow() {
  constructor (id, name, data, order, roomName, options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, ...options }, ...args)

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

    this.keepAliveDefaultValue = 86400000

    const changeEventListener = event => this.setAttribute('touched', '')
    let msCounter, daysCounter
    this.inputKeepAliveChangeEventListener = (event, initialValue = false) => {
      this.spanKeepAliveCounter.textContent = event.target.value
      this.spanKeepAliveText.textContent = `(keep data on websocket for: ${msCounter = event.target.value / 1000 / 60 / 60} ${msCounter === 0 ? ' seconds = immediately after the last client disconnects!' : `hours ≈ ${daysCounter = (msCounter / 24).toFixed(1)} day${Number(daysCounter) >= 2 ? 's' : ''}`})`
      if (!initialValue) changeEventListener(event)
    }
    this.selectNameChangeEventListener = event => {
      event.target.setAttribute('value', event.target.value)
      changeEventListener(event)
    }
    this.selectProtocolChangeEventListener = event => changeEventListener(event)

    this.connectEventListener = event => {
      event.stopPropagation()
      this.removeAttribute('touched')
      this.setAttribute('updating', '')
      this.iconStatesEl.setAttribute('updating', '')
      console.log('*********', 'connectEventListener')
    }
    this.disconnectEventListener = event => {
      event.stopPropagation()
      this.removeAttribute('touched')
      this.setAttribute('updating', '')
      this.iconStatesEl.setAttribute('updating', '')
      console.log('*********', 'disconnectEventListener')
    }
    this.undoEventListener = event => {
      event.stopPropagation()
      this.removeAttribute('touched')
      this.update(this.data, this.order)
    }
  }

  connectedCallback () {
    this.hidden = true
    const showPromises = []
    if (this.shouldRenderCSS()) showPromises.push(this.renderCSS())
    if (this.shouldRenderHTML()) showPromises.push(this.renderHTML())
    Promise.all(showPromises).then(() => (this.hidden = false))
    this.inputKeepAlive.addEventListener('change', this.inputKeepAliveChangeEventListener)
    this.selectName.addEventListener('change', this.selectNameChangeEventListener)
    this.selectProtocol.addEventListener('change', this.selectProtocolChangeEventListener)
    this.addEventListener('connect', this.connectEventListener)
    this.addEventListener('disconnect', this.disconnectEventListener)
    this.addEventListener('undo', this.undoEventListener)
  }

  disconnectedCallback () {
    this.inputKeepAlive.removeEventListener('change', this.inputKeepAliveChangeEventListener)
    this.selectName.removeEventListener('change', this.selectNameChangeEventListener)
    this.selectProtocol.removeEventListener('change', this.selectProtocolChangeEventListener)
    this.removeEventListener('connect', this.connectEventListener)
    this.removeEventListener('disconnect', this.disconnectEventListener)
    this.removeEventListener('undo', this.undoEventListener)
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
        --h2-word-break: break-all;
        position: relative;
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
      :host > section > a-icon-states {
        display: block;
        align-self: start;
        justify-self: start;
      }
      :host > section > chat-m-notifications {
        display: none;
        align-self: start;
        justify-self: end;
      }
      :host > section > chat-m-notifications:has(~ div#url > select[value=websocket]) {
        display: flex;
      }
      :host > section > div#url > span:has(+ span#port:empty) {
        display: none;
      }
      :host > section > div:where(#url, #keep-alive) {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        background-color: var(--color-gray-lighter);
        padding: 0.5em;
        border: 1px solid var(--color-black);
        border-radius: var(--border-radius);
      }
      :host > section > div#keep-alive {
        gap: 1em;
        justify-content: space-between;
      }
      :host > section > div#url > select {
        --outline-color: transparent;
        border: 0;
        height: 2em;
        font-size: 1em;
        cursor: pointer;
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
      :host > section :where(wct-icon-mdx, wct-button) {
        display: none;
      }
      :host(:not([connected])) > section wct-button#connect, :host([connected]) > section wct-button#disconnect {
        display: block;
      }
      :host([touched][connected]) > section > :where(wct-button#set, wct-button#undo) {
        display: block;
      }
      :host([touched]:not([connected])) > section > wct-button#connect {
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
    ])
  }

  /**
   * Render HTML
   * @returns Promise<void>
   */
  renderHTML () {
    // keep-alive max=10days, value=1day, step=1h
    this.html = /* html */`
      <section id=grid>
        <a-icon-states state="disconnected" style="grid-area: connectionStateIcon">
          <wct-icon-mdx state="connected" hover-on-parent-shadow-root-host id=connected title=connected style="--color: var(--color-green-full);" no-hover icon-url="../../../../../../img/icons/plug-connected.svg" size="2em"></wct-icon-mdx>
          <wct-icon-mdx state="disconnected" hover-on-parent-shadow-root-host id=disconnected title=disconnected style="--color: var(--color-secondary);" no-hover icon-url="../../../../../../img/icons/plug-connected-x.svg" size="2em"></wct-icon-mdx>
        </a-icon-states>
        <h2 style="grid-area: title">Title</h2>
        <chat-m-notifications style="grid-area: notification" room="${this.roomName}" hostname="${Array.from(this.data?.urls || [])?.[0]?.[1].url.hostname || ''}" on-connected-request-notifications allow-mute no-click no-hover></chat-m-notifications>
        <div id=url style="grid-area: url">
          <select id=name></select>
          <select id=protocol></select>
          <span>//</span>
          <span id=hostname></span>
          <span>:</span>
          <span id=port></span>
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
        <wct-button id=set style="grid-area: set-btn" namespace="button-secondary-" request-event-name="connect" click-no-toggle-active>save changes</wct-button>
        <wct-button id=undo style="grid-area: undo-btn" namespace="button-secondary-" request-event-name="undo" click-no-toggle-active>undo</wct-button>
      </section>
    `
    this.html = this.customStyle
    this.inputKeepAliveChangeEventListener({ target: { value: this.inputKeepAlive.value } }, true)
    this.update(this.data, this.order)
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
        path: `${this.importMetaUrl}../../../../components/atoms/iconStates/IconStates.js?${Environment?.version || ''}`,
        name: 'a-icon-states'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}./Notifications.js?${Environment?.version || ''}`,
        name: 'chat-m-notifications'
      }
    ])
  }

  /**
   * Update components
   * @param {import('./Providers.js').Provider} data
   * @param {number} order
   * @returns {void}
   */
  update (data, order) {
    this.data = data
    this.order = order
    this.customStyle.innerText = /* css */`
      :host {
        order: ${order};
      }
    `
    this.notifications.setAttribute('hostname', Array.from(this.data?.urls || [])?.[0]?.[1].url.hostname || '')
    if (data.status.includes('connected')) {
      this.setAttribute('connected', '')
      this.iconStatesEl.setAttribute('state', 'connected')
    } else {
      this.removeAttribute('connected')
      this.iconStatesEl.setAttribute('state', 'disconnected')
    }
    this.removeAttribute('updating')
    this.iconStatesEl.removeAttribute('updating')
    // avoid updating when inputs got changed
    if (this.hasAttribute('touched')) return
    let keepAlive = this.keepAliveDefaultValue
    Array.from(data.urls).forEach(([origin, urlContainer], i) => {
      const selected = urlContainer.status.includes('connected') || urlContainer.status.includes('disconnected')
      Provider.updateSelect(this.selectName, urlContainer.name || 'websocket', selected)
      this.selectName.setAttribute('value', this.selectName.value)
      Provider.updateSelect(this.selectProtocol, urlContainer.url.protocol, selected)
      this.selectProtocol.setAttribute('value', this.selectProtocol.value)
      if (i === 0) {
        this.titleEl.textContent = urlContainer.url.hostname
        this.spanHostname.textContent = urlContainer.url.hostname
        this.spanPort.textContent = urlContainer.url.port
      }
      let currentKeepAlive
      if ((i === 0 || selected) && (currentKeepAlive = Number(urlContainer.url.searchParams.get('keep-alive')))) keepAlive = currentKeepAlive
    })
    this.inputKeepAliveChangeEventListener({ target: { value: (this.inputKeepAlive.value = keepAlive) } }, true)
  }

  static updateSelect (select, value, selected) {
    let option
    if (!(option = select.querySelector(`option[value="${value}"]`))) {
      option = document.createElement('option')
      option.value = option.textContent = value
      select.appendChild(option)
    }
    option.selected = selected
  }

  get iconStatesEl () {
    return this.root.querySelector('a-icon-states')
  }

  get titleEl () {
    return this.root.querySelector('h2')
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

  get spanPort () {
    return this.root.querySelector('span[id=port]')
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
}
