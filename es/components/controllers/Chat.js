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

    this.observeEventListener = async event => {
      this.dispatchEvent(new CustomEvent('yjs-chat-update', {
        detail: {
          // TODO: use uuid for isSelf check
          // enrich the chat object with the info if it has been self
          chat: await Promise.all(event.detail.type.toArray().map(async textObj => ({ ...textObj, isSelf: textObj.nickname === await this.nickname })))
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))
    }
    this.inputEventListener = async event => {
      const input = event.detail.input
      if (input.value) {
        // TODO: make this nicer, this.array should be set as promise within the constructor and only dispatch once on connectedCallback
        // @ts-ignore
        (await this.array).push([{
          nickname: await this.nickname,
          text: input.value,
          timestamp: Date.now(),
          sendNotifications: true // servers websocket utils.js has this check
        }])
        input.value = ''
      }
    }
    // TODO: solve this nickname stuff nicer
    this.nicknameEventListener = event => {
      let nicknameResolve
      this.nickname = new Promise(resolve => (nicknameResolve = resolve))
      const nickname = event?.detail?.value?.nickname
      // @ts-ignore
      if (nickname) nicknameResolve(nickname)
    }
  }

  connectedCallback () {
    this.addEventListener('yjs-input', this.inputEventListener)
    document.body.addEventListener('yjs-chat-observe', this.observeEventListener)
    document.body.addEventListener('yjs-set-local-state-field', this.nicknameEventListener)
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
      this.observeEventListener({ detail: { type: result.type } })
      return result.type
    })
  }

  disconnectedCallback () {
    this.removeEventListener('yjs-input', this.inputEventListener)
    document.body.removeEventListener('yjs-map-change', this.observeEventListener)
    document.body.removeEventListener('yjs-set-local-state-field', this.nicknameEventListener)
  }
}
