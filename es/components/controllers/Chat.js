// @ts-check

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
export const Chat = (ChosenHTMLElement = HTMLElement) => class Chat extends ChosenHTMLElement {
  /**
   * Creates an instance of yjs chats. The constructor will be called for every custom element using this class when initially created.
   *
   * @param {*} args
   */
  constructor (...args) {
    super(...args)

    this.usersEventListener = async event => {
      if (event.detail.selfUser) {
        if (event.detail.selfUser.uid) this.uidResolve(event.detail.selfUser.uid)
        if (event.detail.selfUser.nickname) {
          // TODO: on nickname change trigger a new this.chatObserveEventListener / yjs-chat-update to update all messages
          this.nicknameResolve(event.detail.selfUser.nickname)
          /**
           * Update the nickname on changes
           * 
           * @type {Promise<string>}
           */
          this.nickname = Promise.resolve(event.detail.selfUser.nickname)
        }
      }
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
        // TODO: make this nicer, this.array should be set as promise within the constructor and only dispatch once on connectedCallback
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
      const allUsers = (await this.usersData)().allUsers
      this.dispatchEvent(new CustomEvent('yjs-chat-update', {
        detail: {
          // enrich the chat object with the info if it has been self
          chat: await Promise.all(event.detail.type.toArray().map(async textObj => ({
            ...textObj,
            isSelf: textObj.uid === await this.uid,
            // @ts-ignore
            updatedNickname: allUsers.get(textObj.uid)?.nickname || textObj.nickname
          })))
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))
    }

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
  }

  connectedCallback () {
    document.body.addEventListener('yjs-users', this.usersEventListener)
    this.addEventListener('yjs-input', this.inputEventListener)
    document.body.addEventListener('yjs-chat-observe', this.chatObserveEventListener)
    this.array = new Promise(resolve => this.dispatchEvent(new CustomEvent('yjs-doc', {
      detail: {
        command: 'getArray',
        arguments: ['chat-test-1'], // this could be simply 'chat' but since it has been in use with the name 'chat-test-1', we can not change it without breaking all older chats. So keep it!
        observe: 'yjs-chat-observe',
        resolve
      },
      bubbles: true,
      cancelable: true,
      composed: true
    }))).then(result => {
      this.chatObserveEventListener({ detail: { type: result.type } })
      return result.type
    })
  }

  disconnectedCallback () {
    document.body.removeEventListener('yjs-users', this.usersEventListener)
    this.removeEventListener('yjs-input', this.inputEventListener)
    document.body.removeEventListener('yjs-chat-observe', this.chatObserveEventListener)
  }
}
