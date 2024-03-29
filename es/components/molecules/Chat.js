// @ts-check
import { Shadow } from '../../../../event-driven-web-components-prototypes/src/Shadow.js'

/**
 * The chat view
 * TODO: cleanup the whole eventListener and make the chat message list creation simpler, more efficient and do not always destroy all the innerHTML
 *
 * @export
 * @class Providers
 */
export default class Chat extends Shadow() {
  constructor (options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, ...options }, ...args)

    this.timeoutID = null
    // chat update
    this.eventListener = event => {
      const isScrolledBottom = this.scrollHeight < this.scrollTop + this.offsetHeight + 200 /* tollerance */
      let lastEntryIsSelf = false
      let lastMessage = null

      this.ul.innerHTML = ''
      event.detail.chat.sort((a, b) => a.timestamp - b.timestamp).forEach((entry, i, chat) => {
        const li = document.createElement('li')

        if (entry.isSelf) li.classList.add('self')
        // make aTags with href when first link is detected https://stackoverflow.com/questions/1500260/detect-urls-in-text-with-javascript
        entry.text = entry.text.replace(/(https?:\/\/[^\s]+)/g, url => `<a href="${url}" target="_blank">${url}</a>`)
        li.innerHTML = `${entry.isSelf
          ? `<chat-a-nick-name class="user" nickname="${entry.updatedNickname}"></chat-a-nick-name>`
          : `<span class="user">${entry.updatedNickname}: </span><br>`
        }<span class="text">${entry.text}</span><br><span class="timestamp">${(new Date(entry.timestamp)).toLocaleString(navigator.language)}</span>`

        /**
 * TODO: Create own atom components for toggle button and the optionsContainer
 */

        // Create a button for li element
        const button = document.createElement('button')
        button.classList.add('hover-button')
        button.innerHTML = '▼' // Arrow down or any other content
        button.style.display = 'none' // Initially hide the button

        const container = document.createElement('div')
        container.classList.add('smaller-list-container')

        // Create a nested ul for the smaller list
        const smallerList = document.createElement('ul')
        smallerList.style.margin = 'auto'
        smallerList.style.padding = '0'

        const smallerListLi1 = document.createElement('li')
        smallerListLi1.innerHTML = '<span><span>🗑</span> Delete Message</span>'
        smallerList.appendChild(smallerListLi1)

        /* TODO: Add functionality to change color for user in room
const smallerListLi1 = document.createElement('li');
smallerListLi1.innerHTML =`<span>Change Colors</span>`;
smallerList.appendChild(smallerListLi1) */

        /* TODO: Add functionality to Response to Message
const smallerListLi2 = document.createElement('li');
smallerListLi2.innerHTML =`<span>Response to this message</span>`;
smallerList.appendChild(smallerListLi2) */

        // Add hover event listener to display the button
        li.addEventListener('mouseenter', () => {
          button.style.display = 'inline-block' // Show the button for this li
          handleLiElementHover(entry)
        })

        // Add mouseleave event listener to hide the button
        li.addEventListener('mouseleave', () => {
          // @ts-ignore
          if (!li.isContainerVisible) {
            button.style.display = 'none' // Hide the button for this li
          }
        })

        // @ts-ignore
        li.isContainerVisible = false

        // click event listener to the button
        button.addEventListener('click', () => {
          // @ts-ignore
          li.isContainerVisible = !li.isContainerVisible
          // Get the position of the li element
          // const liRect = li.getBoundingClientRect();

          // Set the position of the container next to the li element
          // @ts-ignore
          container.style.display = li.isContainerVisible ? 'block' : 'none'
          /*  container.style.top = `${liRect.top + 50}px`;
    container.style.left = `${liRect.right - 300}px`;
*/
          // Change button content to 'X'
          // @ts-ignore
          button.innerHTML = li.isContainerVisible ? '✕' : '▼'
          handleButtonClick(entry)
        })

        // li.appendChild(button)

        this.ul.appendChild(li)

        container.appendChild(smallerList)
        // TODO: fix up this file (redo at chat repo properly) and then add this feature
        // li.appendChild(container)
        if (chat.length === i + 1 && entry.isSelf) lastEntryIsSelf = true
        if (chat.length === i + 1) lastMessage = entry
      })
      // scroll to new entry
      if (lastEntryIsSelf || isScrolledBottom) {
        this.scroll(0, this.scrollHeight)
        this.dispatchEvent(new CustomEvent('main-scroll', {
          detail: {
            behavior: 'instant'
          },
          bubbles: true,
          cancelable: true,
          composed: true
        }))
        // TODO: solve the scroll stuff per message properly
        setTimeout(() => this.dispatchEvent(new CustomEvent('main-scroll', {
          detail: {
            behavior: 'smooth'
          },
          bubbles: true,
          cancelable: true,
          composed: true
        })), 800)
      }
    }

    // function to handle the button click
    const handleButtonClick = (entry) => {
      // console.log('Button clicked for entry:', entry)
    }

    // function to handle the LI element hover
    const handleLiElementHover = (entry) => {
      // console.log('Li Element is hovered for showing btn:', entry)
    }
  }

  connectedCallback () {
    if (this.shouldRenderCSS()) this.renderCSS()
    if (this.shouldRenderHTML()) this.renderHTML()
    this.globalEventTarget.addEventListener('yjs-chat-update', this.eventListener)
    this.dispatchEvent(new CustomEvent('main-scroll', {
      detail: {
        behavior: 'instant'
      },
      bubbles: true,
      cancelable: true,
      composed: true
    }))
  }

  disconnectedCallback () {
    this.globalEventTarget.removeEventListener('yjs-chat-update', this.eventListener)
  }

  /**
   * Evaluates if a render of CSS is necessary
   *
   * @return {boolean}
   */
  shouldRenderCSS () {
    return !this.root.querySelector(`:host > style[_css], ${this.tagName} > style[_css]`)
  }

  /**
   * Evaluates if a render of HTML is necessary
   *
   * @return {boolean}
   */
  shouldRenderHTML () {
    return !this.ul
  }

  /**
   * Renders the CSS
   *
   * @return {void}
   */
  renderCSS () {
    this.css = /* css */`
      :host > ul {
        margin: 0;
        padding: 0;          
      }
      :host > ul > li {
        background-color: lightgray;
        border-radius: 0.5em;
        float: left;
        list-style: none;
        padding: var(--spacing);
        margin: 0.25em 0.1em 0.25em 0;
        width: 80%;          
        
      }
      :host > ul > li.self {
        background-color: lightgreen;
        float: right;
      }
      :host > ul > li > .user, :host > ul > li > .timestamp {
        color: gray;
        font-size: 0.8em;
      }
      :host > ul > li > span {
        word-break: break-word;
      }
      :host > ul > li > span.text {
        white-space: pre-line;
      }
      :host > ul > li span.peer-web-site {
        font-size: 0.8em;
      }
      :host > ul > li > .timestamp {
        font-size: 0.6em;
      }

      :host > ul > li > .smaller-list-container {
        display: none;
        background-color:var(--background-color-smallListContainer);
        padding: 0.5rem 1rem;
        box-shadow: var(--box-shadow-default);
        border-radius: 10px;
        width: 20%;
        float: right;
        margin-top: -5%;
        margin-right: 1%;
      }
      :host > ul > li > .hover-button {                 
        float:right;
        border-radius: 50%;
        box-shadow: var(--box-shadow-default);
        border: none;
        width: 2rem;
        height: 2rem;
        margin-top: -2%;
      }

      :host > ul > li > .smaller-list-container ul li{
        list-style-type: none;
      }
      :host > ul > li > .smaller-list-container ul li:hover{
        background-color: rgba(150,150,150,0.3);
      }

      /*Change Icon size*/
      :host > ul > li > .smaller-list-container ul li span span{
        font-size: 1.5rem;
      }
    `
  }

  /**
  * renders the html
  *
  * @return {Promise<void>}
  */
  renderHTML () {
    this.html = /* html */`
      <ul>
        <li>loading...</li>
      </ul>
    `
    return this.fetchModules([
      {
        // @ts-ignore
        path: `${this.importMetaUrl}../../components/atoms/nickName/NickName.js?${Environment?.version || ''}`,
        name: 'chat-a-nick-name'
      }
    ])
  }

  get ul () {
    return this.root.querySelector('ul')
  }

  get globalEventTarget () {
    // @ts-ignore
    return this._globalEventTarget || (this._globalEventTarget = self.Environment?.activeRoute || document.body)
  }
}
