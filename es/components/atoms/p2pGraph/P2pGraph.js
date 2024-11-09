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
        width: 80dvw;
        height: 100%;
      }
      :host > div {
        width: 100dvw;
      }
      :host > div > svg {
        margin: 10dvw;
      }
      @media only screen and (max-width: _max-width_) {
        :host {}
      }
    `
    return Promise.resolve()
  }

  /**
   * Render HTML
   * @returns Promise<void>
   */
  renderHTML () {
    this.html = /* html */`
      <div>Content rendered from Component: P2pGraph</div>
    `
    return this.loadDependency('P2PGraph', `${this.importMetaUrl}./p2p-graph.js`).then(P2PGraph => {
      /** @type {[string, import("../../../../../event-driven-web-components-yjs/src/es/controllers/Users.js").User][]} */
      const users = JSON.parse(this.template.content.textContent)
      this.template.remove()
      // https://github.com/feross/p2p-graph?tab=readme-ov-file
      var graph = new P2PGraph(this.div)

      //console.log('*********', users)

      const nodes = []
      // @ts-ignore
      users.forEach(([key, user]) => {
        // sessionStorage timestamp
        const epoch = JSON.parse(user.epoch).epoch
        //console.log('epoch *********', user.nickname, epoch, (Date.now() - epoch) / 1000 / 60 /60 + ' hours')
        const awarenessEpoch = JSON.parse(user.awarenessEpoch || user.epoch).epoch
        //console.log('awarenessEpoch *********', user.nickname, awarenessEpoch, (Date.now() - awarenessEpoch) / 1000 / 60 / 60 + ' hours')
        //console.log('*********************************************************')
        if (!nodes.includes(key)) graph.add({
          id: key,
          me: false,
          fixed: false,
          name: String(user.nickname)
        })
        if (user.isSelf) graph.seed(key, true)
        nodes.push(key)
        // only show providers with mutually connected users
        for (const providerName in user.mutuallyConnectedUsers) {
          if (!nodes.includes(providerName)) graph.add({
            id: providerName,
            me: true,
            fixed: true,
            name: providerName
          })
          nodes.push(providerName)
          graph.connect(providerName, key)
        }
      })

      /*
      // Add Providers
      graph.add({
        id: 'provider1',
        me: true,
        fixed: true,
        name: 'heroku'
      })
      graph.add({
        id: 'provider2',
        me: true,
        fixed: true,
        name: 'localhost'
      })
      graph.add({
        id: 'provider3',
        me: true,
        fixed: true,
        name: 'astrangehost'
      })
      // Add Clients
      graph.add({
        id: 'client1',
        name: 'Another Client'
      })
      graph.add({
        id: 'client2',
        name: 'Another Client'
      })
      graph.add({
        id: 'client3',
        name: 'Another Client'
      })
      graph.add({
        id: 'client4',
        name: 'Another Client'
      })
      graph.add({
        id: 'client5',
        name: 'Another Client'
      })
      graph.add({
        id: 'client6',
        name: 'Another Client'
      })
      graph.add({
        id: 'client7',
        name: 'Another Client'
      })
      // color green by isSeeding true
      graph.seed('client5', true)
      // Connect them
      graph.connect('provider1', 'client1')
      graph.connect('provider1', 'client2')
      graph.connect('provider1', 'client3')
      graph.connect('provider2', 'client4')
      graph.connect('provider2', 'client5')
      graph.connect('client1', 'provider2')
      graph.connect('client2', 'provider2')
      graph.connect('client6', 'provider3')
      graph.connect('client7', 'provider3')
      // speed
      graph.rate('provider1', 'client3', 5000)
      */
      // Click behavior
      graph.on('select', (id, ...args) => {console.log('*********', id, args)})
      
      //console.log(graph.list())
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

  get div () {
    return this.root.querySelector('div')
  }

  get template () {
    return this.root.querySelector('template')
  }
}
