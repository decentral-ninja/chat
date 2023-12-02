/* global HTMLElement */
/* global CustomEvent */
/* global self */

export default class Input extends HTMLElement {
  constructor (...args) {
    super(...args)

    this.attachShadow({ mode: 'open' })
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
        }
        :host > textarea {
          flex-grow: 15;
          height: 3em;
          font-size: max(16px, 1em); /* 16px ios mobile focus zoom fix */
          transition: height 0.3s ease-out;
          resize: none;
        }
        :host > textarea:focus {
          height: max(25dvh, 6em);
        }
        :host > button {
          cursor: pointer;
          flex-grow: 1;
          min-height: 100%;
          word-break: break-all;
          background-color: lightblue;
          border-radius: 25px;
          padding: 0.5em 2em;
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

        

      </style>
      <textarea placeholder="type your message..."></textarea>
      <button id=send>send</button>
      <button id=peer-web-site>&#10000; attach media</button>
    `
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
      if (event.key === 'Enter' && event.shiftKey === false) return this.sendEventListener(undefined, this.shadowRoot.querySelector('textarea'))
      if (event.key === 'Escape') return this.shadowRoot.querySelector('textarea').blur()
      switch (event.composedPath()[0].getAttribute('id')) {
        case 'peer-web-site':
          self.open('https://peerweb.site/')
          break
        case 'send':
          this.sendEventListener(undefined, this.shadowRoot.querySelector('textarea'))
          break
      }
    }
    this.focusEventListener = event => setTimeout(() => this.dispatchEvent(new CustomEvent('main-scroll', {
      bubbles: true,
      cancelable: true,
      composed: true
    })), 300)
  }

  connectedCallback () {
    this.shadowRoot.addEventListener('click', this.clickEventListener)
    this.shadowRoot.addEventListener('keyup', this.clickEventListener)
    this.shadowRoot.querySelector('textarea').addEventListener('focus', this.focusEventListener)
    this.connectedCallbackOnce()
  }

  connectedCallbackOnce () {
    self.addEventListener('message', event => {
      if (!event.data.title || !event.data.href || event.origin !== 'https://peerweb.site') return
      this.shadowRoot.querySelector('textarea').value = `${event.data.title} 👉 ${event.data.href} <span class=peer-web-site>(temporary hosted media content @peerweb.site)</span></a>`
      this.sendEventListener(undefined, this.shadowRoot.querySelector('textarea'))
    })
    this.connectedCallbackOnce = () => {}
  }

  disconnectedCallback () {
    this.shadowRoot.removeEventListener('click', this.clickEventListener)
    this.shadowRoot.removeEventListener('keyup', this.clickEventListener)
    this.shadowRoot.querySelector('textarea').removeEventListener('focus', this.focusEventListener)
  }
}
