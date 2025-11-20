import { attachUI, doSearch } from './scripts/ui.js';

function $(sel) { return document.querySelector(sel); }

function setupTabs() {
  const tabs = Array.from(document.querySelectorAll('.tab'));
  const tabContent = document.getElementById('tabContent');
  tabs.forEach((t) => {
    t.addEventListener('click', () => {
      tabs.forEach(tt => tt.classList.remove('active'));
      t.classList.add('active');
      const name = t.dataset.tab;
      if (!tabContent) return;
      Array.from(tabContent.children).forEach(child => {
        child.style.display = child.id && child.id.startsWith(name) ? '' : 'none';
      });
    });
  });
}

function compactUI() {
  const container = document.getElementById('container');
  const logo = document.querySelector('.logo');
  const searchWrapper = document.querySelector('.search-wrapper');
  const searchInner = document.querySelector('.search');
  if (container) container.classList.add('compact');
  if (logo) logo.classList.add('logo-small');
  if (searchWrapper) searchWrapper.classList.add('search-top');
  if (searchInner) searchInner.classList.add('search-top');
}

function attachSearch() {
  const input = $('#searchInput');
  const btn = $('#searchBtn');
  const resultsSection = $('#resultsSection');

  if (!input || !btn) return;

  btn.addEventListener('click', async () => {
    const q = input.value.trim();
    if (!q) return;
    if (resultsSection) resultsSection.classList.remove('hidden');
    await doSearch(q);
    setupTabs();
    // Move the search bar to top and shrink logo like Google
    compactUI();
  });

  // also submit on Enter
  input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      btn.click();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  attachUI();
  attachSearch();
  setupTabs();
});
