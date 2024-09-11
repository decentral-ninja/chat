// @ts-check
import { Intersection } from '../../../../../event-driven-web-components-prototypes/src/Intersection.js'
/**
* @export
* @class Message
* @type {CustomElementConstructor}
*/
export default class Message extends Intersection() {
  constructor (textObj, replyToTextObj, options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, intersectionObserverInit: {}, ...options }, ...args)
    this.textObj = textObj || JSON.parse(this.template.content.textContent)
    this.replyToTextObj = replyToTextObj || this.replyToTemplate ? JSON.parse(this.replyToTemplate.content.textContent) : null

    this.clickEventListener = event => {
      if (!this.dialog) {
        this.fetchModules([{
          // @ts-ignore
          path: `${this.importMetaUrl}../../molecules/dialogs/MessageDialog.js?${Environment?.version || ''}`,
          name: 'chat-m-message-dialog'
        }]).then(() => {
          this.html = /* html */`
            <chat-m-message-dialog
              namespace="dialog-top-slide-in-"
              open="show-modal"
              ${this.hasAttribute('self') ? 'self' : ''}
            ></chat-m-message-dialog>
          `
          this.dialog.dialogPromise.then(dialog => dialog.querySelector('h4').insertAdjacentHTML('afterend', /* html */`<chat-m-message timestamp="${this.getAttribute('timestamp')}"${this.hasAttribute('self') ? ' self' : ''} no-dialog>
            <template>${JSON.stringify(this.textObj)}</template>
            <template id="reply-to">${JSON.stringify(this.replyToTextObj)}</template>
          </chat-m-message>`))
        })
      } else {
        this.dialog.show('show-modal')
      }
    }

    this.clickReplyToEventListener = event => this.dispatchEvent(new CustomEvent('chat-scroll', {
      detail: {
        scrollEl: `t_${this.replyToTextObj.timestamp}`
      },
      bubbles: true,
      cancelable: true,
      composed: true
    }))

    this.chatRemoveEventListener = event => {
      if (this.replyToTextObj && event.detail.textObj.timestamp === this.replyToTextObj.timestamp && event.detail.textObj.uid === this.replyToTextObj.uid) {
        this.replyToTextObj = {text: 'Message got deleted!', deleted: true}
        this.removeEventListeners()
        this.html = ''
        this.renderHTML()
        this.addEventListeners()
      }
    }
  }

  connectedCallback () {
    super.connectedCallback()
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
    this.addEventListeners()
  }
  
  addEventListeners() {
    if (this.openDialogIcon) this.openDialogIcon.addEventListener('click', this.clickEventListener)
    if (this.replyToLi) this.replyToLi.addEventListener('click', this.clickReplyToEventListener)
    this.globalEventTarget.addEventListener('yjs-chat-remove', this.chatRemoveEventListener)
  }

  disconnectedCallback () {
    super.disconnectedCallback()
    this.removeEventListeners()
  }
  
  removeEventListeners() {
    if (this.openDialogIcon) this.openDialogIcon.removeEventListener('click', this.clickEventListener)
    if (this.replyToLi) this.replyToLi.removeEventListener('click', this.clickReplyToEventListener)
    this.globalEventTarget.removeEventListener('yjs-chat-remove', this.chatRemoveEventListener)
  }

  // inform molecules/chat that message is intersecting and can be used as scroll hook plus being saved to storage room
  intersectionCallback (entries, observer) {
    if (entries && entries[0] && entries[0].isIntersecting) {
      this.setAttribute('intersecting', '')
      this.dispatchEvent(new CustomEvent(this.getAttribute('intersection-event-name') || 'message-intersection', {
        detail: {
          scrollEl: `${this.getAttribute('timestamp')}`
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))
    } else {
      this.removeAttribute('intersecting')
    }
  }

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
    return !this.li
  }

  /**
   * renders the css
   */
  renderCSS () {
    this.css = /* css */`
      :host > chat-m-message-dialog {
        font-size: 1rem;
      }
      :host li {
        background-color: var(--color-gray);
        border-radius: 0.5em;
        float: left;
        list-style: none;
        padding: var(--spacing);
        margin: 0.25em 0.1em 0.25em 0;
        width: 80%;          
      }
      :host([deleted]) li {
        text-decoration: line-through;
      }
      :host([self]) li {
        background-color: var(--color-green);
        float: right;
      }
      :host li > div {
        display: flex;
        justify-content: space-between;
      }
      :host li > .user, :host li > .timestamp {
        color: gray;
        font-size: 0.8em;
      }
      :host li > span {
        word-break: break-word;
      }
      :host li > span.text {
        white-space: pre-line;
      }
      :host li > span.text > wct-button, :host li > span.text > a-icon-mdx {
        display: block;
      }
      :host li > span.text > wct-button{
        --button-primary-background-color: var(--color-jitsi);
        --button-primary-border-color: var(--color-jitsi);
      }
      :host li > span.text > a-icon-mdx {
        text-align: center;
        margin: 2em auto;
        cursor: auto;
      }
      :host li > .timestamp {
        font-size: 0.6em;
      }
      :host li[part=reply-to-li] {
        background-color: var(--color-gray-lighter);
        box-shadow: 2px 2px 5px var(--color-black);
        cursor: pointer;
        float: none;
        width: 100%;
        max-height: 15dvh;
        margin-bottom: 1em;
        overflow-y: auto;
        scrollbar-color: var(--color) var(--background-color);
        scrollbar-width: thin;
      }
    `
    return this.fetchTemplate()
  }

  /**
   * fetches the template
   */
  fetchTemplate () {
    /** @type {import("../../../../../event-driven-web-components-prototypes/src/Shadow.js").fetchCSSParams[]} */
    const styles = [
      {
        path: `${this.importMetaUrl}../../../../../web-components-toolbox/src/css/reset.css`, // no variables for this reason no namespace
        namespace: false
      },
      {
        path: `${this.importMetaUrl}../../../../../web-components-toolbox/src/css/style.css`, // apply namespace and fallback to allow overwriting on deeper level
        namespaceFallback: true
      }
    ]
    switch (this.getAttribute('namespace')) {
      case 'message-default-':
        return this.fetchCSS([{
          path: `${this.importMetaUrl}./default-/default-.css`, // apply namespace since it is specific and no fallback
          namespace: false
        }, ...styles])
      default:
        return this.fetchCSS(styles)
    }
  }

  /**
   * Render HTML
   * @return {Promise<void>}
   */
  renderHTML (textObj = this.textObj, replyToTextObj = this.replyToTextObj) {
    // make aTags with href when first link is detected https://stackoverflow.com/questions/1500260/detect-urls-in-text-with-javascript
    this.html = Message.renderList(textObj, this.hasAttribute('no-dialog'), this.hasAttribute('self'))
    if (replyToTextObj) this.li.insertAdjacentHTML('afterbegin', Message.renderList(replyToTextObj, true, this.hasAttribute('self'), 'reply-to-li'))
    return this.fetchModules([
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../atoms/nickName/NickName.js?${Environment?.version || ''}`,
        name: 'chat-a-nick-name'
      },
      {
        path: `${this.importMetaUrl}../../../../../web-components-toolbox/src/es/components/atoms/iconMdx/IconMdx.js`,
        name: 'a-icon-mdx'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../../web-components-toolbox/src/es/components/atoms/button/Button.js?${Environment?.version || ''}`,
        name: 'wct-button'
      }
    ])
  }

  static renderList (textObj, hasAttributeNoDialog, hasAttributeSelf, part = 'li') {
    return /* html */`
      <li part="${part}">
        <div>
          ${textObj.deleted ? '' : /* html */`<chat-a-nick-name class="user" uid='${textObj.uid}' nickname="${textObj.updatedNickname}"${textObj.isSelf ? ' self' : ''}></chat-a-nick-name>`}
          ${hasAttributeNoDialog
            ? ''
            : hasAttributeSelf
              ? '<a-icon-mdx id="show-modal" rotate="-45deg" icon-url="../../../../../../img/icons/tool.svg" size="1.5em"></a-icon-mdx>'
              : '<a-icon-mdx id="show-modal" icon-url="../../../../../../img/icons/info-circle.svg" size="1.5em"></a-icon-mdx>'
          }
        </div>
        <span class="text${textObj.deleted ? ' italic' : ''}">${Message.processText(textObj).text}</span>${textObj.deleted ? '' : /* html */`<br><span class="timestamp">${(new Date(textObj.timestamp)).toLocaleString(navigator.language)}</span>`}
      </li>
    `
  }

  static processText (textObj) {
    textObj = structuredClone(textObj)
    switch (textObj.type) {
      case 'jitsi-video-started':
        textObj.text = /* html */`<span>just entered the video conference room: ${textObj.src}</span><wct-button id=send src="${textObj.src}" namespace="button-primary-" request-event-name="jitsi-dialog-show-event" click-no-toggle-active>
            <a-icon-mdx title="Join voice call" icon-url="../../../../../../img/icons/video-plus.svg" size="3em"></a-icon-mdx>
          </wct-button>`
        break
      case 'jitsi-video-stopped':
        textObj.text = /* html */`<span>just left the video conference room: ${textObj.src}</span><a-icon-mdx title="Left voice call" icon-url="../../../../../../img/icons/video-off.svg" size="3em"></a-icon-mdx>`
        break
      default:
        textObj.text = textObj.text.replace(/(https?:\/\/[^\s]+)/g, url => /* html */`<a href="${url}" target="_blank">${url}</a>`)
        break
    }
    return textObj
  }

  get li () {
    return this.root.querySelector('li')
  }

  get replyToLi () {
    return this.root.querySelector('li[part=reply-to-li]')
  }

  get openDialogIcon () {
    return this.root.querySelector('a-icon-mdx#show-modal')
  }

  get dialog () {
    return this.root.querySelector('chat-m-message-dialog')
  }

  get template () {
    return this.root.querySelector('template:first-of-type')
  }

  get replyToTemplate () {
    return this.root.querySelector('template#reply-to')
  }

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }
}
