// Brain Training Screen - Redirect to Cognitive
import { Redirect } from 'expo-router';

export default function TrainingScreen() {
  // Training is now integrated into the cognitive screen
  return <Redirect href="/therapy/cognitive" />;
}
