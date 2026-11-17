export type ImageOptions = {
  apiKey: string;
  model: string;
  size: string;
  quality: 'low' | 'medium' | 'high' | 'auto';
};

type ImagesResponse = { data?: { b64_json?: string }[]; error?: { message?: string } };

/**
 * Generates one image with the OpenAI Images API and returns it as a Buffer (WebP).
 * GPT Image models always answer in base64.
 */
export async function generateImage(prompt: string, options: ImageOptions): Promise<Buffer> {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${options.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: options.model,
      prompt,
      size: options.size,
      quality: options.quality,
      output_format: 'webp',
      n: 1,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as ImagesResponse;
  if (!response.ok) {
    throw new Error(`OpenAI ${response.status} : ${payload.error?.message ?? 'réponse inattendue'}`);
  }
  const base64 = payload.data?.[0]?.b64_json;
  if (!base64) throw new Error('OpenAI : aucune image dans la réponse');
  return Buffer.from(base64, 'base64');
}
