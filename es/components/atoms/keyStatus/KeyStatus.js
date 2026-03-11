// @ts-check
import { Shadow } from '../../../../../event-driven-web-components-prototypes/src/Shadow.js'
import { getHexColor } from '../../../../../Helpers.js'
import { escapeHTML } from '../../../../../event-driven-web-components-prototypes/src/helpers/Helpers.js'

/* global self */
/* global Environment */

/**
* @export
* @class KeyName
* @type {CustomElementConstructor}
*/
export default class KeyName extends Shadow() {
  constructor (options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, tabindex: 'no-tabindex', ...options }, ...args)

    /** @type {import("../../../../../event-driven-web-components-yjs/src/es/controllers/Keys.js").KEY_CONTAINER | undefined} */
    let keyContainer
    this.clickEventListener = event => {
      if (['has-key', 'default'].includes(this.getAttribute('state'))) this.dispatchEvent(new CustomEvent('keys-dialog-show-event', {
        detail: {
          command: 'show-modal',
          checkbox: this.hasAttribute('checkbox'),
          epoch: keyContainer?.key.epoch,
          messageUid: this.getAttribute('message-uid')
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))
    }

    this.keyEventListener = async (event, keyPromise) => {
      keyContainer = event?.detail || await keyPromise
      if (keyContainer) {
        this.keyNameEl.innerHTML = /* html */`<chat-a-key-name private name="${escapeHTML(keyContainer.private.name)}" epoch='${keyContainer.key.epoch}' no-avatar></chat-a-key-name>`
        getHexColor(keyContainer.key.epoch).then(hex => {
          this.customStyle.textContent = /* css */`
            :host {
              --color: ${hex};
              --h4-color: ${hex};
              --h4-line-height: var(--line-height, normal);
            }
            :host > section > p {
              --spacing: 0;
            }
          `
        })
        this.iconStates.setAttribute('state', this.hasAttribute('is-message-child') ? 'decrypted' : 'has-key')
        this.setAttribute('state', 'has-key')
      } else if(this.hasAttribute('epoch')) {
        this.keyNameEl.textContent = this.hasAttribute('public-name')
          ? `Unknown key: ${this.getAttribute('public-name')}`
          : 'Unknown key!'
        this.iconStates.setAttribute('state', 'has-key')
        this.setAttribute('state', 'key-not-found')
      } else {
        this.keyNameEl.innerHTML = ''
        this.keyNameEl.textContent = 'No active key!'
        this.customStyle.textContent = ''
        this.iconStates.setAttribute('state', 'default')
        this.setAttribute('state', 'default')
      }
    }
  }

  connectedCallback () {
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
    this.addEventListener('click', this.clickEventListener)
    if (!this.hasAttribute('epoch')) this.globalEventTarget.addEventListener('yjs-default-key', this.keyEventListener)
    if (this.isConnected) this.connectedCallbackOnce()
  }

  connectedCallbackOnce () {
    if (this.hasAttribute('epoch')) {
      this.keyEventListener(undefined, new Promise(resolve => this.dispatchEvent(new CustomEvent('yjs-get-key', {
        detail: {
          resolve,
          epoch: this.getAttribute('epoch')
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))))
    } else {
      this.keyEventListener(undefined, new Promise(resolve => this.dispatchEvent(new CustomEvent('yjs-get-active-room-default-key', {
        detail: {
          resolve
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))))
    }
    // @ts-ignore
    this.connectedCallbackOnce = () => {}
  }

  disconnectedCallback () {
    this.removeEventListener('click', this.clickEventListener)
    if (!this.hasAttribute('epoch')) this.globalEventTarget.removeEventListener('yjs-default-key', this.keyEventListener)
  }

  /**
   * evaluates if a render is necessary
   *
   * @return {boolean}
   */
  shouldRenderCSS () {
    return !this.root.querySelector(`${this.cssSelector} > style[_css]`)
  }

  /**
   * evaluates if a render is necessary
   *
   * @return {boolean}
   */
  shouldRenderHTML () {
    return !this.iconStates
  }

  /**
   * renders the css
   */
  renderCSS () {
    this.css = /* css */`
      :host {
        --color: var(--a-color);
        --color-hover: var(--color-yellow);
      }
      :host([state=key-not-found]) {
        pointer-events: none;
      }
      :host(:not([state=key-not-found])) {
        cursor: pointer;
      }
      :host > section {
        display: flex;
        position: relative;
      }
      :host > section > a-icon-states {
        --svg-filter: drop-shadow(0px 0px 0.075em var(--key-status-svg-filter-color, var(--color-white)));
      }
      :host > section > p {
        position: absolute;
        left: calc(100% - (var(--padding, 0.25em) - 0.25em));
        bottom: 0;
        margin: 0;
        padding: 0;
        font-size: 0.65em;
        white-space: nowrap;
        color: var(--color);
        transition: var(--transition);
        text-shadow: 0px 0px 0.075em var(--key-status-text-shadow-color, var(--color-white));
        max-width: var(--max-width, 50dvw);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      :host([self]) > section > p {
        text-shadow: 0px 0px 0.075em var(--key-status-self-text-shadow-color, var(--key-status-text-shadow-color, var(--color-white)));
      }
      :host([self]) > section > a-icon-states {
        --svg-filter: drop-shadow(0px 0px 0.075em var(--key-status-self-svg-filter-color, var(--color-white)));
      }
      :host(:hover) > section > p {
        color: var(--color-yellow);
      }
    `
  }

  /**
   * Render HTML
   * @prop {string} keyName
   * @returns Promise<void>
   */
  renderHTML () {
    this.html = /* html */`
      <section id=section-key-icon>
        <a-icon-states id=key-icon>
          <template>
            <wct-icon-mdx state="default" title="No encryption key active!" icon-url="../../../../../../img/icons/lock-open-2.svg" size="1.8em" hover-selector="section#section-key-icon"></wct-icon-mdx>
            <wct-icon-mdx state="decrypted" title="Message successfully decrypted!" icon-url="../../../../../../img/icons/lock.svg" size="1.8em" hover-selector="section#section-key-icon"></wct-icon-mdx>
            <wct-icon-mdx state="has-key" title="Encryption key active!" icon-url="../../../../../../img/icons/lock.svg" size="1.8em" hover-selector="section#section-key-icon"></wct-icon-mdx>
          </template>
        </a-icon-states>
        <p id=key-name>Loading...</p>
      </section>
    `
    this.html = this.customStyle
    return this.fetchModules([
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../../components/atoms/iconStates/IconStates.js?${Environment?.version || ''}`,
        name: 'a-icon-states'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../../components/atoms/iconCombinations/IconCombinations.js?${Environment?.version || ''}`,
        name: 'a-icon-combinations'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../../web-components-toolbox/src/es/components/atoms/iconMdx/IconMdx.js?${Environment?.version || ''}`,
        name: 'wct-icon-mdx'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../keyName/KeyName.js?${Environment?.version || ''}`,
        name: 'chat-a-key-name'
      }
    ])
  }

  get iconStates () {
    return this.root.querySelector('a-icon-states')
  }

  get keyNameEl () {
    return this.root.querySelector('#key-name')
  }

  get customStyle () {
    return (
      this._customStyle ||
        (this._customStyle = (() => {
          const style = document.createElement('style')
          style.setAttribute('protected', 'true')
          return style
        })())
    )
  }

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }
}
