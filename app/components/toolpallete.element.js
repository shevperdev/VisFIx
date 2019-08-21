import { $, $$ } from 'blingblingjs'
import hotkeys from 'hotkeys-js'

import { cursor, move, search, margin, padding, font, type } from './toolpallete.icons' 
import { getStyle, rgb2hex } from '../features/utils'
import { 
  Selectable, Moveable, Padding, Margin, EditText, Font,
  ChangeForeground, ChangeBackground
} from '../features/'

export default class ToolPallete extends HTMLElement {
  
  constructor() {
    super()
    // todo: these are 2 model groups, with separate selected state scopes
    // todo: duplicate
    // todo: create
    // todo: resize
    // todo: ragrid alignment panel

    this.toolbar_model = {
      a: { tool: 'element', icon: cursor },
      v: { tool: 'group', icon: cursor },
      '': { tool: '', icon: '' },
      m: { tool: 'move', icon: move },
      'shift+m': { tool: 'margin', icon: margin },
      p: { tool: 'padding', icon: padding },
      f: { tool: 'font', icon: font },
      t: { tool: 'text', icon: type },
      s: { tool: 'search', icon: search },
    }

    this.innerHTML = this.render()
    this.selectorEngine = Selectable($$('body > *:not(script):not(tool-pallete)'))
  }

  connectedCallback() {
    $$('li', this).on('click', e => 
      this.toolSelected(e.currentTarget) && e.stopPropagation())

    this.foregroundPicker = $('#foreground', this)
    this.backgroundPicker = $('#background', this)

    // set colors
    this.foregroundPicker.on('input', e =>
      ChangeForeground($$('[data-selected=true]'), e.target.value))

    this.backgroundPicker.on('input', e =>
      ChangeBackground($$('[data-selected=true]'), e.target.value))

    // read colors
    this.selectorEngine.onSelectedUpdate(elements => {
      if (!elements.length) return

      if (elements.length >= 2) {
        this.foregroundPicker.value = null
        this.backgroundPicker.value = null
      }
      else {
        let fg = rgb2hex(getStyle(elements[0], 'color'))
        let bg = rgb2hex(getStyle(elements[0], 'backgroundColor'))

        this.foregroundPicker.setAttribute('value', (fg == '#000' && elements[0].textContent == '') ? '' : fg)
        // todo: better background color parser
        this.backgroundPicker.setAttribute('value', bg == '#NaN000' ? '' : bg)
      }
    })

    Object.entries(this.toolbar_model).forEach(([key, value]) =>
      hotkeys(key, e => this.toolSelected($(`[data-tool="${value.tool}"]`))))

    this.toolSelected($('[data-tool="move"]'))
    // this.toolSelected($('[data-tool="element"]'))
  }

  disconnectedCallback() {}

  toolSelected(el) {
    if (this.active_tool) {
      this.active_tool.removeAttribute('data-active')
      this.deactivate_feature()
    }

    el.setAttribute('data-active', true)
    this.active_tool = el
    this[el.dataset.tool]()
  }

  render() {
    return `
      <ol>
        ${Object.entries(this.toolbar_model).reduce((list, [key, value]) => `
          ${list}
          <li title='${value.tool}' data-tool='${value.tool}' data-active='${key == 'v' || key == 'm'}'>${value.icon}</li>
        `,'')}
        <li></li>
        <input type="color" id='foreground' value='#000000'>
        <input type="color" id='background' value=''>
      </ol>
    `
  }

  group() {}
  element() {}

  move() {
    this.deactivate_feature = Moveable('[data-selected=true]')
  }

  margin() {
    this.deactivate_feature = Margin('[data-selected=true]') 
  }

  padding() {
    this.deactivate_feature = Padding('[data-selected=true]') 
  }

  font() {
    this.deactivate_feature = Font('[data-selected=true]')
  } 

  text() {
    this.selectorEngine.onSelectedUpdate(EditText)
    this.deactivate_feature = () => 
      this.selectorEngine.removeSelectedCallback(EditText)
  }

  color() {}
  search() {}
}

customElements.define('tool-pallete', ToolPallete)