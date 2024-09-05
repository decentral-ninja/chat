// @ts-check
import { Shadow } from '../../../../event-driven-web-components-prototypes/src/Shadow.js'

/* global CustomEvent */
/* global self */
/* global Environment */

export default class Input extends Shadow() {
  constructor (options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, ...options }, ...args)

    const wormholeUrl = 'https://wormhole.app/'

    this.sendEventListener = (event, input) => {
      this.dispatchEvent(new CustomEvent('yjs-chat-add', {
        detail: {
          input: input || event.composedPath()[0]
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))
    }

    this.inputEventListener = event => {
      this.textarea.style.height = 'auto'
      const emValue = this.textarea.scrollHeight / parseFloat(self.getComputedStyle(this.textarea).fontSize)
      this.textarea.style.height = emValue + 'em'
    }

    this.keyupEventListener = event => {
      if (!this.isTouchScreen() && event.key === 'Enter' && event.shiftKey === false) {
        this.textarea.value = this.textarea.value.substring(0, this.textarea.value.length - 1) // cut the last character of enter = \n off
        return this.sendEventListener(undefined, this.textarea)
      }
      if (event.key === 'Escape') return this.textarea.blur()
    }

    this.buttonClickEventListener = event => {
      switch (event.composedPath().find(node => (node.tagName === 'WCT-BUTTON')).getAttribute('id')) {
        case 'wormhole':
          self.open(wormholeUrl)
          break
        case 'send':
          this.sendEventListener(undefined, this.textarea)
          this.textarea.style.height = 'auto'
          break
      }
    }

    /* Put cursor into input on click of chat area */
    this.windowClickEventListener = event => {
      const target = event.composedPath()[0]
      if (target.classList.contains('pattern')) this.textarea.focus()
    }

    this.emojiClickedEventListener = event => (this.textarea.value += event.detail?.clickedEmoji || '')

    this.focusEventListener = async event => {
      try {
        const clipboardContents = await navigator.clipboard.read()
        for (const item of clipboardContents) {
          for (const mimeType of item.types) {
            if (mimeType === 'text/plain') {
              const blob = await item.getType('text/plain')
              const text = await blob.text()
              if (text.includes(wormholeUrl)) this.textarea.value += (this.textarea.value ? ' ' : '') + text
            }
          }
        }
      } catch (error) {
        console.warn(error)
      }
    }
  }

  connectedCallback () {
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
    this.sendButton.addEventListener('click', this.buttonClickEventListener)
    this.wormholeButton.addEventListener('click', this.buttonClickEventListener)
    this.root.addEventListener('keyup', this.keyupEventListener)
    this.textarea.addEventListener('input', this.inputEventListener)
    this.addEventListener('emoji-clicked', this.emojiClickedEventListener)
    self.addEventListener('click', this.windowClickEventListener)
    this.textarea.addEventListener('focus', this.focusEventListener)
  }

  disconnectedCallback () {
    this.sendButton.removeEventListener('click', this.buttonClickEventListener)
    this.wormholeButton.removeEventListener('click', this.buttonClickEventListener)
    this.root.removeEventListener('keyup', this.keyupEventListener)
    this.textarea.removeEventListener('input', this.inputEventListener)
    this.removeEventListener('emoji-clicked', this.emojiClickedEventListener)
    self.removeEventListener('click', this.windowClickEventListener)
    this.textarea.removeEventListener('focus', this.focusEventListener)
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
    return !this.textarea
  }

  /**
   * Renders the CSS
   *
   * @return {void}
   */
  renderCSS () {
    this.css = /* css */`
      :host {
        --button-primary-width: 100%;
        --button-primary-height: 100%;
        --button-primary-font-size: 1rem;
        --color-hover: var(--color-yellow);
        display: flex;
        width: 100%;
      }
      :host > textarea {
        flex-grow: 100;        
        font-size: max(16px, 1em); /* 16px ios mobile focus zoom fix */
        transition: height 0.3s ease-out;
        resize: none;
        padding-left: 2em;
        min-height: auto;
        max-height: 10em;
        overflow-y: auto;
        /*field-sizing: content; Coming soon: https://toot.cafe/@seaotta/111812940330557783*/
      }
      :host > wct-button {
        cursor: pointer;
        flex-grow: 1;
        min-height: 100%;
        word-break: break-all;
        padding: 0.1em 1em;
      }
      :host > wct-button:last-of-type {
        --button-primary-background-color-custom: var(--color-wormhole);
        --button-primary-border-color: var(--color-wormhole);
        padding: 0;
      }
      :host > wct-button#wormhole {
        flex-grow: 1;
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
    `
  }

  /**
  * renders the html
  *
  * @return {Promise<void>}
  */
  renderHTML () {
    this.html = /* html */`
      <emoji-button></emoji-button>
      <textarea enterkeyhint="enter" placeholder="type your message..." rows="2"></textarea>
      <wct-button id=send namespace="button-primary-" request-event-name="submit-room-name" click-no-toggle-active>send</wct-button>
      <wct-button id=wormhole title="Upload your files at wormhole and copy/paste the link into the chat to share..." namespace="button-primary-" request-event-name="submit-room-name" click-no-toggle-active>&#43; files</wct-button>
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
      }
    ])
  }

  isTouchScreen () {
    // @ts-ignore
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0)
  }

  get textarea () {
    return this.root.querySelector('textarea')
  }

  get sendButton () {
    return this.root.querySelector('#send')
  }

  get wormholeButton () {
    return this.root.querySelector('#wormhole')
  }
}
