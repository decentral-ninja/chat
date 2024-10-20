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
              name: 'wct-load-template-tag'
            }/*,
            {
              path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/organisms/intersectionScrollEffect/IntersectionScrollEffect.js`,
              name: 'wct-intersection-scroll-effect'
            }*/
          ]),
          event.detail[funcName]()
        ]).then(([[{constructorClass}], textObjs]) => {
          const isUlEmpty = !this.ul.children.length
          let wasLastMessage = false
          // Attention: NO async here when appending to the dom!
          textObjs.sort((a, b) => a.timestamp - b.timestamp).forEach((textObj, i, textObjs) => {
            wasLastMessage = textObjs.length === i + 1
            const div = document.createElement('div')
            div.innerHTML = this.getMessageHTML(textObj, `t_${textObj.timestamp}`, wasLastMessage, isUlEmpty)
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
                  if (room?.scrollEl && this.ulGetScrollElFunc(room.scrollEl)()) {
                    this.scrollIntoView(this.ulGetScrollElFunc(room.scrollEl))
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
                // wait for intersection to happen before we can decide to scroll or not
                setTimeout(() => {
                  if (textObj.isSelf || this.ul.lastElementChild.matches('chat-m-message[intersecting]')) {
                    this.scrollIntoView(() => this.ul.lastElementChild, true)
                  } else {
                    this.dispatchEvent(new CustomEvent('scroll-icon-show-event', {
                      bubbles: true,
                      cancelable: true,
                      composed: true
                    }))
                  }
                }, 200)
              }
            } 
          })
        })
      }
      // delete messages
      if (event.detail.deleted > 0) {
        (await event.detail.getDeleted()).forEach(textObj => {
          let message
          if ((message = this.ulGetMessageFunc(textObj))) {
            message.addEventListener('animationend', event => message.remove(), {once: true})
            message.classList.add('deleted')
            message.querySelector('chat-m-message')?.setAttribute('deleted', '')
            this.dispatchEvent(new CustomEvent(`chat-remove-${textObj.timestamp || ''}`, {
              detail: {
                textObj
              },
              bubbles: true,
              cancelable: true,
              composed: true
            }))
          } else {
            console.warn('could not find corresponding node marked for deletion:', textObj)
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
      }, 1000)
    }

    this.chatScrollEventListener = event => {
      if (event?.detail?.scrollEl && this.ulGetScrollElFunc(event.detail.scrollEl)()) this.scrollIntoView(this.ulGetScrollElFunc(event.detail.scrollEl), true)
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
        if (room?.scrollEl && this.ulGetScrollElFunc(room.scrollEl)()) {
          this.scrollIntoView(this.ulGetScrollElFunc(room.scrollEl))
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
    this.globalEventTarget.addEventListener('chat-scroll', this.chatScrollEventListener)
    this.globalEventTarget.addEventListener('yjs-chat-update', this.eventListener)
    this.addEventListener('message-intersection', this.messageIntersectionEventListener)
  }

  disconnectedCallback () {
    this.globalEventTarget.removeEventListener('chat-scroll', this.chatScrollEventListener)
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
      :host {
        --chat-m-message-min-height: 5em;
      }
      :host > ul {
        display: flex;
        flex-direction: column;
        margin: 0;
        padding: 0;          
      }
      :host > ul > wct-load-template-tag {
        min-height: var(--chat-m-message-min-height);
      }
      :host > ul > .deleted {
        animation: delete 3s ease-out;
        overflow: hidden;
        min-height: 0;
      }
      @keyframes delete {
        0% {
          height: 6em;
        }
        100% {
          height: 0;
          opacity: 0;
        }
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

  getMessageHTML (textObj, timestamp, wasLastMessage, isUlEmpty) {
    // this molecules/chat updates by, modified and delete, the elements in the ul and needs timestamp and uid to pinpoint the target. This is done due to lazy loading support.
    // was not looking very nice, but tried some parallax stuff: <wct-intersection-scroll-effect css-property=filter effect="sepia" max-value="100%" scroll-el-query="main" offset="-50">...message...</wct-intersection-scroll-effect>
    return /* html */`
      <wct-load-template-tag timestamp="${timestamp}" uid='${textObj.uid}' mode=false no-css>
        <template>
          <chat-m-message update-on-connected-callback timestamp="${timestamp}" uid='${textObj.uid}'${textObj.isSelf ? ' self' : ''}${wasLastMessage ? ' was-last-message' : ''}${isUlEmpty ? ' first-render' : ''} show-reply-to>
            <template>${JSON.stringify(textObj)}</template>
          </chat-m-message>
        </template>
      </wct-load-template-tag>
    `
  }

  /**
   * Query Select for attribute timestamp on ul
   * This element has to be requested by scrollIntoView at timeout in realtime, since the wct-load-template-tag unpacks the template and replaces all with it's content
   * 
   * @param {string} timestamp
   * @return {()=>null | HTMLElement | HTMLCollection | any}
   */
  ulGetScrollElFunc (timestamp, funcName = 'querySelector') {
    return () => this.ul[funcName](`[timestamp="${String(timestamp).includes('t_') ? '' : 't_'}${timestamp}"]`)
  }

  ulGetMessageFunc (textObj) {
    let messages, message
    if ((messages = Array.from(this.ulGetScrollElFunc(textObj.timestamp, 'querySelectorAll')())) && (message = messages.find(message => message.getAttribute('uid') === textObj.uid))) return message
    return null
  }

  scrollIntoView (getScrollElFunc, smooth = false, counter = 0) {
    counter ++
    const scrollEl = getScrollElFunc()
    if (!scrollEl) return
    scrollEl.scrollIntoView({behavior: smooth ? 'smooth' : 'instant'})
    setTimeout(() => {
      const scrollEl = getScrollElFunc()
      if (!scrollEl) return
      if (scrollEl.matches(':not([intersecting])')) {
        this.scrollIntoView(getScrollElFunc, counter > 2 ? false : smooth, counter)
      } else {
        scrollEl.scrollIntoView({behavior: 'smooth'})
      }
    }, 200)
  }

  get ul () {
    return this.root.querySelector('ul')
  }

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }
}
