export async function extractBeatmapId(beatmapLink: string): Promise<string> {

    const parts = beatmapLink.split('/').filter(part => part.trim() !== "");
    return String(parts[parts.length - 1]);
}