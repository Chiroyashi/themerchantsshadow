import React, { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-sm space-y-6">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-red-600/20 flex items-center justify-center">
              <span className="text-4xl">💀</span>
            </div>
            <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter">Ada yang error</h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Game mengalami gangguan. Coba refresh halaman atau hubungi Moderator.
            </p>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
              className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest"
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
