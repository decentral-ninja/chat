// @ts-check
import { Shadow } from '../../../../event-driven-web-components-prototypes/src/Shadow.js'
import { getHexColor } from '../../../../Helpers.js'

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
      this.iconStatesEl.setAttribute('updating', '')
      clearTimeout(timeoutId)
      timeoutId = setTimeout(async () => {
        if (this.isDialogOpen()) {
          this.renderData(await event.detail.getData(), lastSeparator)
        } else {
          Users.updateIconStatesEl(this.iconStatesEl, await event.detail.getData(), this.hasAttribute('online'))
        }
        this.iconStatesEl.removeAttribute('updating')
        // @ts-ignore
      }, this.isDialogOpen() ? 2000 : self.Environment.awarenessEventListenerDelay)
    }

    this.openDialog = async event => {
      event.preventDefault()
      this.dialog.show('show-modal')
      if (lastUsersEventGetData) {
        clearTimeout(timeoutId)
        this.renderData(await lastUsersEventGetData(), lastSeparator).then(() => this.scrollActiveIntoView())
        this.iconStatesEl.removeAttribute('updating')
      }
    }
    this.userDialogShowEventEventListener = event => {
      if (event.detail?.uid) this.setAttribute('active', event.detail.uid)
      this.openDialog(event)
    }

    // listens to the dialog node but reacts on active list elements to be deactivated
    this.dialogClickEventListener = async event => {
      let activeNode
      if (event.composedPath().some(node => (activeNode = node).tagName === 'LI' && node.classList.contains('active') && typeof node.hasAttribute === 'function' && !node.hasAttribute('data-tab'))) {
        // @ts-ignore
        this.setActive(activeNode.getAttribute('uid'), this.usersOl, false)
        // @ts-ignore
        this.setActive(activeNode.getAttribute('uid'), this.allUsersOl, false)
        this.removeAttribute('active')
        if (lastUsersEventGetData) {
          Users.renderP2pGraph(this.usersGraph, (await lastUsersEventGetData()).usersConnectedWithSelf, lastSeparator)
          Users.renderP2pGraph(this.usersGraphHistory, (await lastUsersEventGetData()).allUsers, lastSeparator, undefined, true)
        }
        this.usersGraph.scrollIntoView({ behavior: 'smooth' })
        this.usersGraphHistory.scrollIntoView({ behavior: 'smooth' })
      } else if (event.composedPath().some(node => typeof (activeNode = node).hasAttribute === 'function' && node.hasAttribute('data-tab')) && lastUsersEventGetData) {
        Users.renderP2pGraph(this.usersGraph, (await lastUsersEventGetData()).usersConnectedWithSelf, lastSeparator)
        Users.renderP2pGraph(this.usersGraphHistory, (await lastUsersEventGetData()).allUsers, lastSeparator, undefined, true)
      }
    }

    this.p2pGraphClickEventListener = event => {
      if (event.detail.graphUserObj) {
        this.setActive(event.detail.graphUserObj.id, this.usersOl, event.detail.isActive)
        this.setActive(event.detail.graphUserObj.id, this.allUsersOl, event.detail.isActive)
        if (event.detail.isActive) {
          this.setAttribute('active', event.detail.graphUserObj.id)
        } else {
          this.removeAttribute('active')
        }
      }
    }

    this.nickNameClickEventListener = async event => {
      this.setActive(event.detail.uid, this.usersOl, true)
      this.setActive(event.detail.uid, this.allUsersOl, true)
      this.setAttribute('active', event.detail.uid)
      if (lastUsersEventGetData) {
        Users.renderP2pGraph(this.usersGraph, (await lastUsersEventGetData()).usersConnectedWithSelf, lastSeparator, this.getAttribute('active'))
        Users.renderP2pGraph(this.usersGraphHistory, (await lastUsersEventGetData()).allUsers, lastSeparator, this.getAttribute('active'), true)
      }
    }

    this.onlineEventListener = async event => {
      this.setAttribute('online', '')
      this.dialog?.setAttribute('online', '')
      if (lastUsersEventGetData) Users.updateIconStatesEl(this.iconStatesEl, await lastUsersEventGetData(), this.hasAttribute('online'))
    }
    this.offlineEventListener = async event => {
      this.removeAttribute('online')
      this.dialog?.removeAttribute('online')
      if (lastUsersEventGetData) Users.updateIconStatesEl(this.iconStatesEl, await lastUsersEventGetData(), this.hasAttribute('online'))
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
        if (lastUsersEventGetData) {
          Users.renderP2pGraph(this.usersGraph, (await lastUsersEventGetData()).usersConnectedWithSelf, lastSeparator, this.getAttribute('active'))
          Users.renderP2pGraph(this.usersGraphHistory, (await lastUsersEventGetData()).allUsers, lastSeparator, this.getAttribute('active'), true)
        }
      }, 200)
    }
  }

  connectedCallback () {
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
    this.globalEventTarget.addEventListener('yjs-users', this.usersEventListener)
    this.globalEventTarget.addEventListener('user-dialog-show-event', this.userDialogShowEventEventListener)
    this.iconStatesEl.addEventListener('click', this.openDialog)
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
    this.iconStatesEl.removeEventListener('click', this.openDialog)
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
    return !this.iconStatesEl
  }

  /**
   * Renders the CSS
   *
   * @return {void}
   */
  renderCSS () {
    this.css = /* css */`
      :host {
        --counter-color: var(--color-green-full);
        --counter-color-hover: var(--counter-color);
        cursor: pointer;
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
      <a-icon-states show-counter-on-hover>
        <wct-icon-mdx state="default" title="Users" icon-url="../../../../../../img/icons/user-other.svg" size="2em"></wct-icon-mdx>
        <wct-icon-mdx state="connected" title="Users active" style="color:var(--color-green-full)" icon-url="../../../../../../img/icons/user-other.svg" size="2em"></wct-icon-mdx>
        <wct-icon-mdx state="disconnected" title="Not connected to users" style="color:var(--color-error)" icon-url="../../../../../../img/icons/user-off.svg" size="2em"></wct-icon-mdx>
        <wct-icon-mdx state="offline" title="You are offline!" style="color:var(--color-error)" icon-url="../../../../../../img/icons/user-off.svg" size="2em"></wct-icon-mdx>
      </a-icon-states>
      <wct-dialog namespace="dialog-top-slide-in-"${this.hasAttribute('online') ? ' online' : ''}>
        <style protected>
          :host {
            --dialog-top-slide-in-ul-padding-left: 0;
            --dialog-top-slide-in-ol-list-style: none;
            --dialog-top-slide-in-ul-li-padding-left: 1em;
          }
          :host h4.title {
            position: sticky;
            top: calc(-1em - 1px);
            background-color: var(--background-color);
            padding: 0.5em;
            border: 1px solid var(--color);
            width: fit-content;
            z-index: 1;
          }
          :host h4.title.connected {
            background-color: var(--color-green);
            color: var(--background-color);
          }
          :host h4.title.not-connected {
            background-color: var(--color-secondary);
            color: var(--background-color);
          }
          :host(:not([online])) h4.title {
            padding-bottom: 1em;
          }
          :host ol {
            --dialog-top-slide-in-ul-display: flex;
            --dialog-top-slide-in-ul-flex-direction: row;
            flex-wrap: wrap;
            gap: 1em;
          }
          :host ol > wct-load-template-tag {
            min-height: 25em;
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
          :host ol > li, :host ol > wct-load-template-tag {
            width: calc(50% - 0.5em);
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
            padding: var(--card-padding, 0.75em);
            margin: 0;
            transition: padding 0.05s ease-out;
          }
          :host ol > li:where([self], .active) > * {
            --color: var(--background-color);
            --a-color: var(--background-color);
            --h2-color: var(--background-color);
            --h3-color: var(--background-color);
            --h4-color: var(--background-color);
            --box-shadow-default: var(--box-shadow-length-one) var(--box-shadow-color), var(--box-shadow-length-two) var(--box-shadow-color);
            color: var(--background-color);
            border-radius: var(--border-radius);
          }
          :host ol > li[self] > * {
            border: 1px solid var(--color-secondary);
            background-color: var(--background-color-rgba-50);
            box-shadow: 0px 0px 0.5em var(--color-secondary);
          }
          :host ol > li.active > * {
            background-color: var(--color-active);
          }
          :host ol > li > div {
            height: 100%;
          }
          :host ol > li > div > table {
            margin: 0;
          }
          :host ol > li > div > table > tbody {
            display: grid;
            grid-template-columns: 1fr 1fr;
            margin: 0;
          }
          :host ol > li > div > table > tbody > tr {
            display: contents;
          }
          :host ol > li:where(.updated, .outdated) > div > table > tbody > tr.time-status {
            padding-bottom: var(--h-margin-bottom, 1em);
          }
          :host ol > li:where(.updated, .outdated) > div > table > tbody > tr.time-status > td {
            font-style: italic;
            margin-bottom: var(--h-margin-bottom, 1em);
          }
          :host ol > li:not(.active, [self]).updated > div > h2 {
            border-bottom: 1px solid var(--color-green-full);
          }
          :host ol > li:not(.active, [self]).updated > div > table > tbody > tr.time-status > td.time-status-icons {
            --color: var(--color-green-full);
          }
          :host ol > li.updated > div > table > tbody > tr.time-status > td {
            border-bottom: 1px dotted var(--color-green-full);
          }
          :host ol > li:not(.active, [self]).outdated > div > h2 {
            border-bottom: 1px solid var(--color-error);
          }
          :host ol > li:not(.active, [self]).outdated > div > table > tbody > tr.time-status > td.time-status-icons {
            --color: var(--color-error);
          }
          :host ol > li.outdated > div > table > tbody > tr.time-status > td {
            border-bottom: 1px dotted var(--color-error);
          }
          :host ol > li > div > table > tbody > tr > td {
            overflow-wrap: anywhere;
          }
          :host ol > li > div > table > tbody > tr.nickname {
            font-weight: bold;
          }
          :host ol > li.self > div > table > tbody > tr.nickname {
            color: var(--color-secondary);
            font-weight: bold;
          }
          :host ol > li > div > h2 {
            --color-hover: var(--color);
            --cursor-hover: auto;
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--color);
            overflow-wrap: anywhere;
          }
          :host ol > li > div > h2 > span.user-icon {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          :host ol > li > div > h2 > span.user-icon > .tiny{
            font-family: var(--font-family);
            color: var(--color);
            font-size: 0.25em;
            line-height: 0.5em;
            margin-bottom: 1.75em;
          }
          :host ol > li.active > div > h2 {
            --color: var(--background-color);
            --color-hover: var(--color);
          }
          :host ol > li.active > div > h2 > span.user-icon > .tiny{
            color: var(--background-color);
          }
          :host ol > li.active > div > h2 {
            --cursor-hover: pointer;
            border-bottom: 1px solid var(--background-color);
          }
          :host chat-a-nick-name {
            display: inline-block;
          }
          :host > dialog {
            scrollbar-color: var(--color) var(--background-color);
            scrollbar-width: thin;
          }
          :host > dialog :where(#users-graph, #users-graph-history) {
            border-radius: var(--border-radius);
            padding: 5svh 10svw;
            border: 1px dashed var(--color-secondary);
          }
          :host([online]) > dialog #offline,
          :host(:not([online])) > dialog wct-m-tabs,
          :host > dialog :where(#users-graph, #users-graph-history):empty,
          :host > dialog :where(#users-graph, #users-graph-history):has(chat-a-p2p-graph[no-data]),
          :host > dialog :where(#users-graph, #users-graph-history):has(chat-a-p2p-graph:not([no-data])) ~ .no-connections {
            display: none;
          }
          :host > dialog wct-m-tabs {
            --dialog-top-slide-in-ul-flex-direction: row;
          }
          :host > dialog wct-m-tabs li:hover {
            --color: var(--background-color);
          }
          :host > dialog #offline {
            --dialog-top-slide-in-p-margin: 0;
            color: var(--color-disabled, var(--color-secondary));
            z-index: 10;
            position: sticky;
            top: 3px;
          }
          :host > dialog .no-connections {
            --dialog-top-slide-in-p-margin: 0;
            color: var(--color-secondary);
          }
          @media only screen and (max-width: ${this.mobileBreakpoint}) {
            :host ol > li, :host ol > wct-load-template-tag {
              width: 100%;
            }
          }
          @media only screen and (min-width: 1500px) {
            :host ol > li, :host ol > wct-load-template-tag {
              width: calc(33.3% - 0.66em);
            }
          }
          @media only screen and (min-width: 2500px) {
            :host ol > li, :host ol > wct-load-template-tag {
              width: calc(25% - 0.75em);
            }
          }
        </style>
        <dialog>
          <wct-menu-icon id="close" no-aria class="open sticky" namespace="menu-icon-close-" no-click></wct-menu-icon>
          <h4>Connection Data:</h4>
          <p id="offline">You are offline!</p>
          <div>
            <wct-m-tabs id="tabs" mode=false no-history>
              <ul class="tab-navigation">
                  <li data-tab="Actively connected users">Actively connected users</li>
                  <li data-tab="Historically connected users">Historically connected users</li>
              </ul>
              <section class="tab-content">
                  <div id="users-graph"></div>
                  <p class="no-connections">No active connections!</p>
              </section>
              <section class="tab-content">
                  <div id="users-graph-history"></div>
                  <p class="no-connections">No active connections!</p>
              </section>
            </wct-m-tabs>
            <br>
            <hr>
            <br>
            <div>
              <h4 class="title connected">Connected Users</h4>
              <ol id="users"></ol>
            </div>
            <p class="no-connections">No active connections!</p>
            <br>
            <hr>
            <br>
            <div>
              <h4 class="title not-connected">Not Connected Users</h4>
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
    }))).then(({ nickname, randomNickname }) => (this.html = /* html */`<chat-m-nick-name-dialog ${randomNickname ? 'open ' : ''}namespace="dialog-top-slide-in-" show-event-name="open-nickname" nickname="${nickname}"></chat-m-nick-name-dialog>`))
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
        path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/molecules/tabs/Tabs.js?${Environment?.version || ''}`,
        name: 'wct-m-tabs'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/molecules/dialog/Dialog.js?${Environment?.version || ''}`,
        name: 'wct-dialog'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/atoms/iconMdx/IconMdx.js?${Environment?.version || ''}`,
        name: 'wct-icon-mdx'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../components/atoms/iconStates/IconStates.js?${Environment?.version || ''}`,
        name: 'a-icon-states'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/molecules/loadTemplateTag/LoadTemplateTag.js?${Environment?.version || ''}`,
        name: 'wct-load-template-tag'
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
      }
    ])
  }

  async renderData (data, separator) {
    Users.updateIconStatesEl(this.iconStatesEl, data, this.hasAttribute('online'))
    Users.renderP2pGraph(this.usersGraph, data.usersConnectedWithSelf, separator, this.getAttribute('active'))
    Users.renderP2pGraph(this.usersGraphHistory, data.allUsers, separator, this.getAttribute('active'), true)
    // get the timestamp of the newest message
    const newestMessage = (await new Promise(resolve => this.dispatchEvent(new CustomEvent('yjs-get-chat-event-detail', {
      detail: {
        resolve
      },
      bubbles: true,
      cancelable: true,
      composed: true
    }))).then(chatEventDetail => chatEventDetail.getAll()).then(textObjs => textObjs.sort((a, b) => a.timestamp - b.timestamp).slice(-1)[0]))
    await Users.renderUserTableList(this.usersOl, data.usersConnectedWithSelf, data.allUsers, newestMessage, true, this.getAttribute('active'))
    await Users.renderUserTableList(this.allUsersOl, new Map(Array.from(data.allUsers).filter(([key, user]) => !data.usersConnectedWithSelf.get(key)).sort((a, b) => JSON.parse(b[1].awarenessEpoch || b[1].epoch).epoch - JSON.parse(a[1].awarenessEpoch || a[1].epoch).epoch)), data.allUsers, newestMessage, false, this.getAttribute('active'))
  }

  setActive (uid, ol, active = true, scroll = true) {
    Array.from(ol.querySelectorAll('li.active, wct-load-template-tag.active')).forEach(li => li.classList.remove('active'))
    let li
    if (active && (li = ol.querySelector(`li[uid='${uid}'], wct-load-template-tag[uid='${uid}']`))) li.classList.add('active')
    if (active && scroll) this.scrollActiveIntoView()
  }

  scrollActiveIntoView (smooth = false, counter = 0) {
    counter++
    const getLiActiveEl = () => this.usersOl.querySelector('li.active, wct-load-template-tag.active') || this.allUsersOl.querySelector('li.active, wct-load-template-tag.active')
    const scrollEl = getLiActiveEl()
    if (!scrollEl) return
    scrollEl.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant', block: 'nearest' })
    setTimeout(() => {
      const scrollEl = getLiActiveEl()
      if (!scrollEl) return
      const boundingClientRect = scrollEl.getBoundingClientRect()
      if (boundingClientRect.y < 0 && boundingClientRect.y + boundingClientRect.height > this.dialogEl?.clientHeight && counter < 15) {
        this.scrollActiveIntoView(counter > 2 ? false : smooth, counter)
      } else {
        scrollEl.scrollIntoView({ behavior: 'instant', block: 'nearest' })
        // trying to have scroll down work more reliable
        setTimeout(() => scrollEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50)
      }
    }, 200)
  }

  static updateIconStatesEl (iconStatesEl, data, online) {
    if (online) {
      if (data.usersConnectedWithSelf.size > 1) {
        iconStatesEl.setAttribute('state', 'connected')
        iconStatesEl.setAttribute('counter', data.usersConnectedWithSelf.size - 1)
      } else {
        iconStatesEl.setAttribute('state', 'disconnected')
        iconStatesEl.removeAttribute('counter')
      }
    } else {
      iconStatesEl.setAttribute('state', 'offline')
      iconStatesEl.removeAttribute('counter')
    }
  }

  // showAllConnectedUsers = false means to use mutuallyConnectedUsers
  static renderP2pGraph (graph, data, separator, activeUid, showAllConnectedUsers = false) {
    // TODO: Proper update diffing logic, only render the graph when having changes, to avoid jumping on multiple updates
    graph.innerHTML = /* html */`
      <chat-a-p2p-graph separator="${separator || ''}"${activeUid ? ` active='${activeUid}'` : ''}${showAllConnectedUsers ? ' connected-users' : ''}>
        <template>${JSON.stringify(Array.isArray(data) ? data : Array.from(data))}</template>
      </chat-a-p2p-graph>
    `
  }

  static async renderUserTableList (ol, users, allUsers, newestMessage, areConnectedUsers, activeUid) {
    let isUpToDate
    // TODO: Proper update diffing logic, only render the users which have changes, to avoid blitz on multiple updates
    ol.innerHTML = await Array.from(users).reduce(async (acc, [key, user]) => /* html */`
      ${await acc}
      <wct-load-template-tag uid='${user.uid}'${activeUid === user.uid ? ' class=active' : ''} no-css copy-class-list>
        <template>
          <li uid='${user.uid}'${user.isSelf ? ' self' : ''} class="${(isUpToDate = areConnectedUsers || user.uid === newestMessage?.uid || JSON.parse(user.awarenessEpoch || user.epoch).epoch >= newestMessage?.timestamp) ? 'updated' : 'outdated' /* eslint-disable-line */}" style="--box-shadow-color: ${(await getHexColor(user.uid))};border-color: ${(await getHexColor(user.uid))};">
            <div>
              <h2>
                <span>${user.nickname || 'none'}</span>
                <span class=user-icon>
                  <wct-icon-mdx title="${user.isSelf ? 'Yourself' : 'Other user'}" icon-url="../../../../../../img/icons/${user.isSelf ? 'user-self' : 'user-other'}.svg" size="0.75em"></wct-icon-mdx>
                  <span class=tiny>${user.isSelf ? 'Yourself' : 'Other user'}</span>
                </span>
              </h2>
              <table>
                <tbody>
                  ${user.isSelf
                    ? ''
                    : /* html */`
                      <tr class="time-status">
                        <td>${isUpToDate
                          ? 'is up to date:'
                          : 'is outdated:'
                        }</td>
                        <td class="time-status-icons">${isUpToDate
                          ? '<wct-icon-mdx title="is up to date" no-hover icon-url="../../../../../../img/icons/message-check.svg" size="1.5em"></wct-icon-mdx>'
                          : '<wct-icon-mdx title="is outdated" no-hover icon-url="../../../../../../img/icons/message-x.svg" size="1.5em"></wct-icon-mdx>'
                        }</td>
                      </tr>
                    `
                  }
                  ${Object.keys(user).reduce((acc, key) => {
                    const ignoredKeys = ['connectedUsersCount', 'mutuallyConnectedUsersCount', 'sessionEpoch', 'isSelf']
                    if (user.awarenessEpoch) ignoredKeys.push('epoch') // backward compatible to old chats/user, which did not have awarenessEpoch, then just use epoch
                    if (ignoredKeys.includes(key)) return acc
                    return /* html */`
                      ${['localEpoch', 'awarenessEpoch', 'nickname'].includes(key) ? '' : acc}
                      <tr ${key === 'nickname' ? 'class=nickname' : ''}>
                        <td>${key === 'nickname'
                          ? user.isSelf
                            ? 'Your nickname:'
                            : 'User nickname:'
                          : key === 'localEpoch'
                          ? 'first time visited:'
                          : key === 'awarenessEpoch' || key === 'epoch'
                          ? 'last time visited:'
                          : key === 'mutuallyConnectedUsers'
                          ? 'actively connected users:'
                          : key === 'connectedUsers'
                          ? 'once connected users:'
                          : key === 'uid'
                          ? 'unique id:'
                          : `${key}:`
                        }</td>
                        <td>${key === 'mutuallyConnectedUsers' || key === 'connectedUsers'
                          ? Object.keys(user[key]).reduce((acc, providerName) => {
                            const addedConnectedUsersUid = []
                            return /* html */`
                              ${acc}
                              ${Array.isArray(user[key][providerName])
                                ? user[key][providerName].reduce((acc, mutuallyConnectedUser) => {
                                  const fullUser = allUsers.get(mutuallyConnectedUser?.uid)
                                  if (!fullUser) return acc
                                  if (addedConnectedUsersUid.includes(fullUser.uid)) return acc
                                  addedConnectedUsersUid.push(fullUser.uid)
                                  return `${acc}${fullUser ? /* html */`
                                    <details onclick="event.stopPropagation()">
                                      <summary><chat-a-nick-name uid='${fullUser.uid}' nickname="${fullUser.nickname}"${fullUser.isSelf ? ' self' : ''}></chat-a-nick-name></summary>
                                      ${providerName}
                                    </details>
                                  ` : ''}`
                                  }, '').trim()
                                : 'none'
                              }
                            `
                          }, '').trim() || 'none'
                          : key === 'nickname'
                          ? `<chat-a-nick-name uid='${user.uid}' nickname="${user.nickname}"${user.isSelf ? ' self' : ''}></chat-a-nick-name>`
                          : typeof user[key] === 'string' && user[key].includes('epoch') && key !== 'uid'
                          ? new Date(JSON.parse(user[key]).epoch).toLocaleString(navigator.language)
                          : typeof user[key] === 'object'
                            ? JSON.stringify(user[key])
                            : user[key]
                        }</td>
                      </tr>
                      ${['localEpoch', 'awarenessEpoch', 'nickname'].includes(key) ? acc : ''}
                    `
                  }, '')}
                </tbody>
              </table>
            </div>
          </li>
        </template>
      </wct-load-template-tag>
    `, '')
  }

  get iconStatesEl () {
    return this.root.querySelector('a-icon-states')
  }

  get dialog () {
    return this.root.querySelector('wct-dialog')
  }

  get dialogEl () {
    return this.dialog?.root.querySelector('dialog')
  }

  isDialogOpen () {
    return this.dialog?.root?.querySelector('dialog[open]')
  }

  get usersGraph () {
    return this.dialog?.root.querySelector('#users-graph')
  }

  get usersGraphHistory () {
    return this.dialog?.root.querySelector('#users-graph-history')
  }

  get usersOl () {
    return this.dialog?.root.querySelector('#users')
  }

  get allUsersOl () {
    return this.dialog?.root.querySelector('#all-users')
  }

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }
}
