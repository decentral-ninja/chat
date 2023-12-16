// @ts-check
import { Shadow } from '../../../../../event-driven-web-components-prototypes/src/Shadow.js'

/* global Environment */

/**
 * EmojiButton for adding emojis to text in a chat
 *
 * @export
 * @class EmojiButton
 * @type {CustomElementConstructor}
 */
export default class EmojiButton extends Shadow() {
  constructor (options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, ...options }, ...args)

    this.toggleEmojiPicker = event => {
      const emojiPicker = this.root.querySelector('emoji-picker')
      // Toggle visibility of the EmojiPicker
      emojiPicker.classList.toggle('visible')
    }
  }

  connectedCallback () {
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
    this.root.querySelector('button').addEventListener('click', this.toggleEmojiPicker)
  }

  disconnectedCallback () {
    this.root.querySelector('button').removeEventListener('click', this.toggleEmojiPicker)
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
    return !this.emojiButton
  }

  /**
   * Renders the CSS
   *
   * @return {void}
   */
  renderCSS () {
    this.css = /* css */`
      :host {
   
      }
      :host > button {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 2.5em;
        margin-left: -0.1em;
        position: absolute;
      }
    `
  }

  /**
   * Renders the HTML
   *
   * @return {Promise<void>}
   */
  renderHTML () {
    this.html = /* html */`
      <button id='emojiPickerToggler'>&#128515;</button> <!-- Unicode for smiling face emoji -->
      <emoji-picker></emoji-picker>
    `
    return this.fetchModules([
      {
        // @ts-ignore
        path: `${this.importMetaUrl}./EmojiMartPicker.js?${Environment?.version || ''}`,
        name: 'emoji-picker'
      }
    ])
  }

  get emojiButton () {
    return this.root.querySelector('button')
  }
}
