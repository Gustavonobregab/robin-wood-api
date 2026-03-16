import ffmpeg from 'fluent-ffmpeg';

export function runFFmpeg(inputPath: string, outputPath: string, filters: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    let command = ffmpeg(inputPath);

    if (filters.length > 0) {
      command = command.audioFilters(filters);
    }

    command
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', reject)
      .run();
  });
}
