import { useState } from 'preact/hooks';
import { TopBar } from '../components/TopBar';
import { Icon } from '../components/Icon';
import { useT } from '../i18n';
import { createShelf, createTag, removeShelf, removeTag, updateShelf, updateTag, useStore } from '../lib/store';
import { ROUTES } from '../lib/routes';

export function Shelves() {
  const t = useT();
  const { shelves, tags, books } = useStore();
  const [newName, setNewName] = useState('');
  const [newTagName, setNewTagName] = useState('');

  const countOnShelf = (id: string) => books.filter((b) => b.shelfIds.includes(id)).length;
  const countWithTag = (id: string) => books.filter((b) => b.tagIds.includes(id)).length;

  const addShelf = (e: Event) => {
    e.preventDefault();
    if (!newName.trim()) return;
    void createShelf(newName);
    setNewName('');
  };

  const addTag = (e: Event) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    void createTag(newTagName);
    setNewTagName('');
  };

  const rename = (id: string, current: string, kind: 'shelf' | 'tag') => {
    const name = prompt(t('shelves.rename'), current);
    if (!name?.trim() || name === current) return;
    if (kind === 'shelf') {
      const shelf = shelves.find((s) => s.id === id);
      if (shelf) void updateShelf({ ...shelf, name: name.trim() });
    } else {
      const tag = tags.find((x) => x.id === id);
      if (tag) void updateTag({ ...tag, name: name.trim() });
    }
  };

  return (
    <>
      <TopBar title={t('shelves.title')} />
      <main class="page">
        <section class="section">
          <form class="field__row" onSubmit={addShelf}>
            <input
              class="input"
              value={newName}
              placeholder={t('shelves.new')}
              onInput={(e) => setNewName((e.target as HTMLInputElement).value)}
            />
            <button class="btn btn--primary" type="submit" disabled={!newName.trim()}>
              <Icon name="plus" size={18} />
            </button>
          </form>

          {shelves.length === 0 ? (
            <div class="empty">
              <div class="empty__art" aria-hidden="true">🗄️</div>
              <p class="empty__title">{t('shelves.empty.title')}</p>
              <p>{t('shelves.empty.body')}</p>
            </div>
          ) : (
            <ul class="rows">
              {shelves.map((s) => (
                <li key={s.id}>
                  <div class="row">
                    <span class="chip__dot row__icon" style={{ background: s.color }} />
                    <a class="row__label row__link" href={`${ROUTES.library}?shelf=${s.id}`}>
                      {s.name}
                    </a>
                    <span class="row__value">{t('shelves.books', { count: countOnShelf(s.id) })}</span>
                    <button
                      class="row__action"
                      aria-label={t('shelves.rename')}
                      onClick={() => rename(s.id, s.name, 'shelf')}
                    >
                      <Icon name="edit" size={18} />
                    </button>
                    <button
                      class="row__action"
                      aria-label={t('common.delete')}
                      onClick={() => confirm(t('shelves.deleteConfirm', { name: s.name })) && removeShelf(s.id)}
                    >
                      <Icon name="trash" size={18} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section class="section">
          <h2 class="section__title">{t('tags.title')}</h2>
          <form class="field__row" onSubmit={addTag}>
            <input
              class="input"
              value={newTagName}
              placeholder={t('tags.new')}
              onInput={(e) => setNewTagName((e.target as HTMLInputElement).value)}
            />
            <button class="btn btn--primary" type="submit" disabled={!newTagName.trim()}>
              <Icon name="plus" size={18} />
            </button>
          </form>

          {tags.length === 0 ? (
            <p class="hint">{t('tags.empty')}</p>
          ) : (
            <ul class="rows">
              {tags.map((tg) => (
                <li key={tg.id}>
                  <div class="row">
                    <Icon name="tag" size={18} class="row__icon" />
                    <a class="row__label row__link" href={`${ROUTES.library}?tag=${tg.id}`}>
                      {tg.name}
                    </a>
                    <span class="row__value">{t('shelves.books', { count: countWithTag(tg.id) })}</span>
                    <button
                      class="row__action"
                      aria-label={t('shelves.rename')}
                      onClick={() => rename(tg.id, tg.name, 'tag')}
                    >
                      <Icon name="edit" size={18} />
                    </button>
                    <button
                      class="row__action"
                      aria-label={t('common.delete')}
                      onClick={() => confirm(t('shelves.deleteConfirm', { name: tg.name })) && removeTag(tg.id)}
                    >
                      <Icon name="trash" size={18} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
