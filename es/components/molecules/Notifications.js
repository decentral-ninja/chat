// @ts-check
import { Shadow } from '../../../../event-driven-web-components-prototypes/src/Shadow.js'

/**
 * The notifications view
 * TODO: the controller is the MasterService worker... write a Notification queue in the SW and consume it here, to allow to switch to the rooms according the notifications
 *
 * @export
 * @class Providers
 */
export default class Notifications extends Shadow() {
  constructor (options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, ...options }, ...args)
  }

  connectedCallback () {
    // if (this.shouldRenderCSS()) this.renderCSS()
    // if (this.shouldRenderHTML()) this.renderHTML()
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
}
