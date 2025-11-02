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
      :host([show-lone-providers]) {
        display: flex;
        flex-direction: column;
      }
      :host > #lone-providers {
        display: none;
      }
      :host([show-lone-providers]) > wct-details {
        order: 0;
      }
      :host([show-lone-providers]) > #lone-providers {
        display: block;
        order: 1;
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
    const style = `
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
        :host(:not([uid])) .title > div {
          align-items: center;
          display: flex;
          gap: 0.2em;
          text-decoration: underline;
        }
        :host .counter {
          white-space: nowrap;
        }
      </style>
    `
    if (!this.loneProviders) this.html = /* html */`
      <div id=lone-providers>
        <wct-details open-event-name='connected-users-details-open-${this.getAttribute('uid')}' animationend-event-name=wct-details-animationend empty-hide>
          ${style}
          <details>
            <summary>
              <div class=title>
                <div>
                  <wct-icon-mdx hover-on-parent-shadow-root-host title="historically connected providers" icon-url="../../../../../../img/icons/history.svg" size="1.5em"></wct-icon-mdx>historical providers
                </div>
              </div>
            </summary>
          </details>
        </wct-details>
      </div>
    `
    if (!this.placeholder) this.html = '<div class=placeholder>---</div>'
    // go through all connections and create the needed summary/details
    Object.keys(this.connectedUsers).forEach(providerName => {
      if (Array.isArray(this.connectedUsers[providerName])) {
        let providerId
        try {
          // @ts-ignore
          providerId = `${self.Environment?.providerNamespace || 'p_'}${new URL(providerName.split(separator)[1]).hostname.replaceAll('.', '-')}` // string <ident> without dots https://developer.mozilla.org/en-US/docs/Web/CSS/ident
        } catch (error) {
          // @ts-ignore
          providerId = `${self.Environment?.providerNamespace || 'p_'}${providerName.split(separator)[1].replaceAll('.', '-')}`
        }
        const providerNameString = /* html */`<chat-a-provider-name id="${providerId}" provider-dialog-show-event><span name>${providerName}</span></chat-a-provider-name>`
        if (this.connectedUsers[providerName].length) {
          // get all connected users
          this.connectedUsers[providerName].forEach(connectedUser => {
            if (!connectedUser) return
            let detail
            if ((detail = this.details.find(detail => detail.getAttribute('uid') === connectedUser.uid))) {
              // create provider in case not found, do nothing by illegal query selector.
              try {
                if (!detail.root.querySelector(`chat-a-provider-name#${providerId}`)) {
                  const div = document.createElement('div')
                  div.innerHTML = providerNameString
                  detail.details.appendChild(div.children[0])
                }
              } catch (error) {
                console.warn('connected users has illegal or not allowed querySelector:', `chat-a-provider-name#${providerId}`, error)
              }
            } else {
              this.html = /* html */`
                <wct-details uid='${connectedUser.uid}' open-event-name='connected-users-details-open-${this.getAttribute('uid')}' animationend-event-name=wct-details-animationend>
                  ${style}
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
        } else if (this.loneProviders) {
          // get all providers only connected with self
          let detail
          if ((detail = this.loneProviders.querySelector('wct-details'))) {
            // create provider in case not found, do nothing by illegal query selector.
            try {
              if (!detail.root.querySelector(`chat-a-provider-name#${providerId}`)) {
                const div = document.createElement('div')
                div.innerHTML = providerNameString
                detail.details.appendChild(div.children[0])
              }
            } catch (error) {
              console.warn('connected users has illegal or not allowed querySelector:', `chat-a-provider-name#${providerId}`, error)
            }
          }
        }
      }
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
    // clear loneProviders
    let detail
    if ((detail = this.loneProviders.querySelector('wct-details'))) {
      detail.root.querySelectorAll('chat-a-provider-name').forEach(providerName => {
        let keys
        if (!(keys = Object.keys(this.connectedUsers)).includes(providerName.dataName) || this.connectedUsers[providerName.dataName]?.length) providerName.remove()
      })
      // count all the loneProviders
      let counter = detail.summary.querySelector('.counter')
      if (!counter) {
        counter = document.createElement('span')
        counter.classList.add('counter');
        detail.summary.querySelector('.title').appendChild(counter)
      }
      counter.textContent = `(${detail.details.children.length - 1})`
    }
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
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/atoms/iconMdx/IconMdx.js?${Environment?.version || ''}`,
        name: 'wct-icon-mdx'
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
    return Array.from(this.root.querySelectorAll('wct-details[uid]'))
  }

  get loneProviders () {
    return this.root.querySelector('#lone-providers')
  }

  get template () {
    return this.root.querySelector('template')
  }
}
