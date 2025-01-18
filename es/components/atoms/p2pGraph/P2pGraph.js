// @ts-check
import { Shadow } from '../../../../../web-components-toolbox/src/es/components/prototypes/Shadow.js'

/**
* @export
* @class P2pGraph
* @type {CustomElementConstructor}
*/
export default class P2pGraph extends Shadow() {
  constructor (options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, ...options }, ...args)
  }

  connectedCallback () {
    this.hidden = true
    const showPromises = []
    if (this.shouldRenderCSS()) showPromises.push(this.renderCSS())
    if (this.shouldRenderHTML()) showPromises.push(this.renderHTML())
    Promise.all(showPromises).then(() => (this.hidden = false))
  }

  disconnectedCallback () {}

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
      :host > div, :host > div > svg {
        overflow: visible;
      }
      :host > div > svg text {
        color: var(--color);
        font-size: var(--font-size);
        font-family: var(--font-family);
      }
      :host > div > svg .is-self text {
        color: var(--color-user-self);
      }
      :host > div > svg .is-self > circle {
        fill: var(--color-user-self) !important;
      }
      :host > div > svg .other > circle {
        fill: var(--color-user) !important;
      }
      :host > div > svg .provider > circle {
        fill: var(--color-provider) !important;
      }
    `
    return Promise.resolve()
  }

  /**
   * Render HTML
   * @returns Promise<void>
   */
  renderHTML () {
    this.html = /* html */`<div></div>`
    return this.loadDependency('P2PGraph', `${this.importMetaUrl}./p2p-graph.js`).then(P2PGraph => {
      /** @type {[string, import("../../../../../event-driven-web-components-yjs/src/es/controllers/Users.js").User][]} */
      const users = JSON.parse(this.template.content.textContent)
      this.template.remove()
      // https://github.com/feross/p2p-graph?tab=readme-ov-file
      var graph = new P2PGraph(this.div)
      const nodes = []
      users.forEach(([key, user]) => {
        if (nodes.includes(key)) return
        nodes.push(key)
        const graphUserObj = P2pGraph.add(graph, this.svg, {
          id: key,
          fixed: false,
          name: user.nickname
        })        
        graphUserObj.svgNode.classList.add(user.isSelf ? 'is-self': 'other')
        graphUserObj.svgNode.addEventListener('click', event => this.dispatchEvent(new CustomEvent('p2p-graph-click', {
          detail: { graphUserObj },
          bubbles: true,
          cancelable: true,
          composed: true
        })))
        // trigger click on node when the id is the same as the active attribute
        if (this.getAttribute('active') === graphUserObj.id) setTimeout(() => graphUserObj.svgNode.querySelector('circle')?.dispatchEvent(new CustomEvent('click', { bubbles: true, cancelable: true, composed: true })))
        // only show providers with mutually connected users
        for (const providerName in user.mutuallyConnectedUsers) {
          const graphProviderObj = nodes.includes(providerName)
            ? null
            : P2pGraph.add(graph, this.svg, {
              id: providerName,
              fixed: true,
              name: providerName
            })
          if (graphProviderObj) {
            nodes.push(providerName)
            graphProviderObj.svgNode.classList.add('provider')
            graphProviderObj.svgNode.classList.add(providerName.split(this.getAttribute('separator'))[0])
          }
          graph.connect(providerName, key)
        }
      })
      if (!nodes.length) {
        this.setAttribute('no-data', '')
        this.dispatchEvent(new CustomEvent('p2p-graph-no-data', {
          bubbles: true,
          cancelable: true,
          composed: true
        }))
        this.div.remove()
      }
    })
  }

  /**
   * fetch dependency
   *
   * @returns {Promise<any>}
   */
  loadDependency (globalNamespace, url) {
    // make it global to self so that other components can know when it has been loaded
    return this[`_loadDependency${globalNamespace}`] || (this[`_loadDependency${globalNamespace}`] = new Promise((resolve, reject) => {
      // @ts-ignore
      if (document.head.querySelector(`#${globalNamespace}`) || self[globalNamespace]) return resolve(self[globalNamespace])
      const script = document.createElement('script')
      script.setAttribute('id', globalNamespace)
      script.setAttribute('src', url)
      // @ts-ignore
      script.onload = () => self[globalNamespace]
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
   * @static
   * @param {any} graph
   * @param {any} svg
   * @param {any} obj
   * @returns {any}
   */
  static add (graph, svg, obj) {
    graph.add(obj)
    obj = {...obj, ...graph.list().slice(-1)[0], svgNode: Array.from(svg.querySelectorAll('g')).slice(-1)[0] /* The following does not work until the graph stops moving, so we grab the last entry in the svg: // svg.querySelector(`[cx="${obj.x}"]`) */}
    return obj
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
}
