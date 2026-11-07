"""Fetch small, self-hosted Noto greeting subsets and their licenses."""
from pathlib import Path
import re
import urllib.parse
import urllib.request

root = Path(__file__).resolve().parents[1]
fonts = [
    ('Noto Sans JP', '\u3053\u3093\u306b\u3061\u306f', 'japanese', 'notosansjp'),
    ('Noto Sans Kannada', '\u0ca8\u0cae\u0cb8\u0ccd\u0c95\u0cbe\u0cb0', 'kannada', 'notosanskannada'),
    ('Noto Sans Devanagari', '\u0928\u092e\u0938\u094d\u0924\u0947', 'hindi', 'notosansdevanagari'),
]
def fetch(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'})
    return urllib.request.urlopen(request, timeout=30).read()

notices = []
for family, text, name, license_name in fonts:
    css_url = 'https://fonts.googleapis.com/css2?' + urllib.parse.urlencode({'family': family + ':wght@400', 'text': text, 'display': 'swap'})
    css = fetch(css_url).decode()
    url = re.search(r'url\((https://[^)]+)\)', css).group(1)
    data = fetch(url)
    assert data[:4] == b'wOF2', f'Expected WOFF2 for {family}'
    filename = f'noto-sans-{name}-greeting.woff2'
    (root / 'public' / 'fonts' / filename).write_bytes(data)
    license_url = f'https://raw.githubusercontent.com/google/fonts/main/ofl/{license_name}/OFL.txt'
    license_text = fetch(license_url).decode()
    assert 'SIL OPEN FONT LICENSE' in license_text
    notices.append(f'\n============================================================\n{family}\nFile: fonts/{filename}\nRetrieved: 2026-11-07\nSource: {url}\nStylesheet: {css_url}\nLicense source: {license_url}\n\n{license_text}')
    print(f'{filename}: {len(data)} bytes; WOFF2 and OFL verified')

notice_file = root / 'public' / 'FONT-NOTICES.txt'
old = notice_file.read_text(encoding='utf-8')
notice_file.write_text(old + '\n'.join(notices), encoding='utf-8')
