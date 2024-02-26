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

    this.roomNameEventListener = async (event) => {
      event.stopPropagation()
      this.dialog.close()
      this.dispatchEvent(new CustomEvent('close-menu', {
        bubbles: true,
        cancelable: true,
        composed: true
      }))
      const url = new URL(location.href)
      let inputField = event.composedPath()[0].inputField || event.composedPath()[0].previousElementSibling?.inputField
      const roomName = `${this.roomNamePrefix}${inputField?.value || url.searchParams.get('room')?.replace(this.roomNamePrefix, '') || this.randomRoom}`
      if ((await this.room).room.done) {
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

    /** @type {(any)=>void} */
    this.roomResolve = map => map
    /** @type {Promise<{ room: Promise<string> & {done: boolean} }>} */
    this.room = new Promise(resolve => (this.roomResolve = resolve))
  }

  connectedCallback () {
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
    this.addEventListener('room-name', this.roomNameEventListener)
    this.addEventListener('submit-search', this.roomNameEventListener)
    this.globalEventTarget.addEventListener('open-room', this.openRoomListener)
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
    this.removeEventListener('room-name', this.roomNameEventListener)
    this.removeEventListener('submit-search', this.roomNameEventListener)
    this.globalEventTarget.removeEventListener('open-room', this.openRoomListener)
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
        --wct-middle-input-input-height: var(--wct-input-input-height);
        --wct-middle-input-height: var(--wct-middle-input-input-height);
        --wct-middle-input-border-radius: 0;
        --button-primary-border-radius: 0 var(--border-radius) var(--border-radius) 0;
      }
    `
  }

  /**
  * renders the html
  *
  * @return {Promise<void>}
  */
  renderHTML () {
    this.rendered = true
    return Promise.all([
      this.room,
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
    ]).then(async ([{ room }]) => {
      this.html = ''
      this.html = room.done
        ? /* html */`
          <wct-dialog
            namespace="dialog-top-slide-in-"
          >
            <wct-menu-icon id="close" class="open" namespace="menu-icon-close-" no-click click-event-name="close-menu"></wct-menu-icon>
            <dialog>
              <h4>Enter the room name:</h4>
              <wct-grid auto-fill="20%">
                <section>
                  <wct-input inputId="room-name-prefix" placeholder="${this.roomNamePrefix}" namespace="wct-input-" disabled></wct-input>
                  <wct-input inputId="room-name" placeholder="${(await room).replace(this.roomNamePrefix, '')}" namespace="wct-middle-input-" namespace-fallback grid-column="2/5" submit-search autofocus force></wct-input>
                  <wct-button namespace="button-primary-" request-event-name="room-name">enter</wct-button>
                </section>
              </wct-grid>
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
              <h4>Enter the room name:</h4>
              <wct-grid auto-fill="20%">
                <section>
                  <wct-input inputId="room-name-prefix" placeholder="${this.roomNamePrefix}" namespace="wct-input-" disabled></wct-input>
                  <wct-input inputId="room-name" placeholder="${this.randomRoom}" namespace="wct-middle-input-" namespace-fallback grid-column="2/5" submit-search autofocus force></wct-input>
                  <wct-button namespace="button-primary-" request-event-name="room-name">enter</wct-button>
                </section>
              </wct-grid>
            </dialog>
          </wct-dialog>
        `
      document.title = await room
    })
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
