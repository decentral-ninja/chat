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
  }

  connectedCallback () {
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
  }

  disconnectedCallback () {

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
    return !this.root.querySelector('m-dialog')
  }

  /**
   * Renders the CSS
   *
   * @return {void}
   */
  renderCSS () {
    this.css = /* css */`
      
    `
  }

  /**
  * renders the html
  *
  * @return {Promise<void>}
  */
  renderHTML () {
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
          path: `${this.importMetaUrl}../../../..//web-components-toolbox/src/es/components/atoms/button/Button.js?${Environment?.version || ''}`,
          name: 'a-button'
        },
        {
          // @ts-ignore
          path: `${this.importMetaUrl}../../../..//web-components-toolbox/src/es/components/atoms/menuIcon/MenuIcon.js?${Environment?.version || ''}`,
          name: 'a-menu-icon'
        },
        {
          // @ts-ignore
          path: `${this.importMetaUrl}../../../..//web-components-toolbox/src/es/components/molecules/dialog/Dialog.js?${Environment?.version || ''}`,
          name: 'm-dialog'
        },
        {
          // @ts-ignore
          path: `${this.importMetaUrl}../../../..//web-components-toolbox/src/es/components/organisms/grid/Grid.js?${Environment?.version || ''}`,
          name: 'o-grid'
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
      // this.html = /* html */`
      //   <m-dialog
      //     namespace="dialog-top-slide-in-"
      //     ${room.done
      //        ? ''
      //        : 'open=show-modal'
      //     }
      //   >
      //     <a-menu-icon id="close" class="open" namespace="menu-icon-close-" no-click></a-menu-icon>
      //     <o-grid auto-fill="calc(25% - 0.75em)" auto-fill-mobile="calc(50% - 0.5em)" gap="1em" padding="1em">
      //     <p>rooms</p>
      //     </o-grid>
      //   </m-dialog>
      // `
      document.title = await room
    })
  }
}
