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

    this.trashIconClickEventListener = event => {
      const value = this.trashIcon.getAttribute('state') === 'undo' ? 'default' : 'undo'
      this.trashIcon.setAttribute('state', value)
      if (value === 'undo') {
        this.setAttribute('deleted', '')
      } else {
        this.removeAttribute('deleted')
      }
    }

    this.inputEventListener = event => {
      if (this.checkbox.checked) {
        this.setAttribute('checked', '')
      } else {
        this.removeAttribute('checked')
      }
      this.dispatchEvent(new CustomEvent('key-checked', {
        detail: {
          checked: this.checkbox.checked
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))
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
      this.update(this.keyContainer, this.order, true, false)
      this.updateHeight()
      this.hidden = false
    })
    this.trashIcon.addEventListener('click', this.trashIconClickEventListener)
    this.checkbox.addEventListener('input', this.inputEventListener)
    self.addEventListener('resize', this.resizeEventListener)
  }

  disconnectedCallback () {
    super.disconnectedCallback()
    this.trashIcon.removeEventListener('click', this.trashIconClickEventListener)
    this.checkbox.removeEventListener('input', this.inputEventListener)
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
        --details-default-content-spacing-custom: 0;
        --details-default-text-align: left;
        --details-default-any-display: inline;
        display: block;
      }
      :host([deleted]) {
        text-decoration: line-through;
      }
      :host([has-height]:not([intersecting])) > section#grid {
        display: none;
      }
      :host > section {
        border: var(--wct-input-border, 1px solid var(--color-black));
        background-color: var(--card-background-color, transparent);
        border-radius: var(--border-radius);
        box-shadow: var(--box-shadow-length-one) var(--box-shadow-color), var(--box-shadow-length-two) var(--box-shadow-color);
        transition: var(--transition);
      }
      :host > section > * {
        min-width: 0;
      }
      :host .hidden {
        display: none;
      }
      :host a-icon-states#trash-icon {
        --color: var(--color-error);
        --color-hover: var(--color-yellow);
      }
      :host > section:has(input:checked), :host(.active) > section {
        border-width: 0.5em;
        box-shadow: inset var(--box-shadow-length-one) var(--box-shadow-color), inset var(--box-shadow-length-two) var(--box-shadow-color);;
      }
      /* https://weedshaker.github.io/cssGridLayout/ */
      #grid {
        display: grid;
        grid-template-areas:
          "keyIcons keyIcons"
          "title title"
          "body body";
        grid-template-rows: auto auto 1fr;
        padding: var(--card-padding, 0.75em);
        align-items: start;
        gap: var(--grid-gap, 0.5em);
        height: 100%;
      }
      #grid > [style="grid-area: keyIcons"] {
        display: flex;
        gap: 1em;
        justify-content: end;
        align-items: center;
      }
      #grid > [style="grid-area: keyIcons"] > label {
        flex-grow: 1;
        cursor: pointer;
      }
      #grid > [style="grid-area: keyIcons"] > input {
        height: 2em;
        width: 2em;
        cursor: pointer;
      }
      :host([deleted]) #grid > [style="grid-area: keyIcons"] > input,
      :host(.no-checkbox:not([checked])) #grid > [style="grid-area: keyIcons"] > input,
      #grid > [style="grid-area: keyIcons"] > input:checked + #trash-icon {
        display: none;
      }
      :host([deleted]) #grid > [style="grid-area: keyIcons"] > label,
      :host(.no-checkbox:not([checked])) #grid > [style="grid-area: keyIcons"] > label {
        pointer-events: none;
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
      #grid > [style="grid-area: body"] {
        align-self: end;
      }
      #grid > [style="grid-area: body"] > p {
        --p-margin: 0 auto;
        text-decoration: underline;
      }
      @media only screen and (max-width: _max-width_) {
        #grid {
          grid-template-areas:
            "keyIcons keyIcons"
            "title title"
            "body body";
          }
      }
    `
    getHexColor(this.keyContainer.key.epoch).then(hex => {
      this.css = /* css */`
        :host > section {
          border-color: ${hex};
        }
        :host a-icon-states#key-icon {
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
    // summary details style
    const style = /* html */`
      <style protected=true>
        :host > details > summary + div > div {
          align-items: center;
          display: flex;
          gap: 0.5em;
          justify-content: space-between;
        }
        :host > details > summary + div > div > * {
          width: 33%;
        }
        @media only screen and (max-width: 350px) {
          :host > details > summary + div > div {
            flex-wrap: wrap;
          }
        }
      </style>
    `
    // keep-alive max=10days, value=1day, step=1h
    this.html = /* html */`
      <section id=grid>
        <div style="grid-area: keyIcons">
          <label for="checkbox" title="select this key">
            <a-icon-states id=key-icon>
              <template>
                <wct-icon-mdx state="default" title="Key" icon-url="../../../../../../img/icons/key-square.svg" size="2em" no-hover></wct-icon-mdx>
                <a-icon-combinations state="derived" namespace=icon-combinations-double-keys- title=keypair>
                  <template>
                    <wct-icon-mdx title="Private key" icon-url="../../../../../../img/icons/key-filled.svg" size="2em" no-hover></wct-icon-mdx>
                    <wct-icon-mdx title="Public key" icon-url="../../../../../../img/icons/key-filled.svg" size="2em" no-hover></wct-icon-mdx>
                  </template>
                </a-icon-combinations>
              </template>
            </a-icon-states>
          </label>
          <input type="checkbox" id="checkbox" name="checkbox" title="select this key">
          <a-icon-states id=trash-icon>
            <template>
              <wct-icon-mdx state="default" title="delete" delete icon-url="../../../../../../img/icons/trash.svg" size="2em"></wct-icon-mdx>
              <wct-icon-mdx state="undo" title="undo" undo icon-url="../../../../../../img/icons/trash-off.svg" size="2em"></wct-icon-mdx>
            </template>
          </a-icon-states>
        </div>
        <div style="grid-area: title">
          <div><span class=name><span>Public name:</span><span class=font-size-tiny>(shared)</span></span>&nbsp;<chat-a-key-name public name="${escapeHTML(this.keyContainer.public.name)}" epoch='${this.keyContainer.key.epoch}'${this.keyContainer.private.origin.self ? '  is-editable' : ''}></chat-a-key-name></div>
          <div><span class=name><span>Private name:</span><span class=font-size-tiny>(saved locally and not shared)</span></span>&nbsp;<chat-a-key-name private name="${escapeHTML(this.keyContainer.private.name)}" epoch='${this.keyContainer.key.epoch}' is-editable></chat-a-key-name></div>
        </div>
        <div style="grid-area: body">
          <wct-details id=origin namespace="details-default-" open-event-name='key-details-open-${this.getAttribute('epoch')}'>
            ${style}
            <details>
              <summary>
                <h4>Origin:</h4>
              </summary>
              <template>
                <div>
                  <div>
                    <chat-a-room-name>
                      <template>${JSON.stringify({roomName: this.keyContainer.private.origin.room})}</template>
                    </chat-a-room-name> - 
                    <chat-a-nick-name ${this.keyContainer.private.origin.uid ? `uid='${this.keyContainer.private.origin.uid}'` : ''}${this.keyContainer.private.origin.nickname ? ` nickname='${escapeHTML(this.keyContainer.private.origin.nickname)}'` : ''}${this.keyContainer.private.origin.self ? ' self user-dialog-show-event-only-on-avatar' : ' user-dialog-show-event'}></chat-a-nick-name> - 
                    <span>${this.keyContainer.private.origin.self ? 'self made' : 'received'}:<br><time class="timestamp">${(new Date(this.keyContainer.private.origin.timestamp)).toLocaleString(navigator.language)}</time></span>
                  </div>
                </div>
              </template>
            </details>
          </wct-details>
          <wct-details id=shared class="hidden" namespace="details-default-" open-event-name='key-details-open-${this.getAttribute('epoch')}'>
            ${style}
            <details>
              <summary>
                <h4>Shared:</h4>
              </summary>
              <template>
                <div></div>
              </template>
            </details>
          </wct-details>
          <wct-details id=received class="hidden" namespace="details-default-" open-event-name='key-details-open-${this.getAttribute('epoch')}'>
            ${style}
            <details>
              <summary>
                <h4>Received:</h4>
              </summary>
              <template>
                <div></div>
              </template>
            </details>
          </wct-details>
          <wct-details id=encrypted class="hidden" namespace="details-default-" open-event-name='key-details-open-${this.getAttribute('epoch')}'>
            ${style}
            <details>
              <summary>
                <h4>Encrypted:</h4>
              </summary>
              <template>
                <div></div>
              </template>
            </details>
          </wct-details>
          <wct-details id=decrypted class="hidden" namespace="details-default-" open-event-name='key-details-open-${this.getAttribute('epoch')}'>
            ${style}
            <details>
              <summary>
                <h4>Decrypted:</h4>
              </summary>
              <template>
                <div></div>
              </template>
            </details>
          </wct-details>
          <p><wct-icon-mdx size="1em" no-hover title="generate" icon-url="../../../../../../img/icons/fold-down.svg"></wct-icon-mdx>JSONWEBKEY<wct-icon-mdx size="1em" no-hover title="generate" icon-url="../../../../../../img/icons/fold-down.svg"></wct-icon-mdx></p>
          <chat-a-glide-to-reveal>
            <template>${JSON.stringify(this.keyContainer.key.jsonWebKey)}</template>
          </chat-a-glide-to-reveal>
        </div>
      </section>
    `
    this.html = this.customStyle
    this.html = this.customStyleHeight
    return this.fetchModules([
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/atoms/iconMdx/IconMdx.js?${Environment?.version || ''}`,
        name: 'wct-icon-mdx'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../../../web-components-toolbox/src/es/components/molecules/details/Details.js?${Environment?.version || ''}`,
        name: 'wct-details'
      },
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
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../atoms/glideToReveal/GlideToReveal.js?${Environment?.version || ''}`,
        name: 'chat-a-glide-to-reveal'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../atoms/nickName/NickName.js?${Environment?.version || ''}`,
        name: 'chat-a-nick-name'
      },
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../atoms/roomName/RoomName.js?${Environment?.version || ''}`,
        name: 'chat-a-room-name'
      }
    ])
  }

  /**
   * Update components
   * @param {import('../../../../event-driven-web-components-yjs/src/es/controllers/Keys.js').KEY_CONTAINER} keyContainer
   * @param {number} order
   * @param {boolean} [updateOrder=false]
   * @param {boolean} [updateNameEls=true]
   * @returns {void}
   */
  update (keyContainer, order, updateOrder = false, updateNameEls = true) {
    this.keyContainer = keyContainer
    this.order = order
    if (updateOrder) this.customStyle.textContent = /* css */`
      :host {
        order: ${order};
      }
    `
    this.doOnIntersection = () => {
      if (updateNameEls) {
        this.privateNameEl.setAttribute('name', keyContainer.private.name || '')
        this.privateNameEl.setAttribute('epoch', keyContainer.key.epoch || '')
        this.publicNameEl.setAttribute('name', keyContainer.public.name || '')
        this.publicNameEl.setAttribute('epoch', keyContainer.key.epoch || '')
      }
      const renderDetails = (arr, label) => /* html */`<div>${arr.reduce((acc, curr) => /* html */`
        ${acc}
        <div>
          <chat-a-room-name>
            <template>${JSON.stringify({roomName: curr.room})}</template>
          </chat-a-room-name> - 
          <chat-a-nick-name ${curr.uid ? `uid='${curr.uid}'` : ''}${curr.nickname ? ` nickname='${escapeHTML(curr.nickname)}'` : ''}${curr.self ? ' self user-dialog-show-event-only-on-avatar' : ' user-dialog-show-event'}></chat-a-nick-name> - 
          <span>${label}:<br><time class="timestamp">${(new Date(curr.timestamp)).toLocaleString(navigator.language)}</time></span>
        </div>
      `, '')}</div>`
      // shared
      if (keyContainer.private.shared?.length) {
        this.sharedEl.classList.remove('hidden')
        const innerHTML = renderDetails(keyContainer.private.shared, 'sent')
        if (this.lastSharedElInnerHTML !== innerHTML) this.sharedEl.content.innerHTML = this.lastSharedElInnerHTML = innerHTML
      } else {
        this.sharedEl.classList.add('hidden')
        this.sharedEl.content.innerHTML = this.lastSharedElInnerHTML = 'none'
      }
      // received
      if (keyContainer.private.received?.length) {
        this.receivedEl.classList.remove('hidden')
        const innerHTML = renderDetails(keyContainer.private.received, 'received')
        if (this.lastReceivedElInnerHTML !== innerHTML) this.receivedEl.content.innerHTML = this.lastReceivedElInnerHTML = innerHTML
      } else {
        this.receivedEl.classList.add('hidden')
        this.receivedEl.content.innerHTML = this.lastReceivedElInnerHTML = 'none'
      }
      // encrypted
      if (keyContainer.private.encrypted?.length) {
        this.encryptedEl.classList.remove('hidden')
        const innerHTML = renderDetails(keyContainer.private.encrypted, 'encrypted')
        if (this.lastEncryptedElInnerHTML !== innerHTML) this.encryptedEl.content.innerHTML = this.lastEncryptedElInnerHTML = innerHTML
      } else {
        this.encryptedEl.classList.add('hidden')
        this.encryptedEl.content.innerHTML = this.lastEncryptedElInnerHTML = 'none'
      }
      // decrypted
      if (keyContainer.private.decrypted?.length) {
        this.decryptedEl.classList.remove('hidden')
        const innerHTML = renderDetails(keyContainer.private.decrypted, 'decrypted')
        if (this.lastDecryptedElInnerHTML !== innerHTML) this.decryptedEl.content.innerHTML = this.lastDecryptedElInnerHTML = innerHTML
      } else {
        this.decryptedEl.classList.add('hidden')
        this.decryptedEl.content.innerHTML = this.lastDecryptedElInnerHTML = 'none'
      }
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

  get privateNameEl () {
    return this.section.querySelector('chat-a-key-name[private]')
  }

  get publicNameEl () {
    return this.section.querySelector('chat-a-key-name[public]')
  }

  get sharedEl () {
    return this.section.querySelector('#shared')
  }

  get receivedEl () {
    return this.section.querySelector('#received')
  }

  get encryptedEl () {
    return this.section.querySelector('#encrypted')
  }

  get decryptedEl () {
    return this.section.querySelector('#decrypted')
  }

  get checkbox () {
    return this.section.querySelector('#checkbox')
  }

  get trashIcon () {
    return this.section.querySelector('#trash-icon')
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
