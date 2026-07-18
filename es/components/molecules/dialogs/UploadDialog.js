// @ts-check
import Dialog from '../../../../../web-components-toolbox/src/es/components/molecules/dialog/Dialog.js'

/* global self */
/* global Environment */
/* global FileReader */

/**
* @export
* @class Dialog
* https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
* @type {CustomElementConstructor}
*/
export default class UploadDialog extends Dialog {
  constructor (options = {}, ...args) {
    super({ ...options }, ...args)

    this.clickUploadEventListener = event => {
      
    }
  }

  connectedCallback () {
    if (this.shouldRenderCustomHTML()) this.renderCustomHTML()
    const result = super.connectedCallback()
    this.uploadButton.addEventListener('click', this.clickUploadEventListener)
    return result
  }

  disconnectedCallback () {
    super.disconnectedCallback()
    this.uploadButton.removeEventListener('click', this.clickUploadEventListener)
    this.close()
  }

  /**
     * evaluates if a render is necessary
     *
     * @return {boolean}
     */
  shouldRenderCustomHTML () {
    return !this.root.querySelector(this.cssSelector + ' > dialog')
  }

  /**
   * renders the css
   */
  renderCSS () {
    const result = super.renderCSS()
    this.setCss(/* css */`
      :host > dialog {
        --dialog-top-slide-in-a-text-decoration: underline;
        scrollbar-color: var(--color) var(--background-color);
        scrollbar-width: thin;
        transition: height 0.3s ease-out;
      }
      :host([uploading]) > dialog > #title-default, :host(:not([uploading])) > dialog > #title-uploading {
        display: none;
      }
      :host > dialog > section[buttons] {
        --button-primary-background-color-hover-custom: var(--color-yellow);
        --button-primary-background-color-custom: var(--color-green);
        --button-primary-border-color: var(--color-green);
        --button-secondary-color-hover-custom: var(--color-yellow);
        --button-secondary-border-color-hover-custom: var(--color-yellow);
        display: none;
        opacity: 0;
        transition: var(--transition);
        position: sticky;
        bottom: -1em;
        background: linear-gradient(180deg, transparent -70%, var(--background-color) 30%);
        margin-left: -1em;
        margin-right: -1em;
        padding: 1em;
        padding-top: 2em;
        gap: 1em;
        justify-content: flex-end;
      }
      :host([checkbox]) > dialog > section[buttons] {
        display: flex;
        opacity: 1;
      }
      @media only screen and (max-width: _max-width_) {
        
      }
    `, undefined, false)
    return result
  }

  /**
   * Render HTML
   * @returns Promise<void>
   */
  renderCustomHTML () {
    this.html = /* html */`
      <dialog>
        <wct-menu-icon id="close" no-aria class="open sticky" namespace="menu-icon-close-" no-click background style="--outline-style-focus-visible: none;"></wct-menu-icon>
        <h4 id=title-default>Upload:</h4>
        <h4 id=title-uploading>Uploading:</h4>
        <section controls>
          
        </section>
        <section buttons>
          <wct-button id=upload title="upload" namespace="button-primary-" click-no-toggle-active>upload</wct-button>
        </section>
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
        path: `${this.importMetaUrl}../loadTemplateTag/LoadTemplateTag.js?${Environment?.version || ''}`,
        name: 'wct-load-template-tag'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../atoms/iconMdx/IconMdx.js?${Environment?.version || ''}`,
        name: 'wct-icon-mdx'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../../../components/atoms/iconStates/IconStates.js?${Environment?.version || ''}`,
        name: 'a-icon-states'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../../../components/atoms/iconCombinations/IconCombinations.js?${Environment?.version || ''}`,
        name: 'a-icon-combinations'
      }
    ])
  }

  get uploadButton () {
    return this.root.querySelector('#add-key')
  }

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }
}
