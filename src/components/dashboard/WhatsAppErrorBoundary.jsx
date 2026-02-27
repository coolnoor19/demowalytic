import { Component } from "react";

export default class WhatsAppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("WhatsApp component error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-300 bg-red-50 rounded-lg text-red-700">
          <h2 className="font-bold">Something went wrong</h2>
          <p>{this.state.error?.message || "Unknown error"}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
