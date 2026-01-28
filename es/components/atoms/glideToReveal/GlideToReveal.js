// @ts-check
import { Shadow } from '../../../../../web-components-toolbox/src/es/components/prototypes/Shadow.js'

/**
* @export
* @class GlideToReveal
* @type {CustomElementConstructor}
*/
export default class GlideToReveal extends Shadow() {
  constructor (options = {}, ...args) {
    super({ importMetaUrl: import.meta.url, tabindex: 'no-tabindex', ...options }, ...args)
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
    return !this.section
  }

  /**
   * renders the css
   * @returns Promise<void>
   */
  renderCSS () {
    this.css = /* css */`
      * {
        box-sizing: border-box;
      }
      :host {
        font-family: var(--font-family-secondary);
      }
      .code {
        font-size: 2em;
        display: flex;
        flex-wrap: wrap;
        color: var(--color-green-full);
        border-radius: 0 0 var(--border-radius) var(--border-radius);
        background: hsl(0 0% 6%);
        justify-content: space-evenly;
        padding: 0.1em;
      }
      .code:hover {
        cursor: grab;
      }
      .digit {
        display: flex;
        height: 100%;
        padding: 0 0.5em;
      }
      .digit:focus-visible {
        outline-color: hsl(0 0% 50% / 0.25);
        outline-offset: 1em;
      }
      .digit span {
        scale: calc(var(--active, 0) + 0.5);
        filter: blur(calc((1 - var(--active, 0)) * 0.25rem));
        transition: scale calc(((1 - var(--active, 0)) + 0.2) * 1s), filter calc(((1 - var(--active, 0)) + 0.2) * 1s);
      }
      ul {
        padding: 0;
        margin: 0;
      }
      :host {
        --lerp-0: 1; /* === sin(90deg) */
        --lerp-1: calc(sin(50deg));
        --lerp-2: calc(sin(45deg));
        --lerp-3: calc(sin(35deg));
        --lerp-4: calc(sin(25deg));
        --lerp-5: calc(sin(15deg));
      }
      .digit:is(:hover, :focus-visible) {
        --active: var(--lerp-0);
      }
      .digit:is(:hover, :focus-visible) + .digit,
      .digit:has(+ .digit:is(:hover, :focus-visible)) {
        --active: var(--lerp-1);
      }
      .digit:is(:hover, :focus-visible) + .digit + .digit,
      .digit:has(+ .digit + .digit:is(:hover, :focus-visible)) {
        --active: var(--lerp-2);
      }
      .digit:is(:hover, :focus-visible) + .digit + .digit + .digit,
      .digit:has(+ .digit + .digit + .digit:is(:hover, :focus-visible)) {
        --active: var(--lerp-3);
      }
      .digit:is(:hover, :focus-visible) + .digit + .digit + .digit + .digit,
      .digit:has(+ .digit + .digit + .digit + .digit:is(:hover, :focus-visible)) {
        --active: var(--lerp-4);
      }
      .digit:is(:hover, :focus-visible) + .digit + .digit + .digit + .digit + .digit,
      .digit:has(+ .digit + .digit + .digit + .digit + .digit:is(:hover, :focus-visible)) {
        --active: var(--lerp-5);
      }
    `
  }

  /**
   * Render HTML
   * @returns Promise<void>
   */
  renderHTML () {
    this.html = /* html */`
      <section>
        <ul class="code">
          <li tabindex="0" class="digit">
            <span>0</span>
          </li>
          <li tabindex="0" class="digit">
            <span>3</span>
          </li>
          <li tabindex="0" class="digit">
            <span>4</span>
          </li>
          <li tabindex="0" class="digit">
            <span>8</span>
          </li>
          <li tabindex="0" class="digit">
            <span>7</span>
          </li>
          <li tabindex="0" class="digit">
            <span>2</span>
          </li>
          <li tabindex="0" class="digit">
            <span>8</span>
          </li>
          <li tabindex="0" class="digit">
            <span>7</span>
          </li>
          <li tabindex="0" class="digit">
            <span>2</span>
          </li>
                    <li tabindex="0" class="digit">
            <span>8</span>
          </li>
          <li tabindex="0" class="digit">
            <span>7</span>
          </li>
          <li tabindex="0" class="digit">
            <span>2</span>
          </li>
                    <li tabindex="0" class="digit">
            <span>8</span>
          </li>
          <li tabindex="0" class="digit">
            <span>7</span>
          </li>
          <li tabindex="0" class="digit">
            <span>2</span>
          </li>
                    <li tabindex="0" class="digit">
            <span>8</span>
          </li>
          <li tabindex="0" class="digit">
            <span>7</span>
          </li>
          <li tabindex="0" class="digit">
            <span>2</span>
          </li>
                    <li tabindex="0" class="digit">
            <span>8</span>
          </li>
          <li tabindex="0" class="digit">
            <span>7</span>
          </li>
          <li tabindex="0" class="digit">
            <span>2</span>
          </li>
        </ul>
      </section>
    `
  }

  get section () {
    return this.root.querySelector('section')
  }
}
