import * as Tone from 'tone';

let leftPlayer = null;
let rightPlayer = null;
const crossfade = new Tone.CrossFade({ fade: 0 }).toDestination();

export const loadTonePlayer = async (arrayBuffer, name) => {
  // Create a Tone.Player from raw audio data
  const player = new Tone.Player().toDestination();
  const audioBuffer = await Tone.context.decodeAudioData(arrayBuffer.slice(0));
  player.buffer = audioBuffer;
  player.autostart = false;
  player.loop = false;
  player.name = name;
  return player;
};

export const setDeckPlayer = (deckId, player) => {
  if (deckId === 'left') {
    leftPlayer && leftPlayer.stop();
    leftPlayer = player;
    leftPlayer.connect(crossfade.a);
  } else if (deckId === 'right') {
    rightPlayer && rightPlayer.stop();
    rightPlayer = player;
    rightPlayer.connect(crossfade.b);
  }
};

export const setCrossfade = (value) => {
  // value: 0 (full left) to 1 (full right)
  crossfade.fade.value = value;
};

export const syncDecks = () => {
  // Simple sync: ensure both players start at same Transport position
  const pos = Tone.Transport.seconds;
  if (leftPlayer) leftPlayer.seek(pos);
  if (rightPlayer) rightPlayer.seek(pos);
};

export const startTransport = async () => {
  await Tone.start();
  Tone.Transport.start();
};

export const stopTransport = () => {
  Tone.Transport.stop();
};
