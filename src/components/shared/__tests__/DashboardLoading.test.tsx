import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import DashboardLoading from '../../../app/dashboard/loading';

describe('DashboardLoading', () => {
  it('renders without crashing', () => {
    const { container } = render(<DashboardLoading />);
    expect(container).toBeTruthy();
  });

  it('renders skeleton elements', () => {
    const { container } = render(<DashboardLoading />);
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders a wrapping div with space-y-4 class', () => {
    const { container } = render(<DashboardLoading />);
    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain('space-y-4');
  });
});
