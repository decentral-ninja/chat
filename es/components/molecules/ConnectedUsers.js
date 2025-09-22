// @ts-check
import { Shadow } from '../../../../web-components-toolbox/src/es/components/prototypes/Shadow.js'

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
  }

  connectedCallback () {
    this.hidden = true
    const showPromises = []
    if (this.shouldRenderCSS()) showPromises.push(this.renderCSS())
    if (this.shouldRenderHTML()) showPromises.push(this.renderHTML())
    Promise.all(showPromises).then(() => (this.hidden = false))
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
        const providerId = `${self.Environment?.providerNamespace || 'p_'}${providerName.replace(/[\.\:<>/]/g, '-')}` // string <ident> without dots https://developer.mozilla.org/en-US/docs/Web/CSS/ident
        const liString = /* html */`<li id="${providerId}">${providerName}</li>`
        let detail
        if ((detail = this.details.find(detail => detail.getAttribute('uid') === connectedUser.uid))) {
          if (!detail.root.querySelector(`li#${providerId}`)) {
            const div = document.createElement('div')
            div.innerHTML = liString
            detail.details.appendChild(div.children[0])
          }
        } else {
          this.html = /* html */`
            <wct-details uid='${connectedUser.uid}' open-event-name='connected-users-details-open-${this.getAttribute('uid')}'>
              <details>
                <summary>
                  <chat-a-nick-name uid='${connectedUser.uid}' nickname="${connectedUser.nickname}"${connectedUser.isSelf ? ' self' : ''}></chat-a-nick-name>
                </summary>
                ${liString}
              </details>
            </wct-details>
          `
        }
      })
    })
    // remove any details which are not in the connected
    this.details.forEach(detail => {
      if (Object.keys(this.connectedUsers).some(providerName => this.connectedUsers[providerName].find(connectedUser => detail.getAttribute('uid') === connectedUser?.uid))) {
        Array.from(detail.root.querySelectorAll('li')).forEach(li => {
          if (!this.connectedUsers[li.textContent]?.some(connectedUser => detail.getAttribute('uid') === connectedUser?.uid)) li.remove()
        })
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
