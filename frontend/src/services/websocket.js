import { Client } from '@stomp/stompjs';

class WebSocketService {
  constructor() {
    this.client = null;
    this.subscriptions = {};
  }

  connect(onConnectCallback, onErrorCallback) {
    if (this.client && this.client.connected) {
      return;
    }

    const token = localStorage.getItem('token');
    
    // Connect to Render backend in production, otherwise proxy via Vite dev server
    let brokerURL;
    if (import.meta.env.VITE_WS_URL) {
      brokerURL = import.meta.env.VITE_WS_URL;
    } else if (import.meta.env.PROD) {
      brokerURL = 'wss://api-herride.onrender.com/ws/websocket';
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      brokerURL = `${protocol}//${host}/ws/websocket`;
    }

    this.client = new Client({
      brokerURL: brokerURL,
      connectHeaders: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      debug: (str) => {
        console.log('[STOMP]', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = (frame) => {
      console.log('[STOMP] Connected to message broker.');
      if (onConnectCallback) onConnectCallback(frame);
    };

    this.client.onStompError = (frame) => {
      console.error('[STOMP] Broker error:', frame.headers['message']);
      if (onErrorCallback) onErrorCallback(frame);
    };

    this.client.onWebSocketClose = () => {
      console.log('[STOMP] Socket closed.');
    };

    this.client.activate();
  }

  disconnect() {
    if (this.client) {
      Object.keys(this.subscriptions).forEach((dest) => {
        this.subscriptions[dest].unsubscribe();
      });
      this.subscriptions = {};
      this.client.deactivate();
      this.client = null;
      console.log('[STOMP] Disconnected client.');
    }
  }

  subscribe(destination, callback) {
    if (!this.client || !this.client.connected) {
      console.warn('[STOMP] Queueing subscription to ' + destination);
      setTimeout(() => this.subscribe(destination, callback), 1000);
      return null;
    }

    if (this.subscriptions[destination]) {
      this.subscriptions[destination].unsubscribe();
    }

    const subscription = this.client.subscribe(destination, (message) => {
      try {
        const payload = JSON.parse(message.body);
        callback(payload);
      } catch (err) {
        callback(message.body);
      }
    });

    this.subscriptions[destination] = subscription;
    console.log(`[STOMP] Subscribed to ${destination}`);
    return subscription;
  }

  unsubscribe(destination) {
    if (this.subscriptions[destination]) {
      this.subscriptions[destination].unsubscribe();
      delete this.subscriptions[destination];
      console.log(`[STOMP] Unsubscribed from ${destination}`);
    }
  }

  send(destination, payload) {
    if (!this.client || !this.client.connected) {
      console.error('[STOMP] Cannot publish message: disconnected.');
      return;
    }

    this.client.publish({
      destination: destination,
      body: JSON.stringify(payload),
    });
  }
}

const websocketService = new WebSocketService();
export default websocketService;
