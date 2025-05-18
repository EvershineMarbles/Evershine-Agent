// Type definitions for Socket.IO client
declare module "socket.io-client" {
    interface SocketOptions {
      /**
       * the URL of the socket server
       */
      uri?: string
      /**
       * name of the path that is captured on the server side
       * @default /socket.io
       */
      path?: string
      /**
       * whether to reconnect automatically
       * @default true
       */
      reconnection?: boolean
      /**
       * number of reconnection attempts before giving up
       * @default Infinity
       */
      reconnectionAttempts?: number
      /**
       * how long to initially wait before attempting a new
       * reconnection
       * @default 1000
       */
      reconnectionDelay?: number
      /**
       * maximum amount of time to wait between
       * reconnection attempts. Each attempt increases the
       * reconnection delay by 2x along with a randomization factor
       * @default 5000
       */
      reconnectionDelayMax?: number
      /**
       * randomization factor for the reconnection delay
       * @default 0.5
       */
      randomizationFactor?: number
      /**
       * name of the query parameter to use for the timestamp
       * @default t
       */
      timestampParam?: string
      /**
       * whether to include credentials (cookies) with the connection
       * @default false
       */
      withCredentials?: boolean
      /**
       * additional query parameters that are sent when connecting
       * @default {}
       */
      query?: object
      /**
       * the parser to use to parse the responses
       * @default JSON
       */
      parser?: any
      /**
       * whether the client should automatically connect
       * @default true
       */
      autoConnect?: boolean
      /**
       * the auth object for the Socket.IO handshake
       */
      auth?: {
        token?: string
        [key: string]: any
      }
    }
  
    interface Socket {
      /**
       * Whether the socket is currently connected to the server
       */
      connected: boolean
      /**
       * Whether the socket is currently disconnected from the server
       */
      disconnected: boolean
      /**
       * The Socket ID assigned by the server
       */
      id: string
      /**
       * Connect to the server
       */
      connect(): Socket
      /**
       * Disconnect from the server
       */
      disconnect(): Socket
      /**
       * Emit an event to the server
       */
      emit(event: string, ...args: any[]): Socket
      /**
       * Listen for an event from the server
       */
      on(event: string, fn: (...args: any[]) => void): Socket
      /**
       * Listen for an event from the server, but only once
       */
      once(event: string, fn: (...args: any[]) => void): Socket
      /**
       * Remove a listener for an event
       */
      off(event: string, fn?: (...args: any[]) => void): Socket
      /**
       * Remove all listeners for an event
       */
      removeAllListeners(event?: string): Socket
      /**
       * Join a room
       */
      join(room: string): Socket
      /**
       * Leave a room
       */
      leave(room: string): Socket
    }
  
    function io(uri: string, opts?: SocketOptions): Socket
  
    namespace io {
      const Manager: typeof Manager
    }
  
    export = io
  }
  