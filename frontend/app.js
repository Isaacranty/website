const STORAGE_KEYS = {
  posts: 'isaac-blog-posts',
  feedback: 'isaac-blog-feedback',
};

const defaultPosts = [
  {
    id: 1,
    title: 'Welcome to Isaac Blog',
    date: 'March 30, 2026',
    category: 'Introduction',
    excerpt:
      'A place for short thoughts, code tips, and project notes — styled for a clean and modern reading experience.',
    content:
      'This is the first post on Isaac Blog.\n\nUse this space to publish sharp ideas, coding snippets, and thoughtful reflections. The site is intentionally lightweight so writing stays easy and reading stays enjoyable.',
  },
  {
    id: 2,
    title: 'Building a Minimal JavaScript Blog',
    date: 'March 30, 2026',
    category: 'Web Dev',
    excerpt:
      'Create a simple, polished blog using plain HTML, CSS, and vanilla JavaScript with search and post creation.',
    content:
      'A small array of post objects plus a few render functions can power a surprisingly capable blog.\n\nAdd search, recent posts, and a simple editor form, then persist everything with localStorage for a practical static blogging setup.',
  },
  {
    id: 3,
    title: 'Why Simple Publishing Still Matters',
    date: 'March 30, 2026',
    category: 'Productivity',
    excerpt:
      'A simple blog removes publishing friction and helps you capture ideas before they disappear.',
    content:
      'Heavy systems can slow down writing. A minimal publishing workflow encourages consistency.\n\nWhen it is easy to publish, you are more likely to keep notes, share experiments, and build a personal archive of useful ideas.',
  },
];

const state = {
  posts: loadPosts(),
  filteredPosts: [],
  activePostId: null,
};

const postContainer = document.getElementById('posts');
const recentContainer = document.getElementById('recent-posts');
const searchInput = document.getElementById('search');
const categorySelect = document.getElementById('new-category');
const categoryCustom = document.getElementById('new-category-custom');
const postForm = document.getElementById('post-form');
const newTitle = document.getElementById('new-title');
const newContent = document.getElementById('new-content');
const siteNav = document.getElementById('site-nav');
const menuToggle = document.getElementById('menu-toggle');
const navLinks = document.querySelectorAll('.site-nav a');
const homeSection = document.getElementById('home');
const aboutSection = document.getElementById('about');
const contactSection = document.getElementById('contact');
const feedbackSection = document.getElementById('feedback');
const feedbackTab = document.getElementById('feedback-tab');
const feedbackPanel = document.getElementById('feedback-panel');
const feedbackClose = document.getElementById('feedback-close');
const feedbackForm = document.getElementById('feedback-form');
const feedbackSuccess = document.getElementById('feedback-success');
const allSections = [
  homeSection,
  document.getElementById('posts-area'),
  aboutSection,
  contactSection,
  feedbackSection,
].filter(Boolean);

function loadPosts() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.posts);
    if (!saved) {
      return [...defaultPosts];
    }

    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length ? parsed : [...defaultPosts];
  } catch (error) {
    return [...defaultPosts];
  }
}

function savePosts() {
  localStorage.setItem(STORAGE_KEYS.posts, JSON.stringify(state.posts));
}

function saveFeedback(entry) {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.feedback) || '[]');
    existing.unshift(entry);
    localStorage.setItem(STORAGE_KEYS.feedback, JSON.stringify(existing));
  } catch (error) {
    localStorage.setItem(STORAGE_KEYS.feedback, JSON.stringify([entry]));
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>');
}

function formatContent(content) {
  return escapeHtml(content).replace(/\n/g, '<br>');
}

function formatPostCard(post) {
  return `
    <article class="post">
      <a href="#posts-area" class="post-title" data-id="${post.id}">${escapeHtml(post.title)}</a>
      <div class="post-meta">${escapeHtml(post.date)} · ${escapeHtml(post.category)}</div>
      <p class="post-excerpt">${escapeHtml(post.excerpt)}</p>
      <button class="text-button" type="button" data-id="${post.id}">Read more</button>
    </article>
  `;
}

function renderRecent(list) {
  if (!recentContainer) return;

  if (!list.length) {
    recentContainer.innerHTML = '<h3>Recent Posts</h3><p>No posts yet.</p>';
    return;
  }

  recentContainer.innerHTML = `
    <h3>Recent Posts</h3>
    <ul class="recent-list">
      ${list
        .slice(0, 5)
        .map(
          (post) => `
            <li>
              <a href="#posts-area" data-id="${post.id}">${escapeHtml(post.title)}</a>
            </li>
          `,
        )
        .join('')}
    </ul>
  `;
}

function renderPosts(list) {
  if (!postContainer) return;

  state.filteredPosts = list;

  if (!list.length) {
    postContainer.innerHTML = `
      <article class="post empty-state">
        <h3>No matching posts</h3>
        <p>Try a different search term or publish a new post from the sidebar.</p>
      </article>
    `;
    renderRecent(state.posts);
    return;
  }

  postContainer.innerHTML = list.map(formatPostCard).join('');
  renderRecent(state.posts);
}

function showPost(post) {
  if (!postContainer || !post) return;

  state.activePostId = post.id;
  postContainer.innerHTML = `
    <article class="post post-full">
      <h2 class="post-title">${escapeHtml(post.title)}</h2>
      <div class="post-meta">${escapeHtml(post.date)} · ${escapeHtml(post.category)}</div>
      <div class="post-body">${formatContent(post.content)}</div>
      <p><a href="#posts-area" class="back-link" id="back-to-posts">← Back to all posts</a></p>
    </article>
  `;
}

function restorePostList() {
  state.activePostId = null;
  handleSearch();
}

function handleClick(event) {
  const trigger = event.target.closest('[data-id]');
  if (!trigger) return;

  event.preventDefault();
  const id = Number(trigger.getAttribute('data-id'));
  const post = state.posts.find((item) => item.id === id);

  if (post) {
    showPost(post);
  }
}

function handleSearch() {
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const filtered = query
    ? state.posts.filter((post) => {
        const haystack = [post.title, post.excerpt, post.content, post.category].join(' ').toLowerCase();
        return haystack.includes(query);
      })
    : state.posts;

  renderPosts(filtered);
}

function getSelectedCategory() {
  if (!categorySelect) return '';
  if (categorySelect.value.toLowerCase() === 'custom' || categorySelect.value.toLowerCase() === 'other') {
    return categoryCustom ? categoryCustom.value.trim() : '';
  }
  return categorySelect.value.trim();
}

function refreshCategoryOptions() {
  if (!categorySelect) return;

  const categories = [...new Set(state.posts.map((post) => post.category).filter(Boolean))].sort();
  const currentValue = categorySelect.value;
  categorySelect.innerHTML =
    '<option value="">Select category</option>' +
    categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('') +
    '<option value="Custom">Custom</option>';

  if (categories.includes(currentValue)) {
    categorySelect.value = currentValue;
  } else if (currentValue === 'Custom') {
    categorySelect.value = 'Custom';
  }
}

function syncCustomCategoryVisibility() {
  if (!categorySelect || !categoryCustom) return;

  const showCustom = categorySelect.value === 'Custom' || categorySelect.value === 'other';
  categoryCustom.style.display = showCustom ? 'block' : 'none';
  categoryCustom.required = showCustom;

  if (!showCustom) {
    categoryCustom.value = '';
  }
}

function addPost(event) {
  event.preventDefault();

  const title = newTitle ? newTitle.value.trim() : '';
  const category = getSelectedCategory();
  const content = newContent ? newContent.value.trim() : '';

  if (!title || !category || !content) {
    window.alert('Please fill in all post fields.');
    return;
  }

  const post = {
    id: Date.now(),
    title,
    date: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    category,
    excerpt: content.length > 140 ? `${content.slice(0, 140).trim()}...` : content,
    content,
  };

  state.posts.unshift(post);
  savePosts();
  refreshCategoryOptions();
  syncCustomCategoryVisibility();
  renderPosts(state.posts);
  showPost(post);

  if (postForm) {
    postForm.reset();
  }

  if (categoryCustom) {
    categoryCustom.style.display = 'none';
    categoryCustom.required = false;
  }

  window.location.hash = '#posts-area';
}

function activateSection(sectionId) {
  allSections.forEach((section) => {
    const isMatch = section.id === sectionId;
    section.style.display = isMatch ? '' : 'none';
  });

  if (siteNav) {
    siteNav.classList.remove('active');
  }

  if (menuToggle) {
    menuToggle.setAttribute('aria-expanded', 'false');
  }
}

function openFeedbackPanel() {
  if (!feedbackPanel || !feedbackTab) return;

  feedbackPanel.classList.add('open');
  feedbackPanel.setAttribute('aria-hidden', 'false');
  feedbackTab.setAttribute('aria-expanded', 'true');
}

function closeFeedbackPanel() {
  if (!feedbackPanel || !feedbackTab) return;

  feedbackPanel.classList.remove('open');
  feedbackPanel.setAttribute('aria-hidden', 'true');
  feedbackTab.setAttribute('aria-expanded', 'false');
}

function handleNavigation(target) {
  if (target === 'feedback') {
    activateSection('feedback');
    openFeedbackPanel();
    return;
  }

  closeFeedbackPanel();

  if (target === 'posts' || target === 'posts-area') {
    activateSection('posts-area');
    if (state.activePostId) {
      restorePostList();
    }
    return;
  }

  if (['home', 'about', 'contact'].includes(target)) {
    activateSection(target);
  }
}

function handleInitialRoute() {
  const hash = (window.location.hash || '#home').replace('#', '');
  handleNavigation(hash);
}

if (categorySelect) {
  categorySelect.addEventListener('change', syncCustomCategoryVisibility);
}

if (menuToggle && siteNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('active');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

navLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    const href = link.getAttribute('href') || '';
    if (!href.startsWith('#')) return;

    event.preventDefault();
    const target = href.replace('#', '');
    handleNavigation(target);
    window.location.hash = href;
  });
});

if (feedbackTab) {
  feedbackTab.addEventListener('click', () => {
    activateSection('feedback');
    openFeedbackPanel();
    window.location.hash = '#feedback';
  });
}

if (feedbackClose) {
  feedbackClose.addEventListener('click', closeFeedbackPanel);
}

if (feedbackForm) {
  feedbackForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = document.getElementById('feedback-name')?.value.trim() || '';
    const email = document.getElementById('feedback-email')?.value.trim() || '';
    const message = document.getElementById('feedback-message')?.value.trim() || '';
    const rating = feedbackForm.querySelector('input[name="rating"]:checked')?.value || '';

    saveFeedback({
      name,
      email,
      message,
      rating,
      createdAt: new Date().toISOString(),
    });

    if (feedbackSuccess) {
      feedbackSuccess.hidden = false;
    }

    feedbackForm.reset();

    setTimeout(() => {
      if (feedbackSuccess) {
        feedbackSuccess.hidden = true;
      }
      closeFeedbackPanel();
    }, 2200);
  });
}

if (postContainer) {
  postContainer.addEventListener('click', (event) => {
    const backLink = event.target.closest('#back-to-posts');
    if (backLink) {
      event.preventDefault();
      restorePostList();
      return;
    }

    handleClick(event);
  });
}

if (recentContainer) {
  recentContainer.addEventListener('click', handleClick);
}

if (searchInput) {
  searchInput.addEventListener('input', () => {
    state.activePostId = null;
    activateSection('posts-area');
    handleSearch();
  });
}

if (postForm) {
  postForm.addEventListener('submit', addPost);
}

window.addEventListener('hashchange', handleInitialRoute);

window.addEventListener('load', () => {
  refreshCategoryOptions();
  syncCustomCategoryVisibility();
  renderPosts(state.posts);
  handleInitialRoute();
});
