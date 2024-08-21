// @ts-check
import { Intersection } from '../../../../../event-driven-web-components-prototypes/src/Intersection.js'
/**
* @export
* @class Message
* TODO: edit, replyTo, emoji all in one dialog overlay per message, forward multiple messages
* @type {CustomElementConstructor}
*/
export default class Message extends Intersection() {
  constructor (textObj, options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, intersectionObserverInit: { rootMargin: '0px 0px -50% 0px'}, ...options }, ...args)
    this.textObj = textObj || JSON.parse(this.template.content.textContent)

    this.clickEventListener = event => {
      if (!this.dialog) {
        this.html = /* html */`
          <wct-dialog
            namespace="dialog-top-slide-in-"
            open="show-modal"
            closed-event-name="dialog-closed-event"
          >
            <style protected="true">
              :host > dialog [delete] {
                display: contents;
              }
              :host([deleted]) > dialog [delete] {
                display: none;
              }
              :host > dialog [undo] {
                display: none;
              }
              :host([deleted]) > dialog [undo] {
                display: contents;
              }
              :host > dialog #controls {
                display: flex;
                justify-content: flex-end;
                padding: 0.5em;
                border: 1px solid lightgray;
                border-top: 0;
                border-radius: 0 0 0.5em 0.5em;
              }
              :host > dialog #controls > * {
                --color: var(--color-secondary);
                --color-hover: var(--color-yellow);
              }
              :host > dialog #controls > #delete {
                display: flex;
              }
            </style>
            <wct-menu-icon id="close" class="open" namespace="menu-icon-close-" no-click click-event-name="close-menu"></wct-menu-icon>
            <dialog>
              <h4>Message:</h4>
              ${this.hasAttribute('self')
                ? /* html */`
                  <div id="controls">
                    <div id="delete">
                      <a-icon-mdx delete icon-url="../../../../../../img/icons/trash.svg" size="2em"></a-icon-mdx>
                      <a-icon-mdx undo icon-url="../../../../../../img/icons/trash-off.svg" size="2em"></a-icon-mdx>
                    </div>
                  </div>
                `
                : ''
              }
            </dialog>
          </wct-dialog>
        `
        // clone message into dialog
        // @ts-ignore
        this.messageClone = new this.constructor(this.textObj)
        this.messageClone.setAttribute('timestamp', this.getAttribute('timestamp'))
        if (this.hasAttribute('self')) this.messageClone.setAttribute('self', '')
        if (this.hasAttribute('was-last-message')) this.messageClone.setAttribute('was-last-message', '')
        if (this.hasAttribute('first-render')) this.messageClone.setAttribute('first-render', '')
        this.messageClone.setAttribute('no-dialog', '')
        this.messageClone.setAttribute('width', '100%')
        if (this.hasAttribute('self')) this.messageClone.setAttribute('border-radius', `${this.borderRadius} ${this.borderRadius} 0 0`)
        this.messageClone.setAttribute('margin', '0')
        this.dialog.dialogPromise.then(dialog => {
          dialog.querySelector('h4').after(this.messageClone)
          // setup delete event listeners
          if (this.deleteEl) this.deleteEl.addEventListener('click', this.clickDeleteEventListener)
        })
      } else {
        this.dialog.show('show-modal')
      }
    }

    this.clickDeleteEventListener = event => {
      this.toggleAttribute('deleted')
      if (this.hasAttribute('deleted')) {
        this.dialog.setAttribute('deleted', '')
        this.messageClone.setAttribute('deleted', '')
      } else {
        this.dialog.removeAttribute('deleted')
        this.messageClone.removeAttribute('deleted')
      }
    }

    this.dialogCloseEventListener = event => {
      if (this.hasAttribute('deleted')) {
        this.dispatchEvent(new CustomEvent('yjs-chat-delete', {
          detail: this.textObj,
          bubbles: true,
          cancelable: true,
          composed: true
        }))
        this.clickDeleteEventListener()
      }
    }
  }

  connectedCallback () {
    super.connectedCallback()
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
    this.addEventListener('dialog-closed-event', this.dialogCloseEventListener)      
    if (this.openDialogIcon) this.openDialogIcon.addEventListener('click', this.clickEventListener)
    if (this.deleteEl) this.deleteEl.addEventListener('click', this.clickDeleteEventListener)
  }

  disconnectedCallback () {
    super.disconnectedCallback()
    this.removeEventListener('dialog-closed-event', this.dialogCloseEventListener)    
    if (this.openDialogIcon) this.openDialogIcon.removeEventListener('click', this.clickEventListener)
    if (this.deleteEl) this.deleteEl.removeEventListener('click', this.clickDeleteEventListener)
  }

  // inform molecules/chat that message is intersecting and can be used as scroll hook plus being saved to storage room
  intersectionCallback (entries, observer) {
    if (entries && entries[0] && entries[0].isIntersecting) this.dispatchEvent(new CustomEvent(this.getAttribute('intersection-event-name') || 'message-intersection', {
      detail: {
        scrollEl: `${this.getAttribute('timestamp')}`
      },
      bubbles: true,
      cancelable: true,
      composed: true
    }))
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
    this.borderRadius = '0.5em'
    this.css = /* css */`
      :host > wct-dialog {
        font-size: 1rem;
      }
      :host > li {
        background-color: lightgray;
        border-radius: ${this.hasAttribute('border-radius') ? this.getAttribute('border-radius') : this.borderRadius};
        float: left;
        list-style: none;
        padding: var(--spacing);
        margin: ${this.hasAttribute('margin') ? this.getAttribute('margin') : '0.25em 0.1em 0.25em 0'};
        width: ${this.getAttribute('width') ? this.getAttribute('width') : '80%'};          
      }
      :host([deleted]) > li {
        text-decoration: line-through;
      }
      :host([self]) > li {
        background-color: lightgreen;
        float: right;
      }
      :host > li > div {
        display: flex;
        justify-content: space-between;
      }
      :host > li > .user, :host > li > .timestamp {
        color: gray;
        font-size: 0.8em;
      }
      :host > li > span {
        word-break: break-word;
      }
      :host > li > span.text {
        white-space: pre-line;
      }
      :host > li > .timestamp {
        font-size: 0.6em;
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
  renderHTML (textObj = this.textObj) {
    // make aTags with href when first link is detected https://stackoverflow.com/questions/1500260/detect-urls-in-text-with-javascript
    this.html = `
      <li>
        <div>
          <chat-a-nick-name class="user" uid='${textObj.uid}' nickname="${textObj.updatedNickname}"${textObj.isSelf ? ' self' : ''}></chat-a-nick-name>
          ${this.hasAttribute('no-dialog')
              ? ''
              : this.hasAttribute('self')
                ? '<a-icon-mdx id="show-modal" rotate="-45deg" icon-url="../../../../../../img/icons/tool.svg" size="1.5em"></a-icon-mdx>'
                : '<a-icon-mdx id="show-modal" icon-url="../../../../../../img/icons/info-circle.svg" size="1.5em"></a-icon-mdx>'
          }
        </div>
        <span class="text">${textObj.text.replace(/(https?:\/\/[^\s]+)/g, url => `<a href="${url}" target="_blank">${url}</a>`)}</span><br><span class="timestamp">${(new Date(textObj.timestamp)).toLocaleString(navigator.language)}</span>
      </li>  
    `
    return this.fetchModules([
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../atoms/nickName/NickName.js?${Environment?.version || ''}`,
        name: 'chat-a-nick-name'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../../web-components-toolbox/src/es/components/molecules/dialog/Dialog.js?${Environment?.version || ''}`,
        name: 'wct-dialog'
      },
      {
        path: `${this.importMetaUrl}../../../../../web-components-toolbox/src/es/components/atoms/iconMdx/IconMdx.js`,
        name: 'a-icon-mdx'
      }
    ])
  }

  get li () {
    return this.root.querySelector('li')
  }

  get openDialogIcon () {
    return this.root.querySelector('a-icon-mdx')
  }

  get dialog () {
    return this.root.querySelector('wct-dialog')
  }

  get template () {
    return this.root.querySelector('template')
  }

  get deleteEl () {
    return this.dialog?.root?.querySelector('#delete')
  }
}
