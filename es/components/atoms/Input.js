// @ts-check
import { Shadow } from '../../../../event-driven-web-components-prototypes/src/Shadow.js'

/* global CustomEvent */
/* global self */
/* global Environment */

export default class Input extends Shadow() {
  constructor (options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, tabindex: 'no-tabindex-style', ...options }, ...args)

    const wormholeUrl = 'https://wormhole.app/'
    let wormholeOpened = false

    this.sendEventListener = async (event, input) => {
      let replyToTextObj = null
      if (this.replyToSection.innerHTML) {
        replyToTextObj = await this.chatMessageEl.textObj
        this.replyToSection.innerHTML = ''
      }
      this.dispatchEvent(new CustomEvent('chat-add', {
        detail: {
          input: input || event.composedPath()[0],
          replyToTextObj
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))
      this.textarea.style.height = 'auto'
    }

    this.inputEventListener = event => {
      this.textarea.style.height = 'auto'
      const emValue = this.textarea.scrollHeight / parseFloat(self.getComputedStyle(this.textarea).fontSize)
      this.textarea.style.height = `max(3em, ${emValue}em)`
    }

    this.keyupEventListener = event => {
      if ((!this.isTouchScreen() || !this.isMobile) && event.key === 'Enter' && event.shiftKey === false) {
        this.textarea.value = this.textarea.value.substring(0, this.textarea.value.length - 1) // cut the last character of enter = \n off
        return this.sendEventListener(undefined, this.textarea)
      }
      if (event.key === 'Escape') return this.textarea.blur()
    }

    this.buttonClickEventListener = event => {
      switch (event.composedPath().find(node => (node.tagName === 'WCT-BUTTON' || node.tagName === 'WCT-ICON-MDX') && node.hasAttribute('id')).getAttribute('id')) {
        case 'wormhole':
          self.open(wormholeUrl)
          wormholeOpened = true
          break
        case 'send':
          this.sendEventListener(undefined, this.textarea)
          break
        case 'jitsi':
          this.dispatchEvent(new CustomEvent('jitsi-dialog-show-event', {
            detail: {
              command: 'show-modal'
            },
            bubbles: true,
            cancelable: true,
            composed: true
          }))
          break
      }
    }

    /* Put cursor into input on click of chat area */
    this.windowClickEventListener = event => {
      const target = event.composedPath()[0]
      if (target.classList.contains('pattern')) this.textarea.focus()
    }

    this.emojiClickedEventListener = event => {
      this.textarea.focus()
      this.textarea.setRangeText(
        event.detail?.clickedEmoji || '',
        this.textarea.selectionStart,
        this.textarea.selectionEnd,
        'end'
      )
    }

    // past wormhole url
    const wormholeUrls = []
    this.focusEventListener = async event => {
      if (wormholeOpened) {
        try {
          const clipboardContents = await navigator.clipboard.read()
          for (const item of clipboardContents) {
            for (const mimeType of item.types) {
              if (mimeType === 'text/plain') {
                const blob = await item.getType('text/plain')
                const text = await blob.text()
                if (text.includes(wormholeUrl) && !wormholeUrls.includes(text)) {
                  this.textarea.setRangeText(
                    (this.textarea.value ? ' ' : '') + text,
                    this.textarea.selectionStart,
                    this.textarea.selectionEnd,
                    'end'
                  )
                  wormholeUrls.push(text)
                }
              }
            }
          }
        } catch (error) {
          console.warn(error)
        }
        wormholeOpened = false
      }
    }

    this.jitsiVideoStartedEventListener = event => {
      this.jitsiButton.setAttribute('custom-notification', '')
      this.dispatchEvent(new CustomEvent('chat-add', {
        detail: {
          type: 'jitsi-video-started',
          iframeSrc: event.detail.iframeSrc
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))
    }
    this.jitsiVideoStoppedEventListener = event => {
      this.jitsiButton.removeAttribute('custom-notification')
      this.dispatchEvent(new CustomEvent('chat-add', {
        detail: {
          type: 'jitsi-video-stopped',
          iframeSrc: event.detail.iframeSrc
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))
    }

    this.replyToMessageEventListener = event => {
      this.fetchModules([{
        // @ts-ignore
        path: `${this.importMetaUrl}../../components/molecules/message/Message.js?${Environment?.version || ''}`,
        name: 'chat-m-message'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/atoms/menuIcon/MenuIcon.js?${Environment?.version || ''}`,
        name: 'wct-menu-icon'
      }]).then(() => {
        this.replyToSection.innerHTML = /* html */`
          <div id="reply-controls">
            <h4>Reply to:</h4>
            <wct-menu-icon id="reply-close" no-aria class="open" namespace="menu-icon-close-" no-click></wct-menu-icon>
          </div>
          <chat-m-message timestamp="${event.detail.messageClone.getAttribute('timestamp')}"${event.detail.textObj.isSelf ? ' self' : ''} no-dialog>
            <template>${JSON.stringify(event.detail.textObj)}</template>
          </chat-m-message>
        `
        this.replyClose.addEventListener('click', event => (this.replyToSection.innerHTML = ''), { once: true })
        this.chatMessageEl.addEventListener('click', event => this.dispatchEvent(new CustomEvent('chat-scroll', {
          detail: {
            scrollEl: this.chatMessageEl.getAttribute('timestamp')
          },
          bubbles: true,
          cancelable: true,
          composed: true
        })))
        this.replyToSection.scroll(0, 0)
        this.textarea.focus()
      })
    }
  }

  connectedCallback () {
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
    this.buttons.forEach(button => button.addEventListener('click', this.buttonClickEventListener))
    this.root.addEventListener('keyup', this.keyupEventListener)
    this.textarea.addEventListener('input', this.inputEventListener)
    this.addEventListener('emoji-clicked', this.emojiClickedEventListener)
    self.addEventListener('click', this.windowClickEventListener)
    this.textarea.addEventListener('focus', this.focusEventListener)
    this.globalEventTarget.addEventListener('jitsi-video-started', this.jitsiVideoStartedEventListener)
    this.globalEventTarget.addEventListener('jitsi-video-stopped', this.jitsiVideoStoppedEventListener)
    this.globalEventTarget.addEventListener('reply-to-message', this.replyToMessageEventListener)
  }

  disconnectedCallback () {
    this.buttons.forEach(button => button.removeEventListener('click', this.buttonClickEventListener))
    this.root.removeEventListener('keyup', this.keyupEventListener)
    this.textarea.removeEventListener('input', this.inputEventListener)
    this.removeEventListener('emoji-clicked', this.emojiClickedEventListener)
    self.removeEventListener('click', this.windowClickEventListener)
    this.textarea.removeEventListener('focus', this.focusEventListener)
    this.globalEventTarget.removeEventListener('jitsi-video-started', this.jitsiVideoStartedEventListener)
    this.globalEventTarget.removeEventListener('jitsi-video-stopped', this.jitsiVideoStoppedEventListener)
    this.globalEventTarget.removeEventListener('reply-to-message', this.replyToMessageEventListener)
  }

  /**
   * Evaluates if a render of CSS is necessary
   *
   * @return {boolean}
   */
  shouldRenderCSS () {
    return !this.root.querySelector(`${this.cssSelector} > style[_css]`)
  }

  /**
   * Evaluates if a render of HTML is necessary
   *
   * @return {boolean}
   */
  shouldRenderHTML () {
    return !this.textarea
  }

  /**
   * Renders the CSS
   *
   * @return {Promise<void>}
   */
  renderCSS () {
    this.css = /* css */`
      :host {
        --menu-icon-close-background-color-hover: var(--color);
        --menu-icon-close-background-color: var(--color);
        width: 100%;
      }
      :host > div {
        --button-primary-width: 100%;
        --button-primary-height: 100%;
        --button-primary-font-size: max(16px, 1em);
        --button-primary-font-size-mobile: 1em;
        --color-hover: var(--color-yellow);
        display: flex;
        width: 100%;
        position: relative;
      }
      :host > div > #inline-buttons {
        --padding: 0.25em;
        position: absolute;
        left: 0;
        bottom: 0;
        z-index: 101;
        display: flex;
        flex-direction: column;
        align-items: left;
        gap: 0.25em;
        padding: var(--padding);
      }
      :host > div > * {
        flex-grow: 0; 
      }
      :host > div > textarea {
        flex-grow: 100;        
        font-size: max(16px, 1em); /* 16px ios mobile focus zoom fix */
        transition: height 0.3s ease-out;
        resize: none;
        padding-left: 2.5em;
        min-height: 4.365em;
        max-height: 50dvh;
        overflow-y: auto;
        outline: none;
        border-radius: 0;
        scrollbar-color: var(--color) var(--background-color);
        scrollbar-width: thin;
        field-sizing: content; /*Coming soon: https://toot.cafe/@seaotta/111812940330557783*/
      }
      :host > div > wct-button {
        min-height: 100%;
      }
      :host > div > wct-button, :host > div > wct-icon-mdx {
        cursor: pointer;
        word-break: break-all;
        padding-right: 0.5em;
        
      }
      :host > div > wct-button:last-child, :host > div > wct-icon-mdx:last-child {
        padding-right: 0;
      }
      :host > div > wct-button:first-of-type {
        --button-primary-border-radius: 0 var(--border-radius) var(--border-radius) 0;
      }
      :host > div > wct-icon-mdx {
        align-self: center;
        display: flex;
      }
      :host > div > textarea ~ wct-icon-mdx {
        transition: var(--transition);
      }
      :host(:focus) > div > textarea:hover ~ wct-icon-mdx,
      :host(:focus) > div > textarea:has(~ wct-button:hover) ~ wct-icon-mdx,
      :host(:focus) > div > textarea:has(~ wct-button:focus) ~ wct-icon-mdx,
      :host(:focus) > div > #inline-buttons:hover ~ textarea ~ wct-icon-mdx {
        width: 0;
        padding: 0;
        opacity: 0;
        transition: var(--transition);
      }
      :host(:focus) > div > textarea:hover ~ wct-button,
      :host(:focus) > div > textarea ~ wct-button:hover,
      :host(:focus) > div > #inline-buttons:hover ~ textarea ~ wct-button {
        padding: 0;
      }
      :host > section {
        max-height: 15dvh;
        overflow-y: auto;
        scrollbar-color: var(--color) var(--background-color);
        scrollbar-width: thin;
        mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 90%, rgba(0, 0, 0, 0) 100%);
      }
      :host > section chat-m-message {
        cursor: pointer;
      }
      :host > section chat-m-message::part(li) {
        width: 100%;
        margin: 0;
        border-radius: var(--border-radius) var(--border-radius) 0 0;
      }
      :host > section > #reply-controls {
        --h4-margin: 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: sticky;
        top: 0;
        background-color: var(--background-color);
        mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 80%, rgba(0, 0, 0, 0) 100%);
        z-index: 1;
      }
      /* width */
      ::-webkit-scrollbar {
        width: 5px;
      }
      /* Track */
      ::-webkit-scrollbar-track {
        background: #f1f1f1; 
      }
      /* Handle */
      ::-webkit-scrollbar-thumb {
        background: #888; 
      }
      /* Handle on hover */
      ::-webkit-scrollbar-thumb:hover {
        background: #555; 
      }
      @media only screen and (max-width: _max-width_) {
        :host > div > textarea {
          min-height: 3.8em;
        }
      }
    `
    return this.fetchTemplate()
  }

  /**
   * fetches the template
   */
  fetchTemplate () {
    /** @type {import("../../../../event-driven-web-components-prototypes/src/Shadow.js").fetchCSSParams[]} */
    const styles = [
      {
        path: `${this.importMetaUrl}../../../../web-components-toolbox/src/css/reset.css`, // no variables for this reason no namespace
        namespace: false
      },
      {
        path: `${this.importMetaUrl}../../../../web-components-toolbox/src/css/style.css`, // apply namespace and fallback to allow overwriting on deeper level
        namespaceFallback: true
      }
    ]
    return this.fetchCSS(styles)
  }

  /**
  * renders the html
  *
  * @return {Promise<void>}
  */
  renderHTML () {
    this.html = /* html */`
      <section id="reply-to"></section>
      <div>
        <div id="inline-buttons">
          <emoji-button></emoji-button>
          <chat-a-key-status hidden></chat-a-key-status>
        </div>
        <textarea enterkeyhint="enter" placeholder="type your message..." rows="2"></textarea>
        <wct-button id=send title=send namespace="button-primary-" click-no-toggle-active>
          <wct-icon-mdx title=send icon-url="../../../../../../img/icons/send-2.svg" size="1.5em" no-hover></wct-icon-mdx>
        </wct-button>
        <wct-icon-mdx id=wormhole title="Upload your files at wormhole and copy/paste the link into the chat to share..." icon-url="../../../../../../img/icons/file-upload.svg" size="3em"></wct-icon-mdx>
        <wct-icon-mdx id=jitsi title="Open voice call conversation" icon-url="../../../../../../img/icons/video.svg" size="3em"></wct-icon-mdx>
      </div>
    `
    return this.fetchModules([
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/atoms/button/Button.js?${Environment?.version || ''}`,
        name: 'wct-button'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}./emojis/EmojiButton.js?${Environment?.version || ''}`,
        name: 'emoji-button'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/atoms/iconMdx/IconMdx.js?${Environment?.version || ''}`,
        name: 'wct-icon-mdx'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}./keyStatus/KeyStatus.js?${Environment?.version || ''}`,
        name: 'chat-a-key-status'
      }
    ])
  }

  isTouchScreen () {
    // @ts-ignore
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0)
  }

  get isMobile () {
    return self.matchMedia(`(max-width: ${this.mobileBreakpoint})`).matches
  }

  get textarea () {
    return this.root.querySelector('textarea')
  }

  get buttons () {
    return this.root.querySelectorAll(':host > div > wct-button, :host > div > wct-icon-mdx')
  }

  get jitsiButton () {
    return this.root.querySelector('#jitsi')
  }

  get replyToSection () {
    return this.root.querySelector('#reply-to')
  }

  get chatMessageEl () {
    return this.replyToSection.querySelector('chat-m-message')
  }

  get replyClose () {
    return this.root.querySelector('#reply-close')
  }

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }
}
