import { Component, type ReactNode } from 'react'

/**
 * Last line of defense: any render/lifecycle crash shows a readable screen
 * with the error text and a reload button instead of unmounting to black.
 * Data in IndexedDB is never affected by a render crash.
 */
export default class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="screen" style={{ padding: 24 }}>
        <div className="screen-title">Something broke</div>
        <p className="muted" style={{ margin: '10px 0' }}>
          The app hit an error it couldn't recover from. Your data is safe — it lives in the
          on-device database, not on this screen.
        </p>
        <div className="code-box" style={{ marginBottom: 14 }}>
          {this.state.error.message || String(this.state.error)}
        </div>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Reload the app
        </button>
        <p className="tiny" style={{ marginTop: 10 }}>
          If this keeps happening, screenshot this screen — the message above says exactly what went wrong.
        </p>
      </div>
    )
  }
}
