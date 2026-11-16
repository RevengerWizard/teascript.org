(() => {
    const table = document.querySelector('.api-index-table');
    const input = document.querySelector('[data-api-filter]');
    if (!table || !input) return;
    const active = { kind: '', origin: '', tag: '' };
    document.querySelectorAll('.api-index-filter [data-kind], .api-index-filter [data-origin], .api-index-filter [data-tag]').forEach((button) => {
        button.addEventListener('click', (event) => {
            const key = ['kind', 'origin', 'tag'].find((name) => button.dataset[name] !== undefined);
            const value = button.dataset[key];
            active[key] = active[key] === value ? '' : value;
            button.classList.toggle('is-active', !!active[key]);
            event.preventDefault();
            update();
        });
    });
    function update() {
        const query = input.value.trim().toLowerCase();
        table.querySelectorAll('tbody tr').forEach((row) => {
            const matches = (!active.kind || row.dataset.kind === active.kind)
                && (!active.origin || row.dataset.origin === active.origin)
                && (!active.tag || (row.dataset.tags || '').split(/\s+/).includes(active.tag))
                && (!query || row.textContent.toLowerCase().includes(query));
            row.hidden = !matches;
        });
    }
    input.addEventListener('input', update);
})();
