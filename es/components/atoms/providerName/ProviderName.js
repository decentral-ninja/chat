// @ts-check
import { Shadow } from '../../../../../event-driven-web-components-prototypes/src/Shadow.js'
import { getHexColor } from '../../../../../Helpers.js'
import { separator } from '../../../../../event-driven-web-components-yjs/src/es/controllers/Users.js'

/* global self */
/* global Environment */

/**
* @export
* @class ProviderName
* @type {CustomElementConstructor}
*/
export default class ProviderName extends Shadow() {
  constructor (options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, tabindex: 'no-tabindex', ...options }, ...args)

    this.hTagName = this.getAttribute('h-tag-name') || 'h4'
    this.dataName = this.root.querySelector('[name]')?.textContent

    this.clickEventListener = event => {
      event.preventDefault()
      event.stopPropagation()
      if (this.hasAttribute('provider-dialog-show-event')) {
        this.dispatchEvent(new CustomEvent('provider-dialog-show-event', {
          detail: {
            id: this.getAttribute('id'),
            name: this.dataName?.split(separator)[0],
            href: this.dataName?.split(separator)[1]
          },
          bubbles: true,
          cancelable: true,
          composed: true
        }))
      } else {
        this.dispatchEvent(new CustomEvent('provider-name-click', {
          detail: { name: this.dataName },
          bubbles: true,
          cancelable: true,
          composed: true
        }))
      }
    }

    let lastProvidersEventGetData = null
    let timeoutId = null
    const skipTimeoutClear = 5
    let timeoutCounter = 1
    this.providerEventListener = async event => {
      lastProvidersEventGetData = event.detail.getData
      if (timeoutCounter % skipTimeoutClear) clearTimeout(timeoutId)
      timeoutCounter++
      timeoutId = setTimeout(async () => {
        timeoutCounter = 1
        const providers = (await (await event.detail.getData(false)).getSessionProvidersByStatus()).connected
        if (providers.find(provider => provider.includes(this.dataName))) {
          this.setAttribute('is-connected-with-self', '')
        } else {
          this.removeAttribute('is-connected-with-self')
        }
        // @ts-ignore
      }, self.Environment.awarenessEventListenerDelay)
    }

    this.providersChangeEventListener = event => {
      if (lastProvidersEventGetData) this.providerEventListener({ detail: { getData: lastProvidersEventGetData } })
    }
  }

  connectedCallback () {
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
    this.addEventListener('click', this.clickEventListener)
    this.globalEventTarget.addEventListener('yjs-providers-data', this.providerEventListener)
    this.globalEventTarget.addEventListener('yjs-providers-change', this.providersChangeEventListener)
    if (this.isConnected) this.connectedCallbackOnce()
  }

  connectedCallbackOnce () {
    new Promise(resolve => this.dispatchEvent(new CustomEvent('yjs-get-providers-event-detail', {
      detail: { resolve },
      bubbles: true,
      cancelable: true,
      composed: true
    }))).then(detail => this.providerEventListener({ detail }))
    this.connectedCallbackOnce = () => {}
  }

  disconnectedCallback () {
    this.removeEventListener('click', this.clickEventListener)
    this.globalEventTarget.removeEventListener('yjs-providers-data', this.providerEventListener)
    this.globalEventTarget.removeEventListener('yjs-providers-change', this.providersChangeEventListener)
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
    return !this.hTag
  }

  /**
   * renders the css
   */
  renderCSS () {
    this.css = /* css */`
      :host {
        --a-margin: 0;
        --a-text-decoration: underline;
        --a-display: flex;
        --color: var(--a-color);
        --color-hover: var(--color-yellow);
        --${this.hTagName}-font-size: 1em;
        --${this.hTagName}-margin: 0;
        --${this.hTagName}-padding: 0.2em 0 0 0;
        display: block;
        cursor: pointer;
      }
      *:focus {
        outline: none;
      }
      :host > a, :host > span {
        align-items: center;
        display: flex;
        padding-bottom: var(--spacing);
        tap-highlight-color: transparent;
        --webkit-tap-highlight-color: transparent;
      }
      :host > a > wct-icon-mdx {
        display: flex;
      }
      :host > a > ${this.hTagName}, :host > span {
        text-align: left;
        overflow: hidden;
        text-overflow: ellipsis;
        text-decoration: underline;
      }
      :host .avatar {
        height: 1.25em;
        width: 1.25em;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 50%;
        box-shadow: 0px 0px 0.25em var(--color-white);
        margin-right: 0.25em;
        transform: translateY(0.1em);
        flex-shrink: 0;
      }
      :host .avatar > #connected {
        display: none;
      }
      :host([is-connected-with-self]) .avatar > #connected {
        --color: var(--background-color);
        --color-hover: var(--color-secondary);
        display: contents;
      }
    `
    return this.fetchTemplate()
  }

  /**
   * fetches the template
   */
  fetchTemplate () {
    return this.fetchCSS([
      {
        path: `${this.importMetaUrl}../../../../../web-components-toolbox/src/css/reset.css`, // no variables for this reason no namespace
        namespace: false
      },
      {
        path: `${this.importMetaUrl}../../../../../web-components-toolbox/src/css/style.css`, // apply namespace and fallback to allow overwriting on deeper level
        namespaceFallback: true
      }
    ])
  }

  /**
   * Render HTML
   * @prop {string} providerName
   * @returns Promise<void>
   */
  renderHTML () {
    const providerName = this.dataName?.split(separator)[1] || 'None'
    this.setAttribute('title', providerName)
    this.html = ''
    this.html = /* html */`
      <a href="#">
        <span class=avatar>
          <wct-icon-mdx hover-on-parent-shadow-root-host id=connected title=connected icon-url="../../../../../../img/icons/mobiledata.svg" size="0.75em"></wct-icon-mdx>
        </span>
        <${this.hTagName}>${providerName}</${this.hTagName}>
      </a>
    `
    try {
      const url = new URL(this.dataName?.split(separator)[1])
      getHexColor(url.host).then(hex => this.avatar.setAttribute('style', `background-color: ${hex}`))
    } catch (error) {
      getHexColor(this.dataName).then(hex => this.avatar.setAttribute('style', `background-color: ${hex}`))
    }
    return this.fetchModules([
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../../web-components-toolbox/src/es/components/atoms/iconMdx/IconMdx.js?${Environment?.version || ''}`,
        name: 'wct-icon-mdx'
      }
    ])
  }

  get hTag () {
    return this.root.querySelector(this.hTagName)
  }

  get avatar () {
    return this.root.querySelector('.avatar')
  }

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }
}
