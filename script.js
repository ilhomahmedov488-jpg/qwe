const motion = matchMedia('(prefers-reduced-motion: reduce)');
const chapters = [...document.querySelectorAll('main section')];
const links = [...document.querySelectorAll('nav a')];
const progress = document.querySelector('.progress');
let scrollFrame = 0;

function updateNavigation() {
  const scrollLimit = document.documentElement.scrollHeight - innerHeight;
  const fraction = scrollLimit > 0 ? Math.min(1, Math.max(0, scrollY / scrollLimit)) : 0;
  progress.style.transform = 'scaleX(' + fraction + ')';
  const active = fraction >= .995 ? chapters.at(-1) :
    chapters.findLast(section => section.getBoundingClientRect().top <= innerHeight * .38) || chapters[0];
  for (const link of links) {
    if (link.hash === '#' + active.id) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
  scrollFrame = 0;
}
function scheduleNavigation() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateNavigation);
}
addEventListener('scroll', scheduleNavigation, {passive: true});
addEventListener('resize', scheduleNavigation);
updateNavigation();

const reveal = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    entry.target.classList.add('reveal-in');
    reveal.unobserve(entry.target);
  }
}, {threshold: .14});
document.querySelectorAll('[data-reveal]').forEach(element => reveal.observe(element));
const letter = document.querySelector('details');
letter.addEventListener('toggle', () => {
  if (letter.open && !motion.matches) {
    letter.querySelector('.letter-body').animate(
      [{opacity: 0, transform: 'translateY(8px)'}, {opacity: 1, transform: 'translateY(0)'}],
      {duration: 420, easing: 'ease-out'}
    );
  }
  scheduleNavigation();
});

const scene = document.querySelector('.scene');
const canvas = scene.querySelector('canvas');
const context = canvas.getContext('2d');
if (context) {
  const stars = Array.from({length: 70}, () => ({
    x: Math.random(), y: Math.random() * .74, radius: .5 + Math.random() * 1.25,
    phase: Math.random() * Math.PI * 2
  }));
  let width = 0;
  let height = 0;
  let frame = 0;
  let visible = false;

  function paint(time) {
    context.clearRect(0, 0, width, height);
    for (const star of stars) {
      context.globalAlpha = .46 + Math.sin(time / 850 + star.phase) * .32;
      context.fillStyle = '#fff0dd';
      context.beginPath();
      context.arc(star.x * width, star.y * height, star.radius, 0, 2 * Math.PI);
      context.fill();
    }
  }
  function draw(time) {
    paint(time);
    frame = requestAnimationFrame(draw);
  }
  function syncAnimation() {
    cancelAnimationFrame(frame);
    if (visible && !motion.matches && !document.hidden) frame = requestAnimationFrame(draw);
    else paint(0);
  }
  new ResizeObserver(() => {
    ({width, height} = scene.getBoundingClientRect());
    const scale = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    paint(0);
  }).observe(scene);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    syncAnimation();
  }).observe(scene);
  const resetMoon = () => {
    scene.style.removeProperty('--x');
    scene.style.removeProperty('--y');
  };
  motion.addEventListener('change', () => {
    resetMoon();
    syncAnimation();
  });
  document.addEventListener('visibilitychange', syncAnimation);
  scene.addEventListener('pointermove', event => {
    if (motion.matches || event.pointerType === 'touch' || !width || !height) return;
    const bounds = scene.getBoundingClientRect();
    scene.style.setProperty('--x', ((event.clientX - bounds.left) / width - .5) * 14 + 'px');
    scene.style.setProperty('--y', ((event.clientY - bounds.top) / height - .5) * 14 + 'px');
  });
  scene.addEventListener('pointerleave', resetMoon);
}
