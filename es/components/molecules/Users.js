// @ts-check
import { Shadow } from '../../../../event-driven-web-components-prototypes/src/Shadow.js'
import { getHexColor, jsonStringifyMapUrlReplacer } from '../../../../Helpers.js'
import { scrollElIntoView } from '../../../../event-driven-web-components-prototypes/src/helpers/Helpers.js'

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
    const skipTimeoutClear = 5
    let timeoutCounter = 1
    this.usersEventListener = async event => {
      lastUsersEventGetData = event.detail.getData
      lastSeparator = event.detail.separator
      this.iconStatesEl.setAttribute('updating', '')
      if (timeoutCounter % skipTimeoutClear) clearTimeout(timeoutId)
      timeoutCounter++
      timeoutId = setTimeout(async () => {
        timeoutCounter = 1
        if (this.isDialogOpen()) {
          this.renderData(await event.detail.getData(), lastSeparator)
        } else {
          Users.updateIconStatesEl(this.iconStatesEl, await event.detail.getData(), this.hasAttribute('online'))
        }
        this.iconStatesEl.removeAttribute('updating')
        // @ts-ignore
      }, self.Environment.awarenessEventListenerDelay || 1000)
    }

    this.openDialog = async event => {
      event.preventDefault()
      this.dialog.show('show-modal')
      if (lastUsersEventGetData) {
        clearTimeout(timeoutId)
        await this.renderData(await lastUsersEventGetData(), lastSeparator)
        this.iconStatesEl.removeAttribute('updating')
        // the graph has to be refreshed when dialog opens
        // @ts-ignore
        const getArgs = this.isUserGraphTabActive
          ? async () => [this.usersGraph, (await lastUsersEventGetData()).usersConnectedWithSelf, lastSeparator, this.getAttribute('active'), undefined, true]
          : async () => [this.usersGraphHistory, (await lastUsersEventGetData()).allUsers, lastSeparator, this.getAttribute('active'), true, true]
        Users.renderP2pGraph(...(await getArgs()))
      }
    }
    
    this.userDialogShowEventEventListener = event => {
      this.dialog.close()
      this.openDialog(event).then(() => {
        if (event.detail?.uid) this.setActive('uid', event.detail.uid, [this.usersOl, this.allUsersOl])
      })
    }

    // listens to the dialog node but reacts on active list elements to be deactivated
    this.dialogClickEventListener = async event => {
      // card click
      let activeNode
      if (event.composedPath().some(node => (activeNode = node).tagName === 'CHAT-M-USER' && node.classList.contains('active') && typeof node.hasAttribute === 'function' && !node.hasAttribute('data-tab'))) {
        // @ts-ignore
        this.setActive('uid', activeNode.getAttribute('uid'), [this.usersOl, this.allUsersOl], false)
        if (lastUsersEventGetData) {
          // @ts-ignore
          const getArgs = activeNode.matches('#usersGraph') || this.isUserGraphTabActive
            ? async () => [this.usersGraph, (await lastUsersEventGetData()).usersConnectedWithSelf, lastSeparator]
            : async () => [this.usersGraphHistory, (await lastUsersEventGetData()).allUsers, lastSeparator, undefined, true]
          Users.renderP2pGraph(...(await getArgs()))
        }
        this.usersGraph.scrollIntoView({ behavior: 'smooth' })
        this.usersGraphHistory.scrollIntoView({ behavior: 'smooth' })
      // tab click
      } else if (event.composedPath().some(node => typeof (activeNode = node).hasAttribute === 'function' && node.hasAttribute('data-tab')) && lastUsersEventGetData) {
        // @ts-ignore
        const getArgs = activeNode.matches('#usersGraph') || this.isUserGraphTabActive
          ? async () => [this.usersGraph, (await lastUsersEventGetData()).usersConnectedWithSelf, lastSeparator, this.getAttribute('active'), undefined, true]
          : async () => [this.usersGraphHistory, (await lastUsersEventGetData()).allUsers, lastSeparator, this.getAttribute('active'), true, true]
        Users.renderP2pGraph(...(await getArgs()))
      }
    }

    this.p2pGraphClickEventListener = event => {
      if (event.detail.graphUserObj) this.setActive('uid', event.detail.graphUserObj.id, [this.usersOl, this.allUsersOl], event.detail.isActive)
    }

    this.nickNameClickEventListener = async event => {
      this.setActive('uid', event.detail.uid, [this.usersOl, this.allUsersOl])
      if (lastUsersEventGetData) {
        // @ts-ignore
        const getArgs = this.isUserGraphTabActive
          ? async () => [this.usersGraph, (await lastUsersEventGetData()).usersConnectedWithSelf, lastSeparator, this.getAttribute('active')]
          : async () => [this.usersGraphHistory, (await lastUsersEventGetData()).allUsers, lastSeparator, this.getAttribute('active'), true]
        Users.renderP2pGraph(...(await getArgs()))
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
          // @ts-ignore
          const getArgs = this.isUserGraphTabActive
            ? async () => [this.usersGraph, (await lastUsersEventGetData()).usersConnectedWithSelf, lastSeparator, this.getAttribute('active'), undefined, true]
            : async () => [this.usersGraphHistory, (await lastUsersEventGetData()).allUsers, lastSeparator, this.getAttribute('active'), true, true]
          Users.renderP2pGraph(...(await getArgs()))
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
          :host ol > chat-m-user, :host ol > wct-load-template-tag {
            width: calc(50% - 0.5em);
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
            :host ol > chat-m-user, :host ol > wct-load-template-tag {
              width: 100%;
            }
          }
          @media only screen and (min-width: 1500px) {
            :host ol > chat-m-user, :host ol > wct-load-template-tag {
              width: calc(33.3% - 0.66em);
            }
          }
          @media only screen and (min-width: 2500px) {
            :host ol > chat-m-user, :host ol > wct-load-template-tag {
              width: calc(25% - 0.75em);
            }
          }
        </style>
        <dialog>
          <wct-menu-icon id="close" no-aria class="open sticky" namespace="menu-icon-close-" no-click background style="--outline-style-focus-visible: none;"></wct-menu-icon>
          <h4>Connection Data:</h4>
          <p id="offline">You are offline!</p>
          <div>
            <wct-m-tabs id="tabs" mode=false no-history>
              <ul class="tab-navigation">
                  <li data-tab="Active connected users" id="users-graph-tab">Active connected users</li>
                  <li data-tab="Historically connected users" id="users-graph-history-tab">Historically connected users</li>
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
              <h4 class="title connected">Connected Users (<span class=counter></span>)</h4>
              <ol id="users"></ol>
            </div>
            <br>
            <hr>
            <br>
            <div>
              <h4 class="title not-connected">Not Connected Users (<span class=counter></span>)</h4>
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
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}./User.js?${Environment?.version || ''}`,
        name: 'chat-m-user'
      }
    ])
  }

  async renderData (data, separator) {
    Users.updateIconStatesEl(this.iconStatesEl, data, this.hasAttribute('online'))
    const anyUsersGraphIsIntersecting = this.usersGraph.querySelector('[intersecting]') || this.usersGraphHistory.querySelector('[intersecting]')
    // @ts-ignore
    const getArgs = this.isUserGraphTabActive
      ? () => [this.usersGraph, data.usersConnectedWithSelf, separator, this.getAttribute('active')]
      : () => [this.usersGraphHistory, data.allUsers, separator, this.getAttribute('active'), true]
    Users.renderP2pGraph(...getArgs())
    // get the timestamp of the newest message
    const newestMessage = (await new Promise(resolve => this.dispatchEvent(new CustomEvent('yjs-get-chat-event-detail', {
      detail: {
        resolve
      },
      bubbles: true,
      cancelable: true,
      composed: true
    }))).then(chatEventDetail => chatEventDetail.getAll()).then(textObjs => textObjs.sort((a, b) => a.timestamp - b.timestamp).slice(-1)[0]))
    await Users.renderUserTableList(this.usersOl, this.allUsersOl, data.usersConnectedWithSelf, data.allUsers, newestMessage, true, this.getAttribute('active'), anyUsersGraphIsIntersecting)
    this.usersTitleCounter.textContent = this.usersOl.children.length
    await Users.renderUserTableList(this.allUsersOl, this.usersOl, new Map(Array.from(data.allUsers).filter(([key, user]) => !data.usersConnectedWithSelf.get(key)).sort((a, b) => JSON.parse(b[1].awarenessEpoch || b[1].epoch).epoch - JSON.parse(a[1].awarenessEpoch || a[1].epoch).epoch)), data.allUsers, newestMessage, false, this.getAttribute('active'), anyUsersGraphIsIntersecting)
    this.allUsersTitleCounter.textContent = this.allUsersOl.children.length
  }

  setActive (attributeName, attributeValue, parentNodes, active = true, scroll = true) {
    parentNodes.reduce((acc, parentNode) => [...acc, ...(parentNode.querySelectorAll('.active') || [])], []).forEach(node => node.classList.remove('active'))
    let node
    if (active) {
      // @ts-ignore
      if (parentNodes.some(parentNode => (node = parentNode.querySelector(`[${attributeName}='${attributeValue}']`)))) node.classList.add('active')
      if (scroll) scrollElIntoView(() => {
        let node
        if(parentNodes.some(parentNode => (node = parentNode.querySelector('.active')))) return node
        return null
      }, ':not([intersecting])', this.dialogEl, { behavior: 'smooth', block: 'nearest' })
    }
    if (node) {
      this.setAttribute('active', attributeValue)
    } else {
      this.removeAttribute('active')
    }
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
  static renderP2pGraph (graph, data, separator, activeUid, showAllConnectedUsers = false, force = false) {
    const stringifiedData = JSON.stringify(Array.isArray(data) ? data : Array.from(data))
    const isSame = graph.children[0]?.template.content.textContent === stringifiedData
    if (force || !isSame) {
      graph.setAttribute('style', `min-height: ${graph.clientHeight}px;`)
      graph.innerHTML = /* html */`
        <chat-a-p2p-graph separator="${separator || ''}"${activeUid ? ` active='${activeUid}'` : ''}${showAllConnectedUsers ? ' connected-users' : ''}>
          <template>${stringifiedData}</template>
        </chat-a-p2p-graph>
      `
      graph.addEventListener('p2p-graph-load', event => self.requestAnimationFrame(timeStamp => graph.removeAttribute('style')), { once: true })
    }
  }

  static async renderUserTableList (targetList, otherList, users, allUsers, newestMessage, areConnectedUsers, activeUid, anyUsersGraphIsIntersecting) {
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = await Array.from(users).reduce(async (acc, [key, user], i) => {
      const isUpToDate = areConnectedUsers || user.uid === newestMessage?.uid || JSON.parse(user.awarenessEpoch || user.epoch).epoch >= newestMessage?.timestamp
      // render or update
      const renderUser = async () => /* html */`
        <wct-load-template-tag uid='${user.uid}'${activeUid === user.uid ? ' class=active' : ''} no-css style="order: ${i};" copy-class-list>
          <template>
            <chat-m-user uid='${user.uid}'${user.isSelf ? ' self' : ''}${activeUid === user.uid ? ' class=active' : ''}${isUpToDate ? ' is-up-to-date' : ''} hex-color="${(await getHexColor(user.uid))}">
              <template>${JSON.stringify({ user, allUsers, order: i }, jsonStringifyMapUrlReplacer)}</template>
            </chat-m-user>
          </template>
        </wct-load-template-tag>
      `
      let userNode
      if ((userNode = targetList.querySelector(`[uid='${user.uid}']`) || otherList.querySelector(`[uid='${user.uid}']`))) {
        if (!targetList.contains(userNode)) {
          const intersectingEl = otherList.querySelector(`[intersecting]:not([uid='${user.uid}'])`) || targetList.querySelector(`[intersecting]:not([uid='${user.uid}'])`)
          targetList.appendChild(userNode)
          if (!anyUsersGraphIsIntersecting) scrollElIntoView(() => intersectingEl, null, this.dialogEl, { behavior: 'instant', block: 'nearest' }, 0, undefined, 1)
        }
        if (typeof userNode.update === 'function') {
          userNode.update(user, allUsers, isUpToDate, i)
        } else {
          userNode.outerHTML = await renderUser()
        }
      } else {
        return await acc + await renderUser()
      }
      return await acc
    }, '')
    Array.from(tempDiv.children).forEach(child => targetList.appendChild(child))
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

  get isUserGraphTabActive () {
    return this.dialog?.root.querySelector('#users-graph-tab')?.classList.contains('active')
  }

  get usersGraph () {
    return this.dialog?.root.querySelector('#users-graph')
  }

  get usersGraphHistory () {
    return this.dialog?.root.querySelector('#users-graph-history')
  }

  get usersTitleCounter () {
    return this.dialog?.root.querySelector('.title.connected > .counter')
  }

  get usersOl () {
    return this.dialog?.root.querySelector('#users')
  }

  get allUsersTitleCounter () {
    return this.dialog?.root.querySelector('.title.not-connected > .counter')
  }

  get allUsersOl () {
    return this.dialog?.root.querySelector('#all-users')
  }

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }
}
