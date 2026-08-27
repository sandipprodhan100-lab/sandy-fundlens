export class AsyncLocalStorage<T = any> {
  private store: T | undefined = undefined;

  disable() {
    this.store = undefined;
  }

  getStore(): T | undefined {
    return this.store;
  }

  run<R>(store: T, callback: (...args: any[]) => R, ...args: any[]): R {
    const prev = this.store;
    this.store = store;
    try {
      return callback(...args);
    } finally {
      this.store = prev;
    }
  }

  exit<R>(callback: (...args: any[]) => R, ...args: any[]): R {
    const prev = this.store;
    this.store = undefined;
    try {
      return callback(...args);
    } finally {
      this.store = prev;
    }
  }

  enterWith(store: T): void {
    this.store = store;
  }
}

export default {
  AsyncLocalStorage,
};
