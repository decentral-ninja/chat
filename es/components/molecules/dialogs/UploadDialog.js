// @ts-check
import Dialog from '../../../../../web-components-toolbox/src/es/components/molecules/dialog/Dialog.js'

/* global self */
/* global Environment */
/* global FileReader */

/**
* @export
* @class Dialog
* https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
* @type {CustomElementConstructor}
*
* @attribute states: ['in-progress' (initial state), 'key-selected', 'encrypting', 'encrypted', 'done' (torrent.done), 'downloading' (!torrent.done), 'recovering']
*/
export default class UploadDialog extends Dialog {
  constructor (options = {}, ...args) {
    super({ ...options }, ...args)

    this.clickUploadEventListener = event => {
      
    }
  }

  connectedCallback () {
    if (this.shouldRenderCustomHTML()) this.renderCustomHTML()
    const result = super.connectedCallback()
    this.uploadButton.addEventListener('click', this.clickUploadEventListener)
    return result
  }

  disconnectedCallback () {
    super.disconnectedCallback()
    this.uploadButton.removeEventListener('click', this.clickUploadEventListener)
    this.close()
  }

  /**
     * evaluates if a render is necessary
     *
     * @return {boolean}
     */
  shouldRenderCustomHTML () {
    return !this.root.querySelector(this.cssSelector + ' > dialog')
  }

  /**
   * renders the css
   */
  renderCSS () {
    const result = super.renderCSS()
    this.setCss(/* css */`
      :host > dialog {
        --dialog-top-slide-in-a-text-decoration: underline;
        scrollbar-color: var(--color) var(--background-color);
        scrollbar-width: thin;
        transition: height 0.3s ease-out;
      }
      :host([downloading][recovering]) > dialog > #title-default, :host(:not([downloading][recovering])) > dialog > #title-downloading {
        display: none;
      }
      :host > dialog > section {
        max-width: 60em;
        margin: 0 auto;
      }
      :host > dialog > section {
        --dialog-top-slide-in-p-margin: 0;
        display: flex;
        gap: 1em;
        align-items: end;
        justify-content: space-between;
      }
      :host > dialog > section:where([encryption], [files]) > :where(chat-a-key-status, input) {
        font-size: 1rem;
        background-color: white;
        padding: 0.75em;
        border-radius: var(--border-radius);
        border: var(--button-secondary-border-width, 0px) solid var(--button-secondary-border-color, transparent);
        flex: 1;
        min-height: 4em;
        max-width: 75%;
      }
      :host > dialog > section[files] > input {
        color: black;
        cursor: pointer;
      }
      :host > dialog > section[encryption] > chat-a-key-status::part(key-name) {
        position: static;
      }
      :host > dialog > section[encryption] > chat-a-key-status::part(section-key-icon) {
        align-items: end;
      }
      :host > dialog > section[buttons] {
        --button-primary-background-color-hover-custom: var(--color-yellow);
        --button-primary-background-color-custom: var(--color-green);
        --button-primary-border-color: var(--color-green);
        --button-secondary-color-hover-custom: var(--color-yellow);
        --button-secondary-border-color-hover-custom: var(--color-yellow);
        justify-content: end;
      }
      @media only screen and (max-width: _max-width_) {
        :host > dialog > section:where([encryption], [files]) {
          flex-direction: column;
          align-items: center;
        }
        :host > dialog > section {
          gap: 0;
        }
        :host > dialog > section:where([encryption], [files]) > :where(chat-a-key-status, input) {
          max-width: 100%;
          width: 100%;
        }
      }
    `, undefined, false)
    return result
  }

  /**
   * Render HTML
   * @returns Promise<void>
   */
  renderCustomHTML () {
    this.html = /* html */`
      <dialog>
        <wct-menu-icon id="close" no-aria class="open sticky" namespace="menu-icon-close-" no-click background style="--outline-style-focus-visible: none;"></wct-menu-icon>
        <h4 id=title-default>Upload:</h4>
        <h4 id=title-downloading>Downloading:</h4>
        <section files>
          <p>Choose files:</p>
          <input type=file multiple />
        </section>
        <hr>
        <section encryption>
          <p>Select key:</p>
          <chat-a-key-status checkbox></chat-a-key-status>
        </section>
        <hr>
        <section buttons>
          <wct-button id=upload title="upload" namespace="button-primary-" click-no-toggle-active>upload</wct-button>
        </section>
      </dialog>
    `
    return this.fetchModules([
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../atoms/menuIcon/MenuIcon.js?${Environment?.version || ''}`,
        name: 'wct-menu-icon'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../loadTemplateTag/LoadTemplateTag.js?${Environment?.version || ''}`,
        name: 'wct-load-template-tag'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../atoms/iconMdx/IconMdx.js?${Environment?.version || ''}`,
        name: 'wct-icon-mdx'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../../../components/atoms/iconStates/IconStates.js?${Environment?.version || ''}`,
        name: 'a-icon-states'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../../../components/atoms/iconCombinations/IconCombinations.js?${Environment?.version || ''}`,
        name: 'a-icon-combinations'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../../../components/atoms/keyStatus/KeyStatus.js?${Environment?.version || ''}`,
        name: 'chat-a-key-status'
      }
    ])
  }

  get uploadButton () {
    return this.root.querySelector('#add-key')
  }

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }
}
