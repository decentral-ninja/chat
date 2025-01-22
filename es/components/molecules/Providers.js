// @ts-check
import { Shadow } from '../../../../event-driven-web-components-prototypes/src/Shadow.js'

/* global self */
/* global Environment */

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

    // TODO: only consume user data when needed eg. dialog is open
    let timeoutId = null
    this.providersEventListener = event => {
      if (!event.detail.getData) return
      clearTimeout(timeoutId)
      timeoutId = setTimeout(async () => console.log('providers', {
        data: await event.detail.getData(),
        sessionProvidersByStatus: await (await event.detail.getData()).getSessionProvidersByStatus(),
        ...event.detail
        // @ts-ignore
      }), self.Environment.awarenessEventListenerDelay)
    }
  }

  connectedCallback () {
    // if (this.shouldRenderCSS()) this.renderCSS()
    // if (this.shouldRenderHTML()) this.renderHTML()
    this.globalEventTarget.addEventListener('yjs-providers', this.providersEventListener)
  }

  disconnectedCallback () {
    this.globalEventTarget.removeEventListener('yjs-providers', this.providersEventListener)
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
    return !this.root.querySelector('span')
  }

  /**
   * Renders the CSS
   *
   * @return {void}
   */
  renderCSS () {
    this.css = /* css */`
      
    `
  }

  /**
  * renders the html
  *
  * @return {void}
  */
  renderHTML () {
    this.html = /* html */`
      
    `
  }

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }
}
