// @ts-check
import { Shadow } from '../../../../event-driven-web-components-prototypes/src/Shadow.js'

/* global self */

/**
 * The users view
 * TODO: replace confirm box
 * TODO: listen to "yjs-users" event dispatched from controller/Users.js with func. detail.getData() and not awareness-change event!!!
 * TODO: view component for controllers/Users.js with https://github.com/feross/p2p-graph
 *
 * @export
 * @class Users
 */
export default class Users extends Shadow() {
  constructor (options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, ...options }, ...args)

    let timeoutId = null
    this.usersEventListener = async event => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        console.log('users', {
          data: event.detail.getData(),
          selfUser: event.detail.selfUser
        })
        this.renderHTML(event.detail.getData(), event.detail.selfUser)
      }, 2000)
    }
  }

  connectedCallback () {
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
    document.body.addEventListener('yjs-users', this.usersEventListener)
    new Promise(resolve => this.dispatchEvent(new CustomEvent('yjs-get-nickname', {
      detail: {
        resolve
      },
      bubbles: true,
      cancelable: true,
      composed: true
    }))).then(nickname => {
      if (!nickname) {
        nickname = 'no-name-' + new Date().getUTCMilliseconds()
        nickname = self.prompt('nickname', nickname) || `${nickname}-${new Date().getUTCMilliseconds()}`
        this.dispatchEvent(new CustomEvent('yjs-set-nickname', {
          /** @type {import("../../../../event-driven-web-components-yjs/src/es/controllers/Users.js").SetNicknameDetail} */
          detail: {
            nickname
          },
          bubbles: true,
          cancelable: true,
          composed: true
        }))
      }
    })
  }

  disconnectedCallback () {
    document.body.removeEventListener('yjs-users', this.usersEventListener)
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
    return !this.root.querySelector('span')
  }

  /**
   * Renders the CSS
   *
   * @return {void}
   */
  renderCSS () {
    this.css = /* css */`
      :host > details > div {
        overflow-y: auto;
        max-height: 25svh;
      }
      :host h3 {
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
    `
  }

  /**
  * renders the html
  *
  * @return {void}
  */
  renderHTML (data, selfUser) {
    if (data) {
      if (data.users.size) {
        this.connectedUsers.textContent = data.users.size ? data.users.size - 1 : 'You are alone!'
        this.connectedUsers.classList.remove('warning')
      } else {
        this.connectedUsers.textContent = 'You are alone!'
        this.connectedUsers.classList.add('warning')
      }
      this.usersOl.innerHTML = ''
      Users.renderUserTableList(this.usersOl, data.users, selfUser)
      this.allUsersOl.innerHTML = ''
      Users.renderUserTableList(this.allUsersOl, data.allUsers, selfUser)
      
    } else {
      this.html = /* html */`
        <details>
          <summary>Directly connected Users <span id="connected-users">...</span></summary>
          <div>
            <div>
              <h3>Mutually connected users</h3>
              <ol id="users"></ol>
            </div>
            <div>
              <h3>Users which once were connected</h3>
              <ol id="all-users"></ol>
            </div>
          </div>
        </details>
      `
    }
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

  get connectedUsers () {
    return this.root.querySelector('#connected-users')
  }

  get usersOl () {
    return this.root.querySelector('#users')
  }

  get allUsersOl () {
    return this.root.querySelector('#all-users')
  }
}
