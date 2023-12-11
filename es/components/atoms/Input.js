import { Shadow } from '../../../../event-driven-web-components-prototypes/src/Shadow.js';

/* global HTMLElement */
/* global CustomEvent */
/* global self */

export default class Input extends Shadow() {
  constructor(options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, ...options }, ...args);

    this.maxHeight = 12.5;

    this.sendEventListener = (event, input) => {
      this.dispatchEvent(new CustomEvent('yjs-input', {
        detail: {
          input: input || event.composedPath()[0]
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))
    }

    this.clickEventListener = event => {
      if (event.key === 'Enter' && event.shiftKey === false) return this.sendEventListener(undefined, this.textarea)
      if (event.key === 'Escape') return this.textarea.blur()
      switch (event.composedPath()[0].getAttribute('id')) {
        case 'peer-web-site':
          self.open('https://peerweb.site/')
          break
        case 'send':
          this.sendEventListener(undefined, this.textarea)
          break
      }
    }

    this.keyupEventListener = event => {
      this.resizeTextarea();
    };

    this.focusEventListener = event => setTimeout(() => this.dispatchEvent(new CustomEvent('main-scroll', {
      bubbles: true,
      cancelable: true,
      composed: true
    })), 300)

     /*Put cursor into input on click of chat area*/
     this.windowClickEventListener = event => {     
        const target = event.composedPath()[0]
        if (target.classList.contains('pattern') || target.nodeName === 'YJS-CHAT-UPDATE') this.textarea.focus();
    }

    this.emojiClickedEventListener = event => (this.textarea.value += event.detail?.clickedEmoji || '')
  }

  connectedCallback () {
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
    this.root.addEventListener('click', this.clickEventListener)
    this.root.addEventListener('keyup', this.clickEventListener)
    this.root.addEventListener('keyup', this.keyupEventListener)
    this.textarea.addEventListener('focus', this.focusEventListener)
    this.addEventListener('emoji-clicked', this.emojiClickedEventListener)
    self.addEventListener('click', this.windowClickEventListener);



    this.connectedCallbackOnce()
  }

  connectedCallbackOnce () {
    self.addEventListener('message', event => {
      if (!event.data.title || !event.data.href || event.origin !== 'https://peerweb.site') return
      this.textarea.value = `${event.data.title} 👉 ${event.data.href} <span class=peer-web-site>(temporary hosted media content @peerweb.site)</span></a>`
      this.sendEventListener(undefined, this.textarea)
    })
    this.connectedCallbackOnce = () => {}
  }

  disconnectedCallback () {
    this.root.removeEventListener('click', this.clickEventListener)
    this.root.removeEventListener('keyup', this.clickEventListener)
    this.root.removeEventListener('keyup', this.keyupEventListener)
    this.textarea.removeEventListener('focus', this.focusEventListener)
    this.removeEventListener('emoji-clicked', this.emojiClickedEventListener)
    self.removeEventListener('click', this.windowClickEventListener)
  }

  /**
   * Evaluates if a render of CSS is necessary
   *
   * @return {boolean}
   */
  shouldRenderCSS() {
    return !this.root.querySelector(`:host > style[_css], ${this.tagName} > style[_css]`);
  }

  /**
   * Evaluates if a render of HTML is necessary
   *
   * @return {boolean}
   */
  shouldRenderHTML() {
    return !this.textarea;
  }

  /**
   * Renders the CSS
   *
   * @return {void}
   */
  renderCSS() {
    this.css = /* css */`
      :host {
        display: flex;
      }
      :host > textarea {
        flex-grow: 15;
        height: auto;
        font-size: max(16px, 1em); /* 16px ios mobile focus zoom fix */
        transition: height 0.3s ease-out;
        resize: none;
        padding-left: 2em;

        max-height: ${this.maxHeight}em;
        overflow-y: auto; 
      }
      /*:host > textarea:focus {
        height: max(25dvh, 6em);
      }*/
      :host > button {
        cursor: pointer;
        flex-grow: 1;
        min-height: 100%;
        word-break: break-all;
        
        padding: 0.1em 1em;
      }
      :host > button#peer-web-site {
        flex-grow: 2;
      }
      /* width */
      ::-webkit-scrollbar {
        width: 10px;
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
    `;
  }

  /**
  * renders the html
  *
  * @return {Promise<void>}
  */
  renderHTML () {
    this.html = /* html */`
      <emoji-button></emoji-button>
      <textarea placeholder="type your message..." id="userInputTextArea"></textarea>
      <button id=send>send</button>
      <button disabled id=peer-web-site>&#43; attach media</button>
      <!--<button disabled id=voiceRecord>&#9210; record</button>-->
    `
    return this.fetchModules([
      {
        path: `${this.importMetaUrl}./emojis/EmojiButton.js`,
        name: 'emoji-button'
      }
    ])
  }

  get textarea () {
    return this.root.querySelector('textarea')
  }

  resizeTextarea() {
    this.textarea.style.height = 'auto'; // Reset height to auto to calculate scrollHeight
    this.textarea.style.height = Math.min(this.textarea.scrollHeight, this.maxHeight) + 'em';
  }
}
