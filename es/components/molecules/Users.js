// @ts-check
import { Shadow } from '../../../../event-driven-web-components-prototypes/src/Shadow.js'

/* global self */

/**
 * The users view
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
    this.nicknameEventListener = event => (this.nickname = Promise.resolve(event.detail.nickname))
    this.setNicknameEventListener = event => {
      event.stopPropagation()
      this.dialog.close()
      this.dispatchEvent(new CustomEvent('close-menu', {
        bubbles: true,
        cancelable: true,
        composed: true
      }))
      let inputField = event.composedPath()[0].inputField || event.composedPath()[0].previousElementSibling?.inputField
      this.dispatchEvent(new CustomEvent('yjs-set-nickname', {
        /** @type {import("../../../../event-driven-web-components-yjs/src/es/controllers/Users.js").SetNicknameDetail} */
        detail: {
          nickname: inputField?.value
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))
    }
    this.openUserListener = event => {
      this.dialog.show('show-modal')
    }

    /** @type {(any)=>void} */
    this.nicknameResolve = map => map
    /** @type { Promise<string> } */
    this.nickname = new Promise(resolve => (this.nicknameResolve = resolve))
  }

  connectedCallback () {
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
    this.globalEventTarget.addEventListener('yjs-users', this.usersEventListener)
    this.globalEventTarget.addEventListener('yjs-nickname', this.nicknameEventListener)
    this.addEventListener('nickname', this.setNicknameEventListener)
    this.addEventListener('submit-search', this.setNicknameEventListener)
    this.globalEventTarget.addEventListener('open-nickname', this.openUserListener)
    this.dispatchEvent(new CustomEvent('yjs-get-nickname', {
      detail: {
        resolve: this.nicknameResolve
      },
      bubbles: true,
      cancelable: true,
      composed: true
    }))
  }

  disconnectedCallback () {
    this.globalEventTarget.removeEventListener('yjs-users', this.usersEventListener)
    this.globalEventTarget.removeEventListener('yjs-nickname', this.nicknameEventListener)
    this.removeEventListener('nickname', this.setNicknameEventListener)
    this.removeEventListener('submit-search', this.setNicknameEventListener)
    this.globalEventTarget.removeEventListener('open-nickname', this.openUserListener)
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
    return !this.rendered
  }

  /**
   * Renders the CSS
   *
   * @return {void}
   */
  renderCSS () {
    this.css = /* css */`
      :host {
        --button-primary-width: 100%;
        --button-primary-height: 100%;
        --wct-input-input-height: 100%;
        --wct-input-height: var(--wct-input-input-height);
        --wct-input-border-radius: var(--border-radius) 0 0 var(--border-radius);
        --button-primary-border-radius: 0 var(--border-radius) var(--border-radius) 0;
        --wct-input-placeholder-color: lightgray;
      }
      :host > wct-dialog {
        font-size: 1rem;
      }
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
  * @return {Promise<void>}
  */
  renderHTML (data, selfUser) {
    this.rendered = true
    return Promise.all([
      this.nickname,
      this.fetchModules([
        {
          // @ts-ignore
          path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/atoms/button/Button.js?${Environment?.version || ''}`,
          name: 'wct-button'
        },
        {
          // @ts-ignore
          path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/atoms/input/Input.js?${Environment?.version || ''}`,
          name: 'wct-input'
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
          path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/organisms/grid/Grid.js?${Environment?.version || ''}`,
          name: 'wct-grid'
        }
      ])
    ]).then(async ([nickname]) => {
      console.log('nicknames:', {thisNickname: nickname, selfUserNickname: selfUser?.nickname})
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
          <wct-dialog
            namespace="dialog-top-slide-in-"
          >
            <wct-menu-icon id="close" class="open" namespace="menu-icon-close-" no-click click-event-name="close-menu"></wct-menu-icon>
            <dialog>
              <h4>Enter the nickname:</h4>
              <wct-grid auto-fill="20%">
                <section>
                  <wct-input inputId="nickname" placeholder="${nickname}" namespace="wct-input-" namespace-fallback grid-column="1/5" submit-search autofocus force></wct-input>
                  <wct-button namespace="button-primary-" request-event-name="nickname">enter</wct-button>
                </section>
              </wct-grid>
            </dialog>
          </wct-dialog>
        `
      }
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

  get connectedUsers () {
    return this.root.querySelector('#connected-users')
  }

  get usersOl () {
    return this.root.querySelector('#users')
  }

  get allUsersOl () {
    return this.root.querySelector('#all-users')
  }

  get dialog () {
    return this.root.querySelector('wct-dialog')
  }

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }
}
