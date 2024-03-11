// @ts-check
import { Shadow } from '../../../../event-driven-web-components-prototypes/src/Shadow.js'

/* global self */

/**
 * The rooms view
 *
 * @export
 * @class Rooms
 */
export default class Rooms extends Shadow() {
  constructor (options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, ...options }, ...args)

    this.roomNamePrefix = 'chat-'

    this.clickEventListener = async event => {
      let target
      if ((target = event.composedPath()[0]).hasAttribute('route')) {
        if ((await this.roomPromise).room.done) {
          // enter new room
          this.dialog.close()
          this.dispatchEvent(new CustomEvent('close-menu', {
            bubbles: true,
            cancelable: true,
            composed: true
          }))
        } else if(target.hasAttribute('room-name')) {
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
      } else if ((target = event.composedPath().find(el => el.hasAttribute?.('delete')))) {
        new Promise(resolve => this.dispatchEvent(new CustomEvent('storage-get', {
          detail: {
            key: `${this.roomNamePrefix}rooms`,
            resolve
          },
          bubbles: true,
          cancelable: true,
          composed: true
        }))).then(getRoomsResult => {
          delete getRoomsResult.value[target.getAttribute('delete')]
          this.dispatchEvent(new CustomEvent('storage-set', {
            detail: {
              key: `${this.roomNamePrefix}rooms`,
              value: getRoomsResult.value
            },
            bubbles: true,
            cancelable: true,
            composed: true
          }))
          Array.from(target.parentNode.parentNode.querySelectorAll('.deleted')).forEach(node => node.remove())
          target.parentNode.classList.add('deleted')
        })
      } else if ((target = event.composedPath().find(el => el.hasAttribute?.('undo')))) {
        new Promise(resolve => this.dispatchEvent(new CustomEvent('storage-undo', {
          detail: {
            key: `${this.roomNamePrefix}rooms`,
            resolve
          },
          bubbles: true,
          cancelable: true,
          composed: true
        }))).then(getRoomsResult => {
          target.parentNode.classList.remove('deleted')
        })
      }
    }

    this.roomNameEventListener = async (event) => {
      event.stopPropagation()
      this.dialog.close()
      this.dispatchEvent(new CustomEvent('close-menu', {
        bubbles: true,
        cancelable: true,
        composed: true
      }))
      let inputField = event.composedPath()[0].inputField || event.composedPath()[0].previousElementSibling?.inputField
      // check if url got entered as room name
      if (inputField?.value) {
        try {
          const url = new URL(inputField.value)
          const roomName = url.searchParams.get('room')
          if (roomName) return history.pushState({ ...history.state, pageTitle: (document.title = roomName) }, roomName, url.href)
        } catch (error) {}
      }
      const url = new URL(location.href)
      const roomName = `${this.roomNamePrefix}${inputField?.value || url.searchParams.get('room')?.replace(this.roomNamePrefix, '') || this.randomRoom}`
      if ((await this.roomPromise).room.done) {
        // enter new room
        if (inputField) inputField.value = ''
        url.searchParams.set('room', roomName)
        history.pushState({ ...history.state, pageTitle: (document.title = roomName) }, roomName, url.href)
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

    this.openRoomListener = event => {
      this.dialog.show('show-modal')
    }

    // save room name to local storage
    this.providersUpdateEventListener = async event => this.dispatchEvent(new CustomEvent('storage-merge', {
      detail: {
        key: `${this.roomNamePrefix}rooms`,
        value: {
          [await (await this.roomPromise).room]: {
            locationHref: event.detail.locationHref,
          }
        }
      },
      bubbles: true,
      cancelable: true,
      composed: true
    }))

    /** @type {(any)=>void} */
    this.roomResolve = map => map
    /** @type {Promise<{ locationHref: string, room: Promise<string> & {done: boolean} }>} */
    this.roomPromise = new Promise(resolve => (this.roomResolve = resolve))

    // save room name to local storage
    this.roomPromise.then(async ({locationHref, room}) => this.dispatchEvent(new CustomEvent('storage-merge', {
      detail: {
        key: `${this.roomNamePrefix}rooms`,
        value: {
          [await room]: {
            locationHref,
            entered: [Date.now()]
          }
        }
      },
      bubbles: true,
      cancelable: true,
      composed: true
    })))
  }

  connectedCallback () {
    if (this.shouldRenderCSS()) this.renderCSS()
    this.renderHTML()
    this.addEventListener('click', this.clickEventListener)
    this.addEventListener('submit-room-name', this.roomNameEventListener)
    this.globalEventTarget.addEventListener('open-room', this.openRoomListener)
    this.globalEventTarget.addEventListener('yjs-providers-update', this.providersUpdateEventListener)
    this.dispatchEvent(new CustomEvent('yjs-get-room', {
      detail: {
        resolve: this.roomResolve
      },
      bubbles: true,
      cancelable: true,
      composed: true
    }))
  }

  disconnectedCallback () {
    this.removeEventListener('click', this.clickEventListener)
    this.removeEventListener('submit-room-name', this.roomNameEventListener)
    this.globalEventTarget.removeEventListener('open-room', this.openRoomListener)
    this.globalEventTarget.removeEventListener('yjs-providers-update', this.providersUpdateEventListener)
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
        --button-primary-width: 100%;
        --button-primary-height: 100%;
        --wct-input-input-height: 100%;
        --wct-input-height: var(--wct-input-input-height);
        --wct-input-border-radius: var(--border-radius) 0 0 var(--border-radius);
        --wct-middle-input-input-height: var(--wct-input-input-height);
        --wct-middle-input-height: var(--wct-middle-input-input-height);
        --wct-middle-input-border-radius: 0;
        --button-primary-border-radius: 0 var(--border-radius) var(--border-radius) 0;
        --dialog-left-slide-in-ul-padding-left: 0;
        --dialog-left-slide-in-ul-margin: 0;
        --dialog-left-slide-in-ul-list-style: none;
        --dialog-left-slide-in-hr-margin: 0.5em 0 -0.5em;
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
      new Promise(resolve => this.dispatchEvent(new CustomEvent('storage-get', {
        detail: {
          key: `${this.roomNamePrefix}rooms`,
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
          path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/atoms/iconMdx/IconMdx.js`,
          name: 'a-icon-mdx'
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
    ]).then(async ([{ room }, getRoomsResult]) => {
      let roomName
      this.html = ''
      this.html = room.done
        ? /* html */`
          <wct-dialog
            namespace="dialog-left-slide-in-"
          >
            <wct-menu-icon id="close" class="open" namespace="menu-icon-close-" no-click click-event-name="close-menu"></wct-menu-icon>
            <dialog>
              <h4>Enter room name or link:</h4>
              <wct-grid auto-fill="20%">
                <section>
                  <wct-input inputId="room-name-prefix" placeholder="${this.roomNamePrefix}" namespace="wct-input-" disabled></wct-input>
                  <wct-input inputId="room-name" placeholder="${(roomName = await room).replace(this.roomNamePrefix, '')}" namespace="wct-middle-input-" namespace-fallback grid-column="2/5" submit-search="submit-room-name" autofocus force></wct-input>
                  <wct-button namespace="button-primary-" request-event-name="submit-room-name">enter</wct-button>
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
            no-backdrop-close
          >
            <dialog>
              <h4>Enter room name or link:</h4>
              <wct-grid auto-fill="20%">
                <section>
                  <wct-input inputId="room-name-prefix" placeholder="${this.roomNamePrefix}" namespace="wct-input-" disabled></wct-input>
                  <wct-input inputId="room-name" placeholder="${this.randomRoom}" namespace="wct-middle-input-" namespace-fallback grid-column="2/5" submit-search="submit-room-name" autofocus force></wct-input>
                  <wct-button namespace="button-primary-" request-event-name="submit-room-name">enter</wct-button>
                </section>
              </wct-grid>
              <hr>
              ${Rooms.renderRoomList(getRoomsResult)}
            </dialog>
          </wct-dialog>
        `
      document.title = roomName || (await room)
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
    return /* html */`<style>
      :host hr {
        width: 100%;
      }
      :host ul > li {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid var(--background-color-rgba-50);
        padding-top: 0.5em;
        padding-bottom: 0.5em;
      }
      :host ul > li:last-child {
        border-bottom: none;
      }
      :host ul > li.deleted {
        text-decoration: line-through;
      }
      :host ul > li [delete] {
        display:block;
      }
      :host ul > li.deleted [delete] {
        display:none;
      }
      :host ul > li [undo] {
        display:none;
      }
      :host ul > li.deleted [undo] {
        display:block;
      }
      :host ul > li > a {
        margin: 0;
      }
      :host ul > li > a-icon-mdx {
        --color: var(--color-error);
      }
    </style>
    <ul>
      ${Object.keys(rooms.value)
        .sort((a, b) => rooms.value[b].entered?.slice(-1) - rooms.value[a].entered?.slice(-1))
        .reduce((acc, key) => acc + (key === activeRoomName ? '' : `<li><a route href="${rooms.value[key].locationHref}">${key}</a><a-icon-mdx delete="${key}" icon-url="../../../../../../img/icons/eraser.svg" size="2em"></a-icon-mdx><a-icon-mdx undo icon-url="../../../../../../img/icons/arrow-back-up.svg" size="2em"></a-icon-mdx></li>`), '')
      }
    </ul>`
  }

  get randomRoom () {
    return this._randomRoom || (this._randomRoom = `random-room-${Date.now()}`)
  }

  get dialog () {
    return this.root.querySelector('wct-dialog')
  }

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }
}
