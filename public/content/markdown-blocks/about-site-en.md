---
id: about-site-en
title: About This Website
---

This website is supposed to be a humble showcase of my skills and some Ember features.

It leverages the following technologies:

*   All pages are prerendered into static HTML and display immediately on page load. All links behave like regular HTML links. When the Ember app loads, it takes control, turning the website into an SPA. This is possible thanks to [FastBoot](https://ember-fastboot.com) and [robwebdev/ember-cli-staticboot](https://github.com/robwebdev/ember-cli-staticboot).

*   Internationalization (i18n): the website is available in two languages. UI labels, content and dates are translated. For translating UI, I use [jamesarosen/ember-i18n](https://github.com/jamesarosen/ember-i18n).

*   Responsive Web Design is coded with the [lolmaus/breakpoint-slicer](https://github.com/lolmaus/breakpoint-slicer) Sass lib. It allows defining responsive rules effortlessly. I would use [lolmaus/ember-element-query](https://github.com/lolmaus/ember-element-query) for granular control, but element queries require JS which is not available in StaticBoot.

*   During build, the website is hitting GitHub and StackOverflow API to collect stats. As both services severely limit API usage, the app won't download stats if they're available from FastBoot.

*   GitHub authentication is implemented: logging in lets you star/unstar projects from the app.

*   Content is stored as Markdown with [Front Matter](https://jekyllrb.com/docs/frontmatter/). Carefully overridden adapters and serializers are used to work with endpoints and data formats.

*   I couldn't use [offirgolan/ember-burger-menu](https://github.com/offirgolan/ember-burger-menu) because its menu is unavailable while app is still loading. So I googled a bit and implemented an off-screen menu with pure CSS. It has some restrictions, but overall result is super sleek!

Website source is available on GitHub: [lolmaus/lolma.us](https://github.com/lolmaus/lolma.us).
