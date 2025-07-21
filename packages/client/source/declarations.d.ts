declare module 'pcm-volume' {
  class Volume {
    constructor();
    setVolume(volume: number): void;
    volume: number;
  }
  export = Volume;
}