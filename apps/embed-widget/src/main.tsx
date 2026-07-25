import React from 'react'
import ReactDOM from 'react-dom/client'
import ChatWidget from './ChatWidget'

const _script = document.currentScript as HTMLScriptElement | null

function mount() {
  const botKey = _script?.getAttribute('data-bot') || ''
  const scriptSrc = _script?.src || ''
  const apiBase = _script?.getAttribute('data-api-url') || (scriptSrc ? new URL(scriptSrc).origin : '')

  const host = document.createElement('div')
  host.id = 'chatbot-widget-host'
  // Fixed + zero-size so the host is out of document flow and above other fixed elements
  host.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:999990;'
  document.body.appendChild(host)

  const shadow = host.attachShadow({ mode: 'open' })
  const mountPoint = document.createElement('div')
  mountPoint.style.cssText = 'pointer-events:auto;'
  shadow.appendChild(mountPoint)

  const root = ReactDOM.createRoot(mountPoint)
  root.render(<ChatWidget botPublicKey={botKey} apiBase={apiBase} />)

  ;(window as any).ChatbotWidget = {
    show: () => mountPoint.dispatchEvent(new CustomEvent('chatbot:show')),
    hide: () => mountPoint.dispatchEvent(new CustomEvent('chatbot:hide')),
    destroy: () => { root.unmount(); host.remove() },
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount)
} else {
  mount()
}
