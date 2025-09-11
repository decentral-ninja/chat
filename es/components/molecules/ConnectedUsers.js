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
    return !this.details
  }

  /**
   * renders the css
   * @returns Promise<void>
   */
  renderCSS () {
    this.css = /* css */`
      :host chat-a-nick-name {
        display: inline-block;
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
    this.html = Object.keys(this.connectedUsers).reduce((acc, providerName) => {
      const addedConnectedUsersUid = []
      return /* html */`
        ${acc}
        ${Array.isArray(this.connectedUsers[providerName])
          ? this.connectedUsers[providerName].reduce((acc, connectedUser) => {
            if (!connectedUser || addedConnectedUsersUid.includes(connectedUser.uid)) return acc
            addedConnectedUsersUid.push(connectedUser.uid)
            return `${acc}${connectedUser ? /* html */`
              <details onclick="event.stopPropagation()">
                <summary><chat-a-nick-name uid='${connectedUser.uid}' nickname="${connectedUser.nickname}"${connectedUser.isSelf ? ' self' : ''}></chat-a-nick-name></summary>
                ${providerName}
              </details>
            ` : ''}`
            }, '').trim()
          : 'none'
        }
      `
    }, '').trim() || 'none'
    // TODO: Render into wct-details
    // this.html = /* html */`
    //   <wct-details>
    //     <details>
    //       <summary>
    //         <h4>Summary</h4>
    //       </summary>
    //       <div>Detail</div>
    //     </details>
    //   </wct-details>
    // `
    // TODO: setup html and update with data
    // this.update(this.connectedUsers)
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
    //console.log('update', this, connectedUsers)
    // TODO: Render only the changed parts (cluster providers per username), don't renderHTML, renderHTML only once to setup html nodes, then particular updates
    this.html = ''
    this.renderHTML()
  }

  get details () {
    return this.root.querySelector('wct-details')
  }

  get template () {
    return this.root.querySelector('template')
  }
}
