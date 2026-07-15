import { describe, it, expect } from 'bun:test';
import { mapDbMember } from './member-map';

describe('mapDbMember', () => {
  it('maps a full member row to a TeamMember', () => {
    expect(
      mapDbMember({
        handle: 'xenodev',
        slug: 'xenodev',
        github_url: 'https://github.com/xenodeve',
        role: 'Tech Lead',
        role_en: 'Tech Lead',
        skills: ['Tech Lead', 'Full-Stack'],
        stack: ['Next.js', 'Nest.js'],
        education: {
          program: 'คณิตศาสตร์เชิงวิทยาการคอมพิวเตอร์',
          institution: 'KMUTNB',
        },
        readme_visible: true,
        readme_override: '# Custom\n\nMy own README.',
      }),
    ).toEqual({
      handle: 'xenodev',
      slug: 'xenodev',
      githubUrl: 'https://github.com/xenodeve',
      role: 'Tech Lead',
      roleEn: 'Tech Lead',
      skills: ['Tech Lead', 'Full-Stack'],
      stack: ['Next.js', 'Nest.js'],
      education: {
        program: 'คณิตศาสตร์เชิงวิทยาการคอมพิวเตอร์',
        institution: 'KMUTNB',
      },
      readmeVisible: true,
      readmeOverride: '# Custom\n\nMy own README.',
    });
  });

  it('omits optional stack/education/githubUrl when null (non-technical member)', () => {
    expect(
      mapDbMember({
        handle: 'Slowgers',
        slug: 'slowgers',
        github_url: null,
        role: 'Project Manager',
        role_en: 'Project Manager',
        skills: ['Project Manager'],
        stack: null,
        education: null,
        readme_visible: true,
        readme_override: null,
      }),
    ).toEqual({
      handle: 'Slowgers',
      slug: 'slowgers',
      role: 'Project Manager',
      roleEn: 'Project Manager',
      skills: ['Project Manager'],
      readmeVisible: true,
    });
  });

  it('maps a hidden README (readme_visible false) through', () => {
    const m = mapDbMember({
      handle: 'x',
      slug: 'x',
      github_url: null,
      role: 'r',
      role_en: 'r',
      skills: null,
      stack: null,
      education: null,
      readme_visible: false,
      readme_override: null,
    });
    expect(m.skills).toEqual([]);
    expect(m.readmeVisible).toBe(false);
    expect(m.readmeOverride).toBeUndefined();
  });
});
