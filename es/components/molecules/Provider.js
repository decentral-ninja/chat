// @ts-check
import { Shadow } from '../../../../web-components-toolbox/src/es/components/prototypes/Shadow.js'

/**
* @export
* @class Provider
* @type {CustomElementConstructor}
*/
export default class Provider extends Shadow() {
  constructor (id, name, data, order, options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, ...options }, ...args)

    this.setAttribute('id', id)
    this.name = name
    /** @type {import('./Providers.js').Provider} */
    this.data = data
    this.order = order
  }

  connectedCallback () {
    this.hidden = true
    const showPromises = []
    if (this.shouldRenderCSS()) showPromises.push(this.renderCSS())
    if (this.shouldRenderHTML()) showPromises.push(this.renderHTML())
    Promise.all(showPromises).then(() => (this.hidden = false))
  }

  disconnectedCallback () {}

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
      :host section {
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
    // keep-alive max=30days, value=1day, step=1h
    this.html = /* html */`
      <section>
        <input type=checkbox />
        <select id=name></select>
        <select id=protocol></select>
        <span>//</span>
        <span id=hostname></span>
        <input id=keep-alive type=range min=0 max=2592000000 value="86400000" step=3600000 />
      </section>
    `
    this.html = this.customStyle
    this.update(this.data, this.order)
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
    console.log('*****data****', data, this)
    this.checkbox.checked = data.status.includes('connected')
    Array.from(data.urls).forEach(([origin, urlContainer], i) => {
      const selected = urlContainer.status.includes('connected') || urlContainer.status.includes('disconnected')
      Provider.updateSelect(this.selectName, urlContainer.name || 'websocket', selected)
      Provider.updateSelect(this.selectProtocol, urlContainer.url.protocol, selected)
      if (i === 0) this.spanHostname.textContent = urlContainer.url.hostname
      if (urlContainer.url.searchParams.get('keep-alive')) {
        // TODO: keep-alive
      }
    })
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

  get checkbox () {
    return this.root.querySelector('input[type=checkbox]')
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
