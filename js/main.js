const themeButton = document.querySelector('#theme-toggle');
const menuButton = document.querySelector('#menu-toggle');
const navLinks = document.querySelector('#nav-links');
const header = document.querySelector('.site-header');
const topButton = document.querySelector('#scroll-top');

// 이벤트 → 테마 상태 변경 → 화면과 버튼 갱신
let theme = localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
const renderTheme = () => {
  document.documentElement.dataset.theme = theme;
  themeButton.textContent = theme === 'dark' ? '라이트 모드' : '다크 모드';
  themeButton.setAttribute('aria-pressed', String(theme === 'dark'));
};
renderTheme();
themeButton.addEventListener('click', () => {
  theme = theme === 'light' ? 'dark' : 'light';
  localStorage.setItem('theme', theme);
  renderTheme();
});

const renderMenuButton = (open) => {
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
};
menuButton.addEventListener('click', () => {
  renderMenuButton(navLinks.classList.toggle('active'));
});
document.querySelectorAll('.nav-links a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('active');
    renderMenuButton(false);
  });
});
const renderScroll = () => {
  header.classList.toggle('scrolled', window.scrollY >= 60);
  topButton.hidden = window.scrollY < 300;
};
window.addEventListener('scroll', renderScroll, { passive: true });
renderScroll();
topButton.addEventListener('click', () => window.scrollTo({ top: 0 }));

const observer = new IntersectionObserver((entries) => {
  entries.forEach(({ isIntersecting, target }) => {
    if (isIntersecting) {
      target.classList.remove('pending');
      observer.unobserve(target);
    }
  });
}, { threshold: 0.2 });
document.querySelectorAll('.reveal').forEach((section) => {
  section.classList.add('pending');
  observer.observe(section);
});

const projectList = document.querySelector('#project-list');
const projectStatus = document.querySelector('#project-status');
const retryButton = document.querySelector('#retry');
let projects = { status: 'loading', repos: [] };
// API가 제공하는 문자열을 HTML 텍스트로만 삽입한다.
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);
const renderProjects = () => {
  const { status, repos } = projects;
  const messages = {
    loading: '로딩 중...',
    success: '',
    error: '프로젝트를 불러올 수 없습니다.',
    empty: '표시할 프로젝트가 없습니다.'
  };
  projectStatus.textContent = messages[status];
  retryButton.hidden = status !== 'error';
  projectList.setAttribute('aria-busy', String(status === 'loading'));
  projectList.innerHTML = repos.map(({ name, description, language, stargazers_count }) => `
    <article class="project-card">
      <h3><a href="https://github.com/jagaldol/${encodeURIComponent(name)}">${escapeHTML(name)} ↗</a></h3>
      <p>${escapeHTML(description || 'GitHub에서 프로젝트의 코드와 문서를 확인하세요.')}</p>
      <div class="project-meta">${escapeHTML(language || '기타')} · ★ ${escapeHTML(stargazers_count)}</div>
    </article>
  `).join('');
};
const loadProjects = async () => {
  projects = { status: 'loading', repos: [] };
  renderProjects();
  try {
    const response = await fetch('https://api.github.com/users/jagaldol/repos?sort=updated&per_page=6');
    if (!response.ok) throw new Error(`GitHub HTTP ${response.status}`);
    const repos = await response.json();
    projects = { status: repos.length ? 'success' : 'empty', repos };
  } catch {
    projects = { status: 'error', repos: [] };
  }
  renderProjects();
};
retryButton.addEventListener('click', loadProjects);
loadProjects();

const form = document.querySelector('#contact-form');
const fields = [...form.querySelectorAll('input, textarea')];
const formStatus = document.querySelector('#form-status');
const errors = {};
const validateField = (field) => {
  let error = '';
  if (!field.value.trim()) error = '필수 입력 항목입니다.';
  else if (field.type === 'email' && field.validity.typeMismatch) error = '올바른 이메일 주소를 입력해주세요.';
  errors[field.id] = error;
  document.querySelector(`#${field.id}-error`).textContent = error;
  field.setAttribute('aria-invalid', String(Boolean(error)));
};
fields.forEach((field) => {
  field.addEventListener('input', () => {
    formStatus.textContent = '';
    validateField(field);
  });
});
form.addEventListener('submit', (event) => {
  event.preventDefault();
  fields.forEach(validateField);
  const invalidField = fields.find((field) => errors[field.id]);
  if (invalidField) {
    formStatus.textContent = '입력 내용을 확인해주세요.';
    invalidField.focus();
    return;
  }
  formStatus.textContent = '입력 확인이 완료되었습니다. 이메일은 전송되지 않았습니다.';
});
