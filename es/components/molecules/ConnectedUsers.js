// @ts-check
import { Shadow } from '../../../../web-components-toolbox/src/es/components/prototypes/Shadow.js'
import { separator } from '../../../../event-driven-web-components-yjs/src/es/controllers/Users.js'

/* global Environment */

/**
* @export
* @class ConnectedUsers
* @type {CustomElementConstructor}
*/
export default class ConnectedUsers extends Shadow() {
  constructor (connectedUsers, options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, ...options }, ...args)

    if (this.template) {
      ({ connectedUsers: this.connectedUsers } = JSON.parse(this.template.content.textContent))
    } else {
      /** @type {import('../../../../event-driven-web-components-yjs/src/es/controllers/Users.js').ConnectedUsers} */
      this.connectedUsers = connectedUsers
    }

    this.clickEventListener = event => event.stopPropagation()
  }

  connectedCallback () {
    this.hidden = true
    const showPromises = []
    if (this.shouldRenderCSS()) showPromises.push(this.renderCSS())
    if (this.shouldRenderHTML()) showPromises.push(this.renderHTML())
    Promise.all(showPromises).then(() => (this.hidden = false))
    this.addEventListener('click', this.clickEventListener)
  }

  disconnectedCallback () {
    this.removeEventListener('click', this.clickEventListener)
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
    return !this.placeholder
  }

  /**
   * renders the css
   * @returns Promise<void>
   */
  renderCSS () {
    this.css = /* css */`
      :host wct-details {
        --padding: 0;
        --text-align: left;
        --icon-justify-content: space-between;
        --summary-transform-hover: none;
      }
      :host:has(> wct-details) > .placeholder {
        display: none;
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
        path: `${this.importMetaUrl}../../../../web-components-toolbox/src/css/reset.css`, // no variables for this reason no namespace
        namespace: false
      },
      {
        path: `${this.importMetaUrl}../../../../web-components-toolbox/src/css/style.css`, // apply namespace and fallback to allow overwriting on deeper level
        namespaceFallback: true
      }
    ])
  }

  /**
   * Render HTML
   * @returns Promise<void>
   */
  renderHTML () {
    if (!this.placeholder) this.html = '<div class=placeholder>---</div>'
    // go through all connections and create the needed summary/details
    Object.keys(this.connectedUsers).forEach(providerName => {
      if (Array.isArray(this.connectedUsers[providerName])) this.connectedUsers[providerName].forEach(connectedUser => {
        if (!connectedUser) return
        // @ts-ignore
        const providerId = `${self.Environment?.providerNamespace || 'p_'}${new URL(providerName.split(separator)[1]).hostname.replaceAll('.', '-')}` // string <ident> without dots https://developer.mozilla.org/en-US/docs/Web/CSS/ident
        const providerNameString = /* html */`<chat-a-provider-name id="${providerId}" provider-dialog-show-event><span name>${providerName}</span></chat-a-provider-name>`
        let detail
        if ((detail = this.details.find(detail => detail.getAttribute('uid') === connectedUser.uid))) {
          if (!detail.root.querySelector(`chat-a-provider-name#${providerId}`)) {
            const div = document.createElement('div')
            div.innerHTML = providerNameString
            detail.details.appendChild(div.children[0])
          }
        } else {
          this.html = /* html */`
            <wct-details uid='${connectedUser.uid}' open-event-name='connected-users-details-open-${this.getAttribute('uid')}'>
              <style protected>
                :host {
                  --child-margin: 0 0 0 1em;
                }
                :host .title {
                  display: flex;
                  gap: 1em;
                  justify-content: space-between;
                  width: 100%;
                }
                :host .counter {
                  white-space: nowrap;
                }
              </style>
              <details>
                <summary>
                  <div class=title>
                    <chat-a-nick-name uid='${connectedUser.uid}' nickname="${connectedUser.nickname}"${connectedUser.isSelf ? ' self' : ''}></chat-a-nick-name>
                  </div>
                </summary>
                ${providerNameString}
              </details>
            </wct-details>
          `
        }
      })
    })
    // remove any details which are not in the connected
    this.details.forEach(detail => {
      if (Object.keys(this.connectedUsers).some(providerName => this.connectedUsers[providerName].find(connectedUser => detail.getAttribute('uid') === connectedUser?.uid))) {
        const getProviderNames = () => Array.from(detail.root.querySelectorAll('chat-a-provider-name'))
        getProviderNames().forEach(providerName => {
          if (!this.connectedUsers[providerName.dataName || providerName.textContent]?.some(connectedUser => detail.getAttribute('uid') === connectedUser?.uid)) providerName.remove()
        })
        let counter = detail.summary.querySelector('.counter')
        if (!counter) {
          counter = document.createElement('span')
          counter.classList.add('counter');
          detail.summary.querySelector('chat-a-nick-name').after(counter)
        }
        counter.textContent = `(${getProviderNames().length})`
      } else {
        detail.remove()
      }
    })
    return this.fetchModules([
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/molecules/details/Details.js?${Environment?.version || ''}`,
        name: 'wct-details'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../atoms/nickName/NickName.js?${Environment?.version || ''}`,
        name: 'chat-a-nick-name'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../atoms/providerName/ProviderName.js?${Environment?.version || ''}`,
        name: 'chat-a-provider-name'
      }
    ])
  }

  /**
   * Update components
   * @param {import('../../../../event-driven-web-components-yjs/src/es/controllers/Users.js').ConnectedUsers} connectedUsers
   * @returns {void}
   */
  update (connectedUsers) {
    this.connectedUsers = connectedUsers
    this.renderHTML()
  }

  get placeholder () {
    return this.root.querySelector('.placeholder')
  }

  get details () {
    return Array.from(this.root.querySelectorAll('wct-details'))
  }

  get template () {
    return this.root.querySelector('template')
  }
}
