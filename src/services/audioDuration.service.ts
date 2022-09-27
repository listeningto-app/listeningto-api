import { getAudioDurationInSeconds } from 'get-audio-duration'
import { join } from 'path'

async function audioDuration(filepath: string): Promise<number> {
  const duration = await getAudioDurationInSeconds(join(__dirname, "../../", "public", filepath));
  return Math.trunc(duration);
}

export default audioDuration;