export {};

declare global {
  interface Window {
    __env?: {
      googleMapsApiKey?: string;
    };
  }
}
