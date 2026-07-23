(function netlifyPortfolioRuntime() {
    "use strict";

    const project = window.PORTFOLIO_PROJECT || {
      site: {},
      creator: { bio: [], links: [] },
      worlds: [],
      characters: []
    };
    const catalog = window.PORTFOLIO_CATALOG || {
      profileLinkServices: [],
      platforms: [],
      genres: []
    };

    const serviceCatalog = new Map(
      (catalog.profileLinkServices || []).map((item) => [item.id, item])
    );
    const platformCatalog = new Map(
      (catalog.platforms || []).map((item) => [item.id, item])
    );
    const genreCatalog = new Map(
      (catalog.genres || []).map((item) => [item.id, item])
    );

    const filterState = {
      query: "",
      genre: new Set(),
      tag: new Set(),
      platform: new Set(),
      world: new Set()
    };
    let activeFilterPickerGroup = null;
    let filterPickerQuery = "";
    let worldExpanded = false;
    let characterExpanded = false;
    let filterFitFrame = 0;

    const elements = {
      previewCanvas: document.querySelector("#previewCanvas"),
      previewSiteTitle: document.querySelector("#previewSiteTitle"),
      previewSiteDescription: document.querySelector("#previewSiteDescription"),
      previewCreatorName: document.querySelector("#previewCreatorName"),
      previewCreatorHandle: document.querySelector("#previewCreatorHandle"),
      previewCreatorBio: document.querySelector("#previewCreatorBio"),
      previewCreatorLinks: document.querySelector("#previewCreatorLinks"),
      previewAvatarImage: document.querySelector("#previewAvatarImage"),
      previewAvatarFallback: document.querySelector("#previewAvatarFallback"),
      previewProfileBackgroundImage: document.querySelector("#previewProfileBackgroundImage"),
      previewCharacterCount: document.querySelector("#previewCharacterCount"),
      previewWorldCount: document.querySelector("#previewWorldCount"),
      previewGenreCount: document.querySelector("#previewGenreCount"),
      previewFeaturedSection: document.querySelector("#previewFeaturedSection"),
      previewFeaturedGrid: document.querySelector("#previewFeaturedGrid"),
      previewWorldGrid: document.querySelector("#previewWorldGrid"),
      previewWorldEmpty: document.querySelector("#previewWorldEmpty"),
      previewWorldToggleWrap: document.querySelector("#previewWorldToggleWrap"),
      previewWorldToggle: document.querySelector("#previewWorldToggle"),
      previewCharacterGrid: document.querySelector("#previewCharacterGrid"),
      previewCharacterEmpty: document.querySelector("#previewCharacterEmpty"),
      previewCharacterResultSummary: document.querySelector("#previewCharacterResultSummary"),
      previewCharacterToggleWrap: document.querySelector("#previewCharacterToggleWrap"),
      previewCharacterToggle: document.querySelector("#previewCharacterToggle"),
      previewCharacterSearchInput: document.querySelector("#previewCharacterSearchInput"),
      previewGenreFilters: document.querySelector("#previewGenreFilters"),
      previewTagFilters: document.querySelector("#previewTagFilters"),
      previewPlatformFilters: document.querySelector("#previewPlatformFilters"),
      previewWorldFilters: document.querySelector("#previewWorldFilters"),
      previewCharacterResetFilters: document.querySelector("#previewCharacterResetFilters"),
      filterPicker: document.querySelector("#previewCharacterFilterPicker"),
      filterPickerTitle: document.querySelector("#previewCharacterFilterPickerTitle"),
      filterPickerClose: document.querySelector("#previewCharacterFilterPickerClose"),
      filterPickerSearch: document.querySelector("#previewCharacterFilterPickerSearch"),
      filterPickerOptions: document.querySelector("#previewCharacterFilterPickerOptions"),
      filterPickerEmpty: document.querySelector("#previewCharacterFilterPickerEmpty"),
      characterModal: document.querySelector("#characterPreviewModal"),
      characterModalClose: document.querySelector("#characterPreviewModalClose"),
      characterModalTitle: document.querySelector("#characterPreviewModalTitle"),
      characterModalSummary: document.querySelector("#characterPreviewModalSummary"),
      characterMainImage: document.querySelector("#characterPreviewMainImage"),
      characterMainImageFallback: document.querySelector("#characterPreviewMainImageFallback"),
      characterThumbnails: document.querySelector("#characterPreviewThumbnails"),
      characterPlatforms: document.querySelector("#characterPreviewPlatforms"),
      characterKicker: document.querySelector("#characterPreviewKicker"),
      characterTags: document.querySelector("#characterPreviewModalTags"),
      characterSoundtrack: document.querySelector("#characterPreviewSoundtrack"),
      characterDescription: document.querySelector("#characterPreviewModalDescription"),
      characterWorldPanel: document.querySelector("#characterPreviewWorldPanel"),
      characterWorldButton: document.querySelector("#characterPreviewWorldButton"),
      characterWorldName: document.querySelector("#characterPreviewWorldName"),
      characterWorldSummary: document.querySelector("#characterPreviewWorldSummary"),
      characterContentSection: document.querySelector("#characterPreviewContentSection"),
      characterContents: document.querySelector("#characterPreviewContents"),
      worldModal: document.querySelector("#worldPreviewModal"),
      worldModalClose: document.querySelector("#worldPreviewModalClose"),
      worldModalImage: document.querySelector("#worldPreviewModalImage"),
      worldModalImageFallback: document.querySelector("#worldPreviewModalImageFallback"),
      worldModalTitle: document.querySelector("#worldPreviewModalTitle"),
      worldModalSummary: document.querySelector("#worldPreviewModalSummary"),
      worldModalTags: document.querySelector("#worldPreviewModalTags"),
      worldSoundtrack: document.querySelector("#worldPreviewSoundtrack"),
      worldModalDescription: document.querySelector("#worldPreviewModalDescription"),
      worldModalSections: document.querySelector("#worldPreviewModalSections"),
      worldCharacterSection: document.querySelector("#worldPreviewCharacterSection"),
      worldCharacterList: document.querySelector("#worldPreviewCharacterList")
    };

    function escapeHtml(value) {
      return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function normalizeUrl(value) {
      const source = String(value || "").trim();
      if (!source) return "";
      try {
        const url = new URL(source, window.location.href);
        return ["http:", "https:"].includes(url.protocol) ? url.href : "";
      } catch {
        return "";
      }
    }

    function genreLabel(id) {
      return genreCatalog.get(id)?.name || id;
    }

    function charactersInWorld(worldId) {
      return (project.characters || []).filter(
        (character) => character.worldId === worldId
      );
    }

    function characterImageUrl(character, index = 0) {
      return Array.isArray(character?.images)
        ? String(character.images[index] || "")
        : "";
    }

    function worldImageUrl(world) {
      return String(world?.image || "");
    }

    function youtubeVideoId(value) {
      const source = String(value || "").trim();
      if (!source) return "";
      try {
        const url = new URL(source);
        const host = url.hostname.replace(/^www\./, "").toLowerCase();
        if (host === "youtu.be") {
          return url.pathname.split("/").filter(Boolean)[0] || "";
        }
        if (["youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com"].includes(host)) {
          if (url.pathname === "/watch") return url.searchParams.get("v") || "";
          const parts = url.pathname.split("/").filter(Boolean);
          if (["embed", "shorts", "live"].includes(parts[0])) {
            return parts[1] || "";
          }
        }
      } catch {
        return "";
      }
      return "";
    }

    function youtubeEmbedUrl(value) {
      const id = youtubeVideoId(value);
      return id
        ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&modestbranding=1`
        : "";
    }

    function playableMusicTracks(owner) {
      return (owner?.music || []).filter((track) =>
        track.type === "mp3"
          ? Boolean(String(track.file || ""))
          : Boolean(youtubeVideoId(track.url))
      );
    }

    function hasPlayableMusic(owner) {
      return playableMusicTracks(owner).length > 0;
    }

    function musicTitle(track, index) {
      return String(track?.title || "").trim() ||
        `Track ${String(index + 1).padStart(2, "0")}`;
    }

    function soundtrackPlayerMarkup(track, index) {
      const title = musicTitle(track, index);
      if (track.type === "mp3") {
        return `
          <div class="soundtrack-now-playing">
            <span class="soundtrack-disc" aria-hidden="true">♫</span>
            <span><small>NOW PLAYING</small><strong>${escapeHtml(title)}</strong></span>
          </div>
          <audio
            class="soundtrack-audio"
            controls
            controlslist="nodownload noplaybackrate"
            disablepictureinpicture
            preload="metadata"
            src="${escapeHtml(track.file)}"
          ></audio>
        `;
      }
      return `
        <div class="soundtrack-now-playing">
          <span class="soundtrack-disc" aria-hidden="true">♫</span>
          <span><small>NOW PLAYING · YOUTUBE</small><strong>${escapeHtml(title)}</strong></span>
        </div>
        <div class="soundtrack-youtube">
          <iframe
            src="${escapeHtml(youtubeEmbedUrl(track.url))}"
            title="${escapeHtml(title)}"
            loading="lazy"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            referrerpolicy="strict-origin-when-cross-origin"
            allowfullscreen
          ></iframe>
        </div>
      `;
    }

    function renderSoundtrack(section, owner, activeIndex = 0) {
      const tracks = playableMusicTracks(owner);
      section.hidden = tracks.length === 0;
      if (tracks.length === 0) {
        section.innerHTML = "";
        return;
      }
      const safeIndex = Math.min(
        Math.max(Number(activeIndex) || 0, 0),
        tracks.length - 1
      );
      section.dataset.soundtrackOwner = owner.id;
      section.dataset.soundtrackActive = String(safeIndex);
      const options = tracks.map((track, index) => `
        <option value="${index}" ${index === safeIndex ? "selected" : ""}>
          ${String(index + 1).padStart(2, "0")} · ${escapeHtml(musicTitle(track, index))} · ${track.type === "mp3" ? "MP3" : "YouTube"}
        </option>
      `).join("");
      section.innerHTML = `
        <header class="soundtrack-heading">
          <span><small>SOUNDTRACK</small><strong>이 이야기의 음악</strong></span>
          <b aria-hidden="true">♫</b>
        </header>
        <div class="soundtrack-player">
          ${soundtrackPlayerMarkup(tracks[safeIndex], safeIndex)}
        </div>
        ${tracks.length > 1 ? `
          <label class="soundtrack-track-selector">
            <span>TRACK LIST</span>
            <select data-soundtrack-select>${options}</select>
          </label>
        ` : ""}
      `;
    }

    function stopSoundtrack(section) {
      const audio = section.querySelector("audio");
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      const frame = section.querySelector("iframe");
      if (frame) frame.src = "about:blank";
    }

    function applyTheme() {
      const theme = String(project.site?.themeColor || "#a897ff");
      const text = String(project.site?.textColor || "#f4f1ea");
      const hex = theme.replace("#", "");
      const red = Number.parseInt(hex.slice(0, 2), 16) || 0;
      const green = Number.parseInt(hex.slice(2, 4), 16) || 0;
      const blue = Number.parseInt(hex.slice(4, 6), 16) || 0;
      const ink = (0.299 * red + 0.587 * green + 0.114 * blue) / 255 > 0.58
        ? "#15190a"
        : "#ffffff";
      const targets = [
        document.body,
        elements.previewCanvas,
        elements.filterPicker,
        elements.characterModal,
        elements.worldModal
      ];
      targets.forEach((target) => {
        if (!target) return;
        target.style.setProperty("--text", text);
        target.style.setProperty("--muted", `color-mix(in srgb, ${theme} 28%, #aaa8b4)`);
        target.style.setProperty("--theme", theme);
        target.style.setProperty("--violet", theme);
        target.style.setProperty("--accent", theme);
        target.style.setProperty("--accent-ink", ink);
        target.style.setProperty("--bg", `color-mix(in srgb, ${theme} 14%, #08080d)`);
        target.style.setProperty("--surface", `color-mix(in srgb, ${theme} 20%, #101018)`);
        target.style.setProperty("--surface-2", `color-mix(in srgb, ${theme} 27%, #151520)`);
        target.style.setProperty("--surface-3", `color-mix(in srgb, ${theme} 35%, #1b1b29)`);
        target.style.setProperty("--line", `color-mix(in srgb, ${theme} 40%, rgba(255,255,255,.08))`);
        target.style.setProperty("--line-strong", `color-mix(in srgb, ${theme} 64%, rgba(255,255,255,.14))`);
        target.style.setProperty("--shadow", `0 24px 80px color-mix(in srgb, ${theme} 30%, rgba(0,0,0,.66))`);
      });
    }

    function renderProfile() {
      const creator = project.creator || {};
      elements.previewSiteTitle.textContent = project.site?.title || "사이트 제목";
      elements.previewSiteDescription.textContent = project.site?.description || "";
      elements.previewCreatorName.textContent = creator.name || "제작자 이름";
      elements.previewCreatorHandle.textContent = creator.handle || "";
      elements.previewCreatorBio.innerHTML = (creator.bio || [])
        .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
        .join("");

      const avatar = String(creator.avatar || "");
      elements.previewAvatarImage.hidden = !avatar;
      elements.previewAvatarFallback.hidden = Boolean(avatar);
      if (avatar) {
        elements.previewAvatarImage.src = avatar;
        elements.previewAvatarImage.alt = "";
      } else {
        elements.previewAvatarImage.removeAttribute("src");
        elements.previewAvatarFallback.textContent = creator.fallbackText || "✦";
      }

      const background = String(creator.background || "");
      elements.previewProfileBackgroundImage.hidden = !background;
      if (background) elements.previewProfileBackgroundImage.src = background;
      else elements.previewProfileBackgroundImage.removeAttribute("src");

      elements.previewCreatorLinks.innerHTML = (creator.links || []).map((link) => {
        const service = serviceCatalog.get(link.id) || {
          id: link.id,
          name: link.id,
          icon: ""
        };
        const href = normalizeUrl(link.url);
        if (!href) return "";
        const content = service.icon
          ? `<img src="${escapeHtml(service.icon)}" alt="${escapeHtml(service.name || link.id)}">`
          : `<span>${escapeHtml(String(service.name || link.id).slice(0, 1))}</span>`;
        return `<a class="preview-social-link" href="${escapeHtml(href)}" target="_blank" rel="noreferrer" title="${escapeHtml(service.name || link.id)}">${content}</a>`;
      }).join("");

      const genres = new Set(
        (project.characters || []).flatMap((character) => character.genres || [])
      );
      elements.previewCharacterCount.textContent = (project.characters || []).length;
      elements.previewWorldCount.textContent = (project.worlds || []).length;
      elements.previewGenreCount.textContent = genres.size;
    }

    function platformDots(character) {
      return (character.platforms || []).map((link) => {
        const platform = platformCatalog.get(link.id) || {
          id: link.id,
          name: link.id,
          icon: ""
        };
        return platform.icon
          ? `<span class="character-preview-platform-dot" title="${escapeHtml(platform.name || link.id)}"><img src="${escapeHtml(platform.icon)}" alt=""></span>`
          : `<span class="character-preview-platform-dot" title="${escapeHtml(platform.name || link.id)}">${escapeHtml(String(platform.name || link.id).slice(0, 1))}</span>`;
      }).join("");
    }

    function characterCardMarkup(character, featured = false) {
      const imageUrl = characterImageUrl(character);
      const image = imageUrl
        ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(character.name || "캐릭터")} 대표 이미지" loading="lazy">`
        : '<span class="character-preview-card-image-fallback">CHARACTER</span>';
      const genres = (character.genres || []).slice(0, 2)
        .map((id) => `<span>${escapeHtml(genreLabel(id))}</span>`)
        .join("");
      return `
        <article class="character-preview-card ${featured ? "is-featured" : ""}">
          <button type="button" class="character-preview-card-button" data-preview-character="${escapeHtml(character.id)}">
            <div class="character-preview-card-image-wrap">
              ${image}
              <div class="character-preview-card-platforms">${platformDots(character)}</div>
              ${hasPlayableMusic(character) ? '<span class="archive-music-mark" title="음악 있음" aria-hidden="true">♫</span>' : ""}
            </div>
            <div class="character-preview-card-body">
              <div class="character-preview-card-genres">${genres}</div>
              <h3>${escapeHtml(character.name || "이름 없는 캐릭터")}</h3>
              <p>${escapeHtml(character.subtitle || "")}</p>
              <span class="character-preview-card-more">상세 보기 <b aria-hidden="true">↗</b></span>
            </div>
          </button>
        </article>
      `;
    }

    function worldCardMarkup(world) {
      const related = charactersInWorld(world.id);
      const tags = (world.tags || []).slice(0, 3)
        .map((tag) => `<span>${escapeHtml(tag)}</span>`)
        .join("");
      const faces = related.slice(0, 4).map((character) => {
        const image = characterImageUrl(character);
        const face = image
          ? `<img src="${escapeHtml(image)}" alt="" loading="lazy">`
          : escapeHtml(String(character.name || "?").slice(0, 1));
        return `<span class="world-face" title="${escapeHtml(character.name || "캐릭터")}">${face}</span>`;
      }).join("");
      const cover = worldImageUrl(world)
        ? `<img src="${escapeHtml(worldImageUrl(world))}" alt="" loading="lazy">`
        : '<span class="world-card-image-fallback">WORLD ARCHIVE</span>';
      return `
        <article class="world-card">
          <button class="world-card-button" type="button" data-preview-world="${escapeHtml(world.id)}">
            <div class="world-card-image">
              ${cover}
              <div class="world-face-stack" aria-label="연결된 캐릭터">${faces}</div>
              ${hasPlayableMusic(world) ? '<span class="archive-music-mark" title="음악 있음" aria-hidden="true">♫</span>' : ""}
            </div>
            <div class="world-card-body">
              <div class="world-card-meta"><span>${related.length} Characters</span><b aria-hidden="true">↗</b></div>
              <h3>${escapeHtml(world.name || "이름 없는 세계관")}</h3>
              <p>${escapeHtml(world.subtitle || "")}</p>
              <div class="world-card-tags">${tags}</div>
            </div>
          </button>
        </article>
      `;
    }

    function renderFeatured() {
      const featured = [
        ...(project.characters || []).filter((character) => character.featured),
        ...(project.characters || []).filter((character) => !character.featured)
      ].filter((character, index, list) =>
        list.findIndex((item) => item.id === character.id) === index
      ).slice(0, 3);
      elements.previewFeaturedSection.hidden = featured.length === 0;
      elements.previewFeaturedGrid.innerHTML = featured
        .map((character) => characterCardMarkup(character, true))
        .join("");
    }

    function worldColumnCount() {
      const template = getComputedStyle(elements.previewWorldGrid).gridTemplateColumns;
      return !template || template === "none"
        ? 1
        : Math.max(1, template.split(/\s+/).filter(Boolean).length);
    }

    function updateWorldLimit() {
      const cards = [...elements.previewWorldGrid.children];
      const visibleLimit = worldColumnCount();
      const canCollapse = cards.length > visibleLimit;
      const expanded = worldExpanded || !canCollapse;
      cards.forEach((card, index) => {
        card.hidden = !expanded && index >= visibleLimit;
      });
      elements.previewWorldToggleWrap.hidden = !canCollapse;
      elements.previewWorldToggle.classList.toggle("is-expanded", expanded);
      elements.previewWorldToggle.setAttribute("aria-expanded", String(expanded));
      const label = elements.previewWorldToggle.querySelector("span");
      if (label) {
        label.textContent = expanded
          ? "세계관 접기"
          : `세계관 더보기 +${Math.max(0, cards.length - visibleLimit)}`;
      }
    }

    function renderWorlds() {
      const worlds = project.worlds || [];
      elements.previewWorldGrid.hidden = worlds.length === 0;
      elements.previewWorldEmpty.hidden = worlds.length > 0;
      elements.previewWorldGrid.innerHTML = worlds.map(worldCardMarkup).join("");
      if (worlds.length === 0) worldExpanded = false;
      updateWorldLimit();
    }

    function usageEntries(values) {
      const counts = new Map();
      values.forEach((value) => {
        const normalized = String(value || "").trim();
        if (!normalized) return;
        counts.set(normalized, (counts.get(normalized) || 0) + 1);
      });
      return [...counts.entries()].sort(
        (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko")
      );
    }

    function filterOptions(group) {
      const all = {
        label: "전체",
        value: "전체",
        count: (project.characters || []).length
      };
      if (group === "genre") {
        return [all, ...usageEntries(
          (project.characters || []).flatMap((character) => character.genres || [])
        ).map(([id, count]) => ({ label: genreLabel(id), value: id, count }))];
      }
      if (group === "tag") {
        return [all, ...usageEntries(
          (project.characters || []).flatMap((character) => character.tags || [])
        ).map(([tag, count]) => ({ label: tag, value: tag, count }))];
      }
      if (group === "platform") {
        return [all, ...usageEntries(
          (project.characters || []).flatMap((character) =>
            (character.platforms || []).map((link) => link.id)
          )
        ).map(([id, count]) => ({
          label: platformCatalog.get(id)?.name || id,
          value: id,
          count
        }))];
      }
      const worldUsage = usageEntries(
        (project.characters || []).map((character) => character.worldId).filter(Boolean)
      );
      const worlds = worldUsage.map(([id, count]) => {
        const world = (project.worlds || []).find((item) => item.id === id);
        return world ? { label: world.name || "이름 없는 세계관", value: id, count } : null;
      }).filter(Boolean);
      const independentCount = (project.characters || []).filter(
        (character) => !character.worldId
      ).length;
      if (independentCount > 0) {
        worlds.push({
          label: "독립 캐릭터",
          value: "__independent__",
          count: independentCount
        });
      }
      return [all, ...worlds];
    }

    function selectedFilters(group) {
      return filterState[group];
    }

    function isSelected(group, value) {
      return value === "전체"
        ? selectedFilters(group).size === 0
        : selectedFilters(group).has(value);
    }

    function filterButton(option, group, picker = false) {
      const active = isSelected(group, option.value);
      return `
        <button
          class="filter-chip ${picker ? "filter-chip--picker" : ""} ${active ? "active" : ""}"
          type="button"
          aria-pressed="${active}"
          data-character-filter-group="${group}"
          data-character-filter-value="${escapeHtml(option.value)}"
          data-character-filter-selected="${active}"
        >
          <span>${escapeHtml(option.label)}</span>
          ${picker ? `<small>${option.count}</small>` : ""}
        </button>
      `;
    }

    function scheduleFilterFit() {
      cancelAnimationFrame(filterFitFrame);
      filterFitFrame = requestAnimationFrame(() => {
        [
          elements.previewGenreFilters,
          elements.previewTagFilters,
          elements.previewPlatformFilters,
          elements.previewWorldFilters
        ].forEach(fitFilterRow);
      });
    }

    function fitFilterRow(container) {
      if (!container) return;
      const buttons = [...container.querySelectorAll(".filter-chip")];
      const more = container.querySelector("[data-character-filter-more]");
      if (!buttons.length || !more) return;
      buttons.forEach((button) => button.hidden = false);
      more.hidden = true;
      const available = container.clientWidth;
      if (available <= 0) return;
      const style = getComputedStyle(container);
      const gap = Number.parseFloat(style.columnGap || style.gap || "0") || 0;
      const fullWidth = buttons.reduce(
        (total, button, index) => total + button.offsetWidth + (index ? gap : 0),
        0
      );
      if (fullWidth <= available + 0.5) return;
      const allButton = buttons[0];
      const selected = buttons.slice(1).filter(
        (button) => button.dataset.characterFilterSelected === "true"
      );
      const ordinary = buttons.slice(1).filter(
        (button) => button.dataset.characterFilterSelected !== "true"
      );
      more.hidden = false;
      let used = allButton.offsetWidth;
      selected.forEach((button) => used += gap + button.offsetWidth);
      let hiddenCount = 0;
      ordinary.forEach((button) => {
        const required = used + gap + button.offsetWidth + gap + more.offsetWidth;
        if (required <= available + 0.5) used += gap + button.offsetWidth;
        else {
          button.hidden = true;
          hiddenCount += 1;
        }
      });
      more.hidden = hiddenCount === 0;
      const count = more.querySelector("b");
      if (count) count.textContent = `+${hiddenCount}`;
    }

    function renderFilterRow(container, group) {
      const options = filterOptions(group);
      const all = options[0];
      const remaining = options.slice(1);
      const selected = selectedFilters(group);
      const ordered = [
        ...remaining.filter((option) => selected.has(option.value)),
        ...remaining.filter((option) => !selected.has(option.value))
      ];
      container.innerHTML = [all, ...ordered].map(
        (option) => filterButton(option, group)
      ).join("") + `
        <button class="filter-more" type="button" data-character-filter-more="${group}" aria-haspopup="dialog" hidden>
          더보기 <b>+0</b>
        </button>
      `;
    }

    function renderFilters() {
      renderFilterRow(elements.previewGenreFilters, "genre");
      renderFilterRow(elements.previewTagFilters, "tag");
      renderFilterRow(elements.previewPlatformFilters, "platform");
      renderFilterRow(elements.previewWorldFilters, "world");
      scheduleFilterFit();
    }

    function toggleFilter(group, value) {
      const selected = selectedFilters(group);
      if (!selected) return;
      if (value === "전체") selected.clear();
      else if (selected.has(value)) selected.delete(value);
      else selected.add(value);
      renderFilters();
      renderCharacters();
      if (elements.filterPicker.open) renderFilterPicker();
    }

    function hasActiveFilters() {
      return Boolean(
        filterState.query.trim() ||
        filterState.genre.size ||
        filterState.tag.size ||
        filterState.platform.size ||
        filterState.world.size
      );
    }

    function filteredCharacters() {
      const query = filterState.query.trim().toLocaleLowerCase("ko");
      return (project.characters || []).filter((character) => {
        const world = (project.worlds || []).find(
          (item) => item.id === character.worldId
        );
        const searchable = [
          character.name,
          character.subtitle,
          ...(character.description || []),
          ...(character.genres || []).map(genreLabel),
          ...(character.tags || []),
          ...(character.platforms || []).map((link) =>
            platformCatalog.get(link.id)?.name || link.id
          ),
          world?.name || "",
          world?.subtitle || "",
          ...(world?.tags || [])
        ].join(" ").toLocaleLowerCase("ko");
        const queryMatch = !query || searchable.includes(query);
        const genreMatch = !filterState.genre.size ||
          (character.genres || []).some((value) => filterState.genre.has(value));
        const tagMatch = !filterState.tag.size ||
          (character.tags || []).some((value) => filterState.tag.has(value));
        const platformMatch = !filterState.platform.size ||
          (character.platforms || []).some((link) => filterState.platform.has(link.id));
        const worldMatch = !filterState.world.size ||
          [...filterState.world].some((worldId) =>
            worldId === "__independent__" ? !character.worldId : character.worldId === worldId
          );
        return queryMatch && genreMatch && tagMatch && platformMatch && worldMatch;
      });
    }

    function characterColumnCount() {
      const template = getComputedStyle(elements.previewCharacterGrid).gridTemplateColumns;
      return !template || template === "none"
        ? 1
        : Math.max(1, template.split(/\s+/).filter(Boolean).length);
    }

    function updateCharacterLimit() {
      const cards = [...elements.previewCharacterGrid.children];
      const visibleLimit = characterColumnCount() * 2;
      const forceExpanded = hasActiveFilters();
      const canCollapse = !forceExpanded && cards.length > visibleLimit;
      const expanded = forceExpanded || characterExpanded || !canCollapse;
      cards.forEach((card, index) => {
        card.hidden = !expanded && index >= visibleLimit;
      });
      elements.previewCharacterToggleWrap.hidden = !canCollapse;
      elements.previewCharacterToggle.classList.toggle("is-expanded", expanded);
      elements.previewCharacterToggle.setAttribute("aria-expanded", String(expanded));
      const label = elements.previewCharacterToggle.querySelector("span");
      if (label) {
        label.textContent = expanded
          ? "캐릭터 접기"
          : `캐릭터 더보기 +${Math.max(0, cards.length - visibleLimit)}`;
      }
    }

    function renderCharacters() {
      const characters = filteredCharacters();
      const hasCharacters = characters.length > 0;
      elements.previewCharacterGrid.innerHTML = characters
        .map((character) => characterCardMarkup(character))
        .join("");
      elements.previewCharacterGrid.hidden = !hasCharacters;
      elements.previewCharacterEmpty.hidden = hasCharacters;
      elements.previewCharacterResultSummary.textContent =
        `총 ${(project.characters || []).length}명 중 ${characters.length}명 표시`;
      updateCharacterLimit();
    }

    function filterPickerLabel(group) {
      if (group === "genre") return "장르 선택";
      if (group === "tag") return "태그 선택";
      if (group === "platform") return "플랫폼 선택";
      return "세계관 선택";
    }

    function renderFilterPicker() {
      if (!activeFilterPickerGroup) return;
      const query = filterPickerQuery.trim().toLocaleLowerCase("ko");
      const options = filterOptions(activeFilterPickerGroup).filter(
        (option) => !query || option.label.toLocaleLowerCase("ko").includes(query)
      );
      elements.filterPickerOptions.innerHTML = options
        .map((option) => filterButton(option, activeFilterPickerGroup, true))
        .join("");
      elements.filterPickerEmpty.hidden = options.length > 0;
    }

    function openFilterPicker(group) {
      activeFilterPickerGroup = group;
      filterPickerQuery = "";
      const label = filterPickerLabel(group);
      elements.filterPickerTitle.textContent = label;
      elements.filterPickerSearch.value = "";
      elements.filterPickerSearch.placeholder = `${label.replace(" 선택", "")} 검색`;
      renderFilterPicker();
      elements.filterPicker.showModal();
      document.body.classList.add("character-filter-picker-open");
    }

    function closeFilterPicker() {
      if (elements.filterPicker.open) elements.filterPicker.close();
      activeFilterPickerGroup = null;
      filterPickerQuery = "";
      document.body.classList.remove("character-filter-picker-open");
    }

    function characterContentMarkup(item) {
      const type = item.type || (item.spoiler ? "스포일러" : "추가 정보");
      const title = item.title || "제목 없는 콘텐츠";
      const body = (item.content || []).map(
        (paragraph) => `<p>${escapeHtml(paragraph)}</p>`
      ).join("");
      if (item.spoiler) {
        return `
          <details class="character-preview-content-box is-spoiler">
            <summary>
              <span class="character-preview-content-icon">⚠</span>
              <span><small>${escapeHtml(type)}</small><strong>${escapeHtml(title)}</strong><em>${escapeHtml(item.warning || "스포일러가 포함되어 있습니다.")}</em></span>
              <b aria-hidden="true">⌄</b>
            </summary>
            <div class="character-preview-content-body">${body}</div>
          </details>
        `;
      }
      return `
        <article class="character-preview-content-box is-public">
          <header><span class="character-preview-content-icon">✦</span><span><small>${escapeHtml(type)}</small><strong>${escapeHtml(title)}</strong></span></header>
          <div class="character-preview-content-body">${body}</div>
        </article>
      `;
    }

    function closeCharacterModal() {
      stopSoundtrack(elements.characterSoundtrack);
      if (elements.characterModal.open) elements.characterModal.close();
      document.body.classList.remove("character-preview-modal-open");
    }

    function openCharacter(character) {
      if (!character) return;
      if (elements.worldModal.open) closeWorldModal();
      const images = (character.images || []).slice(0, 5).filter(Boolean);
      const main = images[0] || "";
      elements.characterModalTitle.textContent = character.name || "이름 없는 캐릭터";
      elements.characterModalSummary.textContent = character.subtitle || "";
      elements.characterModalSummary.hidden = !character.subtitle;
      elements.characterMainImage.hidden = !main;
      elements.characterMainImageFallback.hidden = Boolean(main);
      if (main) {
        elements.characterMainImage.src = main;
        elements.characterMainImage.alt = `${character.name || "캐릭터"} 이미지 1`;
      } else {
        elements.characterMainImage.removeAttribute("src");
      }
      elements.characterThumbnails.hidden = images.length <= 1;
      elements.characterThumbnails.innerHTML = images.length > 1
        ? images.map((url, index) => `
            <button type="button" class="character-preview-thumbnail ${index === 0 ? "is-active" : ""}" data-character-preview-image="${escapeHtml(url)}" data-character-preview-alt="${escapeHtml(`${character.name || "캐릭터"} 이미지 ${index + 1}`)}">
              <img src="${escapeHtml(url)}" alt="">
            </button>
          `).join("")
        : "";
      const genres = (character.genres || []).map(genreLabel);
      elements.characterKicker.textContent = genres.join(" · ") || "CHARACTER";
      elements.characterTags.innerHTML = [...genres, ...(character.tags || [])]
        .map((tag) => `<span>${escapeHtml(tag)}</span>`)
        .join("");
      elements.characterTags.hidden = !genres.length && !(character.tags || []).length;
      renderSoundtrack(elements.characterSoundtrack, character);
      elements.characterDescription.innerHTML = (character.description || [])
        .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
        .join("");
      elements.characterDescription.hidden = !(character.description || []).length;
      elements.characterPlatforms.innerHTML = (character.platforms || []).map((link) => {
        const platform = platformCatalog.get(link.id) || {
          id: link.id,
          name: link.id,
          icon: ""
        };
        const content = platform.icon
          ? `<img src="${escapeHtml(platform.icon)}" alt=""><span class="sr-only">${escapeHtml(platform.name || link.id)}</span>`
          : `<span>${escapeHtml(String(platform.name || link.id).slice(0, 1))}</span>`;
        const href = normalizeUrl(link.url);
        return href
          ? `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer" title="${escapeHtml(platform.name || link.id)}">${content}</a>`
          : `<span class="is-disabled" title="${escapeHtml(platform.name || link.id)}">${content}</span>`;
      }).join("");
      elements.characterPlatforms.hidden = !(character.platforms || []).length;
      const world = (project.worlds || []).find((item) => item.id === character.worldId);
      elements.characterWorldPanel.hidden = !world;
      if (world) {
        elements.characterWorldButton.dataset.previewWorld = world.id;
        elements.characterWorldName.textContent = world.name || "이름 없는 세계관";
        elements.characterWorldSummary.textContent = world.subtitle || "";
      } else {
        delete elements.characterWorldButton.dataset.previewWorld;
      }
      elements.characterContentSection.hidden = !(character.contents || []).length;
      elements.characterContents.innerHTML = (character.contents || [])
        .map(characterContentMarkup)
        .join("");
      elements.characterModal.showModal();
      document.body.classList.add("character-preview-modal-open");
    }

    function worldInfoMarkup(section) {
      const title = escapeHtml(section.title || "세계관 정보");
      const content = (section.content || []).map(
        (paragraph) => `<p>${escapeHtml(paragraph)}</p>`
      ).join("");
      return section.collapsible
        ? `<details class="world-info-block world-info-block-collapsible"><summary>${title}</summary><div class="world-info-block-content">${content}</div></details>`
        : `<article class="world-info-block"><h3>${title}</h3><div>${content}</div></article>`;
    }

    function closeWorldModal() {
      stopSoundtrack(elements.worldSoundtrack);
      if (elements.worldModal.open) elements.worldModal.close();
      document.body.classList.remove("world-preview-modal-open");
    }

    function openWorld(world) {
      if (!world) return;
      if (elements.characterModal.open) closeCharacterModal();
      const image = worldImageUrl(world);
      elements.worldModalImage.hidden = !image;
      elements.worldModalImageFallback.hidden = Boolean(image);
      if (image) {
        elements.worldModalImage.src = image;
        elements.worldModalImage.alt = `${world.name || "세계관"} 대표 이미지`;
      } else {
        elements.worldModalImage.removeAttribute("src");
      }
      elements.worldModalTitle.textContent = world.name || "이름 없는 세계관";
      elements.worldModalSummary.textContent = world.subtitle || "";
      elements.worldModalSummary.hidden = !world.subtitle;
      elements.worldModalTags.innerHTML = (world.tags || [])
        .map((tag) => `<span>${escapeHtml(tag)}</span>`)
        .join("");
      elements.worldModalTags.hidden = !(world.tags || []).length;
      renderSoundtrack(elements.worldSoundtrack, world);
      elements.worldModalDescription.innerHTML = (world.description || [])
        .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
        .join("");
      elements.worldModalDescription.hidden = !(world.description || []).length;
      elements.worldModalSections.innerHTML = (world.sections || [])
        .map(worldInfoMarkup)
        .join("");
      elements.worldModalSections.hidden = !(world.sections || []).length;
      const related = charactersInWorld(world.id);
      elements.worldCharacterSection.hidden = related.length === 0;
      elements.worldCharacterList.innerHTML = related.map((character) => {
        const image = characterImageUrl(character);
        const face = image
          ? `<img src="${escapeHtml(image)}" alt="">`
          : `<span class="world-character-face-fallback">${escapeHtml(String(character.name || "?").slice(0, 1))}</span>`;
        return `<button class="world-character-button" type="button" data-preview-character="${escapeHtml(character.id)}">${face}<span><strong>${escapeHtml(character.name || "이름 없는 캐릭터")}</strong><small>${escapeHtml(character.subtitle || "")}</small></span></button>`;
      }).join("");
      elements.worldModal.showModal();
      document.body.classList.add("world-preview-modal-open");
    }

    function resetFilters() {
      filterState.query = "";
      filterState.genre.clear();
      filterState.tag.clear();
      filterState.platform.clear();
      filterState.world.clear();
      elements.previewCharacterSearchInput.value = "";
      renderFilters();
      renderCharacters();
    }

    function bindEvents() {
      document.addEventListener("click", (event) => {
        const characterButton = event.target.closest("[data-preview-character]");
        if (characterButton) {
          const character = (project.characters || []).find(
            (item) => item.id === characterButton.dataset.previewCharacter
          );
          openCharacter(character);
          return;
        }
        const worldButton = event.target.closest("[data-preview-world]");
        if (worldButton) {
          const world = (project.worlds || []).find(
            (item) => item.id === worldButton.dataset.previewWorld
          );
          openWorld(world);
          return;
        }
        const thumbnail = event.target.closest("[data-character-preview-image]");
        if (thumbnail) {
          elements.characterMainImage.src = thumbnail.dataset.characterPreviewImage;
          elements.characterMainImage.alt = thumbnail.dataset.characterPreviewAlt || "";
          elements.characterThumbnails.querySelectorAll(".character-preview-thumbnail")
            .forEach((button) => button.classList.toggle("is-active", button === thumbnail));
          return;
        }
        const filterButton = event.target.closest("[data-character-filter-group]");
        if (filterButton) {
          toggleFilter(
            filterButton.dataset.characterFilterGroup,
            filterButton.dataset.characterFilterValue
          );
          return;
        }
        const more = event.target.closest("[data-character-filter-more]");
        if (more) openFilterPicker(more.dataset.characterFilterMore);
      });

      elements.previewCharacterSearchInput.addEventListener("input", (event) => {
        filterState.query = event.target.value;
        renderCharacters();
      });
      elements.previewCharacterResetFilters.addEventListener("click", resetFilters);
      elements.previewWorldToggle.addEventListener("click", () => {
        worldExpanded = !worldExpanded;
        updateWorldLimit();
      });
      elements.previewCharacterToggle.addEventListener("click", () => {
        characterExpanded = !characterExpanded;
        updateCharacterLimit();
      });
      elements.filterPickerClose.addEventListener("click", closeFilterPicker);
      elements.filterPickerSearch.addEventListener("input", (event) => {
        filterPickerQuery = event.target.value;
        renderFilterPicker();
      });
      elements.characterModalClose.addEventListener("click", closeCharacterModal);
      elements.worldModalClose.addEventListener("click", closeWorldModal);
      elements.characterSoundtrack.addEventListener("change", (event) => {
        const select = event.target.closest("[data-soundtrack-select]");
        if (!select) return;
        const character = (project.characters || []).find(
          (item) => item.id === elements.characterSoundtrack.dataset.soundtrackOwner
        );
        if (!character) return;
        stopSoundtrack(elements.characterSoundtrack);
        renderSoundtrack(elements.characterSoundtrack, character, Number(select.value));
      });
      elements.worldSoundtrack.addEventListener("change", (event) => {
        const select = event.target.closest("[data-soundtrack-select]");
        if (!select) return;
        const world = (project.worlds || []).find(
          (item) => item.id === elements.worldSoundtrack.dataset.soundtrackOwner
        );
        if (!world) return;
        stopSoundtrack(elements.worldSoundtrack);
        renderSoundtrack(elements.worldSoundtrack, world, Number(select.value));
      });
      [elements.characterSoundtrack, elements.worldSoundtrack].forEach((section) => {
        section.addEventListener("contextmenu", (event) => {
          if (event.target.closest("audio")) event.preventDefault();
        });
      });
      elements.filterPicker.addEventListener("close", () => {
        document.body.classList.remove("character-filter-picker-open");
      });
      elements.characterModal.addEventListener("close", () => {
        stopSoundtrack(elements.characterSoundtrack);
        document.body.classList.remove("character-preview-modal-open");
      });
      elements.worldModal.addEventListener("close", () => {
        stopSoundtrack(elements.worldSoundtrack);
        document.body.classList.remove("world-preview-modal-open");
      });
      window.addEventListener("resize", () => {
        updateWorldLimit();
        updateCharacterLimit();
        scheduleFilterFit();
      });
      if (typeof ResizeObserver === "function") {
        const observer = new ResizeObserver(() => scheduleFilterFit());
        [
          elements.previewGenreFilters,
          elements.previewTagFilters,
          elements.previewPlatformFilters,
          elements.previewWorldFilters
        ].forEach((item) => observer.observe(item));
      }
    }

    function init() {
      applyTheme();
      renderProfile();
      renderFeatured();
      renderWorlds();
      renderFilters();
      renderCharacters();
      bindEvents();
      requestAnimationFrame(() => {
        updateWorldLimit();
        updateCharacterLimit();
        scheduleFilterFit();
      });
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
      init();
    }
  })();
