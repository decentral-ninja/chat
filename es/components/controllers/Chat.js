// @ts-check
import { WebWorker } from '../../../../event-driven-web-components-prototypes/src/WebWorker.js'

/* global HTMLElement */
/* global CustomEvent */

/**
 * Chat is a helper to keep all chat object in a yjs map and forwarding the proper events helping having an overview of all participants
 * TODO: view component for controllers/Chat.js with https://github.com/feross/p2p-graph
 *
 * @export
 * @function Chat
 * @param {CustomElementConstructor} [ChosenHTMLElement = HTMLElement]
 * @return {CustomElementConstructor | *}
 */
export const Chat = (ChosenHTMLElement = WebWorker()) => class Chat extends ChosenHTMLElement {
  /**
   * Creates an instance of yjs chats. The constructor will be called for every custom element using this class when initially created.
   *
   * @param {*} args
   */
  constructor (...args) {
    super(...args)

    this.usersEventListener = async event => {
      if (event.detail.selfUser?.uid) this.uidResolve(event.detail.selfUser.uid)
      this.usersDataResolve(event.detail.getData)
      /**
       * Update the user data on changes
       * 
       * @type {Promise<() => {allUsers: import("../../../../event-driven-web-components-yjs/src/es/controllers/Users.js").UsersContainer, users: import("../../../../event-driven-web-components-yjs/src/es/controllers/Users.js").UsersContainer}>}
       */
      this.usersData = Promise.resolve(event.detail.getData)
    }

    this.inputEventListener = async event => {
      const input = event.detail.input
      if (input.value) {
        // @ts-ignore
        (await this.array).push([{
          uid: await this.uid,
          nickname: await this.nickname,
          text: input.value,
          timestamp: Date.now(),
          sendNotifications: true // servers websocket utils.js has this check
        }])
        input.value = ''
      }
    }

    this.chatObserveEventListener = async event => {
      console.log('****chat update*****', event.detail.yjsEvent?.changes)
      let getAllResult = null
      const getAll = async () => {
        if (getAllResult) return getAllResult
        // @ts-ignore
        return (getAllResult =  await this.webWorker(Chat.enrichTextObj, event.detail.type.toArray(), await this.uid, (await (await this.usersData)()).allUsers))
      }
      let getAddedResult = null
      const getAdded = async () => {
        if (getAddedResult) return getAddedResult
        // @ts-ignore
        const addedItems = Array.from(event.detail.yjsEvent?.changes?.added || []).map(item => Object.assign(...item.content?.arr))
        return (getAddedResult =  addedItems.length
          // @ts-ignore
          ? await this.webWorker(Chat.enrichTextObj, addedItems, await this.uid, (await (await this.usersData)()).allUsers)
          : Promise.resolve([])
        )
      }

      this.dispatchEvent(new CustomEvent('yjs-chat-update', {
        detail: {
          // enrich the chat object with the info if it has been self
          getAll,
          getAdded
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))
    }

    this.nicknameEventListener = event => (this.nickname = Promise.resolve(event.detail.nickname))

    /** @type {(any)=>void} */
    this.uidResolve = map => map
    /** @type {Promise<string>} */
    this.uid = new Promise(resolve => (this.uidResolve = resolve))

    /** @type {(any)=>void} */
    this.nicknameResolve = map => map
    /** @type {Promise<string>} */
    this.nickname = new Promise(resolve => (this.nicknameResolve = resolve))

    /** @type {(any)=>void} */
    this.usersDataResolve = map => map
    /** @type {Promise<() => {allUsers: import("../../../../event-driven-web-components-yjs/src/es/controllers/Users.js").UsersContainer, users: import("../../../../event-driven-web-components-yjs/src/es/controllers/Users.js").UsersContainer}>} */
    this.usersData = new Promise(resolve => (this.usersDataResolve = resolve))

    /** @type {(any)=>void} */
    this.arrayResolve = map => map
    /** @type {Promise<string>} */
    this.array = new Promise(resolve => (this.arrayResolve = resolve)).then(result => {
      this.chatObserveEventListener({ detail: { type: result.type } })
      return result.type
    })
  }

  connectedCallback () {
    this.globalEventTarget.addEventListener('yjs-users', this.usersEventListener)
    this.addEventListener('yjs-input', this.inputEventListener)
    this.globalEventTarget.addEventListener('yjs-chat-observe', this.chatObserveEventListener)
    this.globalEventTarget.addEventListener('yjs-nickname', this.nicknameEventListener)
    this.connectedCallbackOnce()
  }

  connectedCallbackOnce () {
    this.dispatchEvent(new CustomEvent('yjs-doc', {
      detail: {
        command: 'getArray',
        arguments: ['chat-test-1'], // this could be simply 'chat' but since it has been in use with the name 'chat-test-1', we can not change it without breaking all older chats. So keep it!
        observe: 'yjs-chat-observe',
        resolve: this.arrayResolve
      },
      bubbles: true,
      cancelable: true,
      composed: true
    }))
    this.dispatchEvent(new CustomEvent('yjs-get-nickname', {
      detail: {
        resolve: this.nicknameResolve
      },
      bubbles: true,
      cancelable: true,
      composed: true
    }))
    this.connectedCallbackOnce = () => {}
  }

  disconnectedCallback () {
    this.globalEventTarget.removeEventListener('yjs-users', this.usersEventListener)
    this.removeEventListener('yjs-input', this.inputEventListener)
    this.globalEventTarget.removeEventListener('yjs-chat-observe', this.chatObserveEventListener)
    this.globalEventTarget.removeEventListener('yjs-nickname', this.nicknameEventListener)
  }

  static enrichTextObj (type, uid, allUsers) {
    return type.map(textObj => ({
      ...textObj,
      isSelf: textObj.uid === uid,
      // @ts-ignore
      updatedNickname: allUsers.get(textObj.uid)?.nickname || textObj.nickname
    }))
  }

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }
}
