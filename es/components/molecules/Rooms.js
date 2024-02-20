// @ts-check
import { Shadow } from '../../../../event-driven-web-components-prototypes/src/Shadow.js'

/* global self */

/**
 * The rooms view
 * TODO: replace confirm box
 *
 * @export
 * @class Rooms
 */
export default class Rooms extends Shadow() {
  constructor (options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, ...options }, ...args)

    this.roomNamePrefix = 'chat-'
    this.roomNameEventListener = event => {
      event.stopPropagation()
      console.log('room name', event);
    }
  }

  connectedCallback () {
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
    this.addEventListener('room-name', this.roomNameEventListener)
  }

  disconnectedCallback () {
    this.removeEventListener('room-name', this.roomNameEventListener)
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
      new Promise(resolve => this.dispatchEvent(new CustomEvent('yjs-get-room', {
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
      if (!room.done) {
        await new Promise(resolve => this.dispatchEvent(new CustomEvent('yjs-set-room', {
          detail: {
            room: this.roomNamePrefix + self.prompt('room-name', `random-room-${Date.now()}`) || 'weedshakers-event-driven-web-components-test-22',
            resolve
          },
          bubbles: true,
          cancelable: true,
          composed: true
        })))
      }
      const hasRoomHtml = /* html */`
        <wct-dialog
          namespace="dialog-top-slide-in-"
        >
          <wct-menu-icon id="close" class="open" namespace="menu-icon-close-" no-click></wct-menu-icon>
          <wct-grid auto-fill="20%">
            <wct-input inputId="room-name" placeholder="${this.roomNamePrefix}" namespace="wct-input-" disabled></wct-input>
            <wct-button namespace="button-primary-" request-event-name="room-name">enter</wct-button>
          </wct-grid>
        </wct-dialog>
      `
      const hasNoRoomHtml = /* html */`
        <wct-dialog
          namespace="dialog-top-slide-in-"
          open=show-modal
        >
          <wct-grid auto-fill="20%">
            <wct-input inputId="room-name" placeholder="${this.roomNamePrefix}" namespace="wct-input-" disabled></wct-input>
            <wct-input inputId="room-name" placeholder="${`random-room-${Date.now()}`}" namespace="wct-middle-input-" grid-column="2/5" autofocus></wct-input>
            <wct-button namespace="button-primary-" request-event-name="room-name">enter</wct-button>
          </wct-grid>
        </wct-dialog>
      `
      this.html = room.done
        ? hasRoomHtml
        : hasNoRoomHtml
      document.title = await room
    })
  }
}
