// @ts-check
import Dialog from '../../../../../web-components-toolbox/src/es/components/molecules/dialog/Dialog.js'

/**
* @export
* @class Dialog
* In Progress

<chat-m-jitsi-dialog
        namespace="dialog-top-slide-in-"
        show-event-name="jitsi-dialog-show-event"
        closed-event-name="jitsi-dialog-closed-event"
      ></chat-m-jitsi-dialog>

* https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
* @type {CustomElementConstructor}
*/
export default class JitsiDialog extends Dialog {
  connectedCallback () {
    if (this.shouldRenderCustomHTML()) this.renderCustomHTML()
    super.connectedCallback()
  }

  /**
     * evaluates if a render is necessary
     *
     * @return {boolean}
     */
  shouldRenderCustomHTML() {
    return !this.root.querySelector(this.cssSelector + ' > dialog')
  }

  /**
   * renders the css
   */
  renderCSS() {
    const result = super.renderCSS()
    this.setCss(/* css */`
      :host > dialog {
        scrollbar-color: var(--color) var(--background-color);
        scrollbar-width: thin;
      }
    `, undefined, false)
    return result
  }

  /**
   * Render HTML
   * @returns Promise<void>
   */
  renderCustomHTML() {
    const roomName = 'unknown'
    this.html = /* html */`
      <wct-menu-icon id="close" class="open" namespace="menu-icon-close-" no-click></wct-menu-icon>
      <dialog>
        <h4>video call:</h4>
        <wct-iframe>
          <template>
            <iframe width="${self.innerWidth}" height="${self.innerHeight}" src="https://jitsi.mgrs.dev/${roomName}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen; allow-top-navigation; screen-wake-lock; microphone; camera"></iframe>
          </template>
        </wct-iframe>
      </dialog>
    `
    return this.fetchModules([
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../atoms/menuIcon/MenuIcon.js?${Environment?.version || ''}`,
        name: 'wct-menu-icon'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../atoms/iframe/Iframe.js?${Environment?.version || ''}`,
        name: 'wct-iframe'
      }
    ])
  }
}
