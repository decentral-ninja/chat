// @ts-check
import { WebWorker } from '../../../../../event-driven-web-components-prototypes/src/WebWorker.js'
import { Intersection } from '../../../../../event-driven-web-components-prototypes/src/Intersection.js'

/* global Environment */
/* global location */
/* global self */

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
export default class Message extends WebWorker(Intersection()) {
  /** @type {Promise<import("../../controllers/Chat.js").TextObj | TextObjDeleted>} */
  #textObj

  constructor (options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, intersectionObserverInit: {}, ...options }, ...args)

    this.clickEventListener = event => {
      if (this.dialog) {
        this.dialog.show('show-modal')
      } else {
        this.fetchModules([{
          // @ts-ignore
          path: `${this.importMetaUrl}../../molecules/dialogs/MessageDialog.js?${Environment?.version || ''}`,
          name: 'chat-m-message-dialog'
        }]).then(async () => {
          this.html = /* html */`
            <chat-m-message-dialog
              namespace="dialog-top-slide-in-"
              open="show-modal"
              timestamp="${this.getAttribute('timestamp') || ''}"
              ${this.hasAttribute('self') ? 'self' : ''}
            ><template>${JSON.stringify(await this.textObj)}</template></chat-m-message-dialog>
          `
          // @ts-ignore
          this.dialog.dialogPromise.then(async dialog => dialog.querySelector('h4').insertAdjacentHTML('afterend', /* html */`<chat-m-message update-on-intersection timestamp="${this.getAttribute('timestamp') || ''}" uid='${this.getAttribute('uid') || ''}'${this.hasAttribute('self') ? ' self' : ''}${this.textObj.hasError ? ' no-update' : ''} no-dialog show-reply-to next-show-reply-to="true" reply-to-max-height="30dvh">
            <template>${JSON.stringify(await this.textObj)}</template>
          </chat-m-message>`))
        })
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
      if (event.detail.textObj.timestamp === (await this.textObj).timestamp && event.detail.textObj.uid === (await this.textObj).uid) this.update()
    }
  }

  connectedCallback () {
    super.connectedCallback()
    if (this.isConnected) this.connectedCallbackOnce()
    if (this.shouldRenderCSS()) this.renderCSS()
    const htmlReadyFunc = () => {
      this.addEventListeners()
      const updateReadyFunc = () => {
        this.dispatchEvent(new CustomEvent('message-rendered', {
          detail: {
            message: this
          },
          bubbles: true,
          cancelable: true,
          composed: true
        }))
      }
      // request most recent synced state
      if (this.hasAttribute('update-on-connected-callback') && !this.hasAttribute('static')) {
        this.update().then(updateReadyFunc)
      } else {
        updateReadyFunc()
      }
    }
    if (this.shouldRenderHTML()) {
      this.renderHTML().then(htmlReadyFunc)
    } else {
      htmlReadyFunc()
    }
  }

  connectedCallbackOnce () {
    try {
      this.textObj = Promise.resolve(this.template ? JSON.parse(this.template.content.textContent) : null)
    } catch (error) {
      // NOTE: this Error can be triggered by corrupt html. Expl.: <img src="" \"> which as object can be JSON stringified and parsed but at molecules/Chat.js breaks it after inserting the corrupt html string into the <template> tag
      // @ts-ignore
      this.textObj = Promise.resolve({
        self: this.hasAttribute('self'),
        updatedNickname: 'Error',
        text: `Could not parse this message. ${this.hasAttribute('self') ? 'Please, delete the message and reenter it newly!' : 'The owner shall delete the message and reenter it newly!'}`,
        // @ts-ignore
        timestamp: Number(this.getAttribute('timestamp').replace(self.Environment?.timestampNamespace || 't_', '')),
        uid: this.getAttribute('uid')
      })
      // @ts-ignore
      this.textObj.hasError = true
      console.error('Could not parse message:', { message: this, error })
    }
    this.connectedCallbackOnce = () => {}
  }

  async addEventListeners () {
    if (this.openDialogIcon) {
      this.openDialogIcon.addEventListener('click', this.clickEventListener)
      this.addEventListener('dblclick', this.clickEventListener)
    }
    if (this.replyToLi) this.replyToLi.addEventListener('click', this.clickReplyToEventListener)
    this.globalEventTarget.addEventListener(`chat-remove-${(await this.textObj).timestamp || ''}`, this.chatRemoveEventListener)
  }

  disconnectedCallback () {
    super.disconnectedCallback()
    this.removeEventListeners()
  }

  async removeEventListeners () {
    if (this.openDialogIcon) {
      this.openDialogIcon.removeEventListener('click', this.clickEventListener)
      this.removeEventListener('dblclick', this.clickEventListener)
    }
    if (this.replyToLi) this.replyToLi.removeEventListener('click', this.clickReplyToEventListener)
    this.globalEventTarget.removeEventListener(`chat-remove-${(await this.textObj).timestamp || ''}`, this.chatRemoveEventListener)
  }

  // inform molecules/chat that message is intersecting and can be used as scroll hook plus being saved to storage room
  intersectionCallback (entries, observer) {
    if (entries && entries[0]) { // all entries not only intersecting entries
      if (this.hasAttribute('intersection-event-name')) {
        this.dispatchEvent(new CustomEvent(this.getAttribute('intersection-event-name') || 'message-intersection', {
          detail: {
            scrollEl: `${this.getAttribute('timestamp')}`,
            entry: entries[0], // just grab the first in queue
            target: this
          },
          bubbles: true,
          cancelable: true,
          composed: true
        }))
      }
      if (this.areEntriesIntersecting(entries)) {
        this.setAttribute('intersecting', '')
        if (this.hasAttribute('update-on-intersection')) this.update()
        return
      }
    }
    this.removeAttribute('intersecting')
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
      :host li {
        display: flex;
        flex-direction: column;
        background-color: var(--color-gray);
        box-shadow: ${this.getAttribute('box-shadow') || 'none'};
        border-radius: var(--border-radius);
        float: left;
        list-style: none;
        padding: var(--spacing);
        margin: 0.25em 0.1em 0.25em 0;
        width: ${this.getAttribute('width') || '80%'};
      }
      :host li:not([deleted]) {
        min-height: var(--chat-m-message-min-height, 5em); /* wct-load-template-tag requirement */
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
        flex-grow: 1;
        display: flex;
        align-items: end;
        color: gray;
        font-size: 0.8em;
      }
      :host li > span {
        word-break: break-word;
      }
      :host li > span.text {
        white-space: pre-line;
      }
      :host li > span.text > wct-button, :host li > span.text > wct-icon-mdx, :host li > span.text > chat-a-provider-name {
        display: block;
      }
      :host li > span.text > wct-button{
        --button-primary-background-color: var(--color-jitsi);
        --button-primary-border-color: var(--color-jitsi);
      }
      :host li > span.text > wct-icon-mdx, :host li > span.text > chat-a-provider-name {
        text-align: center;
        margin: 2em auto;
        cursor: auto;
      }
      :host li > span.text > chat-a-provider-name {
        margin: 1em auto;
        width: fit-content;
      }
      :host li > span.text > span.loading {
        font-style: italic;
      }
      :host li > .timestamp {
        font-size: 0.6em;
      }
      :host([part=reply-to-li]) li > span.text {
        display: block;
        max-height: ${this.getAttribute('reply-to-max-height') || '6em'};
        overflow-y: auto;
        scroll-behavior: smooth;
        scrollbar-color: var(--color) var(--background-color);
        scrollbar-width: thin;
      }
      :host *[part=reply-to-li] {
        display: block;
        cursor: pointer;
        float: none;
        margin-bottom: 1em;
        width: 100%;
      }
      :host *[part=reply-to-li] + * {
        clear: both;
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
   * @return {Promise<[any, any]>}
   */
  async renderHTML (textObj = this.textObj) {
    const textObjSync = await textObj
    this.html = Message.renderList(textObjSync, this.hasAttribute('no-dialog'))
    if (!textObjSync.deleted) this.webWorker(Message.processText, textObjSync).then(textObj => (this.textSpan.innerHTML = textObj.text))
    return Promise.all([
      textObjSync.replyTo && this.hasAttribute('show-reply-to')
        ? this.renderReplyTo(textObjSync)
        : null,
      this.fetchModules([
        {
        // @ts-ignore
          path: `${this.importMetaUrl}../../atoms/nickName/NickName.js?${Environment?.version || ''}`,
          name: 'chat-a-nick-name'
        },
        {
        // @ts-ignore
          path: `${this.importMetaUrl}../../../../../components/atoms/iconCombinations/IconCombinations.js?${Environment?.version || ''}`,
          name: 'a-icon-combinations'
        },
        {
          // @ts-ignore
          path: `${this.importMetaUrl}../../../../../web-components-toolbox/src/es/components/atoms/iconMdx/IconMdx.js?${Environment?.version || ''}`,
          name: 'wct-icon-mdx'
        },
        {
        // @ts-ignore
          path: `${this.importMetaUrl}../../../../../web-components-toolbox/src/es/components/atoms/button/Button.js?${Environment?.version || ''}`,
          name: 'wct-button'
        },
        {
          // @ts-ignore
          path: `${this.importMetaUrl}../../atoms/providerName/ProviderName.js?${Environment?.version || ''}`,
          name: 'chat-a-provider-name'
        }
      ])])
  }

  renderReplyTo (textObj) {
    return this.getUpdatedTextObj(Promise.resolve(textObj.replyTo)).then(updatedTextObj => {
      if (this.replyToLi) this.replyToLi.remove()
      this.li.insertAdjacentHTML('afterbegin', /* html */`
        <chat-m-message part="reply-to-li" timestamp="${
            // @ts-ignore
            self.Environment?.timestampNamespace || 't_'
          }${textObj.replyTo?.timestamp}"${updatedTextObj?.isSelf ? ' self' : ''} no-dialog width="calc(100% - 0.2em)" box-shadow="2px 2px 5px var(--color-black)"${this.getAttribute('next-show-reply-to') === 'true' ? ' show-reply-to next-show-reply-to="true"' : ''}>
          <template>${JSON.stringify(updatedTextObj)}</template>
        </chat-m-message>
      `)
    })
  }

  update () {
    // @ts-ignore
    return this.textObj.hasError || this.hasAttribute('no-update')
      ? Promise.resolve()
      : Promise.all([this.textObj, this.getUpdatedTextObj()]).then(([textObj, updatedTextObj]) => {
        if (JSON.stringify(textObj) === JSON.stringify(updatedTextObj)) return
        this.textObj = Promise.resolve(updatedTextObj)
        this.removeEventListeners()
        this.html = ''
        return this.renderHTML().then(() => this.addEventListeners())
      })
  }

  /**
   * @static
   * @param {import("../../controllers/Chat.js").TextObj | TextObjDeleted} textObj
   * @param {boolean} hasAttributeNoDialog
   * @param {string} [part='li']
   * @returns
   * @memberof Message
   */
  static renderList (textObj, hasAttributeNoDialog, part = 'li') {
    // ATTENTION: Attribute static does not need any user nor dialog interaction!
    return /* html */`
      <li part="${part}"${textObj.deleted ? ' deleted' : ''}>
        <div>
          ${textObj.deleted ? '' : /* html */`<chat-a-nick-name class="user" uid='${textObj.uid}' nickname="${textObj.updatedNickname}"${textObj.isSelf ? ' self user-dialog-show-event-only-on-avatar' : ' user-dialog-show-event'}></chat-a-nick-name>`}
          ${hasAttributeNoDialog
            ? ''
            : '<wct-icon-mdx title="view message" id="show-modal" rotate="-180deg" scale="1.5" icon-url="../../../../../../img/icons/dots-circle-horizontal.svg" size="1.5em"></wct-icon-mdx>'
          }
          ${false // TODO: Encryption icons 
            ? /* html */`
              <a-icon-combinations keys>
                <wct-icon-mdx title="Private key" scale="1.5" style="--color-hover: var(--color-red-full); color:var(--color-red);" icon-url="../../../../../../img/icons/key-filled.svg" size="1.5em"></wct-icon-mdx>
                <wct-icon-mdx title="Public key" scale="1.5" style="--color-hover: var(--color-green-full); color:var(--color-green-dark);" icon-url="../../../../../../img/icons/key-filled.svg" size="1.5em"></wct-icon-mdx>
              </a-icon-states>
            ` 
            : ''
          }
        </div>
        <span class="text${textObj.deleted ? ' italic' : ''}">${textObj.deleted ? 'Message got deleted!' : '<span class="loading">Loading...</span>'}</span>${textObj.deleted ? '' : /* html */`<time class="timestamp">${textObj.timestamp ? (new Date(textObj.timestamp)).toLocaleString(navigator.language) : ''}</time>`}
      </li>
    `
  }

  // make aTags with href when first link is detected https://stackoverflow.com/questions/1500260/detect-urls-in-text-with-javascript
  static processText (textObj) {
    textObj = structuredClone(textObj)
    switch (textObj.type) {
      case 'jitsi-video-started':
        textObj.text = /* html */`<span>just entered the video conference room: ${textObj.src}</span><wct-button id=send src="${textObj.src}" namespace="button-primary-" request-event-name="jitsi-dialog-show-event" click-no-toggle-active>
            <wct-icon-mdx title="Join voice call" icon-url="../../../../../../img/icons/video-plus.svg" size="3em"></wct-icon-mdx>
          </wct-button>`
        break
      case 'jitsi-video-stopped':
        textObj.text = /* html */`<span>just left the video conference room: ${textObj.src}</span><wct-icon-mdx title="Left voice call" icon-url="../../../../../../img/icons/video-off.svg" size="3em"></wct-icon-mdx>`
        break
      case 'share-provider':
        textObj.text = /* html */`<span>shared the following provider: </span><chat-a-provider-name id="${textObj.id}" provider-dialog-show-event><span name>${textObj.text}</span></chat-a-provider-name>`
        break
      default:
        if (!textObj.text.includes('<')) textObj.text = textObj.text?.replace(/(https?:\/\/[^\s]+)/g, url => /* html */`<a href="${url}"${url.includes(location.host) && url.includes('room=') ? ' route' : ''} target="${url.includes(location.host) ? '_self' : '_blank'}">${url}</a>`)
        break
    }
    return textObj
  }

  /**
   *
   *
   * @param {Promise<import("../../controllers/Chat.js").TextObj | TextObjDeleted>} [textObj=this.textObj]
   * @return {Promise<import("../../controllers/Chat.js").TextObj | TextObjDeleted>}
   */
  async getUpdatedTextObj (textObj = this.textObj) {
    if (!(await textObj)) {
      // @ts-ignore
      if (!this.hasAttribute('timestamp') || !this.hasAttribute('uid')) return console.error('Chat message is missing textObj and/or timestamp/ui attribute!', this) || textObj
      textObj = Promise.resolve({
        // @ts-ignore
        timestamp: Number(this.getAttribute('timestamp').replace(self.Environment?.timestampNamespace || 't_', '')),
        uid: this.getAttribute('uid')
      })
    }
    return new Promise(async resolve => this.dispatchEvent(new CustomEvent('chat-get-text-obj', { // eslint-disable-line
      detail: {
        textObj: await textObj,
        resolve
      },
      bubbles: true,
      cancelable: true,
      composed: true
    }))).then(updatedTextObj => {
      // updatedTextObj could be theoretically undefined
      if (!updatedTextObj) return { deleted: true }
      return updatedTextObj
    })
  }

  /**
   * @param {Promise<import("../../controllers/Chat.js").TextObj | TextObjDeleted>} value
   */
  set textObj (value) {
    this.#textObj = value.then(newTextObj => {
      if (!newTextObj) return this.getUpdatedTextObj()
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

  get textSpan () {
    return this.li.querySelector('span.text')
  }

  get replyToLi () {
    return this.root.querySelector('*[part=reply-to-li]')
  }

  get openDialogIcon () {
    return this.root.querySelector('wct-icon-mdx#show-modal')
  }

  get dialog () {
    return this.root.querySelector('chat-m-message-dialog')
  }

  get template () {
    return this.root.querySelector('template:first-of-type')
  }

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }
}
