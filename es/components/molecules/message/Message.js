// @ts-check
import { Intersection } from '../../../../../event-driven-web-components-prototypes/src/Intersection.js'

/**
 * textObj aka. Message container deleted
 @typedef {{
  isSelf?: boolean,
  nickname?: string,
  sendNotifications?: boolean,
  text?: string,
  timestamp?: number,
  uid?: string,
  updatedNickname?: string,
  replyTo?: {
    timestamp: number,
    uid: string
  },
  deleted: boolean
}} TextObjDeleted
*/

/**
 * Message is the visual representation from chat[textObj]
 * Data is fed through 1) templateTag 2) dynamically through getUpdatedTextObj
 * 
 * @export
 * @class Message
 * @type {CustomElementConstructor}
 */
export default class Message extends Intersection() {
  /** @type {Promise<import("../../controllers/Chat.js").TextObj | TextObjDeleted>} */
  #textObj

  constructor (options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, intersectionObserverInit: {}, ...options }, ...args)

    this.clickEventListener = event => {
      if (!this.dialog) {
        this.fetchModules([{
          // @ts-ignore
          path: `${this.importMetaUrl}../../molecules/dialogs/MessageDialog.js?${Environment?.version || ''}`,
          name: 'chat-m-message-dialog'
        }]).then(async () => {
          this.html = /* html */`
            <chat-m-message-dialog
              namespace="dialog-top-slide-in-"
              open="show-modal"
              ${this.hasAttribute('self') ? 'self' : ''}
            ><template>${JSON.stringify(await this.textObj)}</template></chat-m-message-dialog>
          `
          this.dialog.dialogPromise.then(async dialog => dialog.querySelector('h4').insertAdjacentHTML('afterend', /* html */`<chat-m-message update-on-intersection timestamp="${this.getAttribute('timestamp') || ''}" uid='${this.getAttribute('uid') || ''}'${this.hasAttribute('self') ? ' self' : ''} no-dialog>
            <template>${JSON.stringify(await this.textObj)}</template>
          </chat-m-message>`))
        })
      } else {
        this.dialog.show('show-modal')
      }
    }

    this.clickReplyToEventListener = async event => this.dispatchEvent(new CustomEvent('chat-scroll', {
      detail: {
        scrollEl: (await this.textObj).replyTo?.timestamp
      },
      bubbles: true,
      cancelable: true,
      composed: true
    }))

    this.chatRemoveEventListener = async event => {
      if (event.detail.textObj.timestamp === (await this.textObj).replyTo?.timestamp && event.detail.textObj.uid === (await this.textObj).replyTo?.uid) {
        this.removeEventListeners()
        this.html = ''
        this.renderHTML().then(() => this.addEventListeners())
      }
    }
  }

  connectedCallback () {
    super.connectedCallback()
    this.connectedCallbackOnce()
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) {
      this.renderHTML().then(() => this.addEventListeners())
    } else {
      this.addEventListeners()
    }
    // request most recent synced state
    if (this.hasAttribute('update-on-connected-callback')) this.update()
  }

  connectedCallbackOnce () {
    this.textObj = Promise.resolve(this.template ? JSON.parse(this.template.content.textContent) : null)
  }
  
  async addEventListeners () {
    if (this.openDialogIcon) this.openDialogIcon.addEventListener('click', this.clickEventListener)
    if (this.replyToLi) this.replyToLi.addEventListener('click', this.clickReplyToEventListener)
    if ((await this.textObj).replyTo) this.globalEventTarget.addEventListener('chat-remove', this.chatRemoveEventListener)
  }

  disconnectedCallback () {
    super.disconnectedCallback()
    this.removeEventListeners()
  }
  
  async removeEventListeners() {
    if (this.openDialogIcon) this.openDialogIcon.removeEventListener('click', this.clickEventListener)
    if (this.replyToLi) this.replyToLi.removeEventListener('click', this.clickReplyToEventListener)
    if ((await this.textObj).replyTo) this.globalEventTarget.removeEventListener('chat-remove', this.chatRemoveEventListener)
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
      if (this.hasAttribute('update-on-intersection')) this.update()
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
      :host *[part=reply-to-li] {
        display: block;
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
      :host *[part=reply-to-li][deleted] {
        cursor: auto;
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
   * 
   * @param {Promise<import("../../controllers/Chat.js").TextObj | TextObjDeleted>} [textObj=this.textObj]
   * @return {Promise<void>}
   */
  async renderHTML (textObj = this.textObj) {
    const textObjSync = await textObj
    this.html = Message.renderList(textObjSync, this.hasAttribute('no-dialog'), this.hasAttribute('self'))
    if (textObjSync.replyTo) this.getUpdatedTextObj(Promise.resolve(textObjSync.replyTo)).then(updatedTextObj => {
      this.li.insertAdjacentHTML('afterbegin', /* html */`
        <chat-m-message part="reply-to-li" timestamp="${textObjSync.replyTo?.timestamp}"${updatedTextObj?.isSelf ? ' self' : ''} no-dialog>
          <template>${JSON.stringify(updatedTextObj ? updatedTextObj : {deleted: true})}</template>
        </chat-m-message>
      `)
    })
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

  update () {
    console.log('update', this);
    this.getUpdatedTextObj().then(updatedTextObj => {
      if (!updatedTextObj || JSON.stringify(this.textObj) === JSON.stringify(updatedTextObj)) return
      this.textObj = Promise.resolve(updatedTextObj)
      this.removeEventListeners()
      this.html = ''
      this.renderHTML().then(() => this.addEventListeners())
    })
  }

  /**
   * @static
   * @param {import("../../controllers/Chat.js").TextObj | TextObjDeleted} textObj
   * @param {boolean} hasAttributeNoDialog
   * @param {boolean} hasAttributeSelf
   * @param {string} [part='li']
   * @returns
   * @memberof Message
   */
  static renderList (textObj, hasAttributeNoDialog, hasAttributeSelf, part = 'li') {
    return /* html */`
      <li part="${part}"${textObj.deleted ? ' deleted' : ''}>
        <div>
          ${textObj.deleted ? '' : /* html */`<chat-a-nick-name class="user" uid='${textObj.uid}' nickname="${textObj.updatedNickname}"${textObj.isSelf ? ' self' : ''}></chat-a-nick-name>`}
          ${hasAttributeNoDialog
            ? ''
            : hasAttributeSelf
              ? '<a-icon-mdx id="show-modal" rotate="-45deg" icon-url="../../../../../../img/icons/tool.svg" size="1.5em"></a-icon-mdx>'
              : '<a-icon-mdx id="show-modal" icon-url="../../../../../../img/icons/info-circle.svg" size="1.5em"></a-icon-mdx>'
          }
        </div>
        <span class="text${textObj.deleted ? ' italic' : ''}">${textObj.deleted ? 'Message got deleted!' : Message.processText(textObj).text}</span>${textObj.deleted ? '' : /* html */`<br><span class="timestamp">${textObj.timestamp ? (new Date(textObj.timestamp)).toLocaleString(navigator.language) : ''}</span>`}
      </li>
    `
  }

  // make aTags with href when first link is detected https://stackoverflow.com/questions/1500260/detect-urls-in-text-with-javascript
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
        textObj.text = textObj.text?.replace(/(https?:\/\/[^\s]+)/g, url => /* html */`<a href="${url}" target="_blank">${url}</a>`)
        break
    }
    return textObj
  }

  /**
   *
   *
   * @param {Promise<import("../../controllers/Chat.js").TextObj | TextObjDeleted>} [textObj=this.textObj]
   * @return {Promise<import("../../controllers/Chat.js").TextObj | TextObjDeleted | null>}
   */
  async getUpdatedTextObj (textObj = this.textObj) {
    if (!(await textObj)) {
      // @ts-ignore
      if (!this.hasAttribute('timestamp') || !this.hasAttribute('uid')) return console.error('Chat message is missing textObj and/or timestamp/ui attribute!', this) || textObj
      textObj = Promise.resolve({
        timestamp: Number(this.getAttribute('timestamp')),
        uid: this.getAttribute('uid')
      })
    }
    return new Promise(async resolve => this.dispatchEvent(new CustomEvent('chat-get-text-obj', {
      detail: {
        textObj: await textObj,
        resolve
      },
      bubbles: true,
      cancelable: true,
      composed: true
    }))).then(updatedTextObj => {
      // updatedTextObj could be theoretically undefined
      if (!updatedTextObj) return null
      return updatedTextObj
    })
  }

  /**
   * @param {Promise<import("../../controllers/Chat.js").TextObj | TextObjDeleted>} value
   */
  set textObj (value) {
    this.#textObj = value.then(newTextObj => {
      if (!newTextObj) return this.getUpdatedTextObj().then(updatedTextObj => {
        // deleted
        if (!updatedTextObj) return {deleted: true}
        return updatedTextObj
      })
      return newTextObj
    })
  }

  /**
   *
   *
   * @readonly
   * @return {Promise<import("../../controllers/Chat.js").TextObj | TextObjDeleted>}
   */
  get textObj () {
    return this.#textObj
  }

  get li () {
    return this.root.querySelector('li')
  }

  get replyToLi () {
    return this.root.querySelector('*[part=reply-to-li]')
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
