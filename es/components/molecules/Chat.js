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
      if (firstRender || this.ul.innerHTML === '') {
        this.ul.innerHTML = '';
        funcName = 'getAll'
        firstRender = false
      }
      // render out new messages
      if (funcName === 'getAll' || event.detail.added > 0) {
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
            const timestamp = `t_${textObj.timestamp}`
            const div = document.createElement('div')
            div.innerHTML = /* html */`
              <m-load-template-tag timestamp="${timestamp}" mode=false no-css>
                <template>
                  <chat-m-message timestamp="${timestamp}"${textObj.isSelf ? ' self' : ''}${(wasLastMessage = textObjs.length === i + 1) ? ' was-last-message' : ''}${isUlEmpty ? ' first-render' : ''}>
                    <template>${JSON.stringify(textObj)}</template>
                  </chat-m-message>
                </template>
              </m-load-template-tag>
            `
            this.ul.appendChild(div.children[0])
            // scroll behavior
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
                  let scrollEl = null
                  if (room?.scrollEl && (scrollEl = this.ul.querySelector(`[timestamp=${room.scrollEl}]`))) {
                    scrollEl.scrollIntoView({behavior: 'instant'})
                    setTimeout(() => scrollEl.scrollIntoView({behavior: 'smooth'}), 200)
                  } else {
                    // backwards compatible behavior and if no scrollTop scrolls to bottom
                    this.dispatchEvent(new CustomEvent('main-scroll', {
                      detail: {
                        behavior: 'instant',
                        y: room?.scrollTop
                      },
                      bubbles: true,
                      cancelable: true,
                      composed: true
                    }))
                    setTimeout(() => this.dispatchEvent(new CustomEvent('main-scroll', {
                      detail: {
                        behavior: 'smooth',
                        y: room?.scrollTop
                      },
                      bubbles: true,
                      cancelable: true,
                      composed: true
                    })), 200)
                  }
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
                  this.ul.lastChild.scrollIntoView({behavior: 'instant'})
                  setTimeout(() => this.ul.lastChild.scrollIntoView({behavior: 'smooth'}), 200)
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
      // delete messages
      if (event.detail.deleted > 0) {
        (await event.detail.getDeleted()).forEach(textObj => {
          const selector = `[timestamp="t_${textObj.timestamp}"]`
          let messageWrappers, messageWrapper
          if ((messageWrappers = Array.from(this.ul.querySelectorAll(selector))) && (messageWrapper = messageWrappers.find(messageWrapper => messageWrapper.querySelector('chat-m-message')?.textObj?.uid === textObj.uid))) {
            messageWrapper.remove()
          } else {
            console.warn('could not find corresponding node marked for deletion:', {selector, textObj})
          }
        })
      }
    }

    let timeout = null
    this.messageIntersectionEventListener = event => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        // avoid saving scrollEl on first time intersection of message after connect, since the initial event does not grab the most top message
        if (this.firstTimeIntersectionSinceConnected) {
          this.firstTimeIntersectionSinceConnected = false
        } else {
          this.dispatchEvent(new CustomEvent('merge-active-room', {
            detail: event.detail,
            bubbles: true,
            cancelable: true,
            composed: true
          }))
        }
      }, 200)
    }
  }

  connectedCallback () {
    this.firstTimeIntersectionSinceConnected = true
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
      }))).then(room => {
        let scrollEl = null
        if (room?.scrollEl && (scrollEl = this.ul.querySelector(`[timestamp=${room.scrollEl}]`))) {
          scrollEl.scrollIntoView({behavior: 'instant'})
        } else {
          this.dispatchEvent(new CustomEvent('main-scroll', {
            detail: {
              behavior: 'instant',
              y: room?.scrollTop
            },
            bubbles: true,
            cancelable: true,
            composed: true
          }))
        }
      })
    }
    this.globalEventTarget.addEventListener('yjs-chat-update', this.eventListener)
    this.addEventListener('message-intersection', this.messageIntersectionEventListener)
  }

  disconnectedCallback () {
    this.globalEventTarget.removeEventListener('yjs-chat-update', this.eventListener)
    this.removeEventListener('message-intersection', this.messageIntersectionEventListener)
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
