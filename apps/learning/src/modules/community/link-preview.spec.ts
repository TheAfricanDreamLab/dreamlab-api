import { linksIn, previewLinks, readPreview } from './link-preview';

describe('link previews (COMM-2)', () => {
  it('finds up to three distinct links, without trailing punctuation', () => {
    expect(linksIn('See https://a.example/x, and https://b.example. Also https://a.example/x! Then https://c.example and https://d.example')).toEqual([
      'https://a.example/x',
      'https://b.example/',
      'https://c.example/',
    ]);
    expect(linksIn('no links here')).toEqual([]);
  });

  it('reads Open Graph tags first, then the title and description', () => {
    const html = `<html><head><title>Fallback &amp; title</title>
      <meta name="description" content="Plain description">
      <meta content="Grain dryers for &quot;smallholders&quot;" property="og:title">
      <meta property="og:site_name" content="Kaduna Agri"></head></html>`;
    expect(readPreview(html)).toEqual({ title: 'Grain dryers for "smallholders"', description: 'Plain description', siteName: 'Kaduna Agri' });
    expect(readPreview('<title>Only a title</title>')).toEqual({ title: 'Only a title', description: null, siteName: null });
  });

  it('never fetches plain http, other ports or private addresses', async () => {
    const previews = await previewLinks('http://example.com https://example.com:8443/x https://127.0.0.1/admin');
    expect(previews).toEqual([
      { url: 'http://example.com/', title: null, description: null, siteName: null },
      { url: 'https://example.com:8443/x', title: null, description: null, siteName: null },
      { url: 'https://127.0.0.1/admin', title: null, description: null, siteName: null },
    ]);
  });
});
