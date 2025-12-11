import { Audio } from 'expo-av';
import { useSettingsStore } from '../stores/settingsStore';

const CLICK_URI = 'https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg';
const CELEBRATE_URI = 'https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg';

const playUri = async (uri: string) => {
  const { soundEffects, celebrationSounds, quietMode } = useSettingsStore.getState().settings;
  if (quietMode || (!soundEffects && uri === CLICK_URI) || (!celebrationSounds && uri === CELEBRATE_URI)) {
    return;
  }

  try {
    const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true, volume: 0.6 });
    // Unload after play to avoid leaks
    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) return;
      if (status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (error) {
    console.warn('Sound playback failed', error);
  }
};

export const playClick = () => playUri(CLICK_URI);
export const playCelebrate = () => playUri(CELEBRATE_URI);
