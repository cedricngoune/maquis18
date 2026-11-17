import { generateImage } from './openai-images';

const options = { apiKey: 'sk-test', model: 'gpt-image-2', size: '1536x1024', quality: 'medium' as const };

describe('generateImage', () => {
  const fetchMock = jest.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  it('asks for one landscape WebP image and decodes the base64 answer', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ b64_json: Buffer.from('fake-webp').toString('base64') }] }),
    });

    const image = await generateImage('a dish', options);

    expect(image.toString()).toBe('fake-webp');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.openai.com/v1/images/generations');
    expect(init.headers.Authorization).toBe('Bearer sk-test');
    expect(JSON.parse(init.body)).toEqual({
      model: 'gpt-image-2',
      prompt: 'a dish',
      size: '1536x1024',
      quality: 'medium',
      output_format: 'webp',
      n: 1,
    });
  });

  it('surfaces the OpenAI error message', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'Incorrect API key' } }),
    });

    await expect(generateImage('x', options)).rejects.toThrow('OpenAI 401 : Incorrect API key');
  });
});
