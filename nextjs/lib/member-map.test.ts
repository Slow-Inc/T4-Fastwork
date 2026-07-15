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
      }),
    ).toEqual({
      handle: 'Slowgers',
      slug: 'slowgers',
      role: 'Project Manager',
      roleEn: 'Project Manager',
      skills: ['Project Manager'],
    });
  });

  it('defaults null skills to []', () => {
    const m = mapDbMember({
      handle: 'x',
      slug: 'x',
      github_url: null,
      role: 'r',
      role_en: 'r',
      skills: null,
      stack: null,
      education: null,
    });
    expect(m.skills).toEqual([]);
  });
});
