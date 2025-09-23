// @ts-check
import { Shadow } from '../../../../event-driven-web-components-prototypes/src/Shadow.js'

/* global self */
/* global Environment */
/* global history */
/* global location */

/**
 * The rooms view
 *
 * @export
 * @class Rooms
 */
export default class Rooms extends Shadow() {
  constructor (options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, ...options }, ...args)

    // @ts-ignore
    this.roomNamePrefix = self.Environment?.roomNamePrefix || 'chat-'
    this.shareDialogMap = new Map()
    this.roomNameAkaDialogMap = new Map()

    this.clickEventListener = async event => {
      let target
      if ((target = event.composedPath()[0]).hasAttribute('route')) {
        if ((await this.roomPromise).room.done) {
          // enter new room
          this.dialog?.close()
        } else if (target.hasAttribute('room-name')) {
          event.preventDefault()
          event.stopPropagation()
          // open first room
          this.dispatchEvent(new CustomEvent('yjs-set-room', {
            detail: {
              room: target.getAttribute('room-name')
            },
            bubbles: true,
            cancelable: true,
            composed: true
          }))
          this.renderHTML()
        }
      } else if ((target = event.composedPath().find(el => el.hasAttribute?.('share')))) {
        this.fetchModules([{
          // @ts-ignore
          path: `${this.importMetaUrl}../molecules/dialogs/ShareDialog.js?${Environment?.version || ''}`,
          name: 'chat-m-share-dialog'
        }]).then(async () => {
          if (this.shareDialogMap.has(target.getAttribute('share'))) {
            this.shareDialogMap.get(target.getAttribute('share')).show('show-modal')
          } else {
            const div = document.createElement('div')
            div.innerHTML = /* html */`
              <chat-m-share-dialog
                namespace="dialog-top-slide-in-"
                open="show-modal"
                room-name="${target.getAttribute('share')}"
                ${(await this.roomPromise).room.done
                  ? await (await this.roomPromise).room === target.getAttribute('share')
                    ? 'is-active-room'
                    : ''
                  : 'no-share-in-chat'
                }
              ></chat-m-share-dialog>
            `
            this.shareDialogMap.set(target.getAttribute('share'), div.children[0])
            this.root.appendChild(div.children[0])
          }
        })
      } else if ((target = event.composedPath().find(el => el.hasAttribute?.('edit')))) {
        Promise.all([
          new Promise(resolve => this.dispatchEvent(new CustomEvent('yjs-get-rooms', {
            detail: {
              resolve
            },
            bubbles: true,
            cancelable: true,
            composed: true
          }))),
          this.fetchModules([{
            // @ts-ignore
            path: `${this.importMetaUrl}../molecules/dialogs/RoomNameAkaDialog.js?${Environment?.version || ''}`,
            name: 'chat-m-room-name-aka-dialog'
          }])
        ]).then(([getRoomsResult]) => {
          if (this.roomNameAkaDialogMap.has(target.getAttribute('edit'))) {
            this.roomNameAkaDialogMap.get(target.getAttribute('edit')).show('show-modal')
          } else {
            const div = document.createElement('div')
            div.innerHTML = /* html */`
              <chat-m-room-name-aka-dialog
                namespace="dialog-top-slide-in-"
                open="show-modal"
                room-name="${target.getAttribute('edit')}"
                li-count="${target.getAttribute('li-count')}"
              >
                <template>${JSON.stringify(getRoomsResult.value)}</template>
              </chat-m-room-name-aka-dialog>
            `
            this.roomNameAkaDialogMap.set(target.getAttribute('edit'), div.children[0])
            this.root.appendChild(div.children[0])
          }
        })
      } else if ((target = event.composedPath().find(el => el.hasAttribute?.('delete')))) {
        new Promise(resolve => this.dispatchEvent(new CustomEvent('yjs-delete-room', {
          detail: {
            resolve,
            name: target.getAttribute('delete')
          },
          bubbles: true,
          cancelable: true,
          composed: true
        }))).then(() => this.dispatchEvent(new CustomEvent('yjs-request-notifications', {
          detail: { force: true },
          bubbles: true,
          cancelable: true,
          composed: true
        })))
        this.dispatchEvent(new CustomEvent('yjs-unsubscribe-notifications', {
          detail: {
            room: target.getAttribute('delete'),
            locationHref: target.getAttribute('href')
          },
          bubbles: true,
          cancelable: true,
          composed: true
        }))
        this.clearAllDeleted()
        target.parentNode.classList.add('deleted')
      } else if ((target = event.composedPath().find(el => el.hasAttribute?.('undo')))) {
        target.parentNode.classList.remove('deleted')
        new Promise(resolve => this.dispatchEvent(new CustomEvent('yjs-undo-room', {
          detail: {
            resolve
          },
          bubbles: true,
          cancelable: true,
          composed: true
        }))).then(() => this.dispatchEvent(new CustomEvent('yjs-request-notifications', {
          detail: { force: true },
          bubbles: true,
          cancelable: true,
          composed: true
        })))
        this.dispatchEvent(new CustomEvent('yjs-subscribe-notifications', {
          detail: {
            room: target.getAttribute('undo'),
            locationHref: target.getAttribute('href')
          },
          bubbles: true,
          cancelable: true,
          composed: true
        }))
      } else if ((target = event.composedPath().find(el => el.matches?.('[disabled]')))) {
        if (target.querySelector('chat-m-notifications[has-notifications]')) {
          this.dispatchEvent(new CustomEvent('provider-dialog-show-event', {
            bubbles: true,
            cancelable: true,
            composed: true
          }))
        }
        this.dialog?.close()
      }
    }

    this.roomNameEventListener = async (event) => {
      event.stopPropagation()
      if (event?.detail?.type === 'key') {
        // filter rooms
        Rooms.filterFunction(event.detail.value, Array.from(this.ul.children))
      } else {
        // go to room
        this.dialog?.close()
        const inputField = event.composedPath()[0].inputField || event.composedPath()[0].previousElementSibling?.inputField
        // check if url got entered as room name
        if (inputField?.value) {
          try {
            const url = new URL(inputField.value.replace(/"/g, ''))
            const roomName = url.searchParams.get('room')
            if (roomName) return history.pushState({ ...history.state, pageTitle: roomName }, roomName, url.href.replace(url.origin, location.origin))
          } catch (error) {}
        }
        const url = new URL(location.href)
        const roomName = `${this.roomNamePrefix}${inputField?.value?.replace(/"/g, '')?.replace(this.roomNamePrefix, '') || url.searchParams.get('room')?.replace(this.roomNamePrefix, '') || this.randomRoom}`
        if ((await this.roomPromise).room.done) {
          // enter new room
          if (inputField) inputField.value = ''
          url.searchParams.set('room', roomName)
          history.pushState({ ...history.state, pageTitle: roomName }, roomName, url.href)
        } else {
          // open first room
          this.dispatchEvent(new CustomEvent('yjs-set-room', {
            detail: {
              room: roomName
            },
            bubbles: true,
            cancelable: true,
            composed: true
          }))
          this.renderHTML()
        }
      }
    }

    this.roomNameAkaEventListener = event => {
      const target = this.ul.querySelector(`#${event.detail.key}`)?.querySelector('.aka') || this.ul.children[event.detail.liCount]?.querySelector('.aka')
      if (target) target.textContent = event.detail.aka ? event.detail.aka : ''
    }

    this.generateRoomNameLinkClickEventListener = event => {
      event.preventDefault()
      if (this.inputRoomName) {
        this.inputRoomName.value = Rooms.getRandomRoom()
        this.inputRoomName.focus()
      }
    }

    this.openRoomListener = event => {
      this.renderHTML().then(() => this.dialog?.show('show-modal'))
    }

    /** @type {(any)=>void} */
    this.roomResolve = map => map
    /** @type {Promise<{ locationHref: string, room: Promise<string> & {done: boolean} }>} */
    this.roomPromise = new Promise(resolve => (this.roomResolve = resolve))
  }

  connectedCallback () {
    this.roomPromise.then(async room => (document.title = await room.room))
    if (this.shouldRenderCSS()) this.renderCSS()
    this.addEventListener('click', this.clickEventListener)
    this.addEventListener('submit-room-name', this.roomNameEventListener)
    this.addEventListener('room-name-aka', this.roomNameAkaEventListener)
    this.globalEventTarget.addEventListener('open-room', this.openRoomListener)
    if (this.isConnected) this.connectedCallbackOnce()
  }

  async connectedCallbackOnce () {
    this.dispatchEvent(new CustomEvent('yjs-get-room', {
      detail: {
        resolve: this.roomResolve
      },
      bubbles: true,
      cancelable: true,
      composed: true
    }))
    if (!(await this.roomPromise).room.done) this.renderHTML()
    // @ts-ignore
    this.connectedCallbackOnce = () => {}
  }

  disconnectedCallback () {
    this.removeEventListener('click', this.clickEventListener)
    this.removeEventListener('submit-room-name', this.roomNameEventListener)
    this.removeEventListener('room-name-aka', this.roomNameAkaEventListener)
    this.globalEventTarget.removeEventListener('open-room', this.openRoomListener)
    this.dialog?.close()
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
   * Renders the CSS
   *
   * @return {Promise<void>}
   */
  renderCSS () {
    this.css = /* css */`
      :host {
        --button-primary-border-radius: 0 var(--border-radius) var(--border-radius) 0;
        --button-primary-height: 100%;
        --button-primary-width: 100%;
        --dialog-left-slide-in-hr-margin: 0.5em 0 -0.5em;
        --dialog-left-slide-in-ul-display: flex;
        --dialog-left-slide-in-ul-list-style: none;
        --dialog-left-slide-in-ul-margin: 0;
        --dialog-left-slide-in-ul-padding-left: 0;
        --dialog-top-slide-in-hr-margin: 0.5em 0 -0.5em;
        --dialog-top-slide-in-ul-display: flex;
        --dialog-top-slide-in-ul-list-style: none;
        --dialog-top-slide-in-ul-margin: 0;
        --dialog-top-slide-in-ul-padding-left: 0;
        --wct-input-border-radius: var(--border-radius) 0 0 var(--border-radius);
        --wct-input-height: var(--wct-input-input-height);
        --wct-input-input-height: 100%;
        --wct-middle-input-border-radius: 0;
        --wct-middle-input-height: var(--wct-middle-input-input-height);
        --wct-middle-input-input-height: var(--wct-input-input-height);
      }
    `
    return this.fetchTemplate()
  }

  /**
   * fetches the template
   *
   * @return {Promise<void>}
   */
  fetchTemplate () {
    /** @type {import("../../../../event-driven-web-components-prototypes/src/Shadow.js").fetchCSSParams[]} */
    const styles = [
      {
        path: `${this.importMetaUrl}../../../../web-components-toolbox/src/css/reset.css`, // no variables for this reason no namespace
        namespace: false
      },
      {
        path: `${this.importMetaUrl}../../../../web-components-toolbox/src/css/style.css`, // apply namespace and fallback to allow overwriting on deeper level
        namespaceFallback: true
      }
    ]
    switch (this.getAttribute('namespace')) {
      default:
        return this.fetchCSS(styles, false)
    }
  }

  /**
  * renders the html
  *
  * @return {Promise<void>}
  */
  renderHTML () {
    return Promise.all([
      this.roomPromise,
      new Promise(resolve => this.dispatchEvent(new CustomEvent('yjs-get-rooms', {
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
          path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/atoms/iconMdx/IconMdx.js?${Environment?.version || ''}`,
          name: 'wct-icon-mdx'
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
        },
        {
          // @ts-ignore
          path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/molecules/loadTemplateTag/LoadTemplateTag.js?${Environment?.version || ''}`,
          name: 'wct-load-template-tag'
        },
        {
          // @ts-ignore
          path: `${this.importMetaUrl}./Notifications.js?${Environment?.version || ''}`,
          name: 'chat-m-notifications'
        }
      ])
    ]).then(async ([{ room }, getRoomsResult]) => {
      // TODO: Consider to only rerender the necessary parts like renderRoomList (updateRoomList with Room.js component) but keep the dialog
      let roomName
      this.html = ''
      this.shareDialogMap = new Map()
      this.roomNameAkaDialogMap = new Map()
      this.html = room.done
        ? /* html */`
          <wct-dialog
            namespace="dialog-left-slide-in-"
          >
            <style protected=true>
              :host > dialog > wct-menu-icon {
                margin-left: calc(-0.5 * var(--dialog-left-slide-in-padding-custom));
              }
            </style>
            <dialog>
              <wct-menu-icon id="close" no-aria class="open sticky" namespace="menu-icon-close-" no-click background style="--outline-style-focus-visible: none;"></wct-menu-icon>
              <h4>Enter room name or link:</h4>
              <wct-grid auto-fill="20%">
                <style protected=true>
                  :host #generate-room-name {
                    --a-margin: 0;
                    --a-text-decoration: underline;
                    --a-display: flex;
                    --color: var(--a-color);
                    --color-hover: var(--color-yellow);
                    font-style: italic;
                    font-size: 0.75em;
                    margin: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                  }
                </style>
                <section>
                  <a href="#" id="generate-room-name" grid-row="1/1" grid-column="2/5"><wct-icon-mdx size="1em" hover-on-parent-element title="generate" icon-url="../../../../../../img/icons/fold-down.svg"></wct-icon-mdx>&nbsp;Generate a random room name&nbsp;<wct-icon-mdx size="1em" hover-on-parent-element title="generate" icon-url="../../../../../../img/icons/fold-down.svg"></wct-icon-mdx></a>
                  <wct-input grid-row="2/2" inputId="room-name-prefix" placeholder="${this.roomNamePrefix}" namespace="wct-input-" disabled></wct-input>
                  <wct-input grid-row="2/2" grid-column="2/5" inputId="room-name" placeholder="${(roomName = await room).replace(this.roomNamePrefix, '')}" namespace="wct-middle-input-" namespace-fallback submit-search="submit-room-name" any-key-listener autofocus force></wct-input>
                  <wct-button grid-row="2/2" namespace="button-primary-" request-event-name="submit-room-name" click-no-toggle-active>enter</wct-button>
                </section>
              </wct-grid>
              <hr>
              ${Rooms.renderRoomList(getRoomsResult, roomName)}
            </dialog>
          </wct-dialog>
        `
        : /* html */`
          <wct-dialog
            namespace="dialog-top-slide-in-"
            open=show-modal
            open-on-every-connect
            no-backdrop-close
          >
            <style protected=true>
              :host {
                --dialog-top-slide-in-hr-margin: 1em 0 0;
              }
            </style>
            <dialog>
              <h4>Enter room name or link:</h4>
              <wct-grid auto-fill="20%">
                <section>
                  <wct-input inputId="room-name-prefix" placeholder="${this.roomNamePrefix}" namespace="wct-input-" disabled></wct-input>
                  <wct-input grid-column="2/5" inputId="room-name" placeholder="${this.randomRoom}" namespace="wct-middle-input-" namespace-fallback submit-search="submit-room-name" any-key-listener autofocus force></wct-input>
                  <wct-button namespace="button-primary-" request-event-name="submit-room-name" click-no-toggle-active>enter</wct-button>
                </section>
              </wct-grid>
              <hr>
              ${Rooms.renderRoomList(getRoomsResult)}
            </dialog>
          </wct-dialog>
        `
      if (this.generateRoomNameLink) this.generateRoomNameLink.addEventListener('click', this.generateRoomNameLinkClickEventListener)
    })
  }

  /**
   *
   *
   * @param {{value: {string: any}}} rooms
   * @param {string} [activeRoomName=undefined]
   * @return {string}
   */
  static renderRoomList (rooms, activeRoomName) {
    return /* html */`<style protected="true">
      :host {
        --color-hover: var(--color-yellow);
      }
      :host hr {
        width: 100%;
      }
      :host ul {
        overflow: auto;
        scrollbar-color: var(--color) var(--background-color);
        scrollbar-width: thin;
        padding-bottom: 0.5em;
      }
      :host ul > li {
        border-bottom: 1px solid var(--background-color-rgba-50);
        padding-top: 0.5em;
        padding-bottom: 0.5em;
      }
      :host ul > li.hidden {
        display: none;
      }
      :host ul > li > div {
        display: flex;
        gap: 1em;
        align-items: start;
        justify-content: space-between;
      }
      :host ul > li[disabled] {
        order: -1;
      }
      :host ul > li[disabled] > div > wct-icon-mdx:not([share]):not([edit]) {
        display: none;
      }
      :host ul > li[disabled] > div > a {
        color: var(--color-disabled);
      }
      :host ul > li:not([disabled]):last-child {
        border-bottom: none;
      }
      :host ul > wct-load-template-tag {
        min-height: 3em;
      }
      :host ul > li > div.deleted {
        text-decoration: line-through;
      }
      :host ul > li [delete] {
        display: contents;
      }
      :host ul > li > div.deleted [delete] {
        display: none;
      }
      :host ul > li [undo] {
        display: none;
      }
      :host ul > li > div.deleted [undo] {
        display: contents;
      }
      :host ul > li > div > a {
        margin: 0;
      }
      :host ul > li > div > a:not(:has(> chat-m-notifications)) {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        flex-shrink: 10;
        max-width: calc(100% - 3em);
      }
      :host ul > li > div > wct-icon-mdx {
        --color: var(--color-error);
      }
      :host ul > li > div > wct-icon-mdx[share], :host ul > li > div > wct-icon-mdx[edit] {
        --color: unset;
      }
      :host ul > li[disabled] > div chat-m-notifications {
        color: var(--color-disabled);
      }
      :host ul > li > div > a > div.aka {
        color: var(--color-disabled);
        font-style: italic;
        font-size: 0.75em;
        text-decoration: underline;
        margin-left: 1em;
        display: list-item;
        list-style: inside;
      }
      :host ul > li > div > a > div.aka:empty {
        display: none;
      }
    </style>
    <ul>
      ${Object.keys(rooms.value)
        .sort((a, b) => rooms.value[b].entered?.[0] - rooms.value[a].entered?.[0])
        .reduce((acc, key, i, arr) => acc + /* html */`<wct-load-template-tag no-css copy-class-list><template><li id="${key}"${key === activeRoomName ? ' disabled' : ''}>
          <div>
            <a route href="${rooms.value[key].locationHref}">
              <div>${key}</div>
              <div class=aka>${rooms.value[key].aka ? rooms.value[key].aka : ''}</div>
            </a>
            ${key === activeRoomName
              ? /* html */`<chat-m-notifications room="${key}" no-click on-connected-request-notifications allow-mute span-cursor=pointer></chat-m-notifications>`
              : /* html */`
                <a route href="${rooms.value[key].locationHref}">
                  <chat-m-notifications room="${key}" no-click on-connected-request-notifications allow-mute span-cursor=pointer></chat-m-notifications>
                </a>
              `}
            <wct-icon-mdx title="share" share="${key}" icon-url="../../../../../../img/icons/share-3.svg" size="2em"></wct-icon-mdx>
            <wct-icon-mdx title="edit aka" edit="${key}" li-count=${i} icon-url="../../../../../../img/icons/pencil.svg" size="2em"></wct-icon-mdx>
            <wct-icon-mdx title="delete" delete="${key.replace(/"/g, "'")}" href="${rooms.value[key].locationHref}" icon-url="../../../../../../img/icons/trash.svg" size="2em"></wct-icon-mdx>
            <wct-icon-mdx title="undo" undo="${key}" href="${rooms.value[key].locationHref}" icon-url="../../../../../../img/icons/trash-off.svg" size="2em"></wct-icon-mdx>
          </div>
        </li></template></wct-load-template-tag>`, '')
      }
    </ul>`
  }

  clearAllDeleted () {
    if (this.dialog) Array.from(this.dialog.root.querySelectorAll('.deleted')).forEach(node => node.parentNode.remove())
  }

  /**
   * add remove hidden class regarding if filter string is included in the node
   *
   * @method
   * @name filterFunction
   * @kind method
   * @memberof Rooms
   * @static
   * @param {string} filter
   * @param {HTMLElement[]} nodes
   * @return {void}
   */
  static filterFunction (filter, nodes) {
    filter = filter.toUpperCase()
    // @ts-ignore
    nodes.forEach(node => node.classList[!filter || (node.template?.content.textContent || node.innerText || node.textContent).toUpperCase().includes(filter) ? 'remove' : 'add']('hidden'))
  }

  /**
   * generate random string
   *
   * @method
   * @name getRandomRoom
   * @kind method
   * @memberof Rooms
   * @static
   * @returns {string}
   */
  static getRandomRoom () {
    return `random-room-${Date.now()}`
  }

  get randomRoom () {
    return this._randomRoom || (this._randomRoom = Rooms.getRandomRoom())
  }

  get dialog () {
    return this.root.querySelector('wct-dialog')
  }

  get grid () {
    return this.dialog?.root.querySelector('wct-grid')
  }

  get inputRoomName () {
    return this.grid?.root.querySelector('[inputId="room-name"]').inputField
  }

  get generateRoomNameLink () {
    return this.grid?.root.querySelector('#generate-room-name')
  }

  get ul () {
    return this.dialog.root.querySelector('ul')
  }

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }
}
