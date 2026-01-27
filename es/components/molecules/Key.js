// @ts-check
import { getHexColor } from '../../../../Helpers.js'
import { Intersection } from '../../../../event-driven-web-components-prototypes/src/Intersection.js'
import { escapeHTML } from '../../../../event-driven-web-components-prototypes/src/helpers/Helpers.js'

/* global Environment */

/**
* @export
* @class Key
* @type {CustomElementConstructor}
*/
export default class Key extends Intersection() {
  constructor (epoch, keyContainer, order, options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, tabindex: 'no-tabindex', intersectionObserverInit: {}, ...options }, ...args)

    if (this.template) {
      ({ epoch: this.epoch, keyContainer: this.keyContainer, order: this.order } = JSON.parse(this.template.content.textContent))
    } else {
      this.epoch = epoch
      /** @type {import('../../../../event-driven-web-components-yjs/src/es/controllers/Keys.js').KEY_CONTAINER} */
      this.keyContainer = keyContainer
      this.order = order
    }
    this.setAttribute('epoch', this.epoch)

    this.iconShareClickEventListener = event => {
      console.log('*********', 'share')
      // TODO: Custom Key share dialog
      // this.fetchModules([{
      //   // @ts-ignore
      //   path: `${this.importMetaUrl}../molecules/dialogs/ShareDialog.js?${Environment?.version || ''}`,
      //   name: 'chat-m-share-dialog'
      // }]).then(async () => {
      //   const urlHrefObj = this.getUrlHrefObj()
      //   const shareValue = `${urlHrefObj?.name || this.selectName.value}${separator}${urlHrefObj?.url.origin || Array.from(this.keyContainer.urls.keys())[0]}`
      //   if (this.shareDialog) {
      //     this.shareDialog.setAttribute('href', shareValue)
      //     this.shareDialog.setAttribute('href-title', `key - ${shareValue}`)
      //     // @ts-ignore
      //     this.shareDialog.show('show-modal')
      //   } else {
      //     const div = document.createElement('div')
      //     div.innerHTML = /* html */`
      //       <chat-m-share-dialog
      //         namespace="dialog-top-slide-in-"
      //         open="show-modal"
      //         href="${shareValue}"
      //         href-title="key - ${shareValue}"
      //         chat-add-type="share-key"
      //         chat-add-id="${this.getAttribute('id')}"
      //         no-navigator-share
      //       ></chat-m-share-dialog>
      //     `
      //     this.shareDialog = div.children[0]
      //     this.root.appendChild(div.children[0])
      //   }
      // })
    }

    // this updates the min-height on resize, see updateHeight function for more info
    let resizeTimeout = null
    this.resizeEventListener = event => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(async () => this.updateHeight(), 200)
    }
  }

  connectedCallback () {
    super.connectedCallback()
    this.hidden = true
    const showPromises = []
    if (this.shouldRenderCSS()) showPromises.push(this.renderCSS())
    if (this.shouldRenderHTML()) showPromises.push(this.renderHTML())
    Promise.all(showPromises).then(() => {
      this.updateHeight()
      this.hidden = false
    })
    this.iconShare.addEventListener('click', this.iconShareClickEventListener)
    self.addEventListener('resize', this.resizeEventListener)
  }

  disconnectedCallback () {
    super.disconnectedCallback()
    this.iconShare.removeEventListener('click', this.iconShareClickEventListener)
    self.removeEventListener('resize', this.resizeEventListener)
  }

  intersectionCallback (entries, observer) {
    if (this.areEntriesIntersecting(entries)) {
      this.setAttribute('intersecting', '')
      if (this.doOnIntersection) this.doOnIntersection()
      return
    }
    this.removeAttribute('intersecting')
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
      :host {
        display: block;
      }
      :host([has-height]:not([intersecting])) > section#grid {
        display: none;
      }
      :host > section {
        border: var(--wct-input-border, 1px solid var(--color-black));
        border-radius: var(--border-radius);
        box-shadow: var(--box-shadow-length-one) var(--box-shadow-color), var(--box-shadow-length-two) var(--box-shadow-color);
        min-height: var(--chat-m-key-min-height, 5em); /* wct-load-template-tag requirement */
      }
      :host > section > * {
        min-width: 0;
      }
      /* https://weedshaker.github.io/cssGridLayout/ */
      #grid {
        display: grid;
        grid-template-areas:
          "keyIcons keyIcons"
          "title title";
        padding: var(--card-padding, 0.75em);
        align-items: center;
        gap: var(--grid-gap, 0.5em);
        height: 100%;
      }
      #grid > [style="grid-area: title"] > div {
        align-items: flex-start;
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
      }
      #grid > [style="grid-area: title"] > div > span.name {
        display: flex;
        flex-direction: column;
      }
      #grid > [style="grid-area: title"] > div span.font-size-tiny {
        white-space: nowrap;
      }
      @media only screen and (max-width: _max-width_) {
        #grid {
          grid-template-areas:
            "keyIcons keyIcons"
            "title title";
          }
      }
    `
    getHexColor(this.keyContainer.key.epoch).then(hex => {
      this.css = /* css */`
        :host > section {
          border-color: ${hex};
        }
        :host a-icon-states {
          --color: ${hex};
          --color-hover: ${hex}70;
        }
      `
    })
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
    ], false)
  }

  /**
   * Render HTML
   * @returns Promise<void>
   */
  renderHTML () {
    // keep-alive max=10days, value=1day, step=1h
    this.html = /* html */`
      <section id=grid>
        <div style="grid-area: keyIcons">
          <div id=share></div>
          <a-icon-states>
            <template>
              <wct-icon-mdx state="default" title="Key" icon-url="../../../../../../img/icons/key-square.svg" size="2em" hover-selector=section#grid></wct-icon-mdx>
              <a-icon-combinations state="derived" keys title=keypair>
                <template>
                  <wct-icon-mdx title="Private key" icon-url="../../../../../../img/icons/key-filled.svg" size="2em" hover-selector=section#grid></wct-icon-mdx>
                  <wct-icon-mdx title="Public key" icon-url="../../../../../../img/icons/key-filled.svg" size="2em" hover-selector=section#grid></wct-icon-mdx>
                </template>
              </a-icon-combinations>
            </template>
          </a-icon-states>
        </div>
        <div style="grid-area: title">
          <div><span class=name><span>Public name:</span><span class=font-size-tiny>(shared)</span></span>&nbsp;<chat-a-key-name public name="${escapeHTML(this.keyContainer.public.name)}" epoch='${this.keyContainer.key.epoch}'${this.keyContainer.private.origin.self ? '  is-editable' : ''}></chat-a-key-name></div>
          <div><span class=name><span>Private name:</span><span class=font-size-tiny>(saved locally and not shared)</span></span>&nbsp;<chat-a-key-name private name="${escapeHTML(this.keyContainer.private.name)}" epoch='${this.keyContainer.key.epoch}' is-editable></chat-a-key-name></div>
        </div>
      </section>
    `
    this.html = this.customStyle
    this.html = this.customStyleHeight
    this.update(this.keyContainer, this.order, true)
    return this.fetchModules([
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../components/atoms/iconStates/IconStates.js?${Environment?.version || ''}`,
        name: 'a-icon-states'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../components/atoms/iconCombinations/IconCombinations.js?${Environment?.version || ''}`,
        name: 'a-icon-combinations'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../atoms/keyName/KeyName.js?${Environment?.version || ''}`,
        name: 'chat-a-key-name'
      }
    ])
  }

  /**
   * Update components
   * @param {import('../../../../event-driven-web-components-yjs/src/es/controllers/Keys.js').KEY_CONTAINER} keyContainer
   * @param {number} order
   * @param {boolean} [updateOrder=false]
   * @returns {void}
   */
  update (keyContainer, order, updateOrder = false) {
    this.keyContainer = keyContainer
    this.order = order
    if (updateOrder) this.customStyle.textContent = /* css */`
      :host {
        order: ${order};
      }
    `
    this.doOnIntersection = () => {
      this.privateNameEl.setAttribute('name', keyContainer.private.name)
      this.privateNameEl.setAttribute('epoch', keyContainer.key.epoch)
      this.publicNameEl.setAttribute('name', keyContainer.public.name)
      this.publicNameEl.setAttribute('epoch', keyContainer.key.epoch)
      this.updateHeight()
      this.doOnIntersection = null
    }
    if (this.hasAttribute('intersecting')) this.doOnIntersection()
  }

  // Due to performance issues, dialog open took around 1300ms (after this change ca. 350ms) on a chat with many users. This eliminated the recalculate style thanks to :host([has-height]:not([intersecting])) > li: display: none; for not intersecting user components but also keeps the height, to avoid weird scrolling effects.
  updateHeight (clear = false) {
    clearTimeout(this._timeoutUpdateHeight)
    this._timeoutUpdateHeight = setTimeout(() => {
      this.removeAttribute('has-height')
      this.customStyleHeight.textContent = ''
      if (!clear) self.requestAnimationFrame(timeStamp => {
        this.customStyleHeight.textContent = /* css */`
          :host {
            min-height: ${this.clientHeight}px;
          }
        `
        this.setAttribute('has-height', '')
      })
    }, clear ? 0 : 350)
  }

  get iconShare () {
    return this.root.querySelector('#share')
  }

  get privateNameEl () {
    return this.section.querySelector('chat-a-key-name[private]')
  }

  get publicNameEl () {
    return this.section.querySelector('chat-a-key-name[public]')
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

  get customStyleHeight () {
    return (
      this._customStyleHeight ||
        (this._customStyleHeight = (() => {
          const style = document.createElement('style')
          style.setAttribute('protected', 'true')
          return style
        })())
    )
  }
}
