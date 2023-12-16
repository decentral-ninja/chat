// @ts-check OLD VERSION! NEW ONE IS IN ATOMS 
/*--------------------------------------------------
*/
import { Shadow } from '../../../../event-driven-web-components-prototypes/src/Shadow.js'

/* global CustomEvent */
/* global self */

export default class Input extends Shadow() {
  constructor (...args) {
    super(...args)

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
      if (!this.isTouchScreen() && event.key === 'Enter' && event.shiftKey === false) {
        const textarea = this.root.querySelector('textarea')
        textarea.value = textarea.value.substring(0, textarea.value.length - 1) // cut the last character of enter = \n off
        return this.sendEventListener(undefined, this.root.querySelector('textarea'))
      }
      if (event.key === 'Escape') return this.root.querySelector('textarea').blur()
      switch (event.composedPath()[0].getAttribute('id')) {
        case 'peer-web-site':
          self.open('https://peerweb.site/')
          break
        case 'send':
          this.sendEventListener(undefined, this.root.querySelector('textarea'))
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
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
    this.addEventListener('click', this.clickEventListener)
    this.addEventListener('keyup', this.clickEventListener)
    this.root.querySelector('textarea').addEventListener('focus', this.focusEventListener)
    this.connectedCallbackOnce()
  }

  connectedCallbackOnce () {
    self.addEventListener('message', event => {
      if (!event.data.title || !event.data.href || event.origin !== 'https://peerweb.site') return
      this.root.querySelector('textarea').value = `${event.data.title} 👉 ${event.data.href} <span class=peer-web-site>(temporary hosted media content @peerweb.site)</span></a>`
      this.sendEventListener(undefined, this.root.querySelector('textarea'))
    })
    this.connectedCallbackOnce = () => {}
  }

  disconnectedCallback () {
    this.removeEventListener('click', this.clickEventListener)
    this.removeEventListener('keyup', this.clickEventListener)
    this.root.querySelector('textarea').removeEventListener('focus', this.focusEventListener)
  }

  /**
   * evaluates if a render is necessary
   *
   * @return {boolean}
   */
  shouldRenderCSS () {
    return !this.root.querySelector(`:host > style[_css], ${this.tagName} > style[_css]`)
  }

  /**
   * evaluates if a render is necessary
   *
   * @return {boolean}
   */
  shouldRenderHTML () {
    return !this.textarea
  }

  /**
   * renders the m-Details css
   *
   * @return {void}
   */
  renderCSS () {
    this.css = /* css */` 
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
      }
      :host > button#peer-web-site {
        flex-grow: 2;
      }
      @media only screen and (max-width: _max-width_) {
        
      }
    `
  }

  /**
   * renders the html
   *
   * @return {void}
   */
  renderHTML () {
    this.html = /* html */`
      <textarea placeholder="type your message..."></textarea>
      <button id=send>send</button>
      <button id=peer-web-site>&#10000; attach</button>
    `
  }

  isTouchScreen () {
    // @ts-ignore
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0)
  }

  get textarea () {
    return this.root.querySelector('textarea')
  }
}
