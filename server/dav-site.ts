import { randomUUID } from "crypto";
import {
  davBirthdaySchema,
  davContactSchema,
  davNoticeSchema,
  davPublicFeedSchema,
  davQuickLinkSchema,
  type DavPublicFeed,
} from "@shared/schema";

const DAV_BASE_URL = "https://daveastofloniroad.org";
const DAV_CONTACT_URL = `${DAV_BASE_URL}/34E2E822-B2A3-4EFF-9D6C-986FFD77F5DD/CMS/Page/Contact-Us`;
const CACHE_TTL_MS = 1000 * 60 * 20;

let cachedFeed: DavPublicFeed | null = null;
let cachedAt = 0;

function stripTags(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteUrl(path: string | undefined) {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return new URL(path, DAV_BASE_URL).toString();
}

function safeMatch(value: string, regex: RegExp) {
  return value.match(regex)?.[1]?.trim();
}

function parseBirthdays(html: string) {
  const section = html.match(/happySlider">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/i)?.[1] ?? html;
  const matches = Array.from(section.matchAll(/<div class="col">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi));

  return matches.slice(0, 6).map((match) => {
    const block = match[1];
    const date = safeMatch(block, /<p class="date">([\s\S]*?)<\/p>/i) ?? "Today";
    const name = stripTags(safeMatch(block, /<h5 class="card-title">([\s\S]*?)<\/h5>/i) ?? "Student");
    const className = stripTags(safeMatch(block, /Class\s*:([\s\S]*?)\//i) ?? "School");
    const sectionValue = stripTags(safeMatch(block, /Section\s*:([\s\S]*?)</i) ?? "");

    return davBirthdaySchema.parse({
      id: `dav-bday-${randomUUID().slice(0, 8)}`,
      name,
      date,
      classLabel: sectionValue ? `${className} ${sectionValue}` : className,
    });
  });
}

function parseNotices(html: string) {
  const matches = Array.from(html.matchAll(/<li class="notice-item">([\s\S]*?)<\/li>/gi));

  return matches.slice(0, 8).map((match) => {
    const block = match[1];
    const title = stripTags(safeMatch(block, /<p class="card-text">([\s\S]*?)<\/p>\s*<\/p>/i) ?? "");
    const publishedAt = stripTags(safeMatch(block, /<h3 class="me-3">([\s\S]*?)<\/h3>/i) ?? "Recent");
    const url = absoluteUrl(safeMatch(block, /<a href="([^"]+)"/i));

    return davNoticeSchema.parse({
      id: `dav-notice-${randomUUID().slice(0, 8)}`,
      title: title || "School notice",
      publishedAt,
      url,
    });
  });
}

function parseQuickLinks(html: string) {
  const links = [
    {
      id: "dav-home",
      title: "Official school website",
      url: DAV_BASE_URL,
    },
    {
      id: "dav-gallery",
      title: "Photo gallery",
      url: `${DAV_BASE_URL}/Full/Photo/all`,
    },
    {
      id: "dav-contact",
      title: "Contact us",
      url: DAV_CONTACT_URL,
    },
  ];

  const formMatches = Array.from(html.matchAll(/<a href="([^"]+)"[^>]*>([\s\S]*?(?:FORM|Registration|Admission)[\s\S]*?)<\/a>/gi));
  for (const match of formMatches.slice(0, 3)) {
    links.push({
      id: `dav-link-${randomUUID().slice(0, 8)}`,
      title: stripTags(match[2]).slice(0, 80),
      url: absoluteUrl(match[1]) ?? DAV_BASE_URL,
    });
  }

  return links.map((item) => davQuickLinkSchema.parse(item));
}

function parseContact(html: string) {
  const phone =
    safeMatch(html, /(\+?91[-\s]?\d{10,13})/i) ??
    safeMatch(html, /(011[-\s]?\d{7,8})/i) ??
    undefined;
  const email = safeMatch(html, /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i) ?? undefined;

  return davContactSchema.parse({
    address: "DAV Public School, East of Loni Road, Shahdara, Delhi",
    phone,
    email,
  });
}

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "SIOS School Hub/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Could not load DAV source: ${response.status}`);
  }

  return response.text();
}

function fallbackFeed() {
  return davPublicFeedSchema.parse({
    schoolName: "DAV Public School",
    campusLabel: "East of Loni Road, Shahdara, Delhi",
    sourceUrl: DAV_BASE_URL,
    fetchedAt: new Date().toISOString(),
    notices: [],
    birthdays: [],
    quickLinks: [
      { id: "dav-home", title: "Official school website", url: DAV_BASE_URL },
      { id: "dav-gallery", title: "Photo gallery", url: `${DAV_BASE_URL}/Full/Photo/all` },
      { id: "dav-contact", title: "Contact us", url: DAV_CONTACT_URL },
    ],
    contact: {
      address: "DAV Public School, East of Loni Road, Shahdara, Delhi",
    },
  });
}

export async function getDavPublicFeed(): Promise<DavPublicFeed> {
  const now = Date.now();
  if (cachedFeed && now - cachedAt < CACHE_TTL_MS) {
    return cachedFeed;
  }

  try {
    const [homeHtml, contactHtml] = await Promise.all([fetchHtml(DAV_BASE_URL), fetchHtml(DAV_CONTACT_URL)]);
    cachedFeed = davPublicFeedSchema.parse({
      schoolName: "DAV Public School",
      campusLabel: "East of Loni Road, Shahdara, Delhi",
      sourceUrl: DAV_BASE_URL,
      fetchedAt: new Date().toISOString(),
      notices: parseNotices(homeHtml),
      birthdays: parseBirthdays(homeHtml),
      quickLinks: parseQuickLinks(homeHtml),
      contact: parseContact(contactHtml),
    });
    cachedAt = now;
    return cachedFeed;
  } catch {
    cachedFeed = fallbackFeed();
    cachedAt = now;
    return cachedFeed;
  }
}
