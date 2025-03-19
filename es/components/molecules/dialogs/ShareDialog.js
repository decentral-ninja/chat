// @ts-check
import Dialog from '../../../../../web-components-toolbox/src/es/components/molecules/dialog/Dialog.js'

/* global Environment */

/**
* @export
* @class Dialog
* https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
* @type {CustomElementConstructor}
*/
export default class ShareDialog extends Dialog {
  constructor (options = {}, ...args) {
    super({ ...options }, ...args)

    this.inputEventListener = event => {
      this.qrCodeSvg.setAttribute('data', this.textarea.value)
      this.dialogClipboard.setAttribute('data', this.textarea.value)
    }

    this.shareApiIconClickEventListener = async event => {
      try {
        await navigator.share({
          title: this.getAttribute('room-name') || document.title,
          url: this.textarea.value
        })
      } catch (error) {
        this.shareApiIcon.remove()
        this.dialogClipboard.show()
      }
    }

    this.shareChatIconClickEventListener = event => this.dispatchEvent(new CustomEvent('chat-add', {
      detail: {
        input: this.textarea,
        clear: false
      },
      bubbles: true,
      cancelable: true,
      composed: true
    }))
  }

  connectedCallback () {
    if (this.shouldRenderCustomHTML()) {
      this.renderCustomHTML().then(() => {
        this.textarea.addEventListener('input', this.inputEventListener)
        if (this.shareChatIcon) this.shareChatIcon.addEventListener('click', this.shareChatIconClickEventListener)
        if (this.shareApiIcon) this.shareApiIcon.addEventListener('click', this.shareApiIconClickEventListener)
      })
    } else {
      this.textarea.addEventListener('input', this.inputEventListener)
      if (this.shareChatIcon) this.shareChatIcon.addEventListener('click', this.shareChatIconClickEventListener)
      if (this.shareApiIcon) this.shareApiIcon.addEventListener('click', this.shareApiIconClickEventListener)
    }
    const result = super.connectedCallback()
    return result
  }

  disconnectedCallback () {
    const result = super.disconnectedCallback()
    this.textarea.removeEventListener('input', this.inputEventListener)
    if (this.shareChatIcon) this.shareChatIcon.removeEventListener('click', this.shareChatIconClickEventListener)
    if (this.shareApiIcon) this.shareApiIcon.removeEventListener('click', this.shareApiIconClickEventListener)
    return result
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
      :host {
        --dialog-top-slide-in-hr-margin: 0 0 var(--content-spacing);
      }
      :host > dialog {
        --dialog-top-slide-in-a-text-decoration: underline;
        scrollbar-color: var(--color) var(--background-color);
        scrollbar-width: thin;
        transition: height 0.3s ease-out;
      }
      :host > dialog > textarea {
        color: var(--color-secondary);
        font-size: max(16px, 1em); /* 16px ios mobile focus zoom fix */
        resize: none;
        min-height: auto;
        overflow-y: auto;
        outline: none;
        border-radius: var(--border-radius) var(--border-radius) 0 0;
        scrollbar-color: var(--color) var(--background-color);
        scrollbar-width: thin;
        text-align: center;
        width: 100%;
        field-sizing: content; /*Coming soon: https://toot.cafe/@seaotta/111812940330557783*/
      }
      :host > dialog #controls {
        display: flex;
        justify-content: flex-end;
        padding: 0.5em;
        border: 1px solid lightgray;
        border-top: 0;
        border-radius: 0 0 var(--border-radius) var(--border-radius);
        gap: 1em;
        margin-top: -0.5em;
      }
      :host > dialog #controls > * {
        --color: var(--color-secondary);
        --color-hover: var(--color-yellow);
      }
      @media only screen and (max-width: _max-width_) {
        :host {
          --dialog-top-slide-in-hr-margin: 0 0 var(--content-spacing-mobile);
        }
      }
    `, undefined, false)
    return result
  }

  /**
   * Render HTML
   * @returns Promise<void>
   */
  renderCustomHTML () {
    this.html = /* html */`
      <dialog>
        <wct-menu-icon id="close" no-aria class="open sticky" namespace="menu-icon-close-" no-click></wct-menu-icon>
        <h4>Share: "<span class="bold">${this.getAttribute('room-name') || document.title}</span>"${this.getAttribute('title-append') || ''}</h4>
      </dialog>
    `
    return Promise.all([
      (this.getAttribute('room-name')
        ? new Promise(resolve => this.dispatchEvent(new CustomEvent('yjs-get-rooms', {
          detail: {
            resolve
          },
          bubbles: true,
          cancelable: true,
          composed: true
        })))
        : Promise.resolve(this.getAttribute('href'))
      ).then(getRoomsResult => {
        const locationHref = this.getAttribute('room-name') ? getRoomsResult.value[this.getAttribute('room-name')].locationHref : getRoomsResult
        this.root.querySelector('dialog').insertAdjacentHTML('beforeend', /* html */`
          <p><wct-qr-code-svg namespace="qr-code-svg-default-" data='${locationHref}'></wct-qr-code-svg></p>
          <textarea>${locationHref}</textarea>
          <div id="controls">
            <wct-dialog-clipboard id=clipboard title="copy" namespace="dialog-clipboard-default-">
              <wct-icon-mdx id="show-modal" icon-url="../../../../../../img/icons/copy.svg" size="2em"></wct-icon-mdx>
              <template>${locationHref}</template>
            </wct-dialog-clipboard>
            ${this.hasAttribute('is-active-room') || this.hasAttribute('no-share-in-chat') ? '' : '<wct-icon-mdx id=share-chat title="share in this chat" icon-url="../../../../../../img/icons/message-2-share.svg" size="2em"></wct-icon-mdx>'}
            ${typeof navigator.share === 'function' ? '<wct-icon-mdx id=share-api title="share" icon-url="../../../../../../img/icons/share-3.svg" size="2em"></wct-icon-mdx>' : ''}
          </div>
          <!--
          <hr>
          <p>Options...</p>
          -->
        `)
      }),
      this.fetchModules([
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
          path: `${this.importMetaUrl}../../atoms/qrCodeSvg/QrCodeSvg.js?${Environment?.version || ''}`,
          name: 'wct-qr-code-svg'
        }
      ])
    ])
  }

  get textarea () {
    return this.root.querySelector('textarea')
  }

  get qrCodeSvg () {
    return this.root.querySelector('wct-qr-code-svg')
  }

  get dialogClipboard () {
    return this.root.querySelector('wct-dialog-clipboard')
  }

  get shareChatIcon () {
    return this.root.querySelector('#share-chat')
  }

  get shareApiIcon () {
    return this.root.querySelector('#share-api')
  }
}
