# capture-bridge.py - turn the saved The Bridge HTML (crawl/bridge/*.html) into src/content/pages/<slug>.json.
# Text is kept as the source has it; only whitespace is normalised. Run: python -X utf8 -I tools/capture-bridge.py
# Each page: { slug, path, oldPath, title, description, h1, sections: [ { cls, id, blocks: [ {tag, cls, text, href, src, alt, ...} ] } ] }
# A block is the smallest element that holds text, an image, a frame or a form control. `group` names the nearest
# repeating container class (category-card, product-card, press card ...) so templates can rebuild the cards.
import html
import json
import os
import re
import sys
from html.parser import HTMLParser

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SRC = os.path.join(ROOT, 'crawl', 'bridge')
OUT = os.path.join(ROOT, 'src', 'content', 'pages')

PAGES = [
    ('home', 'bridge-home.html', '/', '/home.html'),
    ('about-us', 'about_us.html', '/about-us/', '/about_us.html'),
    ('facts', 'facts.html', '/facts/', '/facts.html'),
    ('events', 'events.html', '/events/', '/events.html'),
    ('media', 'media.html', '/media/', '/media.html'),
    ('contact', 'contact.html', '/contact/', '/contact.html'),
    ('shop', 'shop.html', '/shop/', '/shop.html'),
    ('age-gate', 'index.html', None, '/index.html'),
    ('blocked', 'blocked.html', None, '/blocked.html'),
]
VOID = {'img', 'br', 'hr', 'input', 'meta', 'link', 'source', 'wbr', 'area', 'base', 'col', 'embed', 'param', 'track'}
SKIP = {'script', 'style', 'noscript', 'svg', 'head'}
INLINE = {'span', 'strong', 'em', 'b', 'i', 'u', 'small', 'sup', 'sub', 'mark', 'abbr', 'br', 'wbr', 'code', 'time', 'font'}


class Node:
    def __init__(self, tag, attrs=None, parent=None):
        self.tag, self.attrs, self.parent = tag, dict(attrs or []), parent
        self.children = []

    @property
    def cls(self):
        return self.attrs.get('class', '') or ''


class Tree(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node('root')
        self.cur = self.root
        self.skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in SKIP or self.skip:
            if tag not in VOID:
                self.skip += 1
            return
        n = Node(tag, attrs, self.cur)
        self.cur.children.append(n)
        if tag not in VOID:
            self.cur = n

    def handle_startendtag(self, tag, attrs):
        if tag in SKIP or self.skip:
            return
        self.cur.children.append(Node(tag, attrs, self.cur))

    def handle_endtag(self, tag):
        if self.skip:
            if tag not in VOID:
                self.skip -= 1
            return
        if tag in VOID:
            return
        n = self.cur
        while n is not self.root and n.tag != tag:
            n = n.parent
        if n is not self.root:
            self.cur = n.parent

    def handle_data(self, data):
        if self.skip or not data.strip():
            return
        self.cur.children.append(data)


def text_of(n):
    out = []
    for c in n.children:
        if isinstance(c, str):
            out.append(c)
        elif c.tag == 'br':
            out.append(' ')
        else:
            out.append(text_of(c))
            if c.tag == 'span':
                out.append(' ')
    return ''.join(out)


def clean(s):
    s = re.sub(r'\s+', ' ', html.unescape(s)).strip()
    s = re.sub(r'\s+([.,;:!?])', r'\1', s)
    return s


def has_block_kids(n):
    for c in n.children:
        if isinstance(c, str):
            continue
        if c.tag not in INLINE:
            return True
        if has_block_kids(c):
            return True
    return False


REPEATERS = re.compile(r'(card|item|tile|benefit|effect|myth|faq|accordion|pillar|stat|slide|chip|row)\b', re.I)


def walk(n, blocks, ctx):
    for c in n.children:
        if isinstance(c, str):
            t = clean(c)
            if t:
                b = {'tag': n.tag, 'cls': n.cls, 'text': t}
                b.update(ctx)
                blocks.append(b)
            continue
        tag = c.tag
        if tag == 'img':
            b = {'tag': 'img', 'cls': c.cls, 'src': c.attrs.get('src', ''), 'alt': clean(c.attrs.get('alt', ''))}
            b.update(ctx)
            blocks.append(b)
            continue
        if tag == 'iframe':
            b = {'tag': 'iframe', 'src': c.attrs.get('src', ''), 'frameTitle': clean(c.attrs.get('title', ''))}
            b.update(ctx)
            blocks.append(b)
            continue
        if tag in ('input', 'textarea'):
            b = {'tag': tag, 'type': c.attrs.get('type', ''), 'name': c.attrs.get('name', ''), 'placeholder': clean(c.attrs.get('placeholder', ''))}
            b.update(ctx)
            blocks.append(b)
            continue
        if tag == 'select':
            b = {'tag': 'select', 'items': [clean(text_of(o)) for o in c.children if not isinstance(o, str) and o.tag == 'option']}
            b.update(ctx)
            blocks.append(b)
            continue
        next_ctx = dict(ctx)
        if tag == 'a':
            next_ctx['href'] = c.attrs.get('href', '')
        m = REPEATERS.search(c.cls)
        if m and tag not in ('a', 'span', 'p', 'h1', 'h2', 'h3', 'h4'):
            next_ctx['group'] = c.cls.split()[0]
        if has_block_kids(c) or tag in ('div', 'section', 'ul', 'ol', 'article', 'header', 'main', 'aside', 'figure', 'form', 'nav', 'footer', 'table', 'tbody', 'thead', 'tr') and any(not isinstance(k, str) and k.tag not in INLINE for k in c.children):
            walk(c, blocks, next_ctx)
            continue
        t = clean(text_of(c))
        kids_img = [k for k in c.children if not isinstance(k, str) and k.tag == 'img']
        for k in kids_img:
            b = {'tag': 'img', 'cls': k.cls, 'src': k.attrs.get('src', ''), 'alt': clean(k.attrs.get('alt', ''))}
            b.update(next_ctx)
            blocks.append(b)
        if t or tag == 'a':
            b = {'tag': tag, 'cls': c.cls, 'text': t}
            b.update(next_ctx)
            blocks.append(b)


def find(n, tag):
    for c in n.children:
        if isinstance(c, str):
            continue
        if c.tag == tag:
            return c
        r = find(c, tag)
        if r:
            return r
    return None


def main():
    os.makedirs(OUT, exist_ok=True)
    for slug, f, path, old in PAGES:
        raw = open(os.path.join(SRC, f), encoding='utf8', errors='replace').read()
        title = re.search(r'<title>(.*?)</title>', raw, re.S)
        desc = re.search(r'<meta name="description"\s+content="(.*?)"', raw, re.S)
        t = Tree()
        t.feed(raw)
        body = find(t.root, 'body') or t.root
        sections = []
        loose = None
        for c in body.children:
            if isinstance(c, str):
                continue
            if c.tag == 'nav':  # the site header: rebuilt from the IA
                continue
            blocks = []
            walk(Node('wrap', [], None) if False else _wrap(c), blocks, {})
            if not blocks:
                continue
            sections.append({'tag': c.tag, 'cls': c.cls, 'id': c.attrs.get('id', ''), 'blocks': blocks})
        sections = [x for x in sections if x['tag'] != 'footer']
        if slug == 'home':
            modal = [x for x in sections if 'modal' in x['cls']]
            sections = [x for x in sections if 'modal' not in x['cls']]
            with open(os.path.join(ROOT, 'facts', 'grand-opening-modal.json'), 'w', encoding='utf8') as fh:
                json.dump(modal, fh, ensure_ascii=False, indent=1)
        if slug == 'events':
            mp = os.path.join(ROOT, 'facts', 'grand-opening-modal.json')
            if os.path.exists(mp):
                for x in json.load(open(mp, encoding='utf8')):
                    x['movedFrom'] = 'home popup'
                    sections.append(x)
        h1 = ''
        for s in sections:
            for b in s['blocks']:
                if b.get('tag') == 'h1':
                    h1 = b.get('text', '')
                    break
            if h1:
                break
        for s_ in sections:
            for b in s_['blocks']:
                if b.get('tag') == 'h1':
                    b['type'] = 'h1'
        # the age gate and blocked screens are not pages: site.json carries their text, the raw capture stays in facts/
        if path is None:
            os.makedirs(os.path.join(ROOT, 'facts', 'captured'), exist_ok=True)
            with open(os.path.join(ROOT, 'facts', 'captured', slug + '.json'), 'w', encoding='utf8') as fh:
                json.dump({'slug': slug, 'oldPath': old, 'title': clean(title.group(1)) if title else '', 'sections': sections}, fh, ensure_ascii=False, indent=1)
            print(f'{slug}: captured to facts/captured')
            continue
        rec = {
            'slug': slug, 'path': path, 'oldPath': old,
            'title': clean(title.group(1)) if title else '',
            'description': clean(desc.group(1)) if desc else '',
            'h1': h1,
            'sections': sections,
        }
        with open(os.path.join(OUT, slug + '.json'), 'w', encoding='utf8') as fh:
            json.dump(rec, fh, ensure_ascii=False, indent=1)
        n = sum(len(s['blocks']) for s in sections)
        w = sum(len((b.get('text') or '').split()) for s in sections for b in s['blocks'])
        print(f'{slug}: {len(sections)} sections, {n} blocks, {w} words, h1={h1!r}')


def _wrap(c):
    w = Node('wrap')
    w.children = [c]
    return w


if __name__ == '__main__':
    main()
