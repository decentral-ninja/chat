// @ts-check
import { Shadow } from '../../../../event-driven-web-components-prototypes/src/Shadow.js'

/* global CustomEvent */
/* global self */
/* global Environment */

export default class Input extends Shadow() {
  constructor(options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, ...options }, ...args)
    this.editorDefaultHeight = 2.625

    this.sendEventListener = (event) => {
      if(this.editorHTML !== "<div><br></div>"){
      this.dispatchEvent(new CustomEvent('yjs-input', {
        detail: {
          input: this.editorHTML
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))
     this.clearEditor()
    }
    }

    this.inputEventListener = event => {
       this.updateEditorHeight()
      // TODO: CHANGE EmojiPicker Offset to Bottom.
    }

    this.keyupEventListener = event => {
      if (!this.isTouchScreen() && event.key === 'Enter' && event.shiftKey === false) {
        //this.editor.value = this.editor.value.substring(0, this.editor.value.length - 1) // cut the last character of enter = \n off
        return this.sendEventListener(undefined)
      }
      if (event.key === 'Escape') return this.editor.blur()
      switch (event.composedPath()[0].getAttribute('id')) {
        case 'send':
          this.sendEventListener(undefined)
          //this.updateEditorHeight()
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
      if (target.classList.contains('pattern') || target.nodeName === 'YJS-CHAT-UPDATE') this.editor.focus()
    }

    this.emojiClickedEventListener = event => {
      console.log(event.detail)
      this.editor.value += event.detail?.clickedEmoji || ''
    }
  }

  connectedCallback() {
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
    this.root.addEventListener('click', this.keyupEventListener)
    this.root.addEventListener('keyup', this.keyupEventListener)
    this.editor.addEventListener('focus', this.focusEventListener)
    this.editor.addEventListener('input', this.inputEventListener)
    this.addEventListener('emoji-clicked', this.emojiClickedEventListener)
    self.addEventListener('click', this.windowClickEventListener)

   

  }

  disconnectedCallback() {
    this.root.removeEventListener('click', this.keyupEventListener)
    this.root.removeEventListener('keyup', this.keyupEventListener)
    this.editor.removeEventListener('focus', this.focusEventListener)
    this.editor.removeEventListener('input', this.inputEventListener)
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
    return !this.editor
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
      :host > div#editor-container .ql-editor {
      height: unset;
      }
      :host > div#editor-container {
        flex-grow: 15;        
        font-size: max(16px, 1em); /* 16px ios mobile focus zoom fix */
        transition: height 0.3s ease-out;
          
        min-height: 3em; /*TODO: delete and update as before editor */
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
 * @return {void}
 */
  renderHTML() {
    this.html = /* html */`

   <!-- <emoji-button></emoji-button> -->
        <div id="toolbar-container"></div>
        <div id="editor-container">
       
        </div>
        <button id="send">send</button>
      
    `;

      // @ts-ignore
      this.Quill = new Quill(this.root.querySelector('div#editor-container'), {
        toolbar: {
           container: this.root.querySelector('div#toolbar-container'),
           handlers: {
              bold: function() {  },
              italic: function() {  },
              // Add only the necessary buttons
           },
        },
         /*toolbar: {
           container: this.root.querySelector('div#toolbar-container'),
           font: [],
           header: [1, 2, 3, 4, 5, 6, false],
           align: [],
           bold: true,
           italic: true,
           underline: true,
           color: [],
           background: [],
           list: 'bullet',
           link: true,
         },
         placeholder: 'start typing...',*/
         theme: 'snow'  
       });
     
     
     // Fetch additional modules if needed
     this.fetchModules([
       {
             // @ts-ignore
         path: `${this.importMetaUrl}./emojiMart/EmojiButton.js?${Environment?.version || ''}`,
         name: 'emoji-button'
       }
     ])

  }

  updateEditorHeight() {
    this.editor.style.height = 'auto'

    const emValue = this.editor.scrollHeight / parseFloat(self.getComputedStyle(this.editor).fontSize)
    this.editor.style.height = isNaN(emValue) ? this.editorDefaultHeight + 'em' : emValue + 'em'
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
    quillScript.setAttribute('src', `${this.importMetaUrl}./quillRichText/quill.js`);
    quillScript.setAttribute('crossorigin', 'anonymous');
    quillScript.onerror = (error) => {
      console.error('Error loading Quill script:', error);
      reject(error);
    };
    /*const pasteSmartQuillScript = document.createElement('script');
    pasteSmartQuillScript.setAttribute('type', 'text/javascript');
    pasteSmartQuillScript.setAttribute('async', '');
    pasteSmartQuillScript.setAttribute('src', `https://unpkg.com/quill-paste-smart@latest/dist/quill-paste-smart.js`);
    pasteSmartQuillScript.setAttribute('crossorigin', 'anonymous');
    pasteSmartQuillScript.onerror = (error) => {
      console.error('Error loading Quill script:', error);
      reject(error);
    };*/
    // @ts-ignore
    quillScript.onload = () => resolve(self.Quill)
    // Append the script element to the document body.
    this.shadowRoot.appendChild(quillScript);
   // this.shadowRoot.appendChild(pasteSmartQuillScript);
    this.fetchCSS([{
      // @ts-ignore
      path: `${this.importMetaUrl}./quillRichText/quill.snow.css`,
    }])
  }));
}


  get editor() {
    return this.root.querySelector('div#editor-container')
  }

  clearEditor () {
    this.Quill?.setHTML('')
  }

  get editorHTML () {
    return this.Quill?.getHTML() || ''
  }
}
