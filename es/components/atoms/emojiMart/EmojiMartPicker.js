import { Shadow } from '../../../../../event-driven-web-components-prototypes/src/Shadow.js'

export default class EmojiPicker extends Shadow() {
  constructor (options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, ...options }, ...args)

    this.pickerOptions = options.pickerOptions
      ? options.pickerOptions
      : {
          onEmojiSelect: emoji => this.dispatchEvent(new CustomEvent('emoji-clicked', {
            detail: {
              clickedEmoji: emoji.native,
              emoji
            },
            bubbles: true,
            cancelable: true,
            composed: true
          })),
          data: async () => {
            const response = await fetch(
            `${this.importMetaUrl}./data/sets/14/apple.json`
            )

            return response.json()
          },
          autoFocus: true,
          emojiSize: 28,
          emojiVersion: 14,
          previewPosition: 'none',
          set: 'apple',

          // TODO: make skin tones working and pass/add whole span to textarea
          skin: 3,
          skinTonePosition: 'none',
          theme: 'light',
          getSpritesheetURL: () => `${this.importMetaUrl}./data/64.png`
        }

    /* Toggle EmojiPicker while */
    this.windowClickEventListener = event => {
      const target = event.composedPath()[0]
      if (this.classList.contains('visible') && target.id !== 'emojiPickerToggler') {
        if (target.classList.contains('pattern') || target.nodeName === 'YJS-CHAT-UPDATE') {
          this.classList.toggle('visible')
        }
      }
    }

    this.clickEventListener = event => this.dispatchEvent(new CustomEvent('emoji-clicked', {
      detail: {
        clickedEmoji: event.composedPath()[0],
        emoji
      },
      bubbles: true,
      cancelable: true,
      composed: true
    }))
  }

  connectedCallback () {
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
    // @ts-ignore
    self.addEventListener('click', this.windowClickEventListener)
  }

  disconnectedCallback () {
    // @ts-ignore
    self.removeEventListener('click', this.windowClickEventListener)
  }

  shouldRenderCSS () {
    return !this.root.querySelector(`:host > style[_css], ${this.tagName} > style[_css]`)
  }

  shouldRenderHTML () {
    return !this.picker
  }

  renderCSS () {
    this.css = /* css */ `
      :host {
        display: none;
        position: absolute;
      bottom: 9em;
      }
      :host(.visible) {
        display: block;
      }
  
      @media only screen and (max-width: _max-width_) {}
    `
  }

  renderHTML () {
    // Load EmojiMart script as a dependency
    this.loadDependency().then(() => {
      this.picker = new EmojiMart.Picker(this.pickerOptions)
      this.html = this.picker
    })
  }

  /**
   * fetch dependency
   *
   * @returns {Promise<{components: any}>}
   */
  loadDependency () {
    // make it global to self so that other components can know when it has been loaded
    return this._loadDependcy || (this._loadDependcy = new Promise(resolve => {
      const emojiScript = document.createElement('script')
      emojiScript.setAttribute('type', 'text/javascript')
      emojiScript.setAttribute('async', '')
      emojiScript.setAttribute('src', `${this.importMetaUrl}./data/broswer.js`)
      emojiScript.setAttribute('crossorigin', 'anonymous')
      emojiScript.onload = () => resolve()
      this.html = emojiScript
    }))
  }

  get emojiPickerEl () {
    return this.root.querySelector('em-emoji-picker')
  }
}
