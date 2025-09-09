// @ts-check
import { Shadow } from '../../../../web-components-toolbox/src/es/components/prototypes/Shadow.js'
import { jsonParseMapUrlReviver } from '../../../../Helpers.js'

/* global Environment */

/**
* @export
* @class User
* @type {CustomElementConstructor}
*/
export default class User extends Shadow() {
  constructor (user, allUsers, options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, ...options }, ...args)

    if (this.template) {
      ({ user: this.user, allUsers: this.allUsers } = JSON.parse(this.template.content.textContent, jsonParseMapUrlReviver))
    } else {
      /** @type {import('../../../../event-driven-web-components-yjs/src/es/controllers/Users.js').User} */
      this.user = user
      /** @type {import('../../../../event-driven-web-components-yjs/src/es/controllers/Users.js').UsersContainer} */
      this.allUsers = allUsers
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
      :host chat-a-nick-name {
        display: inline-block;
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
      :host > li > div > table > tbody > tr#time-status {
        padding-bottom: var(--h-margin-bottom, 1em);
      }
      :host > li > div > table > tbody > tr#time-status > td {
        font-style: italic;
        margin-bottom: var(--h-margin-bottom, 1em);
      }
      :host(:not(.active, [self])[is-up-to-date]) > li > div > h2 {
        border-bottom: 1px solid var(--color-green-full);
      }
      :host(:not(.active, [self])[is-up-to-date]) > li > div > table > tbody > tr#time-status > td.time-status-icons {
        --color: var(--color-green-full);
      }
      :host([is-up-to-date]) > li > div > table > tbody > tr#time-status > td {
        border-bottom: 1px dotted var(--color-green-full);
      }
      :host(:not(.active, [self], [is-up-to-date])) > li > div > h2 {
        border-bottom: 1px solid var(--color-error);
      }
      :host(:not(.active, [self], [is-up-to-date])) > li > div > table > tbody > tr#time-status > td.time-status-icons {
        --color: var(--color-error);
      }
      :host(:not([is-up-to-date])) > li > div > table > tbody > tr#time-status > td {
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
    // keep-alive max=10days, value=1day, step=1h
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
                    <td>${this.hasAttribute('is-up-to-date')
                      ? 'is up to date:'
                      : 'is outdated:'
                    }</td>
                    <td class="time-status-icons">${this.hasAttribute('is-up-to-date')
                      ? '<wct-icon-mdx title="is up to date" no-hover icon-url="../../../../../../img/icons/message-check.svg" size="1.5em"></wct-icon-mdx>'
                      : '<wct-icon-mdx title="is outdated" no-hover icon-url="../../../../../../img/icons/message-x.svg" size="1.5em"></wct-icon-mdx>'
                    }</td>
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
                      ? 'active connected users:'
                      : key === 'connectedUsers'
                      ? 'once connected users:'
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
      }
    ])
  }

  /**
   * Update components
   * @param {import('../../../../event-driven-web-components-yjs/src/es/controllers/Users.js').User} user
   * @param {import('../../../../event-driven-web-components-yjs/src/es/controllers/Users.js').UsersContainer} allUsers
   * @returns {void}
   */
  update (user, allUsers) {
    console.log('*********', 'update', { user, allUsers })
    // TODO: renderHTML nodes with id must be dynamic
    if (this.nicknameNode) this.nicknameNode.outerHTML = User.renderNickname(user.nickname)
    if (this.connectedUsersNode) this.connectedUsersNode.outerHTML = User.renderConnectedUser('connectedUsers', user, allUsers)
    if (this.mutuallyConnectedUsersNode) this.mutuallyConnectedUsersNode.outerHTML = User.renderConnectedUser('mutuallyConnectedUsers', user, allUsers)
  }

  static renderNickname (nickname) {
    return /* html */`<span id=nickname>${nickname || 'none'}</span>`
  }

  static renderConnectedUser (key, user, allUsers) {
    return /* html */`
      <td id="${key}">${key === 'mutuallyConnectedUsers' || key === 'connectedUsers'
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
    `
  }

  get li () {
    return this.root.querySelector('li')
  }

  get nicknameNode () {
    return this.root.querySelector('#nickname')
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
}
