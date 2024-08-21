// @ts-check
import { Shadow } from '../../../../event-driven-web-components-prototypes/src/Shadow.js'

/* global CustomEvent */
/* global self */
/* global Environment */

export default class Input extends Shadow() {
  constructor (options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, ...options }, ...args)

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
      // TODO: CHANGE EmojiPicker Offset to Bottom.
    }

    this.keyupEventListener = event => {
      if (!this.isTouchScreen() && event.key === 'Enter' && event.shiftKey === false) {
        const textarea = this.root.querySelector('textarea')
        textarea.value = textarea.value.substring(0, textarea.value.length - 1) // cut the last character of enter = \n off
        return this.sendEventListener(undefined, this.root.querySelector('textarea'))
      }
      if (event.key === 'Escape') return this.textarea.blur()
      switch (event.composedPath()[0].getAttribute('id')) {
        case 'wormhole':
          self.open('https://wormhole.app/')
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
  }

  connectedCallback () {
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
    this.root.addEventListener('click', this.keyupEventListener)
    this.root.addEventListener('keyup', this.keyupEventListener)
    this.textarea.addEventListener('input', this.inputEventListener)
    this.addEventListener('emoji-clicked', this.emojiClickedEventListener)
    self.addEventListener('click', this.windowClickEventListener)
  }

  disconnectedCallback () {
    this.root.removeEventListener('click', this.keyupEventListener)
    this.root.removeEventListener('keyup', this.keyupEventListener)
    this.textarea.removeEventListener('input', this.inputEventListener)
    this.removeEventListener('emoji-clicked', this.emojiClickedEventListener)
    self.removeEventListener('click', this.windowClickEventListener)
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
        display: flex;
        width: 100%;
      }
      :host > textarea {
        flex-grow: 15;        
        font-size: max(16px, 1em); /* 16px ios mobile focus zoom fix */
        transition: height 0.3s ease-out;
        resize: none;
        padding-left: 2em;
        min-height: auto;
        max-height: 10em;
        overflow-y: auto;
        /*field-sizing: content; Coming soon: https://toot.cafe/@seaotta/111812940330557783*/
      }
      :host > button {
        cursor: pointer;
        flex-grow: 1;
        min-height: 100%;
        word-break: break-all;
        
        padding: 0.1em 1em;
      }
      :host > button#wormhole {
        flex-grow: 2;
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
      <button id=send>send</button>
      <button id=wormhole>&#43; media</button>
      <!--<button disabled id=voiceRecord>&#9210; record</button>-->
    `
    return this.fetchModules([
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
}
