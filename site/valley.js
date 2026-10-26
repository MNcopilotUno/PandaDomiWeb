// Panda Domi landing page: the play.
// Optional by design: without this script every section still reads and its
// controls stay hidden, so nothing on the page is ever a dead button.
// It makes no network request and stores nothing: every picture it shows is
// already on this site, and every state lives only in this page until it closes.
(() => {
  'use strict';

  const grove = document.querySelector('.pd-grove');
  if (!grove) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const art = (id) => `art/${id}.webp`;
  const reveal = (el) => el.removeAttribute('hidden');
  // With reduced motion the CSS drops animations, so waits shrink to nothing.
  const later = (ms, fn) => window.setTimeout(fn, reduceMotion.matches ? 0 : ms);
  // Restart a one-shot CSS animation class on an element.
  const replay = (el, cls) => {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  };

  openingScene(grove.querySelector('.pd-hero'));
  tryIt(grove.querySelector('.pd-try'));
  feedTheCub(grove.querySelector('.pd-feed'));
  path(grove.querySelector('.pd-path'));
  bedtime(grove.querySelector('.pd-night'));

  // ---------- The opening scene: day and night, the shy panda, a little depth ----------

  function openingScene(hero) {
    const toggle = hero.querySelector('.pd-daynight');
    const label = toggle.querySelector('.pd-daynight-label');
    const nightLayers = [...hero.querySelectorAll('img[data-src]')];

    // The night paintings load only when someone asks for the night.
    toggle.addEventListener('click', async () => {
      const toNight = hero.dataset.time !== 'night';
      if (toNight && nightLayers.some((img) => img.dataset.src)) {
        toggle.disabled = true;
        nightLayers.forEach((img) => {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        });
        await Promise.all(
          nightLayers.map((img) => img.decode().catch((err) => console.warn('A night layer did not load:', img.src, err))),
        );
        toggle.disabled = false;
      }
      hero.dataset.time = toNight ? 'night' : 'day';
      label.textContent = toNight ? 'Morning' : 'Bedtime';
    });
    reveal(toggle);

    // Tap the shy panda: it ducks behind the tree, then peeks out again.
    const peek = hero.querySelector('.pd-peek');
    const hello = hero.querySelector('.pd-peek-hit');
    let peekAgain = 0;
    hello.addEventListener('click', () => {
      peek.classList.add('is-awake', 'is-hiding');
      window.clearTimeout(peekAgain);
      peekAgain = later(1400, () => peek.classList.remove('is-hiding'));
    });
    reveal(hello);

    // The far layers drift a little slower than the page as it scrolls.
    const depths = [...hero.querySelectorAll('.pd-depth')];
    let queued = false;
    const drift = () => {
      queued = false;
      const y = reduceMotion.matches ? 0 : Math.min(window.scrollY, hero.offsetHeight);
      for (const layer of depths) {
        layer.style.transform = y ? `translate3d(0, ${Math.round(y * Number(layer.dataset.depth))}px, 0)` : '';
      }
    };
    window.addEventListener(
      'scroll',
      () => {
        if (!queued) {
          queued = true;
          window.requestAnimationFrame(drift);
        }
      },
      { passive: true },
    );
    reduceMotion.addEventListener('change', drift);
  }

  // ---------- Try it: a moment becomes a card, a keepsake, and a little more cub ----------

  function tryIt(section) {
    // The card templates as the game has them: title, the cub's art, the den keepsake.
    const MOMENTS = {
      'first-steps': { title: 'First steps!', text: 'Three wobbly steps from the sofa to the cat.', art: 'cub-walking', keepsake: 'tiny-footprints' },
      'first-smile': { title: 'A first smile', text: 'At the cat, of course.', art: 'cub-smiling', keepsake: 'sun-drawing' },
      'first-word': { title: 'A first word', text: '“Bah!” It means banana. Probably.', art: 'cub-speaking', keepsake: 'wooden-blocks' },
      'funny-moment': { title: 'That made us laugh', text: 'Tried to feed the cat a sock. The cat said no.', art: 'cub-tumble', keepsake: 'paper-crown' },
      'child-said': { title: 'What they said', text: '“The moon is following our car.”', art: 'cub-speaking', keepsake: 'speech-bubble-note' },
      'new-food': { title: 'Tried something new', text: 'Blueberries: suspicious, then delicious.', art: 'cub-eating', keepsake: 'berry-bowl' },
      'slept-through': { title: 'Slept through the night', text: 'Everyone did. Even the cat.', art: 'cub-newborn-sleeping', keepsake: 'moon-lantern' },
      'sweet-moment': { title: 'A sweet moment', text: 'A hug for no reason at all.', art: 'big-panda-with-cub', keepsake: 'rhododendron-flower' },
    };
    // How the cub grows. In the app, growth follows the moments you share over months;
    // here every share moves it on a stage.
    const STAGES = [
      { art: 'cub-newborn-sleeping', words: 'A tiny cub, fast asleep in the moss.' },
      { art: 'cub-awake', words: 'Eyes open: the cub looks around the den.' },
      { art: 'cub-walking', words: 'First wobbly steps across the den.' },
      { art: 'cub-young', words: 'Young and curious about everything.' },
      { art: 'cub-climbing', words: 'Climbing the tree by the door.' },
      { art: 'cub-own-den', words: 'Grown up, with a den of its own nearby.' },
    ];

    const card = section.querySelector('.pd-card');
    const cardArt = card.querySelector('.pd-card-art');
    const cardKeepsake = card.querySelector('.pd-card-keepsake');
    const cardTitle = card.querySelector('.pd-card-title');
    const cardText = card.querySelector('.pd-card-text');
    const chips = [...section.querySelectorAll('.pd-chip')];
    const share = section.querySelector('.pd-share');
    const again = section.querySelector('.pd-again');
    const cub = section.querySelector('.pd-den-cub');
    const stageWords = section.querySelector('.pd-den-stage');
    const slots = [...section.querySelectorAll('.pd-shelf li')];

    let moment = 'first-steps';
    let shared = 0;
    let landing = 0; // the share in flight, so "Start again" can call it back

    const showCard = (id) => {
      const m = MOMENTS[id];
      cardArt.src = art(m.art);
      cardKeepsake.src = art(m.keepsake);
      cardTitle.textContent = m.title;
      cardText.textContent = m.text;
    };

    const showStage = (n, announce = '') => {
      const s = STAGES[Math.min(n, STAGES.length - 1)];
      cub.src = art(s.art);
      replay(cub, 'is-growing');
      stageWords.textContent = announce + s.words;
    };

    for (const chip of chips) {
      chip.addEventListener('click', () => {
        moment = chip.dataset.moment;
        chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
        card.classList.add('is-flipping');
        later(220, () => {
          showCard(moment);
          card.classList.remove('is-flipping');
        });
      });
    }

    share.addEventListener('click', () => {
      share.disabled = true;
      card.classList.remove('is-arriving');
      replay(card, 'is-sending');
      landing = later(750, () => {
        const m = MOMENTS[moment];
        const slot = slots.find((s) => s.dataset.keepsake === moment);
        const isNew = !slot.classList.contains('is-placed');
        slot.classList.add('is-placed');
        shared += 1;
        const keepsakeName = slot.querySelector('img').alt.split(',')[0];
        showStage(shared, `${m.title} Shared. ${isNew ? `${keepsakeName} went on the shelf. ` : ''}`);
        card.classList.remove('is-sending');
        replay(card, 'is-arriving');
        share.disabled = false;
        reveal(again);
      });
    });

    again.addEventListener('click', () => {
      window.clearTimeout(landing);
      card.classList.remove('is-sending');
      share.disabled = false;
      shared = 0;
      slots.forEach((s) => s.classList.remove('is-placed'));
      showStage(0);
      again.setAttribute('hidden', '');
      share.focus();
    });

    section.classList.add('is-playing');
    reveal(section.querySelector('.pd-try-controls'));
  }

  // ---------- Feed the cub: three berries, and still hungry ----------

  function feedTheCub(section) {
    const WORDS = ['', 'One!', 'Two!', 'Three… still hungry!', 'Four!', 'Five! Full and happy.'];
    const berries = [...section.querySelectorAll('.pd-berry')];
    const bowl = section.querySelector('.pd-feed-bowl');
    const cub = section.querySelector('.pd-feed-cub');
    const count = section.querySelector('.pd-count');
    const number = section.querySelector('.pd-count-number');
    const words = section.querySelector('.pd-count-words');
    const again = section.querySelector('.pd-feed-again');
    let eaten = 0;

    const setCub = (id) => {
      cub.src = art(id);
      replay(cub, 'is-growing');
    };

    berries.forEach((berry, i) => {
      berry.setAttribute('aria-label', `Pick berry ${i + 1}`);
      berry.addEventListener('click', () => {
        if (berry.disabled) return;
        berry.disabled = true;
        // Fly to the bowl: from the berry's centre to the bowl's.
        const from = berry.getBoundingClientRect();
        const to = bowl.getBoundingClientRect();
        const dx = to.left + to.width / 2 - (from.left + from.width / 2);
        const dy = to.top + to.height * 0.35 - (from.top + from.height / 2);
        berry.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.6)`;
        berry.style.opacity = '0';
        // Keep the keyboard on the bush: the next berry, or "Pick again" once it is bare.
        const next = berries.find((b) => !b.disabled);
        (next ?? again).focus();
        later(550, () => {
          eaten += 1;
          replay(bowl, 'is-catching');
          number.textContent = String(eaten);
          words.textContent = WORDS[eaten];
          reveal(count);
          if (eaten === 3) setCub('cub-awake');
          if (eaten === berries.length) setCub('cub-smiling');
        });
        if (!next) reveal(again);
      });
    });

    again.addEventListener('click', () => {
      eaten = 0;
      berries.forEach((b) => {
        b.disabled = false;
        b.style.transform = '';
        b.style.opacity = '';
      });
      count.setAttribute('hidden', '');
      again.setAttribute('hidden', '');
      setCub('cub-eating');
      berries[0].focus();
    });

    reveal(section.querySelector('.pd-berries'));
    reveal(section.querySelector('.pd-feed-hint'));
  }

  // ---------- The path through the valley: the stones become tabs ----------

  function path(section) {
    const list = section.querySelector('.pd-stones');
    const stones = [...list.querySelectorAll('.pd-stone')];
    const phases = [...section.querySelectorAll('.pd-phase')];

    list.setAttribute('role', 'tablist');
    list.setAttribute('aria-label', 'Phases');
    stones.forEach((stone, i) => {
      stone.parentElement.setAttribute('role', 'presentation');
      stone.id = `stone-${i}`;
      stone.setAttribute('role', 'tab');
      stone.setAttribute('aria-controls', phases[i].id);
      phases[i].setAttribute('role', 'tabpanel');
      phases[i].setAttribute('aria-labelledby', stone.id);
      phases[i].tabIndex = 0;
    });

    const select = (index, focus) => {
      stones.forEach((stone, i) => {
        const on = i === index;
        stone.setAttribute('aria-selected', String(on));
        stone.tabIndex = on ? 0 : -1;
        if (on) {
          phases[i].removeAttribute('hidden');
          replay(phases[i], 'is-entering');
        } else {
          phases[i].setAttribute('hidden', '');
        }
      });
      if (focus) stones[index].focus();
    };

    stones.forEach((stone, i) => {
      stone.addEventListener('click', (event) => {
        event.preventDefault();
        select(i, false);
      });
      stone.addEventListener('keydown', (event) => {
        const last = stones.length - 1;
        const to = { ArrowRight: i === last ? 0 : i + 1, ArrowLeft: i === 0 ? last : i - 1, Home: 0, End: last }[event.key];
        if (to === undefined) return;
        event.preventDefault();
        select(to, true);
      });
    });

    // Open where the work is now.
    select(Math.max(0, stones.findIndex((s) => s.dataset.status === 'now')), false);
  }

  // ---------- Bedtime: the owl tells a line of the story, the cub yawns ----------

  function bedtime(footer) {
    const LINES = [
      'Once upon a time, in a quiet valley, a tiny cub could not sleep…',
      'Hoo. The stars are out, and every panda is tucked in.',
      'Tomorrow there will be berries. Tonight, there are dreams.',
      'Shh. The little one is listening.',
    ];
    const ask = footer.querySelector('.pd-owl-hit');
    const says = footer.querySelector('.pd-owl-says');
    const cub = footer.querySelector('.pd-night-cub');
    let line = 0;
    let settle = 0;

    ask.addEventListener('click', () => {
      says.textContent = LINES[line % LINES.length];
      line += 1;
      reveal(says);
      replay(says, 'is-entering');
      cub.src = art('cub-yawn');
      replay(cub, 'is-growing');
      window.clearTimeout(settle);
      settle = later(2200, () => {
        cub.src = art('cub-newborn-sleeping');
        replay(cub, 'is-growing');
      });
    });
    reveal(ask);
    reveal(footer.querySelector('.pd-owl-hint'));
  }
})();
