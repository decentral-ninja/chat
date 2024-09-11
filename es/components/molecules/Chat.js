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
          textObjs.sort((a, b) => a.timestamp - b.timestamp).forEach(async (textObj, i, textObjs) => {
            const timestamp = `t_${textObj.timestamp}`
            const div = document.createElement('div')
            let replyToTemplate = ''
            let replyToTextObj
            if (textObj.replyTo && (replyToTextObj = (await event.detail.getAll()).find(searchTextObj => (searchTextObj.timestamp === textObj.replyTo.timestamp && searchTextObj.uid === textObj.replyTo.uid)))) replyToTemplate = /* html */`<template id="reply-to">${JSON.stringify(replyToTextObj)}</template>`
            div.innerHTML = /* html */`
              <m-load-template-tag timestamp="${timestamp}" mode=false no-css>
                <template>
                  <chat-m-message timestamp="${timestamp}"${textObj.isSelf ? ' self' : ''}${(wasLastMessage = textObjs.length === i + 1) ? ' was-last-message' : ''}${isUlEmpty ? ' first-render' : ''}>
                    <template>${JSON.stringify(textObj)}</template>
                    ${replyToTemplate
                      ? replyToTemplate
                      : textObj.replyTo
                        ? /* html */`<template id="reply-to">${JSON.stringify({text: 'Message got deleted!', deleted: true})}</template>`
                        : ''
                    }
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
                    this.scrollIntoView(scrollEl)
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
                  if (textObj.isSelf || this.ul.lastChild.querySelector('chat-m-message[intersecting]')) {
                    this.scrollIntoView(this.ul.lastChild, true)
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
          const selector = `[timestamp="t_${textObj.timestamp}"]`
          let messageWrappers, messageWrapper
          if ((messageWrappers = Array.from(this.ul.querySelectorAll(selector))) && (messageWrapper = messageWrappers.find(messageWrapper => messageWrapper.querySelector('chat-m-message')?.textObj?.uid === textObj.uid))) {
            messageWrapper.addEventListener('animationend', event => messageWrapper.remove(), {once: true})
            messageWrapper.classList.add('deleted')
            messageWrapper.querySelector('chat-m-message')?.setAttribute('deleted', '')
            this.dispatchEvent(new CustomEvent('chat-remove', {
              detail: {
                textObj
              },
              bubbles: true,
              cancelable: true,
              composed: true
            }))
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

    this.chatScrollEventListener = event => {
      let scrollEl = null
      if (event?.detail?.scrollEl && (scrollEl = this.ul.querySelector(`[timestamp=${event.detail.scrollEl}]`))) this.scrollIntoView(scrollEl, true)
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
          this.scrollIntoView(scrollEl)
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
      :host > ul {
        display: flex;
        flex-direction: column;
        margin: 0;
        padding: 0;          
      }
      :host > ul > m-load-template-tag {
        min-height: 6em;
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

  scrollIntoView (scrollEl, smooth = false) {
    if (smooth) {
      scrollEl.scrollIntoView({behavior: 'smooth'})
    } else {
      scrollEl.scrollIntoView({behavior: 'instant'})
      scrollEl.scrollIntoView({behavior: 'smooth'})
    }
    setTimeout(() => scrollEl.scrollIntoView({behavior: 'smooth'}), 200)
    setTimeout(() => scrollEl.scrollIntoView({behavior: 'smooth'}), 400)
  }

  get ul () {
    return this.root.querySelector('ul')
  }

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }
}
