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
  document.body.appendChild(host)

  const shadow = host.attachShadow({ mode: 'open' })
  const mountPoint = document.createElement('div')
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
