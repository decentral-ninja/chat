// @ts-check
import { Intersection } from '../../../../../event-driven-web-components-prototypes/src/Intersection.js'
import { getHexColor } from '../../../../../Helpers.js'

/* global self */
/* global Environment */

/**
* @export
* @class P2pGraph
* @type {CustomElementConstructor}
*/
export default class P2pGraph extends Intersection() {
  constructor (options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, tabindex: 'no-tabindex', intersectionObserverInit: {}, ...options }, ...args)

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
    Promise.all(showPromises).then(() => (this.hidden = false))
    self.addEventListener('resize', this.resizeEventListener)
  }

  disconnectedCallback () {
    super.disconnectedCallback()
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
    return !this.div
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
      :host([has-height]:not([intersecting])) > * {
        display: none;
      }
      /* NOTE: svg size can not be controlled easily */
      :host > div, :host > div > svg {
        overflow: visible;
      }
      :host > div > svg text {
        color: var(--color);
        font-size: var(--font-size);
        font-family: var(--h-font-family, var(--font-family));
        user-select: none;
      }
      :host > div > svg g {
        cursor: pointer;
      }
      :host > div > svg .node.is-self > circle {
        filter: drop-shadow(0px 0px 0.5em var(--color-secondary));
      }
    `
    self.requestAnimationFrame(timeStamp => this.css = /* css */`
      :host(:not([has-height])) {
        min-height: ${Math.round(this.clientWidth / 1.89)}px;
      }
    `)
    return Promise.resolve()
  }

  /**
   * Render HTML
   * @returns Promise<void>
   */
  renderHTML () {
    this.doOnIntersection = () => {
      this.html = /* html */'<div></div>'
      this.html = this.customStyleHeight
      // @ts-ignore
      return this.loadDependency('P2PGraph', `${this.importMetaUrl}./p2p-graph.js?${Environment?.version || ''}`).then(P2PGraph => {
        /** @type {[string, import("../../../../../event-driven-web-components-yjs/src/es/controllers/Users.js").User][]} */
        const users = JSON.parse(this.template.content.textContent)
        // this.template.remove() // Note: Don't remove the template, since it could be needed (did trigger an error by quick room navigation)
        // https://github.com/feross/p2p-graph?tab=readme-ov-file
        const graph = new P2PGraph(this.div)
        const nodes = []
        const providersSelfId = 'Self-777-MySelf'
        if (this.hasAttribute('providers')) {
          nodes.push(providersSelfId)
          this.add(graph, this.svg, {
            id: providersSelfId,
            fixed: true,
            name: 'YOU'
          }).svgNode.classList.add('is-self')
        }
        users.forEach(([key, user]) => {
          if (nodes.includes(key)) return
          nodes.push(key)
          const graphUserObj = this.add(graph, this.svg, {
            id: key,
            fixed: false,
            name: user.nickname || key
          })
          graphUserObj.svgNode.addEventListener('click', event => this.dispatchEvent(new CustomEvent('p2p-graph-click', {
            detail: { graphUserObj, isActive: !!this.svg.querySelector('[style="opacity: 0.2;"]') },
            bubbles: true,
            cancelable: true,
            composed: true
          })))
          if (this.hasAttribute('providers')) {
            graph.connect(providersSelfId, key)
            return
          }
          graphUserObj.svgNode.classList.add(user.isSelf ? 'is-self' : 'other')
          // trigger click on node when the id is the same as the active attribute
          if (this.getAttribute('active') === graphUserObj.id) setTimeout(() => graphUserObj.svgNode.querySelector('circle')?.dispatchEvent(new CustomEvent('click', { bubbles: true, cancelable: true, composed: true })))
          // only show providers with mutually connected users
          const separator = this.getAttribute('separator') || '<>'
          for (const providerName in user[this.hasAttribute('connected-users') ? 'connectedUsers' : 'mutuallyConnectedUsers']) {
            const graphProviderObj = nodes.includes(providerName)
              ? null
              : this.add(graph, this.svg, {
                id: providerName,
                fixed: true,
                name: providerName.split(separator)[1] || providerName
              })
            if (graphProviderObj) {
              nodes.push(providerName)
              graphProviderObj.svgNode.classList.add('provider')
              graphProviderObj.svgNode.classList.add(providerName.split(separator)[0])
              graphProviderObj.svgNode.addEventListener('click', event => this.dispatchEvent(new CustomEvent('p2p-graph-click', {
                detail: { graphProviderObj, isActive: !!this.svg.querySelector('[style="opacity: 0.2;"]') },
                bubbles: true,
                cancelable: true,
                composed: true
              })))
            }
            graph.connect(providerName, key)
          }
        })
        if (!nodes.length || !users.length) {
          this.setAttribute('no-data', '')
          this.dispatchEvent(new CustomEvent('p2p-graph-no-data', {
            bubbles: true,
            cancelable: true,
            composed: true
          }))
          this.div.remove()
        }
        this.updateHeight()
        this.dispatchEvent(new CustomEvent('p2p-graph-load', {
          bubbles: true,
          cancelable: true,
          composed: true
        }))
        this.doOnIntersection = null
      })
    }
    if (this.hasAttribute('intersecting')) this.doOnIntersection()
  }

  /**
   * fetch dependency
   *
   * @returns {Promise<any>}
   */
  loadDependency (globalNamespace, url) {
    // make it global to self so that other components can know when it has been loaded
    return this[`_loadDependency${globalNamespace}`] || (this[`_loadDependency${globalNamespace}`] = new Promise((resolve, reject) => {
      if (typeof self[globalNamespace] === 'function') return resolve(self[globalNamespace])
      const script = document.createElement('script')
      script.setAttribute('id', globalNamespace)
      script.setAttribute('src', url)
      // @ts-ignore
      script.onload = () => typeof self[globalNamespace] === 'function'
        // @ts-ignore
        ? resolve(self[globalNamespace])
        : reject(new Error(`${globalNamespace} does not load into the global scope!`))
      document.head.appendChild(script)
    }))
  }

  /**
   * Find the corresponding node in the svg created
   *
   * @name add
   * @param {any} graph
   * @param {any} svg
   * @param {any} obj
   * @returns {any}
   */
  add (graph, svg, obj) {
    graph.add(obj)
    obj = { ...obj, ...graph.list().slice(-1)[0], svgNode: Array.from(svg.querySelectorAll('g')).slice(-1)[0] /* The following does not work until the graph stops moving, so we grab the last entry in the svg: // svg.querySelector(`[cx="${obj.x}"]`) */ }
    let circle
    if ((circle = obj.svgNode.querySelector('circle'))) {
      getHexColor(obj.id).then(hex => {
        const hexClass = `hex-${hex.substring(1)}`
        circle.classList.add(hexClass)
        this.css = /* css */`
        :host > div > svg .node > circle.${hexClass} {
          fill: ${hex} !important;
        }
      `
      })
    }
    return obj
  }

  // Due to performance issues, dialog open took around 1300ms (after this change ca. 350ms) on a chat with many users. This eliminated the recalculate style thanks to :host([has-height]:not([intersecting])) > li: display: none; for not intersecting user components but also keeps the height, to avoid weird scrolling effects.
  updateHeight (height, clear = false) {
    this.removeAttribute('has-height')
    this.customStyleHeight.textContent = ''
    if (!clear) self.requestAnimationFrame(timeStamp => {
      this.customStyleHeight.textContent = /* css */`
        :host {
          min-height: ${height || this.clientHeight}px;
        }
      `
      this.setAttribute('has-height', '')
    })
  }

  get div () {
    return this.root.querySelector('div')
  }

  get svg () {
    return this.div.querySelector('svg')
  }

  get template () {
    return this.root.querySelector('template')
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
