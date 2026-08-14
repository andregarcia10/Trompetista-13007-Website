'use strict';

// ===== utils.js =====
const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const debounce = (fn, delay = 150) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), delay);
  };
};
const throttle = (fn, limit = 100) => {
  let waiting = false;
  return (...args) => {
    if (waiting) return;
    fn(...args);
    waiting = true;
    window.setTimeout(() => { waiting = false; }, limit);
  };
};
const setBodyScroll = (locked) => document.body.classList.toggle('no-scroll', locked);

// ===== loader.js =====
function initLoader() {
  const loader = qs('#loader');
  if (!loader) return;
  const finish = () => {
    loader.classList.add('is-hidden');
    document.body.classList.add('is-loaded');
    window.setTimeout(() => loader.remove(), 700);
  };
  if (prefersReducedMotion()) return finish();
  if (document.readyState === 'complete') window.setTimeout(finish, 450);
  else window.addEventListener('load', () => window.setTimeout(finish, 450), { once: true });
}

// ===== navbar.js =====
function initNavbar() {
  const header = qs('#header');
  const menu = qs('#primary-menu');
  const toggle = qs('.navbar__toggle');
  if (!header || !menu || !toggle) return;

  const close = () => {
    menu.classList.remove('is-active');
    toggle.classList.remove('is-active');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menu');
    setBodyScroll(false);
  };

  toggle.addEventListener('click', () => {
    const open = !menu.classList.contains('is-active');
    menu.classList.toggle('is-active', open);
    toggle.classList.toggle('is-active', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    setBodyScroll(open);
  });

  qsa('.navbar__link', menu).forEach(link => link.addEventListener('click', close));
  document.addEventListener('keydown', event => event.key === 'Escape' && close());
  document.addEventListener('click', event => {
    if (menu.classList.contains('is-active') && !menu.contains(event.target) && !toggle.contains(event.target)) close();
  });
  window.addEventListener('resize', () => window.innerWidth > 960 && close());

  const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });
}

// ===== scroll.js =====
function initScroll() {
  const progress = qs('#scroll-progress');
  const backToTop = qs('#back-to-top');
  const hero = qs('#inicio');
  const sections = qsa('main section[id]');
  const links = qsa('.navbar__link[href^="#"]');

  qsa('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const id = link.getAttribute('href');
      if (!id || id === '#') return;
      const target = qs(id);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  const update = throttle(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const percentage = max > 0 ? (window.scrollY / max) * 100 : 0;
    if (progress) progress.style.width = `${percentage}%`;
    backToTop?.classList.toggle('is-visible', window.scrollY > 600);

    if (backToTop && hero) {
      const onFirstPage = window.innerWidth <= 700 &&
        window.scrollY < (hero.offsetTop + hero.offsetHeight - 1);
      backToTop.classList.toggle('is-first-page-mobile', onFirstPage);
    }

    let current = '';
    sections.forEach(section => {
      if (window.scrollY >= section.offsetTop - 180) current = section.id;
    });
    links.forEach(link => {
      const active = link.getAttribute('href') === `#${current}`;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }, 60);

  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
}

// ===== reveal.js =====
function initReveal() {
  const items = qsa('.reveal, [data-reveal]');
  if (!items.length) return;
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    items.forEach(item => item.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const delay = Number(entry.target.dataset.delay || 0);
      window.setTimeout(() => entry.target.classList.add('is-visible'), delay);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -45px' });
  items.forEach((item, index) => {
    if (!item.dataset.delay && item.parentElement?.children.length <= 8) item.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
    observer.observe(item);
  });
}

// ===== counters.js =====
function initCounters() {
  const counters = qsa('.counter[data-target]');
  const animate = element => {
    const target = Number(element.dataset.target || 0);
    const suffix = element.dataset.suffix || '';
    const prefix = element.dataset.prefix || '';
    if (prefersReducedMotion()) {
      element.textContent = `${prefix}${target.toLocaleString('pt-BR')}${suffix}`;
      return;
    }
    const duration = 1500;
    const start = performance.now();
    const frame = now => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = `${prefix}${Math.floor(target * eased).toLocaleString('pt-BR')}${suffix}`;
      if (progress < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };

  if (!('IntersectionObserver' in window)) return counters.forEach(animate);
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || entry.target.dataset.counted) return;
      entry.target.dataset.counted = 'true';
      animate(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.55 });
  counters.forEach(counter => observer.observe(counter));
}

// ===== hero.js =====
function initHero() {
  const hero = qs('.hero');
  const visual = qs('.hero__visual');
  const portrait = qs('.hero__portrait');
  const number = qs('.hero__number');
  if (!hero || !visual || prefersReducedMotion()) return;

  visual.addEventListener('pointermove', event => {
    const rect = visual.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / rect.width - 0.5, -0.5, 0.5);
    const y = clamp((event.clientY - rect.top) / rect.height - 0.5, -0.5, 0.5);
    if (portrait) portrait.style.transform = `translate3d(${x * 12}px, ${y * 8}px, 0)`;
    if (number) number.style.transform = `translate3d(${x * -20}px, ${y * -14}px, 0)`;
  });
  visual.addEventListener('pointerleave', () => {
    if (portrait) portrait.style.transform = '';
    if (number) number.style.transform = '';
  });

  window.addEventListener('scroll', () => {
    if (window.innerWidth < 961 || window.scrollY > hero.offsetHeight) return;
    visual.style.setProperty('--hero-scroll', `${window.scrollY * 0.08}px`);
  }, { passive: true });
}



// ===== hero-video-playlist.js =====
function initHeroVideoPlaylist() {
  const videos = qsa('[data-hero-video]');
  if (videos.length < 2) {
    videos[0]?.play().catch(() => {});
    return;
  }

  let current = 0;
  let switching = false;

  const activate = index => {
    if (switching) return;
    switching = true;

    const previous = videos[current];
    const next = videos[index];

    next.currentTime = 0;
    next.classList.add('is-active');
    next.play().catch(() => {});

    previous.classList.remove('is-active');

    window.setTimeout(() => {
      previous.pause();
      current = index;
      switching = false;
    }, 1100);
  };

  videos.forEach((video, index) => {
    video.addEventListener('ended', () => {
      if (index !== current) return;
      activate((current + 1) % videos.length);
    });

    video.addEventListener('error', () => {
      if (index !== current) return;
      activate((current + 1) % videos.length);
    });
  });

  videos[0].play().catch(() => {});
}
// ===== lightbox.js =====
function initLightbox() {
  const lightbox = qs('#lightbox');
  const image = qs('.lightbox__image', lightbox || document);
  const closeButton = qs('.lightbox__close', lightbox || document);
  const previousButton = qs('.lightbox__control--prev', lightbox || document);
  const nextButton = qs('.lightbox__control--next', lightbox || document);
  const caption = qs('.lightbox__caption', lightbox || document);
  if (!lightbox || !image) return { open: () => {} };

  const items = getGalleryItems();
  let current = 0;
  let previousFocus = null;

  const render = () => {
    const item = items[current];
    if (!item) return;
    image.src = item.src;
    image.alt = item.alt;
    if (caption) {
      caption.textContent = item.alt || '';
      caption.hidden = !item.alt;
    }
  };
  const close = () => {
    lightbox.classList.remove('is-active');
    lightbox.hidden = true;
    setBodyScroll(false);
    previousFocus?.focus();
  };
  const open = index => {
    if (!items[index]) return;
    previousFocus = document.activeElement;
    current = index;
    render();
    lightbox.hidden = false;
    requestAnimationFrame(() => lightbox.classList.add('is-active'));
    setBodyScroll(true);
    closeButton?.focus();
  };
  const move = direction => {
    current = (current + direction + items.length) % items.length;
    render();
  };

  closeButton?.addEventListener('click', close);
  previousButton?.addEventListener('click', () => move(-1));
  nextButton?.addEventListener('click', () => move(1));
  lightbox.addEventListener('click', event => event.target === lightbox && close());
  document.addEventListener('keydown', event => {
    if (lightbox.hidden) return;
    if (event.key === 'Escape') close();
    if (event.key === 'ArrowRight') move(1);
    if (event.key === 'ArrowLeft') move(-1);
  });

  let touchStart = 0;
  lightbox.addEventListener('touchstart', event => { touchStart = event.changedTouches[0].clientX; }, { passive: true });
  lightbox.addEventListener('touchend', event => {
    const delta = event.changedTouches[0].clientX - touchStart;
    if (Math.abs(delta) > 55) move(delta < 0 ? 1 : -1);
  }, { passive: true });

  return { open, close };
}

// ===== gallery.js =====
function getGalleryItems() {
  return qsa('[data-lightbox]').map(button => ({
    button,
    src: button.dataset.lightbox,
    alt: button.querySelector('img')?.alt || 'Imagem ampliada'
  }));
}

function initGallery(openLightbox) {
  getGalleryItems().forEach((item, index) => {
    item.button.addEventListener('click', () => openLightbox(index));
  });
}


// Texto do botão flutuante na última seção
function initWhatsappFloatText(){
  const text=document.getElementById('whatsapp-float-text');
  const footer=document.querySelector('.site-footer');
  const button=document.querySelector('.whatsapp-float');
  if(!text||!footer||!button) return;

  const observer=new IntersectionObserver(entries=>{
    const onLastPage=entries[0].isIntersecting;
    text.textContent='Fale com gente de verdade';
    button.classList.toggle('is-footer-centered', onLastPage);
  },{threshold:0.15});

  observer.observe(footer);
}



// ===== cola-eleitoral.js =====
function initVoterNote() {
  const form = qs('#voter-note-form');
  const printButtons = qsa('#voter-note-print, #voter-note-print-bottom');
  const clearButton = qs('#voter-note-clear');
  if (!form) return;

  qsa('input[inputmode="numeric"]', form).forEach(input => {
    input.addEventListener('input', () => {
      input.value = input.value.replace(/\D/g, '').slice(0, Number(input.maxLength) || undefined);
    });
  });

  clearButton?.addEventListener('click', () => {
    qsa('input:not([readonly])', form).forEach(input => { input.value = ''; });
    qs('input:not([readonly])', form)?.focus();
  });

  printButtons.forEach(button => {
    button.addEventListener('click', () => window.print());
  });
}



// ===== aviso-conteudo-visual.js =====
function initMediaAuthenticityNotice(){
  const notice = qs('#media-authenticity-notice');
  if(!notice) return;

  const watchedSections = [
    qs('#inicio'),
    qs('#trompetista-lula'),
    qs('#galeria'),
    qs('#midia')
  ].filter(Boolean);

  const visibleSections = new Set();

  const update = () => {
    const lightbox = qs('#lightbox');
    const lightboxOpen = lightbox && !lightbox.hidden && lightbox.classList.contains('is-active');
    const shouldShow = visibleSections.size > 0 || lightboxOpen;
    notice.classList.toggle('is-visible', shouldShow);
    notice.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
  };

  if('IntersectionObserver' in window){
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if(entry.isIntersecting) visibleSections.add(entry.target);
        else visibleSections.delete(entry.target);
      });
      update();
    }, { threshold: 0.18 });

    watchedSections.forEach(section => observer.observe(section));
  } else {
    visibleSections.add(watchedSections[0] || document.body);
    update();
  }

  const lightbox = qs('#lightbox');
  if(lightbox && 'MutationObserver' in window){
    const mutationObserver = new MutationObserver(update);
    mutationObserver.observe(lightbox, {
      attributes:true,
      attributeFilter:['class','hidden']
    });
  }

  update();
}



// ===== fotos-da-campanha-carousel.js =====
function initCampaignPhotosCarousel(){
  const carousel = qs('[data-campaign-carousel]');
  if(!carousel) return;

  const track = qs('[data-campaign-track]', carousel);
  const slides = qsa('.campaign-photos__slide', carousel);
  const prev = qs('[data-campaign-prev]', carousel);
  const next = qs('[data-campaign-next]', carousel);
  const currentLabel = qs('[data-campaign-current]', carousel);

  if(!track || !slides.length) return;

  let index = 0;
  let timer = null;

  const visibleCount = () => {
    if(window.innerWidth <= 700) return 1;
    if(window.innerWidth <= 960) return 2;
    return 3;
  };

  const maxIndex = () => Math.max(0, slides.length - visibleCount());

  const render = () => {
    index = clamp(index, 0, maxIndex());
    const step = 100 / visibleCount();
    track.style.transform = `translateX(-${index * step}%)`;
    if(currentLabel) currentLabel.textContent = String(index + 1);
    prev?.toggleAttribute('disabled', index === 0);
    next?.toggleAttribute('disabled', index === maxIndex());
  };

  const move = direction => {
    const max = maxIndex();
    if(direction > 0){
      index = index >= max ? 0 : index + 1;
    }else{
      index = index <= 0 ? max : index - 1;
    }
    render();
  };

  const stopAuto = () => {
    if(timer){
      window.clearInterval(timer);
      timer = null;
    }
  };

  const startAuto = () => {
    stopAuto();
    if(prefersReducedMotion()) return;
    timer = window.setInterval(() => move(1), 5200);
  };

  prev?.addEventListener('click', () => {
    move(-1);
    startAuto();
  });

  next?.addEventListener('click', () => {
    move(1);
    startAuto();
  });

  carousel.addEventListener('mouseenter', stopAuto);
  carousel.addEventListener('mouseleave', startAuto);
  carousel.addEventListener('focusin', stopAuto);
  carousel.addEventListener('focusout', startAuto);

  let touchStartX = 0;
  carousel.addEventListener('touchstart', event => {
    touchStartX = event.changedTouches[0].clientX;
    stopAuto();
  }, { passive:true });

  carousel.addEventListener('touchend', event => {
    const delta = event.changedTouches[0].clientX - touchStartX;
    if(Math.abs(delta) > 45) move(delta < 0 ? 1 : -1);
    startAuto();
  }, { passive:true });

  window.addEventListener('resize', debounce(render, 120));

  render();
  startAuto();
}




// ===== trompetista-do-lula-carousel.js =====
function initLulaCarousels(){
  qsa('[data-lula-carousel]').forEach(carousel=>{
    const track=qs('[data-lula-track]',carousel),slides=qsa('.lula-carousel__slide',carousel),prev=qs('[data-lula-prev]',carousel),next=qs('[data-lula-next]',carousel),label=qs('[data-lula-current]',carousel); if(!track||!slides.length)return; let index=0;
    const visible=()=>window.innerWidth<=700?Number(carousel.dataset.visibleMobile||1):window.innerWidth<=960?Number(carousel.dataset.visibleTablet||2):Number(carousel.dataset.visibleDesktop||3); const max=()=>Math.max(0,slides.length-visible());
    const pause=()=>qsa('video',carousel).forEach(v=>v.pause());
    const render=()=>{const n=visible();carousel.style.setProperty('--lula-visible',String(n));index=clamp(index,0,max());track.style.transform=`translateX(-${index*(100/n)}%)`;if(label)label.textContent=String(index+1);prev?.toggleAttribute('disabled',index===0);next?.toggleAttribute('disabled',index===max())};
    const isPhotoCarousel=slides.some(slide=>slide.classList.contains('lula-carousel__slide--photo')); let autoTimer=null;
    const stopAuto=()=>{if(autoTimer){clearInterval(autoTimer);autoTimer=null}};
    const startAuto=()=>{if(!isPhotoCarousel||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;stopAuto();autoTimer=setInterval(()=>{index=index>=max()?0:index+1;render()},4000)};
    const move=d=>{pause();index=clamp(index+d,0,max());render();if(isPhotoCarousel)startAuto()}; prev?.addEventListener('click',()=>move(-1));next?.addEventListener('click',()=>move(1)); let x=0;carousel.addEventListener('touchstart',e=>{x=e.changedTouches[0].clientX;if(isPhotoCarousel)stopAuto()},{passive:true});carousel.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-x;if(Math.abs(dx)>45)move(dx<0?1:-1);else if(isPhotoCarousel)startAuto()},{passive:true});qsa('video',carousel).forEach(v=>v.addEventListener('play',()=>qsa('video',document).forEach(o=>{if(o!==v)o.pause()})));if(isPhotoCarousel){carousel.addEventListener('mouseenter',stopAuto);carousel.addEventListener('mouseleave',startAuto);carousel.addEventListener('focusin',stopAuto);carousel.addEventListener('focusout',startAuto)}window.addEventListener('resize',debounce(render,120));render();startAuto();
  });
}




// ===== quem-sou-carousel.js =====
function initAboutCarousel(){
  const carousel = qs('[data-about-carousel]');
  if(!carousel) return;

  const track = qs('[data-about-track]', carousel);
  const slides = qsa('.about-carousel__slide', carousel);
  const prev = qs('[data-about-prev]', carousel);
  const next = qs('[data-about-next]', carousel);
  const currentLabel = qs('[data-about-current]', carousel);

  if(!track || !slides.length) return;

  let index = 0;
  let timer = null;

  const visibleCount = () => {
    if(window.innerWidth <= 700) return 1;
    if(window.innerWidth <= 960) return 2;
    return 3;
  };

  const maxIndex = () => Math.max(0, slides.length - visibleCount());

  const render = () => {
    const visible = visibleCount();
    index = clamp(index, 0, maxIndex());
    track.style.transform = `translateX(-${index * (100 / visible)}%)`;
    if(currentLabel) currentLabel.textContent = String(index + 1);
  };

  const move = direction => {
    const max = maxIndex();
    if(direction > 0){
      index = index >= max ? 0 : index + 1;
    }else{
      index = index <= 0 ? max : index - 1;
    }
    render();
  };

  const stopAuto = () => {
    if(timer){
      window.clearInterval(timer);
      timer = null;
    }
  };

  const startAuto = () => {
    stopAuto();
    if(prefersReducedMotion()) return;
    timer = window.setInterval(() => move(1), 4300);
  };

  prev?.addEventListener('click', () => {
    move(-1);
    startAuto();
  });

  next?.addEventListener('click', () => {
    move(1);
    startAuto();
  });

  carousel.addEventListener('mouseenter', stopAuto);
  carousel.addEventListener('mouseleave', startAuto);
  carousel.addEventListener('focusin', stopAuto);
  carousel.addEventListener('focusout', startAuto);

  let touchStartX = 0;
  carousel.addEventListener('touchstart', event => {
    touchStartX = event.changedTouches[0].clientX;
    stopAuto();
  }, { passive:true });

  carousel.addEventListener('touchend', event => {
    const delta = event.changedTouches[0].clientX - touchStartX;
    if(Math.abs(delta) > 45) move(delta < 0 ? 1 : -1);
    startAuto();
  }, { passive:true });

  window.addEventListener('resize', debounce(render, 120));

  render();
  startAuto();
}


// ===== app.js =====
function initLazyImages() {
  qsa('img[loading="lazy"]').forEach(image => {
    image.classList.add('lazy-image');
    const loaded = () => image.classList.add('is-loaded');
    image.complete ? loaded() : image.addEventListener('load', loaded, { once: true });
  });
}

function initApp() {
  initLoader();
  initNavbar();
  initScroll();
  initReveal();
  initCounters();
  initHero();
  initHeroVideoPlaylist();
  const lightbox = initLightbox();
  initGallery(lightbox.open);
  initLazyImages();
  initWhatsappFloatText();
  initVoterNote();
  initMediaAuthenticityNotice();
  initCampaignPhotosCarousel();
  initLulaCarousels();
  initAboutCarousel();
  const year = qs('#current-year');
  if (year) year.textContent = String(new Date().getFullYear());
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', initApp, { once: true })
  : initApp();
