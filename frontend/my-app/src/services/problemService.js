import { problems } from '../utils/mockData';
import { apiRequest, withTimeout } from './api';

const USE_MOCK = (import.meta.env.VITE_USE_MOCK || 'true') === 'true';

function applyFilters(list, query = '') {
  const q = query.toLowerCase();

  return list.filter((problem) => {
    if (!q) {
      return true;
    }

    return (
      problem.title.toLowerCase().includes(q) ||
      problem.difficulty.toLowerCase().includes(q) ||
      problem.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  });
}

export async function getProblems(query) {
  if (USE_MOCK) {
    return { problems: applyFilters(problems, query) };
  }

  const suffix = query ? `?q=${encodeURIComponent(query)}` : '';
  return withTimeout(apiRequest(`/api/problems${suffix}`));
}
