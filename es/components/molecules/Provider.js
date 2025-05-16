// @ts-check
import { Shadow } from '../../../../web-components-toolbox/src/es/components/prototypes/Shadow.js'

/**
* @export
* @class Provider
* @type {CustomElementConstructor}
*/
export default class Provider extends Shadow() {
  constructor (id, name, data, options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, ...options }, ...args)

    this.setAttribute('id', id)
    this.name = name
    /** @type {import('./Providers.js').Provider} */
    this.data = data
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
    this.html = /* html */`
      <section>
        <input type=checkbox />
        <select id=protocol></select>
      </section>
    `
    this.update(this.data, this.providersUrls)
  }

  /**
   * Update components
   * @param {import('./Providers.js').Provider} data
   * @param {import('../../../../event-driven-web-components-yjs/src/es/EventDrivenYjs.js').ProvidersUpdateEventDetail} providersUrls
   * @returns {void}
   */
  update (data, providersUrls) {
    this.data = data
    console.log('*****data****', data, this, providersUrls)
    this.checkbox.checked = data.status.includes('connected')
    Array.from(data.urls).forEach(([origin, urlContainer]) => {
      let option
      if (!(option = this.selectProtocol.querySelector(`option[value="${urlContainer.url.protocol}"]`))) {
        option = document.createElement('option')
        option.value = option.textContent = urlContainer.url.protocol
        this.selectProtocol.appendChild(option)
      }
      option.selected = urlContainer.status.includes('connected') || urlContainer.status.includes('disconnected')
    })
  }

  get section () {
    return this.root.querySelector('section')
  }

  get checkbox () {
    return this.root.querySelector('input[type=checkbox]')
  }

  get selectProtocol () {
    return this.root.querySelector('select[id=protocol]')
  }
}
