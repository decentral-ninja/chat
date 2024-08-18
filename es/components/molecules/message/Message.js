// @ts-check
import { Shadow } from '../../../../../event-driven-web-components-prototypes/src/Shadow.js'
/**
* @export
* @class Message
* TODO: edit, delete, replyTo, emoji all in one dialog overlay per message, forward multiple messages
* @type {CustomElementConstructor}
*/
export default class Message extends Shadow() {
  constructor (textObj, options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, ...options }, ...args)
    this.textObj = textObj || JSON.parse(this.getAttribute('text-obj'))

    this.clickEventListener = event => {
      if (!this.dialog) {
        this.html = /* html */`
          <wct-dialog
            namespace="dialog-top-slide-in-"
            open=show-modal
          >
            <wct-menu-icon id="close" class="open" namespace="menu-icon-close-" no-click click-event-name="close-menu"></wct-menu-icon>
            <dialog>
              <h4>Message:</h4>
            </dialog>
          </wct-dialog>
        `
      } else {
        this.dialog.show('show-modal')
      }
    }
  }

  connectedCallback () {
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
    this.aIconMdx.addEventListener('click', this.clickEventListener)
  }

  disconnectedCallback () {
    this.aIconMdx.removeEventListener('click', this.clickEventListener)
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
      :host {
        display: contents;
      }
      :host > wct-dialog {
        font-size: 1rem;
      }
      :host > li {
        background-color: lightgray;
        border-radius: 0.5em;
        float: left;
        list-style: none;
        padding: var(--spacing);
        margin: 0.25em 0.1em 0.25em 0;
        width: 80%;          
        
      }
      :host([self]) > li {
        background-color: lightgreen;
        float: right;
      }
      :host > li > div {
        display: flex;
        justify-content: space-between;
      }
      :host > li > div > a-icon-mdx {
        /* TODO: continue here */
        display: none;
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
          ${this.hasAttribute('self')
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

  get aIconMdx () {
    return this.root.querySelector('a-icon-mdx')
  }

  get dialog () {
    return this.root.querySelector('wct-dialog')
  }
}
