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

    this.inputChangeEventListener = event => {
      if (this.fileInput.files.length && Array.from(this.fileInput.files).every(file => file.size)) {
        this.classList.add('valid')
        // 1MB = (1024*1024)
        if (Array.from(this.fileInput.files).reduce((sum, file) => sum + file.size, 0) > (50 * 1024*1024)) {
          this.setAttribute('large-payload', '')
        } else {
          this.removeAttribute('large-payload')
        }
      } else {
        this.fileInput.files = (new DataTransfer()).files
        this.classList.remove('valid')
        this.removeAttribute('large-payload')
      }
    }

    this.clickCancelEventListener = event => {
      this.close()
      if (!this.textarea.value && !this.hasAttribute('disabled')) this.dispatchEvent(new CustomEvent('chat-input-upload-next', {
        detail: {
          open: false,
          target: this
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))
    }

    let ipfsDone = false
    const ipfsProgressMap = new Map()
    this.ipfsStatusEventListener = event => {
      if (ipfsDone) return
      const bytesUploaded = (ipfsProgressMap.has(event.detail.gateway.origin) && event.detail.bytesUploaded !== undefined
            ? ipfsProgressMap.get(event.detail.gateway.origin) + event.detail.bytesUploaded
            : event.detail.bytesUploaded) || 0
      const status = bytesUploaded >= event.detail.torrent.length
        ? 'done'
        : event.detail.status
      switch (status) {
        case 'progress':
          if (event.detail.gateway.origin === 'ipfs') {
            this.uploadButton.setAttribute('label', 'Upload pending...')
            break
          }
          ipfsProgressMap.set(event.detail.gateway.origin, bytesUploaded)
          this.uploadButton.setAttribute('label', `Uploading to ${event.detail.gateway.origin} - ${(bytesUploaded / event.detail.torrent.length *100).toFixed(1)}%`)
          break
        case 'done':
          ipfsDone = true
          this.uploadButton.setAttribute('label', 'uploading to IPFS successful - 100%')
          setTimeout(() => this.dispatchEvent(new CustomEvent('chat-input-upload-next', {
            detail: {
              open: false,
              target: this
            },
            bubbles: true,
            cancelable: true,
            composed: true
          })), 2000)
          break
        case 'error':
          this.uploadButton.setAttribute('label', `Failed to upload to ${event.detail.gateway.origin} - 0%`)
          break
      }
    }

    this.clickUploadEventListener = event => {
      this.uploadButton.setAttribute('disabled', '')
      this.uploadButton.setAttribute('label', 'uploading')
      this.uploadButtonState.setAttribute('updating', '')
      this.allFileInputs.forEach(input => input.setAttribute('disabled', ''))
      this.setAttribute('disabled', '')
      this.dispatchEvent(new CustomEvent('chat-input-upload', {
        detail: {
          files: this.fileInput.files,
          encrypt: this.encryptionCheckbox.checked,
          text: this.textarea.value,
          send: true,
          target: this,
          callback: (status, detail) => {
            switch (status) {
              case 'accepted':
                this.uploadButton.setAttribute('label', 'uploading...')
                break
              case 'encrypting':
                this.uploadButton.setAttribute('label', 'encrypting...')
                break
              case 'error-encryption':
                this.uploadButton.setAttribute('label', 'encryption error!')
                break
              case 'encryption-done':
                this.uploadButton.setAttribute('label', 'encryption successful!')
                break
              case 'webtorrent-seed':
                this.uploadButton.setAttribute('label', 'seeding webtorrent...')
                break
              case 'webtorrent-seed-done':
                this.uploadButton.setAttribute('label', 'seeding webtorrent successful!')
                this.infoHash = detail.torrent.infoHash
                document.body.addEventListener(`ipfs-progress-${this.infoHash}`, this.ipfsStatusEventListener)
                document.body.addEventListener(`ipfs-done-${this.infoHash}`, this.ipfsStatusEventListener)
                document.body.addEventListener(`ipfs-error-${this.infoHash}`, this.ipfsStatusEventListener)
                break
              case 'ipfs-seed':
                this.uploadButton.setAttribute('label', 'uploading to IPFS...')
                break
              case 'ipfs-cid-done':
                this.uploadButton.setAttribute('label', 'content is IPFS valid!')
                if (detail.torrent.ipfsStatus) this.ipfsStatusEventListener({detail: {
                  status: detail.torrent.ipfsStatus,
                  torrent: detail.torrent,
                  gateway: {origin: 'ipfs'},
                }})
                break
              case 'ipfs-seed-done':
                this.uploadButton.setAttribute('label', 'uploading to IPFS successful!')
                setTimeout(() => this.dispatchEvent(new CustomEvent('chat-input-upload-next', {
                  detail: {
                    open: false,
                    target: this
                  },
                  bubbles: true,
                  cancelable: true,
                  composed: true
                })), 2000)
                break
            }
          }
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))
    }

    this.clickUploadNextEventListener = event => this.dispatchEvent(new CustomEvent('chat-input-upload-next', {
      detail: {
        open: true,
        target: this
      },
      bubbles: true,
      cancelable: true,
      composed: true
    }))

    this.dragoverEventListener = event => event.preventDefault()

    this.dropEventListener = event => {
      if (!event.dataTransfer?.files?.length) return false
      event.preventDefault()
      this.fileInput.files = event.dataTransfer.files
      this.inputChangeEventListener()
      return true
    }

    this.pasteEventListener = event => {
      // Note: There is always a generic file name used for pasted items and the creation date is also different, those files will have a different cid/magnetURI for this reason.
      const items = Array.from(event.clipboardData?.items || [])
      const files = items.filter(item => item.kind === 'file').map(item => item.getAsFile()).filter(Boolean)
      if (!files.length) return false
      event.preventDefault()
      const dataTransfer = new DataTransfer()
      files.forEach(file => dataTransfer.items.add(file))
      this.fileInput.files = dataTransfer.files
      this.inputChangeEventListener()
      return true
    }
  }

  connectedCallback () {
    if (this.shouldRenderCustomHTML()) this.renderCustomHTML()
    const result = super.connectedCallback()
    this.fileInput.addEventListener('change', this.inputChangeEventListener)
    this.fileInput.addEventListener('blur', this.inputChangeEventListener) // some phones did not register the change event, now we force some reevaluation on blur
    this.cancelButton.addEventListener('click', this.clickCancelEventListener)
    this.uploadButton.addEventListener('click', this.clickUploadEventListener)
    this.uploadButtonNext.addEventListener('click', this.clickUploadNextEventListener)
    this.addEventListener('dragover', this.dragoverEventListener)
    this.addEventListener('drop', this.dropEventListener)
    this.addEventListener('paste', this.pasteEventListener)
    return result
  }

  disconnectedCallback () {
    super.disconnectedCallback()
    this.fileInput.removeEventListener('change', this.inputChangeEventListener)
    this.fileInput.removeEventListener('blur', this.inputChangeEventListener) // some phones did not register the change event, now we force some reevaluation on blur
    this.cancelButton.removeEventListener('click', this.clickCancelEventListener)
    this.uploadButton.removeEventListener('click', this.clickUploadEventListener)
    this.uploadButtonNext.removeEventListener('click', this.clickUploadNextEventListener)
    this.removeEventListener('dragover', this.dragoverEventListener)
    this.removeEventListener('drop', this.dropEventListener)
    this.removeEventListener('paste', this.pasteEventListener)
    if (this.infoHash) {
      document.body.removeEventListener(`ipfs-progress-${this.infoHash}`, this.ipfsStatusEventListener)
      document.body.removeEventListener(`ipfs-done-${this.infoHash}`, this.ipfsStatusEventListener)
      document.body.removeEventListener(`ipfs-error-${this.infoHash}`, this.ipfsStatusEventListener)
    }
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
        width: max(1000px, 75%);
        max-width: 100%;
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
      :host([disabled]) > dialog > section:where([encryption], [files], [message]) > div > *:last-child:not(p):not(section) {
        background-color: var(--color-disabled);
        pointer-events: none;
      }
      :host > dialog > section[encryption] > div > div {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      :host > dialog > section[encryption] > div input[type=checkbox] {
        height: 2em;
        width: 2em;
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
      :host(:not([large-payload])) > dialog > section[encryption] #encryption-disabled, :host([large-payload]) > dialog > section #encryption-active {
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
        min-height: 8em !important;
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
        --color: var(--button-primary-color-custom);
        --color-disabled: var(--button-primary-color-custom);
        justify-content: end;
      }
      :host > dialog > section[buttons] > div :where(#upload, #upload-next) {
        display: none;
      }
      :host > dialog > section[buttons] wct-button::part(button) {
          --button-primary-height: 3.5em;
          --button-secondary-height: 3.5em;
          gap: 0.25em;
      }
      :host > dialog:has(> section[files] > div :where(input[type=file]:valid, input[disabled])) > section[buttons] > div :where(#upload, #upload-next),
      :host(.valid) > dialog > section[buttons] > div {
        display: flex;
      }
      :host > dialog > section[buttons] > div #upload-next {
        display: none;
      }
      :host > dialog:has(> section[files] > div input[disabled]) > section[buttons] > div #upload-next {
        display: block;
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
        :host > dialog > section:not([buttons]) > div {
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
            <p>Choose, drop or paste files here:</p>
            <input id=file-input type=file multiple required />
          </div>
          <div>
            <div class=desktop-spacer>&nbsp;</div>
            <p class=font-size-tiny>Preferably choose one file for upload. Public IPFS gateways often limit one upload to 20MB. DCN is hosting it's own IPFS Gateway (@peerweb.site), <a href="?page=/" route target="_self">please support us to improve file upload performance</a>.<br>Alternatively, use <a href="https://wormhole.app/" target=_blank>wormhole</a> to share large files. </p>
          </div>
        </section>
        <hr>
        <section encryption>
          <div>
            <p>Encrypt:</p>
            <div>
              <input id=encryption-checkbox type=checkbox ${this.hasAttribute('encryption-checked') ? 'checked' : ''} />
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
            <textarea id=textarea enterkeyhint="enter" placeholder="type your message..." rows="2"></textarea>
          </div>
        </section>
        <hr>
        <section buttons>
          <div>
            <wct-button id=cancel title="close" namespace="button-secondary-" click-no-toggle-active>close</wct-button>
            <wct-button id=upload title="upload" namespace="button-primary-" click-no-toggle-active>
              <a-icon-states class=icon-left>
                <template>
                  <wct-icon-mdx state="default" title="Upload" delete icon-url="../../../../../../img/icons/upload.svg" size="1em"></wct-icon-mdx>
                </template>
              </a-icon-states>upload
            </wct-button>
            <wct-button id=upload-next title="upload next" namespace="button-primary-" click-no-toggle-active><wct-icon-mdx class=icon-left title="Upload" delete icon-url="../../../../../../img/icons/upload.svg" size="1em"></wct-icon-mdx>upload next</wct-button>
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
        path: `${this.importMetaUrl}../../../../../../chat/es/components/atoms/keyStatus/KeyStatus.js?${Environment?.version || ''}`,
        name: 'chat-a-key-status'
      }
    ])
  }

  get fileInput () {
    return this.root.querySelector('#file-input')
  }

  get allFileInputs () {
    return Array.from(this.root.querySelectorAll('input, textarea'))
  }

  get encryptionCheckbox () {
    return this.root.querySelector('#encryption-checkbox')
  }

  get textarea () {
    return this.root.querySelector('#textarea')
  }

  get cancelButton () {
    return this.root.querySelector('#cancel')
  }

  get uploadButton () {
    return this.root.querySelector('#upload')
  }

  get uploadButtonNext () {
    return this.root.querySelector('#upload-next')
  }

  get uploadButtonState () {
    return this.uploadButton.root.querySelector('a-icon-states')
  }
}
