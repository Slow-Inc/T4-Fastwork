import { describe, it, expect } from 'bun:test';
import {
  mapDbMemberProject,
  mapDbMemberCertificate,
  mapDbTeamProject,
} from './member-content-map';

describe('mapDbMemberProject', () => {
  it('maps a full row to a TeamProject', () => {
    expect(
      mapDbMemberProject({
        name: 'resume_web',
        description: 'เว็บพอร์ตโฟลิโอ',
        url: 'https://github.com/xenodeve/resume_web',
        tech: ['JavaScript', 'Express.js'],
        year: 2025,
      }),
    ).toEqual({
      name: 'resume_web',
      description: 'เว็บพอร์ตโฟลิโอ',
      url: 'https://github.com/xenodeve/resume_web',
      tech: ['JavaScript', 'Express.js'],
      year: 2025,
    });
  });

  it('defaults null description to "" and null tech to []', () => {
    expect(
      mapDbMemberProject({
        name: 'TeachThrough',
        description: null,
        url: 'https://github.com/CableMoMo2027/TeachThrough',
        tech: null,
        year: 2026,
      }),
    ).toEqual({
      name: 'TeachThrough',
      description: '',
      url: 'https://github.com/CableMoMo2027/TeachThrough',
      tech: [],
      year: 2026,
    });
  });
});

describe('mapDbMemberCertificate', () => {
  it('reconstructs the asset from webp/pdf/img', () => {
    expect(
      mapDbMemberCertificate({
        issuer: 'NVIDIA',
        title: 'AI for All',
        asset_webp: '/certificates/xenodev/ai-for-all.webp',
        asset_pdf: '/certificates/xenodev/ai-for-all.pdf',
        asset_img: '/certificates/xenodev/ai-for-all.png',
      }),
    ).toEqual({
      issuer: 'NVIDIA',
      title: 'AI for All',
      asset: {
        webp: '/certificates/xenodev/ai-for-all.webp',
        pdf: '/certificates/xenodev/ai-for-all.pdf',
        img: '/certificates/xenodev/ai-for-all.png',
      },
    });
  });

  it('omits pdf/img when absent (webp only)', () => {
    expect(
      mapDbMemberCertificate({
        issuer: 'SIIT · Thammasat University',
        title: 'Basic Data Analytics Workshop',
        asset_webp: '/certificates/xenodev/basic-data-analytics.webp',
        asset_pdf: null,
        asset_img: '/certificates/xenodev/basic-data-analytics.jpg',
      }),
    ).toEqual({
      issuer: 'SIIT · Thammasat University',
      title: 'Basic Data Analytics Workshop',
      asset: {
        webp: '/certificates/xenodev/basic-data-analytics.webp',
        img: '/certificates/xenodev/basic-data-analytics.jpg',
      },
    });
  });

  it('leaves asset undefined when there is no webp image', () => {
    expect(
      mapDbMemberCertificate({
        issuer: 'SET',
        title: 'Entrepreneurial Mindset',
        asset_webp: null,
        asset_pdf: null,
        asset_img: null,
      }),
    ).toEqual({
      issuer: 'SET',
      title: 'Entrepreneurial Mindset',
    });
  });
});

describe('mapDbTeamProject', () => {
  it('maps a collaborative row including contributors', () => {
    expect(
      mapDbTeamProject({
        name: 'MangaDock',
        description: 'เว็บอ่านมังงะ',
        url: 'https://github.com/Slow-Inc/MangaDock',
        tech: ['TypeScript', 'AI'],
        year: 2026,
        contributors: ['xenodev', 'akkanop-x'],
      }),
    ).toEqual({
      name: 'MangaDock',
      description: 'เว็บอ่านมังงะ',
      url: 'https://github.com/Slow-Inc/MangaDock',
      tech: ['TypeScript', 'AI'],
      year: 2026,
      contributors: ['xenodev', 'akkanop-x'],
    });
  });

  it('defaults null contributors/tech to []', () => {
    expect(
      mapDbTeamProject({
        name: 'planet_management',
        description: '',
        url: 'https://github.com/Slow-Inc/planet_management',
        tech: null,
        year: 2025,
        contributors: null,
      }),
    ).toEqual({
      name: 'planet_management',
      description: '',
      url: 'https://github.com/Slow-Inc/planet_management',
      tech: [],
      year: 2025,
      contributors: [],
    });
  });
});
