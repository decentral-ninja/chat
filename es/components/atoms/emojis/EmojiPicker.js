// @ts-check
import { Shadow } from '../../../../../event-driven-web-components-prototypes/src/Shadow.js';

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
  static get observedAttributes() {
    return ['selected-emoji'];
  }

  constructor(options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, ...options }, ...args);

    this.emojiCategories = [
      { id: 'smileys', icon: '😀', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '😍', '🥰', '😎', '🤩', '😘', '😗', '😚', '😙', '🤗', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '🤐', '😯', '😪', '😫', '😴', '😌', '😛', '😜', '😝', '🤤', '😒', '😓', '😔', '😕', '🙃', '🤑', '😲', '🙁', '😖', '😞', '😟', '😤', '😢', '😭', '😦', '😧', '😨', '😩', '😰', '😱', '😳', '😵', '😡', '😠', '🤬', '😷', '🤒', '🤕', '🤢', '🤮', '🥴', '🤧', '😇', '🥳', '🥺', '🤠', '🤡', '🤥', '🤫', '🤭', '🧐', '🤓', '😈', '👿', '👹', '👺', '💀', '👻', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'] },
      { id: 'celebrations', icon: '🎉', emojis: ['🎉', '🎊', '🥳', '🎈', '🎂', '🍰', '🍾', '🎁', '🎆', '🎇'] },
  { id: 'animals', icon: '🐶', emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯'] },
  { id: 'food', icon: '🍔', emojis: ['🍔', '🍕', '🍎', '🍓', '🍦', '🍟', '🍩', '🍪', '🍰', '🥗'] },
  { id: 'travel', icon: '🚗', emojis: ['🚗', '✈️', '🚀', '🚢', '🚲', '🛴', '🛵', '🚁', '🚆', '🚂'] },
  { id: 'weather', icon: '☀️', emojis: ['☀️', '🌧️', '❄️', '⛅', '🌈', '🌪️', '🌊', '🌦️', '🌞', '🌧️'] },
  { id: 'flags', icon: '🏳️', emojis: ['🏳️', '🇺🇸', '🇬🇧', '🇯🇵', '🇫🇷', '🇩🇪', '🇨🇳', '🇷🇺', '🇮🇳', '🇧🇷'] },
  { id: 'sports', icon: '⚽', emojis: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏓', '🏐', '🎱', '🏒', '🏸'] },
  { id: 'music', icon: '🎵', emojis: ['🎵', '🎸', '🎹', '🥁', '🎷', '🎺', '🎻', '🎶', '🎧', '🎤'] },
      // Add more categories as needed
    ];

    this.transitionDuration = this.getAttribute('transition-duration') || 400;

    /**
   * Handles the click event on emoji buttons.
   *
   * @param {Event} event
   */
  this.clickEventListener = event => {
    const selectedCategory = this.emojiCategories.find(category => category.id === event.target.id);

    if (selectedCategory) {
      // Render emojis within the selected category
      const emojisHTML = selectedCategory.emojis.map(emoji => `<button emoji="${emoji}">${emoji}</button>`).join('');
      const container = this.root.querySelector('#emojiList');
      container.innerHTML = emojisHTML;

      // Trigger a reflow to ensure the content is rendered
      container.offsetHeight;
    }
  }

/**
 * Handles the click event on an emoji 
 *
 * @param {Event} event
 */
this.emojiClickEventListener = event => {
  let clickedEmoji = event.target.getAttribute('emoji');

      /*if (clickedEmoji) {
        let textarea = this.root.querySelector('#userInputTextArea');

        if (textarea) {
          textarea.value += clickedEmoji;
        }
      }

      let clickedEmoji = event.target.getAttribute('emoji');*/

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
    this.windowClickEventListener = event => {
      // TODO: fix toggle
      const target = event.composedPath()[0]
      if (this !== target && !Array.from(this.emojiNav.children).includes(target) && !Array.from(this.emojiList.children).includes(target)) this.classList.toggle('visible')
    }
  }

  connectedCallback() {
    if (this.shouldRenderCSS()) this.renderCSS();
    if (this.shouldRenderHTML()) this.renderHTML();
    this.emojiNav.addEventListener('click', this.clickEventListener);
    this.emojiList.addEventListener('click', this.emojiClickEventListener);
    self.addEventListener('click', this.windowClickEventListener)
  }

  disconnectedCallback() {
    this.emojiNav.removeEventListener('click', this.clickEventListener);
    this.emojiList.removeEventListener('click', this.emojiClickEventListener);
    self.removeEventListener('click', this.windowClickEventListener)
  }

  /**
   * Evaluates if a render is necessary for CSS.
   *
   * @return {boolean}
   */
  shouldRenderCSS() {
    return !this.root.querySelector(`:host > style[_css], ${this.tagName} > style[_css]`);
  }

  /**
   * Evaluates if a render is necessary for HTML.
   *
   * @return {boolean}
   */
  shouldRenderHTML() {
    return !this.emojiNav;
  }

  /**
   * Renders the CSS.
   *
   * @return {void}
   */
  renderCSS() {
    this.css = /* css */`
    :host {
      position: absolute;
      bottom: 3.5rem;
      width: 100%;
      height: 58vh;
      width: 30vw;
  
      border-radius: 11%;
      overflow-y: auto;
      background: white;
      box-shadow: 0px -5px 10px rgba(0, 0, 0, 0.1);
      display: none;
      -webkit-tap-highlight-color: transparent;
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
      border-radius: 20%;
    }

    
    #emojiList button {
      background: none;
      border: none;
      cursor: pointer;
      margin: 0.5em;
      padding-left: 0;
      font-size: 2em;
    }
    
    `;
  }

  /**
   * Renders the HTML.
   *
   * @return {void}
   */
  renderHTML() {
     // Initially, render smiley emojis
  const smileyCategory = this.emojiCategories.find(category => category.id === 'smileys');
  const emojisHTML = smileyCategory?.emojis.map(emoji => `<button emoji="${emoji}">${emoji}</button>`).join('') || '';

  this.html = /* HTML */`
  <div id="emojiNav">
  ${this.emojiCategories.map(category => `<button id="${category.id}" emoji="${category.icon}">${category.icon}</button>`).join('')}
  </div>
  <hr/>
    <div id="emojiList">
      ${emojisHTML}
    </div>
    
    `;
  }

  get emojiNav () {
    return this.root.querySelector('#emojiNav')
  }
  get emojiList () {
    return this.root.querySelector('#emojiList')
  }
}