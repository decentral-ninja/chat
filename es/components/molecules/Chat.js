// @ts-check
import { Shadow } from '../../../../event-driven-web-components-prototypes/src/Shadow.js'

/**
 * The chat view
 * TODO: cleanup the whole eventListener and make the chat message list creation simpler, more efficient and do not always destroy all the innerHTML
 *
 * @export
 * @class Providers
 */
export default class Chat extends Shadow() {
  constructor (options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, ...options }, ...args)

    let firstRender = true
    // chat update
    this.eventListener = async event => {
      // https://docs.yjs.dev/api/y.event
      let funcName = 'getAdded'
      if (firstRender) {
        this.ul.innerHTML = '';
        funcName = 'getAll'
        firstRender = false
      }
      Promise.all([
        this.fetchModules([
          {
            // @ts-ignore
            path: `${this.importMetaUrl}../../components/molecules/message/Message.js?${Environment?.version || ''}`,
            name: 'chat-m-message'
          }
        ]),
        event.detail[funcName]()
      ]).then(([[{constructorClass}], textObjs]) => {
        const isUlEmpty = !this.ul.children.length
        textObjs.sort((a, b) => a.timestamp - b.timestamp).forEach((textObj, i, textObjs) => {
          const message = new constructorClass(textObj)
          if (textObj.isSelf) message.setAttribute('self', '')
          if (textObjs.length === i + 1) message.setAttribute('was-last-message', '')
          if (isUlEmpty) message.setAttribute('first-render', '')
          this.ul.appendChild(message)
        })
      })
    }
  }

  connectedCallback () {
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
    this.globalEventTarget.addEventListener('yjs-chat-update', this.eventListener)
  }

  disconnectedCallback () {
    this.globalEventTarget.removeEventListener('yjs-chat-update', this.eventListener)
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
    return !this.ul
  }

  /**
   * Renders the CSS
   *
   * @return {void}
   */
  renderCSS () {
    this.css = /* css */`
      :host > ul {
        margin: 0;
        padding: 0;          
      }
    `
  }

  /**
  * renders the html
  *
  * @return {void}
  */
  renderHTML () {
    this.html = /* html */`
      <ul>
        <li>loading...</li>
      </ul>
    `
  }

  get ul () {
    return this.root.querySelector('ul')
  }

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }
}
