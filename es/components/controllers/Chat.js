// @ts-check
import { WebWorker } from '../../../../event-driven-web-components-prototypes/src/WebWorker.js'

/**
 * textObj aka. Message container
 * the chat controller and molecules delete/remove messages but when as replyTo message it can show as deleted
 @typedef {{
    isSelf?: boolean,
    nickname?: string,
    sendNotifications?: boolean,
    text?: string,
    timestamp: number,
    uid: string,
    updatedNickname?: string,
    replyTo?: {
      timestamp: number,
      uid: string
    },
    deleted?: boolean
  }} TextObj
*/

/**
 * outgoing event
 @typedef {{
  getAll: () => Promise<TextObj[]>,
  getAdded: () => Promise<TextObj[]>,
  added: number,
  getDeleted: () => Promise<TextObj[]>,
  deleted: number
 }} ChatEventDetail
*/

/* global CustomEvent */
/* global self */

/**
 * Chat is a helper to keep all chat object in a yjs map and forwarding the proper events helping having an overview of all participants
 * NOTE: textObj === Message.js data
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

    this.chatAddEventListener = async event => {
      const mandatoryData = {
        uid: await this.uid,
        nickname: await this.nickname,
        timestamp: Date.now(),
        sendNotifications: true, // servers websocket utils.js has this check,
        text: '' // must always include the text property
      }
      switch (event.detail.type) {
        case 'jitsi-video-started':
        case 'jitsi-video-stopped':
          (await this.array).push([{
            ...mandatoryData,
            type: event.detail.type,
            src: event.detail.iframeSrc,
            text: event.detail.type
          }])
          return
        default:
          if (event.detail.input.value) {
            const textObj = {
              ...mandatoryData,
              text: event.detail.input.value
            }
            // @ts-ignore
            if (event.detail.replyToTextObj) {
              // @ts-ignore
              textObj.replyTo = {
                timestamp: event.detail.replyToTextObj.timestamp,
                uid: event.detail.replyToTextObj.uid
              }
            }
            (await this.array).push([textObj])
            if (event.detail.clear !== false) event.detail.input.value = ''
          }
      }
    }

    this.chatDeleteEventListener = async event => {
      let index = -1
      // check that the uid of the message to delete is the same as this local users uid
      if (event.detail.uid === await this.uid && (index = (await this.array).toArray().findIndex(message => message.timestamp === event.detail.timestamp && message.uid === event.detail.uid)) !== -1) (await this.array).delete(index, 1)
    }

    this.chatObserveEventListener = async event => {
      let getAllResult = null
      const getAll = async () => {
        if (getAllResult) return getAllResult
        // @ts-ignore
        return this.storeTextObjs((getAllResult = await this.webWorker(Chat.enrichTextObj, event.detail.type.toArray(), await this.uid, (await (await this.usersData)()).allUsers)))
      }
      let getAddedResult = null
      const getAdded = async () => {
        if (getAddedResult) return getAddedResult
        // @ts-ignore
        const addedItems = Array.from(event.detail.yjsEvent?.changes?.added || []).map(item => Object.assign(...item.content?.arr))
        return this.storeTextObjs((getAddedResult = addedItems.length
          // @ts-ignore
          ? await this.webWorker(Chat.enrichTextObj, addedItems, await this.uid, (await (await this.usersData)()).allUsers)
          : Promise.resolve([]))
        )
      }
      let getDeletedResult = null
      const getDeleted = async () => {
        if (getDeletedResult) return getDeletedResult
        // @ts-ignore
        const deletedItems = Array.from(event.detail.yjsEvent?.changes?.deleted || []).map(item => Object.assign(...item.content?.arr))
        return this.storeTextObjs((getDeletedResult = deletedItems.length
          // @ts-ignore
          ? await this.webWorker(Chat.enrichTextObj, deletedItems, await this.uid, (await (await this.usersData)()).allUsers)
          : Promise.resolve([])
        ), true)
      }
      /** @type {ChatEventDetail} */
      const detail = {
        // enrich the chat object with the info if it has been self
        getAll,
        getAdded,
        added: event.detail.yjsEvent?.changes?.added?.size,
        getDeleted,
        deleted: event.detail.yjsEvent?.changes?.deleted?.size
      }
      this.chatEventDetailResolve(detail)
      this.chatEventDetail = Promise.resolve(detail)
      this.dispatchEvent(new CustomEvent('yjs-chat-update', {
        detail,
        bubbles: true,
        cancelable: true,
        composed: true
      }))
    }

    this.getChatEventDetailEventListener = event => {
      if (event && event.detail && event.detail.resolve) return event.detail.resolve(this.chatEventDetail)
      this.dispatchEvent(new CustomEvent('yjs-chat-event-detail', {
        /** @type {Promise<ChatEventDetail>} */
        detail: this.chatEventDetail,
        bubbles: true,
        cancelable: true,
        composed: true
      }))
    }

    this.getTextObjEventListener = async event => {
      let textObj = this.allTextObjsInSync.get(Chat.getTextObjKey(event.detail.textObj))
      // @ts-ignore
      if (textObj) textObj = (await this.webWorker(Chat.enrichTextObj, [textObj], await this.uid, (await (await this.usersData)()).allUsers))[0]
      event.detail.resolve(textObj)
    }

    this.getTimestampsOfMessages = async event => event.detail.resolve(Array.from(this.allTextObjsInSync).map(([key, value]) => value.timestamp))

    /**
     * Keeps all chatObserveEventListener received textObj (aka. Message.js data) in the runtime with the most recent UNPACKED (function getAll, etc. executed) representation
     * Short: Represents all textObj by last unpacked state in sync
     *
     * @type {Map<string, TextObj>}
     */
    this.allTextObjsInSync = new Map()

    this.nicknameEventListener = event => (this.nickname = Promise.resolve(event.detail.nickname))

    /** @type {(ChatEventDetail)=>void} */
    this.chatEventDetailResolve = map => map
    /** @type {Promise<ChatEventDetail>} */
    this.chatEventDetail = new Promise(resolve => (this.chatEventDetailResolve = resolve))

    /** @type {(any)=>void} */
    this.uidResolve = map => map
    /** @type {Promise<string>} */
    this.uid = new Promise(resolve => (this.uidResolve = resolve))

    /** @type {(any)=>void} */
    this.nicknameResolve = map => map
    /** @type {Promise<string>} */
    this.nickname = new Promise(resolve => (this.nicknameResolve = resolve)).then(({ nickname }) => nickname)

    /** @type {(any)=>void} */
    this.usersDataResolve = map => map
    /** @type {Promise<() => {allUsers: import("../../../../event-driven-web-components-yjs/src/es/controllers/Users.js").UsersContainer, users: import("../../../../event-driven-web-components-yjs/src/es/controllers/Users.js").UsersContainer}>} */
    this.usersData = new Promise(resolve => (this.usersDataResolve = resolve))

    /** @type {(any)=>void} */
    this.arrayResolve = map => map
    /** @type {Promise<any>} */
    this.array = new Promise(resolve => (this.arrayResolve = resolve)).then(result => {
      this.chatObserveEventListener({ detail: { type: result.type } })
      return result.type
    })
  }

  connectedCallback () {
    this.addEventListener('chat-add', this.chatAddEventListener)
    this.addEventListener('chat-delete', this.chatDeleteEventListener)
    this.addEventListener('chat-get-text-obj', this.getTextObjEventListener)
    this.addEventListener('yjs-get-chat-event-detail', this.getChatEventDetailEventListener)
    this.globalEventTarget.addEventListener('yjs-get-timestamps-of-messages', this.getTimestampsOfMessages)
    this.globalEventTarget.addEventListener('yjs-users', this.usersEventListener)
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
    this.removeEventListener('chat-add', this.chatAddEventListener)
    this.removeEventListener('chat-delete', this.chatDeleteEventListener)
    this.removeEventListener('chat-get-text-obj', this.getTextObjEventListener)
    this.removeEventListener('yjs-get-chat-event-detail', this.getChatEventDetailEventListener)
    this.globalEventTarget.removeEventListener('yjs-get-timestamps-of-messages', this.getTimestampsOfMessages)
    this.globalEventTarget.removeEventListener('yjs-users', this.usersEventListener)
    this.globalEventTarget.removeEventListener('yjs-chat-observe', this.chatObserveEventListener)
    this.globalEventTarget.removeEventListener('yjs-nickname', this.nicknameEventListener)
  }

  /**
   * @param {TextObj[]} textObjs
   * @param {boolean} [remove=false]
   * @return {TextObj[]}
   */
  storeTextObjs (textObjs, remove = false) {
    textObjs.forEach(textObj => this.allTextObjsInSync[remove ? 'delete' : 'set'](Chat.getTextObjKey(textObj), textObj))
    return textObjs
  }

  /**
   * @static
   * @param {TextObj} textObj
   * @return {string}
   */
  static getTextObjKey (textObj) {
    return `${textObj.timestamp}_${textObj.uid}`
  }

  /**
   *
   *
   * @static
   * @param {TextObj[]} type
   * @param {string} uid
   * @param {import("../../../../event-driven-web-components-yjs/src/es/controllers/Users.js").UsersContainer} allUsers
   * @return {TextObj[]}
   */
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
