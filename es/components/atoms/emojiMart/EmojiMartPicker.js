import { Shadow } from '../../../../../event-driven-web-components-prototypes/src/Shadow.js'

export default class EmojiPicker extends Shadow() {
  constructor(options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, ...options }, ...args);

    this.pickerOptions = options.onEmojiSelect ? options : { onEmojiSelect: console.log };

    // Load EmojiMart script as a dependency
    this.loadDependency().then(() => {
      this.picker = new EmojiMart.Picker(this.pickerOptions);
      this.renderHTML();
    });
  }

  connectedCallback() {
    if (this.shouldRenderCSS()) this.renderCSS();
    if (this.shouldRenderHTML()) this.renderHTML();
    Promise.all([this.loadDependency()]).then(() => {
      this.dispatchEvent(new CustomEvent(this.getAttribute('request-event-name') || 'request-event-name', {
        bubbles: true,
        cancelable: true,
        composed: true
      }));
    });
  }

  disconnectedCallback() {
    // Cleanup if needed
  }

  loadDependency() {
    return new Promise((resolve, reject) => {
      if (document.getElementById('emoji-mart-script')) {
        return resolve(this.RESOLVE_STATE)
      }

      const emojiMartScript = document.createElement('script')
      emojiMartScript.setAttribute('type', 'text/javascript')
      emojiMartScript.setAttribute('id', 'emoji-mart-script')

      try {
        //TODO: Load from file in project
        emojiMartScript.setAttribute('src', 'https://cdn.jsdelivr.net/npm/emoji-mart@latest/dist/browser.js')
        document.body.appendChild(emojiMartScript)
        emojiMartScript.onload = () => resolve(this.RESOLVE_STATE)
      } catch (e) {
        return reject(e)
      }
    });
  }

  shouldRenderCSS() {
    return !this.root.querySelector(`:host > style[_css], ${this.tagName} > style[_css]`)
  }

  shouldRenderHTML() {
    return !this.picker
  }

  renderCSS() {
    this.css = /* css */ `
      :host {
      }
      @media only screen and (max-width: _max-width_) {}
    `
  }

  renderHTML() {
    if (!this.shouldRenderHTML()) {
      return;
    }

    this.html = /* HTML */`
      ${this.picker}
    `;
  }

  static initialize(options) {
    const emojiPicker = new EmojiPicker(options);
    return emojiPicker;
  }
}
