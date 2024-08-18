// @ts-check
import { Shadow } from '../../../../event-driven-web-components-prototypes/src/Shadow.js'

/**
 * The chat view
 * TODO: forward multiple messages
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
          },
          {
            path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/molecules/loadTemplateTag/LoadTemplateTag.js`,
            name: 'm-load-template-tag'
          }
        ]),
        event.detail[funcName]()
      ]).then(([[{constructorClass}], textObjs]) => {
        const isUlEmpty = !this.ul.children.length
        let wasLastMessage = false
        textObjs.sort((a, b) => a.timestamp - b.timestamp).forEach((textObj, i, textObjs) => {
          const div = document.createElement('div')
          div.innerHTML = /* html */`
            <m-load-template-tag mode=false>
              <template>
                <chat-m-message text-obj='${JSON.stringify(textObj)}'${textObj.isSelf ? ' self' : ''}${(wasLastMessage = textObjs.length === i + 1) ? ' was-last-message' : ''}${isUlEmpty ? ' first-render' : ''}></chat-m-message>
              </template>
            </m-load-template-tag>
          `
          this.ul.appendChild(div.children[0])
          if (wasLastMessage) {
            // firstRender
            if (isUlEmpty) {
              // scroll to the last memorized scroll pos
              new Promise(resolve => this.dispatchEvent(new CustomEvent('storage-get-active-room', {
                detail: {
                  resolve
                },
                bubbles: true,
                cancelable: true,
                composed: true
              }))).then(room => {
                this.dispatchEvent(new CustomEvent('main-scroll', {
                  detail: {
                    behavior: 'instant',
                    y: room.scrollTop
                  },
                  bubbles: true,
                  cancelable: true,
                  composed: true
                }))
                setTimeout(() => this.dispatchEvent(new CustomEvent('main-scroll', {
                  detail: {
                    behavior: 'smooth',
                    y: room.scrollTop
                  },
                  bubbles: true,
                  cancelable: true,
                  composed: true
                })), 200)
              })
              if (!textObj.isSelf) {
                this.dispatchEvent(new CustomEvent('scroll-icon-show-event', {
                  bubbles: true,
                  cancelable: true,
                  composed: true
                }))
              }
            } else {
              if (textObj.isSelf) {
                this.ul.lastChild.scrollIntoView()
                setTimeout(() => this.ul.lastChild.scrollIntoView(), 200)
              }else {
                this.dispatchEvent(new CustomEvent('scroll-icon-show-event', {
                  bubbles: true,
                  cancelable: true,
                  composed: true
                }))
              }
            }
          } 
        })
      })
    }
  }

  connectedCallback () {
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) {
      this.renderHTML()
    } else {
      // on new render the event listener is going to scroll, the below is executed on room change
      new Promise(resolve => this.dispatchEvent(new CustomEvent('storage-get-active-room', {
        detail: {
          resolve
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))).then(room => this.dispatchEvent(new CustomEvent('main-scroll', {
        detail: {
          behavior: 'instant',
          y: room.scrollTop
        },
        bubbles: true,
        cancelable: true,
        composed: true
      })))
    }
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
        display: flex;
        flex-direction: column;
        margin: 0;
        padding: 0;          
      }
      :host > ul > m-load-template-tag {
        min-height: 6em;
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
