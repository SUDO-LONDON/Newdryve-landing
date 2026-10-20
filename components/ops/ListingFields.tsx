"use client";

import { MAX_BIO_LENGTH, isHexColour, type ListingDraft } from "@/lib/organisations/listing";

const inputClass =
  "mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-ink outline-none focus:ring-2 focus:ring-ring";

/**
 * What learners see on the organisation's single listing: a bio, a logo and a
 * brand colour. Members who agreed to it appear there as named cards (ADR-042).
 */
export default function ListingFields({
  draft,
  onChange,
  idPrefix,
}: {
  draft: ListingDraft;
  onChange: (next: ListingDraft) => void;
  idPrefix: string;
}) {
  const colourOk = isHexColour(draft.primary_color);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="text-sm font-medium text-ink md:col-span-2">
        Bio
        <textarea
          rows={3}
          maxLength={MAX_BIO_LENGTH}
          value={draft.bio}
          onChange={(event) => onChange({ ...draft, bio: event.target.value })}
          placeholder="What learners read on the organisation's listing"
          className={inputClass}
        />
        <span className="mt-1 block text-xs text-ink-muted">
          {draft.bio.length}/{MAX_BIO_LENGTH} characters
        </span>
      </label>
      <label className="text-sm font-medium text-ink">
        Logo URL
        <input
          type="url"
          inputMode="url"
          value={draft.logo_url}
          onChange={(event) => onChange({ ...draft, logo_url: event.target.value })}
          placeholder="https://…"
          pattern="https://\S+"
          title="An https:// address"
          className={inputClass}
        />
        <span className="mt-1 block text-xs text-ink-muted">https only.</span>
      </label>
      <div className="text-sm font-medium text-ink">
        <label htmlFor={`${idPrefix}-primary-color`}>Brand colour</label>
        <div className="mt-1 flex items-center gap-2">
          <input
            id={`${idPrefix}-primary-color`}
            value={draft.primary_color}
            onChange={(event) => onChange({ ...draft, primary_color: event.target.value })}
            placeholder="#2D6A4F"
            pattern="#[0-9A-Fa-f]{6}"
            title="A hex colour like #2D6A4F"
            className="w-full rounded-lg border border-border bg-white px-3 py-2 font-mono text-ink outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="color"
            aria-label="Pick the brand colour"
            value={colourOk ? draft.primary_color : "#2d6a4f"}
            onChange={(event) => onChange({ ...draft, primary_color: event.target.value.toUpperCase() })}
            className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-border bg-white p-1"
          />
        </div>
        <span className="mt-1 block text-xs text-ink-muted">#RRGGBB. Leave blank for the default.</span>
      </div>
    </div>
  );
}
