// @ts-check
import { Intersection } from '../../../../event-driven-web-components-prototypes/src/Intersection.js'
import { escapeHTML } from '../../../../event-driven-web-components-prototypes/src/helpers/Helpers.js'
import { jsonParseMapUrlReviver } from '../../../../Helpers.js'

/* global Environment */

/**
* @export
* @class User
* @type {CustomElementConstructor}
*/
export default class User extends Intersection() {
  constructor (user, allUsers, order, options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, tabindex: 'no-tabindex', intersectionObserverInit: {}, ...options }, ...args)

    if (this.templateUser && this.templateAllUsers) {
      ({ user: this.user, order: this.order } = JSON.parse(this.templateUser.content.textContent, jsonParseMapUrlReviver));
      ({ allUsers: this.allUsers } = JSON.parse(this.templateAllUsers.content.textContent, jsonParseMapUrlReviver))
    } else {
      /** @type {import('../../../../event-driven-web-components-yjs/src/es/controllers/Users.js').User} */
      this.user = user
      /** @type {import('../../../../event-driven-web-components-yjs/src/es/controllers/Users.js').UsersContainer} */
      this.allUsers = allUsers
      this.order = order
    }

    this.closeDetailsEventListener = event => this.updateHeight(true)

    this.detailsAnimationendEventListener = event => this.updateHeight()

    // this updates the min-height on resize, see updateHeight function for more info
    let resizeTimeout = null
    this.resizeEventListener = event => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(async () => this.updateHeight(), 200)
    }
  }

  connectedCallback () {
    super.connectedCallback()
    this.hidden = true
    const showPromises = []
    if (this.shouldRenderCSS()) showPromises.push(this.renderCSS())
    if (this.shouldRenderHTML()) showPromises.push(this.renderHTML())
    Promise.all(showPromises).then(() => {
      this.hidden = false
      this.updateHeight()
    })
    this.addEventListener('close', this.closeDetailsEventListener)
    this.addEventListener('wct-details-animationend', this.detailsAnimationendEventListener)
    self.addEventListener('resize', this.resizeEventListener)
  }
  
  disconnectedCallback () {
    super.disconnectedCallback()
    this.removeEventListener('close', this.closeDetailsEventListener)
    this.removeEventListener('wct-details-animationend', this.detailsAnimationendEventListener)
    self.removeEventListener('resize', this.resizeEventListener)
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
      :host(.active) {
        --summary-child-color-hover: var(--background-color);
      }
      :host([has-height]:not([intersecting])) > li {
        display: none;
      }
      :host > li {
        --box-shadow-color: ${this.getAttribute('hex-color') || 'var(--color-user)'};
        --box-shadow-default: var(--box-shadow-length-one) var(--box-shadow-color), var(--box-shadow-length-two) var(--box-shadow-color);
        border-color: ${this.getAttribute('hex-color')};
        background-color: var(--card-background-color, transparent);
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
      }
      :host(:where([self], .active)) > li > * {
        --color: var(--card-color, var(--background-color));
        --a-color: var(--card-a-color, var(--card-color, var(--background-color)));
        --h2-color: var(--card-h-color, var(--card-color, var(--background-color)));
        --h3-color: var(--card-h-color, var(--card-color, var(--background-color)));
        --h4-color: var(--card-h-color, var(--card-color, var(--background-color)));
        --box-shadow-default: var(--box-shadow-length-one) var(--box-shadow-color), var(--box-shadow-length-two) var(--box-shadow-color);
        color: var(--card-color, var(--background-color));
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
      :host > li > div > table > tbody > tr > td {
        overflow-wrap: anywhere;
        border-bottom: 1px solid var(--color);
        min-width: 0;
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
      :host > li > div > table > tbody > tr.nickname {
        font-weight: bold;
      }
      :host(.self) > li > div > table > tbody > tr.nickname {
        color: var(--color-secondary);
        font-weight: bold;
      }
      :host([self]) > li > div > table > tbody > tr > td {
        border-bottom: 1px solid var(--background-color);
      }
      :host > li > div > h2 {
        --color-hover: var(--color);
        --cursor-hover: auto;
        display: flex;
        gap: 0.25em;
        justify-content: space-between;
        align-items: start;
        border-bottom: 1px solid var(--color);
        overflow-wrap: anywhere;
      }
      :host > li > div > h2 > span#nickname {
        flex-shrink: 1;
      }
      :host > li > div > h2 > span.user-icon {
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
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
      :host(.active) > li > * {
        --a-color: var(--background-color);
      }
      :host(.active) > li > div > h2 > span.user-icon > .tiny{
        color: var(--background-color);
      }
      :host(.active) > li > div > h2 {
        --cursor-hover: pointer;
        border-bottom: 1px solid var(--background-color);
      }
      @media only screen and (max-width: _max-width_) {
        :host([self]) > li > div > table > tbody > tr > td, :host > li > div > table > tbody > tr > td, :host > li > div > table > tbody > tr.time-status > td {
          grid-column: 1 span2;
          border-bottom: 1px solid transparent;
          margin-left: 1em;
        }
        :host > li > div > table > tbody > tr.time-status > td {
          grid-column: 1 span1;
        }
        :host > li > div > table > tbody > tr.time-status > td:last-child {
          grid-column: 2 span1;
        }
        :host > li > div > table > tbody > tr > td:first-child {
          border-bottom: 1px solid var(--color);
        }
        :host([self]) > li > div > table > tbody > tr > td:first-child {
          border-bottom: 1px solid var(--background-color);
        }
        :host > li > div > table > tbody > tr > td:not(.time-status-icons):last-child {
          margin-left: 2em;
        }
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
    ], false)
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
            ${User.renderNickname(this.user.nickname, this.user.uid)}
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
                            ? 'connected users:'
                            : key === 'connectedUsers'
                              ? 'last connected users / providers:'
                              : key === 'uid'
                                ? 'unique id:'
                                : `${key}:`
                    }</td>
                    ${User.renderTableValue(key, this.user, this.allUsers, this.getAttribute('uid'))}
                  </tr>
                  ${['localEpoch', 'awarenessEpoch', 'nickname'].includes(key) ? acc : ''}
                `
              }, '')}
            </tbody>
          </table>
        </div>
      </li>
    `
    this.html = this.customStyleOrder
    this.html = this.customStyleHeight
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
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../atoms/glideToReveal/GlideToReveal.js?${Environment?.version || ''}`,
        name: 'chat-a-glide-to-reveal'
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
      if (this.nicknameNode) this.nicknameNode.outerHTML = User.renderNickname(user.nickname, this.user.uid)
      if (this.awarenessEpochNode) this.awarenessEpochNode.outerHTML = User.renderTableValue('awarenessEpoch', user, allUsers, this.getAttribute('uid'))
      if (this.connectedUsersNode) {
        if (typeof this.connectedUsersNode.children?.[0].update === 'function') {
          User.enrichUserWithFullUserNickname(user.connectedUsers, allUsers)
          this.connectedUsersNode.children[0].update(user.connectedUsers)
        } else {
          this.connectedUsersNode.outerHTML = User.renderTableValue('connectedUsers', user, allUsers, this.getAttribute('uid'))
        }
      }
      if (this.mutuallyConnectedUsersNode) {
        if (typeof this.mutuallyConnectedUsersNode.children?.[0].update === 'function') {
          User.enrichUserWithFullUserNickname(user.mutuallyConnectedUsers, allUsers)
          this.mutuallyConnectedUsersNode.children[0].update(user.mutuallyConnectedUsers)
        } else {
          this.mutuallyConnectedUsersNode.outerHTML = User.renderTableValue('mutuallyConnectedUsers', user, allUsers, this.getAttribute('uid'))
        }
      }
      this.updateHeight()
      this.doOnIntersection = null
    }
    if (this.hasAttribute('intersecting')) this.doOnIntersection()
  }

  updateOrder (order) {
    this.customStyleOrder.textContent = /* css */`
      :host {
        order: ${order};
      }
    `
  }

  // Due to performance issues, dialog open took around 1300ms (after this change ca. 350ms) on a chat with many users. This eliminated the recalculate style thanks to :host([has-height]:not([intersecting])) > li: display: none; for not intersecting user components but also keeps the height, to avoid weird scrolling effects.
  updateHeight (clear = false) {
    // wct-details has an animation, which is triggered when intersecting, this animation is typically 300ms when not specified by attribute open-duration
    // set --animation: none; if this has still side effects
    clearTimeout(this._timeoutUpdateHeight)
    this._timeoutUpdateHeight = setTimeout(() => {
      this.removeAttribute('has-height')
      this.customStyleHeight.textContent = ''
      if (!clear) self.requestAnimationFrame(timeStamp => {
        this.customStyleHeight.textContent = /* css */`
          :host {
            min-height: ${this.offsetHeight}px;
          }
        `
        this.setAttribute('has-height', '')
      })
    }, clear ? 0 : 350)
  }

  static renderNickname (nickname, fallbackName = 'none') {
    return /* html */`<span id=nickname>${escapeHTML(nickname) || fallbackName}</span>`
  }

  static renderTableValue (key, user, allUsers, selfUid) {
    if (key === 'mutuallyConnectedUsers' || key === 'connectedUsers') User.enrichUserWithFullUserNickname(user[key], allUsers)
    return /* html */`
      <td id="${key}">${key === 'mutuallyConnectedUsers' || key === 'connectedUsers'
        ? /* html */`
          <chat-m-connected-users uid='${selfUid}' ${key === 'connectedUsers' ? 'show-lone-providers' : ''}>
            <template>${JSON.stringify({ connectedUsers: user[key] })}</template>
          </chat-m-connected-users>
        `
        : key === 'publicKey'
          ? /* html */`
            <chat-a-glide-to-reveal>
              <style protected>
                :host {
                  --border-radius: 0;
                  --ul-max-height: 2.5em;
                }
              </style>
              <template>${JSON.stringify(user.publicKey)}</template>
            </chat-a-glide-to-reveal>
          `
          : key === 'nickname'
            ? /* html */`<chat-a-nick-name uid='${user.uid}' nickname="${escapeHTML(user.nickname)}"${user.isSelf ? ' self' : ''}></chat-a-nick-name>`
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

  get templateUser () {
    return this.root.querySelector('template[user]')
  }

  get templateAllUsers () {
    return this.root.querySelector('template[all-users]')
  }

  get customStyleOrder () {
    return (
      this._customStyleOrder ||
        (this._customStyleOrder = (() => {
          const style = document.createElement('style')
          style.setAttribute('protected', 'true')
          return style
        })())
    )
  }

  get customStyleHeight () {
    return (
      this._customStyleHeight ||
        (this._customStyleHeight = (() => {
          const style = document.createElement('style')
          style.setAttribute('protected', 'true')
          return style
        })())
    )
  }
}
