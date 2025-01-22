// @ts-check
import Dialog from '../../../../../web-components-toolbox/src/es/components/molecules/dialog/Dialog.js'

/* global Environment */

/**
* @export
* @class Dialog
* In Progress
* https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
* @type {CustomElementConstructor}
*/
export default class MessageDialog extends Dialog {
  constructor (options = {}, ...args) {
    super({ ...options }, ...args)

    const superClose = this.close
    this.close = async () => {
      if (this.hasAttribute('deleted')) {
        this.dispatchEvent(new CustomEvent('chat-delete', {
          detail: await this.messageClone.textObj,
          bubbles: true,
          cancelable: true,
          composed: true
        }))
        this.controlsEl?.remove()
      }
      return superClose()
    }

    this.clickDeleteEventListener = event => {
      this.toggleAttribute('deleted')
      if (this.hasAttribute('deleted')) {
        this.messageClone.setAttribute('deleted', '')
      } else {
        this.messageClone.removeAttribute('deleted')
      }
    }

    this.clickReplyEventListener = async event => {
      this.dispatchEvent(new CustomEvent('reply-to-message', {
        detail: {
          textObj: await this.messageClone.textObj,
          messageClone: this.messageClone
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))
      this.close()
    }

    let timeout = null
    this.messageRenderedEventListener = event => {
      clearTimeout(timeout)
      timeout = setTimeout(() => this.dialogPromise.then(dialog => dialog.scroll({
        top: dialog.scrollHeight,
        behavior: 'smooth'
      })), 200)
    }
  }

  connectedCallback () {
    if (this.shouldRenderCustomHTML()) this.renderCustomHTML()
    const result = super.connectedCallback()
    if (this.replyEl) this.replyEl.addEventListener('click', this.clickReplyEventListener)
    if (this.hasAttribute('self') && this.deleteEl) this.deleteEl.addEventListener('click', this.clickDeleteEventListener)
    this.addEventListener('message-rendered', this.messageRenderedEventListener)
    return result
  }

  disconnectedCallback () {
    super.disconnectedCallback()
    if (this.replyEl) this.replyEl.removeEventListener('click', this.clickReplyEventListener)
    if (this.hasAttribute('self') && this.deleteEl) this.deleteEl.removeEventListener('click', this.clickDeleteEventListener)
    this.removeEventListener('message-rendered', this.messageRenderedEventListener)
  }

  /**
     * evaluates if a render is necessary
     *
     * @return {boolean}
     */
  shouldRenderCustomHTML () {
    return !this.root.querySelector(this.cssSelector + ' > dialog')
  }

  /**
   * renders the css
   */
  renderCSS () {
    const result = super.renderCSS()
    this.setCss(/* css */`
      :host > dialog {
        scrollbar-color: var(--color) var(--background-color);
        scrollbar-width: thin;
      }
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
        gap: 1em;
      }
      :host > dialog #controls > * {
        display: contents;
        --color: var(--color-secondary);
        --color-hover: var(--color-yellow);
      }
      :host > dialog #controls > #delete {
        display: none;
      }
      :host([self]) > dialog #controls > #delete {
        display: flex;
      }
      :host > dialog chat-m-message::part(li) {
        width: 100%;
        margin: 0;
        border-radius: 0.5em 0.5em 0 0;
      }
    `, undefined, false)
    return result
  }

  /**
   * Render HTML
   * @returns Promise<void>
   */
  renderCustomHTML () {
    const templateTextContent = this.template.content.textContent
    this.template.remove()
    this.html = /* html */`
      <dialog>
        <wct-menu-icon id="close" no-aria class="open sticky" namespace="menu-icon-close-" no-click></wct-menu-icon>
        <h4>Message:</h4>
        <div id="controls">
          <div id="reply"><wct-icon-mdx reply title="reply to message" icon-url="../../../../../../img/icons/arrow-back-up.svg" size="2em"></wct-icon-mdx></div>
          <div id="delete" title="delete message!">
            <wct-icon-mdx delete icon-url="../../../../../../img/icons/trash.svg" size="2em"></wct-icon-mdx>
            <wct-icon-mdx undo icon-url="../../../../../../img/icons/trash-off.svg" size="2em"></wct-icon-mdx>
          </div>
          <wct-dialog-clipboard id=clipboard namespace="dialog-clipboard-default-">
            <wct-icon-mdx id="show-modal" title="copy" icon-url="../../../../../../img/icons/copy.svg" size="2em"></wct-icon-mdx>
            <template>${JSON.parse(templateTextContent).text}</template>
          </wct-dialog-clipboard>
          <chat-m-share-dialog
            namespace="dialog-top-slide-in-"
            href="${location.href + `#${this.getAttribute('timestamp')}`}"
            title-append=" with anchor to this message"
            no-share-in-chat
          >
            <wct-icon-mdx id="show-modal" title="share" icon-url="../../../../../../img/icons/share-3.svg" size="2em"></wct-icon-mdx>
          </chat-m-share-dialog>
        </div>
      </dialog>
    `
    return this.fetchModules([
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../atoms/menuIcon/MenuIcon.js?${Environment?.version || ''}`,
        name: 'wct-menu-icon'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../molecules/dialogClipboard/DialogClipboard.js?${Environment?.version || ''}`,
        name: 'wct-dialog-clipboard'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../atoms/iconMdx/IconMdx.js?${Environment?.version || ''}`,
        name: 'wct-icon-mdx'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../../../chat/es/components/molecules/dialogs/ShareDialog.js?${Environment?.version || ''}`,
        name: 'chat-m-share-dialog'
      }
    ])
  }

  get controlsEl () {
    return this.root.querySelector('#controls')
  }

  get clipboardEl () {
    return this.root.querySelector('#clipboard')?.root.querySelector('#show-modal')
  }

  get replyEl () {
    return this.root.querySelector('#reply')
  }

  get deleteEl () {
    return this.root.querySelector('#delete')
  }

  get messageClone () {
    return this.root.querySelector('chat-m-message')
  }

  get template () {
    return this.root.querySelector('template')
  }
}
