declare global {
  var eventEmitter: {
    listeners: { [key: string]: Function[] };
    emit: (event: string) => void;
    on: (event: string, callback: Function) => void;
    off: (event: string, callback: Function) => void;
  } | undefined;
}

export {};