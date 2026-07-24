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
        --p-text-align: left;
        scrollbar-color: var(--color) var(--background-color);
        scrollbar-width: thin;
        transition: height 0.3s ease-out;
      }
      :host([downloading][recovering]) > dialog > #title-default, :host(:not([downloading][recovering])) > dialog > #title-downloading {
        display: none;
      }
      :host > dialog > section > div, :host > dialog > section > p {
        max-width: 60em;
        margin: 0 auto;
      }
      :host > dialog > section > div {
        --dialog-top-slide-in-p-margin: 0;
        display: flex;
        gap: 1em;
        align-items: start;
        justify-content: space-between;
      }
      :host > dialog > section > div input {
        color: black;
        cursor: pointer;
      }
      :host > dialog > section:where([encryption], [files], [message]) > div > * {
        max-width: 75%;
        width: auto;
      }
      :host > dialog > section:where([encryption], [files], [message]) > div > *:last-child:not(p):not(section) {
        font-size: 1rem;
        background-color: white;
        padding: 0.75em;
        border-radius: var(--border-radius);
        border: var(--button-secondary-border-width, 0px) solid var(--button-secondary-border-color, transparent);
        flex: 1;
        min-height: 4em;
      }
      :host > dialog > section[encryption] > div > div {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      :host > dialog > section[encryption] > div input[type=checkbox] {
        height: 3em;
        width: 3em;
      }
      :host > dialog > section[encryption] > div input[type=checkbox]:not(:checked) + chat-a-key-status {
        display: none;
      }
      :host > dialog > section[encryption]:has(> div input[type=checkbox]:checked + chat-a-key-status[state=has-key]) #encryption-disabled {
        display: none;
      }
      :host > dialog > section[encryption]:where(:has(> div input[type=checkbox]:not(:checked)), :has(> div chat-a-key-status:not([state=has-key]))) #encryption-active{
        display: none;
      }
      :host > dialog > section[encryption] #encryption-disabled {
        color: var(--color-error);
      }
      :host > dialog > section[encryption] > div chat-a-key-status::part(key-name) {
        position: static;
      }
      :host > dialog > section[encryption] > div chat-a-key-status::part(section-key-icon) {
        align-items: end;
        justify-content: center;
      }
      :host > dialog > section[encryption] > div > section {
        width: 100%;
      }
      :host > dialog > section[message] > div >  textarea {
        font-size: max(16px, 1em); /* 16px ios mobile focus zoom fix */
        transition: height 0.3s ease-out;
        padding: 1em;
        min-height: 4.365em;
        max-height: 50dvh;
        overflow-y: auto;
        outline: none;
        scrollbar-color: var(--color) var(--background-color);
        scrollbar-width: thin;
        field-sizing: content; /*Coming soon: https://toot.cafe/@seaotta/111812940330557783*/
      }
      :host > dialog > section[buttons] > div {
        --button-primary-background-color-hover-custom: var(--color-yellow);
        --button-primary-background-color-custom: var(--color-green);
        --button-primary-border-color: var(--color-green);
        --button-secondary-color-hover-custom: var(--color-yellow);
        --button-secondary-border-color-hover-custom: var(--color-yellow);
        justify-content: end;
      }
      @media only screen and (max-width: _max-width_) {
        .desktop-spacer {
          display: none !important;
        }
        :host > dialog > section:where([encryption], [files], [message]) > div > * {
          max-width: 100%;
        }
        :host > dialog > section:where([encryption], [files], [message]) > div {
          flex-direction: column;
          align-items: center;
        }
        :host > dialog > section > div {
          gap: 0;
        }
        :host > dialog > section:where([encryption], [files], [message]) > div > *:last-child:not(p):not(section) {
          max-width: 100%;
          width: 100%;
        }
        :host > dialog > section[message] > div >  textarea {
          min-height: 3.8em;
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
          <div>
            <p>Choose files:</p>
            <input type=file multiple />
          </div>
          <div>
            <div class=desktop-spacer>&nbsp;</div>
            <p class=font-size-tiny>Preferably choose one file for upload. Public IPFS gateways often limit one upload to 20MB. DCN is hosting it's own IPFS Gateway (@peerweb.site), <a href="?page=/" route target="_self">please support us to improve file upload performance</a>.</p>
          </div>
        </section>
        <hr>
        <section encryption>
          <div>
            <p>Encrypt:</p>
            <div>
              <input type=checkbox checked />
              <chat-a-key-status checkbox></chat-a-key-status>
            </div>
          </div>
          <div>
            <div class=desktop-spacer>&nbsp;</div>
            <section>
              <p id=encryption-active class=font-size-tiny>File encryption is important for private content. Public content though, can be unencrypted. If you have message encryption active, the message text containing the link to your file(s) is still going to be encrypted. The advantage of unencrypted content is better streaming and synergies of webtorrents can be used.</p>
              <p id=encryption-disabled class=font-size-tiny>Click the checkbox above and activate a key to encrypt the file(s), which is strongly recommended, if your file(s) contain private content!</p>
            </section>
          </div>
        </section>
        <hr>
        <section message>
          <div>
            <p>Append a message:</p>
            <textarea enterkeyhint="enter" placeholder="type your message..." rows="2"></textarea>
          </div>
        </section>
        <hr>
        <section buttons>
          <div>
            <wct-button id=upload title="upload" namespace="button-primary-" click-no-toggle-active>upload</wct-button>
          </div>
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
