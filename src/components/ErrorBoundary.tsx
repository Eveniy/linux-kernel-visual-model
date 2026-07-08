import { Component, type ErrorInfo, type ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

// Ловит исключения рендера, чтобы одиночная ошибка не «схлопывала» весь UI в
// пустой экран. Вместо белого канваса показываем сообщение и кнопку сброса.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Оставляем след в консоли — удобно при отладке сценариев.
    console.error("UI error boundary поймал ошибку:", error, info.componentStack);
  }

  handleReset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="errorBoundary" role="alert">
          <h2>Что-то пошло не так при отрисовке</h2>
          <p>{this.state.error.message}</p>
          <button type="button" className="iconTextButton primary" onClick={this.handleReset}>
            Продолжить
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
