import { AppException, toErrorResponse } from '@lib/common';
import { idToLabel, labelToId } from '@lib/database';
import { emailProvider } from './config';
import { isAncestorOrSelf } from './modules/authz/utils/unit-path';
import { ZeptoMailEmailSender } from './modules/notifications/providers/zeptomail.email-sender';
import { channelFor } from './modules/notifications/utils/channel-for';
import { escapeHtml } from './modules/notifications/utils/escape-html';
import { maskDestination } from './modules/notifications/utils/mask-destination';
import { parseFrom } from './modules/notifications/utils/parse-from';
import { pickSlug, slugify } from './modules/organizations/utils/slug';

describe('org unit paths', () => {
  it('round-trips ids through ltree labels', () => {
    const id = '0192f3a1-7c2b-7d4e-8f00-1234567890ab';
    expect(idToLabel(id)).not.toContain('-');
    expect(labelToId(idToLabel(id))).toBe(id);
  });

  it.each([
    ['a', 'a', true],
    ['a', 'a.b', true],
    ['a', 'a.b.c', true],
    ['a.b', 'a', false],
    ['a', 'ab', false],
    ['a.b', 'a.c', false],
  ])('%s covers %s → %s', (ancestor, path, expected) => expect(isAncestorOrSelf(ancestor, path)).toBe(expected));
});

describe('notifications', () => {
  it('masks destinations', () => {
    expect(maskDestination('email', 'ada@example.com')).toBe('a***@example.com');
    expect(maskDestination('sms', '+2348012345678')).toBe('+234*******678');
  });

  it('routes by identifier', () => {
    expect(channelFor('a@b.co')).toBe('email');
    expect(channelFor('+2348012345678')).toBe('sms');
  });

  it('picks the email provider from the credentials present', () => {
    expect(emailProvider({ RESEND_API_KEY: 're_123456789', ZEPTOMAIL_TOKEN: undefined, EMAIL_PROVIDER: undefined })).toBe('resend');
    expect(emailProvider({ RESEND_API_KEY: undefined, ZEPTOMAIL_TOKEN: 'zepto-token', EMAIL_PROVIDER: undefined })).toBe('zeptomail');
    expect(emailProvider({ RESEND_API_KEY: 're_123456789', ZEPTOMAIL_TOKEN: 'zepto-token', EMAIL_PROVIDER: 'zeptomail' })).toBe('zeptomail');
    expect(emailProvider({ RESEND_API_KEY: undefined, ZEPTOMAIL_TOKEN: undefined, EMAIL_PROVIDER: undefined })).toBe('console');
  });

  it('parses the From header', () => {
    expect(parseFrom('The African Dream Lab <no-reply@theafricandreamlab.com>')).toEqual({
      name: 'The African Dream Lab',
      address: 'no-reply@theafricandreamlab.com',
    });
    expect(parseFrom('no-reply@theafricandreamlab.com')).toEqual({ name: null, address: 'no-reply@theafricandreamlab.com' });
  });

  it('escapes HTML in templated values', () => {
    expect(escapeHtml('<script>"x"&\'y\'</script>')).toBe('&lt;script&gt;&quot;x&quot;&amp;&#39;y&#39;&lt;/script&gt;');
  });

  it('sends ZeptoMail requests in the documented shape, prefix added once', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(new Response('{}', { status: 201 }));
    await new ZeptoMailEmailSender('abc123token', 'Lab <no-reply@x.com>', 'https://api.zeptomail.com/v1.1/email').send({
      to: 'ada@example.com',
      subject: 's',
      text: 't',
      html: '<p>h</p>',
    });
    const [, init] = fetchMock.mock.calls[0]!;
    expect((init!.headers as Record<string, string>).authorization).toBe('Zoho-enczapikey abc123token');
    expect(JSON.parse(init!.body as string)).toMatchObject({
      from: { address: 'no-reply@x.com', name: 'Lab' },
      to: [{ email_address: { address: 'ada@example.com' } }],
      htmlbody: '<p>h</p>',
    });
    fetchMock.mockRestore();
  });
});

describe('error responses', () => {
  it('keeps stable codes', () => {
    expect(toErrorResponse(new AppException(409, 'last_admin', 'x'))).toMatchObject({ statusCode: 409, code: 'last_admin', error: 'Conflict' });
  });

  it('never leaks internal errors', () => {
    expect(toErrorResponse(new Error('db password is hunter2'))).toEqual({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Internal server error',
      code: 'internal_error',
    });
  });
});


describe('organisation slugs', () => {
  it.each([
    ['Lagos Business School', 'lagos-business-school'],
    ['Ọ̀yọ́ Tech Hub', 'oyo-tech-hub'],
    ['Smith & Sons Ltd.', 'smith-and-sons-ltd'],
    ['  --Acme!!  ', 'acme'],
    ['AI', 'ai-org'],
    ['API', 'api-org'],
    ['@@@', 'org'],
  ])('%s → %s', (name, expected) => expect(slugify(name)).toBe(expected));

  it('stays within the subdomain limit', () => {
    expect(slugify('x'.repeat(200)).length).toBeLessThanOrEqual(57);
  });

  it('suffixes when the name is taken', async () => {
    const taken = new Set(['acme', 'acme-2']);
    await expect(pickSlug('Acme', async (c) => new Set(c.filter((s) => taken.has(s))))).resolves.toBe('acme-3');
    await expect(pickSlug('Fresh Co', async () => new Set())).resolves.toBe('fresh-co');
  });
});
