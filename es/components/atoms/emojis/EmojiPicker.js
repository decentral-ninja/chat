// @ts-check
import { Shadow } from '../../../../../event-driven-web-components-prototypes/src/Shadow.js'

/* global self */

/**
 * Emoji Picker
 *
 * @export
 * @class EmojiPicker
 * @type {CustomElementConstructor}
 * @attribute {
 *  {string} src used for the image source
 *  {string} href used for the link reference
 * }
 */
export default class EmojiPicker extends Shadow() {
  static get observedAttributes () {
    return ['selected-emoji']
  }

  constructor (options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, tabindex: 'no-tabindex', ...options }, ...args)

    /* TODO: ADD RANGES & ADD MORE EMOJIS https://symbl.cc/en/unicode/blocks/emoticons/ */
    this.emojiCategories = [
      { id: 'favoritesGlobal', icon: '⭐', ranges: [], list: [0x1F44D, 0x1F44E, 0x1F44F, 0x1F91D, 0x1F64F, 0x1F60D, 0x1F970, 0x2764, 0x1F62D, 0x2764, 0x1F602, 0x1F97A, 0x1F923, 0x2728, 0x1F60D, 0x1F60D, 0x1F970, 0x1F60A, 0x1F614, 0x1F629, 0x1F673, 0x1F615, 0x1F631, 0x1F60E, 0x1F62F, 0x1F4A9, 0x1F614, 0x1F609, 0x1F62E, 0x1F621, 0x1F60B, 0x1F634, 0x1F62B, 0x1F633] },
      { id: 'emojis', icon: '😀', ranges: [{ start: 0x1F600, end: 0x1F64F }], list: [0x1F47A, 0x1F479, 0x1F921, 0x1F916, 0xF4A9, 0x1F47D, 0x1F47B] },
      { id: 'animals', icon: '🐰', ranges: [], list: [0x1F436, 0x1F43A, 0x1F431, 0x1F42D, 0x1F439, 0x1F430, 0x1F438, 0x1F42F, 0x1F428, 0x1F43B, 0x1F437, 0x1F43D, 0x1F42E, 0x1F417, 0x1F435] },
      { id: 'food-drinks', icon: '🍔', ranges: [], list: [0x1F353, 0x1F352, 0x1F351, 0x1F34B, 0x1F34A, 0x1F34D, 0x1F349, 0x1F348, 0x1F34E, 0x1F347, 0x1F34C, 0x1F346, 0x1F350, 0x1F345, 0x1F34F, 0x1F95D, 0x1F965, 0x1F96D, 0x1F330, 0x1F336, 0x1F446, 0x1F444, 0x1F3D, 0x1F1C4, 0x1F1E4, 0x1F4C4, 0x1F5D4, 0x1F51, 0x1F55, 0x1F5C5, 0x1F554, 0x1F552, 0x1F56C, 0x1F666, 0x1F345, 0x1F346, 0x1F33D, 0x1F360, 0x1F347, 0x1F348, 0x1F349, 0x1F34A, 0x1F34B, 0x1F34C, 0x1F34D, 0x1F34E, 0x1F34F, 0x1F350, 0x1F351, 0x1F352, 0x1F353, 0x1F354, 0x1F355, 0x1F356, 0x1F357, 0x1F358, 0x1F359, 0x1F35A, 0x1F35B, 0x1F35C, 0x1F35D, 0x1F35E, 0x1F35F, 0x1F361, 0x1F362, 0x1F363, 0x1F364, 0x1F365, 0x1F366, 0x1F367, 0x1F368, 0x1F369, 0x1F36A, 0x1F36B, 0x1F36C, 0x1F36D, 0x1F36E, 0x1F36F, 0x1F370, 0x1F371, 0x1F372, 0x1F373, 0x1F374, 0x1F375, 0x1F376, 0x1F377, 0x1F378, 0x1F379, 0x1F37A, 0x1F37B, 0x1F37C] },
      { id: 'activities', icon: '⚽', ranges: [{ start: 0x1FA80, end: 0x1FA86 }], list: [0x126F3] },
      { id: 'travel', icon: '🚗', ranges: [{ start: 0x1F680, end: 0x1F6FF }] },
      { id: 'objects', icon: '🛋️', ranges: [{ start: 0x1F6C0, end: 0x1F6CF }] },
      { id: 'symbols', icon: '❤', ranges: [{ start: 0x1F300, end: 0x1F5FF }], list: [0x1F49F, 0x1F4AD, 0x1F49E, 0x1F48C, 0x1F4A2, 0x1F493, 0x1F4A3, 0x1F4AF, 0x1F495, 0x1F48B, 0x1F4A8, 0x1F4A6, 0x1F4AB, 0x1F497, 0x1F494, 0x1F498, 0x1F49A, 0x1F499, 0x1F49C, 0x1F49B, 0x1F4A5, 0x1F496, 0x1F4AC, 0x1F4A3, 0x1F4A4, 0x1F49D, 0x1F4DF, 0x1F473, 0x1F4E8, 0x1F4A4, 0x1F0CF, 0x1F0E8, 0x1F1A4, 0x1F1E4, 0x1F3A4, 0x1F3A1, 0x1F0EE, 0x1F0ED, 0x1F004, 0x2764, 0x2763] }
    /* { id: 'flags', icon: '🏳️', ranges: [{ start: 0x1F1E6, end: 0x1F1FF }] } */
    ]

    this.transitionDuration = this.getAttribute('transition-duration') || 400

    /**
   * Handles the click event on category emoji buttons.
   *
   * @param {any} event
   */
    this.categoryClickEventListener = event => {
      const selectedCategory = this.emojiCategories.find(category => category.id === event.target.id)

      if (selectedCategory) {
        this.emojiList.innerHTML = ''

        if (selectedCategory.ranges) {
        // console.log('Rendering from ranges:', selectedCategory.ranges);

          // Render emojis from the ranges
          const emojisHTMLRange = selectedCategory.ranges
            .map(range => Array.from({ length: range.end - range.start + 1 }, (_, index) => {
              const emojiCode = String.fromCodePoint(range.start + index)
              return `<button emoji="${emojiCode}">${emojiCode}</button>`
            }).join(''))
            .join('')
          this.emojiList.innerHTML += emojisHTMLRange
        }

        if (selectedCategory.list) {
        // console.log('Rendering from list:', selectedCategory.list);
        // Render emojis from the list
          const emojisHTMLList = selectedCategory.list.map(emojiCode => `<button emoji="${String.fromCodePoint(emojiCode)}">${String.fromCodePoint(emojiCode)}</button>`).join('')

          this.emojiList.innerHTML += emojisHTMLList
        }
      }
    }

    /**
 * Handles the click event on an emoji
 *
 * @param {any} event
 */
    this.emojiClickEventListener = event => {
      const clickedEmoji = event.target.getAttribute('emoji')

      if (clickedEmoji) {
        this.dispatchEvent(new CustomEvent('emoji-clicked', {
          detail: {
            clickedEmoji
          },
          bubbles: true,
          cancelable: true,
          composed: true
        }))
      }
    }
    /* Toggle EmojiPicker while */
    this.windowClickEventListener = event => {
      if (this.classList.contains('visible')) {
        const target = event.composedPath()[0]
        if (this !== target && target.id !== 'emojiPickerToggler' && target.id !== 'emojiList' && !Array.from(this.emojiNav.children).includes(target) && !Array.from(this.emojiList.children).includes(target)) this.classList.toggle('visible')
      }
    }
  }

  connectedCallback () {
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
    this.emojiNav.addEventListener('click', this.categoryClickEventListener)
    this.emojiList.addEventListener('click', this.emojiClickEventListener)
    self.addEventListener('click', this.windowClickEventListener)
    /* Gets first category button to display emoji's */
    const firstCategoryButton = this.emojiNav.querySelector('button:first-child')
    if (firstCategoryButton) {
      this.categoryClickEventListener({ target: firstCategoryButton })
    }
  }

  disconnectedCallback () {
    this.emojiNav.removeEventListener('click', this.categoryClickEventListener)
    this.emojiList.removeEventListener('click', this.emojiClickEventListener)
    self.removeEventListener('click', this.windowClickEventListener)
  }

  /**
   * Evaluates if a render is necessary for CSS.
   *
   * @return {boolean}
   */
  shouldRenderCSS () {
    return !this.root.querySelector(`${this.cssSelector} > style[_css]`)
  }

  /**
   * Evaluates if a render is necessary for HTML.
   *
   * @return {boolean}
   */
  shouldRenderHTML () {
    return !this.emojiNav
  }

  /**
   * Renders the CSS.
   *
   * @return {void}
   */
  renderCSS () {
    this.css = /* css */`
    :host {
      font-size: max(12px, 0.5em);
      position: absolute;
      bottom: 0;
      width: 100%;
      height: 58vh;
      width: 40dvw;
      background: white;
      box-shadow: 0px -5px 10px rgba(0, 0, 0, 0.1);
      display: none;
      tap-highlight-color: transparent;
      --webkit-tap-highlight-color: transparent;
      z-index: 1;
    }
    
    :host(.visible) {
      display: block;
    }

    #emojiNav {
      padding-left: 1rem;
      display: flex;
      overflow-x: auto;
      background: #f2f2f2;
     
    }

    #emojiNav button {
      border: none;
      cursor: pointer;      
      margin: 0.5em;
      padding: 0.05em 0.1em;
      
      font-size: 1.5em;
      
    }

    #emojiList{
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-start;
      align-items: flex-start;
      overflow-y: auto;
      max-height: 90%;
    }
    
    #emojiList button {
      flex: 0 0 10%; /* Adjust the width of each button as needed */
      background: none;
      border: none;
      cursor: pointer;
      margin: 0.2em;
      padding: 0;
      font-size: 2.5em;
      text-align: left;
      box-sizing: border-box;
    }
    @media only screen and (max-width: _max-width_) {
      :host{
        width: 75dvw;
        bottom: 0;
      }
    }
    
    `
  }

  /**
   * Renders the HTML.
   *emojiNavButtons
   * @return {void}
   */
  renderHTML () {
    // Initially, render smiley emojis
    const smileyCategory = this.emojiCategories.find(category => category.id === 'smileys')
    const emojisHTML = smileyCategory?.emojis.map(emoji => `<button emoji="${emoji}">${emoji}</button>`).join('') || ''

    this.html = /* HTML */`
     <div id="emojiNav">
       ${this.emojiCategories.map(category => `<button id="${category.id}" emoji="${category.icon}">${category.icon}</button>`).join('')}
     </div>
     <div id="emojiList">
       ${emojisHTML}
     </div>
   `
    this.generateUnicodeEmojis()
  }

  generateUnicodeEmojis () {
    const container = this.root.querySelector('#emojiList')
    const emojisHTML = this.emojiCategories.map(categoryData => {
      let categoryHTML = ''

      if (categoryData.list) {
        const listButtons = categoryData.list.map(emojiCode => `<button emoji="${String.fromCodePoint(emojiCode)}">${String.fromCodePoint(emojiCode)}</button>`).join('')
        categoryHTML += listButtons
      }

      if (categoryData.ranges) {
        const rangeButtons = categoryData.ranges
          .map(range => Array.from({ length: range.end - range.start + 1 }, (_, index) => {
            const emojiCode = String.fromCodePoint(range.start + index)
            return `<button emoji="${emojiCode}">${emojiCode}</button>`
          }).join(''))
          .join('')
        categoryHTML += rangeButtons
      }

      return categoryHTML
    }).join('')

    container.innerHTML = emojisHTML
  }

  get emojiNav () {
    return this.root.querySelector('#emojiNav')
  }

  get emojiList () {
    return this.root.querySelector('#emojiList')
  }
}
