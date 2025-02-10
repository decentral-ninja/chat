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

    let lastUsersEventGetData = null
    let lastSeparator = this.getAttribute('separator') || '<>'
    let timeoutId = null
    this.usersEventListener = async event => {
      lastUsersEventGetData = event.detail.getData
      lastSeparator = event.detail.separator
      this.setAttribute('updating', '')
      clearTimeout(timeoutId)
      timeoutId = setTimeout(async () => {
        if (this.isDialogOpen()) {
          this.renderData(await event.detail.getData(), lastSeparator)
        } else {
          Users.renderSummaryText(this.summary, await event.detail.getData(), this.hasAttribute('online'))
        }
        this.removeAttribute('updating')
        // @ts-ignore
      }, this.isDialogOpen() ? 200 : self.Environment.awarenessEventListenerDelay)
    }

    this.openDialog = async event => {
      event.preventDefault()
      this.dialog.show('show-modal')
      if (lastUsersEventGetData) {
        clearTimeout(timeoutId)
        this.renderData(await lastUsersEventGetData(), lastSeparator)
        this.removeAttribute('updating')
      }
      this.scrollActiveIntoView()
    }
    this.userDialogShowEventEventListener = event => {
      this.setAttribute('active', event.detail.uid)
      this.openDialog(event)
    }

    // listens to the dialog node but reacts on active list elements to be deactivated
    this.dialogClickEventListener = async event => {
      let activeNode
      if (event.composedPath().some(node => (activeNode = node).tagName === 'LI' && node.classList.contains('active'))) {
        // @ts-ignore
        this.setActive(activeNode.getAttribute('uid'), this.usersOl, false)
        // @ts-ignore
        this.setActive(activeNode.getAttribute('uid'), this.allUsersOl, false, false)
        if (lastUsersEventGetData) Users.renderP2pGraph(this.usersGraph, (await lastUsersEventGetData()).usersConnectedWithSelf, lastSeparator)
        this.usersGraph.scrollIntoView({ behavior: 'smooth' })
      }
    }

    this.p2pGraphClickEventListener = event => {
      if (event.detail.graphUserObj) {
        this.setActive(event.detail.graphUserObj.id, this.usersOl, event.detail.isActive)
        this.setActive(event.detail.graphUserObj.id, this.allUsersOl, event.detail.isActive, false)
      }
    }

    this.nickNameClickEventListener = async event => {
      this.setActive(event.detail.uid, this.usersOl, true)
      this.setActive(event.detail.uid, this.allUsersOl, true, false)
      if (lastUsersEventGetData) Users.renderP2pGraph(this.usersGraph, (await lastUsersEventGetData()).usersConnectedWithSelf, lastSeparator, this.getAttribute('active'))
    }

    this.onlineEventListener = async event => {
      this.setAttribute('online', '')
      if (lastUsersEventGetData) Users.renderSummaryText(this.summary, await lastUsersEventGetData(), this.hasAttribute('online'))
    }
    this.offlineEventListener = async event => {
      this.removeAttribute('online')
      if (lastUsersEventGetData) Users.renderSummaryText(this.summary, await lastUsersEventGetData(), this.hasAttribute('online'))
    }
    if (navigator.onLine) {
      this.onlineEventListener()
    } else {
      this.offlineEventListener()
    }

    let resizeTimeout = null
    this.resizeEventListener = event => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(async () => {
        // the graph has to be refreshed when resize
        if (lastUsersEventGetData) Users.renderP2pGraph(this.usersGraph, (await lastUsersEventGetData()).usersConnectedWithSelf, lastSeparator)
      }, 200)
    }
  }

  connectedCallback () {
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
    this.globalEventTarget.addEventListener('yjs-users', this.usersEventListener)
    this.globalEventTarget.addEventListener('user-dialog-show-event', this.userDialogShowEventEventListener)
    this.details.addEventListener('click', this.openDialog)
    this.dialog.addEventListener('click', this.dialogClickEventListener)
    this.addEventListener('p2p-graph-click', this.p2pGraphClickEventListener)
    this.addEventListener('nickname-click', this.nickNameClickEventListener)
    self.addEventListener('online', this.onlineEventListener)
    self.addEventListener('offline', this.offlineEventListener)
    self.addEventListener('resize', this.resizeEventListener)
  }

  disconnectedCallback () {
    this.globalEventTarget.removeEventListener('yjs-users', this.usersEventListener)
    this.globalEventTarget.removeEventListener('user-dialog-show-event', this.userDialogShowEventEventListener)
    this.details.removeEventListener('click', this.openDialog)
    this.dialog.removeEventListener('click', this.dialogClickEventListener)
    this.removeEventListener('p2p-graph-click', this.p2pGraphClickEventListener)
    this.removeEventListener('nickname-click', this.nickNameClickEventListener)
    self.removeEventListener('online', this.onlineEventListener)
    self.removeEventListener('offline', this.offlineEventListener)
    self.removeEventListener('resize', this.resizeEventListener)
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
      :host > details > summary > a-loading {
        display: none;
      }
      :host([updating]) > details > summary > a-loading {
        display: inline-block;
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
  renderHTML () {
    this.html = /* html */`
      <details>
        <summary><a-loading namespace="loading-default-" size="0.75"></a-loading> Looking up users...</summary>
      </details>
      <wct-dialog namespace="dialog-top-slide-in-">
        <style protected>
          :host {
            --dialog-top-slide-in-ul-padding-left: 0;
            --dialog-top-slide-in-ol-list-style: none;
            --dialog-top-slide-in-ul-li-padding-left: 1em;
          }
          :host ol > li {
            --box-shadow-color: var(--color-user);
            --box-shadow-default: var(--box-shadow-length-one) var(--box-shadow-color), var(--box-shadow-length-two) var(--box-shadow-color);
            border: 1px solid var(--color-user);
            word-break: break-all;
            margin-bottom: var(--spacing);
            box-shadow: var(--box-shadow-default);
            padding: 0.25em;
            padding-left: 0.25em !important;
            border-radius: var(--border-radius);
            overflow: auto;
            scrollbar-color: var(--color) var(--background-color);
            scrollbar-width: thin;
            transition: padding 0.05s ease-out;
          }
          :host ol > li.self {
            --box-shadow-color: var(--color-secondary);
            --box-shadow-default: var(--box-shadow-length-one) var(--box-shadow-color), var(--box-shadow-length-two) var(--box-shadow-color);
            border: 1px solid var(--color-secondary);
          }
          :host ol > li.active {
            cursor: pointer;
          }
          :host ol > li:active {
            padding: 0;
            padding-left: 0 !important;
          }
          :host ol > li:active > * {
            padding: 1em;
          }
          :host ol > li > * {
            padding: 0.75em;
            margin: 0;
            transition: padding 0.05s ease-out;
          }
          :host ol > li.active > * {
            --box-shadow-default: var(--box-shadow-length-one) var(--box-shadow-color), var(--box-shadow-length-two) var(--box-shadow-color);
            --h4-color: var(--background-color);
            color: var(--background-color);
            background-color: var(--background-color-rgba-50);
            border-radius: var(--border-radius);
          }
          :host .nickname {
            color: blue;
            font-weight: bold;
          }
          :host chat-a-nick-name {
            display: inline-block;
          }
          :host > dialog #users-graph {
            border-radius: var(--border-radius);
            padding: 5svh 10svw;
            border: 1px dashed var(--color-secondary);
          }
          /* TODO: online is on Users and not the dialog... solve with ::part selector from Users CSS... :host(:not([online])) > dialog #users-graph:has(> chat-a-p2p-graph),*/
          :host > dialog #users-graph:empty,
          :host > dialog #users-graph:has(> chat-a-p2p-graph[no-data]),
          :host > dialog #users-graph:has(> chat-a-p2p-graph:not([no-data])) ~ #no-connections {
            display: none
          }
        </style>
        <dialog>
          <wct-menu-icon id="close" no-aria class="open sticky" namespace="menu-icon-close-" no-click></wct-menu-icon>
          <h4>Connection Data:</h4>
          <div>
            <div id="users-graph"></div>
            <p id="no-connections">No active connections...</p>
            <br>
            <hr>
            <br>
            <div>
              <h4>Connected Users</h4>
              <ol id="users"></ol>
            </div>
            <br>
            <hr>
            <br>
            <div>
              <h4>All Users who were once connected</h4>
              <ol id="all-users"></ol>
            </div>
          </div>
        </dialog>
      </wct-dialog>
    `
    // render the nickname dialog
    new Promise(resolve => this.dispatchEvent(new CustomEvent('yjs-get-nickname', {
      detail: {
        resolve
      },
      bubbles: true,
      cancelable: true,
      composed: true
    }))).then(nickname => (this.html = /* html */`<chat-m-nick-name-dialog namespace="dialog-top-slide-in-" show-event-name="open-nickname" nickname="${nickname}"></chat-m-nick-name-dialog>`))
    return this.fetchModules([
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
        path: `${this.importMetaUrl}../atoms/nickName/NickName.js?${Environment?.version || ''}`,
        name: 'chat-a-nick-name'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}./dialogs/NickNameDialog.js?${Environment?.version || ''}`,
        name: 'chat-m-nick-name-dialog'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../components/atoms/loading/Loading.js?${Environment?.version || ''}`,
        name: 'a-loading'
      }
    ])
  }

  renderData (data, separator) {
    Users.renderSummaryText(this.summary, data, this.hasAttribute('online'))
    Users.renderP2pGraph(this.usersGraph, data.usersConnectedWithSelf, separator, this.getAttribute('active'))
    Users.renderUserTableList(this.usersOl, data.usersConnectedWithSelf, data.allUsers, separator, this.getAttribute('active'))
    Users.renderUserTableList(this.allUsersOl, data.allUsers, data.allUsers, separator, this.getAttribute('active'))
  }

  setActive (uid, ol, active = true, scroll = true) {
    Array.from(ol.querySelectorAll('li.active')).forEach(li => li.classList.remove('active'))
    let li
    if (active && (li = ol.querySelector(`li[uid='${uid}']`))) {
      li.classList.add('active')
      this.setAttribute('active', uid)
    } else {
      this.removeAttribute('active')
    }
    if (active && scroll) this.scrollActiveIntoView()
  }

  scrollActiveIntoView () {
    let liActive
    if ((liActive = this.usersOl.querySelector('li.active'))) return liActive.scrollIntoView({ behavior: 'smooth' })
    this.allUsersOl.querySelector('li.active')?.scrollIntoView({ behavior: 'smooth' })
  }

  static renderSummaryText (summary, data, online) {
    summary.innerHTML = /* html */`
      <a-loading namespace="loading-default-" size="0.75"></a-loading> ${online
        ? data.usersConnectedWithSelf.size > 1
          ? `You are connected to ${data.usersConnectedWithSelf.size - 1} ${data.usersConnectedWithSelf.size === 2 ? 'User' : 'Users'}`
          : 'You are alone!'
        : 'You are offline!'
      }
    `
  }

  static renderP2pGraph (graph, data, separator, activeUid) {
    graph.innerHTML = /* html */`
      <chat-a-p2p-graph separator="${separator || ''}"${activeUid ? ` active='${activeUid}'` : ''}>
        <template>${JSON.stringify(Array.isArray(data) ? data : Array.from(data))}</template>
      </chat-a-p2p-graph>
    `
  }

  static renderUserTableList (ol, users, allUsers, separator, activeUid, clear = true) {
    if (clear) ol.innerHTML = ''
    users.forEach(user => {
      const li = document.createElement('li')
      li.setAttribute('uid', user.uid)
      if (activeUid === user.uid) li.classList.add('active')
      if (user.isSelf) li.classList.add('self')
      ol.appendChild(li)
      const table = document.createElement('table')
      li.appendChild(table)
      for (const key in user) {
        if (!['connectedUsers', 'connectedUsersCount', 'mutuallyConnectedUsersCount'].includes(key)) {
          // make the table
          const tr = document.createElement('tr')
          if (key === 'nickname') tr.classList.add('nickname')
          table.appendChild(tr)
          const tdOne = document.createElement('td')
          tdOne.textContent = key
          tr.appendChild(tdOne)
          const tdTwo = document.createElement('td')
          tr.appendChild(tdTwo)
          if (key === 'mutuallyConnectedUsers') {
            for (const providerName in user[key]) {
              tdTwo.innerHTML = Array.isArray(user[key][providerName])
                ? user[key][providerName].reduce((acc, mutuallyConnectedUser) => {
                  const fullUser = allUsers.get(mutuallyConnectedUser.uid)
                  return `${acc ? `${acc}, ` : acc}${fullUser ? `<chat-a-nick-name uid='${fullUser.uid}' nickname="${fullUser.nickname}"${fullUser.isSelf ? ' self' : ''} click-only-on-icon></chat-a-nick-name>` : ''}`
                }, '')
                : 'none'
            }
          } else {
            tdTwo.textContent = typeof user[key] === 'string' && user[key].includes('epoch')
              ? new Date(JSON.parse(user[key]).epoch).toLocaleString(navigator.language)
              : typeof user[key] === 'object'
                ? JSON.stringify(user[key])
                : user[key]
          }
        }
      }
    })
  }

  get details () {
    return this.root.querySelector('details')
  }

  get summary () {
    return this.details.querySelector('summary')
  }

  get dialog () {
    return this.root.querySelector('wct-dialog')
  }

  isDialogOpen () {
    return this.dialog.root.querySelector('dialog[open]')
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
