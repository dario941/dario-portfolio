"""Create the two static, independently readable case-study documents."""
from pathlib import Path
from html import escape

root = Path(__file__).resolve().parents[1]
projects = [
    dict(slug='crizpo', number='03', title='CRIZPO', heading='CRIZPO.', industry='Restaurant / Food & Beverage', location='Saudi Arabia', role='Website Design, Frontend Development & Deployment', url='https://www.crizpoksa.com', domain='crizpoksa.com',
         intro='A vibrant, bilingual restaurant website with engaging food visuals, smooth interactions, and a seamless mobile-first experience.',
         headline='Food, brought to life.',
         overview='Designed, developed, and launched on-site in Saudi Arabia, CRIZPO is a modern restaurant website built around immersive food storytelling. The experience combines engaging product visuals, animated sections, responsive layouts, and accessible navigation to create a memorable digital experience for customers.',
         approach=[('Let the food lead.', 'Bold typography and expressive food imagery establish the restaurant’s identity. Animated sections guide the journey from the first impression to the menu, with clear routes to discover dishes and get in touch.'),
                   ('Make every screen feel considered.', 'English and Arabic content, responsive layouts, and touch-friendly navigation bring the experience to smaller screens. WhatsApp integration gives customers a direct way to contact the restaurant.')],
         features=['Responsive, mobile-first interface', 'English and Arabic language support', 'Scroll-driven food animations', 'Animated hero and interactive sections', 'Branded visual identity', 'WhatsApp integration', 'Smooth navigation and transitions', 'Production deployment'],
         desktop_alt='The live CRIZPO homepage with bold Crispy Starts Here typography and broasted chicken imagery.',
         detail_alt='CRIZPO’s broast section, with product imagery, regular and spicy options, and menu navigation.',
         mobile_alt='The live CRIZPO mobile homepage, showing bilingual navigation, food imagery, and easy-to-reach menu and contact actions.',
         detail_caption='Food storytelling, from the hero to the menu.', tech=['React', 'HTML', 'CSS', 'JavaScript']),
    dict(slug='ar-engineerings', number='04', title='AR Engineerings', heading='<span>AR</span><span>ENGINEERINGS.</span>', industry='Industrial / Engineering / Construction', location='Yanbu, Saudi Arabia', role='Website Design, Development, SEO & Deployment', url='https://www.ar-eng.net', domain='ar-eng.net',
         intro='A bilingual corporate platform showcasing industrial expertise, engineering services, and construction capabilities through cinematic visuals and structured storytelling.',
         headline='Engineering, clearly communicated.',
         overview='Designed, developed, and deployed on-site in Saudi Arabia, the AR Engineerings website delivers a professional digital presence for an industrial and construction services company. The platform combines cinematic industrial visuals, bilingual content, carefully structured service pages, and modern interactions to communicate technical expertise and corporate credibility.',
         approach=[('Give expertise a clear structure.', 'A cinematic industrial hero introduces the company’s capabilities. Structured service pages, leadership information, and client sections help visitors explore the organisation and find the right point of contact.'),
                   ('Build for two languages and every screen.', 'English and Arabic localisation includes right-to-left layouts and responsive navigation. The delivery includes performance optimisation, technical SEO, structured metadata, Cloudflare integration, and production deployment.')],
         features=['Cinematic industrial hero video', 'English and Arabic localisation', 'RTL layout support', 'Responsive corporate interface', 'Industrial service showcases', 'Leadership and client sections', 'Performance optimisation', 'Technical SEO and structured metadata', 'Cloudflare integration', 'Production deployment'],
         desktop_alt='The live AR Engineering homepage featuring industrial video imagery and the Built on expertise, Powered by people headline.',
         detail_alt='AR Engineering’s service overview with manpower supply, industrial services, and equipment resources.',
         mobile_alt='The live AR Engineering mobile homepage with its industrial hero, language switcher, and project enquiry action.',
         detail_caption='A clear view of industrial services and capabilities.', tech=['React', 'HTML', 'CSS', 'JavaScript', 'Cloudflare'])
]
arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>'
back = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m14 6-6 6 6 6M8 12h12"/></svg>'
def live_link(p):
    return f'<a class="project-action" href="{p["url"]}" target="_blank" rel="noopener noreferrer" aria-label="Visit {escape(p["title"])} live website (opens in a new tab)"><span class="project-link-motion">Visit live website {arrow}</span></a>'

for index, p in enumerate(projects):
    other = projects[1 - index]
    approach = ''.join(f'<li data-case-reveal><span class="case-eyebrow">0{i+1}</span><div><h3>{escape(title)}</h3><p>{escape(copy)}</p></div></li>' for i, (title, copy) in enumerate(p['approach']))
    features = ''.join(f'<li>{escape(feature)}</li>' for feature in p['features'])
    tech = ''.join(f'<li>{escape(name)}</li>' for name in p['tech'])
    facts = ''.join(f'<div><dt>{label}</dt><dd>{escape(value)}</dd></div>' for label, value in [('Industry', p['industry']), ('Location', p['location']), ('My role', p['role']), ('Delivery', 'On-site client project')])
    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#f2f1e9">
  <title>{escape(p['title'])} — Selected Work by Dario Martin Monteiro</title>
  <meta name="description" content="{escape(p['intro'])} Designed and delivered on-site in Saudi Arabia by Dario Martin Monteiro.">
  <meta property="og:title" content="{escape(p['title'])} — Dario Martin Monteiro">
  <meta property="og:description" content="{escape(p['intro'])}">
  <meta property="og:type" content="article">
  <meta property="og:image" content="/projects/{p['slug']}-desktop.webp">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%231d352c'/%3E%3Ctext x='12' y='47' font-family='Arial,sans-serif' font-weight='700' font-size='43' fill='%23f2f1e9'%3ED%3C/text%3E%3C/svg%3E">
  <link rel="preload" href="/fonts/manrope-latin-variable.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/fonts/dm-sans-latin-variable.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/fonts.css">
  <link rel="stylesheet" href="/project-detail.css">
</head>
<body data-project="{p['slug']}">
  <a class="case-skip" href="#main">Skip to project</a>
  <header class="case-header case-container">
    <a class="case-brand" href="/" aria-label="Dario — home">DARIO.</a>
    <a class="case-back" href="/#work">{back} All selected work</a>
  </header>
  <main id="main">
    <section class="case-heading case-container" aria-labelledby="project-heading">
      <p class="case-eyebrow" data-case-reveal><span>{p['number']} / Selected work</span><span>On-site client project</span></p>
      <h1 id="project-heading" data-case-reveal>{p['heading']}</h1>
      <div class="case-introduction" data-case-reveal>
        <p>{escape(p['intro'])}</p>
        {live_link(p)}
      </div>
      <dl class="case-facts" data-case-reveal>{facts}</dl>
    </section>
    <figure class="case-cover case-container">
      <div class="case-image" data-case-image><img src="/projects/{p['slug']}-desktop.webp" width="1440" height="1000" alt="{escape(p['desktop_alt'])}" fetchpriority="high" decoding="async"></div>
      <figcaption><span>{escape(p['title'])} / Desktop experience</span><span>{p['domain']}</span></figcaption>
    </figure>
    <section class="case-section case-container" aria-labelledby="overview-heading">
      <p class="case-eyebrow" data-case-reveal>01 / The project</p>
      <div data-case-reveal><h2 id="overview-heading">{escape(p['headline'])}</h2><p class="case-copy">{escape(p['overview'])}</p></div>
    </section>
    <section class="case-section case-container" aria-labelledby="approach-heading">
      <p class="case-eyebrow" data-case-reveal>02 / The approach</p>
      <div><h2 id="approach-heading" data-case-reveal>Design with purpose.<br>Built with care.</h2><ol class="case-approach">{approach}</ol></div>
    </section>
    <section class="case-gallery" aria-labelledby="screens-heading">
      <div class="case-container">
        <div class="case-gallery-heading" data-case-reveal><h2 id="screens-heading">Across screens.</h2><p class="case-eyebrow">Desktop &amp; mobile</p></div>
        <div class="case-responsive">
          <figure><div class="case-image" data-case-image><img src="/projects/{p['slug']}-detail.webp" width="1440" height="1000" loading="lazy" decoding="async" alt="{escape(p['detail_alt'])}"></div><figcaption>{escape(p['detail_caption'])}</figcaption></figure>
          <figure class="case-phone"><div class="case-image" data-case-image><img src="/projects/{p['slug']}-mobile.webp" width="430" height="932" loading="lazy" decoding="async" alt="{escape(p['mobile_alt'])}"></div><figcaption>Designed for the smaller screen.</figcaption></figure>
        </div>
      </div>
    </section>
    <section class="case-section case-container" aria-labelledby="features-heading">
      <p class="case-eyebrow" data-case-reveal>03 / In the details</p>
      <div data-case-reveal><h2 id="features-heading">What went into it.</h2><ul class="case-features">{features}</ul></div>
    </section>
    <section class="case-section case-container" aria-labelledby="technology-heading">
      <p class="case-eyebrow" id="technology-heading" data-case-reveal>04 / Technologies</p>
      <ul class="case-tech" data-case-reveal>{tech}</ul>
    </section>
    <section class="case-launch" aria-labelledby="live-heading">
      <div class="case-container" data-case-reveal><div><p class="case-eyebrow">Designed. Developed. Delivered.</p><h2 id="live-heading">Experience the live website.</h2></div>{live_link(p)}</div>
    </section>
  </main>
  <footer class="case-footer case-container">
    <p class="case-eyebrow">Next project / {other['number']}</p>
    <a class="case-next" href="/projects/{other['slug']}/"><span>{escape(other['title'])}</span>{arrow}</a>
    <div class="case-footer-bottom"><a href="/#work">All selected work</a><a href="mailto:dariomartinmonteiro@gmail.com">Have a project in mind? Let’s talk ↗</a><span>© 2026 Dario Martin Monteiro</span></div>
  </footer>
  <script type="module" src="/project-detail.js"></script>
</body>
</html>
'''
    destination = root / 'projects' / p['slug'] / 'index.html'
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(html, encoding='utf-8')
    print(destination)
