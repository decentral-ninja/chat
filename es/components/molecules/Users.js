// @ts-check
import { Shadow } from '../../../../event-driven-web-components-prototypes/src/Shadow.js'

/* global self */
/* global Environment */

/**
 * The users view
 *
 * @export
 * @class Users
 */
export default class Users extends Shadow() {
  constructor (options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, ...options }, ...args)

    let lastGetData = null
    let lastSeparator = null
    let timeoutId = null
    this.usersEventListener = async event => {
      lastGetData = event.detail.getData
      clearTimeout(timeoutId)
      timeoutId = setTimeout(async () => {
        console.log('users', {
          data: await event.detail.getData(),
          ...event.detail
        })
        this.renderHTML(await event.detail.getData(), event.detail.selfUser, (lastSeparator = event.detail.separator))
      }, 2000)
    }

    this.openDialog = async event => {
      event.preventDefault()
      this.dialog.show('show-modal')
      // TODO: Make this cleaner and render graph once opened
      if (lastGetData) {
        this.usersGraph.innerHTML = /* html */`
        <chat-a-p2p-graph separator="${lastSeparator}">
          <template>${JSON.stringify(Array.from((await lastGetData()).usersConnectedWithSelf))}</template>
        </chat-a-p2p-graph>
      `
      }
    }

    this.p2pGraphClickEventListener = event => console.log('p2pGraphClickEventListener', event.detail)

    let resizeTimeout = null
    this.resizeListener = event => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(async () => {
        // TODO: Make this cleaner and render graph once opened
        // TODO: active attribute is the uid of a user:  active='${Array.from((await lastGetData()).usersConnectedWithSelf)[0][0]}'
        if (lastGetData) {
          this.usersGraph.innerHTML = /* html */`
          <chat-a-p2p-graph separator="${lastSeparator}">
            <template>${JSON.stringify(Array.from((await lastGetData()).usersConnectedWithSelf))}</template>
          </chat-a-p2p-graph>
        `
        }
      }, 200)
    }
  }

  connectedCallback () {
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
    this.globalEventTarget.addEventListener('yjs-users', this.usersEventListener)
    this.details.addEventListener('click', this.openDialog)
    this.addEventListener('p2p-graph-click', this.p2pGraphClickEventListener)
    self.addEventListener('resize', this.resizeListener)
  }

  disconnectedCallback () {
    this.globalEventTarget.removeEventListener('yjs-users', this.usersEventListener)
    this.details.removeEventListener('click', this.openDialog)
    this.addEventListener('p2p-graph-click', this.p2pGraphClickEventListener)
    self.removeEventListener('resize', this.resizeListener)
  }

  /**
   * Evaluates if a render of CSS is necessary
   *
   * @return {boolean}
   */
  shouldRenderCSS () {
    return !this.root.querySelector(`:host > style[_css], ${this.tagName} > style[_css]`)
  }

  /**
   * Evaluates if a render of HTML is necessary
   *
   * @return {boolean}
   */
  shouldRenderHTML () {
    return !this.details
  }

  /**
   * Renders the CSS
   *
   * @return {void}
   */
  renderCSS () {
    this.css = /* css */`
      :host {
        cursor: pointer;
      }
      :host > wct-dialog {
        font-size: 1rem;
      }
    `
  }

  /**
  * renders the html
  *
  * @return {Promise<void>}
  */
  renderHTML (data, selfUser, separator) {
    // todo: check navigator online + provider graph name
    if (data) {
      if (data.usersConnectedWithSelf.size - 1) {
        this.connectedUsers.textContent = data.usersConnectedWithSelf.size ? data.usersConnectedWithSelf.size - 1 : 'You are alone!'
        this.connectedUsers.classList.remove('warning')
      } else {
        this.connectedUsers.textContent = 'You are alone!'
        this.connectedUsers.classList.add('warning')
      }
      // TODO: add sessionProviders into the template from provider controller
      // todo: add graph for data.allUsers
      // add self user, incase it has no connected users "_synced"
      // console.log('*********', data)
      this.usersGraph.innerHTML = /* html */`
        <chat-a-p2p-graph separator="${separator}">
          <template>${JSON.stringify(Array.from(data.usersConnectedWithSelf))}</template>
        </chat-a-p2p-graph>
      `
      this.usersOl.innerHTML = ''
      Users.renderUserTableList(this.usersOl, data.usersConnectedWithSelf, selfUser)
      this.allUsersOl.innerHTML = ''
      Users.renderUserTableList(this.allUsersOl, data.allUsers, selfUser)
    } else {
      this.html = /* html */`
        <details>
          <summary>Directly connected to <span id="connected-users">...</span> User(s)</summary>
        </details>
        <wct-dialog namespace="dialog-top-slide-in-">
          <style protected>
            :host h5 {
              position: sticky;
              top: 0;
            }
            :host ol > li {
              word-break: break-all;
              margin-bottom: var(--spacing);
            }
            :host .nickname {
              color: blue;
              font-weight: bold;
            }
            :host .self {
              color: green;
              font-weight: bold;
            }
            :host .warning {
              color: red;
            }
            :host > dialog #users-graph {
              padding: 5svh 10svw;
            }
            :host > dialog #users-graph:has(> chat-a-p2p-graph[no-data]), :host > dialog #users-graph:has(> chat-a-p2p-graph:not([no-data])) + * {
              display: none
            }
          </style>
          <dialog>
            <wct-menu-icon id="close" no-aria class="open sticky" namespace="menu-icon-close-" no-click></wct-menu-icon>
            <h4>Connection Data:</h4>
            <div>
              <div id="users-graph"></div>
              <p>No active connections...</p>
              <hr>
              <div>
                <h5>Mutually connected users</h5>
                <ol id="users"></ol>
              </div>
              <hr>
              <div>
                <h5>Users which once were connected</h5>
                <ol id="all-users"></ol>
              </div>
            </div>
          </dialog>
        </wct-dialog>
      `
      new Promise(resolve => this.dispatchEvent(new CustomEvent('yjs-get-nickname', {
        detail: {
          resolve
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))).then(nickname => (this.html = /* html */`<chat-m-nick-name-dialog namespace="dialog-top-slide-in-" show-event-name="open-nickname" nickname="${nickname}"></chat-m-nick-name-dialog>`))
    }
    return Promise.all([
      new Promise(resolve => this.dispatchEvent(new CustomEvent('yjs-get-providers-event-detail', {
        detail: {
          resolve
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))),
      this.fetchModules([
        {
          // @ts-ignore
          path: `${this.importMetaUrl}../atoms/p2pGraph/P2pGraph.js?${Environment?.version || ''}`,
          name: 'chat-a-p2p-graph'
        },
        {
          // @ts-ignore
          path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/atoms/menuIcon/MenuIcon.js?${Environment?.version || ''}`,
          name: 'wct-menu-icon'
        },
        {
          // @ts-ignore
          path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/molecules/dialog/Dialog.js?${Environment?.version || ''}`,
          name: 'wct-dialog'
        },
        {
          // @ts-ignore
          path: `${this.importMetaUrl}./dialogs/NickNameDialog.js?${Environment?.version || ''}`,
          name: 'chat-m-nick-name-dialog'
        }
      ])
    ]).then(async ([providers]) => {
      // providers
    })
  }

  static renderUserTableList (ol, users, selfUser) {
    users.forEach(user => {
      const li = document.createElement('li')
      if (user.uid === selfUser.uid) li.classList.add('self')
      ol.appendChild(li)
      const table = document.createElement('table')
      li.appendChild(table)
      for (const key in user) {
        const tr = document.createElement('tr')
        if (key === 'nickname') tr.classList.add('nickname')
        table.appendChild(tr)
        const tdOne = document.createElement('td')
        tdOne.textContent = key
        tr.appendChild(tdOne)
        const tdTwo = document.createElement('td')
        tdTwo.textContent = user[key]
        tr.appendChild(tdTwo)
      }
    })
  }

  get details () {
    return this.root.querySelector('details')
  }

  get dialog () {
    return this.root.querySelector('wct-dialog')
  }

  get connectedUsers () {
    return this.root.querySelector('#connected-users')
  }

  get usersGraph () {
    return this.dialog.root.querySelector('#users-graph')
  }

  get usersOl () {
    return this.dialog.root.querySelector('#users')
  }

  get allUsersOl () {
    return this.dialog.root.querySelector('#all-users')
  }

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }
}
