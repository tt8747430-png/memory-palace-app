/**
 * StationEditorUI — Manages the station editor modal.
 * Extracted from UIController for modularity and lazy-loadability.
 * Uses data-action event delegation instead of window.editStation/deleteStation globals.
 */
export class StationEditorUI {
  constructor({ palaceManager, notificationManager, escapeHtml }) {
    this.palaceManager = palaceManager;
    this.notificationManager = notificationManager;
    this.escapeHtml = escapeHtml;
    this.currentEditId = null;
    this.currentStations = [];
    this.elements = {
      stationList: document.getElementById('stationList'),
      stationForm: document.getElementById('stationForm'),
    };
  }

  open(id) {
    this.currentEditId = id;
    const palace = this.palaceManager.getPalaceById(id);
    if (!palace) return false;

    this.currentStations = [...(palace.detailedStations || [])];
    this._setupDelegation();
    this.renderStationList();
    this.clearStationForm();

    document.getElementById('stationEditorTitle').textContent = `Manage Stations: ${palace.name}`;
    return true;
  }

  close() {
    this.currentStations = [];
    // Abort and clear the delegation listener so it re-registers cleanly on next open
    if (this._delegationAbort) {
      this._delegationAbort.abort();
      this._delegationAbort = null;
    }
  }

  /** Wire up event delegation on the station list using an AbortController signal. */
  _setupDelegation() {
    // Abort any previous listener before attaching a fresh one
    if (this._delegationAbort) {
      this._delegationAbort.abort();
    }
    this._delegationAbort = new AbortController();

    this.elements.stationList.addEventListener(
      'click',
      (e) => {
        const actionEl = e.target.closest('[data-action]');
        if (actionEl?.dataset.action === 'deleteStation') {
          e.stopPropagation();
          this.deleteStation(parseInt(actionEl.dataset.index));
          return;
        }
        const item = e.target.closest('.station-item[data-index]');
        if (item) {
          this.loadStationIntoForm(parseInt(item.dataset.index));
        }
      },
      { signal: this._delegationAbort.signal },
    );
  }

  renderStationList() {
    if (this.currentStations.length === 0) {
      this.elements.stationList.innerHTML =
        '<div class="station-list-empty">No stations yet. Click "Add New Station" to start.</div>';
      return;
    }

    this.elements.stationList.innerHTML = this.currentStations
      .map(
        (station, index) => `
      <div class="station-item" data-index="${index}" role="button" tabindex="0">
        <div>
          <strong>${station.number}.</strong> ${this.escapeHtml(station.title)}
        </div>
        <div class="station-item-actions">
          <button class="station-item-btn" data-action="deleteStation" data-index="${index}"
                  title="Delete" aria-label="Delete station ${station.number}">🗑️</button>
        </div>
      </div>`,
      )
      .join('');
  }

  clearStationForm() {
    this.elements.stationForm.reset();
    document.getElementById('stationIndex').value = '';
    document.getElementById('stationFormTitle').textContent = 'Add New Station';
    document.getElementById('stationTitle').focus();

    const nextNum = this.currentStations.length + 1;
    document.getElementById('stationTitle').value = `${nextNum}. `;
  }

  loadStationIntoForm(index) {
    const station = this.currentStations[index];
    if (!station) return;

    document.getElementById('stationIndex').value = index;
    document.getElementById('stationTitle').value = station.title || '';
    document.getElementById('stationVerses').value = station.verses || '';
    document.getElementById('stationImage').value = station.summary || station.image || '';
    document.getElementById('stationKeywords').value = station.keywords
      ? station.keywords.join(', ')
      : '';

    document.getElementById('stationFormTitle').textContent = `Edit Station #${station.number}`;

    const items = this.elements.stationList.querySelectorAll('.station-item');
    items.forEach((item) => item.classList.remove('active'));
    if (items[index]) items[index].classList.add('active');
  }

  saveStation(renderPalacesFn) {
    const indexStr = document.getElementById('stationIndex').value;
    const isNew = indexStr === '';

    const stationData = {
      title: document.getElementById('stationTitle').value,
      verses: document.getElementById('stationVerses').value,
      image: document.getElementById('stationImage').value,
      keywords: document
        .getElementById('stationKeywords')
        .value.split(',')
        .map((k) => k.trim())
        .filter(Boolean),
    };

    if (isNew) {
      stationData.number = this.currentStations.length + 1;
      this.currentStations.push(stationData);
    } else {
      const index = parseInt(indexStr);
      stationData.number = this.currentStations[index].number;
      this.currentStations[index] = stationData;
    }

    this.palaceManager.updatePalace(this.currentEditId, {
      detailedStations: this.currentStations,
      stations: this.currentStations.length,
    });

    if (this.notificationManager) {
      this.notificationManager.success(isNew ? 'Station added' : 'Station updated');
    }

    this.renderStationList();
    if (isNew) this.clearStationForm();
    renderPalacesFn();
  }

  deleteStation(index) {
    if (this.notificationManager) {
      this.notificationManager.confirm('Delete this station?', () => {
        this._performDelete(index);
      });
    } else if (confirm('Delete this station?')) {
      this._performDelete(index);
    }
  }

  _performDelete(index) {
    this.currentStations.splice(index, 1);
    this.currentStations.forEach((s, i) => (s.number = i + 1));

    this.palaceManager.updatePalace(this.currentEditId, {
      detailedStations: this.currentStations,
      stations: this.currentStations.length,
    });

    if (this.notificationManager) this.notificationManager.success('Station deleted');
    this.renderStationList();
    this.clearStationForm();
  }
}
