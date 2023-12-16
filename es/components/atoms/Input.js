// @ts-check
import { Shadow } from '../../../../event-driven-web-components-prototypes/src/Shadow.js'

/* global CustomEvent */
/* global self */
/* global Environment */

export default class Input extends Shadow() {
  constructor(options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, ...options }, ...args)
    this.textareaDefaultHeight = 2.625
    //TODO: remove workaround so it only renders once
    this.htmlRendered = false
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

    this.inputEventListener = event => {
      // this.updateTextareaHeight()
      // TODO: CHANGE EmojiPicker Offset to Bottom.
    }

    this.keyupEventListener = event => {
      if (!this.isTouchScreen() && event.key === 'Enter' && event.shiftKey === false) {
        this.textarea.value = this.textarea.value.substring(0, this.textarea.value.length - 1) // cut the last character of enter = \n off
        return this.sendEventListener(undefined, this.textarea)
      }
      if (event.key === 'Escape') return this.textarea.blur()
      switch (event.composedPath()[0].getAttribute('id')) {
        case 'peer-web-site':
          self.open('https://peerweb.site/')
          break
        case 'send':
          this.sendEventListener(undefined, this.textarea)
          //this.updateTextareaHeight()
          break
      }
    }

    this.focusEventListener = event => setTimeout(() => this.dispatchEvent(new CustomEvent('main-scroll', {
      bubbles: true,
      cancelable: true,
      composed: true
    })), 300)

    /* Put cursor into input on click of chat area */
    this.windowClickEventListener = event => {
      const target = event.composedPath()[0]
      if (target.classList.contains('pattern') || target.nodeName === 'YJS-CHAT-UPDATE') this.textarea.focus()
    }

    this.emojiClickedEventListener = event => {
      console.log(event.detail)
      this.textarea.value += event.detail?.clickedEmoji || ''
    }
  }

  connectedCallback() {
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
    this.root.addEventListener('click', this.keyupEventListener)
    this.root.addEventListener('keyup', this.keyupEventListener)
    this.textarea.addEventListener('focus', this.focusEventListener)
    this.textarea.addEventListener('input', this.inputEventListener)
    this.addEventListener('emoji-clicked', this.emojiClickedEventListener)
    self.addEventListener('click', this.windowClickEventListener)
    this.connectedCallbackOnce()
  }

  connectedCallbackOnce() {
    self.addEventListener('message', event => {
      if (!event.data.title || !event.data.href || event.origin !== 'https://peerweb.site') return
      this.textarea.value = `${event.data.title} 👉 ${event.data.href} <span class=peer-web-site>(temporary hosted media content @peerweb.site)</span></a>`
      this.sendEventListener(undefined, this.textarea)
    })
    this.connectedCallbackOnce = () => { }
  }

  disconnectedCallback() {
    this.root.removeEventListener('click', this.keyupEventListener)
    this.root.removeEventListener('keyup', this.keyupEventListener)
    this.textarea.removeEventListener('focus', this.focusEventListener)
    this.textarea.removeEventListener('input', this.inputEventListener)
    this.removeEventListener('emoji-clicked', this.emojiClickedEventListener)
    self.removeEventListener('click', this.windowClickEventListener)
  }

  /**
   * Evaluates if a render of CSS is necessary
   *
   * @return {boolean}
   */
  shouldRenderCSS() {    
    return !this.root.querySelector(`:host > style[_css], ${this.tagName} > style[_css]`)
  }

  /**
   * Evaluates if a render of HTML is necessary
   *
   * @return {boolean}
   */
  shouldRenderHTML() {
    return !this.quillRichText
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
        font-size: max(16px, 1em); /* 16px ios mobile focus zoom fix */
        transition: height 0.3s ease-out;
        resize: none;
        padding-left: 2.5em;        
        max-height: 10em;
        overflow-y: auto; 
      }     
      :host > div#editor {
        flex-grow: 15;        
        font-size: max(16px, 1em); /* 16px ios mobile focus zoom fix */
        transition: height 0.3s ease-out;
        padding-left: 2.5em;       
        min-height: 3em; /*TODO: delete and update as before textarea */
        max-height: 10em;
        overflow-y: auto; 
        border: 1px solid #000000;
        background-color: #ffffff;
      }     
    
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
  renderHTML() {
    if(!this.htmlRendered){
    this.html = /* html */ `
    <emoji-button></emoji-button> 
  <!-- Create the toolbar container -->
  <div id="toolbar">
    <button class="ql-bold">Bold</button>
    <button class="ql-italic">Italic</button>
   
  </div>
  
  <!-- Create the editor container -->
  <div id="editor" contenteditable="true">
  <p>Hello World!</p>
      <p>Some initial <strong>bold</strong> text</p>
      <p><br></p>
</div>
<button id="send">send</button>
  
  <!--
  HIDDEN BTNS
  <emoji-button></emoji-button> 
 <textarea placeholder="type your message..." rows="2"></textarea>
  <button disabled id="peer-web-site">&#43; attach media</button>
  <button disabled id="voiceRecord">&#9210; record</button>-->
`;

this.loadDependency().then(() => {
  // @ts-ignore
  this.quillRichText = new Quill(this.root.querySelector('div#editor'), {
    /*theme: 'snow'*/
    'toolbar': { container: this.root.querySelector('div#toolbar') },
    'link-tooltip': true
  });
  //this.quillRichText.getModule('toolbar', { container: this.root.querySelector('div#toolbar') });


  this.textarea.appendChild(this.quillRichText.root);
});
    this.htmlRendered = true
  }

    // Fetch additional modules if needed
    return this.fetchModules([
      {
            // @ts-ignore
        path: `${this.importMetaUrl}./emojiMart/EmojiButton.js?${Environment?.version || ''}`,
        name: 'emoji-button'
      }
    ]);
  }

  updateTextareaHeight() {
    this.textarea.style.height = 'auto'

    const emValue = this.textarea.scrollHeight / parseFloat(self.getComputedStyle(this.textarea).fontSize)
    this.textarea.style.height = isNaN(emValue) ? this.textareaDefaultHeight + 'em' : emValue + 'em'
  }

  isTouchScreen() {
    // @ts-ignore
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0)
  }

 /**
 * Fetches the Quill dependency and resolves a promise when loaded.
 * @returns {Promise<void>}
 */
loadDependency() {
  // Make it global to self so that other components can know when it has been loaded.
  return this._loadQuillDependency || (this._loadQuillDependency = new Promise((resolve, reject) => {
    // Load Quill JavaScript file.
    const quillScript = document.createElement('script');
    quillScript.setAttribute('type', 'text/javascript');
    quillScript.setAttribute('async', '');
    quillScript.setAttribute('src', `${this.importMetaUrl}/quillRichText/quill.js`);
    quillScript.setAttribute('crossorigin', 'anonymous');
    quillScript.onerror = (error) => {
      console.error('Error loading Quill script:', error);
      reject(error);
    };
    /*
    quillScript.onload = () => {
      // Quill JavaScript has loaded, now load the CSS file.
      const quillStylesheet = document.createElement('link');
      quillStylesheet.setAttribute('rel', 'stylesheet');
      quillStylesheet.setAttribute('type', 'text/css');
      quillStylesheet.setAttribute('href', `${this.importMetaUrl}/quillRichText/quill.snow.css`);
      quillStylesheet.onload = () => resolve();

      // Append the link element to the document head.
      this.shadowRoot.appendChild(quillStylesheet);
    };*/

    // Append the script element to the document body.
    this.shadowRoot.appendChild(quillScript);
  }));
}


  get textarea() {
    return this.root.querySelector('div#editor')
  }
}
