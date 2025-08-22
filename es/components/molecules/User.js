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
  constructor (id, name, data, order, options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, ...options }, ...args)

    if (this.template) {
      ({ id: this.id, name: this.name, data: this.data, order: this.order } = JSON.parse(this.template.content.textContent, jsonParseMapUrlReviver))
    } else {
      this.id = id
      this.name = name
      /** @type {import('../../../../event-driven-web-components-yjs/src/es/controllers/Users.js').User} */
      this.data = data
      this.order = order
    }
    this.setAttribute('id', this.id)
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
    return !this.section
  }

  /**
   * renders the css
   * @returns Promise<void>
   */
  renderCSS () {
    this.css = /* css */`
      :host > section {
        border: var(--wct-input-border, 1px solid var(--color-black));
        border-radius: var(--border-radius);
        box-shadow: var(--box-shadow-length-one) var(--box-shadow-color), var(--box-shadow-length-two) var(--box-shadow-color);
        min-height: var(--chat-m-user-min-height, 5em); /* wct-load-template-tag requirement */
      }
      /* https://weedshaker.github.io/cssGridLayout/ */
      #grid {
        display: grid;
        grid-template-areas:
          "connectionStateIcon title title title title notification"
          "url url url url url url"
          "keep-alive keep-alive keep-alive keep-alive keep-alive keep-alive"
          "set-btn set-btn undo-btn undo-btn connect-btn connect-btn";
        grid-template-columns: repeat(6, 1fr);
        padding: var(--card-padding, 0.75em);
        align-items: center;
        gap: var(--grid-gap, 0.5em);
      }
      @media only screen and (max-width: _max-width_) {
        #grid {
          grid-template-areas:
            "connectionStateIcon connectionStateIcon connectionStateIcon notification notification notification"
            "title title title title title title"
            "url url url url url url"
            "keep-alive keep-alive keep-alive keep-alive keep-alive keep-alive"
            "set-btn set-btn set-btn undo-btn undo-btn undo-btn"
            "connect-btn connect-btn connect-btn connect-btn connect-btn connect-btn";
        }
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
      <section id=grid>
        <h2 style="grid-area: title">Title</h2>
      </section>
    `
    this.html = this.customStyle
    this.inputKeepAliveChangeEventListener({ target: { value: this.inputKeepAlive.value } }, true)
    this.update(this.data, this.order, true)
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
   * @param {import('../../../../event-driven-web-components-yjs/src/es/controllers/Users.js').User} data
   * @param {number} order
   * @param {boolean} [updateOrder=false]
   * @returns {void}
   */
  update (data, order, updateOrder = false) {
    this.data = data
    this.order = order
    if (updateOrder) this.customStyle.innerText = /* css */`
      :host {
        order: ${order};
      }
    `
    
  }

  get titleEl () {
    return this.root.querySelector('h2')
  }

  get section () {
    return this.root.querySelector('section')
  }

  get template () {
    return this.root.querySelector('template')
  }

  get customStyle () {
    return (
      this._customStyle ||
        (this._customStyle = (() => {
          const style = document.createElement('style')
          style.setAttribute('protected', 'true')
          return style
        })())
    )
  }
}
