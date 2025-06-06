// @ts-check
import { Shadow } from '../../../../web-components-toolbox/src/es/components/prototypes/Shadow.js'

/**
* @export
* @class Provider
* @type {CustomElementConstructor}
*/
export default class Provider extends Shadow() {
  constructor (id, name, data, order, roomName, options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, ...options }, ...args)

    this.setAttribute('id', id)
    this.name = name
    /** @type {import('./Providers.js').Provider} */
    this.data = data
    this.order = order
    this.roomName = roomName

    this.keepAliveDefaultValue = 86400000

    const changeEventListener = event => this.setAttribute('touched', '')
    let msCounter, daysCounter
    this.inputKeepAliveChangeEventListener = (event, initialValue = false) => {
      this.spanKeepAliveCounter.textContent = `${event.target.value} (delete data on websocket after: ${msCounter = event.target.value/1000/60/60} hours ≈ ${daysCounter = (msCounter/24).toFixed(1)} day${Number(daysCounter) >= 2 ? 's' : ''})`
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
      this.setAttribute('connecting', '')
      console.log('*********', 'connectEventListener')
    }
    this.disconnectEventListener = event => {
      event.stopPropagation()
      this.removeAttribute('touched')
      this.setAttribute('disconnecting', '')
      console.log('*********', 'connectEventListener')
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
      }
      :host > section {
        display: flex;
        align-items: center;
        gap: 0.25em;
        justify-content: space-between;
        border: var(--wct-input-border, 1px solid black);
        border-radius: var(--border-radius);
        --button-primary-border-radius: 0 var(--border-radius) var(--border-radius) 0;
      }
      :host > section > select {
        height: 2em;
        font-size: 1em;
      }
      :host > section > select ~ :where(#keep-alive-counter, #keep-alive, #keep-alive-name) {
        display: none;
      }
      :host > section > select#name[value=websocket] ~ :where(#keep-alive-counter, #keep-alive, #keep-alive-name) {
        display: block;
      }
      :host > section :where(wct-icon-mdx, wct-button) {
        display: none;
      }
      :host([connected]) > section > div#connection-status > wct-icon-mdx#connected, :host(:not([connected])) > section > div#connection-status > wct-icon-mdx#disconnected {
        display: contents;
      }
      :host([connected]) > section > div#connection-status > wct-icon-mdx#connected {
        --color: var(--color-green-full);
      }
      :host(:not([connected])) > section > div#connection-status > wct-icon-mdx#disconnected {
        --color: var(--color-secondary);
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
      :host > section > div#connection-status {
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: 1fr;
        align-content: center;
        justify-content: center;
      }
      :host > section > div#connection-status > *, :host > section > div#connection-status > wct-icon-mdx::part(svg) {
        grid-column: 1;
        grid-row: 1;
      }
      :host > section > div#connection-status > wct-icon-mdx::part(svg) {
        align-self: center;
        justify-self: center;
      }
      :host > section > div#connection-status > a-loading {
        display: none;
      }
      :host([connecting]) > section > div#connection-status > :is(wct-icon-mdx#connected, wct-icon-mdx#disconnected), :host([disconnecting]) > section > div#connection-status > :is(wct-icon-mdx#connected, wct-icon-mdx#disconnected) {
        --color: var(--color-disabled);
      }
      :host([connecting]) > section > div#connection-status > a-loading, :host([disconnecting]) > section > div#connection-status > a-loading {
        display: flex;
      }
      @media only screen and (max-width: _max-width_) {
        :host {}
      }
    `
    return this.fetchTemplate()
  }

  /**
   * fetches the template
   */
  fetchTemplate () {
    /** @type {import("../../../../web-components-toolbox/src/es/components/prototypes/Shadow.js").fetchCSSParams[]} */
    const styles = [
      {
        path: `${this.importMetaUrl}../../../../css/reset.css`, // no variables for this reason no namespace
        namespace: false
      },
      {
        path: `${this.importMetaUrl}../../../../css/style.css`, // apply namespace and fallback to allow overwriting on deeper level
        namespaceFallback: true
      }
    ]
    switch (this.getAttribute('namespace')) {
      case 'provider-default-':
        return this.fetchCSS([{
          path: `${this.importMetaUrl}./default-/default-.css`, // apply namespace since it is specific and no fallback
          namespace: false
        }, ...styles], false) // using showPromises @connectedCallback makes hide action inside Shadow.fetchCSS obsolete, so second argument hide = false
      default:
        return //this.fetchCSS(styles)
    }
  }

  /**
   * Render HTML
   * @returns Promise<void>
   */
  renderHTML () {
    // TODO: Event when it has fallbacks, so that other providers can react and know that they are a fallback for...
    // TODO: Intersection observer for calling data.getWebsocketInfo & data.pingProvider
    // TODO: Add notification
    // keep-alive max=10days, value=1day, step=1h
    this.html = /* html */`
      <section>
        <div id=connection-status>
          <wct-icon-mdx hover-on-parent-shadow-root-host id=connected title=connected no-hover icon-url="../../../../../../img/icons/plug-connected.svg" size="2em"></wct-icon-mdx>
          <wct-icon-mdx hover-on-parent-shadow-root-host id=disconnected title=disconnected no-hover icon-url="../../../../../../img/icons/plug-connected-x.svg" size="2em"></wct-icon-mdx>
          <a-loading namespace="loading-default-" size="1.5"></a-loading>
        </div>
        <chat-m-notifications room="${this.roomName}" hostname="${Array.from(this.data?.urls || [])?.[0]?.[1].url.hostname || ''}" on-connected-request-notifications allow-mute no-click no-hover no-scroll></chat-m-notifications>
        <select id=name></select>
        <select id=protocol></select>
        <span>//</span>
        <span id=hostname></span>
        <span id=keep-alive-name>?keep-alive=</span>
        <span id=keep-alive-counter></span>
        <input id=keep-alive type=range min=0 max=864000000 value="${this.keepAliveDefaultValue}" step=3600000 />
        <wct-button id=connect namespace="button-primary-" request-event-name="connect" click-no-toggle-active>connect</wct-button>
        <wct-button id=set-and-connect namespace="button-primary-" request-event-name="connect" click-no-toggle-active>set changes & connect</wct-button>
        <wct-button id=set namespace="button-primary-" request-event-name="connect" click-no-toggle-active>set changes</wct-button>
        <wct-button id=undo namespace="button-primary-" request-event-name="undo" click-no-toggle-active>undo</wct-button>
        <wct-button id=disconnect namespace="button-primary-" request-event-name="disconnect" click-no-toggle-active>disconnect</wct-button>
      </section>
    `
    this.html = this.customStyle
    this.inputKeepAliveChangeEventListener({target: {value: this.inputKeepAlive.value}}, true)
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
        path: `${this.importMetaUrl}../../../../components/atoms/loading/Loading.js?${Environment?.version || ''}`,
        name: 'a-loading'
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
    // TODO: on change input make component touched and stop updating until user confirmed the value
    // TODO: Link to users dialog vice-versa
    // TODO: Link to docker hub and github y-websocket repo
    if (data.status.includes('connected')) {
      this.setAttribute('connected', '')
    } else  {
      this.removeAttribute('connected')
    }
    this.removeAttribute('connecting')
    this.removeAttribute('disconnecting')
    // avoid updating when inputs got changed
    if (this.hasAttribute('touched')) return
    let keepAlive = this.keepAliveDefaultValue
    Array.from(data.urls).forEach(([origin, urlContainer], i) => {
      const selected = urlContainer.status.includes('connected') || urlContainer.status.includes('disconnected')
      Provider.updateSelect(this.selectName, urlContainer.name || 'websocket', selected)
      this.selectName.setAttribute('value', this.selectName.value)
      Provider.updateSelect(this.selectProtocol, urlContainer.url.protocol, selected)
      if (i === 0) this.spanHostname.textContent = urlContainer.url.hostname
      let currentKeepAlive
      if ((i === 0 || selected) && (currentKeepAlive = Number(urlContainer.url.searchParams.get('keep-alive')))) keepAlive = currentKeepAlive
    })
    this.inputKeepAliveChangeEventListener({target: {value: (this.inputKeepAlive.value = keepAlive)}}, true)
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

  get spanKeepAliveCounter () {
    return this.root.querySelector('span[id=keep-alive-counter]')
  }

  get inputKeepAlive () {
    return this.root.querySelector('input[id=keep-alive]')
  }

  get notifications () {
    return this.root.querySelector('chat-m-notifications')
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
