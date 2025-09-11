// @ts-check
import { Intersection } from '../../../../web-components-toolbox/src/es/components/prototypes/Intersection.js'
import { jsonParseMapUrlReviver } from '../../../../Helpers.js'

/* global Environment */

/**
* @export
* @class User
* @type {CustomElementConstructor}
*/
export default class User extends Intersection() {
  constructor (user, allUsers, order, options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, intersectionObserverInit: {}, ...options }, ...args)

    if (this.template) {
      ({ user: this.user, allUsers: this.allUsers, order: this.order } = JSON.parse(this.template.content.textContent, jsonParseMapUrlReviver))
    } else {
      /** @type {import('../../../../event-driven-web-components-yjs/src/es/controllers/Users.js').User} */
      this.user = user
      /** @type {import('../../../../event-driven-web-components-yjs/src/es/controllers/Users.js').UsersContainer} */
      this.allUsers = allUsers
      this.order = order
    }
  }

  connectedCallback () {
    super.connectedCallback()
    this.hidden = true
    const showPromises = []
    if (this.shouldRenderCSS()) showPromises.push(this.renderCSS())
    if (this.shouldRenderHTML()) showPromises.push(this.renderHTML())
    Promise.all(showPromises).then(() => (this.hidden = false))
  }

  intersectionCallback (entries, observer) {
    if (this.areEntriesIntersecting(entries)) {
      this.setAttribute('intersecting', '')
      if (this.doOnIntersection) this.doOnIntersection()
      return
    }
    this.removeAttribute('intersecting')
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
    return !this.li
  }

  /**
   * renders the css
   * @returns Promise<void>
   */
  renderCSS () {
    this.css = /* css */`
      :host {
        display: list-item;
      }
      :host > li {
        --box-shadow-color: ${this.getAttribute('hex-color') || 'var(--color-user)'};
        --box-shadow-default: var(--box-shadow-length-one) var(--box-shadow-color), var(--box-shadow-length-two) var(--box-shadow-color);
        border-color: ${this.getAttribute('hex-color')};
        border-radius: var(--border-radius);
        border: 1px solid var(--color-user);
        box-shadow: var(--box-shadow-default);
        height: 100%;
        margin-bottom: var(--spacing);
        overflow: auto;
        padding-left: 0.25em !important;
        padding: 0.25em;
        scrollbar-color: var(--color) var(--background-color);
        scrollbar-width: thin;
        transition: padding 0.05s ease-out;
        word-break: break-all;
      }
      :host(.self) > li {
        --box-shadow-color: var(--color-secondary);
        --box-shadow-default: var(--box-shadow-length-one) var(--box-shadow-color), var(--box-shadow-length-two) var(--box-shadow-color);
        border: 1px solid var(--color-secondary);
      }
      :host(.active) > li {
        cursor: pointer;
      }
      :host > li > * {
        padding: var(--card-padding, 0.75em);
        margin: 0;
        transition: padding 0.05s ease-out;
      }
      :host(:where([self], .active)) > li > * {
        --color: var(--background-color);
        --a-color: var(--background-color);
        --h2-color: var(--background-color);
        --h3-color: var(--background-color);
        --h4-color: var(--background-color);
        --box-shadow-default: var(--box-shadow-length-one) var(--box-shadow-color), var(--box-shadow-length-two) var(--box-shadow-color);
        color: var(--background-color);
        border-radius: var(--border-radius);
      }
      :host([self]) > li > * {
        border: 1px solid var(--color-secondary);
        background-color: var(--background-color-rgba-50);
        box-shadow: 0px 0px 0.5em var(--color-secondary);
      }
      :host(.active) > li > * {
        background-color: var(--color-active);
      }
      :host > li > div {
        height: 100%;
      }
      :host > li > div > table {
        margin: 0;
      }
      :host > li > div > table > tbody {
        display: grid;
        grid-template-columns: 1fr 1fr;
        margin: 0;
      }
      :host > li > div > table > tbody > tr {
        display: contents;
      }
      :host > li > div > table > tbody > tr.time-status {
        padding-bottom: var(--h-margin-bottom, 1em);
      }
      :host > li > div > table > tbody > tr.time-status > td {
        font-style: italic;
        margin-bottom: var(--h-margin-bottom, 1em);
      }
      :host(:not(.active, [self])[is-up-to-date]) > li > div > h2 {
        border-bottom: 1px solid var(--color-green-full);
      }
      :host .is-up-to-date, :host([is-up-to-date]) .is-outdated {
        display: none;
      }
      :host([is-up-to-date]) .is-up-to-date {
        display: block;
      }
      :host(:not(.active, [self])[is-up-to-date]) > li > div > table > tbody > tr.time-status > td.time-status-icons {
        --color: var(--color-green-full);
      }
      :host([is-up-to-date]) > li > div > table > tbody > tr.time-status > td {
        border-bottom: 1px dotted var(--color-green-full);
      }
      :host(:not(.active, [self], [is-up-to-date])) > li > div > h2 {
        border-bottom: 1px solid var(--color-error);
      }
      :host(:not(.active, [self], [is-up-to-date])) > li > div > table > tbody > tr.time-status > td.time-status-icons {
        --color: var(--color-error);
      }
      :host(:not([is-up-to-date])) > li > div > table > tbody > tr.time-status > td {
        border-bottom: 1px dotted var(--color-error);
      }
      :host > li > div > table > tbody > tr > td {
        overflow-wrap: anywhere;
      }
      :host > li > div > table > tbody > tr.nickname {
        font-weight: bold;
      }
      :host(.self) > li > div > table > tbody > tr.nickname {
        color: var(--color-secondary);
        font-weight: bold;
      }
      :host > li > div > h2 {
        --color-hover: var(--color);
        --cursor-hover: auto;
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--color);
        overflow-wrap: anywhere;
      }
      :host > li > div > h2 > span.user-icon {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      :host > li > div > h2 > span.user-icon > .tiny{
        font-family: var(--font-family);
        color: var(--color);
        font-size: 0.25em;
        line-height: 0.5em;
        margin-bottom: 1.75em;
      }
      :host(.active) > li > div > h2 {
        --color: var(--background-color);
        --color-hover: var(--color);
      }
      :host(.active) > li > div > h2 > span.user-icon > .tiny{
        color: var(--background-color);
      }
      :host(.active) > li > div > h2 {
        --cursor-hover: pointer;
        border-bottom: 1px solid var(--background-color);
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
    this.html = /* html */`
      <li>
        <div>
          <h2>
            ${User.renderNickname(this.user.nickname)}
            <span class=user-icon>
              <wct-icon-mdx title="${this.user.isSelf ? 'Yourself' : 'Other user'}" icon-url="../../../../../../img/icons/${this.user.isSelf ? 'user-self' : 'user-other'}.svg" size="0.75em"></wct-icon-mdx>
              <span class=tiny>${this.user.isSelf ? 'Yourself' : 'Other user'}</span>
            </span>
          </h2>
          <table>
            <tbody>
              ${this.user.isSelf
                ? ''
                : /* html */`
                  <tr class="time-status">
                    <td class=is-up-to-date>is up to date:</td>
                    <td class=is-outdated>is outdated:</td>
                    <td class="time-status-icons">
                      <wct-icon-mdx class=is-up-to-date title="is up to date" no-hover icon-url="../../../../../../img/icons/message-check.svg" size="1.5em"></wct-icon-mdx>
                      <wct-icon-mdx class=is-outdated title="is outdated" no-hover icon-url="../../../../../../img/icons/message-x.svg" size="1.5em"></wct-icon-mdx>
                    </td>
                  </tr>
                `
              }
              ${Object.keys(this.user).reduce((acc, key) => {
                const ignoredKeys = ['connectedUsersCount', 'mutuallyConnectedUsersCount', 'sessionEpoch', 'isSelf']
                if (this.user.awarenessEpoch) ignoredKeys.push('epoch') // backward compatible to old chats/user, which did not have awarenessEpoch, then just use epoch
                if (ignoredKeys.includes(key)) return acc
                return /* html */`
                  ${['localEpoch', 'awarenessEpoch', 'nickname'].includes(key) ? '' : acc}
                  <tr ${key === 'nickname' ? 'class=nickname' : ''}>
                    <td>${key === 'nickname'
                      ? this.user.isSelf
                        ? 'Your nickname:'
                        : 'User nickname:'
                      : key === 'localEpoch'
                      ? 'first time visited:'
                      : key === 'awarenessEpoch' || key === 'epoch'
                      ? 'last time visited:'
                      : key === 'mutuallyConnectedUsers'
                      ? 'actively connected users:'
                      : key === 'connectedUsers'
                      ? 'historically connected users:'
                      : key === 'uid'
                      ? 'unique id:'
                      : `${key}:`
                    }</td>
                    ${User.renderConnectedUser(key, this.user, this.allUsers)}
                  </tr>
                  ${['localEpoch', 'awarenessEpoch', 'nickname'].includes(key) ? acc : ''}
                `
              }, '')}
            </tbody>
          </table>
        </div>
      </li>
    `
    this.html = this.customStyle
    this.updateOrder(this.order)
    return this.fetchModules([
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/atoms/iconMdx/IconMdx.js?${Environment?.version || ''}`,
        name: 'wct-icon-mdx'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../atoms/nickName/NickName.js?${Environment?.version || ''}`,
        name: 'chat-a-nick-name'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}./ConnectedUsers.js?${Environment?.version || ''}`,
        name: 'chat-m-connected-users'
      }
    ])
  }

  /**
   * Update components
   * @param {import('../../../../event-driven-web-components-yjs/src/es/controllers/Users.js').User} user
   * @param {import('../../../../event-driven-web-components-yjs/src/es/controllers/Users.js').UsersContainer} allUsers
   * @param {boolean} isUpToDate
   * @param {number} order
   * @returns {void}
   */
  update (user, allUsers, isUpToDate, order) {
    this.user = user
    this.allUsers = allUsers
    this.order = order
    if (isUpToDate) {
      this.setAttribute('is-up-to-date', '')
    } else {
      this.removeAttribute('is-up-to-date')
    }
    this.updateOrder(order)
    this.doOnIntersection = () => {
      if (this.nicknameNode) this.nicknameNode.outerHTML = User.renderNickname(user.nickname)
      if (this.awarenessEpochNode) this.awarenessEpochNode.outerHTML = User.renderConnectedUser('awarenessEpoch', user, allUsers)
      if (this.connectedUsersNode) {
        if (typeof this.connectedUsersNode.children?.[0].update === 'function') {
          User.enrichUserWithFullUserNickname(user.connectedUsers, allUsers)
          this.connectedUsersNode.children[0].update(user.connectedUsers)
        } else {
          this.connectedUsersNode.outerHTML = User.renderConnectedUser('connectedUsers', user, allUsers)
        }
      }
      if (this.mutuallyConnectedUsersNode) {
        if (typeof this.mutuallyConnectedUsersNode.children?.[0].update === 'function') {
          User.enrichUserWithFullUserNickname(user.mutuallyConnectedUsers, allUsers)
          this.mutuallyConnectedUsersNode.children[0].update(user.mutuallyConnectedUsers)
        } else {
          this.mutuallyConnectedUsersNode.outerHTML = User.renderConnectedUser('mutuallyConnectedUsers', user, allUsers)
        }
      }
      this.doOnIntersection = null
    }
    if (this.hasAttribute('intersecting')) this.doOnIntersection()
  }

  updateOrder (order) {
    this.customStyle.innerText = /* css */`
      :host {
        order: ${order};
      }
    `
  }

  static renderNickname (nickname) {
    return /* html */`<span id=nickname>${nickname || 'none'}</span>`
  }

  static renderConnectedUser (key, user, allUsers) {
    if (key === 'mutuallyConnectedUsers' || key === 'connectedUsers') User.enrichUserWithFullUserNickname(user[key], allUsers)
    return /* html */`
      <td id="${key}">${key === 'mutuallyConnectedUsers' || key === 'connectedUsers'
        ? /* html */`
          <chat-m-connected-users>
            <template>${JSON.stringify({ connectedUsers: user[key] })}</template>
          </chat-m-connected-users>
        `
        : key === 'nickname'
        ? /* html */`<chat-a-nick-name uid='${user.uid}' nickname="${user.nickname}"${user.isSelf ? ' self' : ''}></chat-a-nick-name>`
        : typeof user[key] === 'string' && user[key].includes('epoch') && key !== 'uid'
        ? new Date(JSON.parse(user[key]).epoch).toLocaleString(navigator.language)
        : typeof user[key] === 'object'
          ? JSON.stringify(user[key])
          : user[key]
      }</td>
    `
  }

  /**
   * Enrich initial user value with the full user
   * 
   * @param {import('../../../../event-driven-web-components-yjs/src/es/controllers/Users.js').ConnectedUsers} connectedUsers
   * @param {import('../../../../event-driven-web-components-yjs/src/es/controllers/Users.js').UsersContainer} allUsers
   * @returns {void}
   */
  static enrichUserWithFullUserNickname (connectedUsers, allUsers) {
    Object.keys(connectedUsers).forEach(providerName => {
      if (Array.isArray(connectedUsers[providerName])) connectedUsers[providerName].forEach((connectedUser, i) => {
        let fullUser
        if ((fullUser = allUsers.get(connectedUser?.uid))) connectedUser.nickname = fullUser.nickname
      })
    })
  }

  get li () {
    return this.root.querySelector('li')
  }

  get nicknameNode () {
    return this.root.querySelector('#nickname')
  }

  get awarenessEpochNode () {
    return this.root.querySelector('#awarenessEpoch')
  }

  get connectedUsersNode () {
    return this.root.querySelector('#connectedUsers')
  }

  get mutuallyConnectedUsersNode () {
    return this.root.querySelector('#mutuallyConnectedUsers')
  }

  get template () {
    return this.root.querySelector('template')
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
}
