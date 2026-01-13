// @ts-check
import { Shadow } from '../../../../event-driven-web-components-prototypes/src/Shadow.js'
import { scrollElIntoView } from '../../../../event-driven-web-components-prototypes/src/helpers/Helpers.js'

/* global Environment */
/* global self */
/* global location */
/* global history */

/**
 * The chat view
 * TODO: forward multiple messages
 *
 * @export
 * @class Providers
 */
export default class Chat extends Shadow() {
  constructor (options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, tabindex: 'no-tabindex', ...options }, ...args)

    this.removeEmptySectionTimeout = 300
    let removeEmptySectionTimeoutId = null
    let firstRender = true
    // chat update
    this.chatUpdateEventListener = async event => {
      // https://docs.yjs.dev/api/y.event
      // NOTE: Previous version would distinguish between getAdded and getAll but getAdded was not reliable, for that reason we always getAll
      if (firstRender || this.ul.innerHTML === '') {
        this.ul.innerHTML = ''
        firstRender = false
      }
      // render out new messages
      Promise.all([
        this.fetchModules([
          {
            // @ts-ignore
            path: `${this.importMetaUrl}../../components/molecules/message/Message.js?${Environment?.version || ''}`,
            name: 'chat-m-message'
          },
          {
            // @ts-ignore
            path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/molecules/loadTemplateTag/LoadTemplateTag.js?${Environment?.version || ''}`,
            name: 'wct-load-template-tag'
          }
        ]),
        event.detail.getAll()
      ]).then(([[{ constructorClass }], textObjs]) => {
        const isUlEmpty = !this.ul.children.length
        let wasLastMessage = false
        // no messages and show ninja
        if (this.sectionEmpty) {
          if (textObjs.length) {
            this.sectionEmpty.classList.add('hidden')
            clearTimeout(removeEmptySectionTimeoutId)
            removeEmptySectionTimeoutId = setTimeout(() => this.sectionEmpty.remove(), this.removeEmptySectionTimeout)
          } else {
            this.sectionEmpty.classList.remove('hidden')
          }
        }
        // Attention: NO async here when appending to the dom!
        textObjs.sort((a, b) => a.timestamp - b.timestamp).forEach((textObj, i, textObjs) => {
          // @ts-ignore
          const timestamp = `${self.Environment?.timestampNamespace || 't_'}${textObj.timestamp}`
          wasLastMessage = textObjs.length === i + 1
          // if timestamp does not exist... assuming that messages timestamp with user uid are unique and we want to avoid double messages.
          if (!this.ul.querySelector(`[timestamp="${timestamp}"][uid='${textObj.uid}']`)) {
            const div = document.createElement('div')
            div.innerHTML = this.getMessageHTML(textObj, timestamp, wasLastMessage, isUlEmpty)
            if (isUlEmpty) {
              this.ul.appendChild(div.children[0])
            } else {
              let prevSibling
              // @ts-ignore
              if (Array.from(this.ul.children).reverse().some(child => Number((prevSibling = child).getAttribute('timestamp')?.replace(self.Environment?.timestampNamespace || 't_', '')) < textObj.timestamp)) {
                // @ts-ignore
                prevSibling.after(div.children[0])
              } else {
                this.ul.prepend(div.children[0])
              }
            }
            // update awareness timestamp when message is written
            if (!isUlEmpty && wasLastMessage) {
              this.dispatchEvent(new CustomEvent('yjs-update-awareness-epoch', {
                bubbles: true,
                cancelable: true,
                composed: true
              }))
            }
          }
          // scroll behavior
          if (wasLastMessage) {
            // firstRender
            if (isUlEmpty) {
              // scroll to the last memorized scroll pos
              this.scrollLastMemorizedIntoView()
              if (!textObj.isSelf) {
                this.dispatchEvent(new CustomEvent('scroll-icon-show-event', {
                  bubbles: true,
                  cancelable: true,
                  composed: true
                }))
              }
              // don't save message locations after render some time, since all messages intersect and we may receive some message not on top
              setTimeout(() => this.addEventListener('message-intersection', this.messageIntersectionEventListener), 1000)
            } else {
              // wait for intersection to happen before we can decide to scroll or not
              setTimeout(() => {
                if (textObj.isSelf || this.ul.lastElementChild.matches('chat-m-message[intersecting]')) {
                  scrollElIntoView(() => this.ul.lastElementChild, ':not([intersecting])')
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
      // delete messages
      if (event.detail.deleted > 0) {
        (await event.detail.getDeleted()).forEach(textObj => {
          let message
          if ((message = this.ulGetMessageFunc(textObj))) {
            message.addEventListener('animationend', event => message.remove(), { once: true })
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

    const topBorder = Chat.walksUpDomQueryMatches(this, 'main').getBoundingClientRect().top
    let timeout = null
    this.messageIntersectionEventListener = event => {
      // messages intersecting with the upper half resp. top of the screen
      if (event.detail.entry.boundingClientRect.top < self.innerHeight / 2) {
        clearTimeout(timeout)
        timeout = setTimeout(async () => {
          let ulChildrenArr = []
          // avoid saving scrollEl on first time intersection of message after connect, since the initial event does not grab the most top message
          if ((ulChildrenArr = Array.from(this.ul.children)) && (ulChildrenArr = ulChildrenArr.splice(ulChildrenArr.indexOf(event.detail.target)))) {
            const scrollEl = this.ul.lastElementChild.hasAttribute('intersecting')
              ? this.ul.lastElementChild.getAttribute('timestamp')
              : (await new Promise(async resolve => { // eslint-disable-line
                // if scrolled to bottom send last message as ref to storage
                  const mainScrollElDetail = await this.getMainScrollElDetail()
                  setTimeout(() => resolve(mainScrollElDetail.isScrolledBottom()), mainScrollElDetail.scrollTimer)
                }))
                  ? this.ul.lastElementChild.getAttribute('timestamp')
                // topBorder + 50 is for making sure that not only the bottom of the message is seen but 50px parts of it
                  : ulChildrenArr.find(child => child.getBoundingClientRect().bottom > topBorder + 50)?.getAttribute('timestamp') || event.detail.scrollEl
            this.dispatchEvent(new CustomEvent('yjs-merge-active-room', {
              detail: { scrollEl },
              bubbles: true,
              cancelable: true,
              composed: true
            }))
          }
        }, 1000)
      }
    }

    this.chatScrollEventListener = event => {
      if (event?.detail?.scrollEl && this.ulGetScrollElFunc(event.detail.scrollEl)()) scrollElIntoView(this.ulGetScrollElFunc(event.detail.scrollEl), ':not([intersecting])')
    }

    let resizeTimeout = null
    this.resizeListener = event => {
      clearTimeout(resizeTimeout)
      this.removeEventListener('message-intersection', this.messageIntersectionEventListener)
      resizeTimeout = setTimeout(() => {
        this.scrollLastMemorizedIntoView()
        this.addEventListener('message-intersection', this.messageIntersectionEventListener)
      }, 200)
    }
  }

  connectedCallback () {
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) {
      this.renderHTML()
    } else {
      // on new render the event listener is going to scroll, the below is executed on room change
      new Promise(resolve => this.dispatchEvent(new CustomEvent('yjs-get-active-room', {
        detail: {
          resolve
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))).then(room => {
        if (room?.scrollEl && this.ulGetScrollElFunc(room.scrollEl)()) {
          scrollElIntoView(this.ulGetScrollElFunc(room.scrollEl), ':not([intersecting])', undefined, {behavior: 'instant'})
        } else if (room?.scrollTop) {
          // backwards compatible behavior and if no scrollTop scrolls to bottom
          this.dispatchEvent(new CustomEvent('main-scroll', {
            detail: {
              behavior: 'instant',
              y: room.scrollTop
            },
            bubbles: true,
            cancelable: true,
            composed: true
          }))
        }
      })
    }
    this.globalEventTarget.addEventListener('chat-scroll', this.chatScrollEventListener)
    this.globalEventTarget.addEventListener('yjs-chat-update', this.chatUpdateEventListener)
    // this.addEventListener('message-intersection', this.messageIntersectionEventListener) // add this listener after render, to avoid intersection events before all messages are loaded
    self.addEventListener('resize', this.resizeListener)
  }

  disconnectedCallback () {
    this.globalEventTarget.removeEventListener('chat-scroll', this.chatScrollEventListener)
    this.globalEventTarget.removeEventListener('yjs-chat-update', this.chatUpdateEventListener)
    this.removeEventListener('message-intersection', this.messageIntersectionEventListener)
    self.removeEventListener('resize', this.resizeListener)
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
      :host > ul + section#empty {
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: 1fr;
        position: fixed;
        left: 0;
        top: 2%;
        width: min(50dvw, 100%);
        z-index: 1;
        pointer-events: none;
        transition: transform ${this.removeEmptySectionTimeout}ms ease-out 1s;
      }
      :host > ul + section#empty > * {
        grid-column: 1;
        grid-row: 1;
      }
      :host > ul:not(:empty) + section#empty, :host > ul + section#empty.hidden {
        transform: translateX(-100dvw);
      }
      :host > ul + section#empty > img {
        transform: rotate(45deg) translate(-33%, 23%);
        width: inherit;
        max-width: max-content;
        max-height: 90dvh;
        filter: url("#svg-grain");
        animation: filter-animation .2s steps(1) infinite;
      }
      :host > ul + section#empty > chat-m-message {
        transform: translate(min(365px, 54%), min(228px, 27%));
      }
      @media only screen and (max-width: _max-width_) {
        :host > ul + section#empty {
          top: 5%;
        }
        :host > ul + section#empty > chat-m-message {
          transform: translate(min(171px, 55%), min(55px, 13%));
        }
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
      @keyframes filter-animation {
        0% {
          filter: url("#svg-grain-one");
        }
        20% {
          filter: none;
        }
        40% {
          filter: url("#svg-grain-three");
        }
        60% {
          filter: none;
        }
        80% {
          filter: url("#svg-grain-two");
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
      <section id=empty class=hidden>
        <img src="./src/img/ninjaBob.png" />
        <svg id="svg-filter">
          <filter id="svg-grain-one">
            <feTurbulence baseFrequency="0.60,0.90" result="colorNoise" />
            <feColorMatrix in="colorNoise" type="matrix" values=".33 .33 .33 0 0 .33 .33 .33 0 0 .33 .33 .33 0 0 0 0 0 1 0"/>
            <feComposite operator="in" in2="SourceGraphic" result="monoNoise"/>
            <feBlend in="SourceGraphic" in2="monoNoise" mode="multiply" />
          </filter>
          <filter id="svg-grain-two">
            <feTurbulence baseFrequency="0.60,0.90" result="colorNoise" />
            <feColorMatrix in="colorNoise" type="matrix" values=".66 .66 .66 0 0 .66 .66 .66 0 0 .66 .66 .66 0 0 0 0 0 1 0"/>
            <feComposite operator="in" in2="SourceGraphic" result="monoNoise"/>
            <feBlend in="SourceGraphic" in2="monoNoise" mode="multiply" />
          </filter>
          <filter id="svg-grain-three">
            <feTurbulence baseFrequency="0.60,0.90" result="colorNoise" />
            <feColorMatrix in="colorNoise" type="matrix" values=".99 .99 .99 0 0 .99 .99 .99 0 0 .99 .99 .99 0 0 0 0 0 1 0"/>
            <feComposite operator="in" in2="SourceGraphic" result="monoNoise"/>
            <feBlend in="SourceGraphic" in2="monoNoise" mode="multiply" />
          </filter>
        </svg>
        <chat-m-message update-on-connected-callback timestamp="${Date.now()}" static no-dialog no-update>
          <template>{"updatedNickname":"Ninja Bob","timestamp":${Date.now()},"text":"Start a conversation by entering your message below!"}</template>
        </chat-m-message>
      </section>
    `
  }

  getMessageHTML (textObj, timestamp, wasLastMessage, isUlEmpty) {
    // this molecules/chat updates by, modified and delete, the elements in the ul and needs timestamp and uid to pinpoint the target. This is done due to lazy loading support.
    // was not looking very nice, but tried some parallax stuff: <wct-intersection-scroll-effect css-property=filter effect="sepia" max-value="100%" scroll-el-query="main" offset="-50">...message...</wct-intersection-scroll-effect>
    return /* html */`
      <wct-load-template-tag timestamp="${timestamp}" uid='${textObj.uid}' no-css>
        <template>
          <chat-m-message update-on-connected-callback intersection-event-name timestamp="${timestamp}" uid='${textObj.uid}'${textObj.isSelf ? ' self' : ''}${wasLastMessage ? ' was-last-message' : ''}${isUlEmpty ? ' first-render' : ''} show-reply-to>
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
    // @ts-ignore
    return () => this.ul[funcName](`[timestamp="${String(timestamp).includes(self.Environment?.timestampNamespace || 't_') ? '' : self.Environment?.timestampNamespace || 't_'}${timestamp}"]`)
  }

  ulGetMessageFunc (textObj) {
    let messages, message
    if ((messages = Array.from(this.ulGetScrollElFunc(textObj.timestamp, 'querySelectorAll')())) && (message = messages.find(message => message.getAttribute('uid') === textObj.uid))) return message
    return null
  }

  scrollLastMemorizedIntoView () {
    let promise = null
    // @ts-ignore
    if (location.hash.includes(self.Environment?.timestampNamespace || 't_')) {
      promise = Promise.resolve({
        scrollEl: location.hash.replace('#', '')
      })
      this.dispatchEvent(new CustomEvent('yjs-merge-active-room', {
        detail: {
          scrollEl: location.hash.replace('#', '')
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))
      // remove the hash after scrolling
      self.history.replaceState(history.state, document.title, location.href.replace(location.hash, ''))
    } else {
      promise = new Promise(resolve => this.dispatchEvent(new CustomEvent('yjs-get-active-room', {
        detail: {
          resolve
        },
        bubbles: true,
        cancelable: true,
        composed: true
      })))
    }
    promise.then(room => {
      if (room?.scrollEl && this.ulGetScrollElFunc(room.scrollEl)()) {
        scrollElIntoView(this.ulGetScrollElFunc(room.scrollEl), ':not([intersecting])', undefined, {behavior: 'instant'})
      } else if (room?.scrollTop) {
        // backwards compatible behavior and if no scrollTop scrolls to bottom
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
      } else if (this.ul?.lastElementChild) {
        scrollElIntoView(this.ulGetScrollElFunc(this.ul.lastElementChild.getAttribute('timestamp')), ':not([intersecting])', undefined, {behavior: 'instant'})
      }
    })
  }

  async getMainScrollElDetail () {
    return this._getMainScrollElDetail || (this._getMainScrollElDetail = new Promise(resolve => this.dispatchEvent(new CustomEvent('get-main-scroll-el', {
      detail: { resolve },
      bubbles: true,
      cancelable: true,
      composed: true
    }))))
  }

  get ul () {
    return this.root.querySelector('ul')
  }

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }

  get sectionEmpty () {
    return this.root.querySelector('section#empty')
  }
}
